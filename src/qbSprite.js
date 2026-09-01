import * as THREE from 'three';
import { QB_BASE_ATLAS } from './qbSpriteBase.js';
import { QB_AUTHORED_PASS_ATLAS } from './qbAuthoredSheets.js';
import { QB_AUTHORED_RUN_RIGHT_POSE } from './qbRunRightSheet.js';

const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const FRAME_W = 96;
const FRAME_H = 128;
const PASS_FRAMES = 8;
const AIM_FPS = 8;
const RELEASE_FPS = 12;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function makeDisplaySprite() {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = false;

  const staging = document.createElement('canvas');
  staging.width = FRAME_W;
  staging.height = FRAME_H;
  const stagingCtx = staging.getContext('2d', { alpha: true });
  stagingCtx.imageSmoothingEnabled = false;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.name = 'pixel_qb_single_pose_sprite';
  sprite.center.set(0.5, 0);
  sprite.position.set(0, 0.02, 0);
  sprite.scale.set(3.72, 4.96, 1);
  sprite.renderOrder = 3;
  sprite.frustumCulled = false;
  sprite.visible = true;

  return { canvas, ctx, staging, stagingCtx, texture, material, sprite };
}

function atlasPose(image, frame, count) {
  return { type: 'atlas', image, frame, count };
}

function imagePose(image) {
  return { type: 'image', image };
}

function drawPose(controller, pose) {
  if (!pose?.image || !controller?.stagingCtx || !controller?.ctx) return false;

  const { stagingCtx, staging, ctx } = controller;
  stagingCtx.clearRect(0, 0, FRAME_W, FRAME_H);

  try {
    if (pose.type === 'atlas') {
      const sourceWidth = Math.round((pose.image.naturalWidth || pose.image.width) / pose.count);
      const sourceHeight = pose.image.naturalHeight || pose.image.height;
      stagingCtx.drawImage(
        pose.image,
        pose.frame * sourceWidth, 0, sourceWidth, sourceHeight,
        0, 0, FRAME_W, FRAME_H,
      );
    } else {
      stagingCtx.drawImage(
        pose.image,
        0, 0,
        pose.image.naturalWidth || pose.image.width,
        pose.image.naturalHeight || pose.image.height,
        0, 0, FRAME_W, FRAME_H,
      );
    }
  } catch (error) {
    console.warn('[Gridiron Legends] QB pose draw failed; keeping last valid pose.', error);
    return false;
  }

  // The live sprite is never cleared until a complete replacement pose exists.
  // Missing or invalid states therefore leave the last good player visible.
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.drawImage(staging, 0, 0);
  controller.texture.needsUpdate = true;
  controller.sprite.visible = true;
  return true;
}

export function setQBPose(controller, poseName) {
  if (!controller?.ready) return false;
  const pose = controller.poseRegistry?.[poseName];
  if (!pose) {
    console.warn(`[Gridiron Legends] Missing QB pose: ${poseName}; keeping ${controller.currentPose || 'last valid pose'}`);
    return false;
  }
  if (controller.currentPose === poseName) return true;
  if (!drawPose(controller, pose)) return false;
  controller.currentPose = poseName;
  return true;
}

function registerBaseDirections(controller, baseImage) {
  DIRS.forEach((direction, frame) => {
    controller.poseRegistry[`base_${direction}`] = atlasPose(baseImage, frame, DIRS.length);
  });
}

function registerProductionPoses(controller, baseImage, passImage, runRightImage) {
  registerBaseDirections(controller, baseImage);

  controller.poseRegistry.idle_rear = atlasPose(baseImage, 0, DIRS.length);
  controller.poseRegistry.dropback_rear = atlasPose(passImage, 0, PASS_FRAMES);
  controller.poseRegistry.aim_set_rear = atlasPose(passImage, 0, PASS_FRAMES);
  controller.poseRegistry.aim_load_rear = atlasPose(passImage, 1, PASS_FRAMES);
  controller.poseRegistry.aim_cock_rear = atlasPose(passImage, 2, PASS_FRAMES);
  controller.poseRegistry.aim_hold_rear = atlasPose(passImage, 3, PASS_FRAMES);
  controller.poseRegistry.release_stride_rear = atlasPose(passImage, 4, PASS_FRAMES);
  controller.poseRegistry.release_throw_rear = atlasPose(passImage, 5, PASS_FRAMES);
  controller.poseRegistry.release_follow_rear = atlasPose(passImage, 6, PASS_FRAMES);
  controller.poseRegistry.release_finish_rear = atlasPose(passImage, 7, PASS_FRAMES);

  // Dedicated rear tuck art comes next. Until then, keep the known-good complete
  // rear silhouette rather than constructing a fake running body at runtime.
  controller.poseRegistry.scramble_rear = atlasPose(baseImage, 0, DIRS.length);
  controller.poseRegistry.run_right = imagePose(runRightImage);
}

