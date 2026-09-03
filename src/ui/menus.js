import * as League from '../state/league.js';
import { game, teamState } from '../state/gameState.js';
import { OFF, DEF } from '../state/constants.js';
import { applyUniform, rebuildSpriteSheets } from '../rendering/spriteSheets.js';
import { END_ZONE_STYLE } from '../rendering/field.js';
import { chooseOpponent, startNewGame, startPractice, ensureLoopStarted } from '../simulation/engine.js';
import { hideAllOverlays, updateHUD } from './hud.js';
import { editState } from '../input/editState.js';

export function updateTeamPreview(teamId){
  const team=League.findTeamState(teamState.franchise,teamId)||teamState.franchise.teams[0];
  const source=League.findTeam(team.id);
  const badge=document.getElementById('team-preview-badge');
  badge.textContent=team.abbr;
  badge.style.setProperty('--team-primary',team.colors.primary);
  badge.style.setProperty('--team-accent',team.colors.accent);
  document.getElementById('team-preview-name').textContent=League.fullName(team);
  document.getElementById('team-preview-meta').textContent=League.divisionName(team)+'  |  OC '+team.coaches.oc.rating+'  |  DC '+team.coaches.dc.rating;
  document.getElementById('team-off-rating').textContent=team.ratings.offense;
  document.getElementById('team-def-rating').textContent=team.ratings.defense;
  document.getElementById('team-ovr-rating').textContent=team.ratings.overall;
  document.getElementById('team-roster').innerHTML=team.roster.map(player=>'<div class="roster-player"><strong>#'+player.number+' '+player.firstName[0]+'. '+player.lastName+'</strong><span>'+player.slot+'  '+player.rating+' OVR  '+player.development+'</span></div>').join('');
  if(source)document.getElementById('team-select').value=source.id;
}
export function syncMatchupUI(){
  applyUniform(teamState.userTeam,OFF);
  applyUniform(teamState.cpuTeam,DEF);
  document.getElementById('hud-user-name').textContent=teamState.userTeam.name;
  document.getElementById('hud-user-name').title=League.fullName(teamState.userTeam);
  document.getElementById('hud-cpu-name').textContent=teamState.cpuTeam.name;
  document.getElementById('hud-cpu-name').title=League.fullName(teamState.cpuTeam);
  document.getElementById('hud-user-color').style.background=teamState.userTeam.colors.primary;
  document.getElementById('hud-cpu-color').style.background=teamState.cpuTeam.colors.primary;
  END_ZONE_STYLE.near.label=teamState.userTeam.abbr;
  END_ZONE_STYLE.near.base=teamState.userTeam.colors.primary;
  END_ZONE_STYLE.near.accent=teamState.userTeam.colors.accent;
  END_ZONE_STYLE.far.label=teamState.cpuTeam.abbr;
  END_ZONE_STYLE.far.base=teamState.cpuTeam.colors.primary;
  END_ZONE_STYLE.far.accent=teamState.cpuTeam.colors.accent;
  rebuildSpriteSheets();
}
export function populateTeamSelect(){
  const select=document.getElementById('team-select');
  select.innerHTML='';
  ['legacy','frontier'].forEach(conference=>{
    ['east','north','south','west'].forEach(division=>{
      const group=document.createElement('optgroup');
      group.label=League.CONFERENCES[conference].name+' '+division[0].toUpperCase()+division.slice(1);
      League.TEAMS.filter(team=>team.conference===conference&&team.division===division).forEach(team=>{
        const option=document.createElement('option');
        option.value=team.id;
        option.textContent=League.fullName(team);
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  });
  select.value=game.userTeamId;
  updateTeamPreview(game.userTeamId);
}
export function updateOpponentPreview(){
  const badge=document.getElementById('opponent-preview-badge');
  const name=document.getElementById('opponent-preview-name');
  const meta=document.getElementById('opponent-preview-meta');
  const selected=game.opponentChoice==='random'?null:League.findTeamState(teamState.franchise,game.opponentChoice);
  if(!selected||selected.id===game.userTeamId){
    badge.textContent='?';
    badge.style.setProperty('--team-primary','#293634');
    badge.style.setProperty('--team-accent','#f4c542');
    name.textContent='Random Opponent';
    meta.textContent='Opponent revealed at kickoff';
    document.getElementById('opponent-off-rating').textContent='?';
    document.getElementById('opponent-def-rating').textContent='?';
    document.getElementById('opponent-ovr-rating').textContent='?';
    return;
  }
  badge.textContent=selected.abbr;
  badge.style.setProperty('--team-primary',selected.colors.primary);
  badge.style.setProperty('--team-accent',selected.colors.accent);
  name.textContent=League.fullName(selected);
  meta.textContent=League.divisionName(selected)+'  |  OC '+selected.coaches.oc.rating+'  |  DC '+selected.coaches.dc.rating;
  document.getElementById('opponent-off-rating').textContent=selected.ratings.offense;
  document.getElementById('opponent-def-rating').textContent=selected.ratings.defense;
  document.getElementById('opponent-ovr-rating').textContent=selected.ratings.overall;
}
export function populateOpponentSelect(){
  const select=document.getElementById('opponent-select');
  if(game.opponentChoice===game.userTeamId||!League.findTeam(game.opponentChoice))game.opponentChoice='random';
  select.innerHTML='<option value="random">Random Opponent</option>';
  ['legacy','frontier'].forEach(conference=>{
    ['east','north','south','west'].forEach(division=>{
      const teams=League.TEAMS.filter(team=>team.conference===conference&&team.division===division&&team.id!==game.userTeamId);
      if(!teams.length)return;
      const group=document.createElement('optgroup');
      group.label=League.CONFERENCES[conference].name+' '+division[0].toUpperCase()+division.slice(1);
      teams.forEach(team=>{
        const option=document.createElement('option');
        option.value=team.id;
        option.textContent=League.fullName(team);
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  });
  select.value=game.opponentChoice;
  updateOpponentPreview();
}
export function returnToMainMenu(){
  game.paused=false;
  game.phase='menu';
  hideAllOverlays();
  document.getElementById('edit-panel').style.display='none';
  document.getElementById('game-view').style.display='none';
  document.getElementById('setup-screen').classList.remove('show');
  document.getElementById('start-screen').classList.add('show');
}

function syncActive(selector,dataKey,value){
  document.querySelectorAll(selector).forEach(x=>x.classList.toggle('active',String(x.dataset[dataKey])===String(value)));
}
const difficultyHelp={
  easy:'More broken tackles, slower pursuit, and forgiving catches.',
  medium:'Balanced defense, pursuit, and break-tackle chances.',
  hard:'Faster pursuit, tighter coverage, and fewer broken tackles.',
  gridiron:'Dynamic difficulty responds to momentum during the game.'
};
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  game.passMode=b.dataset.mode;syncActive('[data-mode]','mode',game.passMode);
}));
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{
  game.throwType=b.dataset.type;syncActive('[data-type]','type',game.throwType);
}));
document.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click',()=>{
  game.difficulty=b.dataset.diff;
  if(game.difficulty!=='gridiron')game.momentum=0;
  syncActive('[data-diff]','diff',game.difficulty);
  document.getElementById('difficulty-help').textContent=difficultyHelp[game.difficulty];
  updateHUD();
}));
document.querySelectorAll('[data-minutes]').forEach(b=>b.addEventListener('click',()=>{
  game.quarterMinutes=Number(b.dataset.minutes);syncActive('[data-minutes]','minutes',game.quarterMinutes);
}));
document.querySelectorAll('[data-routes]').forEach(b=>b.addEventListener('click',()=>{
  game.showRoutes=b.dataset.routes==='on';syncActive('[data-routes]','routes',game.showRoutes?'on':'off');
}));
document.getElementById('team-select').addEventListener('change',event=>{
  game.userTeamId=event.target.value;
  teamState.franchise.userTeamId=game.userTeamId;
  League.saveFranchise(teamState.franchise);
  teamState.userTeam=League.findTeamState(teamState.franchise,game.userTeamId)||teamState.franchise.teams[0];
  if(game.opponentChoice===game.userTeamId){
    game.opponentChoice='random';
    try{localStorage.setItem('gridironLegendsOpponentChoice','random');}catch(e){}
  }
  if(teamState.cpuTeam.id===teamState.userTeam.id)teamState.cpuTeam=chooseOpponent();
  updateTeamPreview(game.userTeamId);
  populateOpponentSelect();
  syncMatchupUI();
});
document.getElementById('opponent-select').addEventListener('change',event=>{
  game.opponentChoice=event.target.value;
  try{localStorage.setItem('gridironLegendsOpponentChoice',game.opponentChoice);}catch(e){}
  updateOpponentPreview();
});
function closeSettings(){
  game.paused=false;
  document.getElementById('pause-overlay').classList.remove('show');
}
document.getElementById('btn-pause').addEventListener('click',()=>{
  game.paused=true;
  document.getElementById('pause-overlay').classList.add('show');
});
document.getElementById('btn-resume').addEventListener('click',closeSettings);
document.getElementById('btn-close-settings').addEventListener('click',closeSettings);
document.getElementById('pause-overlay').addEventListener('click',ev=>{
  if(ev.target.id==='pause-overlay')closeSettings();
});
document.getElementById('btn-main-menu').addEventListener('click',()=>{
  closeSettings();
  editState.editMode=false;
  returnToMainMenu();
});

