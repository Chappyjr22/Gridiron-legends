import { canvas, ctx } from './canvas.js';
import { game, entities } from '../state/gameState.js';
import { XPX, BASE_X, MISSED_TACKLE_DIVE_MS, MISSED_TACKLE_DOWN_MS, SPRITE_CELL, SPRITE_DRAW, SPRITE_ANCHOR_X, SPRITE_ANCHOR_Y, OFF, DEF } from '../state/constants.js';
import { interaction } from '../input/interactionState.js';
import { spriteState, spriteSheets, presnapSpriteSheets, defensePresnapSpriteSheets, PRESNAP_COLUMNS, DEFENSE_PRESNAP_COLUMNS } from './spriteSheets.js';
import { PLAYS } from '../data/plays.js';

export function toCanvas(e){const camPx=game.cameraYard*XPX;return {cx:BASE_X-(e.yfield-camPx),cy:e.x};}
export function drawHelmet(cx,cy,team){
  ctx.fillStyle=team.helmet;
  ctx.beginPath();
  ctx.ellipse(cx,cy,7,6,0,Math.PI,0,false);
  ctx.lineTo(cx+7,cy+1.5);
  ctx.quadraticCurveTo(cx,cy+5.5,cx-7,cy+1.5);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle=team.stripe;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx,cy-0.5);ctx.stroke();
  ctx.strokeStyle='#c7cdd4';ctx.lineWidth=1.1;
  ctx.beginPath();
  ctx.moveTo(cx-5,cy);
  ctx.quadraticCurveTo(cx,cy+5,cx+5,cy);
  ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-3.2,cy+1);ctx.lineTo(cx-3.2,cy+3.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+3.2,cy+1);ctx.lineTo(cx+3.2,cy+3.3);ctx.stroke();
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath();ctx.arc(cx-6,cy-0.5,1.1,0,7);ctx.fill();
}
export function playerFrame(e,isDecor){
  const now=performance.now();
  if(e.action==='tackled'){
    const elapsed=now-e.actionStart;
    return elapsed<140?{row:4,col:3}:{row:4,col:4};
  }
  if(e.action==='tackle'){
    const elapsed=now-e.actionStart;
    return elapsed<65?{row:1,col:4}:{row:4,col:5};
  }
  if(e.action==='missedTackle'){
    const elapsed=now-e.actionStart;
    if(elapsed<MISSED_TACKLE_DIVE_MS)return {row:4,col:5};
    if(elapsed<MISSED_TACKLE_DOWN_MS)return {row:4,col:4};
    return {row:0,col:0};
  }
  if(e.action==='throw'){
    const elapsed=now-e.actionStart;
    if(elapsed<70)return {row:3,col:1};
    if(elapsed<150)return {row:3,col:2};
    if(elapsed<300)return {row:3,col:4};
    e.action='';
  }
  if(e.action==='catch'){
    const elapsed=now-e.actionStart;
    if(elapsed<285)return {row:4,col:Math.min(2,Math.floor(elapsed/95))};
    e.action='';
  }
  if(e===entities.players.qb&&interaction.aiming){
    const elapsed=now-interaction.aimStartedAt;
    return {row:0,col:elapsed<90?2:elapsed<180?3:4};
  }
  if(game.phase==='live'){
    if(entities.ballCarrier===e&&e!==entities.players.qb){
      const frameMs=now<(e.breakSlowUntil||0)?180:90;
      return {row:2,col:Math.floor(now/frameMs)%5};
    }
    if(e===entities.players.qb)return {row:0,col:Math.floor(now/260)%2};
    if(!isDecor&&e.state!=='engaged')return {row:1,col:Math.floor(now/90)%5};
  }
  return {row:0,col:Math.floor(now/260)%2};
}
export function drawPlayer(e,team,highlight,isDecor){
  if(!e)return;
  const position=toCanvas(e);
  let cx=position.cx,cy=position.cy;
  if(cx<-30||cx>canvas.width+30)return;
  if(e.action==='tackle'&&game.tackle){
    const elapsed=performance.now()-e.actionStart;
    const target=toCanvas(game.tackle.carrier);
    const dx=target.cx-cx,dy=target.cy-cy;
    const distance=Math.hypot(dx,dy);
    const fallbackX=e.facing==='left'?-1:1;
    const ux=distance>0.1?dx/distance:fallbackX;
    const uy=distance>0.1?dy/distance:0;
    const driveP=Math.min(1,elapsed/145);
    const driveEase=1-Math.pow(1-driveP,2);
    const reach=Math.min(14,distance*0.6);
    cx+=ux*reach*driveEase;
    cy+=uy*reach*driveEase;
  }
  const actionElapsed=performance.now()-(e.actionStart||0);
  const isDiving=(e.action==='tackle'&&actionElapsed>=65)||(e.action==='missedTackle'&&actionElapsed<MISSED_TACKLE_DOWN_MS);
  if(highlight){
    ctx.fillStyle='rgba(255,209,102,0.16)';
    ctx.strokeStyle='rgba(255,209,102,0.9)';
    ctx.lineWidth=1.25;
    ctx.beginPath();ctx.ellipse(cx,cy+12,isDiving?16:12.5,isDiving?4:4.5,0,0,7);ctx.fill();ctx.stroke();
  }
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath();ctx.ellipse(cx,cy+12,isDiving?15:10,3.2,0,0,7);ctx.fill();
  if(spriteState.spritesReady){
    const isPresnapPhase=game.phase==='callsheet'||game.phase==='presnap';
    const useOffensePresnap=spriteState.presnapSpritesReady&&isPresnapPhase&&team===OFF&&PRESNAP_COLUMNS[e.presnapRole]!==undefined;
    const useDefensePresnap=spriteState.defensePresnapSpritesReady&&isPresnapPhase&&team===DEF&&DEFENSE_PRESNAP_COLUMNS[e.presnapRole]!==undefined;
    const usePositionPresnap=useOffensePresnap||useDefensePresnap;
    const frame=useOffensePresnap
      ?{row:0,col:PRESNAP_COLUMNS[e.presnapRole]}
      :useDefensePresnap
        ?{row:0,col:DEFENSE_PRESNAP_COLUMNS[e.presnapRole]}
        :playerFrame(e,!!isDecor);
    const sheets=useOffensePresnap
      ?presnapSpriteSheets.off
      :useDefensePresnap
        ?defensePresnapSpriteSheets
        :(team===DEF?spriteSheets.def:spriteSheets.off);
    const sheet=sheets[e.skin??0]||sheets[0];
    const anchorX=SPRITE_DRAW*(SPRITE_ANCHOR_X/SPRITE_CELL);
    const anchorY=SPRITE_DRAW*(SPRITE_ANCHOR_Y/SPRITE_CELL);
    const sourceFacing=usePositionPresnap?'left':(((frame.row===0&&frame.col>=2)||frame.row===3)?'right':'left');
    const desiredFacing=e.facing||(team===DEF?'right':'left');
    const mirrorFrame=sourceFacing!==desiredFacing;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(cx),Math.round(cy+12));
    if(mirrorFrame)ctx.scale(-1,1);
    ctx.drawImage(sheet,frame.col*SPRITE_CELL,frame.row*SPRITE_CELL,SPRITE_CELL,SPRITE_CELL,Math.round(-anchorX),Math.round(-anchorY),SPRITE_DRAW,SPRITE_DRAW);
    ctx.restore();
    return;
  }
  ctx.fillStyle='#2b2b2b';
  ctx.fillRect(cx-5.5,cy+2,4.5,10);
  ctx.fillRect(cx+1,cy+2,4.5,10);
  ctx.fillStyle=team.jersey;
  ctx.fillRect(cx-12,cy-6,3.5,9);
  ctx.fillRect(cx+8.5,cy-6,3.5,9);
  ctx.fillRect(cx-9,cy-9,18,13);
  drawHelmet(cx,cy-13,team);
  ctx.fillStyle='#fff';ctx.font='bold 7.5px sans-serif';ctx.textAlign='center';
  ctx.fillText(e.num,cx,cy-2);
  ctx.textAlign='left';
}
export function drawRoutePreview(){
  if(game.phase!=='presnap'||!game.showRoutes)return;
  const playDef=PLAYS[game.playCall];
  if(!playDef)return;
  const camPx=game.cameraYard*XPX;
  Object.keys(playDef.routes).forEach(key=>{
    const entity=entities.players[key];
    const wps=playDef.routes[key];
    const startCx=BASE_X-(entity.yfield-camPx), startCy=entity.x;
    ctx.strokeStyle='rgba(255,255,255,0.65)';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(startCx,startCy);
    wps.forEach(wp=>{
      const ty=(game.los+wp.y)*XPX;
      const cx=BASE_X-(ty-camPx), cy=wp.x;
      ctx.lineTo(cx,cy);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    const last=wps[wps.length-1];
    const ty=(game.los+last.y)*XPX;
    const cx=BASE_X-(ty-camPx), cy=last.x;
    ctx.fillStyle='rgba(255,209,102,0.95)';
    ctx.beginPath();ctx.arc(cx,cy,4.5,0,7);ctx.fill();
  });
  if(playDef.runPath?.length){
    const entity=entities.players.rb;
    const start=toCanvas(entity);
    ctx.strokeStyle='rgba(255,209,66,.9)';ctx.lineWidth=3;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(start.cx,start.cy);
    playDef.runPath.forEach(wp=>{
      const ty=(game.los+wp.y)*XPX;
      ctx.lineTo(BASE_X-(ty-camPx),wp.x);
    });
    ctx.stroke();
  }
}
