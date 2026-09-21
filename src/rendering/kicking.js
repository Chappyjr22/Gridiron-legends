import {toCanvas} from './players.js';
import {kickMeter,KICK_GOAL,kickGoalSample} from '../simulation/kicking.js';
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
 const k=game.kick,elapsed=now-k.start,air=['flight','settle'].includes(k.stage)||game.phase==='result';
 const pixelScale=Math.max(1,ctx.canvas.height/Math.max(1,ctx.canvas.getBoundingClientRect().height));
 const origin=toCanvas({x:190,yfield:(game.los-7)*XPX}),originX=origin.cx,originY=origin.cy;
 const art=teamSheet(k.skin||0);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.textAlign='center';
 const title=`${game.practice?'PRACTICE · ':''}${k.distance} YARD FIELD GOAL`;
 ctx.font=`bold ${Math.max(16,12*pixelScale)}px monospace`;
 const titleWidth=ctx.measureText(title).width+24;
 ctx.fillStyle='#102b43';ctx.fillRect((width-titleWidth)/2,10,titleWidth,32);
 ctx.fillStyle='#fff0ce';ctx.fillText(title,width/2,33);
 if(art){
  const follow=air||(k.stage==='approach'&&elapsed>420),approach=k.stage==='approach'?Math.min(1,elapsed/420):air?1:0;
  const player=(frame,x,y)=>ctx.drawImage(art,(frame%2)*64,Math.floor(frame/2)*64,64,64,Math.round(x-32),Math.round(y-59),64,64);
  player(follow?1:0,originX+28-approach*13,originY);player(follow?3:2,originX+8,originY);
 }
 if(air){
  const ball=entities.ball,pos=ball.loose?ball:flightPosition(ball,now),point=toCanvas(pos);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(point.cx,point.cy,5,2,0,0,7);ctx.fill();
  drawFootball(ctx,point.cx,point.cy-(pos.height||0),{time:now,tumble:true});
  if(k.flight)drawGoalCamera(ctx,k.flight,now,pixelScale);
 }else drawFootball(ctx,originX-4,originY-2,{angle:Math.PI/2,size:24});
 if(['power','aim'].includes(k.stage)){
  const w=Math.min(Math.max(360,240*pixelScale),width*.7),left=(width-w)/2,stage=k.stage;
  const value=kickMeter(stage,elapsed,game.difficulty),start=stage==='power'?Math.min(1,k.powerRequired):(1-k.aimTolerance)/2,span=stage==='power'?Math.max(0,1-k.powerRequired):k.aimTolerance;
  ctx.fillStyle='#081b2c';ctx.fillRect(left-12,292,w+24,82);ctx.fillStyle='#fff2d2';ctx.font=`bold ${Math.max(14,12*pixelScale)}px monospace`;
  ctx.fillText(stage==='power'?(k.powerRequired>1?'OUT OF RANGE · TAP POWER':'1 · TAP TO SET POWER'):'2 · TAP AT CENTER',width/2,316);
  ctx.fillStyle='#a74932';ctx.fillRect(left,329,w,18);ctx.fillStyle='#69c78c';ctx.fillRect(left+w*start,329,w*span,18);ctx.fillStyle='#fff';ctx.fillRect(left+w*(stage==='power'?value:(value+1)/2)-2,325,4,26);
  ctx.font=`${Math.max(12,10*pixelScale)}px sans-serif`;ctx.fillStyle='#d3dfec';ctx.fillText(`Kicker ${k.rating} · ${game.difficulty}`,width/2,367);
 }
 ctx.restore();
}
function drawGoalCamera(ctx,ball,now,pixelScale){
 const scale=Math.min(1.35,pixelScale),left=12,top=58,w=230*scale,h=210*scale;
 const center=left+w/2,base=top+h-32*scale,bar=base-KICK_GOAL.barHeight*scale;
 const sample=kickGoalSample(ball,now),held=sample.crossed||sample.finished;
 ctx.fillStyle='rgba(7,25,39,.96)';ctx.fillRect(left,top,w,h);
 ctx.strokeStyle='#a4b4ba';ctx.lineWidth=2;ctx.strokeRect(left,top,w,h);
 ctx.fillStyle='#e8ecdc';ctx.font=`bold ${Math.max(14,11*pixelScale)}px monospace`;
 ctx.fillText(held?(sample.crossed?'AT THE UPRIGHTS':'SHORT OF UPRIGHTS'):'UPRIGHTS VIEW',center,top+22*scale);
 ctx.save();ctx.beginPath();ctx.rect(left+3,top+30*scale,w-6,h-42*scale);ctx.clip();
 ctx.strokeStyle='#ffdf50';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(center-46*scale,top+38*scale);ctx.lineTo(center-46*scale,bar);ctx.lineTo(center+46*scale,bar);ctx.lineTo(center+46*scale,top+38*scale);ctx.stroke();
 ctx.beginPath();ctx.moveTo(center,bar);ctx.lineTo(center,base);ctx.stroke();
 const x=center+sample.offset*scale,y=base-sample.height*scale;
 if(held){ctx.strokeStyle=sample.reason==='GOOD'?'#8bf0b5':'#ffbf87';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,11*scale,0,Math.PI*2);ctx.stroke();}
 drawFootball(ctx,x,y,{time:held?0:now,tumble:true,size:20*scale});
 ctx.restore();
 ctx.fillStyle=held?(sample.reason==='GOOD'?'#8bf0b5':'#ffbf87'):'#d3dfec';
 ctx.font=`bold ${Math.max(14,11*pixelScale)}px monospace`;
 ctx.fillText(held?sample.reason:'BALL APPROACHING',center,top+h-10*scale);
}
