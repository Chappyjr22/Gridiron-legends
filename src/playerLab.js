import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import './playerLab.css';

const FOOTBALL_QB_SOURCE = {
  label: 'Rokoko Football Quarterback source motion',
  url: '/assets/vendor/rokoko/Football_Quarterback_mixamo.fbx',
  fps: 30,
  takes: [
    { key: 'take1', name: 'qb_source_take_1', start: 3.4, end: 11.6 },
    { key: 'take2', name: 'qb_source_take_2', start: 18.4, end: 27.1 },
    { key: 'take3', name: 'qb_source_take_3', start: 27.1, end: 36.28 },
  ],
};

const TARGET_HEIGHT = 1.88;
const stage = document.querySelector('#stage');
const statusText = document.querySelector('#statusText');
const loadState = document.querySelector('#loadState');
const activeClipLabel = document.querySelector('#activeClipLabel');
const clipSelect = document.querySelector('#clipSelect');
const speedRange = document.querySelector('#speedRange');
const speedReadout = document.querySelector('#speedReadout');
const playPauseButton = document.querySelector('#playPause');
const timelineRange = document.querySelector('#timelineRange');
const timelineReadout = document.querySelector('#timelineReadout');
const skeletonToggle = document.querySelector('#skeletonToggle');
const footballToggle = document.querySelector('#footballToggle');
const gridToggle = document.querySelector('#gridToggle');

const diagnostics = {
  character: document.querySelector('#characterMetric'),
  height: document.querySelector('#heightMetric'),
  bones: document.querySelector('#boneMetric'),
  animations: document.querySelector('#animationMetric'),
  hand: document.querySelector('#handMetric'),
  renderer: document.querySelector('#rendererMetric'),
  source: document.querySelector('#sourceMetric'),
};

const state = {
  ready: false,
  character: null,
  mixer: null,
  clips: [],
  currentAction: null,
  currentClip: null,
  quickClips: new Map(),
  skeleton: null,
  rightHand: null,
  football: null,
  normalizedHeight: 0,
  sourceLabel: '',
  playing: true,
  playbackSpeed: 1,
  errors: [],
};

window.__gridironPlayerLab = state;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10171a);
scene.fog = new THREE.Fog(0x10171a, 12, 32);

const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 80);
camera.position.set(4.2, 2.45, 5.6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 1.0, 0);
controls.minDistance = 2.4;
controls.maxDistance = 11;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xc8deef, 0x243129, 2.4));

const keyLight = new THREE.DirectionalLight(0xffe8cc, 3.6);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -2;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x90b9d0, 1.8);
rimLight.position.set(-5, 4, -4);
scene.add(rimLight);

const field = new THREE.Mesh(
  new THREE.PlaneGeometry(26, 18),
  new THREE.MeshStandardMaterial({ color: 0x24492f, roughness: 0.92, metalness: 0 }),
);
field.rotation.x = -Math.PI / 2;
field.receiveShadow = true;
scene.add(field);

const fieldGrid = new THREE.GridHelper(18, 18, 0xb7c9b9, 0x496b50);
fieldGrid.position.y = 0.006;
fieldGrid.material.transparent = true;
fieldGrid.material.opacity = 0.22;
scene.add(fieldGrid);

const yardMaterial = new THREE.MeshBasicMaterial({ color: 0xe2e7dc, transparent: true, opacity: 0.5 });
for (let z = -7; z <= 7; z += 2) {
  const line = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.025), yardMaterial);
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.012, z);
  scene.add(line);
}

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(1.05, 1.14, 0.09, 64),
  new THREE.MeshStandardMaterial({ color: 0x14191c, roughness: 0.75, metalness: 0.05 }),
);
platform.position.y = 0.045;
platform.receiveShadow = true;
scene.add(platform);

const clock = new THREE.Clock();
const fbxLoader = new FBXLoader();

