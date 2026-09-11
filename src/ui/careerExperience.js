import * as League from '../state/league.js';
import {playerGameLog,playerSeasonStats} from '../career/recap.js';
import {paintMenuPlayer} from './menuArt.js';
const el=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=p=>[p.firstName,p.lastName].filter(Boolean).join(' ');
function line(s,position){
 if(!s)return 'Stats unavailable for this game';
 if(position==='QB')return `${s.completions}/${s.attempts} CMP · ${s.passingYards} YDS · ${s.passingTD} TD · ${s.interceptions} INT · ${s.sacks} SACKS`;
 if(position==='RB')return `${s.carries} CAR · ${s.rushingYards} RUSH YDS · ${s.rushingTD} RUSH TD · ${s.receptions} REC · ${s.receivingYards} REC YDS`;
 if(['WR','TE'].includes(position))return `${s.receptions}/${s.targets} REC/TGT · ${s.receivingYards} YDS · ${s.receivingTD} TD`;
 return 'Individual blocking and defensive stats are not tracked yet.';
}
function openPlayer(c,p){
 const team=League.findTeamState(c.league,c.teamId),season=playerSeasonStats(c,p.id),log=playerGameLog(c,p.id);
 el('team-player-heading').textContent=name(p);
 el('team-player-content').innerHTML=`<div class="player-passport"><canvas id="team-card-sprite" width="64" height="64" aria-hidden="true"></canvas><div><p class="sports-kicker">#${p.number} · ${esc(p.position)} · AGE ${p.age}</p><strong class="player-overall">${p.rating} OVR</strong><p>${esc(team.city)} ${esc(team.name)}</p><p>${esc(p.development)} development</p></div></div>
 ${p.attributes?'<h3>Player attributes</h3><p>'+Object.entries(p.attributes).map(([k,v])=>esc(k)+': '+v).join(' · ')+'</p>':''}
 <h3>Season production</h3><p>${esc(line(season.tracked?season.stats:null,p.position))}</p><p class="experience-note">${season.tracked} tracked games this season</p>
 <h3>Game log</h3><div class="player-game-log">${log.map(r=>`<article><b>S${r.season} · Week ${r.week} · ${r.userScore>r.cpuScore?'WIN':'LOSS'} ${r.userScore}–${r.cpuScore}</b><p>${esc(line(r.stats,p.position))}</p></article>`).join('')||'<p>Your first game is waiting.</p>'}</div>`;
 paintMenuPlayer(el('team-card-sprite'),team,p.skin??2);
 el('team-player-dialog').showModal();
}
export function renderMyTeam(c){
 const team=League.findTeamState(c.league,c.teamId);
 el('my-team-name').textContent=`${team.city} ${team.name}`;
 el('my-team-roster').innerHTML=team.roster.map(p=>`<button class="roster-card" data-player-id="${esc(p.id)}"><span>#${p.number} · ${esc(p.position)}${p.id===c.playerId?' · YOU':''}</span><strong>${esc(name(p))}</strong><span>${p.rating} OVR · AGE ${p.age}</span></button>`).join('');
 for(const b of el('my-team-roster').querySelectorAll('button'))b.onclick=()=>openPlayer(c,team.roster.find(p=>p.id===b.dataset.playerId));
}
export function showPostgame(c){
 const r=c.lastResult;if(!r)return;
 const team=League.findTeamState(c.league,c.teamId),opp=League.findTeamState(c.league,r.opponentId);
 const production=team.roster.filter(p=>['RB','WR','TE'].includes(p.position)).map(p=>({p,s:r.playerStats?.[p.id]})).filter(({s})=>s&&(s.targets||s.carries||s.receptions)).sort((a,b)=>(b.s.receivingYards+b.s.rushingYards)-(a.s.receivingYards+a.s.rushingYards)).slice(0,4);
 el('postgame-heading').textContent=r.userScore>r.cpuScore?'VICTORY':'FINAL WHISTLE';
 el('postgame-content').innerHTML=`<div class="recap-score"><span>${esc(team.abbr)} <b>${r.userScore}</b></span><span class="sports-kicker">FINAL<br>S${r.season} · WK ${r.week}</span><span>${esc(opp.abbr)} <b>${r.cpuScore}</b></span></div><div class="recap-columns"><section><h3>Your performance</h3><p class="recap-statline">${esc(line(r.stats,'QB'))}</p><h3>Teammate spotlight</h3>${production.map(({p,s})=>`<p><b>#${p.number} ${esc(name(p))}</b><br>${esc(line(s,p.position))}</p>`).join('')||'<p>No teammate production recorded.</p>'}<h3>Notable plays</h3>${r.keyMoments?.length?r.keyMoments.map(m=>`<p>Play ${m.play}: ${m.intercepted?'Interception':m.sacked?'Sack':m.touchdown?'Touchdown':'Big gain'} · ${m.yards} yards</p>`).join(''):'<p>No highlight plays recorded.</p>'}</section><section class="recap-rewards"><h3>XP earned</h3><strong class="player-overall">+${r.xp} XP</strong>${(r.xpBreakdown||[{label:'Game rewards',xp:r.xp}]).map(x=>`<div class="career-list-row"><span>${esc(x.label)}</span><b>+${x.xp}</b></div>`).join('')}<p>${r.levels?`LEVEL UP! ${r.levels} upgrade ${r.levels===1?'point':'points'} earned.`:'Keep building your career.'}</p><p class="experience-note">Result and rewards recorded. Reviewing this recap does not award them again.</p></section></div>`;
 const dialog=el('postgame-dialog');dialog.dataset.gameId=r.gameId;if(!dialog.open)dialog.showModal();
}
export function initCareerExperience(getCareer,persist){
 el('team-player-close').onclick=()=>el('team-player-dialog').close();
 el('career-review-game').onclick=()=>showPostgame(getCareer());
 el('postgame-continue').onclick=()=>el('postgame-dialog').close();
 el('postgame-dialog').addEventListener('close',()=>{
  const c=getCareer();if(c?.pendingRecapGameId===el('postgame-dialog').dataset.gameId){c.pendingRecapGameId=null;persist();}
 });
}
