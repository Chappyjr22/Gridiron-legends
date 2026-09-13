import {
  spriteImage,presnapSpriteImage,defensePresnapSpriteImage,
  makeTeamSpriteSheet,colorRamp,uniformChannelForPixel,
  applyUniformMaskEdits,clearUniformMaskFrame,getUniformMaskOverrides,
  exportUniformMaskOverrides,importUniformMaskOverrides
} from '../rendering/spriteSheets.js';

const SOURCES=[
  {id:'gameplay',label:'Gameplay',image:()=>spriteImage,expanded:false},
  {id:'presnap-offense',label:'Presnap offense',image:()=>presnapSpriteImage,expanded:true},
  {id:'presnap-defense',label:'Presnap defense',image:()=>defensePresnapSpriteImage,expanded:true}
];
const CHANNELS=['helmet','jersey','pants','stripe','auto'];
const OVERLAY={helmet:'rgba(75,220,80,.62)',jersey:'rgba(40,190,255,.58)',pants:'rgba(255,60,180,.64)',stripe:'rgba(255,150,30,.76)'};
let getUniform=()=>({jersey:'#000000',pants:'#ff2f8a',helmet:'#4e7a27',stripe:'#831100'}),onChanged=()=>{};
let sourceId='gameplay',row=0,col=0,channel='helmet',brush=1,zoom=10,painting=false,panning=false,showGrid=true,showAuto=false;
let pending=new Map(),strokeBefore=null,panStart=null,undoStack=[],redoStack=[];
const el=id=>document.getElementById(id);

