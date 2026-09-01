import { attachPixelQB, updatePixelQB } from './qbSprite.js';

const THROW_RELEASE_MS = 365;
const THROW_VISUAL_MS = 650;
const LEGACY_THROW_SUPPRESS_MS = 1000;
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

function applyPresentationPose(controller) {
  const sprite = controller?.sprite;
  if (!sprite) return;

  sprite.position.x = 0;
  sprite.position.y = .02;
  sprite.scale.set(BASE_SPRITE_W, BASE_SPRITE_H, 1);

  const frame = controller.frame || 0;
  switch (controller.action) {
    case 'dropback': {
      const bob = [0, .025, .01, .035][frame % 4];
      sprite.position.y += bob;
      if (controller.direction === 'NW') sprite.position.x += .025;
      if (controller.direction === 'NE') sprite.position.x -= .025;
      break;
    }
    case 'run': {
      const bob = [0, .035, .07, .035, 0, .045][frame % 6];
      sprite.position.y += bob;
      break;
    }
    case 'throw': {
      const lean = [0, .006, .012, .018, .01, 0][Math.min(frame, 5)];
      sprite.position.x += lean;
      sprite.position.y += [0, .01, .025, .02, .005, 0][Math.min(frame, 5)];
      break;
    }
    case 'jukeL': {
      sprite.position.x -= [0, .05, .14, .06][Math.min(frame, 3)];
      sprite.position.y += [0, .015, .025, .01][Math.min(frame, 3)];
      break;
    }
    case 'jukeR': {
      sprite.position.x += [0, .05, .14, .06][Math.min(frame, 3)];
      sprite.position.y += [0, .015, .025, .01][Math.min(frame, 3)];
      break;
    }
    case 'slide': {
      sprite.position.y -= [.01, .06, .14, .21][Math.min(frame, 3)];
      break;
    }
    default:
      break;
  }
}

// Compatibility wrapper: main.js already calls these names. Keeping this API
// lets gameplay stay unchanged while the player visual pipeline evolves.
export function attachAuthoredQB(qbGroup, fallbackRig) {
  // The procedural QB is useful as an emergency fallback, but it should never
  // peek through the production sprite while the atlas is loading.
  if (fallbackRig) fallbackRig.visible = false;

  const controller = attachPixelQB(qbGroup, fallbackRig);
  controller.qbGroup = qbGroup;
  controller.visualCleanupApplied = false;
  controller.lastState = 'PRE_SNAP';
  controller.releaseTimer = null;
  controller.manualThrowUntil = 0;
  controller.suppressLegacyThrowUntil = 0;
  controller.throwStartedAt = 0;
  installReleaseSync(controller);
  return controller;
}

export function updateAuthoredQB(controller, dt, { state, moving, throwing, sliding }) {
  if (!controller) return;
  controller.lastState = state;

  if (!controller.releaseSyncInstalled) installReleaseSync(controller);

  if ((state === 'PRE_SNAP' || state === 'DEAD') && controller.releaseTimer) {
    cancelPendingRelease(controller);
  }

  if (controller.ready && !controller.visualCleanupApplied) {
    // The sprite is the complete player visual. Hide every other child on the
    // QB gameplay group so no old rig or helper mesh can peek through.
    for (const child of controller.qbGroup?.children || []) {
      child.visible = child === controller.sprite;
    }
    controller.visualCleanupApplied = true;
  }

  if (controller.failed && controller.fallbackRig) {
    controller.fallbackRig.visible = true;
  }

  const now = performance.now();
  const manualThrow = now < controller.manualThrowUntil;
  const legacyThrowAllowed = now >= controller.suppressLegacyThrowUntil;
  const effectiveThrowing = manualThrow || (throwing && legacyThrowAllowed);

  updatePixelQB(controller, dt, {
    state,
    moving,
    throwing: effectiveThrowing,
    sliding,
  });

  applyPresentationPose(controller);
}
