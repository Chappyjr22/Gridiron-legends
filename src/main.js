import {initCloud} from './cloud/sync.js';
import {initAudio} from './audio/gameAudio.js';
import {initPracticeGuide} from './ui/practiceGuide.js';
import {initOverlayFocus} from './ui/focus.js';
import {initFieldViewport} from './rendering/viewport.js';
import {initRunnerControls} from './input/runnerControls.js';
import {initMenuArt} from './ui/menuArt.js';
import { game } from './state/gameState.js';
import { initCareer } from './ui/career.js';
// Application entry point: wires the pieces that would otherwise need a
// circular import between modules, registers the handful of top-level
// "start screen" button routes, and kicks off the initial render.
import './state/league.js';
import { updateHUD, continueResult } from './ui/hud.js';
import { uiHooks, initPlay, attemptFieldGoal, simulatePunt } from './simulation/engine.js';
import { renderFormationMenu } from './ui/playbook.js';
import { syncMatchupUI, returnToMainMenu, populateTeamSelect, populateOpponentSelect } from './ui/menus.js';
import { openLeagueHub } from './ui/leagueHub.js';
import { enterFormationLab } from './ui/formationLab.js';
import './input/pointer.js';

document.addEventListener('touchmove',function(e){
  if(e.target.closest('dialog')||e.target.closest('.stadium-home')||e.target.closest('.card')||e.target.closest('.setup-panel')||e.target.closest('#edit-panel'))return;
  e.preventDefault();
},{passive:false});
document.addEventListener('gesturestart',function(e){e.preventDefault();});

// Resolve the circular-import points identified during the module split:
// the simulation engine calls back into UI rendering at these three spots,
// but the UI modules that own them import the engine themselves, so the
// engine reaches them through this hook object instead of a direct import.
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
initCloud();
initAudio();
initPracticeGuide();
initOverlayFocus();

// An interrupted mobile session stays paused until the player resumes it.
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&['presnap','live','tackle'].includes(game.phase)){
    document.getElementById('btn-pause').click();
  }
});

initFieldViewport();
