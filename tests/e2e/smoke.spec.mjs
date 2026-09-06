// End-to-end smoke test for Gridiron Legends, covering the golden paths of
// the ES-module refactor: menus, a full game start, practice mode, pointer
// and touch controls, the playbook, Formation Lab, and pause/resume/menu.
//
// Run with: npm run test:e2e
import { test, expect } from '@playwright/test';

const NO_ERRORS = [];

function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// The opening kickoff coin flip sometimes gives the CPU the ball first, which
// shows an "opponent drive" result overlay before the player ever sees the
// playbook. Clicking Continue a few times gets past any such overlays.
async function clickContinueUntilVisible(page, selector, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    if (await page.isVisible(selector).catch(() => false)) return;
    await page.click('#btn-continue').catch(() => {});
    await page.waitForTimeout(400);
  }
  await expect(page.locator(selector)).toBeVisible();
}

async function pickFormation(page, index = 0) {
  await page.locator('.formation-btn').nth(index).click();
}

// Picks the first play of the given type ('PASS', 'RUN', 'SCREEN', ...) in
// the currently open play list, independent of play order.
async function pickPlayByType(page, type) {
  const buttons = page.locator('.play-btn[data-play]');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const label = await buttons.nth(i).locator('.play-type').innerText();
    if (label.trim().toUpperCase() === type.toUpperCase()) {
      await buttons.nth(i).click();
      return;
    }
  }
  throw new Error(`No play of type "${type}" found in the current play list`);
}

test.describe('main menu', () => {
  test('shows all primary buttons', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await expect(page.locator('#btn-new-game')).toBeVisible();
    await expect(page.locator('#btn-practice')).toBeVisible();
    await expect(page.locator('#btn-league-hub')).toBeVisible();
    await expect(page.locator('#btn-menu-settings')).toBeVisible();
    await expect(page.locator('#btn-start-editor')).toBeVisible();
    expect(errors).toEqual(NO_ERRORS);
  });

  test('League Hub opens and returns to the main menu', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-league-hub');
    await expect(page.locator('#league-screen')).toHaveClass(/show/);
    await expect(page.locator('#league-schedule-list .matchup-row').first()).toBeVisible();
    await page.click('#btn-league-back');
    await expect(page.locator('#start-screen')).toHaveClass(/show/);
    expect(errors).toEqual(NO_ERRORS);
  });

  test('Settings opens the setup screen in settings-only mode', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-menu-settings');
    await expect(page.locator('#setup-screen')).toHaveClass(/show/);
    await expect(page.locator('#btn-start-play')).toBeHidden();
    await page.click('#btn-setup-back');
    await expect(page.locator('#start-screen')).toHaveClass(/show/);
    expect(errors).toEqual(NO_ERRORS);
  });
});

test.describe('starting a game', () => {
  test('New Game with a chosen team enters the game view', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-new-game');
    await page.selectOption('#team-select', 'sf');
    await expect(page.locator('#team-preview-name')).toHaveText(/Fog/);
    await page.click('#btn-start-play');
    await clickContinueUntilVisible(page, '.formation-btn');
    await expect(page.locator('#game-view')).toBeVisible();
    await expect(page.locator('#hud-user-name')).not.toHaveText('');
    expect(errors).toEqual(NO_ERRORS);
  });

  test('Practice mode enters the game view with a practice HUD', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-practice');
    await expect(page.locator('#game-view')).toBeVisible();
    await expect(page.locator('#hud-quarter')).toHaveText('Practice');
    await expect(page.locator('#hud-clock')).toHaveText('FREE');
    expect(errors).toEqual(NO_ERRORS);
  });
});

test.describe('playbook', () => {
  test('formation and play selection shows the presnap hint', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-practice');
    await expect(page.locator('.formation-btn')).toHaveCount(3);
    await pickFormation(page, 0);
    await expect(page.locator('.play-btn[data-play]').first()).toBeVisible();
    await pickPlayByType(page, 'PASS');
    await expect(page.locator('#presnap-hint')).toBeVisible();
    await expect(page.locator('#presnap-hint')).toContainText('Drag from QB to pass');
    expect(errors).toEqual(NO_ERRORS);
  });

  test('Back to formations returns from the play list', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-practice');
    await pickFormation(page, 1);
    await expect(page.locator('#btn-formation-back')).toBeVisible();
    await page.click('#btn-formation-back');
    await expect(page.locator('.formation-btn')).toHaveCount(3);
    expect(errors).toEqual(NO_ERRORS);
  });
});

