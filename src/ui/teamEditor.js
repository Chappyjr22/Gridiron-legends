import {ensureUniformVariants,UNIFORM_VARIANTS} from '../rendering/uniformVariants.js';
import {makeTeamSpriteSheet,spriteImage,colorRamp} from '../rendering/spriteSheets.js';

const BRAND_FIELDS=[
 {key:'primary',label:'Primary'},
 {key:'secondary',label:'Secondary'},
 {key:'accent',label:'Accent'}
];
const UNIFORM_FIELDS=[
 {key:'helmet',label:'Helmet'},
 {key:'jersey',label:'Jersey'},
 {key:'pants',label:'Pants'},
 {key:'stripe',label:'Stripe'}
];
const PREVIEW_STATES=[
 {key:'idle',label:'Idle',row:0,col:0},
 {key:'run',label:'Run',row:2,col:2},
 {key:'throw',label:'Throw',row:3,col:2},
 {key:'dive',label:'Dive',row:4,col:5}
];
const HEX=/^#[0-9a-f]{6}$/i;
let state=null,activeVariant='home',screen='teams';
const el=id=>document.getElementById(id);
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function titleCase(value){return String(value||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function teamLabel(team){return `${team.city} ${team.name}`;}
function ensureUI(){
 if(el('team-editor-dialog'))return;
 const style=document.createElement('style');
 style.textContent=`
 #team-editor-dialog{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#2868e8;color:#fff;image-rendering:pixelated}
 #team-editor-dialog::backdrop{background:#081429}
 .team-editor-shell{position:absolute;inset:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(7px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));display:flex;flex-direction:column;overflow:hidden;background:#2f6df0;border:4px solid #eaf1ff;box-shadow:6px 6px 0 #1d2f57}
 .team-editor-top{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:8px 12px;border-bottom:3px solid rgba(255,255,255,.28)}
 .team-editor-top h2{margin:0;text-align:center;color:#fff;font:900 28px/1 "Courier New",monospace;letter-spacing:.12em;text-transform:uppercase}
 .team-editor-top button{min-height:44px;background:#356df0;border:3px solid #fff;color:#fff;box-shadow:4px 4px 0 #354a73}
 .team-editor-content{flex:1;min-height:0;overflow:auto;padding:10px 12px}
 .team-browser-tabs{display:flex;gap:8px;justify-content:center;margin-bottom:10px}.team-browser-tabs button{min-width:130px;min-height:52px}.team-browser-tabs button.active,.uniform-tab.active{background:#d8dc00;color:#fff;border-color:#fff}
 .team-browser-section{margin:0 auto 12px;max-width:1100px}.team-browser-section h3{margin:8px 0 6px;font:900 16px "Courier New",monospace;letter-spacing:.08em;text-transform:uppercase;color:#fff}
 .team-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.team-grid button{min-height:56px;background:#356df0;border:3px solid #fff;color:#fff;box-shadow:4px 4px 0 #354a73;font-size:12px}.team-grid button.current{outline:4px solid #d8dc00;outline-offset:-6px}
 .team-editor-actions{display:flex;gap:10px;padding:9px 12px;border-top:3px solid rgba(255,255,255,.28)}.team-editor-actions button{flex:1;min-height:48px;background:#356df0;border:3px solid #fff;color:#fff;box-shadow:4px 4px 0 #354a73}.team-editor-actions .primary{background:#d8dc00}
 .team-detail{max-width:1120px;margin:auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:12px}.editor-panel{border:3px solid #fff;background:rgba(29,75,174,.3);padding:12px}.editor-panel legend,.panel-title{padding:0 8px;color:#fff;font:900 14px "Courier New",monospace;letter-spacing:.08em;text-transform:uppercase}
 .team-detail-name{margin:0 0 12px;text-align:center;font:900 28px "Courier New",monospace;letter-spacing:.12em;text-transform:uppercase}.team-detail-meta{display:flex;gap:8px;justify-content:center;margin-bottom:10px}.team-chip{border:2px solid #fff;padding:5px 8px;font-size:9px;text-transform:uppercase}
 .uniform-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:6px 0 12px}.uniform-tab{min-height:48px;background:#356df0;border:3px solid #fff;color:#fff;box-shadow:3px 3px 0 #354a73}
 .sprite-variant-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.sprite-card{display:grid;place-items:center;gap:4px;min-height:122px;border:2px solid rgba(255,255,255,.7);background:rgba(12,43,107,.26);padding:5px}.sprite-card.active{border:4px solid #d8dc00}.sprite-card canvas{width:72px;height:72px;image-rendering:pixelated;background:transparent}.sprite-card b{font-size:9px;text-transform:uppercase}
 .sprite-state-row{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.sprite-state{display:grid;place-items:center;border:2px solid rgba(255,255,255,.58);background:rgba(12,43,107,.22);padding:4px}.sprite-state canvas{width:58px;height:58px;image-rendering:pixelated;background:transparent}.sprite-state span{font-size:8px;text-transform:uppercase}
 .color-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.color-control{display:grid;grid-template-columns:46px 1fr;gap:8px;align-items:center}.color-control input[type=color]{width:46px;height:46px;padding:2px;border:3px solid #fff;background:#2868e8}.color-control input[type=text]{width:100%;min-height:38px;background:#fff;border:0;color:#0b0b0b;padding:6px;font:900 12px "Courier New",monospace;text-transform:uppercase}.color-control label{display:block;font:900 9px "Courier New",monospace;text-transform:uppercase;margin-bottom:3px}
 .editor-subhead{font:900 11px "Courier New",monospace;text-transform:uppercase;margin:11px 0 7px}.uniform-pref{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:center;margin-top:11px}.uniform-pref select{min-height:40px;background:#fff;color:#101010;border:0;padding:6px;font:900 11px "Courier New",monospace}.editor-note{font-size:8px;line-height:1.4;opacity:.8;margin:10px 0 0}.editor-status{text-align:center;font-size:9px;min-height:14px;margin-top:8px}
 @media (orientation:landscape) and (max-height:500px){.team-editor-top{padding:5px 10px}.team-editor-top h2{font-size:22px}.team-editor-content{padding:7px 10px}.team-grid button{min-height:47px}.team-detail{grid-template-columns:.82fr 1.18fr;gap:8px}.editor-panel{padding:7px}.team-detail-name{font-size:20px;margin-bottom:6px}.sprite-card{min-height:91px}.sprite-card canvas{width:52px;height:52px}.sprite-state canvas{width:42px;height:42px}.uniform-tabs{margin-bottom:7px}.uniform-tab{min-height:39px}.color-control input[type=color]{height:38px}.color-control input[type=text]{min-height:34px}.team-editor-actions{padding:6px 10px}.team-editor-actions button{min-height:40px}}
 @media (orientation:portrait){.team-grid{grid-template-columns:repeat(2,1fr)}.team-detail{grid-template-columns:1fr}.sprite-variant-row{grid-template-columns:repeat(3,1fr)}}
 `;
 document.head.appendChild(style);
 const dialog=document.createElement('dialog');dialog.id='team-editor-dialog';
 dialog.innerHTML=`<div class="team-editor-shell"><header class="team-editor-top"><button type="button" id="team-editor-back">Back</button><h2>Team Editor</h2><button type="button" id="team-editor-close">Done</button></header><div id="team-editor-content" class="team-editor-content"></div><footer id="team-editor-actions" class="team-editor-actions"></footer></div>`;
 document.body.appendChild(dialog);
 el('team-editor-close').onclick=()=>dialog.close();
 el('team-editor-back').onclick=()=>screen==='detail'?showBrowser():dialog.close();
}
function currentTeam(){return state?.franchise?.teams?.find(t=>t.id===state.selectedTeamId)||null;}
function divisionsForConference(conf){
 const teams=(state?.franchise?.teams||[]).filter(t=>String(t.conference||'league')===conf);
 const divisions=[...new Set(teams.map(t=>t.division).filter(Boolean))];
 return divisions.length?divisions.map(div=>({label:titleCase(div),teams:teams.filter(t=>t.division===div)})):[{label:titleCase(conf),teams}];
}
function conferences(){return [...new Set((state?.franchise?.teams||[]).map(t=>String(t.conference||'league')))];}
function showBrowser(){
 screen='teams';const confs=conferences();if(!state.activeConference||!confs.includes(state.activeConference))state.activeConference=confs[0];
 el('team-editor-back').textContent='Close';
 el('team-editor-content').innerHTML=`<div class="team-browser-tabs">${confs.map(c=>`<button type="button" data-conf="${escapeHtml(c)}" class="${c===state.activeConference?'active':''}">${escapeHtml(titleCase(c))}</button>`).join('')}</div><div id="team-browser-groups"></div>`;
 for(const b of el('team-editor-content').querySelectorAll('[data-conf]'))b.onclick=()=>{state.activeConference=b.dataset.conf;showBrowser();};
 const groups=el('team-browser-groups');groups.innerHTML=divisionsForConference(state.activeConference).map(group=>`<section class="team-browser-section"><h3>${escapeHtml(group.label)}</h3><div class="team-grid">${group.teams.map(team=>`<button type="button" data-team-id="${escapeHtml(team.id)}" class="${team.id===state.selectedTeamId?'current':''}">${escapeHtml(team.city||team.name)}</button>`).join('')}</div></section>`).join('');
 for(const b of groups.querySelectorAll('[data-team-id]'))b.onclick=()=>{state.selectedTeamId=b.dataset.teamId;showDetail();};
 el('team-editor-actions').innerHTML=`<button type="button" id="team-editor-restore-all">Restore all teams</button><button type="button" id="team-editor-done" class="primary">Done</button>`;
 el('team-editor-done').onclick=()=>el('team-editor-dialog').close();
 el('team-editor-restore-all').onclick=()=>{for(const team of state.franchise.teams){delete team.uniforms;delete team.uniformPreference;ensureUniformVariants(team);}state.persist?.(state.franchise);showBrowser();};
}
function control(field,value,scope){return `<div class="color-control"><input type="color" data-color-picker="${scope}.${field.key}" value="${escapeHtml(value)}"><div><label>${escapeHtml(field.label)}</label><input type="text" maxlength="7" spellcheck="false" data-color-text="${scope}.${field.key}" value="${escapeHtml(value)}"></div></div>`;}
function wireControls(root){
 for(const picker of root.querySelectorAll('[data-color-picker]'))picker.oninput=()=>{const text=root.querySelector(`[data-color-text="${picker.dataset.colorPicker}"]`);if(text)text.value=picker.value.toUpperCase();updatePreview();};
 for(const text of root.querySelectorAll('[data-color-text]'))text.oninput=()=>{if(HEX.test(text.value)){const picker=root.querySelector(`[data-color-picker="${text.dataset.colorText}"]`);if(picker)picker.value=text.value;updatePreview();}};
}
function readFields(fields,scope,root){const out={};for(const field of fields){const input=root.querySelector(`[data-color-text="${scope}.${field.key}"]`),value=String(input?.value||'').trim();if(!HEX.test(value))return null;out[field.key]=value.toLowerCase();}return out;}
function valuesFromControls(){
 const brand=readFields(BRAND_FIELDS,'brand',el('team-brand-colors'));const uniform=readFields(UNIFORM_FIELDS,`uniform.${activeVariant}`,el('team-uniform-colors'));if(!brand||!uniform)return null;return {brand,uniform,preference:el('team-uniform-preference').value};
}
function variantValues(team,variant){
 ensureUniformVariants(team);if(variant===activeVariant){const values=valuesFromControls();if(values)return values.uniform;}return team.uniforms[variant];
}
function previewTarget(uniform){return {jersey:uniform.jersey,pants:uniform.pants||uniform.jersey,helmet:uniform.helmet,stripe:uniform.stripe,ramp:colorRamp(uniform.jersey),pantsRamp:colorRamp(uniform.pants||uniform.jersey)};}
function drawSprite(canvas,uniform,row=0,col=0,skin=2){
 if(!canvas||!spriteImage.complete||!spriteImage.naturalWidth)return;
 const sheet=makeTeamSpriteSheet(previewTarget(uniform),skin,spriteImage,false);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(sheet,col*64,row*64,64,64,0,0,canvas.width,canvas.height);
}
function renderSpritePreviews(){
 const team=currentTeam();if(!team)return;
 for(const variant of UNIFORM_VARIANTS){const uniform=variantValues(team,variant),canvas=el(`uniform-preview-${variant}`);drawSprite(canvas,uniform,0,0,2);}
 const uniform=variantValues(team,activeVariant);for(const stateDef of PREVIEW_STATES)drawSprite(el(`sprite-state-${stateDef.key}`),uniform,stateDef.row,stateDef.col,2);
 for(const card of document.querySelectorAll('.sprite-card'))card.classList.toggle('active',card.dataset.variant===activeVariant);
}
function updatePreview(){
 const team=currentTeam(),values=valuesFromControls();if(!team||!values)return;
 el('team-detail-name').textContent=teamLabel(team);renderSpritePreviews();
}
function renderVariantControls(){
 const team=currentTeam();ensureUniformVariants(team);const uniform=team.uniforms[activeVariant];
 for(const b of document.querySelectorAll('.uniform-tab'))b.classList.toggle('active',b.dataset.variant===activeVariant);
 const root=el('team-uniform-colors');root.innerHTML=UNIFORM_FIELDS.map(f=>control(f,uniform[f.key],`uniform.${activeVariant}`)).join('');wireControls(root);updatePreview();
}
function showDetail(){
 screen='detail';const team=currentTeam();if(!team)return;ensureUniformVariants(team);activeVariant='home';el('team-editor-back').textContent='Teams';
 el('team-editor-content').innerHTML=`<div class="team-detail"><section><h3 id="team-detail-name" class="team-detail-name">${escapeHtml(teamLabel(team))}</h3><div class="team-detail-meta"><span class="team-chip">${escapeHtml(team.abbr)}</span><span class="team-chip">${escapeHtml(titleCase(team.conference||'League'))}</span>${team.division?`<span class="team-chip">${escapeHtml(titleCase(team.division))}</span>`:''}</div><fieldset class="editor-panel"><legend>Uniforms</legend><div class="sprite-variant-row">${UNIFORM_VARIANTS.map(v=>`<button type="button" class="sprite-card" data-variant="${v}"><canvas id="uniform-preview-${v}" width="64" height="64"></canvas><b>${v}</b></button>`).join('')}</div><div class="sprite-state-row">${PREVIEW_STATES.map(s=>`<div class="sprite-state"><canvas id="sprite-state-${s.key}" width="64" height="64"></canvas><span>${s.label}</span></div>`).join('')}</div><p class="editor-note">These are the actual recolored gameplay sprites. Use the animation strip to inspect the experimental pants mask before this branch is merged.</p></fieldset></section><section><fieldset class="editor-panel"><legend>Colors</legend><div class="uniform-tabs">${UNIFORM_VARIANTS.map(v=>`<button type="button" class="uniform-tab" data-variant="${v}">${v}</button>`).join('')}</div><div class="editor-subhead">${activeVariant} uniform</div><div id="team-uniform-colors" class="color-grid"></div><div class="editor-subhead">Team branding</div><div id="team-brand-colors" class="color-grid">${BRAND_FIELDS.map(f=>control(f,team.colors[f.key],'brand')).join('')}</div><div class="uniform-pref"><label for="team-uniform-preference">Game uniform</label><select id="team-uniform-preference"><option value="auto">Auto</option><option value="home">Home</option><option value="away">Away</option><option value="alternate">Alternate</option></select></div><div id="team-editor-status" class="editor-status"></div></fieldset></section></div>`;
 wireControls(el('team-brand-colors'));el('team-uniform-preference').value=team.uniformPreference||'auto';el('team-uniform-preference').onchange=updatePreview;
 for(const b of document.querySelectorAll('[data-variant]'))b.onclick=()=>{const current=valuesFromControls();if(current){team.colors={...team.colors,...current.brand};team.uniforms[activeVariant]={...team.uniforms[activeVariant],...current.uniform};}activeVariant=b.dataset.variant;renderVariantControls();};
 renderVariantControls();
 el('team-editor-actions').innerHTML=`<button type="button" id="team-editor-restore">Restore default</button><button type="button" id="team-editor-save" class="primary">Save team</button>`;
 el('team-editor-restore').onclick=()=>{delete team.uniforms;delete team.uniformPreference;ensureUniformVariants(team);showDetail();};
 el('team-editor-save').onclick=saveTeam;
}
async function saveTeam(){
 const team=currentTeam(),values=valuesFromControls();if(!team||!values){el('team-editor-status').textContent='Use six-digit hex colors like #1A2B3C.';return;}
 ensureUniformVariants(team);team.colors={...team.colors,...values.brand};team.uniforms[activeVariant]={...team.uniforms[activeVariant],...values.uniform};team.uniformPreference=values.preference;
 const ok=await state.persist?.(state.franchise,team);if(ok===false){el('team-editor-status').textContent='Could not save team.';return;}state.onApplied?.(team);el('team-editor-status').textContent='Saved.';renderSpritePreviews();
}
export function openTeamEditor(franchise,selectedTeamId,persist,onApplied){
 ensureUI();state={franchise,persist,onApplied,selectedTeamId,activeConference:null};for(const team of franchise?.teams||[])ensureUniformVariants(team);showBrowser();if(!el('team-editor-dialog').open)el('team-editor-dialog').showModal();
}
export function initMainTeamEditor(getFranchise,getTeamId,persist,onApplied){ensureUI();if(el('btn-team-editor'))return;const button=document.createElement('button');button.id='btn-team-editor';button.type='button';button.textContent='Team Editor';const anchor=el('btn-menu-settings');anchor?.parentElement?.insertBefore(button,anchor);button.onclick=()=>openTeamEditor(getFranchise(),getTeamId(),persist,onApplied);}
export function addCareerTeamEditorButton(getCareer,persist,onApplied){const heading=el('my-team-name');if(!heading||el('career-team-editor'))return;const button=document.createElement('button');button.id='career-team-editor';button.type='button';button.className='sports-button blue';button.textContent='Team Editor';button.style.marginLeft='10px';heading.insertAdjacentElement('afterend',button);button.onclick=()=>{const c=getCareer();if(c)openTeamEditor(c.league,c.teamId,()=>persist(),()=>onApplied?.());};}
