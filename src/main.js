import {initCloud} from './cloud/sync.js';
import {initAudio} from './audio/gameAudio.js';
import {initPracticeGuide} from './ui/practiceGuide.js';
import {initOverlayFocus} from './ui/focus.js';
import {initFieldViewport} from './rendering/viewport.js';
import {initRunnerControls} from './input/runnerControls.js';
import {initMenuArt} from './ui/menuArt.js';
import { game, teamState } from './state/gameState.js';
import { initCareer } from './ui/career.js';
import { initPWA } from './pwa.js';
import { initMobileSelects } from './ui/mobileSelects.js';
import { initMainTeamEditor } from './ui/teamEditor.js';
import { initMobileGameUI } from './ui/mobileGameUI.js';
import { initMobileGameUIPolish } from './ui/mobileGameUIPolish.js';
import { initMobileGameUIRenderSpec } from './ui/mobileGameUIRenderSpec.js';
import * as League from './state/league.js';
import { updateHUD, continueResult } from './ui/hud.js';
import { uiHooks, initPlay, attemptFieldGoal, simulatePunt } from './simulation/engine.js';
import { renderFormationMenu } from './ui/playbook.js';
import { syncMatchupUI, returnToMainMenu, populateTeamSelect, populateOpponentSelect, updateTeamPreview, updateOpponentPreview } from './ui/menus.js';
import { openLeagueHub } from './ui/leagueHub.js';
import { enterFormationLab } from './ui/formationLab.js';
import './input/pointer.js';

initPWA();

document.addEventListener('touchmove',function(e){
  if(e.target.closest('dialog')||e.target.closest('.stadium-home')||e.target.closest('.card')||e.target.closest('.setup-panel')||e.target.closest('#edit-panel'))return;
  e.preventDefault();
},{passive:false});
document.addEventListener('gesturestart',function(e){e.preventDefault();});

uiHooks.renderCallsheet=renderFormationMenu;
uiHooks.syncMatchup=syncMatchupUI;
uiHooks.returnToMainMenu=returnToMainMenu;

document.getElementById('btn-league-hub').addEventListener('click',openLeagueHub);
document.getElementById('btn-start-editor').addEventListener('click',enterFormationLab);

document.getElementById('btn-continue').addEventListener('click',continueResult);
document.getElementById('btn-go-for-it').addEventListener('click',initPlay);
document.getElementById('btn-field-goal').addEventListener('click',attemptFieldGoal);
document.getElementById('btn-punt').addEventListener('click',simulatePunt);

populateTeamSelect();
populateOpponentSelect();
syncMatchupUI();
updateHUD();

initRunnerControls();
initMenuArt();
initCareer();
initMobileGameUI();
initMobileGameUIPolish();
initMobileGameUIRenderSpec();
initMainTeamEditor(
  ()=>teamState.franchise,
  ()=>game.userTeamId,
  franchise=>League.saveFranchise(franchise),
  team=>{
    if(team.id===game.userTeamId)teamState.userTeam=team;
    if(teamState.cpuTeam?.id===team.id)teamState.cpuTeam=team;
    updateTeamPreview(game.userTeamId);
    updateOpponentPreview();
    syncMatchupUI();
  }
);
initMobileSelects();
initCloud();
initAudio();
initPracticeGuide();
initOverlayFocus();

document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&['presnap','live','tackle'].includes(game.phase)){
    document.getElementById('btn-pause').click();
  }
});

initFieldViewport();
