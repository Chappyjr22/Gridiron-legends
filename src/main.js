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
import { initMobileCareerApp } from './ui/mobileCareerApp.js';
import mobileCareerAppFit from './ui/mobileCareerAppFit.css?inline';
import mobileCareerAppPolish from './ui/mobileCareerAppPolish.css?inline';
import mobileCareerAppRefine from './ui/mobileCareerAppRefine.css?inline';
import mobileCareerHelmetArt from './ui/mobileCareerHelmetArt.css?inline';
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
  if(e.target.closest('dialog')||e.target.closest('.stadium-home')||e.target.closest('.card')||e.target.closest('.setup-panel')||e.target.closest('#edit-panel')||e.target.closest('#mobile-career-app'))return;
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

// The dedicated Career app may observe legacy data nodes, but it must never
// observe the Career screen class that it changes itself. Watching that class
// creates a self-refresh loop before the browser can finish its initial load.
const NativeMutationObserver=globalThis.MutationObserver;
if(NativeMutationObserver){
  globalThis.MutationObserver=class MobileCareerSafeObserver{
    constructor(callback){this.callback=callback;this.inner=null;}
    observe(target,options={}){
      if(target?.id==='career-screen'&&options.attributes&&options.attributeFilter?.includes('class'))return;
      this.inner=new NativeMutationObserver(this.callback);
      this.inner.observe(target,options);
    }
    disconnect(){this.inner?.disconnect();}
    takeRecords(){return this.inner?.takeRecords()||[];}
  };
}
try{initMobileCareerApp();}
finally{if(NativeMutationObserver)globalThis.MutationObserver=NativeMutationObserver;}

// MobileCareerApp injects its base style at runtime. Add the short-landscape
// fit rules after that base style so the real-device overrides win the cascade.
if(!document.getElementById('mobile-career-app-fit-style')){
  const fitStyle=document.createElement('style');
  fitStyle.id='mobile-career-app-fit-style';
  fitStyle.textContent=mobileCareerAppFit;
  document.head.appendChild(fitStyle);
}

// Apply visual identity polish after the base and fit layers.
if(!document.getElementById('mobile-career-app-polish-style')){
  const polishStyle=document.createElement('style');
  polishStyle.id='mobile-career-app-polish-style';
  polishStyle.textContent=mobileCareerAppPolish;
  document.head.appendChild(polishStyle);
}

// Final surgical refinements are kept separate while the branch is under visual QA.
// Consolidate fit/polish/refine before merging once the look is locked.
if(!document.getElementById('mobile-career-app-refine-style')){
  const refineStyle=document.createElement('style');
  refineStyle.id='mobile-career-app-refine-style';
  refineStyle.textContent=mobileCareerAppRefine;
  document.head.appendChild(refineStyle);
}

// Generated helmet reference is the locked art direction for matchup helmets.
// Inject it last so it replaces the older CSS placeholder geometry cleanly.
if(!document.getElementById('mobile-career-helmet-art-style')){
  const helmetStyle=document.createElement('style');
  helmetStyle.id='mobile-career-helmet-art-style';
  helmetStyle.textContent=mobileCareerHelmetArt;
  document.head.appendChild(helmetStyle);
}

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