import { chromium } from 'playwright';
import fs from 'node:fs';

const baseURL = process.env.GRIDIRON_QA_URL || 'http://127.0.0.1:4173';
const outDir = process.env.GRIDIRON_QA_OUT || 'artifacts/visual-qa';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 414, height: 896 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  recordVideo: { dir: `${outDir}/video`, size: { width: 414, height: 896 } },
});

async function openFresh(label) {
  const page = await context.newPage();
  page.on('console', msg => console.log(`[${label}] browser:`, msg.type(), msg.text()));
  page.on('pageerror', err => console.error(`[${label}] pageerror:`, err));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#viewport canvas'));
  await page.waitForTimeout(700);
  return page;
}

async function shot(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
}

async function snap(page) {
  await page.locator('#snapBtn').click();
  await page.waitForTimeout(120);
}

async function dragThrow(page, dx = 36, dy = -185) {
  const canvas = page.locator('#viewport canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas missing');
  const sx = box.x + box.width * 0.5;
  const sy = box.y + box.height * 0.70;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + dx, sy + dy, { steps: 8 });
  await page.waitForTimeout(90);
  await page.mouse.up();
}

async function holdKey(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function captureSequence(page, prefix, delays) {
  let elapsed = 0;
  for (const delay of delays) {
    await page.waitForTimeout(delay - elapsed);
    elapsed = delay;
    await shot(page, `${prefix}-${String(delay).padStart(4, '0')}ms`);
  }
}

// 1. Base art / pre-snap
{
  const page = await openFresh('presnap');
  await shot(page, '01-presnap');
  await page.close();
}

// 2. Pocket shuffle / direction buckets
{
  const page = await openFresh('pocket');
  await snap(page);
  await holdKey(page, 'ArrowLeft', 260);
  await shot(page, '02-pocket-left');
  await holdKey(page, 'ArrowRight', 520);
  await shot(page, '03-pocket-right');
  await holdKey(page, 'ArrowDown', 280);
  await shot(page, '04-dropback');
  await page.close();
}

// 3. Throw, frame by frame around release
{
  const page = await openFresh('throw');
  await snap(page);
  await dragThrow(page, -52, -210);
  await captureSequence(page, '05-throw', [70, 160, 250, 340, 410, 500, 620]);
  await page.close();
}

// 4. Scramble + diagonal direction changes
{
  const page = await openFresh('scramble');
  await snap(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowUp', 340);
  await shot(page, '06-scramble-forward');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(260);
  await shot(page, '07-scramble-diagonal');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowUp');
  await page.close();
}

// 5. Jukes
{
  const page = await openFresh('juke');
  await snap(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowUp', 180);
  await page.keyboard.press('KeyQ');
  await captureSequence(page, '08-juke-left', [40, 100, 160, 240]);
  await page.waitForTimeout(500);
  await page.keyboard.press('KeyE');
  await captureSequence(page, '09-juke-right', [40, 100, 160, 240]);
  await page.close();
}

// 6. Power move
{
  const page = await openFresh('power');
  await snap(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowUp', 180);
  const power = page.locator('#powerBtn');
  const box = await power.boundingBox();
  if (!box) throw new Error('power button missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await captureSequence(page, '10-power', [60, 150, 260, 380]);
  await page.mouse.up();
  await page.close();
}

// 7. Slide
{
  const page = await openFresh('slide');
  await snap(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowUp', 220);
  await page.locator('#slideBtn').click();
  await captureSequence(page, '11-slide', [60, 180, 320, 500]);
  await page.close();
}

await context.close();
await browser.close();
console.log(`Visual QA captures written to ${outDir}`);
