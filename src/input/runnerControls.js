import {game,entities} from '../state/gameState.js';
import {simulationNow} from '../state/clock.js';
export const STICK_RADIUS=38,STICK_TRAVEL=29,STICK_INPUT=70;
export const JUKE_DURATION=180,JUKE_DISTANCE=36,JUKE_COOLDOWN=1000;
export function stickVector(anchor,current){
 if(!anchor||!current)return {x:0,y:0};
 const dx=current.x-anchor.x,dy=current.y-anchor.y;
 const scale=1/Math.max(STICK_INPUT,Math.hypot(dx,dy));
 return {x:dx*scale,y:dy*scale};
}
export function canJuke(){
 return game.phase==='live'&&!game.paused&&!entities.ball.inFlight&&entities.ballCarrier&&entities.ballCarrier!==entities.players.qb;
}
export function requestJuke(direction){
 if(!canJuke()||![-1,1].includes(direction))return false;
 const runner=entities.ballCarrier,now=simulationNow();
 if(now<(runner.jukeReadyAt||0))return false;
 runner.juke={direction,start:now,progress:0};runner.jukeReadyAt=now+JUKE_COOLDOWN;
 return true;
}
export function jukeStep(runner,now){
 if(!runner.juke)return null;
 const j=runner.juke,p=Math.max(0,Math.min(1,(now-j.start)/JUKE_DURATION));
 const eased=p*p*(3-2*p),old=j.progress*j.progress*(3-2*j.progress);
 j.progress=p;if(p>=1)runner.juke=null;
 return j.direction*JUKE_DISTANCE*(eased-old);
}
export function syncRunnerControls(){
 const panel=document.getElementById('runner-controls');if(!panel)return;
 panel.hidden=!canJuke();
 const ready=simulationNow()>=(entities.ballCarrier?.jukeReadyAt||0);
 for(const id of ['btn-juke-up','btn-juke-down'])document.getElementById(id).disabled=!ready;
}
export function initRunnerControls(){
 for(const [id,direction] of [['btn-juke-up',-1],['btn-juke-down',1]]){
  const button=document.getElementById(id);
  button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();requestJuke(direction);syncRunnerControls();});
  button.addEventListener('click',e=>{if(e.detail===0){requestJuke(direction);syncRunnerControls();}});
 }
}
