import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background3D, NODES, TOPO, project } from './Background3D';
import { C, F, clamp, count, ease, fade, typed } from './theme';
import type { CSSProperties, ReactNode } from 'react';

export const FPS = 30;
export const W = 1280;
export const H = 720;

/** 八段：起始帧、时长、章节名、字幕（字幕按段内帧数切换） */
const S = [
  { from: 0, dur: 180, label: '开场', subs: [[0, '11 年企业 IT 运维，现在专注运维自动化']] },
  { from: 180, dur: 360, label: '生产平台', subs: [[0, '一套长期运行的线上平台：香港云服务器上的单节点 k3s'], [180, '应用和基础组件都由 Argo CD 从 Git 同步，服务器上不手工放清单']] },
  { from: 540, dur: 450, label: 'GitOps 发布', subs: [[0, '推送代码后自动测试、构建、更新镜像版本，约 3～4 分钟上线（实测）'], [250, '坏版本过不了就绪探针，旧版本照常服务；git revert 约 1 分钟回滚（实测）']] },
  { from: 990, dur: 360, label: '监控告警', subs: [[0, '把站点缩容到 0 做验收：第 106 秒企业微信收到告警（实测）'], [220, '恢复后自动发恢复通知；每周一 09:00 自动出运维周报']] },
  { from: 1350, dur: 300, label: '数据安全', subs: [[0, '每天用 restic 把数据加密备份到另一家云，超过 26 小时没成功就告警'], [150, 'HTTPS 证书全自动续期，剩 21 天还没续上就告警']] },
  { from: 1650, dur: 300, label: '工程化', subs: [[0, 'Renovate 每周给 8 个仓库自动提依赖升级 PR，CI 通过才合并'], [150, 'Ansible 重复执行 changed=0，Terraform 检测配置漂移']] },
  { from: 1950, dur: 360, label: '实验环境', subs: [[0, '实验环境：自己搭建的虚拟机集群，16 个实验从 Linux 初始化做到 GitOps'], [190, '每个实验都有验证清单、失败演练、回滚步骤和踩坑记录']] },
  { from: 2310, dur: 390, label: '案例与联系', subs: [[0, '整理了 143 个企业自动化案例，标明哪些在实际运行、哪些是方案设计'], [200, '作品集与简历 cv.liuxd.dev · 线上平台 ops.liuxd.dev']] },
] as const;
export const DURATION = 2700;

/* ── 通用元素 ─────────────────────────────────────────── */

const Scene = ({ dur, children, style }: { dur: number; children: ReactNode; style?: CSSProperties }) => {
  const f = useCurrentFrame();
  const opacity = Math.min(fade(f, 0, 16), interpolate(f, [dur - 14, dur], [1, 0], clamp));
  return <AbsoluteFill style={{ opacity, padding: '96px 80px 120px', ...style }}>{children}</AbsoluteFill>;
};

const Kicker = ({ no, title, sub }: { no: string; title: string; sub?: string }) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 20], [16, 0], { ...clamp, easing: ease });
  return (
    <div style={{ transform: `translateY(${y}px)`, marginBottom: 30 }}>
      <div style={{ font: `500 14px ${F.mono}`, letterSpacing: 5, color: C.gold }}>{no}</div>
      <div style={{ font: `600 40px/1.3 ${F.serif}`, color: C.text, marginTop: 10 }}>{title}</div>
      {sub && <div style={{ font: `17px ${F.sans}`, color: C.text2, marginTop: 8 }}>{sub}</div>}
    </div>
  );
};

const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, ...style }}>{children}</div>
);

