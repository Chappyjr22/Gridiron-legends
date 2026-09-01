import * as THREE from 'three';
import { QB_BASE_ATLAS } from './qbSpriteBase.js';
import { QB_AUTHORED_PASS_ATLAS } from './qbAuthoredSheets.js';
import { QB_AUTHORED_RUN_RIGHT_ATLAS } from './qbRunRightSheet.js';

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

function makeFrameTexture(image, frame, count) {
  const width = Math.round((image.naturalWidth || image.width) / count);
  const height = image.naturalHeight || image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, frame * width, 0, width, height, 0, 0, width, height);

  const source = ctx.getImageData(0, 0, width, height).data;
  const rowBytes = width * 4;
  const rgba = new Uint8Array(source.length);
  // DataTexture rows use a bottom-up orientation for our sprite UVs, so copy the
  // finished authored bitmap row-by-row in reverse order. No pixel is modified.
  for (let y = 0; y < height; y += 1) {
    const srcStart = y * rowBytes;
    const dstStart = (height - 1 - y) * rowBytes;
    rgba.set(source.subarray(srcStart, srcStart + rowBytes), dstStart);
  }

  const texture = new THREE.DataTexture(rgba, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function makeFrameSprite(texture, name) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = name;
  sprite.center.set(0.5, 0);
  sprite.position.set(0, 0, 0);
  sprite.scale.set(1, 1, 1);
  sprite.renderOrder = 3;
  sprite.visible = false;
  return sprite;
}

function makeSpriteSet(image, count, prefix, root) {
  return Array.from({ length: count }, (_, frame) => {
    const sprite = makeFrameSprite(makeFrameTexture(image, frame, count), `${prefix}_${frame}`);
    root.add(sprite);
    return sprite;
  });
}

function dirIndex(direction) {
  const index = DIRS.indexOf(direction);
  return index < 0 ? 0 : index;
}

function setFrame(controller, sheet, frame) {
  const frames = controller.frames[sheet];
  if (!frames?.length) return;
  const safeFrame = Math.max(0, Math.min(frames.length - 1, frame));
  const target = frames[safeFrame];
  if (controller.activeFrame !== target) {
    if (controller.activeFrame) controller.activeFrame.visible = false;
    target.visible = true;
    controller.activeFrame = target;
  }
  controller.sheet = sheet;
  controller.frame = safeFrame;
}

function showBaseDirection(controller, direction) {
  setFrame(controller, 'base', dirIndex(direction));
}

function directionFromVelocity(x, z, fallback = 'N') {
  if (Math.hypot(x, z) < 0.12) return fallback;
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
  const root = new THREE.Group();
  root.name = 'pixel_qb_fullframe_root';
  root.position.set(0, 0.02, 0);
  root.scale.set(3.72, 4.96, 1);
  qbGroup.add(root);

  const controller = {
    ready: false,
    failed: false,
    sprite: root,
    spriteRoot: root,
    frames: {},
    images: [],
    activeFrame: null,
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
    controller.images = [baseImage, passImage, runRightImage];
    controller.frames.base = makeSpriteSet(baseImage, DIRS.length, 'qb_base', root);
    controller.frames.pass = makeSpriteSet(passImage, PASS_FRAMES, 'qb_pass', root);
    controller.frames.runRight = makeSpriteSet(runRightImage, RUN_RIGHT_FRAMES, 'qb_run_right', root);

    if (fallbackRig) fallbackRig.visible = false;
    controller.ready = true;
    showBaseDirection(controller, 'N');
    console.info('[Gridiron Legends] Raw RGBA full-frame QB runtime active');
  }).catch((error) => {
    controller.failed = true;
    root.visible = false;
    if (fallbackRig) fallbackRig.visible = true;
    console.warn('[Gridiron Legends] Authored QB frame decode failed, using fallback.', error);
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
    console.info(`[Gridiron Legends] QB action ${action}`);
  } else {
    controller.elapsed += dt;
  }

  if (action === 'aim') {
    controller.direction = 'N';
    setFrame(controller, 'pass', Math.min(3, Math.floor(controller.elapsed * AIM_FPS)));
    return;
  }

  if (action === 'throw') {
    controller.direction = 'N';
    setFrame(controller, 'pass', 4 + Math.min(2, Math.floor(controller.elapsed * RELEASE_FPS)));
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
    if (controller.direction === 'E') {
      setFrame(controller, 'runRight', Math.floor(controller.elapsed * RUN_FPS) % RUN_RIGHT_FRAMES);
      return;
    }
    showBaseDirection(controller, controller.direction);
    return;
  }

  if (action === 'slide') {
    showBaseDirection(controller, ['W','NW','SW'].includes(controller.direction) ? 'W' : 'E');
    return;
  }

  if (action === 'power') {
    showBaseDirection(controller, 'N');
    return;
  }

  if (state === 'PRE_SNAP') controller.direction = 'N';
  else if (speed > 0.3) controller.direction = stabilizeDirection(controller, directionFromVelocity(vx, vz, controller.direction), dt);
  showBaseDirection(controller, controller.direction);
}