export function openSetup(settingsOnly=false){
  document.getElementById('start-screen').classList.remove('show');
  document.getElementById('setup-screen').classList.add('show');
  document.getElementById('setup-title').textContent=settingsOnly?'Settings':'New Game';
  document.getElementById('setup-subtitle').textContent=settingsOnly?'Customize how Gridiron Legends plays':'Set the rules before kickoff';
  document.getElementById('btn-start-play').style.display=settingsOnly?'none':'block';
  document.getElementById('quarter-setting').style.display=settingsOnly?'none':'block';
  document.getElementById('team-setting').style.display=settingsOnly?'none':'block';
  document.getElementById('opponent-setting').style.display=settingsOnly?'none':'block';
}
export function closeSetup(){
  document.getElementById('setup-screen').classList.remove('show');
  document.getElementById('start-screen').classList.add('show');
}
export function enterGame(practice){
  document.getElementById('start-screen').classList.remove('show');
  document.getElementById('setup-screen').classList.remove('show');
  document.getElementById('game-view').style.display='flex';
  editState.editMode=false;
  document.getElementById('edit-panel').style.display='none';
  if(practice)startPractice();else startNewGame();
  ensureLoopStarted();
}
document.getElementById('btn-menu-settings').addEventListener('click',()=>openSetup(true));
document.getElementById('btn-setup-back').addEventListener('click',closeSetup);
document.getElementById('btn-setup-close').addEventListener('click',closeSetup);
document.getElementById('btn-start-play').addEventListener('click',()=>enterGame(false));
document.getElementById('btn-practice').addEventListener('click',()=>enterGame(true));
document.getElementById('btn-new-game').addEventListener('click',()=>openSetup(false));
