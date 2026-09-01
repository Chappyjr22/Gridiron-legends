import './spriteStudio.css';
import { QB_BASE_ATLAS } from './qbSpriteBase.js';

const W = 96;
const H = 128;
const POSES = [
  ['idle', 'Idle'],
  ['dropback', 'Dropback'],
  ['aim', 'Aim / Cock'],
  ['release', 'Release'],
  ['run_right', 'Run Right'],
  ['run_left', 'Run Left'],
];

const REGIONS = [
  ['helmet', 'Helmet', { x: 27, y: 7, w: 42, h: 30 }],
  ['upper', 'Upper Body', { x: 21, y: 31, w: 55, h: 42 }],
  ['arm_left', 'Left Arm', { x: 10, y: 37, w: 24, h: 38 }],
  ['arm_right', 'Right Arm', { x: 62, y: 37, w: 24, h: 38 }],
  ['leg_left', 'Left Leg', { x: 25, y: 70, w: 22, h: 53 }],
  ['leg_right', 'Right Leg', { x: 49, y: 70, w: 22, h: 53 }],
];

const $ = (id) => document.getElementById(id);
const edit = $('editCanvas');
const ctx = edit.getContext('2d', { willReadFrequently: true });
const onion = $('onionCanvas');
const onionCtx = onion.getContext('2d');
const selectionCanvas = $('selectionCanvas');
const selectionCtx = selectionCanvas.getContext('2d');
const referenceCanvas = $('referenceCanvas');
const referenceCtx = referenceCanvas.getContext('2d');
const masterPreview = $('masterPreview');
const masterPreviewCtx = masterPreview.getContext('2d');
const currentPreview = $('currentPreview');
const currentPreviewCtx = currentPreview.getContext('2d');
const animationPreview = $('animationPreview');
const animationCtx = animationPreview.getContext('2d');

const state = {
  master: document.createElement('canvas'),
  poses: new Map(),
  current: 'idle',
  tool: 'pencil',
  color: '#e26f24',
  brush: 1,
  zoom: 6,
  drawing: false,
  changedDuringStroke: false,
  selection: null,
  selectionStart: null,
  undo: [],
  redo: [],
  referenceImage: null,
  paletteSource: null,
  previewTimer: null,
  previewIndex: 0,
};
state.master.width = W;
state.master.height = H;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

function cloneCanvas(source) {
  const c = makeCanvas();
  c.getContext('2d').drawImage(source, 0, 0);
  return c;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function savePoseFromEditor() {
  const target = state.poses.get(state.current);
  if (!target) return;
  const pctx = target.getContext('2d');
  pctx.clearRect(0, 0, W, H);
  pctx.drawImage(edit, 0, 0);
}

function loadPoseToEditor(name) {
  savePoseFromEditor();
  state.current = name;
  const source = state.poses.get(name);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(source, 0, 0);
  state.undo = [];
  state.redo = [];
  state.selection = null;
  drawSelection();
  renderPoseButtons();
  renderOnion();
  refreshPreviews();
  updateConsistency();
  $('currentPoseLabel').textContent = POSES.find(([key]) => key === name)?.[1] || name;
}

function snapshot() {
  return ctx.getImageData(0, 0, W, H);
}

function restore(imageData) {
  ctx.putImageData(imageData, 0, 0);
  savePoseFromEditor();
  refreshPreviews();
  updateConsistency();
}

function pushUndo() {
  state.undo.push(snapshot());
  if (state.undo.length > 50) state.undo.shift();
  state.redo = [];
}

function undo() {
  if (!state.undo.length) return;
  state.redo.push(snapshot());
  restore(state.undo.pop());
}

function redo() {
  if (!state.redo.length) return;
  state.undo.push(snapshot());
  restore(state.redo.pop());
}

function renderPoseButtons() {
  const list = $('poseList');
  list.innerHTML = '';
  for (const [key, label] of POSES) {
    const button = document.createElement('button');
    button.className = `pose-btn ${state.current === key ? 'active' : ''}`;
    button.innerHTML = `<span>${label}</span><small>${W}×${H}</small>`;
    button.addEventListener('click', () => loadPoseToEditor(key));
    list.appendChild(button);
  }
}

function renderRegions() {
  const grid = $('regionGrid');
  grid.innerHTML = '';
  for (const [, label, rect] of REGIONS) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
      state.selection = { ...rect };
      drawSelection();
    });
    grid.appendChild(button);
  }
}

