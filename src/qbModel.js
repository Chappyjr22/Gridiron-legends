import { attachPixelQB, updatePixelQB } from './qbSprite.js';

// Retro-Bowl-inspired timing: the QB winds up while AIMING. Finger release only
// needs a short beat for stride/release before the real football leaves his hand.
const THROW_RELEASE_MS = 110;
const THROW_VISUAL_MS = 360;
const LEGACY_THROW_SUPPRESS_MS = 760;
const BASE_SPRITE_W = 3.72;
const BASE_SPRITE_H = 4.96;

function makeSyntheticPointerUp(source) {
  try {
    const event = new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: source.clientX || 0,
      clientY: source.clientY || 0,
      pointerId: source.pointerId || 1,
      pointerType: source.pointerType || 'touch',
      isPrimary: source.isPrimary !== false,
      button: 0,
      buttons: 0,
    });
    event.__gridironQbRelease = true;
    return event;
  } catch {
    const event = new Event('pointerup', { bubbles: true, cancelable: true });
    event.__gridironQbRelease = true;
    return event;
  }
}

function cancelPendingRelease(controller) {
  if (controller?.releaseTimer) clearTimeout(controller.releaseTimer);
  if (!controller) return;
  controller.releaseTimer = null;
  controller.manualThrowUntil = 0;
}

function beginTimedThrow(controller, event) {
  if (!controller?.ready || controller.releaseTimer) return;
  const now = performance.now();
  controller.manualThrowUntil = now + THROW_VISUAL_MS;
  controller.suppressLegacyThrowUntil = now + LEGACY_THROW_SUPPRESS_MS;
  controller.throwStartedAt = now;
  const target = event.currentTarget || event.target;
  controller.releaseTimer = setTimeout(() => {
    controller.releaseTimer = null;
    if (!target || controller.lastState !== 'AIMING') return;
    target.dispatchEvent(makeSyntheticPointerUp(event));
  }, THROW_RELEASE_MS);
}

function installReleaseSync(controller) {
  const canvas = document.querySelector('#viewport canvas');
  if (!canvas || controller.releaseSyncInstalled) return;
  const intercept = (event) => {
    if (event.__gridironQbRelease || controller.lastState !== 'AIMING' || !controller.ready) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    beginTimedThrow(controller, event);
  };
  canvas.addEventListener('pointerup', intercept, true);
  canvas.addEventListener('pointercancel', intercept, true);
  controller.releaseSyncInstalled = true;
  controller.releaseSyncTarget = canvas;
  controller.releaseSyncHandler = intercept;
}

function installPowerSync(controller) {
  const button = document.querySelector('#powerBtn');
  if (!button || controller.powerSyncInstalled) return;
  const on = () => { controller.powerHeld = true; };
  const off = () => { controller.powerHeld = false; };
  button.addEventListener('pointerdown', on, true);
  for (const type of ['pointerup','pointercancel','pointerleave']) button.addEventListener(type, off, true);
  controller.powerSyncInstalled = true;
}

function applyPresentationPose(controller) {
  const sprite = controller?.sprite;
  if (!sprite) return;
  sprite.position.x = 0;
  sprite.position.y = .02;
  sprite.scale.set(BASE_SPRITE_W, BASE_SPRITE_H, 1);
  const frame = controller.frame || 0;
  switch (controller.action) {
    case 'dropback': sprite.position.y += [0,.012,.004,.018][frame % 4]; break;
    case 'run': sprite.position.y += [0,.015,.03,.01,0,.02][frame % 6]; break;
    case 'aim': sprite.position.y += [0,.004,.009,.012][Math.min(frame,3)]; break;
    case 'throw': sprite.position.y += [.012,.005,0][Math.min(frame,2)]; break;
    case 'jukeL': sprite.position.x -= [0,.025,.065,.025][Math.min(frame,3)]; break;
    case 'jukeR': sprite.position.x += [0,.025,.065,.025][Math.min(frame,3)]; break;
    case 'slide': sprite.position.y += [0,.002,.004,.006][Math.min(frame,3)]; break;
    case 'power': sprite.position.y -= [0,.003,.006,.003][Math.min(frame,3)]; break;
    default: break;
  }
}

export function attachAuthoredQB(qbGroup, fallbackRig) {
  if (fallbackRig) fallbackRig.visible = false;
  const controller = attachPixelQB(qbGroup, fallbackRig);
  controller.qbGroup = qbGroup;
  controller.visualCleanupApplied = false;
  controller.lastState = 'PRE_SNAP';
  controller.releaseTimer = null;
  controller.manualThrowUntil = 0;
  controller.suppressLegacyThrowUntil = 0;
  controller.throwStartedAt = 0;
  controller.powerHeld = false;
  installReleaseSync(controller);
  installPowerSync(controller);
  return controller;
}

export function updateAuthoredQB(controller, dt, { state, moving, throwing, sliding }) {
  if (!controller) return;
  controller.lastState = state;
  if (!controller.releaseSyncInstalled) installReleaseSync(controller);
  if (!controller.powerSyncInstalled) installPowerSync(controller);
  if ((state === 'PRE_SNAP' || state === 'DEAD') && controller.releaseTimer) cancelPendingRelease(controller);
  if (state !== 'SCRAMBLE') controller.powerHeld = false;

  if (controller.ready && !controller.visualCleanupApplied) {
    for (const child of controller.qbGroup?.children || []) child.visible = child === controller.sprite;
    controller.visualCleanupApplied = true;
  }
  if (controller.failed && controller.fallbackRig) controller.fallbackRig.visible = true;

  const now = performance.now();
  const manualThrow = now < controller.manualThrowUntil;
  const legacyThrowAllowed = now >= controller.suppressLegacyThrowUntil;
  const effectiveThrowing = manualThrow || (throwing && legacyThrowAllowed);
  const effectiveAiming = state === 'AIMING' && !manualThrow;

  updatePixelQB(controller, dt, {
    state,
    moving,
    aiming: effectiveAiming,
    throwing: effectiveThrowing,
    sliding,
    power: controller.powerHeld && state === 'SCRAMBLE',
  });
  applyPresentationPose(controller);
}
