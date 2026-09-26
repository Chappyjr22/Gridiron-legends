import {mentorTeammate} from '../career/career.js';
import {playingRoster} from '../career/roster.js';
import * as League from '../state/league.js';
import {playerGameLog,playerSeasonStats} from '../career/recap.js';
import {paintPlayerPortrait} from './playerPortrait.js';
import {openPortraitPicker} from './portraitPicker.js';
import {addCareerTeamEditorButton} from './teamEditor.js';
const el=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=p=>[p.firstName,p.lastName].filter(Boolean).join(' ');
let saveCareer=()=>false;
function attributeLabel(key){return String(key).replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());}
function line(s,position){
 if(!s)return 'Stats unavailable for this game';
 if(position==='QB')return `${s.completions}/${s.attempts} CMP · ${s.passingYards} YDS · ${s.passingTD} TD · ${s.interceptions} INT · ${s.sacks} SACKS · ${s.rushingYards} RUSH YDS · ${s.rushingTD} RUSH TD`;
 if(position==='RB')return `${s.carries} CAR · ${s.rushingYards} RUSH YDS · ${s.rushingTD} RUSH TD · ${s.receptions} REC · ${s.receivingYards} REC YDS`;
 if(['WR','TE'].includes(position))return `${s.receptions}/${s.targets} REC/TGT · ${s.receivingYards} YDS · ${s.receivingTD} TD`;
 return 'Individual blocking and defensive stats are not tracked yet.';
}
function renderNameEditor(c,p){
 const area=el('teammate-customize-body');
 if(!area)return;
 area.innerHTML=`<div class="teammate-name-editor"><label for="teammate-name-input">Player name</label><div class="teammate-name-row"><input id="teammate-name-input" maxlength="28" value="${esc(name(p))}" autocomplete="off"><button type="button" id="teammate-save-name" class="sports-button gold">Save</button><button type="button" id="teammate-cancel-name" class="sports-button blue">Cancel</button></div><p id="teammate-edit-status" class="experience-note"></p></div>`;
 const input=el('teammate-name-input');
 el('teammate-save-name').onclick=()=>{
  const clean=input.value.trim().replace(/\s+/g,' ').slice(0,28);
  if(!clean){el('teammate-edit-status').textContent='Enter a player name.';return;}
  const parts=clean.split(' ');p.firstName=parts.shift();p.lastName=parts.join(' ');
  saveCareer();renderMyTeam(c);openPlayer(c,p);
 };
 el('teammate-cancel-name').onclick=()=>openPlayer(c,p);
 input.focus();input.select();input.scrollIntoView({block:'center'});
}
function openPlayer(c,p){
 const team=League.findTeamState(c.league,c.teamId),season=playerSeasonStats(c,p.id),log=playerGameLog(c,p.id);
 const editable=!p.generic&&p.id!==c.playerId;
 el('team-player-heading').textContent=name(p);
 el('team-player-content').innerHTML=`<section class="team-detail-overview"><div class="team-detail-grid"><div class="player-passport"><canvas id="team-card-sprite" width="64" height="64" aria-hidden="true"></canvas><div><p class="sports-kicker">#${p.number} · ${esc(p.position)} · AGE ${p.age}</p><strong class="player-overall">${p.rating} OVR</strong><p>${esc(team.city)} ${esc(team.name)}</p><p>${esc(p.development)} development</p></div></div><div class="team-detail-ratings">
 ${editable?`<p>Contract: ${p.contractYears} seasons remaining</p><button id="mentor-teammate" class="sports-button blue" ${c.activeMatch||c.points<3||p.rating>=95||c.lastMentoring===`${c.stage}-${c.league.season}-${c.league.week}-${c.postseason?.round||0}`?'disabled':''}>Mentor · +1 OVR · 3 points</button><p class="experience-note">One teammate per week. Available between games.</p>`:''}<h3>Attributes</h3><div class="teammate-attributes">${Object.entries(p.attributes||{}).map(([k,v])=>`<div><span>${esc(attributeLabel(k))}</span><b>${v}</b><span class="teammate-meter"><i style="width:${Math.min(100,v)}%"></i></span></div>`).join('')}</div>
 </div></div></section><section class="team-detail-stats" hidden><h3>Season production</h3><p>${esc(line(season.tracked?season.stats:null,p.position))}</p><p class="experience-note">${season.tracked} tracked games this season</p>
 <h3>Game log</h3><div class="player-game-log">${log.map(r=>`<article><b>S${r.season} · Week ${r.week} · ${r.userScore>r.cpuScore?'WIN':'LOSS'} ${r.userScore}–${r.cpuScore}</b><p>${esc(line(r.stats,p.position))}</p></article>`).join('')||'<p>Your first game is waiting.</p>'}</div>
 </section>${editable?`<section class="teammate-customize"><h3>Customize teammate</h3><div class="teammate-profile-actions"><button type="button" id="teammate-edit-name" class="sports-button blue">Edit name</button><button type="button" id="teammate-edit-face" class="sports-button blue">Edit appearance</button></div><div id="teammate-customize-body"></div></section>`:''}`;
 const overview=el('team-player-content').querySelector('.team-detail-overview'),customize=el('team-player-content').querySelector('.teammate-customize');
 if(customize){
  overview.append(customize);
  const mentor=el('mentor-teammate'),note=mentor.nextElementSibling,contract=mentor.previousElementSibling;
  mentor.setAttribute('aria-description',note.textContent);mentor.title=note.textContent;note.remove();
  overview.querySelector('.player-passport>div').append(contract);
  customize.querySelector('.teammate-profile-actions').prepend(mentor);
 }
 let tabs=el('team-detail-tabs');
 if(!tabs){tabs=document.createElement('nav');tabs.id='team-detail-tabs';tabs.setAttribute('aria-label','Player details');el('team-player-heading').after(tabs);}
 tabs.innerHTML='<button type="button" data-team-detail="overview" aria-pressed="true">Overview</button><button type="button" data-team-detail="stats" aria-pressed="false">Stats</button>';
 for(const button of tabs.querySelectorAll('button'))button.onclick=()=>{
  const stats=button.dataset.teamDetail==='stats';overview.hidden=stats;el('team-player-content').querySelector('.team-detail-stats').hidden=!stats;
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));el('team-player-content').scrollTop=0;
 };
 paintPlayerPortrait(el('team-card-sprite'),team,p);
 if(editable){
  el('mentor-teammate').onclick=()=>{if(mentorTeammate(c,p.id)){saveCareer();renderMyTeam(c);openPlayer(c,p);}};
  el('teammate-edit-name').onclick=()=>renderNameEditor(c,p);
  el('teammate-edit-face').onclick=()=>{
   el('team-player-dialog').close();
   openPortraitPicker(p,team,choice=>{Object.assign(p,choice);saveCareer();renderMyTeam(c);openPlayer(c,p);},()=>openPlayer(c,p));
  };
 }
 const heading=el('team-player-heading');heading.tabIndex=-1;
 if(!el('team-player-dialog').open)el('team-player-dialog').showModal();
 heading.focus({preventScroll:true});el('team-player-content').scrollTop=0;
}
export function renderMyTeam(c){
 const team=League.findTeamState(c.league,c.teamId);
 const roster=playingRoster(team);
 el('my-team-name').textContent=`${team.city} ${team.name}`;
 el('my-team-roster').innerHTML=roster.map(p=>`<button class="roster-card ${p.id===c.playerId?'roster-you':''}" data-player-id="${esc(p.id)}"><canvas width="64" height="64" aria-hidden="true"></canvas><span class="roster-identity"><strong>${esc(name(p))}</strong><small>#${p.number} · ${esc(p.position)}${p.id===c.playerId?' · YOU':''}</small></span><span class="roster-numbers"><span><b>${p.rating}</b><small>OVR</small></span><span><b>${p.attributes.speed}</b><small>SPD</small></span><span><b>${p.age}</b><small>AGE</small></span></span></button>`).join('');
 for(const b of el('my-team-roster').querySelectorAll('button')){const p=roster.find(p=>p.id===b.dataset.playerId);paintPlayerPortrait(b.querySelector('canvas'),team,p);b.onclick=()=>openPlayer(c,p);}
}
export function showPostgame(c){
 const r=c.lastResult;if(!r)return;
 const team=League.findTeamState(c.league,c.teamId),opp=League.findTeamState(c.league,r.opponentId);
 const production=playingRoster(team).filter(p=>['RB','WR','TE'].includes(p.position)).map(p=>({p,s:r.playerStats?.[p.id]})).filter(({s})=>s&&(s.targets||s.carries||s.receptions)).sort((a,b)=>(b.s.receivingYards+b.s.rushingYards)-(a.s.receivingYards+a.s.rushingYards)).slice(0,4);
 el('postgame-heading').textContent=r.userScore>r.cpuScore?'VICTORY':'FINAL WHISTLE';
 el('postgame-content').innerHTML=`<div class="recap-score"><span>${esc(team.abbr)} <b>${r.userScore}</b></span><span class="sports-kicker">FINAL<br>S${r.season} · WK ${r.week}</span><span>${esc(opp.abbr)} <b>${r.cpuScore}</b></span></div><div class="recap-columns"><section><h3>Your performance</h3><p class="recap-statline">${esc(line(r.stats,'QB'))}</p><h3>Teammate spotlight</h3>${production.map(({p,s})=>`<p><b>#${p.number} ${esc(name(p))}</b><br>${esc(line(s,p.position))}</p>`).join('')||'<p>No teammate production recorded.</p>'}<h3>Notable plays</h3>${r.keyMoments?.length?r.keyMoments.map(m=>`<p>Play ${m.play}: ${m.intercepted?'Interception':m.sacked?'Sack':m.touchdown?'Touchdown':'Big gain'} · ${m.yards} yards</p>`).join(''):'<p>No highlight plays recorded.</p>'}</section><section class="recap-rewards">${r.collegeAssessment?`<h3>Draft stock</h3><p>${esc(r.draftProjection?.label||'Scouting in progress')}</p><h3>Weekly goal</h3><p>${esc(r.collegeAssessment.goal.label)}</p><p>${r.collegeAssessment.goal.met?'GOAL COMPLETE':'Keep working toward your next goal'}</p>`:''}${r.goal&&!r.collegeAssessment?`<h3>Weekly objective</h3><p>${esc(r.goal.label)} · ${r.goal.met?'Complete':'Not completed'}</p>`:''}${r.previousProjection&&r.draftProjection?`<p>Draft stock: ${r.previousProjection.pick-r.draftProjection.pick>=0?'+':''}${r.previousProjection.pick-r.draftProjection.pick} projected places. Scouts weigh efficiency, ball security, opponent strength and difficulty.</p>`:''}${r.coachConfidence!=null?`<p>Coach confidence: ${r.coachConfidence}%</p>`:''}${r.preparationResult?`<h3>Preparation result</h3><p>${esc(r.preparationResult.summary)}</p>`:''}${r.goal?.kind==='challenge'&&r.goal.met?'<p>Coach challenge complete: +2 extra confidence.</p>':''}${r.stakes?`<h3>Season stakes</h3><p>${esc(r.stakes.summary)}</p>`:''}<h3>XP earned</h3><strong class="player-overall">+${r.xp} XP</strong>${(r.xpBreakdown||[{label:'Game rewards',xp:r.xp}]).map(x=>`<div class="career-list-row"><span>${esc(x.label)}</span><b>+${x.xp}</b></div>`).join('')}<p>${r.levels?`LEVEL UP! ${r.pointsEarned??r.levels} upgrade ${(r.pointsEarned??r.levels)===1?'point':'points'} earned.`:'Keep building your career.'}</p><p class="experience-note">Result and rewards recorded. Reviewing this recap does not award them again.</p></section></div>`;
 const dialog=el('postgame-dialog');dialog.dataset.gameId=r.gameId;if(!dialog.open)dialog.showModal();
}
export function initCareerExperience(getCareer,persist,refresh=()=>{}){
 saveCareer=()=>{const ok=persist();refresh();return ok;};
 addCareerTeamEditorButton(getCareer,persist,()=>{
  const c=getCareer();if(!c)return;
  const team=League.findTeamState(c.league,c.teamId);
  refresh();renderMyTeam(c);
  el('career-screen')?.style.setProperty('--career-color',team.colors.primary);
 });
 el('team-player-close').onclick=()=>el('team-player-dialog').close();
 el('career-review-game').onclick=()=>showPostgame(getCareer());
 el('postgame-continue').onclick=()=>el('postgame-dialog').close();
 el('postgame-dialog').addEventListener('close',()=>{
  const c=getCareer();if(c?.pendingRecapGameId===el('postgame-dialog').dataset.gameId){c.pendingRecapGameId=null;persist();}
 });
}
