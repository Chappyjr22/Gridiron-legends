import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = '/assets/vendor/quaternius/humanoid-base.glb';
const ANIMATION_URL = '/assets/vendor/quaternius/universal-animation-library.glb';
const LOOPING = new Set(['idle', 'dropback', 'run']);

const loader = new GLTFLoader();
const loadGLB = (url) => new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));

const mats = {
  jersey: new THREE.MeshToonMaterial({ color: 0x171717 }),
  rust: new THREE.MeshToonMaterial({ color: 0xa74626 }),
  ivory: new THREE.MeshToonMaterial({ color: 0xe7d9bc }),
  helmet: new THREE.MeshToonMaterial({ color: 0x101214 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.55, metalness: 0.28, flatShading: true }),
  white: new THREE.MeshToonMaterial({ color: 0xf2ead8 }),
};

function numberMaterial(number = '12') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 78px Arial Black, Arial';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#a74626';
  ctx.strokeText(number, 64, 66);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#101214';
  ctx.strokeText(number, 64, 66);
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(number, 64, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
}

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function barBetween(parent, a, b, radius = 0.014, material = mats.steel) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const dir = end.clone().sub(start);
  const bar = addMesh(parent, new THREE.CylinderGeometry(radius, radius, dir.length(), 6), material);
  bar.position.copy(start).add(end).multiplyScalar(0.5);
  bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return bar;
}

function find(root, name) {
  return root.getObjectByName(name) || null;
}

function stylizeBase(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;

    if (obj.name === 'SuperHero_Male' || obj.material?.name === 'MI_Superhero_Male') {
      obj.material = mats.jersey;
    } else {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const material of materials) {
        if (!material) continue;
        if ('flatShading' in material) material.flatShading = true;
        if (material.map) {
          material.map.magFilter = THREE.NearestFilter;
          material.map.minFilter = THREE.NearestFilter;
          material.map.needsUpdate = true;
        }
        material.needsUpdate = true;
      }
    }
  });
}

function buildFootballGear(root) {
  const head = find(root, 'Head');
  const chest = find(root, 'spine_03');
  const midSpine = find(root, 'spine_02');
  const pelvis = find(root, 'pelvis');
  const thighL = find(root, 'thigh_l');
  const thighR = find(root, 'thigh_r');

  if (head) {
    const helmet = new THREE.Group();
    helmet.name = 'GL_Helmet';
    head.add(helmet);
    addMesh(helmet, new THREE.SphereGeometry(0.205, 12, 8), mats.helmet, [0, 0.075, -0.005], [0, 0, 0], [1.10, 0.96, 1.15]);
    addMesh(helmet, new THREE.BoxGeometry(0.035, 0.020, 0.43), mats.rust, [0, 0.235, -0.005]);
    addMesh(helmet, new THREE.BoxGeometry(0.26, 0.045, 0.07), mats.helmet, [0, -0.035, 0.195]);
    barBetween(helmet, [-0.17, 0.07, 0.19], [0.17, 0.07, 0.19]);
    barBetween(helmet, [-0.16, -0.015, 0.225], [0.16, -0.015, 0.225]);
    barBetween(helmet, [-0.18, 0.075, 0.18], [-0.19, -0.08, 0.23]);
    barBetween(helmet, [0.18, 0.075, 0.18], [0.19, -0.08, 0.23]);
    barBetween(helmet, [-0.19, -0.08, 0.23], [0.19, -0.08, 0.23], 0.012);
  }

  if (chest) {
    const pads = new THREE.Group();
    pads.name = 'GL_ShoulderPads';
    chest.add(pads);
    addMesh(pads, new THREE.BoxGeometry(0.88, 0.18, 0.42), mats.jersey, [0, 0.035, 0]);
    addMesh(pads, new THREE.SphereGeometry(0.19, 8, 6), mats.jersey, [-0.43, 0.005, 0], [0, 0, 0], [1.15, 0.80, 1.0]);
    addMesh(pads, new THREE.SphereGeometry(0.19, 8, 6), mats.jersey, [0.43, 0.005, 0], [0, 0, 0], [1.15, 0.80, 1.0]);
    addMesh(pads, new THREE.BoxGeometry(0.035, 0.16, 0.40), mats.rust, [-0.45, 0.01, 0]);
    addMesh(pads, new THREE.BoxGeometry(0.035, 0.16, 0.40), mats.rust, [0.45, 0.01, 0]);
    const num = addMesh(pads, new THREE.PlaneGeometry(0.30, 0.24), numberMaterial('12'), [0, -0.18, -0.225], [0, Math.PI, 0]);
    num.renderOrder = 3;
  }

  if (midSpine) {
    const jerseyShell = new THREE.Group();
    jerseyShell.name = 'GL_JerseyShell';
    midSpine.add(jerseyShell);
    addMesh(jerseyShell, new THREE.CylinderGeometry(0.31, 0.25, 0.48, 8), mats.jersey, [0, -0.13, 0], [0, 0, 0], [1.08, 1, 0.72]);
    addMesh(jerseyShell, new THREE.BoxGeometry(0.47, 0.035, 0.36), mats.rust, [0, 0.08, 0]);
  }

  if (pelvis) {
    const hipPads = new THREE.Group();
    hipPads.name = 'GL_HipPads';
    pelvis.add(hipPads);
    addMesh(hipPads, new THREE.BoxGeometry(0.56, 0.30, 0.34), mats.ivory, [0, -0.16, 0]);
    addMesh(hipPads, new THREE.BoxGeometry(0.58, 0.035, 0.35), mats.rust, [0, -0.02, 0]);
  }

  for (const thigh of [thighL, thighR]) {
    if (!thigh) continue;
    addMesh(thigh, new THREE.CylinderGeometry(0.16, 0.14, 0.38, 7), mats.ivory, [0, -0.18, 0], [0, 0, 0], [1.08, 1, 0.92]);
  }
}

