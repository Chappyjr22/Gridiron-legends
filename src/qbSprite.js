import * as THREE from 'three';
import { QB_BASE_ATLAS } from './qbSpriteBase.js';
import { QB_AUTHORED_PASS_ATLAS, QB_AUTHORED_RUN_RIGHT_ATLAS } from './qbAuthoredSheets.js';

const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const PASS_FRAMES = 8;
const RUN_RIGHT_FRAMES = 6;
const AIM_FPS = 8;
const RELEASE_FPS = 12;
const RUN_FPS = 10;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function makeTexture(image) {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function dirIndex(direction) {
  const index = DIRS.indexOf(direction);
  return index < 0 ? 0 : index;
}

function setFrame(controller, sheet, frame, count) {
  const texture = controller.textures[sheet];
  if (!texture || !controller.material) return;
  if (controller.material.map !== texture) {
    controller.material.map = texture;
    controller.material.needsUpdate = true;
  }
  texture.repeat.set(1 / count, 1);
  texture.offset.set(Math.max(0, Math.min(count - 1, frame)) / count, 0);
  texture.needsUpdate = true;
  controller.sheet = sheet;
  controller.frame = frame;
}

function showBaseDirection(controller, direction) {
  setFrame(controller, 'base', dirIndex(direction), DIRS.length);
}

function directionFromVelocity(x, z, fallback = 'N') {
  const magnitude = Math.hypot(x, z);
  if (magnitude < 0.12) return fallback;
  const angle = Math.atan2(x, z);
  const octant = Math.round(angle / (Math.PI / 4));
  const index = (octant + 8) % 8;
  return ['N','NW','W','SW','S','SE','E','NE'][index];
}

function pocketDirection(vx) {
  if (vx > 1.0) return 'NW';
  if (vx < -1.0) return 'NE';
  return 'N';
}

function stabilizeDirection(controller, candidate, dt) {
  if (!candidate || candidate === controller.direction) {
    controller.pendingDirection = null;
    controller.pendingDirectionTime = 0;
    return controller.direction || candidate || 'N';
  }
  if (candidate !== controller.pendingDirection) {
    controller.pendingDirection = candidate;
    controller.pendingDirectionTime = 0;
  } else {
    controller.pendingDirectionTime += dt;
  }
  if (controller.pendingDirectionTime >= 0.075) {
    controller.pendingDirection = null;
    controller.pendingDirectionTime = 0;
    return candidate;
  }
  return controller.direction || 'N';
}

export function attachPixelQB(qbGroup, fallbackRig) {
  const controller = {
    ready: false,
    failed: false,
    sprite: null,
    material: null,
    textures: {},
    group: qbGroup,
    fallbackRig,
    action: 'idle',
    direction: 'N',
    elapsed: 0,
    frame: 0,
    sheet: 'base',
    prev: qbGroup.position.clone(),
    pendingDirection: null,
    pendingDirectionTime: 0,
  };

  Promise.all([
    loadImage(QB_BASE_ATLAS),
    loadImage(QB_AUTHORED_PASS_ATLAS),
    loadImage(QB_AUTHORED_RUN_RIGHT_ATLAS),
  ]).then(([baseImage, passImage, runRightImage]) => {
    controller.textures.base = makeTexture(baseImage);
    controller.textures.pass = makeTexture(passImage);
    controller.textures.runRight = makeTexture(runRightImage);

    const material = new THREE.SpriteMaterial({
      map: controller.textures.base,
      transparent: true,
      alphaTest: 0.18,
      depthWrite: true,
      depthTest: true,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = 'pixel_qb_authored_fullframe_v1';
    sprite.center.set(0.5, 0);
    sprite.position.set(0, 0.02, 0);
    sprite.scale.set(3.72, 4.96, 1);
    sprite.renderOrder = 3;
    qbGroup.add(sprite);

    if (fallbackRig) fallbackRig.visible = false;
    controller.material = material;
    controller.sprite = sprite;
    controller.ready = true;
    showBaseDirection(controller, 'N');
    console.info('[Gridiron Legends] Full-frame authored QB sprite runtime active');
  }).catch((error) => {
    controller.failed = true;
    if (fallbackRig) fallbackRig.visible = true;
    console.warn('[Gridiron Legends] Authored QB sheets failed, using fallback.', error);
  });

  return controller;
}

export function updatePixelQB(controller, dt, { state, moving = false, aiming = false, throwing = false, sliding = false, power = false }) {
  if (!controller?.ready) return;

  const vx = (controller.group.position.x - controller.prev.x) / Math.max(dt, 0.001);
  const vz = (controller.group.position.z - controller.prev.z) / Math.max(dt, 0.001);
  controller.prev.copy(controller.group.position);
  const speed = Math.hypot(vx, vz);

  let action = 'idle';
  if (sliding) action = 'slide';
  else if (throwing) action = 'throw';
  else if (aiming) action = 'aim';
  else if ((state === 'SCRAMBLE' || state === 'RUN') && power) action = 'power';
  else if ((state === 'SCRAMBLE' || state === 'RUN') && (moving || speed > 0.3)) action = 'run';
  else if ((state === 'POCKET' || state === 'AIMING') && (moving || speed > 0.3)) action = 'dropback';

  const changed = action !== controller.action;
  if (changed) {
    controller.action = action;
    controller.elapsed = 0;
  } else {
    controller.elapsed += dt;
  }

  if (action === 'aim') {
    // Complete authored frames 0-3: set -> load -> cock -> hold.
    const frame = Math.min(3, Math.floor(controller.elapsed * AIM_FPS));
    controller.direction = 'N';
    setFrame(controller, 'pass', frame, PASS_FRAMES);
    return;
  }

  if (action === 'throw') {
    // Complete authored frames 4-6: stride -> release -> follow-through.
    const releaseFrame = Math.min(2, Math.floor(controller.elapsed * RELEASE_FPS));
    controller.direction = 'N';
    setFrame(controller, 'pass', 4 + releaseFrame, PASS_FRAMES);
    return;
  }

  if (action === 'dropback') {
    controller.direction = pocketDirection(vx);
    showBaseDirection(controller, controller.direction);
    return;
  }

  if (action === 'run') {
    const candidate = speed > 0.3 ? directionFromVelocity(vx, vz, controller.direction) : controller.direction;
    controller.direction = stabilizeDirection(controller, candidate, dt);

    // First production run sequence: right-facing. It is six complete sprites,
    // so there is no neighboring-pose bleed and no detached #12 fragments.
    if (controller.direction === 'E') {
      const frame = Math.floor(controller.elapsed * RUN_FPS) % RUN_RIGHT_FRAMES;
      setFrame(controller, 'runRight', frame, RUN_RIGHT_FRAMES);
      return;
    }

    // Other directions remain clean static source poses until their authored
    // full-frame run sheets are completed. No procedural limb animation here.
    showBaseDirection(controller, controller.direction);
    return;
  }

  if (action === 'slide') {
    // Intentional temporary fallback. Slide will receive its own authored sheet.
    const direction = ['W','NW','SW'].includes(controller.direction) ? 'W' : 'E';
    showBaseDirection(controller, direction);
    return;
  }

  if (action === 'power') {
    // Intentional temporary fallback. Power will receive its own authored sheet.
    showBaseDirection(controller, 'N');
    return;
  }

  if (state === 'PRE_SNAP') controller.direction = 'N';
  else if (speed > 0.3) controller.direction = stabilizeDirection(controller, directionFromVelocity(vx, vz, controller.direction), dt);
  showBaseDirection(controller, controller.direction);
}
