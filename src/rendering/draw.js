import { canvas, ctx } from './canvas.js';
import { game, entities } from '../state/gameState.js';
import { XPX, BASE_X, LAT_MIN, LAT_MAX, DL_KEYS, OFF, DEF, CATCH_TOL_BASE, MIN_PULL, clamp, ratingMultiplier } from '../state/constants.js';
import { currentDiff } from '../state/difficulty.js';
import { PLAYS } from '../data/plays.js';
import { interaction } from '../input/interactionState.js';
import { drawPixelTurf, drawPixelStadium, drawPixelEndZone, drawPixelNumber, END_ZONE_STYLE } from './field.js';
import { drawPlayer, toCanvas, drawRoutePreview } from './players.js';

export function drawArcPath(x0,y0,x1,y1,arcHeight,color,width){
  ctx.strokeStyle=color;ctx.lineWidth=width;
  ctx.beginPath();
  const N=18;
  for(let i=0;i<=N;i++){
    const p=i/N;
    const x=x0+(x1-x0)*p;
    const y=y0+(y1-y0)*p-arcHeight*Math.sin(Math.PI*p);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function drawTackleImpact(){
  if(game.phase!=='tackle'||!game.tackle)return;
  const elapsed=performance.now()-game.tackle.startTime;
  if(elapsed>=190)return;
  const carrierPos=toCanvas(game.tackle.carrier);
  const tacklerPos=toCanvas(game.tackle.tackler);
  const cx=Math.round((carrierPos.cx+tacklerPos.cx)/2);
  const cy=Math.round((carrierPos.cy+tacklerPos.cy)/2-4);
  const spread=4+Math.floor(elapsed/35)*2;
  const pixels=[[-1,-1],[1,-1],[-1,1],[1,1],[0,-2],[0,2]];
  pixels.forEach((p,i)=>{
    ctx.fillStyle=i%2===0?'#fff4a8':'#f6b72c';
    ctx.fillRect(cx+p[0]*spread-2,cy+p[1]*spread-2,4,4);
  });
}
export function draw(){
  const w=canvas.width,h=canvas.height;
  const camPx=game.cameraYard*XPX;
  const xAt=(yard)=>BASE_X-(yard*XPX-camPx);
  ctx.imageSmoothingEnabled=false;
  drawPixelTurf(xAt,w);
  drawPixelStadium(xAt,w);
  for(let yard=0;yard<=100;yard+=5){
    const cx=Math.round(xAt(yard));
    if(cx<-10||cx>w+10)continue;
    const major=yard%10===0;
    ctx.fillStyle=major?'#dcebd4':'#8eb88b';
    ctx.fillRect(cx-(major?1:0),LAT_MIN,major?2:1,LAT_MAX-LAT_MIN);
    if(major&&yard>0&&yard<100){
      const num=yard<=50?yard:100-yard;
      drawPixelNumber(num,cx,LAT_MIN+34,4,false);
      drawPixelNumber(num,cx,LAT_MAX-31,4,true);
    }
  }
  ctx.fillStyle='#a9cda4';
  for(let yard=0;yard<=100;yard++){
    const cx=Math.round(xAt(yard));
    if(cx<-5||cx>w+5)continue;
    ctx.fillRect(cx-1,LAT_MIN+58,2,8);
    ctx.fillRect(cx-1,LAT_MAX-66,2,8);
  }
  ctx.fillStyle='#f0f5e9';
  ctx.fillRect(0,LAT_MIN-2,w,3);
  ctx.fillRect(0,LAT_MAX-1,w,3);
  drawPixelEndZone(xAt,0,-10,END_ZONE_STYLE.near,-Math.PI/2);
  drawPixelEndZone(xAt,100,110,END_ZONE_STYLE.far,Math.PI/2);
  const losX=Math.round(xAt(game.los));
  ctx.fillStyle='#2f70df';ctx.fillRect(losX-1,LAT_MIN,3,LAT_MAX-LAT_MIN);
  const fdX=Math.round(xAt(game.firstDownYard));
  if(fdX>=0&&fdX<=w){
    ctx.fillStyle='#edca3a';
    for(let py=LAT_MIN;py<LAT_MAX;py+=10)ctx.fillRect(fdX-1,py,3,6);
  }
  const jitterOn=(game.phase==='live');
  entities.decor.forEach((d,i)=>{
    if(jitterOn&&!d.isPursuing){
      const j=Math.sin(performance.now()/160+i*1.7)*1.4;
      drawPlayer({x:d.x+j,yfield:d.yfield,num:d.num,skin:d.skin},d.team,false,true);
    } else {
      drawPlayer(d,d.team,false,!d.isPursuing);
    }
  });
  DL_KEYS.forEach(k=>drawPlayer(entities.players[k],DEF));
  drawPlayer(entities.players.cb1,DEF);
  drawPlayer(entities.players.cb2,DEF);
  drawPlayer(entities.players.s1,DEF);
  drawPlayer(entities.players.lb1,DEF);
  drawRoutePreview();
  drawPlayer(entities.players.rb,OFF,entities.ballCarrier===entities.players.rb);
  drawPlayer(entities.players.wr1,OFF,entities.ballCarrier===entities.players.wr1);
  drawPlayer(entities.players.wr3,OFF,entities.ballCarrier===entities.players.wr3);
  drawPlayer(entities.players.te,OFF,entities.ballCarrier===entities.players.te);
  drawPlayer(entities.players.wr2,OFF,entities.ballCarrier===entities.players.wr2);
  drawPlayer(entities.players.qb,OFF,entities.ballCarrier===entities.players.qb);
  if(entities.runExchange){
    const progress=clamp((performance.now()-entities.runExchange.startTime)/entities.runExchange.duration,0,1);
    const from=toCanvas(entities.players.qb),to=toCanvas(entities.players.rb);
    const bx=from.cx+(to.cx-from.cx)*progress;
    const lift=entities.runExchange.type==='pitch'?Math.sin(Math.PI*progress)*12:0;
    const by=from.cy+(to.cy-from.cy)*progress-lift;
    ctx.fillStyle='#7a4a26';
    ctx.beginPath();ctx.ellipse(bx,by,4.5,2.7,0.5,0,7);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx-1.5,by);ctx.lineTo(bx+1.5,by);ctx.stroke();
  }
  drawTackleImpact();
  if(interaction.aiming&&interaction.aimTarget){
    const {cx,cy}=toCanvas(entities.players.qb);
    let tx,ty,showArc;
    if(game.passMode==='drag'){
      const mx=cx*2-interaction.aimTarget.x, my=cy*2-interaction.aimTarget.y;
      ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=2;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(interaction.aimTarget.x,interaction.aimTarget.y);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,255,255,0.7)';
      ctx.beginPath();ctx.arc(interaction.aimTarget.x,interaction.aimTarget.y,6,0,7);ctx.fill();
      const pullDist=Math.hypot(interaction.aimTarget.x-cx,interaction.aimTarget.y-cy);
      showArc=pullDist>=MIN_PULL;
      tx=mx;ty=my;
    } else {
      tx=interaction.aimTarget.x;ty=interaction.aimTarget.y;
      showArc=true;
    }
    if(showArc){
      const previewDist=Math.hypot(tx-cx,ty-cy);
      const previewArc=Math.min(60,previewDist*0.12)*(game.throwType==='bullet'?0.3:1);
      drawArcPath(cx,cy,tx,ty,previewArc,'rgba(255,209,102,0.9)',2.5);
      ctx.strokeStyle='#ffd166';ctx.beginPath();ctx.arc(tx,ty,10,0,7);ctx.stroke();
      const camPx=game.cameraYard*XPX;
      const fLat=clamp(ty,LAT_MIN,LAT_MAX);
      const fDown=camPx+(BASE_X-tx);
      const playDef=PLAYS[game.playCall];
      if(playDef){
        let bestR=null,bestRD=Infinity,bestTol=0,bestScore=Infinity;
        Object.keys(playDef.routes).forEach(k=>{
          const r=entities.players[k];
          const d=Math.hypot(r.x-fLat,r.yfield-fDown);
          const tolerance=CATCH_TOL_BASE*currentDiff().catchRadiusMult*ratingMultiplier(r.rating,0.18);
          const score=d/tolerance;
          if(score<bestScore){bestScore=score;bestRD=d;bestR=r;bestTol=tolerance;}
        });
        if(bestR&&bestRD<bestTol){
          const rc=toCanvas(bestR);
          ctx.strokeStyle='rgba(120,220,255,0.9)';ctx.lineWidth=2.5;
          ctx.beginPath();ctx.arc(rc.cx,rc.cy-3,18,0,7);ctx.stroke();
        }
      }
    }
  }
  if(interaction.steering&&interaction.steerAnchor&&interaction.steerCurrent){
    ctx.fillStyle='rgba(255,255,255,0.12)';
    ctx.beginPath();ctx.arc(interaction.steerAnchor.x,interaction.steerAnchor.y,38,0,7);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(interaction.steerAnchor.x,interaction.steerAnchor.y,38,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(interaction.steerAnchor.x,interaction.steerAnchor.y);ctx.lineTo(interaction.steerCurrent.x,interaction.steerCurrent.y);ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(interaction.steerCurrent.x,interaction.steerCurrent.y,9,0,7);ctx.fill();
  }
  if(entities.ball.inFlight&&performance.now()>=entities.ball.startTime){
    const p=Math.min(1,(performance.now()-entities.ball.startTime)/entities.ball.duration);
    const bx=entities.ball.fromX+(entities.ball.toX-entities.ball.fromX)*p;
    const byf=entities.ball.fromY+(entities.ball.toY-entities.ball.fromY)*p;
    const {cx,cy}=toCanvas({x:bx,yfield:byf});
    const arc=entities.ball.arcHeight*Math.sin(Math.PI*p);
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath();ctx.ellipse(cx,cy,5+arc*0.04,3,0,0,7);ctx.fill();
    const bcy=cy-arc;
    ctx.fillStyle='#7a4a26';
    ctx.beginPath();ctx.ellipse(cx,bcy,5.5,3.3,0.5,0,7);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx-2,bcy);ctx.lineTo(cx+2,bcy);ctx.stroke();
  }
}