function renderOnion() {
  onionCtx.clearRect(0, 0, W, H);
  if (!$('onionToggle').checked) return;
  const index = POSES.findIndex(([key]) => key === state.current);
  if (index <= 0) return;
  onionCtx.drawImage(state.poses.get(POSES[index - 1][0]), 0, 0);
}

function drawSelection() {
  selectionCtx.clearRect(0, 0, W, H);
  if (!state.selection) return;
  const { x, y, w, h } = state.selection;
  selectionCtx.save();
  selectionCtx.strokeStyle = '#ffe37a';
  selectionCtx.lineWidth = 1;
  selectionCtx.setLineDash([2, 1]);
  selectionCtx.strokeRect(x + .5, y + .5, Math.max(1, w - 1), Math.max(1, h - 1));
  selectionCtx.restore();
}

function clampSelection(rect) {
  const x = Math.max(0, Math.min(W - 1, rect.x));
  const y = Math.max(0, Math.min(H - 1, rect.y));
  const w = Math.max(1, Math.min(W - x, rect.w));
  const h = Math.max(1, Math.min(H - y, rect.h));
  return { x, y, w, h };
}

function moveSelection(dx, dy) {
  if (!state.selection) return;
  pushUndo();
  const r = clampSelection(state.selection);
  const pixels = ctx.getImageData(r.x, r.y, r.w, r.h);
  ctx.clearRect(r.x, r.y, r.w, r.h);
  const nx = Math.max(0, Math.min(W - r.w, r.x + dx));
  const ny = Math.max(0, Math.min(H - r.h, r.y + dy));
  ctx.putImageData(pixels, nx, ny);
  state.selection = { x: nx, y: ny, w: r.w, h: r.h };
  drawSelection();
  savePoseFromEditor();
  refreshPreviews();
  updateConsistency();
}

function pointerPixel(event) {
  const rect = edit.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(W - 1, Math.floor((event.clientX - rect.left) * W / rect.width))),
    y: Math.max(0, Math.min(H - 1, Math.floor((event.clientY - rect.top) * H / rect.height))),
  };
}

function hexToRgba(hex) {
  const raw = hex.replace('#', '');
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16), 255];
}

function paintPixel(x, y, erase = false) {
  const size = state.brush;
  if (erase) {
    ctx.clearRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
  } else {
    ctx.fillStyle = state.color;
    ctx.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
  }
}

function floodFill(x, y) {
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const i0 = (y * W + x) * 4;
  const target = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  const replacement = hexToRgba(state.color);
  if (target.every((v, i) => v === replacement[i])) return;
  const matches = (i) => target[0] === d[i] && target[1] === d[i + 1] && target[2] === d[i + 2] && target[3] === d[i + 3];
  const stack = [[x, y]];
  const seen = new Uint8Array(W * H);
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
    const p = cy * W + cx;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!matches(i)) continue;
    d[i] = replacement[0]; d[i + 1] = replacement[1]; d[i + 2] = replacement[2]; d[i + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(image, 0, 0);
}

