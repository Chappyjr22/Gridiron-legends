import {rookieProgress,rookieGoals} from '../career/rookie.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=value=>value===null?'No attempts yet':`${(value*100).toFixed(1)}%`;
function goalMarkup(goal,stats){
 const value=goal.kind==='wins'?`${stats.wins} / ${goal.target} wins`:`${percent(goal.value)} · ${goal.kind==='completion'?stats.completions:stats.interceptions} / ${stats.attempts} attempts`;
 return `<li><div class="rookie-goal-heading"><strong>${escape(goal.label)}</strong><span class="rookie-status">${escape(goal.status)}</span></div><p>${escape(value)}</p>${goal.kind!=='wins'&&!goal.eligible?`<p class="experience-note">${Math.max(0,(goal.minAttempts||100)-stats.attempts)} more attempts to qualify.</p>`:''}</li>`;
}
export function renderRookie(c){
 const host=document.getElementById('rookie-progress'),progress=rookieProgress(c);
 host.hidden=!progress;if(!progress){host.replaceChildren();return;}
 const {stats,targets,totalGames,review}=progress,archived=c.league.season!==1;
 const reviewOpen=host.querySelector('.rookie-review')?.open??false;
 host.innerHTML=`<section class="story-card rookie-panel"><h3>Rookie season${archived?' record':''} · ${stats.games}/${totalGames} games</h3><p class="experience-note">Regular season only. Passing targets are judged at season end with at least 100 attempts.</p><ul class="rookie-goals">${rookieGoals(stats,targets,totalGames).map(g=>goalMarkup(g,stats)).join('')}</ul>${review?`<details class="rookie-review" ${reviewOpen?'open':''}><summary>Midseason coach review · Game ${review.afterGames}</summary><h3>${escape(review.headline)}</h3><p>First ${review.afterGames} games: ${review.stats.wins}–${review.stats.games-review.stats.wins} · ${percent(review.stats.attempts?review.stats.completions/review.stats.attempts:null)} completions · ${percent(review.stats.attempts?review.stats.interceptions/review.stats.attempts:null)} interceptions · ${review.stats.attempts} attempts</p>${review.strengths.length?`<h4>What is working</h4><ul>${review.strengths.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>`:''}<h4>Focus for the second half</h4><ul>${review.focus.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p class="experience-note">Saved after game nine. Your live targets above keep updating.</p></details>`:'<p class="experience-note">Your midseason coach review arrives after regular-season game nine.</p>'}</section>`;
}