function ensureUI(){
  if(el('uniform-mask-dev'))return;
  const style=document.createElement('style');
  style.textContent=`
  #uniform-mask-dev{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#07101f;color:#fff}
  #uniform-mask-dev::backdrop{background:#02060c}
  .mask-dev-shell{height:100%;display:flex;flex-direction:column;background:#102d66;border:4px solid #fff;overflow:hidden}
  .mask-dev-head{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:7px;padding:5px 8px;border-bottom:3px solid #fff;background:#1f5bd5}.mask-dev-head h2{margin:0;text-align:center;font:900 17px "Courier New",monospace;text-transform:uppercase;letter-spacing:.08em}.mask-dev-head button{min-height:38px;padding:7px 10px}.mask-dev-head button:disabled{opacity:.35}
  .mask-dev-topbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 8px;border-bottom:2px solid #668fe7;background:#123b87}.mask-dev-topbar label{display:flex;align-items:center;gap:5px;font:900 8px "Courier New",monospace;text-transform:uppercase}.mask-dev-topbar select{min-height:34px;background:#fff;color:#111;border:0;padding:5px;font:900 9px "Courier New",monospace}.mask-dev-topbar button{min-height:34px;padding:5px 8px;font-size:9px;box-shadow:none}.mask-dev-topbar button.active{background:#d8dc00;color:#111;border-color:#fff}.mask-dev-zoom-value{min-width:38px;text-align:center;font:900 9px "Courier New",monospace}
  .mask-dev-workspace{position:relative;flex:1;min-height:0;background:#050b14;overflow:hidden}.mask-dev-stage{position:absolute;inset:0;overflow:auto;overscroll-behavior:contain;background:#07101f;touch-action:none}.mask-dev-stage-inner{display:grid;place-items:center}.mask-dev-editor{display:block;image-rendering:pixelated;touch-action:none;background:#2454a8;box-shadow:0 0 0 2px #7699e4}
  .mask-dev-preview-card{position:absolute;right:10px;top:10px;z-index:3;display:grid;place-items:center;gap:3px;background:rgba(5,14,30,.88);border:2px solid #fff;padding:5px;pointer-events:none}.mask-dev-preview-card b{font:900 7px "Courier New",monospace;text-transform:uppercase}.mask-dev-preview{width:86px;height:86px;image-rendering:pixelated;background:#2454a8}
  .mask-dev-dock{flex:0 0 auto;border-top:3px solid #fff;background:#123b87;padding:6px 8px}.mask-dev-parts{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.mask-dev-parts button{min-height:42px;padding:5px;font-size:9px}.mask-dev-parts button.active{background:#d8dc00;color:#111;border-color:#fff}.mask-dev-parts [data-mask-channel="helmet"]{box-shadow:inset 0 -5px #4bdc50}.mask-dev-parts [data-mask-channel="jersey"]{box-shadow:inset 0 -5px #28beff}.mask-dev-parts [data-mask-channel="pants"]{box-shadow:inset 0 -5px #ff3cb4}.mask-dev-parts [data-mask-channel="stripe"]{box-shadow:inset 0 -5px #ff961e}
  .mask-dev-dock-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:5px}.mask-dev-dock-row button{min-height:34px;padding:5px 8px;font-size:8px}.mask-dev-dock-row select{min-height:34px;background:#fff;color:#111;border:0;padding:5px;font:900 9px "Courier New",monospace}.mask-dev-status{flex:1;min-width:180px;font:700 8px/1.35 "Courier New",monospace;color:#dce8ff}.mask-dev-pixel{font:900 8px "Courier New",monospace;color:#fff;white-space:nowrap}
  .mask-dev-data{display:none;position:absolute;left:8px;right:8px;bottom:8px;z-index:5;background:#07101f;border:3px solid #fff;padding:8px}.mask-dev-data.open{display:block}.mask-dev-data textarea{width:100%;height:120px;background:#020710;color:#dce8ff;border:2px solid #7699e4;padding:6px;font:8px/1.3 "Courier New",monospace;resize:none}.mask-dev-data-row{display:flex;gap:6px;margin-top:6px}.mask-dev-data-row button{flex:1;min-height:36px}.mask-dev-data p{margin:5px 0 0;font:700 8px "Courier New",monospace;color:#dce8ff}
  .mask-dev-legend{display:flex;gap:10px;align-items:center;font:700 7px "Courier New",monospace;text-transform:uppercase}.mask-dev-legend span:before{content:"";display:inline-block;width:9px;height:9px;margin-right:3px;vertical-align:-1px;background:var(--swatch)}
  @media (orientation:landscape) and (max-height:500px){.mask-dev-head{padding:3px 6px}.mask-dev-head h2{font-size:14px}.mask-dev-head button{min-height:34px}.mask-dev-topbar{padding:4px 6px}.mask-dev-dock{padding:4px 6px}.mask-dev-parts button{min-height:36px}.mask-dev-preview{width:68px;height:68px}.mask-dev-preview-card{right:6px;top:6px}.mask-dev-dock-row{margin-top:3px}}
  @media (orientation:portrait){.mask-dev-head h2{font-size:13px}.mask-dev-preview-card{top:auto;bottom:10px}.mask-dev-parts{grid-template-columns:repeat(3,1fr)}}`;
  document.head.appendChild(style);

  const dialog=document.createElement('dialog');dialog.id='uniform-mask-dev';
  dialog.innerHTML=`<div class="mask-dev-shell">
    <header class="mask-dev-head"><button type="button" id="mask-dev-close">Back</button><h2>Exact Pixel Mapper</h2><button type="button" id="mask-dev-undo">Undo</button><button type="button" id="mask-dev-redo">Redo</button></header>
    <div class="mask-dev-topbar">
      <label>Sheet <select id="mask-dev-source"></select></label>
      <button type="button" id="mask-dev-prev">◀</button><label>Frame <select id="mask-dev-frame"></select></label><button type="button" id="mask-dev-next">▶</button>
      <button type="button" id="mask-dev-zoom-out">Zoom −</button><span id="mask-dev-zoom-value" class="mask-dev-zoom-value"></span><button type="button" id="mask-dev-zoom-in">Zoom +</button><button type="button" id="mask-dev-fit">Fit</button>
      <button type="button" id="mask-dev-pan">Pan</button><button type="button" id="mask-dev-grid">Grid</button><button type="button" id="mask-dev-auto-guess">Auto Guess</button>
    </div>
    <main class="mask-dev-workspace"><div id="mask-dev-stage" class="mask-dev-stage"><div id="mask-dev-stage-inner" class="mask-dev-stage-inner"><canvas id="mask-dev-editor-canvas" class="mask-dev-editor"></canvas></div></div><div class="mask-dev-preview-card"><b>Live result</b><canvas id="mask-dev-preview" class="mask-dev-preview" width="128" height="128"></canvas></div><div id="mask-dev-data" class="mask-dev-data"><textarea id="mask-dev-json" spellcheck="false" aria-label="Uniform mask JSON"></textarea><div class="mask-dev-data-row"><button type="button" id="mask-dev-copy">Copy JSON</button><button type="button" id="mask-dev-import">Import JSON</button><button type="button" id="mask-dev-data-close">Close</button></div><p id="mask-dev-json-status">Exact labels are saved locally on this device.</p></div></main>
    <footer class="mask-dev-dock"><div class="mask-dev-parts">${CHANNELS.map(c=>`<button type="button" data-mask-channel="${c}">${c==='auto'?'Erase to Auto':c}</button>`).join('')}</div><div class="mask-dev-dock-row"><label>Brush <select id="mask-dev-brush"><option value="1">1 px</option><option value="3">3 px</option><option value="5">5 px</option></select></label><button type="button" id="mask-dev-reset-frame">Reset frame</button><button type="button" id="mask-dev-data-open">Mask JSON</button><div class="mask-dev-legend"><span style="--swatch:#4bdc50">Helmet</span><span style="--swatch:#28beff">Jersey</span><span style="--swatch:#ff3cb4">Pants</span><span style="--swatch:#ff961e">Stripe</span></div><span id="mask-dev-pixel" class="mask-dev-pixel">Pixel --,--</span><span id="mask-dev-frame-status" class="mask-dev-status"></span></div></footer>
  </div>`;
  document.body.appendChild(dialog);

  el('mask-dev-close').onclick=()=>{finishStroke();dialog.close();onChanged?.();};
  el('mask-dev-source').onchange=()=>{finishStroke();sourceId=el('mask-dev-source').value;row=0;col=0;populateFrames();render();centerStage();};
  el('mask-dev-frame').onchange=()=>{finishStroke();const [r,c]=el('mask-dev-frame').value.split(',').map(Number);row=r;col=c;render();centerStage();};
  el('mask-dev-prev').onclick=()=>stepFrame(-1);el('mask-dev-next').onclick=()=>stepFrame(1);
  el('mask-dev-brush').onchange=()=>{brush=Number(el('mask-dev-brush').value)||1;};
  for(const b of dialog.querySelectorAll('[data-mask-channel]'))b.onclick=()=>{channel=b.dataset.maskChannel;setPaintMode();syncButtons();};
  el('mask-dev-pan').onclick=()=>{painting=false;panning=false;setMode(el('mask-dev-pan').classList.contains('active')?'paint':'pan');};
  el('mask-dev-grid').onclick=()=>{showGrid=!showGrid;renderEditor();syncButtons();};
  el('mask-dev-auto-guess').onclick=()=>{showAuto=!showAuto;renderEditor();syncButtons();};
  el('mask-dev-zoom-out').onclick=()=>setZoom(zoom-2);el('mask-dev-zoom-in').onclick=()=>setZoom(zoom+2);el('mask-dev-fit').onclick=fitZoom;
  el('mask-dev-undo').onclick=undo;el('mask-dev-redo').onclick=redo;
  el('mask-dev-reset-frame').onclick=resetFrame;
  el('mask-dev-data-open').onclick=()=>{refreshJSON();el('mask-dev-data').classList.add('open');};el('mask-dev-data-close').onclick=()=>el('mask-dev-data').classList.remove('open');
  el('mask-dev-copy').onclick=async()=>{refreshJSON();try{await navigator.clipboard.writeText(el('mask-dev-json').value);el('mask-dev-json-status').textContent='Mask JSON copied.';}catch(e){el('mask-dev-json-status').textContent='Copy failed. Select the JSON and copy it manually.';}};
  el('mask-dev-import').onclick=()=>{try{finishStroke();const before=allOverridesSnapshot();importUniformMaskOverrides(el('mask-dev-json').value);const after=allOverridesSnapshot();pushGlobalHistory(before,after);render();onChanged?.();el('mask-dev-json-status').textContent='Imported mask JSON.';}catch(e){el('mask-dev-json-status').textContent='Import failed: '+e.message;}};

  const canvas=el('mask-dev-editor-canvas');
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  dialog.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();}});
}