function normalizeName(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function configureCharacter(root) {
  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if ('roughness' in material) material.roughness = Math.max(material.roughness ?? 0.75, 0.58);
          if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.08);
        }
      }
    }
  });

  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const sourceHeight = Math.max(0.001, box.max.y - box.min.y);
  const scale = TARGET_HEIGHT / sourceHeight;
  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);

  const normalizedBox = new THREE.Box3().setFromObject(root);
  state.normalizedHeight = normalizedBox.max.y - normalizedBox.min.y;
}

function getBones(root) {
  const bones = [];
  root.traverse((object) => {
    if (object.isBone) bones.push(object);
  });
  return bones;
}

function findRightHand(root) {
  const bones = getBones(root);
  const exactHints = ['righthand', 'handr', 'rhand', 'mixamorigrightHand'].map(normalizeName);
  for (const hint of exactHints) {
    const match = bones.find((bone) => normalizeName(bone.name) === hint);
    if (match) return match;
  }
  return bones.find((bone) => {
    const name = normalizeName(bone.name);
    return name.includes('righthand') || name.includes('handr') || (name.includes('right') && name.includes('hand'));
  }) || null;
}

function makeFootball() {
  const group = new THREE.Group();
  group.name = 'PlayerLabFootball';

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0x6d3219, roughness: 0.82, metalness: 0 }),
  );
  shell.scale.set(0.72, 0.72, 1.45);
  shell.rotation.x = Math.PI * 0.06;
  shell.castShadow = true;
  group.add(shell);

  const laceMaterial = new THREE.MeshBasicMaterial({ color: 0xe8dfcb });
  for (let i = -1; i <= 1; i += 1) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.004, 0.05), laceMaterial);
    lace.position.set(0.079, i * 0.02, 0.015);
    lace.rotation.y = Math.PI * 0.46;
    group.add(lace);
  }
  return group;
}

function attachFootball() {
  if (!state.character) return;
  state.rightHand = findRightHand(state.character);
  state.football = makeFootball();
  scene.add(state.football);

  if (state.rightHand) {
    diagnostics.hand.textContent = state.rightHand.name || 'resolved';
  } else {
    state.football.position.set(0.42, 1.02, 0.1);
    diagnostics.hand.textContent = 'not resolved';
  }
  state.football.visible = footballToggle.checked;
}

const footballOffset = new THREE.Vector3(0.02, 0.02, 0.065);
const footballWorldOffset = new THREE.Vector3();
const footballRotationOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, 0.5, 1.15));
const handWorldPosition = new THREE.Vector3();
const handWorldQuaternion = new THREE.Quaternion();

function updateFootballSocket() {
  if (!state.football || !state.rightHand) return;
  state.rightHand.getWorldPosition(handWorldPosition);
  state.rightHand.getWorldQuaternion(handWorldQuaternion);
  footballWorldOffset.copy(footballOffset).applyQuaternion(handWorldQuaternion);
  state.football.position.copy(handWorldPosition).add(footballWorldOffset);
  state.football.quaternion.copy(handWorldQuaternion).multiply(footballRotationOffset);
}

function clipScore(name, patterns) {
  const normalized = normalizeName(name);
  let best = -1;
  patterns.forEach((pattern, index) => {
    if (pattern.test(normalized)) best = Math.max(best, 100 - index * 10);
  });
  return best;
}

function pickClip(patterns) {
  let winner = null;
  let winnerScore = -1;
  for (const clip of state.clips) {
    const score = clipScore(clip.name, patterns);
    if (score > winnerScore) {
      winner = clip;
      winnerScore = score;
    }
  }
  return winnerScore >= 0 ? winner : null;
}

