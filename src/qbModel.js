import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = '/assets/models/players/qb_v1.glb';
const LOOPING = new Set(['idle', 'dropback', 'run']);

function tuneLoadedModel(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
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
  });
}

function play(controller, name, { restart = false, fade = 0.10 } = {}) {
  if (!controller.ready || !controller.actions[name]) return;
  const next = controller.actions[name];
  if (controller.current === name && !restart) return;

  if (controller.current && controller.actions[controller.current]) {
    controller.actions[controller.current].fadeOut(fade);
  }

  next.enabled = true;
  next.setEffectiveTimeScale(1);
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

  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      const root = gltf.scene;
      root.name = 'authored_qb_v1';
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      root.scale.setScalar(1);
      tuneLoadedModel(root);

      qbGroup.add(root);
      if (fallbackRig) fallbackRig.visible = false;

      const mixer = new THREE.AnimationMixer(root);
      const actions = {};
      for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);

      controller.root = root;
      controller.mixer = mixer;
      controller.actions = actions;
      controller.ready = true;
      controller.loading = false;
      play(controller, 'idle', { fade: 0 });

      console.info('[Gridiron Legends] Authored QB v1 loaded', {
        clips: gltf.animations.map((clip) => clip.name),
        url: MODEL_URL,
      });
    },
    undefined,
    (error) => {
      controller.loading = false;
      controller.failed = true;
      if (fallbackRig) fallbackRig.visible = true;
      console.warn('[Gridiron Legends] QB GLB unavailable, using procedural fallback.', error);
    },
  );

  return controller;
}

export function updateAuthoredQB(controller, dt, { state, moving, throwing, sliding }) {
  if (!controller?.ready) return;

  const throwStarted = throwing && !controller.lastThrowing;
  const slideStarted = sliding && !controller.lastSliding;

  if (slideStarted) {
    play(controller, 'slide', { restart: true, fade: 0.06 });
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
  } else if (state === 'PRE_SNAP' || state === 'POCKET' || state === 'AIMING' || state === 'BALL' || state === 'DEAD') {
    play(controller, 'idle');
  }

  controller.mixer.update(dt);
  controller.lastThrowing = throwing;
  controller.lastSliding = sliding;
}
