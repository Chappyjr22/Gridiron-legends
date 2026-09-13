const FIELDS=[
  {key:'primary',group:'colors',label:'Team primary'},
  {key:'secondary',group:'colors',label:'Team secondary'},
  {key:'accent',group:'colors',label:'Team accent'},
  {key:'jersey',group:'uniform',label:'Jersey'},
  {key:'helmet',group:'uniform',label:'Helmet'},
  {key:'stripe',group:'uniform',label:'Uniform stripe'}
];
const HEX=/^#[0-9a-f]{6}$/i;
let state=null;
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
 .team-editor-head h2{margin:0;color:#f4c542;font:900 23px/1 Impact,"Arial Black",sans-serif;letter-spacing:.06em;text-transform:uppercase}
 .team-editor-head p{margin:4px 0 0;color:#9db0bc;font-size:9px;text-transform:uppercase}
 .team-editor-body{display:grid;grid-template-columns:minmax(230px,.72fr) minmax(360px,1.28fr);gap:12px;padding:12px;overflow:auto;min-height:0}
 .team-editor-panel{background:#091117;border:2px solid #29404e;padding:11px;min-width:0}
 .team-editor-select{width:100%;min-height:44px;background:#172d46;border:2px solid #567493;color:#f5edcf;padding:8px;font:800 11px "Courier New",monospace}
 .team-editor-preview{display:grid;place-items:center;gap:9px;min-height:210px;text-align:center;background:linear-gradient(#173451,#0a1824);border:2px solid #45657c;padding:12px}
 .team-editor-badge{width:72px;height:72px;display:grid;place-items:center;background:var(--p);border:5px solid var(--a);color:#fff;font:900 20px Impact,"Arial Black",sans-serif;box-shadow:4px 4px 0 #000}
 .team-editor-uniform{position:relative;width:94px;height:100px}
 .team-editor-helmet{position:absolute;left:29px;top:1px;width:38px;height:30px;border-radius:20px 20px 10px 10px;background:var(--helmet);border:3px solid #091117;box-shadow:inset 4px 0 rgba(255,255,255,.12)}
 .team-editor-helmet:after{content:"";position:absolute;left:15px;top:0;width:5px;height:28px;background:var(--stripe)}
 .team-editor-jersey{position:absolute;left:17px;top:33px;width:62px;height:54px;clip-path:polygon(13% 0,87% 0,100% 24%,84% 37%,78% 100%,22% 100%,16% 37%,0 24%);background:var(--jersey);border:0}
 .team-editor-jersey:after{content:"";position:absolute;left:28px;top:0;width:6px;height:54px;background:var(--stripe);opacity:.95}
 .team-editor-colors{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 .team-editor-color{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;background:#10202d;border:1px solid #385466;padding:8px}
 .team-editor-color input[type=color]{width:44px;height:44px;padding:2px;border:2px solid #708b9c;background:#071017}
 .team-editor-color input[type=text]{width:100%;min-height:40px;background:#071017;border:1px solid #4b687a;color:#f5edcf;padding:8px;font:800 11px "Courier New",monospace;text-transform:uppercase}
 .team-editor-color label{display:block;color:#f4c542;font-size:9px;font-weight:900;text-transform:uppercase;margin-bottom:4px}
 .team-editor-actions{display:flex;gap:8px;padding:10px 12px;border-top:2px solid #344b58;background:#0a141b}
 .team-editor-actions button{flex:1;min-height:46px}
 .team-editor-save{background:#f4c542!important;color:#151108!important;border-color:#fff1a4!important}
 @media (orientation:landscape) and (max-height:500px){.team-editor-body{grid-template-columns:230px 1fr;padding:8px;gap:8px}.team-editor-preview{min-height:145px}.team-editor-uniform{transform:scale(.78);margin:-9px 0}.team-editor-head{padding:7px 10px}.team-editor-head h2{font-size:18px}.team-editor-color{padding:5px}.team-editor-color input[type=color]{height:38px}.team-editor-color input[type=text]{min-height:36px}.team-editor-actions{padding:7px 9px}.team-editor-actions button{min-height:42px}}
 @media (orientation:portrait){.team-editor-body{grid-template-columns:1fr}.team-editor-colors{grid-template-columns:1fr 1fr}}
 `;
 document.head.appendChild(style);
 const dialog=document.createElement('dialog');
 dialog.id='team-editor-dialog';
 dialog.innerHTML=`<div class="team-editor-card">
  <header class="team-editor-head"><div><h2>Team Editor</h2><p>Brand and uniform colors</p></div><button type="button" id="team-editor-close" aria-label="Close team editor">✕</button></header>
  <div class="team-editor-body">
   <section class="team-editor-panel"><label class="label" for="team-editor-select">Team</label><select id="team-editor-select" class="team-editor-select"></select><div class="team-editor-preview" id="team-editor-preview"><div id="team-editor-badge" class="team-editor-badge"></div><div id="team-editor-uniform" class="team-editor-uniform"><div class="team-editor-helmet"></div><div class="team-editor-jersey"></div></div><strong id="team-editor-name"></strong><span id="team-editor-status" class="experience-note"></span></div></section>
   <section class="team-editor-panel"><div class="team-editor-colors" id="team-editor-colors"></div></section>
  </div>
  <footer class="team-editor-actions"><button type="button" id="team-editor-cancel">Cancel</button><button type="button" id="team-editor-save" class="team-editor-save">Save team</button></footer>
 </div>`;
 document.body.appendChild(dialog);
 el('team-editor-close').onclick=()=>dialog.close();
 el('team-editor-cancel').onclick=()=>dialog.close();
 el('team-editor-select').onchange=()=>loadTeam(el('team-editor-select').value);
 el('team-editor-save').onclick=saveTeam;
}
function teamUniform(team){return {jersey:team.uniform?.jersey||team.colors.primary,helmet:team.uniform?.helmet||team.colors.secondary,stripe:team.uniform?.stripe||team.colors.accent};}
function currentTeam(){return state?.franchise?.teams?.find(t=>t.id===el('team-editor-select')?.value)||null;}
function makeControls(team){
 const uniform=teamUniform(team);
 const values={...team.colors,...uniform};
 el('team-editor-colors').innerHTML=FIELDS.map(field=>`<div class="team-editor-color"><input type="color" data-color-picker="${field.group}.${field.key}" value="${escapeHtml(values[field.key])}"><div><label>${escapeHtml(field.label)}</label><input type="text" maxlength="7" spellcheck="false" data-color-text="${field.group}.${field.key}" value="${escapeHtml(values[field.key])}"></div></div>`).join('');
 for(const picker of document.querySelectorAll('#team-editor-colors [data-color-picker]'))picker.oninput=()=>{
  const text=document.querySelector(`[data-color-text="${picker.dataset.colorPicker}"]`);if(text)text.value=picker.value.toUpperCase();updatePreview();
 };
 for(const text of document.querySelectorAll('#team-editor-colors [data-color-text]'))text.oninput=()=>{
  if(HEX.test(text.value)){const picker=document.querySelector(`[data-color-picker="${text.dataset.colorText}"]`);if(picker)picker.value=text.value;updatePreview();}
 };
}
function valuesFromControls(){
 const out={colors:{},uniform:{}};
 for(const field of FIELDS){
  const input=document.querySelector(`[data-color-text="${field.group}.${field.key}"]`);
  const value=String(input?.value||'').trim();
  if(!HEX.test(value))return null;
  out[field.group][field.key]=value.toLowerCase();
 }
 return out;
}
function updatePreview(){
 const team=currentTeam(),values=valuesFromControls();if(!team||!values)return;
 const preview=el('team-editor-preview');
 preview.style.setProperty('--p',values.colors.primary);preview.style.setProperty('--a',values.colors.accent);preview.style.setProperty('--jersey',values.uniform.jersey);preview.style.setProperty('--helmet',values.uniform.helmet);preview.style.setProperty('--stripe',values.uniform.stripe);
 el('team-editor-badge').textContent=team.abbr;el('team-editor-name').textContent=`${team.city} ${team.name}`;
}
function loadTeam(id){
 const team=state?.franchise?.teams?.find(t=>t.id===id);if(!team)return;
 makeControls(team);el('team-editor-status').textContent=team.uniform?'Custom uniform':'League uniform';updatePreview();
}
async function saveTeam(){
 const team=currentTeam(),values=valuesFromControls();
 if(!team||!values){el('team-editor-status').textContent='Use six-digit hex colors like #1A2B3C.';return;}
 team.colors={...team.colors,...values.colors};team.uniform={...team.uniform,...values.uniform};
 const ok=await state.persist?.(state.franchise,team);
 if(ok===false){el('team-editor-status').textContent='Could not save team colors.';return;}
 state.onApplied?.(team);el('team-editor-status').textContent='Saved.';
}
export function openTeamEditor(franchise,selectedTeamId,persist,onApplied){
 ensureUI();state={franchise,persist,onApplied};
 const select=el('team-editor-select');select.innerHTML='';
 for(const team of franchise?.teams||[]){const option=document.createElement('option');option.value=team.id;option.textContent=`${team.city} ${team.name}`;select.appendChild(option);}
 select.value=franchise?.teams?.some(t=>t.id===selectedTeamId)?selectedTeamId:(franchise?.teams?.[0]?.id||'');
 loadTeam(select.value);el('team-editor-dialog').showModal();
}
export function initMainTeamEditor(getFranchise,getTeamId,persist,onApplied){
 ensureUI();
 if(el('btn-team-editor'))return;
 const button=document.createElement('button');button.id='btn-team-editor';button.type='button';button.textContent='Team Editor';
 const anchor=el('btn-menu-settings');anchor?.parentElement?.insertBefore(button,anchor);
 button.onclick=()=>openTeamEditor(getFranchise(),getTeamId(),persist,onApplied);
}
export function addCareerTeamEditorButton(getCareer,persist,onApplied){
 const heading=el('my-team-name');if(!heading||el('career-team-editor'))return;
 const button=document.createElement('button');button.id='career-team-editor';button.type='button';button.className='sports-button blue';button.textContent='Team Editor';button.style.marginLeft='10px';
 heading.insertAdjacentElement('afterend',button);
 button.onclick=()=>{const c=getCareer();if(c)openTeamEditor(c.league,c.teamId,()=>persist(),()=>onApplied?.());};
}
