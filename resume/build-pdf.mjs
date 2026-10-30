// 用 Chromium 把简历打印成 PDF（GitHub Actions 里自动执行，本地也能跑：npm ci && RESUME_PHONE=手机号 npm run pdf）
//
// 两份简历：resume.html（AI 应用开发，主投）、resume-ops.html（运维，备用）
//   完整版（带手机号，投递用）→ resume/out/，不提交到仓库（仓库是公开的），在 Actions 运行页面的 Artifacts 里下载
//   公开版（不带手机号，网站下载用）→ site/public/resume/liuxiaodong-resume.pdf，只出 AI 版
//
// 手机号不写在仓库里：从环境变量 RESUME_PHONE 读（CI 里来自仓库的 Secret），打印前填进 [data-phone]。
// 没有 RESUME_PHONE 时只生成公开版。
// 生成后检查：每份都是 2 页；公开版没有手机号；完整版的手机号确实填上了
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const url = (file) => pathToFileURL(resolve(here, file)).href;
const EXPECTED_PAGES = 2;
const phone = (process.env.RESUME_PHONE || '').trim();
const outDir = resolve(here, 'out');

const targets = [
  { name: 'AI 版公开版', url: `${url('resume.html')}?public`, out: resolve(here, '../site/public/resume/liuxiaodong-resume.pdf'), public: true },
];
if (phone) {
  targets.push(
    { name: 'AI 版完整版', url: url('resume.html'), out: resolve(outDir, '刘晓东-AI应用开发工程师.pdf') },
    { name: '运维版完整版', url: url('resume-ops.html'), out: resolve(outDir, '刘晓东-运维工程师.pdf') },
  );
} else {
  const msg = '没有 RESUME_PHONE，只生成公开版。要带手机号的完整版：在仓库 Settings → Secrets and variables → Actions 里加 RESUME_PHONE';
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);
}

// Chromium 生成的 PDF 里每页有一个 /Type /Page 对象（/Pages 是页树，不算）
const countPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage();
  for (const t of targets) {
    await page.goto(t.url, { waitUntil: 'networkidle' });
    if (t.public) {
      const hidden = await page.$$eval('.phone', (els) => els.length > 0 && els.every((el) => getComputedStyle(el).display === 'none'));
      if (!hidden) {
        console.error(`✗ ${t.name}：手机号没有隐藏，停止生成`);
        failed = true;
        continue;
      }
    } else {
      const filled = await page.$$eval('[data-phone]', (els, p) => (els.forEach((el) => (el.textContent = p)), els.length), phone);
      if (!filled) {
        console.error(`✗ ${t.name}：没找到放手机号的位置（[data-phone]）`);
        failed = true;
        continue;
      }
    }
    await page.pdf({ path: t.out, preferCSSPageSize: true, printBackground: true });
    const pages = countPages(await readFile(t.out));
    const ok = pages === EXPECTED_PAGES;
    if (!ok) failed = true;
    console.log(`${ok ? '✓' : '✗'} ${t.name}：${pages} 页 → ${t.out}`);
  }
} finally {
  await browser.close();
}
if (failed) {
  console.error(`有检查没通过：简历应为 ${EXPECTED_PAGES} 页，公开版不能带手机号`);
  process.exit(1);
}
