# liuxd-ops · 个人作品站

Astro 静态站 + Remotion（交付流水线动画）+ three.js（首屏星图），部署到 Cloudflare Pages：<https://cv.liuxd.dev>（自定义域名，Pages 自带域名 liuxd-ops.pages.dev 仍可访问）

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
```

## 目录

| 路径 | 内容 |
|------|------|
| `src/data/site.ts` | 个人信息、数字、能力、经历——**改文字先看这里** |
| `src/data/cases.ts` | 四个案例的全部内容（架构泳道、做法、问题、结果） |
| `src/remotion/Delivery.tsx` | 流水线动画（1280×720，30fps，20 秒，四幕） |
| `src/lib/constellation.ts` | 首屏 three.js 星图 |
| `functions/api/contact.js` | 联系表单的 Pages Function（Turnstile 校验 → 写 D1 → 推企业微信） |
| `schema.sql` | D1 留言表 |
| `public/resume/liuxiaodong-resume.pdf` | 公开版简历（不含手机号），由 `../resume/build-pdf.mjs` 生成（CI 自动执行） |

## 首次部署到 Cloudflare Pages

1. 把 liuxd-ops 推到 GitHub（可以是私有仓库）。
2. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git，选这个仓库：
   - Project name：`liuxd-ops`（决定域名 liuxd-ops.pages.dev）
   - Framework preset：Astro
   - Build command：`npm run build`
   - Build output directory：`dist`
   - Root directory：`site`
3. 保存并部署。之后每次推送到主分支都会自动重新部署。

## 启用联系表单（可选）

不做这一步，联系区只显示邮件 / 运维平台 / 简历三个入口，网站照常可用。

1. **D1**：Workers & Pages → D1 → Create database，名字 `liuxd-ops`；打开它的 Console，粘贴 `schema.sql` 执行。
2. **Turnstile**：Turnstile → Add site，域名填 `cv.liuxd.dev` 和 `liuxd-ops.pages.dev`，拿到 Site Key 和 Secret Key。
3. Pages 项目 → Settings：
   - Bindings → Add → D1 database，变量名 `DB`，选 `liuxd-ops`
   - Variables and Secrets：
     - `PUBLIC_TURNSTILE_SITE_KEY` = Site Key（构建时使用，有它才会渲染表单）
     - `TURNSTILE_SECRET` = Secret Key（类型选 Secret）
     - `WECOM_WEBHOOK` = 企业微信群机器人地址（可选，有新留言时推送）
4. Deployments → 最新一次部署 → Retry deployment，让新变量生效。

查看留言：D1 Console 里执行 `SELECT * FROM messages ORDER BY id DESC;`
