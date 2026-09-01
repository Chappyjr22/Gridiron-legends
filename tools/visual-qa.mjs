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
  page.setDefaultTimeout(6000);
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

async function backUpPocket(page, ms = 720) {
  await holdKey(page, 'ArrowDown', ms);
  await page.waitForTimeout(60);
}

async function dragThrowTouch(page, dx = 36, dy = -185) {
  const canvas = page.locator('#viewport canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas missing');
  const sx = box.x + box.width * 0.5;
  const sy = box.y + box.height * 0.70;
  const ex = sx + dx;
  const ey = sy + dy;

  await page.evaluate(({ sx, sy, ex, ey }) => {
    const canvas = document.querySelector('#viewport canvas');
    const send = (type, x, y, buttons) => canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons,
    }));
    send('pointerdown', sx, sy, 1);
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      send('pointermove', sx + (ex - sx) * t, sy + (ey - sy) * t, 1);
    }
  }, { sx, sy, ex, ey });
  await page.waitForTimeout(90);
  await page.evaluate(({ ex, ey }) => {
    const canvas = document.querySelector('#viewport canvas');
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: ex,
      clientY: ey,
      pointerId: 91,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 0,
    }));
  }, { ex, ey });
}

async function holdKey(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function captureSequence(page, prefix, delays) {
  let elapsed = 0;
  for (const delay of delays) {
    await page.waitForTimeout(Math.max(0, delay - elapsed));
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
  await holdKey(page, 'ArrowDown', 320);
  await shot(page, '04-dropback');
  await page.close();
}

// 3. Throw, frame by frame around a real touch release
{
  const page = await openFresh('throw');
  await snap(page);
  await backUpPocket(page, 320);
  await dragThrowTouch(page, -52, -210);
  await captureSequence(page, '05-throw', [55, 125, 205, 285, 355, 420, 500, 590, 700]);
  await page.close();
}

// 4. Scramble + diagonal direction changes, starting deep enough to avoid contact
{
  const page = await openFresh('scramble');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowUp', 150);
  await shot(page, '06-scramble-forward');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(150);
  await shot(page, '07-scramble-diagonal');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowUp');
  await page.close();
}

// 5. Jukes from deep pocket space so the full 4 frames can finish
{
  const page = await openFresh('juke');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await page.keyboard.press('KeyQ');
  await captureSequence(page, '08-juke-left', [35, 85, 135, 200, 280]);
  await page.waitForTimeout(500);
  await page.keyboard.press('KeyE');
  await captureSequence(page, '09-juke-right', [35, 85, 135, 200, 280]);
  await page.close();
}

// 6. Power move, no defender contact required for animation inspection
{
  const page = await openFresh('power');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  const power = page.locator('#powerBtn');
  const box = await power.boundingBox();
  if (!box) throw new Error('power button missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await captureSequence(page, '10-power', [45, 110, 180, 260, 360]);
  await page.mouse.up();
  await page.close();
}

// 7. Slide from deep pocket space so the full non-looping sequence is visible
{
  const page = await openFresh('slide');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await page.locator('#slideBtn').click();
  await captureSequence(page, '11-slide', [45, 120, 220, 350, 500, 650]);
  await page.close();
}

await context.close();
await browser.close();
console.log(`Visual QA captures written to ${outDir}`);