function source(){return SOURCES.find(s=>s.id===sourceId)||SOURCES[0];}
function sourceImage(){return source().image();}
function frameImageData(){
  const image=sourceImage();if(!image?.complete||!image.naturalWidth)return null;
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,col*64,row*64,64,64,0,0,64,64);return ctx.getImageData(0,0,64,64);
}
function frameKey(){return `${row},${col}`;}
function frameSnapshot(s=sourceId,r=row,c=col){return {...(getUniformMaskOverrides()?.[s]?.[`${r},${c}`]||{})};}
function allOverridesSnapshot(){return getUniformMaskOverrides();}
function snapshotSignature(value){return JSON.stringify(value,Object.keys(value||{}).sort());}
function sameFrameSnapshot(a,b){const ae=Object.entries(a||{}).sort((x,y)=>Number(x[0])-Number(y[0])),be=Object.entries(b||{}).sort((x,y)=>Number(x[0])-Number(y[0]));return JSON.stringify(ae)===JSON.stringify(be);}
function setFrameSnapshot(s,r,c,snapshot){
  clearUniformMaskFrame(s,r,c);const edits=Object.entries(snapshot||{}).map(([index,ch])=>({x:Number(index)%64,y:Math.floor(Number(index)/64),channel:ch}));if(edits.length)applyUniformMaskEdits(s,r,c,edits);
}
function pushHistory(before,after,s=sourceId,r=row,c=col){if(sameFrameSnapshot(before,after))return;undoStack.push({type:'frame',source:s,row:r,col:c,before,after});if(undoStack.length>100)undoStack.shift();redoStack=[];syncHistoryButtons();}
function pushGlobalHistory(before,after){if(JSON.stringify(before)===JSON.stringify(after))return;undoStack.push({type:'global',before,after});if(undoStack.length>100)undoStack.shift();redoStack=[];syncHistoryButtons();}
function restoreGlobal(snapshot){importUniformMaskOverrides(snapshot||{});}
function navigateToAction(action){if(action.type!=='frame')return;sourceId=action.source;row=action.row;col=action.col;el('mask-dev-source').value=sourceId;populateFrames();el('mask-dev-frame').value=`${row},${col}`;}
function undo(){finishStroke();const action=undoStack.pop();if(!action)return;if(action.type==='global')restoreGlobal(action.before);else{navigateToAction(action);setFrameSnapshot(action.source,action.row,action.col,action.before);}redoStack.push(action);render();centerStage();onChanged?.();syncHistoryButtons();}
function redo(){finishStroke();const action=redoStack.pop();if(!action)return;if(action.type==='global')restoreGlobal(action.after);else{navigateToAction(action);setFrameSnapshot(action.source,action.row,action.col,action.after);}undoStack.push(action);render();centerStage();onChanged?.();syncHistoryButtons();}
function syncHistoryButtons(){if(el('mask-dev-undo'))el('mask-dev-undo').disabled=!undoStack.length;if(el('mask-dev-redo'))el('mask-dev-redo').disabled=!redoStack.length;}

