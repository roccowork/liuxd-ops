# liuxd-ops · 求职材料

| 目录 | 内容 |
|------|------|
| `resume/resume.html` | 简历源文件（A4 两页）。黄色高亮是待补充的信息 |
| `resume/build-pdf.mjs` | 用 Chromium 导出 PDF：完整版（带手机号，投递用）+ 公开版（不带手机号，放网站），并检查页数和手机号 |
| `resume/build-pdf.sh` | 旧方法：在 Windows 上用 Edge 导出（字体是微软雅黑） |
| `site/` | 个人作品站（Astro + Remotion + three.js），部署说明见 `site/README.md` |
| `home-prototype/` | 作品站的早期单页原型，仅作参考 |

改完 `resume.html` 推到 main 即可：GitHub Actions（`.github/workflows/resume.yml`）自动生成两份 PDF 并提交，提交会触发 Cloudflare Pages 重新部署，网站上的简历随之更新。CI 里没有微软雅黑，用思源黑体（Noto Sans CJK SC）代替；不是 2 页或公开版带了手机号时流水线失败，不会提交。

本地预览：`cd resume && npm ci && npx playwright install chromium && npm run pdf`。

## 自动检查

| 工作流 | 触发 | 做什么 |
|------|------|------|
| `site.yml` | 改了 `site/`、每周一 | 构建、HTML 校验、站内链接检查；每周一查外部链接 |
| `resume.yml` | 改了 `resume/` | 生成简历 PDF 并检查，推到 main 时自动提交 |
