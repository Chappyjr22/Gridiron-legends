import { canvas } from '../rendering/canvas.js';
import { toCanvas } from '../rendering/players.js';
import { game, entities } from '../state/gameState.js';
import { XPX, BASE_X, MIN_PULL, clamp } from '../state/constants.js';
import { OFFENSE_SKILL_KEYS } from '../data/formations.js';
import { PLAYS } from '../data/plays.js';
import { onSnap, startRunOption, releaseThrow } from '../simulation/engine.js';
import { interaction } from './interactionState.js';
import { editState } from './editState.js';
import { findNearEntity, updateEditJSON } from './editControls.js';

function pointerPos(ev){
  const r=canvas.getBoundingClientRect();
  return {x:(ev.clientX-r.left)*(canvas.width/r.width), y:(ev.clientY-r.top)*(canvas.height/r.height)};
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
  entities.pendingTapThrow={playerKey:best<=36?playerKey:null,target:{x:point.x,y:point.y},releaseAt:performance.now()+240};
}
canvas.addEventListener('pointerdown',ev=>{
  if(editState.editMode){
    canvas.setPointerCapture(ev.pointerId);
    editState.dragEntity=findNearEntity(pointerPos(ev));
    return;
  }
  if((game.phase!=='live'&&game.phase!=='presnap')||game.paused)return;
  canvas.setPointerCapture(ev.pointerId);
  const p=pointerPos(ev);
  if(game.phase==='presnap'){
    if(PLAYS[game.playCall]?.type==='run'||pointNearPlayer(p,entities.players.rb)){
      startRunOption();
      interaction.steering=true;interaction.steerAnchor={x:p.x,y:p.y};interaction.steerCurrent={x:p.x,y:p.y};
      return;
    }
    onSnap();
    if(game.passMode==='tap')beginTapPass(p);
    else {interaction.aiming=true;interaction.aimStartedAt=performance.now();interaction.aimTarget=p;}
    return;
  }
  if(!game.thrown){
    if(game.passMode==='tap'){
      releaseThrow(p);
    } else {
      interaction.aiming=true;interaction.aimStartedAt=performance.now();interaction.aimTarget=p;
    }
  } else if(entities.ballCarrier&&entities.ballCarrier!==entities.players.qb){
    interaction.steering=true;interaction.steerAnchor={x:p.x,y:p.y};interaction.steerCurrent={x:p.x,y:p.y};
  }
});
canvas.addEventListener('pointermove',ev=>{
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
  if(interaction.aiming){interaction.aimTarget=p;}
  else if(interaction.steering){interaction.steerCurrent=p;}
});
canvas.addEventListener('pointerup',()=>{
  if(editState.editMode){editState.dragEntity=null;return;}
  if(interaction.aiming){
    interaction.aiming=false;
    if(interaction.aimTarget){
      if(game.passMode==='drag'){
        const {cx,cy}=toCanvas(entities.players.qb);
        const pullDist=Math.hypot(interaction.aimTarget.x-cx,interaction.aimTarget.y-cy);
        if(pullDist>=MIN_PULL){
          const mx=cx*2-interaction.aimTarget.x, my=cy*2-interaction.aimTarget.y;
          releaseThrow({x:mx,y:my});
        }
      } else {
        releaseThrow(interaction.aimTarget);
      }
    }
    interaction.aimTarget=null;
  }
  interaction.steering=false;
});
canvas.addEventListener('pointercancel',()=>{interaction.aiming=false;interaction.steering=false;});