function directionFromVelocity(x, z, fallback = 'N') {
  if (Math.hypot(x, z) < 0.12) return fallback;
  const angle = Math.atan2(x, z);
  const octant = Math.round(angle / (Math.PI / 4));
  const index = (octant + 8) % 8;
  return ['N','NW','W','SW','S','SE','E','NE'][index];
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

function installPoseDebug(controller) {
  if (new URLSearchParams(window.location.search).get('qbPoseDebug') !== '1') return;

  window.__gridironQB = {
    poses: () => Object.keys(controller.poseRegistry),
    current: () => controller.currentPose,
    setPose: (name) => {
      controller.forcedPose = name;
      return setQBPose(controller, name);
    },
    clearPose: () => {
      controller.forcedPose = null;
      return true;
    },
  };
  console.info('[Gridiron Legends] QB pose debug API active');
}

export function attachPixelQB(qbGroup, fallbackRig) {
  const display = makeDisplaySprite();
  qbGroup.add(display.sprite);

  const controller = {
    ready: false,
    failed: false,
    sprite: display.sprite,
    spriteRoot: display.sprite,
    canvas: display.canvas,
    ctx: display.ctx,
    staging: display.staging,
    stagingCtx: display.stagingCtx,
    texture: display.texture,
    material: display.material,
    poseRegistry: {},
    currentPose: null,
    forcedPose: null,
    images: [],
    group: qbGroup,
    fallbackRig,
    action: 'idle',
    direction: 'N',
    elapsed: 0,
    prev: qbGroup.position.clone(),
    pendingDirection: null,
    pendingDirectionTime: 0,
  };

  Promise.all([
    loadImage(QB_BASE_ATLAS),
    loadImage(QB_AUTHORED_PASS_ATLAS),
    loadImage(QB_AUTHORED_RUN_RIGHT_POSE),
  ]).then(([baseImage, passImage, runRightImage]) => {
    controller.images = [baseImage, passImage, runRightImage];
    registerProductionPoses(controller, baseImage, passImage, runRightImage);
    controller.ready = true;

    if (!setQBPose(controller, 'idle_rear')) throw new Error('Could not render initial QB pose');
    if (fallbackRig) fallbackRig.visible = false;
    installPoseDebug(controller);
    console.info('[Gridiron Legends] Single-canvas authored QB pose runtime active');
  }).catch((error) => {
    controller.failed = true;
    display.sprite.visible = false;
    if (fallbackRig) fallbackRig.visible = true;
    console.warn('[Gridiron Legends] Authored QB pose runtime failed, using fallback.', error);
  });

  return controller;
}

export function updatePixelQB(controller, dt, { state, moving = false, aiming = false, throwing = false, sliding = false, power = false }) {
  if (!controller?.ready) return;

  if (controller.forcedPose) {
    setQBPose(controller, controller.forcedPose);
    return;
  }

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
    const aimPoses = ['aim_set_rear', 'aim_load_rear', 'aim_cock_rear', 'aim_hold_rear'];
    setQBPose(controller, aimPoses[Math.min(3, Math.floor(controller.elapsed * AIM_FPS))]);
    return;
  }

  if (action === 'throw') {
    controller.direction = 'N';
    const releasePoses = ['release_stride_rear', 'release_throw_rear', 'release_follow_rear', 'release_finish_rear'];
    setQBPose(controller, releasePoses[Math.min(3, Math.floor(controller.elapsed * RELEASE_FPS))]);
    return;
  }

  if (action === 'dropback') {
    controller.direction = 'N';
    setQBPose(controller, 'dropback_rear');
    return;
  }

  if (action === 'run') {
    const candidate = speed > 0.3 ? directionFromVelocity(vx, vz, controller.direction) : controller.direction;
    controller.direction = stabilizeDirection(controller, candidate, dt);

    if (controller.direction === 'E') {
      setQBPose(controller, 'run_right');
      return;
    }

    if (controller.direction === 'N') {
      setQBPose(controller, 'scramble_rear');
      return;
    }

    setQBPose(controller, `base_${controller.direction}`);
    return;
  }

  if (action === 'slide') {
    setQBPose(controller, ['W','NW','SW'].includes(controller.direction) ? 'base_W' : 'base_E');
    return;
  }

  if (action === 'power') {
    setQBPose(controller, 'scramble_rear');
    return;
  }

  if (state === 'PRE_SNAP') {
    controller.direction = 'N';
    setQBPose(controller, 'idle_rear');
    return;
  }

  if (speed > 0.3) controller.direction = stabilizeDirection(controller, directionFromVelocity(vx, vz, controller.direction), dt);
  setQBPose(controller, controller.direction === 'N' ? 'idle_rear' : `base_${controller.direction}`);
}
