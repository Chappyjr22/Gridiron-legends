import {weeklyGoal} from '../career/development.js';
import {seasonStakes} from '../career/weekly.js';
const el=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderStory(c){
 const dialog=el('career-progress-dialog'),goal=weeklyGoal(c),stakes=seasonStakes(c),college=c.stage==='college';
 if(dialog.dataset.career!==c.careerId){dialog.dataset.career=c.careerId;dialog.dataset.view='progress';}
 const label=college?'Draft':'Rookie';
 const buttons=[...dialog.querySelectorAll('[data-story-view]')];
 buttons.find(b=>b.dataset.storyView==='progress').textContent=label;
 function show(view){
  dialog.dataset.view=view;
  for(const b of buttons){const selected=b.dataset.storyView===view;b.setAttribute('aria-pressed',String(selected));el(`story-${b.dataset.storyView}`).hidden=!selected;}
  dialog.querySelector('.experience-body').scrollTop=0;
 }
 buttons.forEach(b=>b.onclick=()=>show(b.dataset.storyView));
 const reward=goal.kind==='teammate'?'+1 catching':`${goal.xp} XP${goal.kind==='challenge'?' + coach confidence':''}`;
 el('story-goals').innerHTML=`<div class="story-goal-grid"><section class="story-card"><span class="board-kicker">This week</span><h3>${esc(goal.label)}</h3><p class="story-reward">${esc(reward)}</p><p>${c.activeMatch?'Preparation is locked for this game.':'Choose your weekly preparation on Home before kickoff.'}</p></section><section class="story-card"><span class="board-kicker">Season stakes</span><h3>${esc(stakes.title)}</h3><p>${esc(stakes.detail)}</p>${stakes.contenders.length?`<p>Nearby: ${stakes.contenders.map(t=>`#${t.rank} ${esc(t.abbr)} (${esc(t.record)})`).join(' · ')}</p>`:''}</section></div>`;
 // The college renderer owns these nodes. Move them only after it refreshes their content.
 el(college?'story-progress':'story-honors').append(el('college-progress'));
 if(college){const cards=el('college-progress').querySelectorAll('.story-card');if(cards.length>1)cards[cards.length-1].remove();}
 el('story-progress-empty').hidden=!el('rookie-progress').hidden||college;
 const awards=[...(c.collegeArchive?.awards||[]).map(a=>({...a,era:'College'})),...(c.awards||[]).map(a=>({...a,era:college?'College':`Season ${a.season}`}))];
 el('career-awards').innerHTML=awards.length?`<ul class="story-award-list">${awards.slice().reverse().map(a=>`<li><b>${esc(a.title)}</b><span>${esc(a.era)}</span></li>`).join('')}</ul>`:'<p>Finish your first game to start your milestones.</p>';
 show(dialog.dataset.view||'progress');
}