function pickColor(x, y) {
  const p = ctx.getImageData(x, y, 1, 1).data;
  if (p[3] === 0) return;
  const hex = `#${[p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  state.color = hex;
  $('colorInput').value = hex;
}

function onPointerDown(event) {
  event.preventDefault();
  const { x, y } = pointerPixel(event);
  state.drawing = true;
  state.changedDuringStroke = false;
  edit.setPointerCapture?.(event.pointerId);

  if (state.tool === 'select') {
    state.selectionStart = { x, y };
    state.selection = { x, y, w: 1, h: 1 };
    drawSelection();
    return;
  }
  if (state.tool === 'eyedropper') {
    pickColor(x, y);
    state.drawing = false;
    return;
  }

  pushUndo();
  if (state.tool === 'fill') floodFill(x, y);
  else paintPixel(x, y, state.tool === 'eraser');
  state.changedDuringStroke = true;
  if (state.tool === 'fill') finishStroke();
}

function onPointerMove(event) {
  if (!state.drawing) return;
  const { x, y } = pointerPixel(event);
  if (state.tool === 'select') {
    const sx = state.selectionStart.x;
    const sy = state.selectionStart.y;
    state.selection = clampSelection({
      x: Math.min(sx, x), y: Math.min(sy, y),
      w: Math.abs(x - sx) + 1, h: Math.abs(y - sy) + 1,
    });
    drawSelection();
    return;
  }
  if (state.tool === 'pencil' || state.tool === 'eraser') {
    paintPixel(x, y, state.tool === 'eraser');
    state.changedDuringStroke = true;
  }
}

function finishStroke() {
  if (!state.drawing && !state.changedDuringStroke) return;
  state.drawing = false;
  state.selectionStart = null;
  if (state.changedDuringStroke) {
    savePoseFromEditor();
    refreshPreviews();
    updateConsistency();
  }
  state.changedDuringStroke = false;
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('#toolGrid [data-tool]').forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
}

function setZoom(zoom) {
  state.zoom = zoom;
  const stack = $('canvasStack');
  stack.style.width = `${W * zoom}px`;
  stack.style.height = `${H * zoom}px`;
  document.querySelectorAll('[data-zoom]').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.zoom) === zoom));
}

function refreshPreviews() {
  masterPreviewCtx.clearRect(0, 0, W, H);
  masterPreviewCtx.drawImage(state.master, 0, 0);
  currentPreviewCtx.clearRect(0, 0, W, H);
  currentPreviewCtx.drawImage(edit, 0, 0);
  if (!state.previewTimer) {
    animationCtx.clearRect(0, 0, W, H);
    animationCtx.drawImage(edit, 0, 0);
  }
}

function topPalette(canvas, limit = 18) {
  const data = canvas.getContext('2d').getImageData(0, 0, W, H).data;
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([key, count]) => ({ rgb: key.split(',').map(Number), count }));
}

function renderPalette() {
  const grid = $('paletteGrid');
  grid.innerHTML = '';
  for (const entry of topPalette(state.master)) {
    const btn = document.createElement('button');
    const hex = `#${entry.rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
    btn.className = 'swatch';
    btn.style.background = hex;
    btn.title = `${hex} • ${entry.count} pixels`;
    btn.addEventListener('click', () => {
      state.paletteSource = entry.rgb;
      document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
    });
    grid.appendChild(btn);
  }
}

function replaceColorOnCanvas(canvas, from, toHex) {
  if (!from) return;
  const cctx = canvas.getContext('2d', { willReadFrequently: true });
  const image = cctx.getImageData(0, 0, W, H);
  const to = hexToRgba(toHex);
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i] === from[0] && image.data[i + 1] === from[1] && image.data[i + 2] === from[2] && image.data[i + 3] > 0) {
      image.data[i] = to[0]; image.data[i + 1] = to[1]; image.data[i + 2] = to[2];
    }
  }
  cctx.putImageData(image, 0, 0);
}

function replacePalette(all) {
  if (!state.paletteSource) return;
  const replacement = $('paletteReplacement').value;
  if (all) {
    savePoseFromEditor();
    for (const pose of state.poses.values()) replaceColorOnCanvas(pose, state.paletteSource, replacement);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(state.poses.get(state.current), 0, 0);
  } else {
    pushUndo();
    replaceColorOnCanvas(edit, state.paletteSource, replacement);
    savePoseFromEditor();
  }
  refreshPreviews();
  updateConsistency();
}

function boundsOf(canvas) {
  const d = canvas.getContext('2d').getImageData(0, 0, W, H).data;
  let minX = W, minY = H, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = d[(y * W + x) * 4 + 3];
    if (a < 64) continue;
    count++;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, count };
}

function updateConsistency() {
  const mb = boundsOf(state.master);
  const cb = boundsOf(edit);
  const opaqueRatio = mb.count ? Math.round(cb.count / mb.count * 100) : 0;
  const masterColors = new Set(topPalette(state.master, 255).map(x => x.rgb.join(',')));
  const currentColors = topPalette(edit, 255).map(x => x.rgb.join(','));
  const overlap = currentColors.length ? Math.round(currentColors.filter(c => masterColors.has(c)).length / currentColors.length * 100) : 0;
  const drift = Math.max(
    Math.abs(cb.minX - mb.minX), Math.abs(cb.minY - mb.minY),
    Math.abs(cb.maxX - mb.maxX), Math.abs(cb.maxY - mb.maxY),
  );
  $('opaqueMetric').textContent = `${opaqueRatio}%`;
  $('paletteMetric').textContent = `${overlap}%`;
  $('boundsMetric').textContent = `${Number.isFinite(drift) ? drift : 0} px`;
  let note = 'Very close to the approved master silhouette.';
  if (drift > 10 || opaqueRatio < 70 || opaqueRatio > 135) note = 'Large silhouette change. Compare carefully before approving this pose.';
  else if (drift > 5 || opaqueRatio < 82 || opaqueRatio > 120) note = 'Moderate pose change. Check helmet, pads, and body proportions against the master.';
  $('consistencyNote').textContent = note;
}

