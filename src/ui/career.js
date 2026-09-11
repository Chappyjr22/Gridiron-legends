import {paintMenuPlayer} from './menuArt.js';
import * as Career from '../career/career.js';
import * as League from '../state/league.js';
import {game,teamState} from '../state/gameState.js';
import {uiHooks,startNewGame,restoreCheckpoint,ensureLoopStarted} from '../simulation/engine.js';
import {syncMatchupUI,syncSettingsUI} from './menus.js';
import {hideAllOverlays} from './hud.js';
let career=Career.loadCareer(),exhibition=null;
const el=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){
 const ok=Career.saveCareer(career);
 el('career-save-status').textContent=ok?'Saved on this device.':'Could not save. Keep this tab open and export a backup before leaving.';
 el('career-quiet-save').textContent=ok?'Saved on this device':'Save failed. Open Save & backup.';
 el('career-save-status').classList.toggle('save-error',!ok);
 el('game-save-status').textContent=ok?'':'Career could not save. Return to Career and export a backup.';
 return ok;
}
function restoreExhibition(){
 if(exhibition){Object.assign(teamState,exhibition.teams);Object.assign(game,exhibition.game);exhibition=null;syncMatchupUI();}
 game.career=false;
}
function showCareer(){
 setCareerTab('home');
 game.paused=false;game.phase='menu';hideAllOverlays();
 el('game-view').style.display='none';el('start-screen').classList.remove('show');el('career-screen').classList.add('show');render();
}
function recordLabel(t){return `${t.record.wins}–${t.record.losses}${t.record.ties?'–'+t.record.ties:''}`;}
function rosterName(p){return [p.firstName,p.lastName].filter(Boolean).join(' ');}
function updateTitle(){
 const player=career?Career.careerPlayer(career):null;
 const team=career?League.findTeamState(career.league,career.teamId):teamState.userTeam;
 el('career-menu-label').textContent=career?'Continue Career':'Start Career';
 el('career-menu-detail').textContent=career?`QB #${player.number} · ${career.postseason?'Playoffs':`Week ${career.league.week}`}`:'Your player. Your season.';
 paintMenuPlayer(el('title-player'),team,player?.skin??2);
}
function setCareerTab(tab){
 for(const button of document.querySelectorAll('[data-career-tab]')){
  const active=button.dataset.careerTab===tab;
  button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  button.classList.toggle('gold',active);button.classList.toggle('blue',!active);
  el(`career-${button.dataset.careerTab}-panel`).hidden=!active;
 }
}
function render(){
 updateTitle();
 el('career-create').hidden=!!career;el('career-hub').hidden=!career;
 if(!career)return;
 const player=Career.careerPlayer(career),team=League.findTeamState(career.league,career.teamId),match=Career.nextMatch(career);
 el('career-player-name').textContent=rosterName(player);el('career-player-detail').textContent=`#${player.number} QB · ${Career.ARCHETYPES[player.archetype].name} · ${team.city} ${team.name}`;
 el('career-screen').style.setProperty('--career-color',team.colors.primary);
 el('career-jersey-number').textContent=player.number;
 paintMenuPlayer(el('career-player-sprite'),team,player.skin);
 el('career-user-abbr').textContent=team.abbr;el('career-user-record').textContent=recordLabel(team);
 el('career-open-player').textContent=career.points?`${career.points} upgrade ${career.points===1?'point':'points'}`:'View your player';
 el('career-season').textContent=`Season ${career.league.season} · ${career.postseason?'Playoffs':`Week ${career.league.week}`} · ${recordLabel(team)}`;
 el('career-level').textContent=`Level ${career.level} · ${career.xp}/100 XP · ${career.points} upgrade ${career.points===1?'point':'points'}`;
 el('career-xp').value=career.xp;
 const s=career.seasonStats;el('career-yards').textContent=s.passingYards;el('career-td').textContent=s.passingTD;el('career-int').textContent=s.interceptions;el('career-stat-line').textContent=`${s.passingYards} YDS · ${s.passingTD} TD · ${s.interceptions} INT`;
 el('career-completions').textContent=`${s.completions}/${s.attempts} completed · ${s.sacks} sacks · ${s.games} games`;
 const t=career.totals;el('career-lifetime').textContent=`Career: ${t.passingYards} passing yards · ${t.passingTD} TD · ${t.games} games`;
 const descriptions={accuracy:'Tighter placement',arm:'Faster throws',release:'Less windup time'};
 el('career-upgrades').innerHTML=Object.entries(player.attributes).map(([key,value])=>`<button data-upgrade="${key}" ${career.points<1||career.activeMatch||value>=95?'disabled':''}><span>${key==='arm'?'Arm strength':key}</span><strong>${value}</strong><small>${descriptions[key]} · +2</small></button>`).join('');
 for(const button of el('career-upgrades').querySelectorAll('button'))button.addEventListener('click',()=>{if(Career.upgrade(career,button.dataset.upgrade)){persist();render();}});
 el('career-play').hidden=!match;el('career-next-season').hidden=!career.postseason?.champion;
 if(match){
  const opponent=League.findTeamState(career.league,match.homeTeamId===career.teamId?match.awayTeamId:match.homeTeamId);
  el('career-opponent-abbr').textContent=opponent.abbr;el('career-opponent-record').textContent=recordLabel(opponent);el('career-screen').style.setProperty('--opponent-color',opponent.colors.primary);
  el('career-next-opponent').textContent=`${match.homeTeamId===career.teamId?'vs':'at'} ${opponent.city} ${opponent.name}`;
  el('career-matchup').textContent=`${recordLabel(opponent)} · Defense ${opponent.ratings.defense} · ${match.round===3?'Championship':match.round===2?'Conference final':match.round===1?'Conference semifinal':`Week ${match.week}`}`;
  el('career-play').textContent=career.checkpoint?'Resume game':'Play next game';
 }else if(career.postseason?.champion){
  const champion=League.findTeamState(career.league,career.postseason.champion);el('career-opponent-abbr').textContent=champion.abbr;el('career-opponent-record').textContent='CHAMPION';el('career-screen').style.setProperty('--opponent-color',champion.colors.primary);el('career-next-opponent').textContent=career.postseason.champion===career.teamId?'You are league champions!':`${champion.city} ${champion.name} win the title`;
  el('career-matchup').textContent='Season complete. Your player and upgrades carry into next season.';
 }
 const last=career.lastResult;el('career-home-motto').hidden=!!last;el('career-last-result').hidden=!last;
 if(last){
  const opp=League.findTeamState(career.league,last.opponentId);
  el('career-result-title').textContent=`${last.userScore>last.cpuScore?'WIN':'LOSS'} · ${team.abbr} ${last.userScore} – ${opp.abbr} ${last.cpuScore}`;
  el('career-result-stats').textContent=`${last.stats.completions}/${last.stats.attempts} · ${last.stats.passingYards} YDS · ${last.stats.passingTD} TD · ${last.stats.interceptions} INT`;
  el('career-result-xp').textContent=`+${last.xp} XP${last.levels?` · ${last.levels} upgrade point earned`:''}`;
 }
 const teammates=team.roster.filter(p=>['RB','WR1','WR2','TE'].includes(p.slot));
 el('career-teammates').innerHTML=teammates.map(p=>`<div class="career-list-row"><span>${escape(p.slot)} · #${p.number} ${escape(rosterName(p))}</span><b>${p.rating}</b></div>`).join('');
 el('career-standings').innerHTML=League.standings(career.league,team.conference).map((t,i)=>`<div class="career-list-row ${t.id===team.id?'career-selected':''}"><span>${i+1}. ${escape(t.abbr)} ${escape(t.name)}</span><b>${recordLabel(t)}</b></div>`).join('');
 el('career-history').innerHTML=career.history.slice(-8).reverse().map(r=>`<div class="career-list-row"><span>S${r.season} · ${r.week>17?'Playoffs':`Week ${r.week}`}</span><b>${r.userScore}–${r.cpuScore}</b></div>`).join('')||'<p>Your first game is waiting.</p>';
 el('career-awards').textContent=career.awards.map(a=>`Season ${a.season}: ${a.title}`).join(' · ')||'First milestone: finish your rookie game.';
}
function launch(){
 const match=Career.nextMatch(career);if(!match)return;
 if(!exhibition)exhibition={teams:{...teamState},game:{userTeamId:game.userTeamId,cpuTeamId:game.cpuTeamId,difficulty:game.difficulty,quarterMinutes:game.quarterMinutes}};
 career.activeMatch=match.id;
 teamState.franchise=career.league;game.userTeamId=career.teamId;game.cpuTeamId=match.homeTeamId===career.teamId?match.awayTeamId:match.homeTeamId;
 teamState.userTeam=League.findTeamState(career.league,career.teamId);teamState.cpuTeam=League.findTeamState(career.league,game.cpuTeamId);
 Object.assign(game,career.settings);game.career=true;
 el('career-screen').classList.remove('show');el('game-view').style.display='flex';
 syncMatchupUI();
 if(career.checkpoint)restoreCheckpoint(career.checkpoint);else startNewGame({career:true});
 syncSettingsUI();
 persist();ensureLoopStarted();
}
export function initCareer(){
 for(const button of document.querySelectorAll('[data-career-tab]')){
  button.addEventListener('click',()=>setCareerTab(button.dataset.careerTab));
  button.addEventListener('keydown',event=>{
   const tabs=[...document.querySelectorAll('[data-career-tab]')];let next;
   if(event.key==='ArrowRight')next=(tabs.indexOf(button)+1)%tabs.length;
   else if(event.key==='ArrowLeft')next=(tabs.indexOf(button)+tabs.length-1)%tabs.length;
   else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
   event.preventDefault();setCareerTab(tabs[next].dataset.careerTab);tabs[next].focus();
  });
 }
 el('career-open-player').addEventListener('click',()=>{setCareerTab('player');el('career-player-tab').focus();});
 el('career-open-backups').addEventListener('click',()=>el('career-backups').showModal());
 el('career-close-backups').addEventListener('click',()=>el('career-backups').close());
 updateTitle();
 el('career-team').innerHTML=League.TEAMS.map(t=>`<option value="${t.id}">${escape(League.fullName(t))}</option>`).join('');
 el('btn-career').addEventListener('click',showCareer);
 el('career-back').addEventListener('click',()=>{restoreExhibition();el('career-screen').classList.remove('show');el('start-screen').classList.add('show');});
 el('career-create').addEventListener('submit',event=>{
  event.preventDefault();if(career)return;
  try{
   if(localStorage.getItem(Career.CAREER_KEY))throw Error('An unreadable career save exists. Export a backup before replacing it.');
   career=Career.createCareer({name:el('career-name').value,number:el('career-number').value,teamId:el('career-team').value,archetype:el('career-archetype').value,skin:el('career-skin').value,difficulty:el('career-difficulty').value,quarterMinutes:el('career-minutes').value});
   persist();render();
  }catch(error){el('career-create-error').textContent=error.message;}
 });
 el('career-play').addEventListener('click',launch);
 el('career-import').addEventListener('click',()=>el('career-backup-file').click());
 el('career-backup-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(file.size>5000000)throw Error('That backup is too large.');
   const restored=Career.parseCareer(await file.text());if(!restored)throw Error('This file is not a supported career backup.');
   if(career&&!window.confirm('Restore this backup in place of your current career? A copy of the current save will be kept on this device.'))return;
   const previous=localStorage.getItem(Career.CAREER_KEY);if(previous)localStorage.setItem(Career.CAREER_KEY+'.previous',previous);
   career=restored;persist();render();
  }catch(error){el('career-save-status').textContent=error.message;}finally{event.target.value='';}
 });
 el('career-next-season').addEventListener('click',()=>{if(Career.startNextSeason(career)){persist();render();}});
 el('career-export').addEventListener('click',()=>{
  const raw=career?JSON.stringify(career,null,2):localStorage.getItem(Career.CAREER_KEY);if(!raw)return;
  const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='gridiron-career-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 uiHooks.checkpoint=saved=>{if(career?.activeMatch){career.checkpoint=saved;persist();}};
 uiHooks.careerSettingsChanged=()=>{
  if(!career?.activeMatch||!game.career)return;
  career.settings.difficulty=game.difficulty;
  if(career.checkpoint){
   career.checkpoint.game.difficulty=game.difficulty;
   career.checkpoint.game.momentum=game.momentum;
  }
  persist();
 };
 uiHooks.finishCareer=stats=>{
  if(!career?.activeMatch)return;
  Career.completeCareerGame(career,career.activeMatch,game.playerScore,game.cpuScore,stats);
  persist();restoreExhibition();showCareer();
 };
 uiHooks.leaveCareer=restoreExhibition;
}
