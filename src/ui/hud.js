import { game } from '../state/gameState.js';
import { clamp, fieldGoalChance } from '../state/constants.js';
import { momentumLabel } from '../state/difficulty.js';

// Holds the callback the "Continue" button should invoke (set by showResult,
// read/cleared by main.js's button wiring). A plain exported object rather
// than a rebindable `let`, since main.js reads it from this module.
export const resultFlow={continueAction:null};

export function hideAllOverlays(){
  ['callsheet-overlay','result-overlay','fourth-down-overlay','pause-overlay'].forEach(id=>document.getElementById(id).classList.remove('show'));
}
export function ordinalQuarter(q){return ['','1st','2nd','3rd','4th'][q]||'OT';}
export function formatClock(){
  if(game.overtime)return 'OT';
  const total=Math.max(0,Math.ceil(game.clock));
  const mins=Math.floor(total/60),secs=total%60;
  return mins+':'+String(secs).padStart(2,'0');
}
export function formatFieldPosition(los){
  const spot=Math.round(clamp(los,0,100));
  if(spot===50)return '50';
  return spot<50?'OWN '+spot:'OPP '+(100-spot);
}
export function updateHUD(){
  const dn=['','1st','2nd','3rd','4th'][game.down];
  const distanceLabel=game.firstDownYard>=100?'Goal':Math.max(1,Math.round(game.distance));
  document.getElementById('hud-down').innerHTML='<strong>'+(dn||'')+(dn?' &amp; ':'')+distanceLabel+'</strong>';
  document.getElementById('hud-ball').textContent=formatFieldPosition(game.los);
  document.getElementById('hud-user-score').textContent=game.playerScore;
  document.getElementById('hud-cpu-score').textContent=game.cpuScore;
  document.getElementById('hud-quarter').textContent=game.practice?'Practice':game.overtime?'Overtime':ordinalQuarter(game.quarter)+' Qtr';
  document.getElementById('hud-clock').textContent=game.practice?'FREE':game.overtime?'OT':formatClock();
  const playbookSituation=document.getElementById('playbook-situation');
  if(playbookSituation)playbookSituation.textContent=game.practice?'Practice rep':(dn||'')+' & '+distanceLabel+' at '+formatFieldPosition(game.los);
  const ml=document.getElementById('momentum-label');
  if(game.difficulty==='gridiron'){ml.style.display='block';ml.textContent=momentumLabel();}
  else{ml.style.display='none';}
}
export function showResult(message,nextAction,buttonLabel='Continue'){
  game.message=message;
  game.phase='result';
  resultFlow.continueAction=nextAction;
  document.getElementById('presnap-hint').style.display='none';
  document.getElementById('overlay-msg').textContent=game.message;
  document.getElementById('btn-continue').textContent=buttonLabel;
  const resultCard=document.getElementById('result-card');
  const kicker=document.getElementById('result-kicker');
  const upper=message.toUpperCase();
  resultCard.classList.remove('scoring','turnover');
  if(upper.includes('TOUCHDOWN')||upper.includes('FIELD GOAL')){kicker.textContent='Scoring Play';resultCard.classList.add('scoring');}
  else if(upper.includes('INTERCEPT')||upper.includes('TURNOVER')||upper.includes('SAFETY')){kicker.textContent='Change of Possession';resultCard.classList.add('turnover');}
  else if(upper.includes('FINAL')){kicker.textContent='Final Score';}
  else if(upper.includes('HALFTIME')){kicker.textContent='Halftime';}
  else if(upper.includes('QUARTER')){kicker.textContent='Quarter Break';}
  else if(upper.includes('OPPONENT DRIVE')){kicker.textContent='Drive Summary';}
  else if(upper.includes('KICKOFF')){kicker.textContent='Kickoff';}
  else{kicker.textContent='Play Result';}
  hideAllOverlays();
  document.getElementById('result-overlay').classList.add('show');
  updateHUD();
}
export function showFourthDown(){
  game.phase='decision';
  hideAllOverlays();
  const fgDistance=Math.round(117-game.los);
  const odds=Math.round(fieldGoalChance(fgDistance)*100);
  document.getElementById('fourth-down-detail').textContent=formatFieldPosition(game.los)+'  |  4th & '+Math.max(1,Math.round(game.distance));
  document.getElementById('go-detail').textContent='Gain '+Math.max(1,Math.round(game.distance))+' yards to keep the drive alive';
  document.getElementById('fg-detail').textContent=fgDistance+' yards  |  '+odds+'% estimated chance';
  document.getElementById('punt-detail').textContent='Expected net: 38 to 50 yards';
  document.getElementById('btn-field-goal').classList.toggle('recommended',odds>=65);
  document.getElementById('btn-punt').classList.toggle('recommended',odds<45);
  document.getElementById('btn-go-for-it').classList.toggle('recommended',game.distance<=2);
  document.getElementById('fourth-down-overlay').classList.add('show');
  updateHUD();
}
