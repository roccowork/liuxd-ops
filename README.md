# liuxd-ops · 求职材料

| 目录 | 内容 |
|------|------|
| `resume/resume-ops.html` | 主投简历（A4 两页）：运维开发工程师（自动化 · K8s · AIOps），网站上下载的公开版也是这份 |
| `resume/resume.html` | 备用简历：AI 应用开发工程师，投 RAG / Agent 岗位时用 |
| `resume/build-pdf.mjs` | 用 Chromium 导出 PDF：完整版（带手机号，投递用）+ 公开版（不带手机号，放网站），并检查页数和手机号 |
| `resume/build-pdf.sh` | 旧方法：在 Windows 上用 Edge 导出（字体是微软雅黑） |
| `site/` | 个人作品站（Astro + Remotion + three.js），线上地址 cv.liuxd.dev，部署说明见 `site/README.md` |
| `card/` | 名片页（单个静态 HTML），线上地址 liuxd.dev；Cloudflare Pages 单独一个项目：根目录留空，构建命令 `exit 0`，输出目录 `card` |
| `home-prototype/` | 作品站的早期单页原型，仅作参考 |

改完简历推到 main 即可：GitHub Actions（`.github/workflows/resume.yml`）自动生成 PDF。公开版提交到 `site/public/resume/`，触发 Cloudflare Pages 重新部署，网站上的简历随之更新。

**手机号不写进仓库**（仓库是公开的）：源文件里只有占位符 `[data-phone]`，生成时从仓库 Secret `RESUME_PHONE` 填入（Settings → Secrets and variables → Actions → New repository secret）。带手机号的完整版只在那次运行页面底部的 Artifacts 里（`resume-full`，保留 30 天），下载解压就是投递用的两份 PDF。没设 Secret 时只生成公开版。CI 里没有微软雅黑，用思源黑体（Noto Sans CJK SC）代替；不是 2 页或公开版带了手机号时流水线失败，不会提交。

本地预览：`cd resume && npm ci && npx playwright install chromium && RESUME_PHONE=手机号 npm run pdf`，完整版在 `resume/out/`（不会被提交）。

## 自动检查

| 工作流 | 触发 | 做什么 |
|------|------|------|
| `site.yml` | 改了 `site/`、每周一 | 构建、HTML 校验、站内链接检查；每周一查外部链接 |
| `resume.yml` | 改了 `resume/` | 生成简历 PDF 并检查，推到 main 时自动提交 |
