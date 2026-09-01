import { attachPixelQB, updatePixelQB } from './qbSprite.js';

// Compatibility wrapper: main.js already calls these names. Keeping the
// existing API lets us swap the visual pipeline without touching gameplay.
export function attachAuthoredQB(qbGroup, fallbackRig) {
  return attachPixelQB(qbGroup, fallbackRig);
}

export function updateAuthoredQB(controller, dt, { state, moving, throwing, sliding }) {
  updatePixelQB(controller, dt, { state, throwing, sliding });
}
