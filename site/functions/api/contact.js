// Cloudflare Pages Function：POST /api/contact
// 需要的绑定（在 Pages 项目 Settings 里配置，见 README）：
//   DB               D1 数据库，表结构见 schema.sql
//   TURNSTILE_SECRET Turnstile 密钥
//   WECOM_WEBHOOK    可选，企业微信群机器人地址，有新留言时推送

const LIMITS = { name: 40, company: 80, contact: 80, message: 2000 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.TURNSTILE_SECRET) return json({ error: '表单暂未开放' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: '请求格式不正确' }, 400);
  }
  const field = (k) => String(form.get(k) ?? '').trim();
  const data = Object.fromEntries(Object.keys(LIMITS).map((k) => [k, field(k)]));
  if (!data.name || !data.contact || !data.message) return json({ error: '请填写称呼、联系方式和留言' }, 400);
  if (Object.entries(LIMITS).some(([k, max]) => data[k].length > max)) return json({ error: '内容过长' }, 400);

  // 校验 Turnstile，挡住机器人
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: field('cf-turnstile-response'), remoteip: ip }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!verify.success) return json({ error: '人机验证未通过，请刷新后重试' }, 403);

  await env.DB.prepare(
    'INSERT INTO messages (name, company, contact, message, ip, country) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(data.name, data.company || null, data.contact, data.message, ip, request.cf?.country ?? null).run();

  if (env.WECOM_WEBHOOK) {
    const text = [
      '## 作品站新留言',
      `> 称呼：${data.name}${data.company ? `（${data.company}）` : ''}`,
      `> 联系方式：${data.contact}`,
      '',
      data.message.slice(0, 500),
    ].join('\n');
    // 推送失败不影响留言保存
    await fetch(env.WECOM_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msgtype: 'markdown', markdown: { content: text } }),
    }).catch(() => {});
  }

  return json({ ok: true });
}
