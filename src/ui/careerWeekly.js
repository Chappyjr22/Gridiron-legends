import {choosePreparation,preparationTargets,seasonStakes} from '../career/weekly.js';
import {preparationKey,weeklyGoal} from '../career/development.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderWeekly(c,match,persist,refresh){
 const area=document.getElementById('career-preparation');area.hidden=!match;
 if(match){
  const prep=c.weeklyPreparation?.key===preparationKey(c)?c.weeklyPreparation:null,kind=prep?.kind||'personal';
  const targets=preparationTargets(c),goal=weeklyGoal(c),locked=!!c.activeMatch;
  area.innerHTML=`<label for="career-preparation-kind">Weekly preparation</label><select id="career-preparation-kind" ${locked?'disabled':''}><option value="personal">Personal development</option><option value="teammate" ${targets.length?'':'disabled'}>Teammate work</option><option value="challenge">Coach challenge</option></select>${kind==='teammate'?`<label for="career-preparation-target">Work with</label><select id="career-preparation-target" ${locked?'disabled':''}>${targets.map(p=>`<option value="${esc(p.id)}">#${p.number} ${esc(p.firstName)} ${esc(p.lastName)} · ${p.slot}</option>`).join('')}</select>`:''}<p class="preparation-reward">${kind==='teammate'?'Reward: +1 catching for your teammate (cap 97), replacing objective XP.':kind==='challenge'?`Reward: ${goal.xp} XP and +2 extra coach confidence if completed.`:`Reward: ${goal.xp} objective XP. Focus on your own development.`}</p><p class="preparation-status">${locked?'Locked for this game.':'Choose before kickoff. Normal game XP applies to every choice.'}</p>`;
  const select=document.getElementById('career-preparation-kind');select.value=kind;
  select.onchange=()=>{if(choosePreparation(c,select.value,select.value==='teammate'?targets[0]?.id:null)){persist();refresh();}};
  const target=document.getElementById('career-preparation-target');if(target){target.value=prep?.playerId;target.onchange=()=>{if(choosePreparation(c,'teammate',target.value)){persist();refresh();}};}
 }
 const stakes=seasonStakes(c);
 document.getElementById('career-stakes').innerHTML=`<span class="board-kicker">What's at stake</span><h3>${esc(stakes.title)}</h3><p>${esc(stakes.detail)}</p>${stakes.contenders.length?`<p class="stakes-contenders">Nearby contenders: ${stakes.contenders.map(t=>`#${t.rank} ${esc(t.abbr)} (${esc(t.record)})`).join(' · ')}</p>`:''}`;
}