function renderReference() {
  referenceCtx.clearRect(0, 0, W, H);
  if (!state.referenceImage) return;
  const img = state.referenceImage;
  const scale = Math.min(W / img.width, H / img.height);
  const dw = Math.round(img.width * scale);
  const dh = Math.round(img.height * scale);
  referenceCtx.imageSmoothingEnabled = false;
  referenceCtx.drawImage(img, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
}

function downloadCanvas(canvas, name) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }, 'image/png');
}

function exportSheet() {
  savePoseFromEditor();
  const sheet = document.createElement('canvas');
  sheet.width = W * POSES.length;
  sheet.height = H;
  const sctx = sheet.getContext('2d');
  sctx.imageSmoothingEnabled = false;
  POSES.forEach(([key], i) => sctx.drawImage(state.poses.get(key), i * W, 0));
  downloadCanvas(sheet, 'gridiron-qb-pose-sheet.png');
}

function projectObject() {
  savePoseFromEditor();
  return {
    version: 1,
    frameSize: [W, H],
    current: state.current,
    poses: Object.fromEntries(POSES.map(([key]) => [key, state.poses.get(key).toDataURL('image/png')])),
  };
}

function downloadProject() {
  const blob = new Blob([JSON.stringify(projectObject(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'gridiron-qb-sprite-project.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function applyProject(project) {
  if (!project?.poses) throw new Error('Invalid project');
  for (const [key] of POSES) {
    const src = project.poses[key];
    if (!src) continue;
    const img = await loadImage(src);
    const canvas = state.poses.get(key) || makeCanvas();
    const pctx = canvas.getContext('2d');
    pctx.clearRect(0, 0, W, H);
    pctx.drawImage(img, 0, 0, W, H);
    state.poses.set(key, canvas);
  }
  loadPoseToEditor(project.current && state.poses.has(project.current) ? project.current : 'idle');
}

function startPreview() {
  if (state.previewTimer) return;
  $('previewToggleBtn').textContent = '■ Stop';
  const tick = () => {
    const key = POSES[state.previewIndex % POSES.length][0];
    animationCtx.clearRect(0, 0, W, H);
    animationCtx.drawImage(state.current === key ? edit : state.poses.get(key), 0, 0);
    state.previewIndex++;
  };
  tick();
  const schedule = () => {
    clearInterval(state.previewTimer);
    state.previewTimer = setInterval(tick, 1000 / Number($('previewFps').value));
  };
  schedule();
}

function stopPreview() {
  clearInterval(state.previewTimer);
  state.previewTimer = null;
  $('previewToggleBtn').textContent = '▶ Play';
  refreshPreviews();
}

function bindUI() {
  renderPoseButtons();
  renderRegions();
  document.querySelectorAll('#toolGrid [data-tool]').forEach(btn => btn.addEventListener('click', () => setTool(btn.dataset.tool)));
  document.querySelectorAll('[data-zoom]').forEach(btn => btn.addEventListener('click', () => setZoom(Number(btn.dataset.zoom))));
  document.querySelectorAll('[data-nudge]').forEach(btn => btn.addEventListener('click', () => {
    const [dx, dy] = btn.dataset.nudge.split(',').map(Number); moveSelection(dx, dy);
  }));
  $('clearSelectionBtn').addEventListener('click', () => { state.selection = null; drawSelection(); });
  $('colorInput').addEventListener('input', e => { state.color = e.target.value; });
  $('brushSize').addEventListener('input', e => { state.brush = Number(e.target.value); $('brushReadout').textContent = `${state.brush} px`; });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  $('gridToggle').addEventListener('change', e => $('canvasStack').classList.toggle('grid-on', e.target.checked));
  $('onionToggle').addEventListener('change', renderOnion);
  $('onionOpacity').addEventListener('input', e => onion.style.opacity = String(Number(e.target.value) / 100));
  $('referenceOpacity').addEventListener('input', e => referenceCanvas.style.opacity = String(Number(e.target.value) / 100));
  $('referenceInput').addEventListener('change', async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    state.referenceImage = await loadImage(url);
    URL.revokeObjectURL(url);
    renderReference();
  });
  $('clearReferenceBtn').addEventListener('click', () => { state.referenceImage = null; renderReference(); });
  $('importReferenceBtn').addEventListener('click', () => {
    if (!state.referenceImage) return;
    pushUndo();
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(referenceCanvas, 0, 0);
    savePoseFromEditor(); refreshPreviews(); updateConsistency();
  });
  $('duplicatePoseBtn').addEventListener('click', () => {
    const currentIndex = POSES.findIndex(([key]) => key === state.current);
    const nextKey = POSES[Math.min(POSES.length - 1, currentIndex + 1)][0];
    if (nextKey === state.current) return;
    savePoseFromEditor();
    const target = state.poses.get(nextKey).getContext('2d');
    target.clearRect(0, 0, W, H); target.drawImage(state.poses.get(state.current), 0, 0);
    loadPoseToEditor(nextKey);
  });
  $('resetPoseBtn').addEventListener('click', () => {
    pushUndo(); ctx.clearRect(0, 0, W, H); ctx.drawImage(state.master, 0, 0); savePoseFromEditor(); refreshPreviews(); updateConsistency();
  });
  $('replaceCurrentBtn').addEventListener('click', () => replacePalette(false));
  $('replaceAllBtn').addEventListener('click', () => replacePalette(true));
  $('exportPoseBtn').addEventListener('click', () => { savePoseFromEditor(); downloadCanvas(state.poses.get(state.current), `qb-${state.current}.png`); });
  $('exportSheetBtn').addEventListener('click', exportSheet);
  $('exportProjectBtn').addEventListener('click', downloadProject);
  $('saveLocalBtn').addEventListener('click', () => { localStorage.setItem('gridironSpriteStudioV1', JSON.stringify(projectObject())); $('statusText').textContent = 'Project saved locally'; });
  $('loadLocalBtn').addEventListener('click', async () => { const raw = localStorage.getItem('gridironSpriteStudioV1'); if (raw) await applyProject(JSON.parse(raw)); });
  $('projectInput').addEventListener('change', async e => { const file = e.target.files?.[0]; if (file) await applyProject(JSON.parse(await file.text())); });
  $('previewToggleBtn').addEventListener('click', () => state.previewTimer ? stopPreview() : startPreview());
  $('previewFps').addEventListener('input', e => { $('fpsReadout').textContent = e.target.value; if (state.previewTimer) { stopPreview(); startPreview(); } });

  edit.addEventListener('pointerdown', onPointerDown);
  edit.addEventListener('pointermove', onPointerMove);
  edit.addEventListener('pointerup', finishStroke);
  edit.addEventListener('pointercancel', finishStroke);
  edit.addEventListener('pointerleave', e => { if (state.drawing && state.tool !== 'select') finishStroke(e); });

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if (e.key === 'Escape') { state.selection = null; drawSelection(); }
    if (state.selection && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const delta = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] }[e.key];
      moveSelection(...delta);
    }
  });
}

