import { chromium } from 'playwright';
import fs from 'node:fs';

const baseURL = process.env.GRIDIRON_QA_URL || 'http://127.0.0.1:4173';
const outDir = process.env.GRIDIRON_QA_OUT || 'artifacts/visual-qa';
fs.mkdirSync(outDir, { recursive: true });

const launchOptions = { headless: true };
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({
  viewport: { width: 414, height: 896 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  recordVideo: { dir: `${outDir}/raw-video`, size: { width: 414, height: 896 } },
});

async function openFresh(label) {
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.on('console', msg => console.log(`[${label}] browser:`, msg.type(), msg.text()));
  page.on('pageerror', err => console.error(`[${label}] pageerror:`, err));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#viewport canvas'));
  await page.waitForTimeout(450);
  return page;
}

async function closeWithVideo(page, name) {
  const video = page.video();
  await page.close();
  if (video) await video.saveAs(`${outDir}/${name}.webm`);
}
async function shot(page, name) { await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false }); }
async function snap(page) { await page.locator('#snapBtn').click(); await page.waitForTimeout(100); }
async function holdKey(page, key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); }
async function backUpPocket(page, ms = 420) { await holdKey(page, 'ArrowDown', ms); await page.waitForTimeout(40); }

async function dragThrowTouch(page, dx = 36, dy = -185, holdMs = 360, holdShot = null) {
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
      bubbles: true, cancelable: true, composed: true,
      clientX: x, clientY: y, pointerId: 91, pointerType: 'touch',
      isPrimary: true, button: 0, buttons,
    }));
    send('pointerdown', sx, sy, 1);
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      send('pointermove', sx + (ex - sx) * t, sy + (ey - sy) * t, 1);
    }
  }, { sx, sy, ex, ey });

  // Retro Bowl reference: the QB should finish loading/cocking the ball while
  // the player is still holding the aim, then stay cocked until release.
  await page.waitForTimeout(holdMs);
  if (holdShot) await shot(page, holdShot);

  await page.evaluate(({ ex, ey }) => {
    document.querySelector('#viewport canvas').dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, composed: true,
      clientX: ex, clientY: ey, pointerId: 91, pointerType: 'touch',
      isPrimary: true, button: 0, buttons: 0,
    }));
  }, { ex, ey });
}

{
  const page = await openFresh('presnap');
  await shot(page, '01-presnap');
  await closeWithVideo(page, 'presnap');
}

{
  const page = await openFresh('pocket');
  await snap(page);
  await holdKey(page, 'ArrowLeft', 220);
  await shot(page, '02-pocket-left');
  await holdKey(page, 'ArrowRight', 440);
  await shot(page, '03-pocket-right');
  await holdKey(page, 'ArrowDown', 260);
  await shot(page, '04-dropback');
  await closeWithVideo(page, 'pocket');
}

// Hold the aim for a visible windup, then release. This is the primary passing QA.
{
  const page = await openFresh('throw-aim-hold');
  await snap(page);
  await backUpPocket(page, 220);
  await dragThrowTouch(page, -52, -210, 380, '05-aim-cocked');
  await page.waitForTimeout(650);
  await closeWithVideo(page, 'throw-aim-hold');
}

{
  const page = await openFresh('scramble');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowUp', 180);
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(120);
  await closeWithVideo(page, 'scramble');
}

// Explicit regression for the contaminated right-facing source cells / floating 12s.
{
  const page = await openFresh('run-right');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await holdKey(page, 'ArrowRight', 520);
  await page.waitForTimeout(120);
  await closeWithVideo(page, 'run-right');
}

{
  const page = await openFresh('juke');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(500);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(500);
  await closeWithVideo(page, 'juke');
}

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
  await page.waitForTimeout(520);
  await page.mouse.up();
  await page.waitForTimeout(100);
  await closeWithVideo(page, 'power');
}

{
  const page = await openFresh('slide');
  await snap(page);
  await backUpPocket(page);
  await page.locator('#tuckBtn').click();
  await page.locator('#slideBtn').click();
  await page.waitForTimeout(760);
  await closeWithVideo(page, 'slide');
}

await context.close();
await browser.close();
console.log(`Visual QA captures written to ${outDir}`);
