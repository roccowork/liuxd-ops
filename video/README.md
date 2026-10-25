# 90 秒视频介绍（Remotion + three.js）

cv.liuxd.dev 首页「Showreel」一节播放的视频，名片页 liuxd.dev 也链接到这里。

| 文件 | 内容 |
|------|------|
| `src/Showreel.tsx` | 八段内容、字幕、章节条、配乐音量（改文字和数字看这里） |
| `src/Background3D.tsx` | three.js 星空背景和第二段的集群拓扑 |
| `public/music.mp3` | 配乐：ElevenLabs Music 生成的原创曲（90 秒，无人声） |

输出到 `../site/public/video/`（`showreel.mp4`、`poster.jpg`），随网站一起部署。视频里的数字来自各案例的实测记录，改数字前先核对 ops-desk 的案例和 ops-lab 的实验文档。

```bash
npm ci
npm run studio      # 浏览器里预览、逐帧调整
npm run render      # 渲染 MP4（约十几分钟）
npm run poster      # 生成封面
```

在没有显卡的 Linux 上渲染要加 `--gl=swangle`；用 Playwright 自带的浏览器时再加 `--browser-executable <chrome-headless-shell 路径>`。
