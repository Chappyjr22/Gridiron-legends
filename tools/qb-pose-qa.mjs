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
});

const page = await context.newPage();
page.setDefaultTimeout(7000);
page.on('console', msg => console.log('[qb-pose-qa] browser:', msg.type(), msg.text()));
page.on('pageerror', err => console.error('[qb-pose-qa] pageerror:', err));

await page.goto(`${baseURL}?qbPoseDebug=1`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__gridironQB?.poses?.().length > 0);
await page.waitForTimeout(250);

const poses = [
  'idle_rear',
  'dropback_rear',
  'aim_set_rear',
  'aim_load_rear',
  'aim_cock_rear',
  'aim_hold_rear',
  'release_stride_rear',
  'release_throw_rear',
  'release_follow_rear',
  'release_finish_rear',
  'scramble_rear',
  'run_right',
];

for (let i = 0; i < poses.length; i += 1) {
  const pose = poses[i];
  const result = await page.evaluate((name) => ({
    ok: window.__gridironQB.setPose(name),
    current: window.__gridironQB.current(),
  }), pose);
  if (!result.ok || result.current !== pose) {
    throw new Error(`QB pose failed: ${pose} => ${JSON.stringify(result)}`);
  }
  await page.waitForTimeout(120);
  await page.screenshot({
    path: `${outDir}/pose-${String(i + 1).padStart(2, '0')}-${pose}.png`,
    fullPage: false,
  });
}

await context.close();
await browser.close();
console.log(`QB pose QA captured ${poses.length} forced poses.`);
