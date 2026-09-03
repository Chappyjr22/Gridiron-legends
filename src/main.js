// Application entry point: wires the pieces that would otherwise need a
// circular import between modules, registers the handful of top-level
// "start screen" button routes, and kicks off the initial render.
import './state/league.js';
import { updateHUD, resultFlow } from './ui/hud.js';
import { uiHooks, initPlay, attemptFieldGoal, simulatePunt } from './simulation/engine.js';
import { renderFormationMenu } from './ui/playbook.js';
import { syncMatchupUI, returnToMainMenu, populateTeamSelect, populateOpponentSelect } from './ui/menus.js';
import { openLeagueHub } from './ui/leagueHub.js';
import { enterFormationLab } from './ui/formationLab.js';
import './input/pointer.js';

document.addEventListener('touchmove',function(e){
  if(e.target.closest('.card')||e.target.closest('#edit-panel'))return;
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

document.getElementById('btn-continue').addEventListener('click',()=>{
  const action=resultFlow.continueAction;
  resultFlow.continueAction=null;
  if(action)action();
});
document.getElementById('btn-go-for-it').addEventListener('click',initPlay);
document.getElementById('btn-field-goal').addEventListener('click',attemptFieldGoal);
document.getElementById('btn-punt').addEventListener('click',simulatePunt);

populateTeamSelect();
populateOpponentSelect();
syncMatchupUI();
updateHUD();