const Terminal = ({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) => (
  <Panel style={{ overflow: 'hidden', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderBottom: `1px solid ${C.line}` }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.14)' }} />)}
      <span style={{ marginLeft: 8, font: `13px ${F.mono}`, color: C.text3 }}>{title}</span>
    </div>
    <div style={{ padding: '14px 18px', font: `16px/1.85 ${F.mono}`, color: C.text2, whiteSpace: 'pre' }}>{children}</div>
  </Panel>
);

const Tag = ({ children, color = C.ok }: { children: ReactNode; color?: string }) => (
  <span style={{ display: 'inline-block', padding: '3px 10px', border: `1px solid ${color}`, color, borderRadius: 999, font: `13px ${F.mono}` }}>{children}</span>
);

/** 顶部章节条 + 底部字幕 */
const Chrome = () => {
  const f = useCurrentFrame();
  const i = S.findIndex((s) => f >= s.from && f < s.from + s.dur);
  const s = S[Math.max(0, i)];
  const local = f - s.from;
  const sub = [...s.subs].reverse().find(([at]) => local >= at)?.[1] ?? '';
  const subStart = [...s.subs].reverse().find(([at]) => local >= at)?.[0] ?? 0;
  const subOpacity = Math.min(fade(local, subStart + 6, 12), interpolate(local, [s.dur - 12, s.dur], [1, 0], clamp));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 34, left: 80, right: 80, display: 'flex', gap: 6 }}>
        {S.map((c, k) => {
          const p = interpolate(f, [c.from, c.from + c.dur], [0, 1], clamp);
          return (
            <div key={k} style={{ flex: c.dur }}>
              <div style={{ height: 2, background: C.line }}>
                <div style={{ height: 2, width: `${p * 100}%`, background: k === i ? C.gold : 'rgba(210,177,122,0.55)' }} />
              </div>
              <div style={{ marginTop: 8, font: `11px ${F.mono}`, letterSpacing: 1, color: k === i ? C.gold : C.text3 }}>
                {String(k + 1).padStart(2, '0')} {c.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 44, left: 0, right: 0, textAlign: 'center', opacity: subOpacity }}>
        <span style={{ display: 'inline-block', padding: '9px 22px', background: 'rgba(6,12,23,0.72)', borderRadius: 6, font: `500 21px/1.5 ${F.sans}`, color: C.text }}>{sub}</span>
      </div>
    </AbsoluteFill>
  );
};

/* ── 1 开场 ───────────────────────────────────────────── */

const Intro = () => {
  const f = useCurrentFrame();
  const letter = (k: number) => fade(f, 20 + k * 6, 18);
  const name = '刘晓东';
  return (
    <Scene dur={180} style={{ alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-grid', placeItems: 'center', width: 86, height: 86, border: `1px solid rgba(210,177,122,0.5)`, outline: `1px solid rgba(210,177,122,0.3)`, outlineOffset: 6, font: `600 40px ${F.serif}`, color: C.gold, opacity: fade(f, 4, 20) }}>刘</div>
        <div style={{ marginTop: 34, font: `600 64px ${F.serif}`, letterSpacing: 18, color: C.text }}>
          {name.split('').map((ch, k) => (
            <span key={k} style={{ opacity: letter(k), display: 'inline-block', transform: `translateY(${(1 - letter(k)) * 18}px)` }}>{ch}</span>
          ))}
        </div>
        <div style={{ marginTop: 10, font: `14px ${F.mono}`, letterSpacing: 10, color: C.text3, opacity: fade(f, 50) }}>LIU XIAODONG</div>
        <div style={{ margin: '30px auto 0', width: interpolate(f, [60, 100], [0, 380], { ...clamp, easing: ease }), height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
        <div style={{ marginTop: 24, font: `500 24px ${F.serif}`, letterSpacing: 6, color: C.gold, opacity: fade(f, 80) }}>运维工程师 · 自动化方向</div>
        <div style={{ marginTop: 18, font: `17px ${F.sans}`, color: C.text2, opacity: fade(f, 100) }}>把重复的运维工作，变成可复现、可回滚的代码</div>
      </div>
    </Scene>
  );
};

/* ── 2 生产平台（3D 拓扑 + 标签） ─────────────────────── */

const Platform = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <Scene dur={360} style={{ padding: 0 }}>
      <div style={{ position: 'absolute', left: 80, top: 96 }}>
        <Kicker no="02 · PRODUCTION" title="线上平台，长期运行" sub="ops.liuxd.dev" />
      </div>
      {NODES.map((n, i) => {
        const p = project(n.pos, f, width, height);
        const o = fade(f, n.at + 4, 14);
        const big = n.ring === 0;
        return (
          <div key={i} style={{ position: 'absolute', left: p.x, top: p.y + (big ? 38 : 20), transform: 'translateX(-50%)', textAlign: 'center', opacity: o, whiteSpace: 'nowrap' }}>
            <div style={{ font: `600 ${big ? 20 : 15}px ${F.sans}`, color: big ? C.gold : C.text }}>{n.name}</div>
            <div style={{ font: `12px ${F.mono}`, color: C.text3, marginTop: 2 }}>{n.sub}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', right: 80, top: 120, width: 300, opacity: fade(f, 170, 18) }}>
        <Panel style={{ padding: '18px 22px' }}>
          {[
            ['服务器', '4 核 8G · Ubuntu 24.04'],
            ['对外端口', '只开 22 / 80 / 443'],
            ['部署方式', 'GitOps · prune + selfHeal'],
            ['手工改集群', '同一秒被改回（实测）'],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: i < 3 ? `1px solid ${C.line}` : 'none', opacity: fade(f, 180 + i * 10) }}>
              <span style={{ font: `14px ${F.sans}`, color: C.text3 }}>{k}</span>
              <span style={{ font: `14px ${F.sans}`, color: C.text }}>{v}</span>
            </div>
          ))}
        </Panel>
      </div>
    </Scene>
  );
};

/* ── 3 GitOps 发布 ────────────────────────────────────── */

const STAGES = [
  { name: 'git push', sub: 'main 分支' },
  { name: 'GitHub Actions', sub: 'lint · test · build' },
  { name: 'GHCR', sub: '镜像 tag = 提交号' },
  { name: '更新清单', sub: 'kustomization newTag' },
  { name: 'Argo CD', sub: '自动同步' },
  { name: '滚动更新', sub: '就绪后才切流量' },
  { name: '/version.txt', sub: '线上版本 = 新提交' },
];

const Gitops = () => {
  const f = useCurrentFrame();
  const stageAt = (i: number) => 40 + i * 26;
  const doneAt = stageAt(STAGES.length - 1) + 20;
  const secs = Math.round(interpolate(f, [40, doneAt], [0, 222], clamp));
  const timer = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const bad = f >= 250;
  const pods = (k: number) => {
    if (!bad) return 'ready';
    if (k === 2) return f < 330 ? 'notready' : f < 360 ? 'term' : 'ready';
    return 'ready';
  };
  const podColor = { ready: C.ok, notready: C.bad, term: C.text3 } as const;
  const podText = { ready: 'Ready', notready: '0/1 未就绪', term: '回滚中' } as const;
  return (
    <Scene dur={450}>
      <Kicker no="03 · GITOPS" title="推送即上线，坏版本不接流量" />
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
        {STAGES.map((s, i) => {
          const on = fade(f, stageAt(i), 12);
          const active = f >= stageAt(i) && f < stageAt(i + 1);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 10 }}>
              <Panel style={{ flex: 1, height: 112, display: 'flex', flexDirection: 'column', padding: '14px 12px', borderColor: active ? C.gold : on > 0.5 ? 'rgba(79,195,161,0.5)' : C.line, opacity: 0.35 + 0.65 * on, transform: `translateY(${(1 - on) * 10}px)` }}>
                <div style={{ font: `600 15px ${F.sans}`, color: on > 0.5 ? C.text : C.text3 }}>{s.name}</div>
                <div style={{ font: `12px ${F.mono}`, color: C.text3, marginTop: 6 }}>{s.sub}</div>
                <div style={{ marginTop: 'auto', height: 3, background: C.line }}>
                  <div style={{ height: 3, width: `${on * 100}%`, background: C.ok }} />
                </div>
              </Panel>
              {i < STAGES.length - 1 && <span style={{ alignSelf: 'center', color: on > 0.5 ? C.gold : C.text3, font: `16px ${F.mono}` }}>›</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 30, alignItems: 'stretch' }}>
        <Panel style={{ width: 300, padding: '20px 24px' }}>
          <div style={{ font: `13px ${F.mono}`, color: C.text3, letterSpacing: 2 }}>推送到上线</div>
          <div style={{ font: `600 54px ${F.mono}`, color: f >= doneAt ? C.ok : C.text, marginTop: 6 }}>{timer}</div>
          <div style={{ font: `14px ${F.sans}`, color: C.text2, opacity: fade(f, doneAt) }}>✓ 线上版本已是新提交</div>
        </Panel>
        <Panel style={{ flex: 1, padding: '20px 24px', opacity: fade(f, 240, 16) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: `13px ${F.mono}`, color: C.text3, letterSpacing: 2 }}>
            <span>坏版本演练 · maxUnavailable = 0</span>
            <span style={{ color: f >= 330 ? C.gold : C.text3 }}>{f >= 330 ? '$ git revert HEAD && git push' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
            {[0, 1, 2].map((k) => {
              const st = pods(k);
              return (
                <div key={k} style={{ flex: 1, padding: '12px 14px', border: `1px solid ${podColor[st]}`, borderRadius: 6 }}>
                  <div style={{ font: `13px ${F.mono}`, color: C.text3 }}>{k === 2 && bad && f < 360 ? 'ops-desk-新版本' : `ops-desk-${['a1f', 'b7c', 'c2d'][k]}`}</div>
                  <div style={{ font: `600 16px ${F.mono}`, color: podColor[st], marginTop: 6 }}>● {podText[st]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, font: `15px ${F.sans}`, color: C.text2 }}>
            {f < 330 ? '新版本就绪探针失败，旧副本继续接流量，用户无感知' : f < 380 ? '回滚中…' : <span style={{ color: C.ok }}>✓ 约 1 分钟恢复（实测），全程有 Git 记录可审计</span>}
          </div>
        </Panel>
      </div>
    </Scene>
  );
};

/* ── 4 监控告警 ───────────────────────────────────────── */

const Alerting = () => {
  const f = useCurrentFrame();
  const N = 60;
  const dropAt = 30; // 第 30 个点开始下跌
  const backAt = 46;
  const drawn = Math.floor(interpolate(f, [10, 200], [0, N], clamp));
  const pts = Array.from({ length: Math.min(drawn, N) }, (_, i) => {
    const base = 62 + 10 * Math.sin(i / 4) + 4 * Math.sin(i * 1.7);
    const v = i >= dropAt && i < backAt ? 4 : base;
    return [i * (640 / (N - 1)), 200 - v * 2] as const;
  });
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const downFrame = 10 + (dropAt / N) * 190;
  const secs = Math.round(interpolate(f, [downFrame, downFrame + 70], [0, 106], clamp));
  const alertAt = downFrame + 72;
  const resolvedAt = 10 + (backAt / N) * 190 + 30;
  const card = (at: number) => ({ opacity: fade(f, at, 12), transform: `translateX(${(1 - fade(f, at, 16)) * 40}px)` });
  return (
    <Scene dur={360}>
      <Kicker no="04 · OBSERVABILITY" title="故障 106 秒推到企业微信" />
      <div style={{ display: 'flex', gap: 28 }}>
        <Panel style={{ flex: 1, padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: `13px ${F.mono}`, color: C.text3 }}>
            <span>ops-desk · 每秒请求数（示意）</span>
            <span style={{ color: f > downFrame && f < resolvedAt ? C.bad : C.text3 }}>{f > downFrame && f < resolvedAt ? `站点不可用 ${secs}s` : 'Prometheus'}</span>
          </div>
          <svg width={640} height={210} style={{ marginTop: 12, overflow: 'visible' }}>
            {[0, 1, 2, 3].map((k) => <line key={k} x1={0} x2={640} y1={20 + k * 60} y2={20 + k * 60} stroke={C.line} />)}
            <rect x={(dropAt / (N - 1)) * 640} y={0} width={((backAt - dropAt) / (N - 1)) * 640} height={210} fill="rgba(224,100,76,0.10)" opacity={drawn > dropAt ? 1 : 0} />
            <path d={path} fill="none" stroke={C.ok} strokeWidth={2.5} />
          </svg>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Tag color={C.text3}>for: 1m</Tag>
            <Tag color={C.text3}>group_wait 30s</Tag>
            <Tag color={C.text3}>抑制重复告警</Tag>
          </div>
        </Panel>
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ font: `13px ${F.mono}`, color: C.text3, letterSpacing: 2 }}>企业微信 · 运维群</div>
          <Panel style={{ padding: '14px 18px', borderLeft: `3px solid ${C.bad}`, ...card(alertAt) }}>
            <div style={{ font: `600 15px ${F.sans}`, color: C.bad }}>🔴 告警 · OpsDeskNoReplicas</div>
            <div style={{ font: `14px/1.7 ${F.sans}`, color: C.text2, marginTop: 6 }}>ops-desk 没有可用副本<br />持续时间：1 分钟</div>
          </Panel>
          <Panel style={{ padding: '14px 18px', borderLeft: `3px solid ${C.ok}`, ...card(resolvedAt) }}>
            <div style={{ font: `600 15px ${F.sans}`, color: C.ok }}>✅ 已恢复 · OpsDeskNoReplicas</div>
            <div style={{ font: `14px/1.7 ${F.sans}`, color: C.text2, marginTop: 6 }}>副本已就绪，站点恢复访问</div>
          </Panel>
          <Panel style={{ padding: '14px 18px', borderLeft: `3px solid ${C.gold}`, ...card(250) }}>
            <div style={{ font: `600 15px ${F.sans}`, color: C.gold }}>📋 每周运维周报 · 周一 09:00</div>
            <div style={{ font: `14px/1.7 ${F.sans}`, color: C.text2, marginTop: 6 }}>访问量 · 告警 · 备份 · 证书剩余天数</div>
          </Panel>
        </div>
      </div>
    </Scene>
  );
};

/* ── 5 数据安全 ───────────────────────────────────────── */

const Safety = () => {
  const f = useCurrentFrame();
  const days = f < 190 ? Math.round(interpolate(f, [150, 190], [90, 30], clamp)) : f < 210 ? 30 : 90;
  const ringP = days / 90;
  const flow = (k: number) => ((f * 2 + k * 60) % 180) / 180;
  return (
    <Scene dur={300}>
      <Kicker no="05 · DATA SAFETY" title="数据每天异地加密备份，证书不再过期" />
      <div style={{ display: 'flex', gap: 28 }}>
        <Panel style={{ flex: 1.3, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[['云盘', '访问统计', 'Uptime Kuma'], ['restic', 'AES-256 加密 · 去重'], ['Cloudflare R2', '另一家云 · 异地']].map((col, i) => (
              <div key={i} style={{ textAlign: 'center', opacity: fade(f, 10 + i * 16) }}>
                {i === 0 ? (
                  col.map((a) => <div key={a} style={{ padding: '6px 14px', margin: '6px 0', border: `1px solid ${C.line}`, borderRadius: 6, font: `14px ${F.sans}`, color: C.text }}>{a}</div>)
                ) : (
                  <div style={{ padding: '18px 20px', border: `1px solid ${i === 1 ? C.gold : C.blue}`, borderRadius: 8 }}>
                    <div style={{ font: `600 18px ${F.sans}`, color: i === 1 ? C.gold : C.blue }}>{i === 1 ? '🔒 ' : '☁ '}{col[0]}</div>
                    <div style={{ font: `12px ${F.mono}`, color: C.text3, marginTop: 6 }}>{col[1]}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', height: 4, margin: '22px 40px 0', background: C.line, borderRadius: 2 }}>
            {[0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', top: -2, left: `${flow(k) * 100}%`, width: 8, height: 8, borderRadius: 4, background: C.gold, opacity: fade(f, 40) }} />)}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, opacity: fade(f, 70) }}>
            <Tag>每天 1 次</Tag>
            <Tag>失败立即告警</Tag>
            <Tag color={C.gold}>26 小时没成功 → 告警</Tag>
          </div>
        </Panel>
        <Panel style={{ flex: 1, padding: '24px 26px', display: 'flex', gap: 24, alignItems: 'center', opacity: fade(f, 120, 16) }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={62} stroke={C.line} strokeWidth={8} fill="none" />
            <circle cx={75} cy={75} r={62} stroke={days <= 30 ? C.gold : C.ok} strokeWidth={8} fill="none" strokeDasharray={`${ringP * 389.6} 389.6`} transform="rotate(-90 75 75)" strokeLinecap="round" />
            <text x={75} y={80} textAnchor="middle" fill={C.text} style={{ font: `600 34px ${F.mono}` }}>{days}</text>
            <text x={75} y={104} textAnchor="middle" fill={C.text3} style={{ font: `12px ${F.sans}` }}>天后到期</text>
          </svg>
          <div>
            <div style={{ font: `600 18px ${F.sans}`, color: C.text }}>cert-manager</div>
            <div style={{ font: `14px/1.8 ${F.sans}`, color: C.text2, marginTop: 6 }}>
              剩 30 天自动续期<br />剩 21 天还没续上 → 告警
            </div>
            <div style={{ marginTop: 10, font: `600 15px ${F.sans}`, color: C.ok, opacity: fade(f, 212) }}>✓ 已续期 · 零手工操作</div>
          </div>
        </Panel>
      </div>
    </Scene>
  );
};

/* ── 6 工程化 ─────────────────────────────────────────── */

const REPOS = ['ops-desk', 'liuxd-ops', 'it-site', 'ops-lab', 'ops-compass', 'labapp', 'labapp-gitops', 'pve-lab'];

const Engineering = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={300}>
      <Kicker no="06 · ENGINEERING" title="依赖自动升级，配置可重复、可检测" />
      <div style={{ display: 'flex', gap: 22 }}>
        <Panel style={{ flex: 1.1, padding: '16px 20px' }}>
          <div style={{ font: `13px ${F.mono}`, color: C.text3, letterSpacing: 2, marginBottom: 8 }}>Renovate · 每周自动提 PR</div>
          {REPOS.map((r, i) => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < REPOS.length - 1 ? `1px solid ${C.line}` : 'none', opacity: fade(f, 14 + i * 7) }}>
              <span style={{ font: `14px ${F.mono}`, color: C.text }}>{r}</span>
              <span style={{ font: `13px ${F.mono}`, color: f > 40 + i * 7 ? C.ok : C.text3 }}>{f > 40 + i * 7 ? '✓ CI 通过' : '检查中…'}</span>
            </div>
          ))}
        </Panel>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Terminal title="ansible-playbook site.yml · 第二次运行" style={{ opacity: fade(f, 120) }}>
            {typed(f, 130, 'PLAY RECAP ****************\n')}
            {f > 160 && <span>node3 : changed=<span style={{ color: C.ok }}>0</span>  unreachable=0  failed=0</span>}
          </Terminal>
          <Terminal title="terraform plan" style={{ opacity: fade(f, 180) }}>
            {typed(f, 190, 'Refreshing state...\n')}
            {f > 215 && <span style={{ color: C.ok }}>No changes. Your infrastructure matches the configuration.</span>}
          </Terminal>
        </div>
      </div>
    </Scene>
  );
};

/* ── 7 实验环境 ───────────────────────────────────────── */

const LABS = ['环境搭建', '系统初始化', 'Nginx 负载均衡', 'MySQL 主从', 'Shell 巡检', 'Ansible', 'Ansible Role', 'Docker', 'Compose', 'Prometheus', 'Keepalived', 'Python', 'Terraform', 'kubeadm K8s', 'Helm 监控日志', 'Jenkins + Argo CD'];
const HIGHLIGHTS = [
  ['kubeadm v1.34', '1 主 2 从集群'],
  ['MySQL GTID', '主从 + 时间点恢复'],
  ['Keepalived', 'VIP 秒级漂移'],
  ['镜像瘦身', '约 300MB → 15MB'],
  ['过程记录', '210 张截图'],
];

const Labs = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={360}>
      <Kicker no="07 · LAB · 实验环境" title="16 个实验，从 Linux 初始化做到 GitOps" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
        {LABS.map((l, i) => {
          const o = fade(f, 10 + i * 6, 12);
          return (
            <div key={i} style={{ padding: '12px 10px', border: `1px solid ${o > 0.5 ? 'rgba(79,195,161,0.45)' : C.line}`, background: C.panel, borderRadius: 6, opacity: 0.25 + 0.75 * o, transform: `scale(${0.94 + 0.06 * o})` }}>
              <div style={{ font: `12px ${F.mono}`, color: C.gold }}>{String(i).padStart(2, '0')}</div>
              <div style={{ font: `500 14px ${F.sans}`, color: C.text, marginTop: 4, whiteSpace: 'nowrap' }}>{l}</div>
              <div style={{ font: `11px ${F.mono}`, color: C.ok, marginTop: 4, opacity: o }}>✓ 已跑通</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 26 }}>
        {HIGHLIGHTS.map(([a, b], i) => (
          <Panel key={i} style={{ flex: 1, padding: '14px 16px', opacity: fade(f, 130 + i * 16), transform: `translateY(${(1 - fade(f, 130 + i * 16)) * 12}px)` }}>
            <div style={{ font: `600 16px ${F.sans}`, color: C.text }}>{a}</div>
            <div style={{ font: `13px ${F.sans}`, color: C.text2, marginTop: 4 }}>{b}</div>
          </Panel>
        ))}
      </div>
    </Scene>
  );
};

/* ── 8 案例与结尾 ─────────────────────────────────────── */

/** 随机挑出 32 个格子标成 AI 核心（固定种子，每次渲染一样） */
const AI_SET = new Set(
  Array.from({ length: 138 }, (_, i) => i + 5)
    .map((i) => [i, random(`ai${i}`)] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 32)
    .map(([i]) => i),
);

const Outro = () => {
  const f = useCurrentFrame();
  const cases = 143;
  const ai = 32;
  const prod = 5;
  const part1 = Math.min(1, interpolate(f, [180, 200], [1, 0], clamp));
  const part2 = fade(f, 200, 20);
  return (
    <Scene dur={390}>
      <div style={{ opacity: part1 }}>
        <Kicker no="08 · CASES" title="143 个企业自动化案例" sub="运维、开发、测试、安全、数据，以及销售、财务、人事等 12 个部门" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 7, width: 760 }}>
          {Array.from({ length: cases }, (_, i) => {
            const isProd = i < prod;
            const isAi = AI_SET.has(i);
            const o = fade(f, 6 + i * 0.6, 8);
            const color = isProd ? C.ok : isAi && f > 100 ? C.gold : 'rgba(169,180,196,0.35)';
            return <div key={i} style={{ height: 22, borderRadius: 4, background: color, opacity: o }} />;
          })}
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 24 }}>
          <span style={{ font: `15px ${F.sans}`, color: C.ok }}>■ {prod} 个在生产环境运行</span>
          <span style={{ font: `15px ${F.sans}`, color: C.gold, opacity: fade(f, 100) }}>■ {ai} 个 AI 是核心：告警根因分析、AI Agent 排查…</span>
          <span style={{ font: `15px ${F.sans}`, color: C.text3 }}>■ 其余如实标注：实验、演示或方案设计</span>
        </div>
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: part2 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
            {[[11, '年企业 IT 运维'], [16, '个实验全部跑通'], [143, '个自动化案例'], [1, '套生产平台长期运行']].map(([n, l], i) => (
              <div key={i}>
                <div style={{ font: `600 54px ${F.mono}`, color: C.gold }}>{count(f, 210 + i * 8, 40, n as number)}</div>
                <div style={{ font: `15px ${F.sans}`, color: C.text2, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ margin: '40px auto 0', width: 420, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
          <div style={{ marginTop: 30, font: `600 34px ${F.serif}`, letterSpacing: 10, color: C.text }}>刘晓东</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 26, justifyContent: 'center', font: `20px ${F.mono}`, color: C.text }}>
            <span>cv.liuxd.dev</span>
            <span style={{ color: C.text3 }}>·</span>
            <span>ops.liuxd.dev</span>
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

/* ── 合成 ─────────────────────────────────────────────── */

const SCENES = [Intro, Platform, Gitops, Alerting, Safety, Engineering, Labs, Outro];

export const Showreel = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 30, DURATION - 60, DURATION], [0, 0.85, 0.85, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1000px 520px at 85% -10%, rgba(210,177,122,0.10), transparent 60%), ${C.bg}`, fontFamily: F.sans }}>
      <Background3D />
      {S.map((s, i) => {
        const Comp = SCENES[i];
        return (
          <Sequence key={i} from={s.from} durationInFrames={s.dur}>
            <Comp />
          </Sequence>
        );
      })}
      <Chrome />
      <Audio src={staticFile('music.mp3')} volume={vol} />
    </AbsoluteFill>
  );
};

/** 渲染前检查：章节首尾相接（被 Root 引用时执行一次） */
S.forEach((s, i) => {
  const next = S[i + 1];
  if (next && s.from + s.dur !== next.from) throw new Error(`章节 ${i + 1} 和 ${i + 2} 没有首尾相接`);
});
if (S[S.length - 1].from + S[S.length - 1].dur !== DURATION) throw new Error('总时长不对');
void TOPO;