test.describe('gameplay controls', () => {
  test('automatic snap and drag-to-throw resolves a pass play', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-practice');
    await pickFormation(page, 0);
    await pickPlayByType(page, 'PASS');
    const canvas = page.locator('#field');
    const box = await canvas.boundingBox();
    // Dragging from mid-canvas snaps the ball automatically and throws.
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.35, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('#result-overlay')).toHaveClass(/show/, { timeout: 5000 });
    await expect(page.locator('#overlay-msg')).not.toHaveText('');
    expect(errors).toEqual(NO_ERRORS);
  });

  test('run-option selection runs the play by tapping the field', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-practice');
    await pickFormation(page, 0);
    await pickPlayByType(page, 'RUN');
    await expect(page.locator('#presnap-hint')).toContainText('Tap the field to run');
    const canvas = page.locator('#field');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.5);
    await expect(page.locator('#result-overlay')).toHaveClass(/show/, { timeout: 5000 });
    await expect(page.locator('#overlay-msg')).toContainText(/Run|Sacked|Scramble/);
    expect(errors).toEqual(NO_ERRORS);
  });

  test('mobile pointer controls: touch tap snaps and runs the play', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 400, height: 700 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.tap('#btn-practice');
    await pickFormation(page, 0);
    await pickPlayByType(page, 'RUN');
    const canvas = page.locator('#field');
    const box = await canvas.boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.55, box.y + box.height * 0.5);
    await expect(page.locator('#result-overlay')).toHaveClass(/show/, { timeout: 5000 });
    expect(errors).toEqual(NO_ERRORS);
    await context.close();
  });
});

test.describe('Formation Lab', () => {
  test('opens, allows dragging a player, and Done returns to the main menu', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-start-editor');
    await expect(page.locator('#edit-panel')).toBeVisible();
    const before = JSON.parse(await page.locator('#edit-json').inputValue());

    // The canvas is a fixed 800x380 drawing surface (native width/height
    // attributes), scaled to fit the viewport; pointerPos() converts a
    // client-pixel offset back to that native space by the same ratio, so
    // fractional coordinates land on the same field position regardless of
    // viewport size. In the default "trips" formation, with the practice
    // default los=20, the QB sits at native canvas pixel (615, 191).
    const canvas = page.locator('#field');
    const box = await canvas.boundingBox();
    const qbStartX = box.x + box.width * (615 / 800);
    const qbStartY = box.y + box.height * (191 / 380);
    await page.mouse.move(qbStartX, qbStartY);
    await page.mouse.down();
    await page.mouse.move(qbStartX - box.width * 0.08, qbStartY - box.height * 0.08, { steps: 5 });
    await page.mouse.up();

    const after = JSON.parse(await page.locator('#edit-json').inputValue());
    expect(after.players.qb).not.toEqual(before.players.qb);

    await page.click('#btn-done-edit');
    await expect(page.locator('#start-screen')).toHaveClass(/show/);
    expect(errors).toEqual(NO_ERRORS);
  });
});

test.describe('pause, resume, and menu', () => {
  test('pause shows the overlay, resume hides it, and main menu returns to the title screen', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    await page.click('#btn-practice');
    await page.click('#btn-pause');
    await expect(page.locator('#pause-overlay')).toHaveClass(/show/);
    await page.click('#btn-resume');
    await expect(page.locator('#pause-overlay')).not.toHaveClass(/show/);

    await page.click('#btn-pause');
    await page.click('#btn-main-menu');
    await expect(page.locator('#start-screen')).toHaveClass(/show/);
    await expect(page.locator('#game-view')).toBeHidden();
    expect(errors).toEqual(NO_ERRORS);
  });
});