function rawCanvas(frame){const raw=document.createElement('canvas');raw.width=64;raw.height=64;raw.getContext('2d').putImageData(frame,0,0);return raw;}
function manualAt(x,y){const idx=String(y*64+x);if(pending.has(y*64+x))return pending.get(y*64+x)==='auto'?null:pending.get(y*64+x);return frameSnapshot()[idx]||null;}
function originalLooksUniform(frame,x,y){const i=(y*64+x)*4,r=frame.data[i],g=frame.data[i+1],b=frame.data[i+2],a=frame.data[i+3];return a>0&&b>r*1.22&&b>g*1.08;}
function renderEditor(){
  const frame=frameImageData(),canvas=el('mask-dev-editor-canvas'),stage=el('mask-dev-stage'),inner=el('mask-dev-stage-inner');if(!frame||!canvas||!stage||!inner)return;
  const size=64*zoom;canvas.width=size;canvas.height=size;canvas.style.width=size+'px';canvas.style.height=size+'px';inner.style.width=Math.max(size,stage.clientWidth)+'px';inner.style.height=Math.max(size,stage.clientHeight)+'px';
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,size,size);ctx.drawImage(rawCanvas(frame),0,0,size,size);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const i=(y*64+x)*4;if(frame.data[i+3]===0)continue;
    const manual=manualAt(x,y);let c=manual;
    if(!c&&showAuto&&originalLooksUniform(frame,x,y))c=uniformChannelForPixel(col*64+x,row*64+y,sourceId);
    if(c&&OVERLAY[c]){ctx.fillStyle=OVERLAY[c];ctx.fillRect(x*zoom,y*zoom,zoom,zoom);}
  }
  if(showGrid&&zoom>=5){ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=1;for(let i=0;i<=64;i++){const p=Math.round(i*zoom)+.5;ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,size);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(size,p);ctx.stroke();}}
  el('mask-dev-zoom-value').textContent=`${zoom}×`;
}
function previewTarget(uniform){return {jersey:uniform.jersey,pants:uniform.pants||uniform.jersey,helmet:uniform.helmet,stripe:uniform.stripe,ramp:colorRamp(uniform.jersey),pantsRamp:colorRamp(uniform.pants||uniform.jersey),helmetRamp:colorRamp(uniform.helmet),stripeRamp:colorRamp(uniform.stripe)};}
function renderPreview(){
  const image=sourceImage(),canvas=el('mask-dev-preview');if(!image?.complete||!image.naturalWidth||!canvas)return;
  const sheet=makeTeamSpriteSheet(previewTarget(getUniform()),2,image,source().expanded);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,128,128);ctx.drawImage(sheet,col*64,row*64,64,64,0,0,128,128);
}
function manualCount(){return Object.keys(frameSnapshot()).length;}
function renderStatus(){if(!el('mask-dev-frame-status'))return;el('mask-dev-frame-status').textContent=`${source().label} · frame ${row},${col} · ${manualCount()} exact labels · ${channel==='auto'?'ERASE':channel.toUpperCase()} · brush ${brush}px`;}
function render(){renderEditor();renderPreview();renderStatus();refreshJSON();syncButtons();syncHistoryButtons();}
function refreshJSON(){if(el('mask-dev-json'))el('mask-dev-json').value=exportUniformMaskOverrides();}
function syncButtons(){
  for(const b of el('uniform-mask-dev').querySelectorAll('[data-mask-channel]'))b.classList.toggle('active',b.dataset.maskChannel===channel&&mode()!=='pan');
  el('mask-dev-pan').classList.toggle('active',mode()==='pan');el('mask-dev-grid').classList.toggle('active',showGrid);el('mask-dev-auto-guess').classList.toggle('active',showAuto);
}
let interactionMode='paint';function mode(){return interactionMode;}function setMode(next){interactionMode=next;syncButtons();}function setPaintMode(){setMode('paint');}
function populateFrames(){
  const image=sourceImage(),select=el('mask-dev-frame');select.innerHTML='';if(!image?.naturalWidth)return;
  const rows=Math.max(1,Math.floor(image.naturalHeight/64)),cols=Math.max(1,Math.floor(image.naturalWidth/64));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const option=document.createElement('option');option.value=`${r},${c}`;option.textContent=`${r},${c}`;select.appendChild(option);}row=Math.min(row,rows-1);col=Math.min(col,cols-1);select.value=`${row},${col}`;
}
function stepFrame(direction){finishStroke();const select=el('mask-dev-frame'),options=[...select.options],index=Math.max(0,options.findIndex(o=>o.value===`${row},${col}`)),next=Math.max(0,Math.min(options.length-1,index+direction));if(next===index)return;select.selectedIndex=next;const [r,c]=options[next].value.split(',').map(Number);row=r;col=c;render();centerStage();}
function setZoom(next){
  const stage=el('mask-dev-stage');if(!stage)return;next=Math.max(4,Math.min(24,Math.round(next)));const oldSize=64*zoom,cx=(stage.scrollLeft+stage.clientWidth/2)/Math.max(1,oldSize),cy=(stage.scrollTop+stage.clientHeight/2)/Math.max(1,oldSize);zoom=next;renderEditor();const newSize=64*zoom;requestAnimationFrame(()=>{stage.scrollLeft=Math.max(0,cx*newSize-stage.clientWidth/2);stage.scrollTop=Math.max(0,cy*newSize-stage.clientHeight/2);});}
