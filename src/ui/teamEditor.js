import {ensureUniformVariants,UNIFORM_VARIANTS} from '../rendering/uniformVariants.js';

const BRAND_FIELDS=[
 {key:'primary',label:'Team primary'},
 {key:'secondary',label:'Team secondary'},
 {key:'accent',label:'Team accent'}
];
const UNIFORM_FIELDS=[
 {key:'jersey',label:'Jersey'},
 {key:'helmet',label:'Helmet'},
 {key:'stripe',label:'Uniform stripe'}
];
const HEX=/^#[0-9a-f]{6}$/i;
let state=null,activeVariant='home',drafts=new Map();
const el=id=>document.getElementById(id);
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function ensureUI(){
 if(el('team-editor-dialog'))return;
 const style=document.createElement('style');
 style.textContent=`
 #team-editor-dialog{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;color:#f5edcf}
 #team-editor-dialog::backdrop{background:rgba(2,5,7,.82);backdrop-filter:blur(2px)}
 .team-editor-card{position:absolute;inset:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));display:flex;flex-direction:column;background:#0c1720;border:3px solid #f5edcf;box-shadow:8px 8px 0 #000;overflow:hidden}
 .team-editor-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-bottom:2px solid #344b58;background:#10263a}
 .team-editor-head h2{margin:0;color:#f4c542;font:900 23px/1 Impact,"Arial Black",sans-serif;letter-spacing:.06em;text-transform:uppercase}.team-editor-head p{margin:4px 0 0;color:#9db0bc;font-size:9px;text-transform:uppercase}
 .team-editor-body{display:grid;grid-template-columns:minmax(230px,.72fr) minmax(380px,1.28fr);gap:12px;padding:12px;overflow:auto;min-height:0}.team-editor-panel{background:#091117;border:2px solid #29404e;padding:11px;min-width:0}
 .team-editor-select{width:100%;min-height:44px;background:#172d46;border:2px solid #567493;color:#f5edcf;padding:8px;font:800 11px "Courier New",monospace}.team-editor-preview{display:grid;place-items:center;gap:8px;min-height:190px;text-align:center;background:linear-gradient(#173451,#0a1824);border:2px solid #45657c;padding:10px}.team-editor-badge{width:64px;height:64px;display:grid;place-items:center;background:var(--p);border:5px solid var(--a);color:#fff;font:900 18px Impact,"Arial Black",sans-serif;box-shadow:4px 4px 0 #000}.team-editor-uniform{position:relative;width:94px;height:100px}.team-editor-helmet{position:absolute;left:29px;top:1px;width:38px;height:30px;border-radius:20px 20px 10px 10px;background:var(--helmet);border:3px solid #091117;box-shadow:inset 4px 0 rgba(255,255,255,.12)}.team-editor-helmet:after{content:"";position:absolute;left:15px;top:0;width:5px;height:28px;background:var(--stripe)}.team-editor-jersey{position:absolute;left:17px;top:33px;width:62px;height:54px;clip-path:polygon(13% 0,87% 0,100% 24%,84% 37%,78% 100%,22% 100%,16% 37%,0 24%);background:var(--jersey)}.team-editor-jersey:after{content:"";position:absolute;left:28px;top:0;width:6px;height:54px;background:var(--stripe)}
 .team-editor-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.team-editor-tabs button{min-height:42px;padding:8px;font-size:10px;box-shadow:none}.team-editor-tabs button.active{background:#f4c542;color:#171307;border-color:#fff1a4}.team-editor-pref{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;margin-bottom:10px;background:#10202d;border:1px solid #385466;padding:8px}.team-editor-pref label{color:#f4c542;font-size:9px;font-weight:900;text-transform:uppercase}.team-editor-pref select{min-height:40px;background:#071017;color:#f5edcf;border:1px solid #4b687a;font:800 10px "Courier New",monospace;padding:6px}
 .team-editor-section-title{color:#f4c542;font-size:10px;font-weight:900;text-transform:uppercase;margin:4px 0 8px}.team-editor-colors{display:grid;grid-template-columns:1fr 1fr;gap:8px}.team-editor-color{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;background:#10202d;border:1px solid #385466;padding:8px}.team-editor-color input[type=color]{width:44px;height:44px;padding:2px;border:2px solid #708b9c;background:#071017}.team-editor-color input[type=text]{width:100%;min-height:40px;background:#071017;border:1px solid #4b687a;color:#f5edcf;padding:8px;font:800 11px "Courier New",monospace;text-transform:uppercase}.team-editor-color label{display:block;color:#f4c542;font-size:9px;font-weight:900;text-transform:uppercase;margin-bottom:4px}.team-editor-actions{display:flex;gap:8px;padding:10px 12px;border-top:2px solid #344b58;background:#0a141b}.team-editor-actions button{flex:1;min-height:46px}.team-editor-save{background:#f4c542!important;color:#151108!important;border-color:#fff1a4!important}.team-editor-note{color:#9db0bc;font-size:8px;line-height:1.35;margin:8px 0 0}
 @media (orientation:landscape) and (max-height:500px){.team-editor-body{grid-template-columns:220px 1fr;padding:8px;gap:8px}.team-editor-preview{min-height:132px}.team-editor-uniform{transform:scale(.68);margin:-16px 0}.team-editor-head{padding:7px 10px}.team-editor-head h2{font-size:18px}.team-editor-color{padding:5px}.team-editor-color input[type=color]{height:36px}.team-editor-color input[type=text]{min-height:34px}.team-editor-actions{padding:6px 9px}.team-editor-actions button{min-height:40px}.team-editor-tabs button{min-height:36px}.team-editor-pref select{min-height:34px}}
 @media (orientation:portrait){.team-editor-body{grid-template-columns:1fr}.team-editor-colors{grid-template-columns:1fr 1fr}}
 `;
 style.textContent+=`
 .team-editor-head h2{font:28px var(--sports-face)}
 .team-editor-head p,.team-editor-note{font:13px/1.4 Arial,sans-serif;text-transform:none;letter-spacing:normal}
 .team-editor-body{flex:1}
 .team-editor-head,.team-editor-actions{flex-shrink:0}
 .team-editor-head>button{min-width:44px;min-height:44px}
 .team-editor-panel>.label,.team-editor-color label,.team-editor-pref label,.team-editor-section-title{font:16px var(--sports-face);color:#ffda54}
 .team-editor-tabs button,.team-editor-actions button{font:22px var(--sports-face);min-height:44px}
 .team-editor-color input[type=text],.team-editor-select,.team-editor-pref select{font:16px Arial,sans-serif;min-height:44px}
 #team-editor-status{color:#e3edfa;font:14px/1.3 Arial,sans-serif}
 .team-editor-color{grid-template-columns:44px minmax(0,1fr)}
 .team-editor-color input[type=color]{height:44px;min-height:44px}
 .team-editor-actions{margin-top:auto}
 @media(orientation:landscape) and (max-height:500px){
  .team-editor-body{grid-template-columns:minmax(180px,.7fr) minmax(0,1.3fr)}
  .team-editor-head h2{font-size:24px}.team-editor-head p{display:none}
  .team-editor-panel{padding:8px}.team-editor-colors{grid-template-columns:repeat(2,minmax(0,1fr))}
  .team-editor-color{gap:5px}.team-editor-preview{min-height:120px}
 }
 @media(orientation:portrait){.team-editor-colors{grid-template-columns:1fr}.team-editor-preview{min-height:120px}.team-editor-pref{grid-template-columns:1fr}}
 `;
 document.head.appendChild(style);
 const dialog=document.createElement('dialog');dialog.id='team-editor-dialog';dialog.setAttribute('aria-label','Team Editor');
 dialog.innerHTML=`<div class="team-editor-card"><header class="team-editor-head"><div><h2>Team Editor</h2><p>Brand + home / away / alternate uniforms</p></div><button type="button" id="team-editor-close" aria-label="Close team editor">✕</button></header><div class="team-editor-body"><section class="team-editor-panel"><label class="label" for="team-editor-select">Team</label><select id="team-editor-select" class="team-editor-select"></select><div class="team-editor-preview" id="team-editor-preview"><div id="team-editor-badge" class="team-editor-badge"></div><div id="team-editor-uniform" class="team-editor-uniform"><div class="team-editor-helmet"></div><div class="team-editor-jersey"></div></div><strong id="team-editor-name"></strong><span id="team-editor-status" role="status" class="experience-note"></span></div></section><section class="team-editor-panel"><div class="team-editor-pref"><label for="team-uniform-preference">Game uniform</label><select id="team-uniform-preference"><option value="auto">Auto</option><option value="home">Home</option><option value="away">Away</option><option value="alternate">Alternate</option></select></div><div class="team-editor-tabs" id="team-editor-tabs">${UNIFORM_VARIANTS.map(v=>`<button type="button" data-uniform-variant="${v}">${v}</button>`).join('')}</div><div class="team-editor-section-title">Uniform colors</div><div class="team-editor-colors" id="team-editor-uniform-colors"></div><div class="team-editor-section-title">Team branding</div><div class="team-editor-colors" id="team-editor-brand-colors"></div><p class="team-editor-note">Auto uses Home for your team and Away for opponents. Choose Alternate to wear your alternate set. Save team keeps all three sets.</p></section></div><footer class="team-editor-actions"><button type="button" id="team-editor-cancel">Cancel</button><button type="button" id="team-editor-save" class="team-editor-save">Save team</button></footer></div>`;
 document.body.appendChild(dialog);
 el('team-editor-close').onclick=()=>dialog.close();el('team-editor-cancel').onclick=()=>dialog.close();el('team-editor-select').onchange=()=>loadTeam(el('team-editor-select').value);el('team-editor-save').onclick=saveTeam;el('team-uniform-preference').onchange=()=>updatePreview();
 for(const b of el('team-editor-tabs').querySelectorAll('button'))b.onclick=()=>{if(!captureDraft()){el('team-editor-status').textContent='Use a color like #1A2B3C before changing sets.';return;}activeVariant=b.dataset.uniformVariant;renderVariant();};
}
function currentTeam(){return drafts.get(el('team-editor-select')?.value)||null;}
function captureDraft(){const team=currentTeam(),values=valuesFromControls();if(!team||!values)return false;team.colors={...team.colors,...values.brand};team.uniforms[activeVariant]={...team.uniforms[activeVariant],...values.uniform};team.uniformPreference=values.preference;return true;}
function control(field,value,scope){return `<div class="team-editor-color"><input type="color" aria-label="${field.label} color" data-color-picker="${scope}.${field.key}" value="${escapeHtml(value)}"><div><label>${escapeHtml(field.label)}</label><input type="text" aria-label="${field.label} hex" maxlength="7" spellcheck="false" autocapitalize="characters" data-color-text="${scope}.${field.key}" value="${escapeHtml(value)}"></div></div>`;}
function wireControls(root){
 for(const picker of root.querySelectorAll('[data-color-picker]'))picker.oninput=()=>{const text=root.querySelector(`[data-color-text="${picker.dataset.colorPicker}"]`);if(text)text.value=picker.value.toUpperCase();updatePreview();};
 for(const text of root.querySelectorAll('[data-color-text]'))text.oninput=()=>{if(HEX.test(text.value)){const picker=root.querySelector(`[data-color-picker="${text.dataset.colorText}"]`);if(picker)picker.value=text.value;updatePreview();}};
}
function readFields(fields,scope,root){const out={};for(const field of fields){const input=root.querySelector(`[data-color-text="${scope}.${field.key}"]`),value=String(input?.value||'').trim();if(!HEX.test(value))return null;out[field.key]=value.toLowerCase();}return out;}
function renderVariant(){
 const team=currentTeam();if(!team)return;const uniforms=ensureUniformVariants(team),uniform=uniforms[activeVariant];
 for(const b of el('team-editor-tabs').querySelectorAll('button')){b.classList.toggle('active',b.dataset.uniformVariant===activeVariant);b.setAttribute('aria-pressed',String(b.dataset.uniformVariant===activeVariant));}
 const root=el('team-editor-uniform-colors');root.innerHTML=UNIFORM_FIELDS.map(f=>control(f,uniform[f.key],`uniform.${activeVariant}`)).join('');wireControls(root);updatePreview();
}
function renderBrand(){const team=currentTeam();if(!team)return;const root=el('team-editor-brand-colors');root.innerHTML=BRAND_FIELDS.map(f=>control(f,team.colors[f.key],`brand`)).join('');wireControls(root);}
function valuesFromControls(){
 const brand=readFields(BRAND_FIELDS,'brand',el('team-editor-brand-colors'));const uniform=readFields(UNIFORM_FIELDS,`uniform.${activeVariant}`,el('team-editor-uniform-colors'));if(!brand||!uniform)return null;return {brand,uniform,preference:el('team-uniform-preference').value};
}
function updatePreview(){const team=currentTeam(),values=valuesFromControls();if(!team||!values)return;const preview=el('team-editor-preview');preview.style.setProperty('--p',values.brand.primary);preview.style.setProperty('--a',values.brand.accent);preview.style.setProperty('--jersey',values.uniform.jersey);preview.style.setProperty('--helmet',values.uniform.helmet);preview.style.setProperty('--stripe',values.uniform.stripe);el('team-editor-badge').textContent=team.abbr;el('team-editor-name').textContent=`${team.city} ${team.name} · ${activeVariant.toUpperCase()}`;}
function loadTeam(id){const team=drafts.get(id);if(!team)return;ensureUniformVariants(team);activeVariant='home';el('team-uniform-preference').value=team.uniformPreference||'auto';renderBrand();renderVariant();el('team-editor-status').textContent=team.uniforms?'Three uniform sets':'League uniforms';}
async function saveTeam(){
 const team=currentTeam(),values=valuesFromControls();if(!team||!values){el('team-editor-status').textContent='Use six-digit hex colors like #1A2B3C.';return;}
 ensureUniformVariants(team);team.colors={...team.colors,...values.brand};team.uniforms[activeVariant]={...team.uniforms[activeVariant],...values.uniform};team.uniformPreference=values.preference;
 const target=state.franchise.teams.find(t=>t.id===team.id);const previous={colors:target.colors,uniforms:target.uniforms,uniformPreference:target.uniformPreference};
 Object.assign(target,JSON.parse(JSON.stringify({colors:team.colors,uniforms:team.uniforms,uniformPreference:team.uniformPreference})));
 try{const ok=await state.persist?.(state.franchise,target);if(ok===false)throw new Error('Save failed');state.onApplied?.(target);el('team-editor-status').textContent='Team saved · all three sets';}catch{Object.assign(target,previous);el('team-editor-status').textContent='Could not save. Your edits are still here. Try again.';}
}
export function openTeamEditor(franchise,selectedTeamId,persist,onApplied){ensureUI();state={franchise,persist,onApplied};drafts=new Map((franchise?.teams||[]).map(t=>[t.id,JSON.parse(JSON.stringify(t))]));const select=el('team-editor-select');select.innerHTML='';for(const team of franchise?.teams||[]){ensureUniformVariants(team);const option=document.createElement('option');option.value=team.id;option.textContent=`${team.city} ${team.name}`;select.appendChild(option);}select.value=franchise?.teams?.some(t=>t.id===selectedTeamId)?selectedTeamId:(franchise?.teams?.[0]?.id||'');loadTeam(select.value);el('team-editor-dialog').showModal();}
export function initMainTeamEditor(getFranchise,getTeamId,persist,onApplied){ensureUI();if(el('btn-team-editor'))return;const button=document.createElement('button');button.id='btn-team-editor';button.className='sports-button blue';button.type='button';button.textContent='Team Editor';const anchor=el('btn-menu-settings');anchor?.parentElement?.insertBefore(button,anchor);button.onclick=()=>openTeamEditor(getFranchise(),getTeamId(),persist,onApplied);}
export function addCareerTeamEditorButton(getCareer,persist,onApplied){const heading=el('my-team-name');if(!heading||el('career-team-editor'))return;const button=document.createElement('button');button.id='career-team-editor';button.type='button';button.className='sports-button blue';button.textContent='Team Editor';button.style.marginLeft='10px';heading.insertAdjacentElement('afterend',button);button.onclick=()=>{const c=getCareer();if(c)openTeamEditor(c.league,c.teamId,()=>persist(),()=>onApplied?.());};}