function mapQuickClips() {
  const rules = {
    take1: [/qbsourcetake1/],
    take2: [/qbsourcetake2/],
    take3: [/qbsourcetake3/],
    full: [/qbsourcefull/],
  };

  state.quickClips.clear();
  document.querySelectorAll('[data-animation]').forEach((button) => {
    const key = button.dataset.animation;
    const clip = pickClip(rules[key] || []);
    if (clip) {
      state.quickClips.set(key, clip);
      button.disabled = false;
      button.title = clip.name;
    } else {
      button.disabled = true;
      button.title = 'No matching clip found in current library';
    }
  });
}

function populateClipSelect() {
  clipSelect.innerHTML = '';
  const sorted = [...state.clips].sort((a, b) => a.name.localeCompare(b.name));
  for (const clip of sorted) {
    const option = document.createElement('option');
    option.value = clip.name;
    option.textContent = `${clip.name} (${clip.duration.toFixed(2)}s)`;
    clipSelect.appendChild(option);
  }
  clipSelect.disabled = !sorted.length;
}

function setAnimation(clip, fade = 0.22, restart = false) {
  if (!state.mixer || !clip) return false;
  if (state.currentClip === clip && state.currentAction) {
    if (restart) {
      state.currentAction.reset().play();
      seekAnimation(0);
      setPlaying(true);
    }
    return true;
  }

  const nextAction = state.mixer.clipAction(clip, state.character);
  nextAction.enabled = true;
  nextAction.setLoop(THREE.LoopRepeat, Infinity);
  nextAction.clampWhenFinished = false;
  nextAction.reset();
  nextAction.setEffectiveWeight(1);
  nextAction.play();

  if (state.currentAction && state.currentAction !== nextAction) {
    state.currentAction.fadeOut(fade);
    nextAction.fadeIn(fade);
  }

  state.currentAction = nextAction;
  state.currentClip = clip;
  timelineRange.max = String(Math.max(0.01, clip.duration));
  timelineRange.value = '0';
  timelineRange.disabled = false;
  updateTimelineReadout(0);
  activeClipLabel.textContent = clip.name;
  clipSelect.value = clip.name;
  document.querySelectorAll('[data-animation]').forEach((button) => {
    const mapped = state.quickClips.get(button.dataset.animation);
    button.classList.toggle('active', mapped === clip);
  });
  return true;
}

function updateDiagnostics() {
  const bones = state.character ? getBones(state.character) : [];
  diagnostics.character.textContent = state.character ? 'Rokoko source performer mesh' : 'not loaded';
  diagnostics.height.textContent = state.normalizedHeight ? `${state.normalizedHeight.toFixed(2)} m normalized` : 'waiting';
  diagnostics.bones.textContent = bones.length ? String(bones.length) : 'waiting';
  diagnostics.animations.textContent = state.clips.length ? String(state.clips.length) : 'waiting';
  diagnostics.renderer.textContent = `${renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'} • ${renderer.info.render.calls} calls`;
  diagnostics.source.textContent = state.sourceLabel || 'waiting';
}

function updateTimelineReadout(time) {
  const duration = state.currentClip?.duration || 0;
  timelineReadout.textContent = `${time.toFixed(2)}s / ${duration.toFixed(2)}s`;
}

function setPlaying(playing) {
  state.playing = playing;
  if (state.mixer) state.mixer.timeScale = playing ? state.playbackSpeed : 0;
  playPauseButton.textContent = playing ? 'Pause' : 'Play';
  playPauseButton.setAttribute('aria-pressed', String(!playing));
}

function seekAnimation(time) {
  if (!state.currentAction || !state.currentClip) return;
  const clampedTime = THREE.MathUtils.clamp(time, 0, state.currentClip.duration);
  state.currentAction.time = clampedTime;
  state.mixer.update(0);
  timelineRange.value = String(clampedTime);
  updateTimelineReadout(clampedTime);
}

function setView(name) {
  const views = {
    front: [0, 1.7, 5.2],
    rear: [0, 1.7, -5.2],
    side: [5.2, 1.7, 0],
    three: [4.2, 2.45, 5.6],
  };
  const next = views[name] || views.three;
  camera.position.set(...next);
  controls.target.set(0, 1.0, 0);
  controls.update();
}

