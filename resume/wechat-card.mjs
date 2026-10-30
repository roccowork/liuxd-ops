// 把 wechat-card.html 截成一张 1080 宽的长图，发微信群用 → resume/out/wechat-card.png（不提交）
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
await mkdir(resolve(here, 'out'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(here, 'wechat-card.html')).href, { waitUntil: 'networkidle' });
const out = resolve(here, 'out', 'wechat-card.png');
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`✓ ${out}`);