async function init() {
  ctx.imageSmoothingEnabled = false;
  onionCtx.imageSmoothingEnabled = false;
  selectionCtx.imageSmoothingEnabled = false;
  referenceCtx.imageSmoothingEnabled = false;
  masterPreviewCtx.imageSmoothingEnabled = false;
  currentPreviewCtx.imageSmoothingEnabled = false;
  animationCtx.imageSmoothingEnabled = false;

  const base = await loadImage(QB_BASE_ATLAS);
  const masterCtx = state.master.getContext('2d');
  masterCtx.imageSmoothingEnabled = false;
  const frameW = Math.round(base.width / 8);
  masterCtx.drawImage(base, 0, 0, frameW, base.height, 0, 0, W, H);

  for (const [key] of POSES) state.poses.set(key, cloneCanvas(state.master));
  bindUI();
  setZoom(6);
  $('canvasStack').classList.add('grid-on');
  onion.style.opacity = '.28';
  referenceCanvas.style.opacity = '.35';
  renderPalette();
  loadPoseToEditor('idle');
  $('statusText').textContent = '96 × 128 • approved QB master loaded';
  window.__gridironSpriteStudio = { state, exportSheet, loadPose: loadPoseToEditor };
}

init().catch(error => {
  console.error(error);
  $('statusText').textContent = `Studio failed to load: ${error.message}`;
});