async function initializeAssets() {
  try {
    statusText.textContent = `Loading ${FOOTBALL_QB_SOURCE.label}…`;
    state.character = await fbxLoader.loadAsync(FOOTBALL_QB_SOURCE.url);
    state.character.name = 'GridironPlayerLabCharacter';
    state.sourceLabel = FOOTBALL_QB_SOURCE.label;
    configureCharacter(state.character);
    scene.add(state.character);

    state.skeleton = new THREE.SkeletonHelper(state.character);
    state.skeleton.visible = false;
    state.skeleton.material.depthTest = false;
    state.skeleton.renderOrder = 20;
    scene.add(state.skeleton);

    attachFootball();
    updateDiagnostics();

    const rawClip = state.character.animations?.[0] || null;
    state.clips = rawClip
      ? [
          Object.assign(rawClip.clone(), { name: 'qb_source_full' }),
          ...FOOTBALL_QB_SOURCE.takes.map((take) => THREE.AnimationUtils.subclip(
            rawClip,
            take.name,
            Math.round(take.start * FOOTBALL_QB_SOURCE.fps),
            Math.round(take.end * FOOTBALL_QB_SOURCE.fps),
            FOOTBALL_QB_SOURCE.fps,
          )),
        ]
      : [];
    state.mixer = new THREE.AnimationMixer(state.character);
    populateClipSelect();
    mapQuickClips();
    updateDiagnostics();

    const initialClip = state.quickClips.get('take1') || state.clips[0] || null;
    if (initialClip) setAnimation(initialClip, 0);
    setPlaying(true);

    state.ready = Boolean(state.character && state.clips.length);
    loadState.className = `status-dot ${state.ready ? 'ready' : 'error'}`;
    statusText.textContent = state.ready
      ? `Ready • football QB source motion loaded`
      : 'Character loaded, but no animation clips were found';

    console.info('[Player Lab] Loaded animation clips:', state.clips.map((clip) => clip.name));
  } catch (error) {
    state.errors.push(String(error?.message || error));
    loadState.className = 'status-dot error';
    statusText.textContent = 'Asset load failed. Check console/network.';
    console.error('[Player Lab] Initialization failed', error);
  }
}

document.querySelectorAll('[data-animation]').forEach((button) => {
  button.addEventListener('click', () => setAnimation(state.quickClips.get(button.dataset.animation), 0.22, true));
});

clipSelect.addEventListener('change', () => {
  const clip = state.clips.find((item) => item.name === clipSelect.value);
  setAnimation(clip);
});

speedRange.addEventListener('input', () => {
  const speed = Number(speedRange.value);
  state.playbackSpeed = speed;
  speedReadout.textContent = `${speed.toFixed(2)}×`;
  if (state.mixer && state.playing) state.mixer.timeScale = speed;
});

playPauseButton.addEventListener('click', () => setPlaying(!state.playing));

timelineRange.addEventListener('input', () => {
  setPlaying(false);
  seekAnimation(Number(timelineRange.value));
});

skeletonToggle.addEventListener('change', () => {
  if (state.skeleton) state.skeleton.visible = skeletonToggle.checked;
});

footballToggle.addEventListener('change', () => {
  if (state.football) state.football.visible = footballToggle.checked;
});

gridToggle.addEventListener('change', () => {
  fieldGrid.visible = gridToggle.checked;
});

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

const resizeObserver = new ResizeObserver(() => {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
resizeObserver.observe(stage);

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  if (state.mixer) state.mixer.update(delta);
  if (state.currentAction && state.currentClip && state.playing) {
    const time = state.currentAction.time % state.currentClip.duration;
    timelineRange.value = String(time);
    updateTimelineReadout(time);
  }
  updateFootballSocket();
  controls.update();
  updateDiagnostics();
  renderer.render(scene, camera);
}

initializeAssets();
animate();
