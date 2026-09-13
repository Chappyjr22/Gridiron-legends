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
const OVERLAY={helmet:'rgba(75,220,80,.58)',jersey:'rgba(40,190,255,.52)',pants:'rgba(255,60,180,.58)',stripe:'rgba(255,150,30,.72)'};
let getUniform=()=>({jersey:'#000000',pants:'#ff2f8a',helmet:'#4e7a27',stripe:'#831100'}),onChanged=()=>{};
let sourceId='gameplay',row=0,col=0,channel='pants',brush=1,painting=false,pending=new Map();
const el=id=>document.getElementById(id);

function ensureUI(){
  if(el('uniform-mask-dev'))return;
  const style=document.createElement('style');
  style.textContent=`
  #uniform-mask-dev{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#081429;color:#fff}
  #uniform-mask-dev::backdrop{background:#02060c}
  .mask-dev-shell{height:100%;display:flex;flex-direction:column;background:#102d66;border:4px solid #fff;overflow:hidden}
  .mask-dev-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-bottom:3px solid #fff;background:#1f5bd5}.mask-dev-head h2{margin:0;font:900 19px "Courier New",monospace;text-transform:uppercase}.mask-dev-head button{min-height:42px}
  .mask-dev-body{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:minmax(320px,.95fr) minmax(320px,1.05fr);gap:10px;padding:10px}
  .mask-dev-panel{border:3px solid #fff;background:#153f8e;padding:9px;min-width:0}.mask-dev-panel h3{margin:0 0 7px;font:900 12px "Courier New",monospace;text-transform:uppercase}
  .mask-dev-canvas-wrap{display:grid;place-items:center;overflow:auto;background:#0a1730;border:2px solid #7ea4ff;padding:6px}.mask-dev-editor{width:min(384px,100%);height:auto;aspect-ratio:1;image-rendering:pixelated;touch-action:none;background:#2454a8}.mask-dev-preview{width:144px;height:144px;image-rendering:pixelated;background:#2454a8;border:2px solid #fff}
  .mask-dev-controls{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}.mask-dev-controls label{display:grid;gap:3px;font:900 8px "Courier New",monospace;text-transform:uppercase}.mask-dev-controls select{min-height:38px;background:#fff;color:#111;border:0;padding:6px;font:900 10px "Courier New",monospace}
  .mask-dev-tools{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:8px 0}.mask-dev-tools button{min-height:40px;padding:5px;font-size:9px}.mask-dev-tools button.active{background:#d8dc00;color:#111;border-color:#fff}.mask-dev-tools [data-mask-channel="helmet"]{box-shadow:inset 0 -5px #4bdc50}.mask-dev-tools [data-mask-channel="jersey"]{box-shadow:inset 0 -5px #28beff}.mask-dev-tools [data-mask-channel="pants"]{box-shadow:inset 0 -5px #ff3cb4}.mask-dev-tools [data-mask-channel="stripe"]{box-shadow:inset 0 -5px #ff961e}
  .mask-dev-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.mask-dev-row button{min-height:40px}.mask-dev-status{font:700 8px/1.4 "Courier New",monospace;color:#dce8ff;margin:7px 0}.mask-dev-legend{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:8px;text-transform:uppercase;margin-top:7px}.mask-dev-legend span:before{content:"";display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:-1px;background:var(--swatch)}
  .mask-dev-json{width:100%;min-height:118px;background:#07101f;color:#dce8ff;border:2px solid #7699e4;padding:6px;font:8px/1.3 "Courier New",monospace;resize:vertical}.mask-dev-note{font:8px/1.4 "Courier New",monospace;color:#c8d8ff;margin:7px 0}
  @media (orientation:landscape) and (max-height:500px){.mask-dev-body{grid-template-columns:minmax(300px,.9fr) minmax(350px,1.1fr);padding:6px;gap:6px}.mask-dev-panel{padding:6px}.mask-dev-head{padding:4px 8px}.mask-dev-head h2{font-size:16px}.mask-dev-editor{width:min(330px,100%)}.mask-dev-preview{width:105px;height:105px}.mask-dev-json{min-height:72px}.mask-dev-tools button{min-height:35px}}
  @media (orientation:portrait){.mask-dev-body{grid-template-columns:1fr}.mask-dev-editor{width:min(384px,94vw)}}`;
  document.head.appendChild(style);
  const dialog=document.createElement('dialog');dialog.id='uniform-mask-dev';
  dialog.innerHTML=`<div class="mask-dev-shell"><header class="mask-dev-head"><h2>Uniform Pixel Mask Dev</h2><button type="button" id="mask-dev-close">Back to Team Editor</button></header><div class="mask-dev-body"><section class="mask-dev-panel"><h3>Paint exact uniform pixels</h3><div class="mask-dev-controls"><label>Sprite sheet<select id="mask-dev-source"></select></label><label>Frame<select id="mask-dev-frame"></select></label></div><div class="mask-dev-canvas-wrap"><canvas id="mask-dev-editor-canvas" class="mask-dev-editor" width="384" height="384"></canvas></div><div class="mask-dev-tools">${CHANNELS.map(c=>`<button type="button" data-mask-channel="${c}">${c}</button>`).join('')}</div><div class="mask-dev-row"><label>Brush <select id="mask-dev-brush"><option value="1">1 px</option><option value="3">3 px</option><option value="5">5 px</option></select></label><button type="button" id="mask-dev-reset-frame">Reset frame to Auto</button></div><p id="mask-dev-frame-status" class="mask-dev-status"></p><div class="mask-dev-legend"><span style="--swatch:#4bdc50">Helmet</span><span style="--swatch:#28beff">Jersey</span><span style="--swatch:#ff3cb4">Pants</span><span style="--swatch:#ff961e">Stripe</span></div></section><section class="mask-dev-panel"><h3>Live recolor result</h3><div class="mask-dev-row"><canvas id="mask-dev-preview" class="mask-dev-preview" width="192" height="192"></canvas><div><p class="mask-dev-note"><b>How to use:</b><br>Pick a part, then paint over the pixels that truly belong to that part. AUTO erases your manual label and falls back to the current heuristic.</p><p class="mask-dev-note">Only pixels from the original blue uniform palette can be painted. Skin, football, facemask and transparent pixels are ignored automatically.</p></div></div><h3>Mask data</h3><div class="mask-dev-row"><button type="button" id="mask-dev-export">Refresh JSON</button><button type="button" id="mask-dev-copy">Copy JSON</button><button type="button" id="mask-dev-import">Import JSON</button></div><textarea id="mask-dev-json" class="mask-dev-json" spellcheck="false" aria-label="Uniform mask JSON"></textarea><p id="mask-dev-json-status" class="mask-dev-status">Overrides are saved locally on this device. Copy the JSON and send it back when the masks look right.</p></section></div></div>`;
  document.body.appendChild(dialog);
  el('mask-dev-close').onclick=()=>{flushPending();dialog.close();onChanged?.();};
  el('mask-dev-source').onchange=()=>{flushPending();sourceId=el('mask-dev-source').value;row=0;col=0;populateFrames();render();};
  el('mask-dev-frame').onchange=()=>{flushPending();const [r,c]=el('mask-dev-frame').value.split(',').map(Number);row=r;col=c;render();};
  el('mask-dev-brush').onchange=()=>{brush=Number(el('mask-dev-brush').value)||1;};
  for(const b of dialog.querySelectorAll('[data-mask-channel]'))b.onclick=()=>{channel=b.dataset.maskChannel;syncToolButtons();};
  el('mask-dev-reset-frame').onclick=()=>{pending.clear();clearUniformMaskFrame(sourceId,row,col);render();onChanged?.();};
  el('mask-dev-export').onclick=()=>refreshJSON();
  el('mask-dev-copy').onclick=async()=>{refreshJSON();try{await navigator.clipboard.writeText(el('mask-dev-json').value);el('mask-dev-json-status').textContent='Mask JSON copied.';}catch(e){el('mask-dev-json-status').textContent='Could not copy automatically. Select the JSON and copy it manually.';}};
  el('mask-dev-import').onclick=()=>{try{flushPending();importUniformMaskOverrides(el('mask-dev-json').value);render();onChanged?.();el('mask-dev-json-status').textContent='Imported mask JSON.';}catch(e){el('mask-dev-json-status').textContent='Import failed: '+e.message;}};
  const canvas=el('mask-dev-editor-canvas');
  canvas.addEventListener('pointerdown',event=>{painting=true;canvas.setPointerCapture?.(event.pointerId);paint(event);});
  canvas.addEventListener('pointermove',event=>{if(painting)paint(event);});
  canvas.addEventListener('pointerup',()=>{painting=false;flushPending();render();onChanged?.();});
  canvas.addEventListener('pointercancel',()=>{painting=false;flushPending();render();onChanged?.();});
}
function source(){return SOURCES.find(s=>s.id===sourceId)||SOURCES[0];}
function sourceImage(){return source().image();}
function editablePixel(r,g,b,a){return a>0&&b>r*1.22&&b>g*1.08;}
function frameImageData(){
  const image=sourceImage();if(!image?.complete||!image.naturalWidth)return null;
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,col*64,row*64,64,64,0,0,64,64);return ctx.getImageData(0,0,64,64);
}
function pendingChannel(x,y){return pending.get(y*64+x)||null;}
function channelAt(x,y){return pendingChannel(x,y)||uniformChannelForPixel(col*64+x,row*64+y,sourceId);}
function renderEditor(){
  const frame=frameImageData(),canvas=el('mask-dev-editor-canvas');if(!frame||!canvas)return;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,384,384);
  const raw=document.createElement('canvas');raw.width=64;raw.height=64;raw.getContext('2d').putImageData(frame,0,0);ctx.drawImage(raw,0,0,384,384);
  const scale=6;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const i=(y*64+x)*4,r=frame.data[i],g=frame.data[i+1],b=frame.data[i+2],a=frame.data[i+3];if(!editablePixel(r,g,b,a))continue;
    const c=channelAt(x,y);ctx.fillStyle=OVERLAY[c]||'rgba(255,255,255,.25)';ctx.fillRect(x*scale,y*scale,scale,scale);
  }
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;for(let i=0;i<=64;i++){ctx.beginPath();ctx.moveTo(i*scale,0);ctx.lineTo(i*scale,384);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*scale);ctx.lineTo(384,i*scale);ctx.stroke();}
}
function previewTarget(uniform){return {jersey:uniform.jersey,pants:uniform.pants||uniform.jersey,helmet:uniform.helmet,stripe:uniform.stripe,ramp:colorRamp(uniform.jersey),pantsRamp:colorRamp(uniform.pants||uniform.jersey),helmetRamp:colorRamp(uniform.helmet),stripeRamp:colorRamp(uniform.stripe)};}
function renderPreview(){
  const image=sourceImage(),canvas=el('mask-dev-preview');if(!image?.complete||!image.naturalWidth||!canvas)return;
  const sheet=makeTeamSpriteSheet(previewTarget(getUniform()),2,image,source().expanded);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,192,192);ctx.drawImage(sheet,col*64,row*64,64,64,0,0,192,192);
}
function manualCount(){return Object.keys(getUniformMaskOverrides()?.[sourceId]?.[`${row},${col}`]||{}).length;}
function renderStatus(){el('mask-dev-frame-status').textContent=`${source().label} · row ${row} col ${col} · ${manualCount()} manual pixel override${manualCount()===1?'':'s'} · ${channel.toUpperCase()} brush`;}
function render(){renderEditor();renderPreview();renderStatus();refreshJSON();syncToolButtons();}
function refreshJSON(){if(el('mask-dev-json'))el('mask-dev-json').value=exportUniformMaskOverrides();}
function syncToolButtons(){for(const b of el('uniform-mask-dev').querySelectorAll('[data-mask-channel]'))b.classList.toggle('active',b.dataset.maskChannel===channel);}
function populateFrames(){
  const image=sourceImage(),select=el('mask-dev-frame');select.innerHTML='';if(!image?.naturalWidth)return;
  const rows=Math.max(1,Math.floor(image.naturalHeight/64)),cols=Math.max(1,Math.floor(image.naturalWidth/64));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const option=document.createElement('option');option.value=`${r},${c}`;option.textContent=`Row ${r} · Col ${c}`;select.appendChild(option);}select.value=`${Math.min(row,rows-1)},${Math.min(col,cols-1)}`;
}
function paint(event){
  const canvas=el('mask-dev-editor-canvas'),rect=canvas.getBoundingClientRect(),x=Math.floor((event.clientX-rect.left)/rect.width*64),y=Math.floor((event.clientY-rect.top)/rect.height*64);if(x<0||x>63||y<0||y>63)return;
  const frame=frameImageData();if(!frame)return;const radius=Math.floor(brush/2);
  for(let yy=y-radius;yy<=y+radius;yy++)for(let xx=x-radius;xx<=x+radius;xx++){
    if(xx<0||xx>63||yy<0||yy>63)continue;const i=(yy*64+xx)*4;if(!editablePixel(frame.data[i],frame.data[i+1],frame.data[i+2],frame.data[i+3]))continue;pending.set(yy*64+xx,channel);
  }
  renderEditor();renderStatus();
}
function flushPending(){
  if(!pending.size)return;const edits=[];for(const [index,c] of pending){edits.push({x:index%64,y:Math.floor(index/64),channel:c});}pending.clear();applyUniformMaskEdits(sourceId,row,col,edits);
}
export function openUniformMaskDev(uniformGetter,changed){
  ensureUI();getUniform=uniformGetter||getUniform;onChanged=changed||(()=>{});sourceId='gameplay';row=0;col=0;channel='pants';brush=1;pending.clear();
  const sourceSelect=el('mask-dev-source');sourceSelect.innerHTML=SOURCES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('');sourceSelect.value=sourceId;el('mask-dev-brush').value='1';populateFrames();render();el('uniform-mask-dev').showModal();
}