import * as THREE from 'three';

const ATLAS_URL = '/assets/sprites/qb_lv_pixel_v1.png';
const COLS = 8;
const ROWS = 12;
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const ROW = {
  idle: [0],
  run: [1,2,3,4],
  throw: [5,6,7,8],
  slide: [9,10,11],
};

function directionFromVector(x, z, fallback = 'N') {
  const mag = Math.hypot(x, z);
  if (mag < 0.08) return fallback;

  const horizontal = Math.abs(x) > mag * 0.38;
  const vertical = Math.abs(z) > mag * 0.38;

  // World +X appears screen-left from our behind-offense camera.
  if (z > 0 && horizontal) return x > 0 ? 'NW' : 'NE';
  if (z < 0 && horizontal) return x > 0 ? 'SW' : 'SE';
  if (vertical) return z > 0 ? 'N' : 'S';
  return x > 0 ? 'W' : 'E';
}

function setFrame(controller, action, frameIndex, direction) {
  const texture = controller.texture;
  if (!texture) return;
  const dirIndex = Math.max(0, DIRS.indexOf(direction));
  const rows = ROW[action] || ROW.idle;
  const rowIndex = rows[Math.max(0, Math.min(rows.length - 1, frameIndex))];

  texture.repeat.set(1 / COLS, 1 / ROWS);
  texture.offset.x = dirIndex / COLS;
  // Texture origin is bottom-left while atlas rows are authored top-down.
  texture.offset.y = 1 - ((rowIndex + 1) / ROWS);
  texture.needsUpdate = true;
}

export function attachPixelQB(qbGroup, fallbackRig) {
  const controller = {
    ready: false,
    failed: false,
    sprite: null,
    texture: null,
    action: 'idle',
    direction: 'N',
    elapsed: 0,
    frame: 0,
    lastThrowing: false,
    lastSliding: false,
    fallbackRig,
  };

  const loader = new THREE.TextureLoader();
  loader.load(
    ATLAS_URL,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.45,
        depthWrite: true,
        depthTest: true,
        toneMapped: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.name = 'pixel_qb_v1';
      sprite.center.set(0.5, 0.0);
      sprite.position.set(0, 0.02, 0);
      sprite.scale.set(2.95, 3.93, 1);
      sprite.renderOrder = 3;

      qbGroup.add(sprite);
      if (fallbackRig) fallbackRig.visible = false;
      controller.sprite = sprite;
      controller.texture = texture;
      controller.ready = true;
      setFrame(controller, 'idle', 0, 'N');
      console.info('[Gridiron Legends] True pixel QB sprite loaded', ATLAS_URL);
    },
    undefined,
    (error) => {
      controller.failed = true;
      if (fallbackRig) fallbackRig.visible = true;
      console.warn('[Gridiron Legends] Pixel QB sprite unavailable, using 3D fallback.', error);
    },
  );

  return controller;
}

export function updatePixelQB(controller, dt, { state, moveX = 0, moveZ = 0, throwing = false, sliding = false }) {
  if (!controller?.ready) return;

  let nextAction = 'idle';
  if (sliding) nextAction = 'slide';
  else if (throwing) nextAction = 'throw';
  else if (state === 'SCRAMBLE' || Math.hypot(moveX, moveZ) > 0.12) nextAction = 'run';

  const nextDirection = directionFromVector(moveX, moveZ, controller.direction || 'N');
  const actionChanged = nextAction !== controller.action;
  const directionChanged = nextDirection !== controller.direction;

  if (actionChanged) {
    controller.action = nextAction;
    controller.elapsed = 0;
    controller.frame = 0;
  } else {
    controller.elapsed += dt;
  }
  controller.direction = nextDirection;

  const frames = ROW[nextAction];
  let frame = 0;
  if (nextAction === 'run') frame = Math.floor(controller.elapsed * 10) % frames.length;
  else if (nextAction === 'throw') frame = Math.min(frames.length - 1, Math.floor(controller.elapsed * 9));
  else if (nextAction === 'slide') frame = Math.min(frames.length - 1, Math.floor(controller.elapsed * 7));

  if (frame !== controller.frame || actionChanged || directionChanged) {
    controller.frame = frame;
    setFrame(controller, nextAction, frame, nextDirection);
  }

  controller.lastThrowing = throwing;
  controller.lastSliding = sliding;
}