function fitZoom(){const stage=el('mask-dev-stage');if(!stage)return;setZoom(Math.max(4,Math.min(16,Math.floor((Math.min(stage.clientWidth,stage.clientHeight)-20)/64))));centerStage();}
function centerStage(){const stage=el('mask-dev-stage');if(!stage)return;requestAnimationFrame(()=>{stage.scrollLeft=Math.max(0,(64*zoom-stage.clientWidth)/2);stage.scrollTop=Math.max(0,(64*zoom-stage.clientHeight)/2);});}
function pointFromEvent(event){const canvas=el('mask-dev-editor-canvas'),rect=canvas.getBoundingClientRect();return {x:Math.floor((event.clientX-rect.left)/rect.width*64),y:Math.floor((event.clientY-rect.top)/rect.height*64)};}
function updatePixelReadout(event){const p=pointFromEvent(event),frame=frameImageData();if(!frame||p.x<0||p.x>63||p.y<0||p.y>63){el('mask-dev-pixel').textContent='Pixel --,--';return;}const i=(p.y*64+p.x)*4;el('mask-dev-pixel').textContent=`Pixel ${p.x},${p.y} · RGB ${frame.data[i]},${frame.data[i+1]},${frame.data[i+2]}`;}
function paintAt(event){
  const p=pointFromEvent(event),frame=frameImageData();if(!frame||p.x<0||p.x>63||p.y<0||p.y>63)return;const radius=Math.floor(brush/2);
  for(let y=p.y-radius;y<=p.y+radius;y++)for(let x=p.x-radius;x<=p.x+radius;x++){
    if(x<0||x>63||y<0||y>63)continue;const i=(y*64+x)*4;if(frame.data[i+3]===0)continue;pending.set(y*64+x,channel);
  }
  renderEditor();renderStatus();updatePixelReadout(event);
}
function pointerDown(event){
  const canvas=el('mask-dev-editor-canvas');canvas.setPointerCapture?.(event.pointerId);updatePixelReadout(event);
  if(mode()==='pan'){panning=true;const stage=el('mask-dev-stage');panStart={x:event.clientX,y:event.clientY,left:stage.scrollLeft,top:stage.scrollTop};return;}
  painting=true;pending.clear();strokeBefore=frameSnapshot();paintAt(event);
}
function pointerMove(event){updatePixelReadout(event);if(panning&&panStart){const stage=el('mask-dev-stage');stage.scrollLeft=panStart.left-(event.clientX-panStart.x);stage.scrollTop=panStart.top-(event.clientY-panStart.y);return;}if(painting)paintAt(event);}
function pointerUp(){if(panning){panning=false;panStart=null;return;}finishStroke();}
function finishStroke(){
  if(!painting&&!pending.size)return;painting=false;if(!pending.size){strokeBefore=null;return;}const s=sourceId,r=row,c=col,before=strokeBefore||frameSnapshot();const edits=[];for(const [index,ch] of pending){edits.push({x:index%64,y:Math.floor(index/64),channel:ch});}pending.clear();applyUniformMaskEdits(s,r,c,edits);const after=frameSnapshot(s,r,c);pushHistory(before,after,s,r,c);strokeBefore=null;render();onChanged?.();
}
function resetFrame(){finishStroke();const before=frameSnapshot();if(!Object.keys(before).length)return;clearUniformMaskFrame(sourceId,row,col);pushHistory(before,{},sourceId,row,col);render();onChanged?.();}

export function openUniformMaskDev(uniformGetter,changed){
  ensureUI();getUniform=uniformGetter||getUniform;onChanged=changed||(()=>{});sourceId='gameplay';row=0;col=0;channel='helmet';brush=1;zoom=10;pending.clear();strokeBefore=null;interactionMode='paint';undoStack=[];redoStack=[];showGrid=true;showAuto=false;
  const sourceSelect=el('mask-dev-source');sourceSelect.innerHTML=SOURCES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('');sourceSelect.value=sourceId;el('mask-dev-brush').value='1';populateFrames();render();el('uniform-mask-dev').showModal();requestAnimationFrame(()=>{fitZoom();setZoom(Math.max(8,zoom));centerStage();});
}