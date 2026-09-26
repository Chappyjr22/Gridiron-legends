import {choosePreparation,preparationTargets,seasonStakes} from '../career/weekly.js';
import {preparationKey,weeklyGoal} from '../career/development.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let closeMenu=null;
function dropdown(id,label,options,value,locked){
 const selected=options.find(o=>o.value===value);
 return `<div class="weekly-dropdown"><span id="${id}-label" class="weekly-field-label">${label}</span><button type="button" id="${id}" class="weekly-dropdown-trigger" aria-label="${label}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-options" ${locked?'disabled':''}><span>${esc(selected?.label||'Choose a teammate')}</span><span aria-hidden="true">▾</span></button><div id="${id}-options" class="weekly-dropdown-options" role="listbox" aria-labelledby="${id}-label" hidden>${options.map(o=>`<button type="button" role="option" tabindex="-1" data-value="${esc(o.value)}" aria-selected="${o.value===value}" ${o.disabled?'disabled':''}><span>${esc(o.label)}</span><span aria-hidden="true">${o.value===value?'✓':''}</span></button>`).join('')}</div></div>`;
}
function bindDropdown(id,onChoose){
 const trigger=document.getElementById(id),list=document.getElementById(`${id}-options`);
 if(!trigger)return;
 const options=[...list.querySelectorAll('button:not(:disabled)')];
 const close=(restore=false)=>{list.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore)trigger.focus({preventScroll:true});if(closeMenu===close)closeMenu=null;};
 const open=()=>{closeMenu?.();list.hidden=false;trigger.setAttribute('aria-expanded','true');closeMenu=close;(options.find(o=>o.getAttribute('aria-selected')==='true')||options[0])?.focus({preventScroll:true});list.scrollIntoView({block:'nearest'});};
 trigger.onclick=()=>list.hidden?open():close(true);
 trigger.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();open();}};
 list.onkeydown=e=>{
  const i=options.indexOf(document.activeElement);
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}
  else if(e.key==='Tab')close();
  else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[next]?.focus();}
 };
 for(const option of options)option.onclick=()=>{close();onChoose(option.dataset.value);document.getElementById(id)?.focus({preventScroll:true});};
}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.weekly-dropdown'))closeMenu?.();});
document.addEventListener('focusin',e=>{if(!e.target.closest('.weekly-dropdown'))closeMenu?.();});
export function renderWeekly(c,match,persist,refresh){
 closeMenu?.();
 const area=document.getElementById('career-preparation');area.hidden=!match;
 if(match){
  const prep=c.weeklyPreparation?.key===preparationKey(c)?c.weeklyPreparation:null,kind=prep?.kind||'personal';
  const targets=preparationTargets(c),goal=weeklyGoal(c),locked=!!c.activeMatch;
  const choices=[{value:'personal',label:'Personal development'},{value:'teammate',label:'Teammate work',disabled:!targets.length},{value:'challenge',label:'Coach challenge'}];
  area.innerHTML=dropdown('career-preparation-kind','Weekly preparation',choices,kind,locked)+(kind==='teammate'?dropdown('career-preparation-target','Work with',targets.map(p=>({value:p.id,label:`#${p.number} ${p.firstName} ${p.lastName} · ${p.slot}`})),prep?.playerId,locked):'')+`<p class="preparation-reward">${kind==='teammate'?'Reward: +1 catching for your teammate (cap 97), replacing objective XP.':kind==='challenge'?`Reward: ${goal.xp} XP and +2 extra coach confidence if completed.`:`Reward: ${goal.xp} objective XP. Focus on your own development.`}</p><p class="preparation-status">${locked?'Locked for this game.':'Choose before kickoff.'}</p>`;
  bindDropdown('career-preparation-kind',value=>{if(choosePreparation(c,value,value==='teammate'?targets[0]?.id:null)){persist();refresh();}});
  bindDropdown('career-preparation-target',value=>{if(choosePreparation(c,'teammate',value)){persist();refresh();}});
 }
 const stakes=seasonStakes(c);
 document.getElementById('career-stakes').innerHTML=`<span class="board-kicker">What's at stake</span><h3>${esc(stakes.title)}</h3><p>${esc(stakes.detail)}</p>${stakes.contenders.length?`<p class="stakes-contenders">Nearby contenders: ${stakes.contenders.map(t=>`#${t.rank} ${esc(t.abbr)} (${esc(t.record)})`).join(' · ')}</p>`:''}`;
}
