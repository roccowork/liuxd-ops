// 用 Chromium 把 resume.html 打印成 PDF（GitHub Actions 里自动执行，本地也能跑：npm ci && npm run pdf）
//   完整版（带手机号，投递用）→ resume/刘晓东-运维工程师.pdf
//   公开版（不带手机号，网站下载用）→ site/public/resume/liuxiaodong-resume.pdf
// 生成后检查：每份都是 2 页；公开版里没有手机号
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const src = pathToFileURL(resolve(here, 'resume.html')).href;
const EXPECTED_PAGES = 2;

const targets = [
  { name: '完整版', url: src, out: resolve(here, '刘晓东-运维工程师.pdf') },
  { name: '公开版', url: `${src}?public`, out: resolve(here, '../site/public/resume/liuxiaodong-resume.pdf'), public: true },
];

// Chromium 生成的 PDF 里每页有一个 /Type /Page 对象（/Pages 是页树，不算）
const countPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;

const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage();
  for (const t of targets) {
    await page.goto(t.url, { waitUntil: 'networkidle' });
    if (t.public) {
      const hidden = await page.$$eval('.phone', (els) => els.every((el) => getComputedStyle(el).display === 'none'));
      if (!hidden) {
        console.error(`✗ ${t.name}：手机号没有隐藏，停止生成`);
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
