import { chromium } from 'playwright';
import fs from 'node:fs';

const baseURL = process.env.GRIDIRON_QA_URL || 'http://127.0.0.1:4173';
const outDir = process.env.GRIDIRON_QA_OUT || 'artifacts/visual-qa';
fs.mkdirSync(outDir, { recursive: true });

const launchOptions = { headless: true };
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;

const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('console', (msg) => console.log('[player-lab]', msg.type(), msg.text()));
page.on('pageerror', (error) => {
  pageErrors.push(error.message);
  console.error('[player-lab] pageerror:', error.message);
});

await page.goto(`${baseURL}/player-lab.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__gridironPlayerLab?.ready === true, null, { timeout: 45000 });
await page.waitForTimeout(1200);

const diagnostics = await page.evaluate(() => ({
  clips: window.__gridironPlayerLab.clips.length,
  bones: (() => {
    let count = 0;
    window.__gridironPlayerLab.character.traverse((object) => { if (object.isBone) count += 1; });
    return count;
  })(),
  currentClip: window.__gridironPlayerLab.currentClip?.name || null,
  height: window.__gridironPlayerLab.normalizedHeight,
  errors: [...window.__gridironPlayerLab.errors],
}));

if (diagnostics.clips < 10) throw new Error(`Expected a real animation library, found ${diagnostics.clips} clips`);
if (diagnostics.bones < 20) throw new Error(`Expected a rigged humanoid, found ${diagnostics.bones} bones`);
if (!diagnostics.currentClip) throw new Error('No default animation is playing');
if (diagnostics.height < 1.7 || diagnostics.height > 2.1) throw new Error(`Unexpected normalized character height: ${diagnostics.height}`);
if (diagnostics.errors.length) throw new Error(`Player Lab reported errors: ${diagnostics.errors.join('; ')}`);
if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join('; ')}`);

await page.screenshot({ path: `${outDir}/player-lab-01-idle.png`, fullPage: true });

for (const key of ['jog', 'sprint']) {
  const button = page.locator(`[data-animation="${key}"]`);
  if (await button.isEnabled()) {
    await button.click();
    await page.waitForTimeout(850);
    await page.screenshot({ path: `${outDir}/player-lab-${key}.png`, fullPage: true });
  }
}

await browser.close();
console.log('3D Player Lab QA passed', diagnostics);
