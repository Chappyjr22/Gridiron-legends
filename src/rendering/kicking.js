import {kickMeter,KICK_GOAL} from '../simulation/kicking.js';
import {flightPosition} from '../simulation/ballMotion.js';
import {drawFootball} from './football.js';
import {OFF,XPX,SKIN_PALETTES} from '../state/constants.js';
import {hexToRGB} from './spriteSheets.js';
const sprites=new Image();sprites.src='assets/kicking.png';
let labels=null,cacheKey='',sheet=null;
fetch('assets/kicking-materials.json').then(r=>r.json()).then(data=>{labels=data.labels;}).catch(()=>{});
function teamSheet(skin){
 if(!sprites.complete||!sprites.naturalWidth||!labels)return null;
 const key=[OFF.helmet,OFF.stripe,OFF.jersey,OFF.pants,skin].join(':');if(key===cacheKey)return sheet;
 const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.drawImage(sprites,0,0);const pixels=ctx.getImageData(0,0,128,128);
 const palette={1:hexToRGB(OFF.helmet),2:hexToRGB(OFF.stripe),3:hexToRGB(OFF.jersey),4:hexToRGB(OFF.pants)};
 for(let i=0;i<labels.length;i++){const id=labels[i],at=i*4,r=pixels.data[at];let color=palette[id];
  if(id===5)color=SKIN_PALETTES[skin]?.[r>230?0:r>210?1:r>180?2:r>150?3:4]||SKIN_PALETTES[0][2];
  if(color){const shade=id===5?1:Math.max(.42,Math.min(1.15,Math.max(...pixels.data.slice(at,at+3))/210));for(let j=0;j<3;j++)pixels.data[at+j]=Math.min(255,Math.round(color[j]*shade));}
 }
 ctx.putImageData(pixels,0,0);cacheKey=key;sheet=c;return c;
}
export function drawKick(ctx,width,game,entities,now){
 const k=game.kick,goalX=width*.43,goalY=210,originX=width*.73,originY=318;
 const distance=k.distance,elapsed=now-k.start,air=['flight','settle'].includes(k.stage)||game.phase==='result';
 ctx.fillStyle='#153c31';ctx.fillRect(0,-16,width,396);
 ctx.fillStyle='#2e713d';ctx.beginPath();ctx.moveTo(goalX-125,145);ctx.lineTo(goalX+125,145);ctx.lineTo(width,380);ctx.lineTo(0,380);ctx.fill();
 ctx.strokeStyle='rgba(240,244,224,.4)';ctx.lineWidth=2;
 for(let i=0;i<5;i++){const y=210+i*36;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
 ctx.fillStyle='#123024';ctx.fillRect(0,0,width,58);ctx.fillStyle='#f8edca';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(`${game.practice?'PRACTICE · ':''}${distance} YARD FIELD GOAL`,width/2,25);
 ctx.font='12px sans-serif';ctx.fillText(air?'Watch the ball through the uprights':`Kicker ${k.rating} · ${game.difficulty}`,width/2,45);
 // Goal geometry and ball position share the exact scoring plane and dimensions.
 const bar=goalY-KICK_GOAL.barHeight;
 ctx.strokeStyle='#17271c';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(goalX-46,85);ctx.lineTo(goalX-46,bar);ctx.lineTo(goalX+46,bar);ctx.lineTo(goalX+46,85);ctx.stroke();
 ctx.strokeStyle='#ffdf50';ctx.lineWidth=5;ctx.stroke();ctx.beginPath();ctx.moveTo(goalX,bar);ctx.lineTo(goalX,goalY);ctx.stroke();
 const art=teamSheet(k.skin||0);
 if(art){
  const follow=air||(k.stage==='approach'&&elapsed>420),approach=k.stage==='approach'?Math.min(1,elapsed/420):air?1:0;
  const player=(frame,x,y)=>ctx.drawImage(art,(frame%2)*64,Math.floor(frame/2)*64,64,64,Math.round(x-64),Math.round(y-118),128,128);
  ctx.imageSmoothingEnabled=false;player(follow?1:0,originX+55-approach*25,originY);player(follow?3:2,originX+16,originY);
 }
 if(air){
  const ball=entities.ball,pos=ball.loose?ball:flightPosition(ball,now),p=(pos.yfield-(117-distance-7)*XPX)/(distance*XPX);
  const depth=p<=1?p:1+(p-1)*.16;
  const x=originX+(goalX-originX)*depth+(pos.x-190),ground=originY+(goalY-originY)*depth;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,ground,5,2,0,0,7);ctx.fill();
  drawFootball(ctx,x,ground-(pos.height||0),{time:now,tumble:true});
 }else drawFootball(ctx,originX-7,originY-4,{angle:Math.PI/2});
 if(['power','aim'].includes(k.stage)){
  const w=Math.min(360,width*.68),left=(width-w)/2,stage=k.stage;
  const value=kickMeter(stage,elapsed,game.difficulty),start=stage==='power'?Math.min(1,k.powerRequired):(1-k.aimTolerance)/2,span=stage==='power'?Math.max(0,1-k.powerRequired):k.aimTolerance;
  ctx.fillStyle='#081b2c';ctx.fillRect(left-12,320,w+24,60);ctx.fillStyle='#fff2d2';ctx.font='bold 14px monospace';ctx.fillText(stage==='power'?(k.powerRequired>1?'OUT OF RANGE · TAP POWER':'1 · TAP TO SET POWER'):'2 · TAP AT CENTER',width/2,339);
  ctx.fillStyle='#a74932';ctx.fillRect(left,350,w,16);ctx.fillStyle='#69c78c';ctx.fillRect(left+w*start,350,w*span,16);ctx.fillStyle='#fff';ctx.fillRect(left+w*(stage==='power'?value:(value+1)/2)-2,346,4,24);
 }
}
