import { attachPixelQB, updatePixelQB } from './qbSprite.js';

// Compatibility wrapper: main.js already calls these names. Keeping this API
// lets gameplay stay unchanged while the player visual pipeline evolves.
export function attachAuthoredQB(qbGroup, fallbackRig) {
  // The procedural QB is useful as an emergency fallback, but it should never
  // peek through the production sprite while the atlas is loading.
  if (fallbackRig) fallbackRig.visible = false;

  const controller = attachPixelQB(qbGroup, fallbackRig);
  controller.qbGroup = qbGroup;
  controller.visualCleanupApplied = false;
  return controller;
}

export function updateAuthoredQB(controller, dt, { state, moving, throwing, sliding }) {
  if (controller?.ready && !controller.visualCleanupApplied) {
    // The sprite is now the complete player visual. Hide every other child on
    // the QB gameplay group, including the old procedural rig and the temporary
    // ground-shadow mesh that could read as extra feet/model fragments.
    for (const child of controller.qbGroup?.children || []) {
      child.visible = child === controller.sprite;
    }
    controller.visualCleanupApplied = true;
  }

  if (controller?.failed && controller.fallbackRig) {
    controller.fallbackRig.visible = true;
  }

  updatePixelQB(controller, dt, { state, moving, throwing, sliding });
}
