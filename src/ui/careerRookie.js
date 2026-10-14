import {rookieProgress,rookieGoals} from '../career/rookie.js';
import {coachProgress} from '../career/coach.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=value=>value===null?'No attempts yet':`${(value*100).toFixed(1)}%`;
const signed=value=>`${value>0?'+':''}${value}`;
function goalMarkup(goal,stats){
 const title=goal.kind==='wins'?'Team wins':goal.kind==='completion'?'Accuracy':'Ball security';
 const target=goal.kind==='wins'?`${goal.target} wins`:goal.kind==='completion'?`${percent(goal.target)} or higher`:`${percent(goal.target)} or lower`;
 const value=goal.kind==='wins'?`${stats.wins} / ${goal.target} wins`:percent(goal.value);
 const sample=goal.kind==='wins'?'Regular season':`${goal.kind==='completion'?stats.completions:stats.interceptions} / ${stats.attempts} attempts`;
 return `<li aria-label="${escape(goal.label)}"><div class="rookie-goal-heading"><strong>${title}</strong><span class="rookie-status">${escape(goal.status)}</span></div><p class="journey-value">${escape(value)}</p><p class="experience-note">${escape(sample)}${goal.kind==='wins'?'':` · Target ${escape(target)}`}</p>${goal.kind!=='wins'&&!goal.eligible?`<p class="experience-note">${Math.max(0,(goal.minAttempts||100)-stats.attempts)} attempts to qualify</p>`:''}</li>`;
}
function reviewMarkup(review,open,archived){
 if(!review)return archived?'':'<p class="experience-note journey-review-note">Midseason review arrives after regular-season game nine.</p>';
 return `<details class="rookie-review" ${open?'open':''}><summary>${archived?'Rookie':'Midseason'} coach review · Game ${review.afterGames}</summary><h3>${escape(review.headline)}</h3><p>First ${review.afterGames} games: ${review.stats.wins}–${review.stats.games-review.stats.wins} · ${percent(review.stats.attempts?review.stats.completions/review.stats.attempts:null)} completions · ${percent(review.stats.attempts?review.stats.interceptions/review.stats.attempts:null)} interceptions · ${review.stats.attempts} attempts</p>${review.strengths.length?`<h4>What is working</h4><ul>${review.strengths.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>`:''}<h4>Focus for the second half</h4><ul>${review.focus.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p class="experience-note">Saved after rookie game nine. This review stays unchanged as your career continues.</p></details>`;
}
export function renderRookie(c){
 const host=document.getElementById('rookie-progress');
 host.hidden=c.stage!=='pro';if(host.hidden){host.replaceChildren();return;}
 const progress=rookieProgress(c),coach=coachProgress(c),archived=c.league.season!==1;
 if(host.dataset.career!==c.careerId){host.dataset.career=c.careerId;host.dataset.view=progress?'season':'coach';}
 const reviewOpen=host.querySelector('.rookie-review')?.open??false;
 const latest=coach.latest;
 const lastTitle=latest?`Last game · S${latest.season} W${latest.week}`:'Last game';
 const change=latest?latest.delta===null?'Change unavailable':`${signed(latest.delta)} confidence`:'No game this season';
 const reasons=latest?.reasons.length?latest.reasons.map(r=>`${escape(r.label)} ${signed(r.delta)}`).join(' · '):latest?'Earlier save has no change breakdown.':'Play a game this season to see what changed.';
 host.innerHTML=`<div class="journey-toolbar"><h3>${archived?'Pro journey':`Rookie season · ${progress.stats.games}/${progress.totalGames} games`}</h3><nav aria-label="Pro journey views"><button type="button" data-journey-view="season" aria-controls="journey-season">Season</button><button type="button" data-journey-view="coach" aria-controls="journey-coach">Coach</button></nav></div><section id="journey-season" aria-label="Season progress">${progress?`${archived?`<p class="experience-note">Archived rookie record · Season 1 · ${progress.stats.games}/${progress.totalGames} games. These are your rookie targets.</p>`:''}<ul class="rookie-goals">${rookieGoals(progress.stats,progress.targets,progress.totalGames).map(g=>goalMarkup(g,progress.stats)).join('')}</ul><p class="experience-note">Passing targets are judged at season end with 100+ attempts. Regular season only.</p>`:'<section class="story-card"><h3>No rookie record available</h3><p>This career has no saved rookie targets. See Coach for your current confidence and contract outlook.</p></section>'}</section><section id="journey-coach" aria-label="Coach outlook" hidden><div class="journey-coach-grid"><section class="story-card"><span class="board-kicker">Coach confidence</span><p class="journey-value">${coach.confidence}% <small>${escape(coach.confidenceLabel)}</small></p><p class="experience-note">${coach.contractYears===null?'Contract length unavailable':`${coach.contractYears} contract ${coach.contractYears===1?'year':'years'} left`} · Renewal outlook: ${coach.renewalYears} years</p></section><section class="story-card"><span class="board-kicker">${escape(lastTitle)}</span><p class="journey-value">${escape(change)}</p><p class="experience-note">${reasons}${latest?.capped?' · Limited by the 0–100 range.':''}</p></section><section class="story-card"><span class="board-kicker">Next focus</span><h3>${escape(coach.nextFocus.title)}</h3><p class="experience-note">${escape(coach.nextFocus.detail)}</p></section></div><p class="experience-note journey-renewal-note">${escape(coach.renewalDetail)}</p>${reviewMarkup(progress?.review,reviewOpen,archived)}</section>`;
 function show(view){
  host.dataset.view=view;
  for(const button of host.querySelectorAll('[data-journey-view]')){const selected=button.dataset.journeyView===view;button.setAttribute('aria-pressed',String(selected));host.querySelector(`#journey-${button.dataset.journeyView}`).hidden=!selected;}
  host.closest('.experience-body').scrollTop=0;
 }
 host.querySelectorAll('[data-journey-view]').forEach(button=>button.onclick=()=>show(button.dataset.journeyView));
 show(host.dataset.view||'season');
}
