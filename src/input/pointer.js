import {slingshotTarget} from './aim.js';
import {requestDive,requestJuke,canJuke,runnerGesture} from './runnerControls.js';
import { simulationNow } from '../state/clock.js';
import { canvas } from '../rendering/canvas.js';
import { SCENE_TOP } from '../rendering/sceneLayout.js';
import { toCanvas } from '../rendering/players.js';
import { game, entities } from '../state/gameState.js';
import { XPX, BASE_X, MIN_PULL, clamp } from '../state/constants.js';
import { OFFENSE_SKILL_KEYS } from '../data/formations.js';
import { PLAYS } from '../data/plays.js';
import { kickInput, onSnap, startRunOption, releaseThrow } from '../simulation/engine.js';
import { interaction } from './interactionState.js';
import { editState } from './editState.js';
import { findNearEntity, updateEditJSON } from './editControls.js';

function pointerPos(ev){
  const r=canvas.getBoundingClientRect();
  return {x:(ev.clientX-r.left)*(canvas.width/r.width), y:(ev.clientY-r.top)*(canvas.height/r.height)-SCENE_TOP};
}
function pointNearPlayer(point,player,radius=32){
  const pos=toCanvas(player);
  return Math.hypot(point.x-pos.cx,point.y-pos.cy)<=radius;
}
function beginTapPass(point){
  const routes=Object.keys(PLAYS[game.playCall]?.routes||{});
  let playerKey=null,best=Infinity;
  routes.forEach(key=>{
    const pos=toCanvas(entities.players[key]);
    const distance=Math.hypot(point.x-pos.cx,point.y-pos.cy);
    if(distance<best){best=distance;playerKey=key;}
  });
  entities.pendingTapThrow={pointerId:activePointer,playerKey:best<=36?playerKey:null,target:{x:point.x,y:point.y},releaseAt:simulationNow()+240};
}
let activePointer=null,pendingRunTap=null,gestureStart=null,secondaryGesture=null;
function startGesture(ev){return {pointerId:ev.pointerId,x:ev.clientX,y:ev.clientY,time:simulationNow(),runner:canJuke()?entities.ballCarrier:null};}
function finishGesture(start,ev){
 if(!start?.runner||start.runner!==entities.ballCarrier||!canJuke())return;
 const move=runnerGesture(ev.clientX-start.x,ev.clientY-start.y,simulationNow()-start.time);
 if(move==='dive')requestDive();
 else if(move)requestJuke(move==='up'?-1:1);
}
canvas.addEventListener('pointerdown',ev=>{
  if(activePointer!==null){
    if(!secondaryGesture&&interaction.steering&&canJuke()){
      secondaryGesture=startGesture(ev);canvas.setPointerCapture(ev.pointerId);
    }
    return;
  }
  if(game.phase==='kicking'){activePointer=ev.pointerId;canvas.setPointerCapture(ev.pointerId);kickInput();return;}
  if(editState.editMode){
    activePointer=ev.pointerId;
    canvas.setPointerCapture(ev.pointerId);
    editState.dragEntity=findNearEntity(pointerPos(ev));
    return;
  }
  if((game.phase!=='live'&&game.phase!=='presnap')||game.paused)return;
  activePointer=ev.pointerId;
  canvas.setPointerCapture(ev.pointerId);
  const p=pointerPos(ev);
  gestureStart=startGesture(ev);
  interaction.aimAnchor={...p};
  if(game.phase==='presnap'){
    if(PLAYS[game.playCall]?.type==='run'){
      startRunOption();gestureStart=startGesture(ev);
      interaction.steering=true;interaction.steerAnchor={x:p.x,y:p.y};interaction.steerCurrent={x:p.x,y:p.y};
      return;
    }
    const rb=toCanvas(entities.players.rb),qb=toCanvas(entities.players.qb);
    if(!PLAYS[game.playCall]?.routes?.rb&&pointNearPlayer(p,entities.players.rb)&&Math.hypot(p.x-rb.cx,p.y-rb.cy)<Math.hypot(p.x-qb.cx,p.y-qb.cy)){
      pendingRunTap={point:p,screen:{x:ev.clientX,y:ev.clientY}};return;
    }
    onSnap();
    if(game.passMode==='tap')beginTapPass(p);
    else {interaction.aiming=true;interaction.aimStartedAt=simulationNow();interaction.aimTarget=p;}
    return;
  }
  if(!game.thrown){
    if(game.passMode==='tap'){
      releaseThrow(p);
    } else {
      interaction.aiming=true;interaction.aimStartedAt=simulationNow();interaction.aimTarget=p;
    }
  } else if(entities.ball.inFlight){
    interaction.steering=true;interaction.steerAnchor={...p};interaction.steerCurrent={...p};
  } else if(entities.ballCarrier&&(entities.ballCarrier!==entities.players.qb||game.scrambling)){
    interaction.steering=true;interaction.steerAnchor={x:p.x,y:p.y};interaction.steerCurrent={x:p.x,y:p.y};
  }
});
canvas.addEventListener('pointermove',ev=>{
  if(ev.pointerId!==activePointer)return;
  const p=pointerPos(ev);
  if(editState.editMode){
    if(editState.dragEntity){
      const camPx=game.cameraYard*XPX;
      editState.dragEntity.x=clamp(p.y,10,370);
      editState.dragEntity.yfield=camPx+(BASE_X-p.x);
      const isOffense=OFFENSE_SKILL_KEYS.some(key=>entities.players[key]===editState.dragEntity)||entities.decor.slice(0,5).includes(editState.dragEntity);
      const relativeY=editState.dragEntity.yfield/XPX-game.los;
      if(isOffense){
        const legalY=editState.dragEntity.onLine?clamp(relativeY,-1.4,-0.45):Math.min(relativeY,-1.45);
        editState.dragEntity.yfield=(game.los+legalY)*XPX;
      } else {
        editState.dragEntity.yfield=(game.los+Math.max(relativeY,0.45))*XPX;
      }
      updateEditJSON();
    }
    return;
  }
  if(pendingRunTap){
    if(game.paused||game.phase!=='presnap'){pendingRunTap=null;return;}
    if(Math.hypot(ev.clientX-pendingRunTap.screen.x,ev.clientY-pendingRunTap.screen.y)<8)return;
    pendingRunTap=null;onSnap();interaction.aiming=true;interaction.aimStartedAt=simulationNow();interaction.aimTarget=p;
  }
  if(interaction.aiming){interaction.aimTarget=p;}
  else if(interaction.steering){interaction.steerCurrent=p;}
});
canvas.addEventListener('pointerup',ev=>{
  if(ev.pointerId===secondaryGesture?.pointerId){finishGesture(secondaryGesture,ev);secondaryGesture=null;return;}
  if(ev.pointerId!==activePointer)return;
  activePointer=null;
  if(editState.editMode){editState.dragEntity=null;return;}
  if(pendingRunTap){pendingRunTap=null;if(!game.paused&&game.phase==='presnap')startRunOption();return;}
  if(interaction.aiming){
    interaction.aiming=false;
    if(interaction.aimTarget){
      if(game.passMode==='drag'){
        const {cx,cy}=toCanvas(entities.players.qb);
        const anchor=interaction.aimAnchor??{x:cx,y:cy};
        const pullDist=Math.hypot(interaction.aimTarget.x-anchor.x,interaction.aimTarget.y-anchor.y);
        if(pullDist>=MIN_PULL){
          releaseThrow(slingshotTarget({cx,cy},interaction.aimTarget,entities.players.qb.attributes?.arm??entities.players.qb.rating,game.throwType,anchor));
        }
      } else {
        releaseThrow(interaction.aimTarget);
      }
    }
    interaction.aimTarget=null;interaction.aimAnchor=null;
  }
  if(interaction.steering)finishGesture(gestureStart,ev);
  gestureStart=null;secondaryGesture=null;interaction.steering=false;
});
function cancelPointer(ev){
  if(ev?.pointerId===secondaryGesture?.pointerId){secondaryGesture=null;return;}
  if(ev&&ev.pointerId!==activePointer)return;
  if(activePointer!==null&&entities.pendingTapThrow?.pointerId===activePointer)entities.pendingTapThrow=null;
  activePointer=null;pendingRunTap=null;gestureStart=null;secondaryGesture=null;
  editState.dragEntity=null;
  interaction.aiming=false;interaction.steering=false;
  interaction.aimTarget=null;interaction.aimAnchor=null;interaction.steerAnchor=null;interaction.steerCurrent=null;
}
canvas.addEventListener('pointercancel',cancelPointer);
canvas.addEventListener('lostpointercapture',cancelPointer);
