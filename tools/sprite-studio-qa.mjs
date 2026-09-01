import { chromium } from 'playwright';
import fs from 'node:fs';

const baseURL = process.env.GRIDIRON_QA_URL || 'http://127.0.0.1:4173';
const outDir = process.env.GRIDIRON_QA_OUT || 'artifacts/visual-qa';
fs.mkdirSync(outDir, { recursive: true });

const launchOptions = { headless: true };
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('console', msg => console.log('[sprite-studio]', msg.type(), msg.text()));
page.on('pageerror', err => console.error('[sprite-studio] pageerror:', err));

await page.goto(`${baseURL}/sprite-studio.html`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__gridironSpriteStudio?.state?.poses?.size === 6);

const poseCount = await page.locator('.pose-btn').count();
if (poseCount !== 6) throw new Error(`Expected 6 pose buttons, found ${poseCount}`);

const dimensions = await page.evaluate(() => {
  const canvas = document.querySelector('#editCanvas');
  return [canvas.width, canvas.height];
});
if (dimensions[0] !== 96 || dimensions[1] !== 128) throw new Error(`Unexpected editor canvas ${dimensions.join('x')}`);

await page.screenshot({ path: `${outDir}/sprite-studio-01-overview.png`, fullPage: true });

await page.getByRole('button', { name: 'Run Right' }).click();
await page.getByRole('button', { name: 'Right Leg' }).click();
await page.getByRole('button', { name: '→' }).click();
await page.screenshot({ path: `${outDir}/sprite-studio-02-guided-pose.png`, fullPage: true });

await page.getByRole('button', { name: 'Undo' }).click();
await page.getByRole('button', { name: 'Aim / Cock' }).click();
await page.getByRole('button', { name: 'Duplicate current' }).click();
await page.screenshot({ path: `${outDir}/sprite-studio-03-pose-library.png`, fullPage: true });

const masterOpaque = await page.evaluate(() => {
  const c = window.__gridironSpriteStudio.state.master;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let count = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) count++;
  return count;
});
if (masterOpaque < 100) throw new Error('Approved QB master did not load into Sprite Studio');

await browser.close();
console.log('Sprite Studio QA passed');