function actionForClip(mixer, root, clip) {
  if (!clip) return null;
  const action = mixer.clipAction(clip, root);
  action.enabled = true;
  return action;
}

function play(controller, name, { restart = false, fade = 0.10 } = {}) {
  if (!controller.ready || !controller.actions[name]) return;
  const next = controller.actions[name];
  if (controller.current === name && !restart) return;

  if (controller.current && controller.actions[controller.current]) {
    controller.actions[controller.current].fadeOut(fade);
  }

  next.setEffectiveTimeScale(name === 'dropback' ? 0.78 : 1);
  next.setEffectiveWeight(1);
  next.clampWhenFinished = !LOOPING.has(name);
  next.setLoop(LOOPING.has(name) ? THREE.LoopRepeat : THREE.LoopOnce, LOOPING.has(name) ? Infinity : 1);
  next.reset().fadeIn(fade).play();
  controller.current = name;
}

export function attachAuthoredQB(qbGroup, fallbackRig) {
  const controller = {
    ready: false,
    loading: true,
    failed: false,
    root: null,
    mixer: null,
    actions: {},
    current: null,
    fallbackRig,
    lastThrowing: false,
    lastSliding: false,
  };

  Promise.all([loadGLB(MODEL_URL), loadGLB(ANIMATION_URL)])
    .then(([modelGltf, animGltf]) => {
      const root = modelGltf.scene;
      root.name = 'humanoid_qb_v2';
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      root.scale.setScalar(2.20);
      stylizeBase(root);
      buildFootballGear(root);

      qbGroup.add(root);
      if (fallbackRig) fallbackRig.visible = false;

      const mixer = new THREE.AnimationMixer(root);
      const clips = Object.fromEntries(animGltf.animations.map((clip) => [clip.name, clip]));
      const actions = {
        idle: actionForClip(mixer, root, clips.Idle_Loop),
        dropback: actionForClip(mixer, root, clips.Jog_Fwd_Loop),
        run: actionForClip(mixer, root, clips.Sprint_Loop),
        throw: actionForClip(mixer, root, clips.Punch_Cross),
        slide: actionForClip(mixer, root, clips.Roll),
      };

      controller.root = root;
      controller.mixer = mixer;
      controller.actions = actions;
      controller.ready = true;
      controller.loading = false;
      play(controller, 'idle', { fade: 0 });

      console.info('[Gridiron Legends] Humanoid QB v2 loaded', {
        model: MODEL_URL,
        animations: Object.keys(actions).filter((key) => actions[key]),
      });
    })
    .catch((error) => {
      controller.loading = false;
      controller.failed = true;
      if (fallbackRig) fallbackRig.visible = true;
      console.warn('[Gridiron Legends] Humanoid QB unavailable, using procedural fallback.', error);
    });

  return controller;
}

export function updateAuthoredQB(controller, dt, { state, moving, throwing, sliding }) {
  if (!controller?.ready) return;

  const throwStarted = throwing && !controller.lastThrowing;
  const slideStarted = sliding && !controller.lastSliding;

  if (slideStarted) {
    play(controller, 'slide', { restart: true, fade: 0.05 });
  } else if (throwStarted) {
    play(controller, 'throw', { restart: true, fade: 0.04 });
  } else if (sliding) {
    play(controller, 'slide');
  } else if (throwing) {
    play(controller, 'throw');
  } else if (state === 'SCRAMBLE') {
    play(controller, 'run');
  } else if ((state === 'POCKET' || state === 'AIMING') && moving) {
    play(controller, 'dropback');
  } else {
    play(controller, 'idle');
  }

  const desiredTilt = sliding ? -0.55 : 0;
  controller.root.rotation.x += (desiredTilt - controller.root.rotation.x) * Math.min(1, dt * 12);
  controller.mixer.update(dt);
  controller.lastThrowing = throwing;
  controller.lastSliding = sliding;
}
