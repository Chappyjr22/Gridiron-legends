import {slingshotTarget} from '../input/aim.js';
import {flightPosition} from '../simulation/ballMotion.js';
import {replayFrame,highlights} from '../simulation/highlights.js';
import {playingRoster} from '../career/roster.js';
import {passingRead} from '../simulation/passing.js';
import {brandArt} from './brand.js';
import {stickVector,STICK_TRAVEL} from '../input/runnerControls.js';
import {catchTolerance} from '../simulation/receiving.js';
import { renderNow as simulationNow, setRenderTime } from '../state/clock.js';
import { canvas, ctx } from './canvas.js';
import { game, entities, teamState } from '../state/gameState.js';
import { XPX, BASE_X, LAT_MIN, LAT_MAX, DL_KEYS, OFF, DEF,  MIN_PULL, clamp, ratingMultiplier } from '../state/constants.js';
import { currentDiff } from '../state/difficulty.js';
import { PLAYS } from '../data/plays.js';
import { interaction } from '../input/interactionState.js';
import { drawPixelTurf, drawPixelStadium, drawPixelEndZone, drawPixelNumber, END_ZONE_STYLE } from './field.js';
import { drawPlayer, toCanvas, drawRoutePreview } from './players.js';
import { SCENE_TOP } from './sceneLayout.js';

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
  const elapsed=simulationNow()-game.tackle.startTime;
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
function drawPresnapLineupTags(){
  if(game.phase!=='presnap')return;
  const roster=playingRoster(teamState.userTeam);
  const keys=['wr1','wr2','wr3','te','rb'];
  ctx.save();
  ctx.textBaseline='middle';
  ctx.textAlign='center';
  ctx.font='700 9px "Courier New", monospace';
  for(const key of keys){
    const entity=entities.players[key];
    if(!entity)continue;
    const player=roster.find(p=>p.id===entity.playerId);
    const slot=String(entity.slot||key).toUpperCase();
    const identity=player&&!player.generic
      ?`${String(player.firstName||'').charAt(0)}.${String(player.lastName||'').slice(0,8).toUpperCase()}`
      :`#${entity.num}`;
    const text=`${slot} ${identity}`;
    const pos=toCanvas(entity);
    const width=Math.ceil(ctx.measureText(text).width)+10;
    const height=17;
    const x=clamp(Math.round(pos.cx),Math.ceil(width/2)+4,canvas.width-Math.ceil(width/2)-4);
    const y=clamp(Math.round(pos.cy-32),LAT_MIN+10,LAT_MAX-12);
    ctx.fillStyle='rgba(5,12,18,.88)';
    ctx.fillRect(Math.round(x-width/2),Math.round(y-height/2),width,height);
    ctx.strokeStyle=player&&!player.generic?'#f4c542':'rgba(245,237,207,.7)';
    ctx.lineWidth=1.5;
    ctx.strokeRect(Math.round(x-width/2)+.5,Math.round(y-height/2)+.5,width-1,height-1);
    ctx.fillStyle='#f8f1d8';
    ctx.fillText(text,x,y+.5);
  }
  ctx.restore();
}
export function draw(){
 const frame=replayFrame();
 document.getElementById('result-overlay')?.classList.toggle('replaying',!!frame);
 const button=document.getElementById('btn-replay');if(button)button.textContent=frame?'Skip replay':'Replay';
 if(!frame){drawScene();return;}
 const savedEntities={...entities},savedGame={...game};
 try{
   const copy=JSON.parse(JSON.stringify(frame));
   copy.decor.forEach((player,index)=>{player.team=savedEntities.decor[index]?.team;});
   entities.players=copy.players;entities.decor=copy.decor;entities.ball=copy.ball;entities.ballCarrier=copy.players[copy.carrierKey]||null;entities.runExchange=null;entities.playFake=null;
   Object.assign(game,{cameraYard:copy.cameraYard,los:copy.los,firstDownYard:copy.firstDownYard,scrambling:copy.scrambling,phase:copy.phase,tackle:null});
   setRenderTime(frame.time);drawScene();
 }finally{Object.assign(entities,savedEntities);Object.assign(game,savedGame);setRenderTime(null);}
}
function drawScene(){
  const w=canvas.width;
  ctx.setTransform(1,0,0,1,0,SCENE_TOP);
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
  // Paint the league shield over yard markings, below gameplay overlays.
  if(brandArt.shield){
    const logo=brandArt.shield,width=196,height=width*logo.height/logo.width;
    ctx.save();ctx.globalAlpha=1;
    ctx.drawImage(logo,Math.round(xAt(50)-width/2),Math.round((LAT_MIN+LAT_MAX-height)/2),width,height);
    ctx.restore();
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
    ctx.fillRect(fdX-1,LAT_MIN,3,LAT_MAX-LAT_MIN);
  }
  if(game.drivePresentation&&game.possession==='cpu'){
    const drive=game.drivePresentation,progress=Math.min(1,(simulationNow()-drive.start)/4500);
    const left=w*.12,width=w*.76,top=(LAT_MIN+LAT_MAX)/2;
    ctx.fillStyle='rgba(9,28,47,.94)';ctx.fillRect(left-14,top-42,width+28,94);
    ctx.fillStyle='#486480';ctx.fillRect(left,top,width,12);
    ctx.fillStyle='#f4c542';ctx.fillRect(left+width*drive.startField/100,top,width*drive.gain/100*progress,12);
    ctx.fillStyle='#fff4d4';ctx.font='16px monospace';ctx.textAlign='left';ctx.fillText('OPPONENT DRIVE',left,top-15);
    ctx.font='12px monospace';ctx.fillText('OWN GOAL',left,top+35);ctx.textAlign='right';ctx.fillText('YOUR GOAL',left+width,top+35);
    ctx.textAlign='left';
    return;
  }
  // Show actual close contact, not the entire blocking assignment or pursuit path.
  if(game.phase==='live'){
    const offense=[...entities.decor.filter(p=>p.team===OFF),...['rb','wr1','wr2','wr3','te'].map(k=>entities.players[k])].filter(Boolean);
    const defense=[...DL_KEYS.map(k=>entities.players[k]),...entities.decor.filter(p=>p.team===DEF)];
    for(const defender of defense){
      if(!defender||!(defender.state==='engaged'||simulationNow()<(defender.blockedUntil||0)))continue;
      const blocker=offense.find(p=>p!==entities.ballCarrier&&Math.hypot(p.x-defender.x,p.yfield-defender.yfield)<24);
      if(!blocker)continue;
      const a=toCanvas(blocker),b=toCanvas(defender),x=(a.cx+b.cx)/2,y=(a.cy+b.cy)/2+13;
      ctx.fillStyle='rgba(255,243,208,.7)';ctx.fillRect(x-5,y,3,2);ctx.fillRect(x+2,y,3,2);
    }
  }
  const jitterOn=(game.phase==='live');
  entities.decor.forEach((d,i)=>{
    if(jitterOn&&!d.isPursuing&&!d.isBlocking){
      const j=Math.sin(simulationNow()/160+i*1.7)*1.4;
      drawPlayer({x:d.x+j,yfield:d.yfield,num:d.num,skin:d.skin},d.team,false,true);
    } else {
      drawPlayer(d,d.team,false,!d.isPursuing&&!d.isBlocking);
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
  drawPresnapLineupTags();
  if(entities.playFake){
    const p=clamp((simulationNow()-entities.playFake.start)/entities.playFake.duration,0,1),qb=toCanvas(entities.players.qb),rb=toCanvas(entities.players.rb);
    const reach=Math.sin(p*Math.PI);ctx.fillStyle='#9a582c';ctx.fillRect(qb.cx+(rb.cx-qb.cx)*reach-4,qb.cy+(rb.cy-qb.cy)*reach-2,8,4);
  }
  if(entities.runExchange){
    const progress=clamp((simulationNow()-entities.runExchange.startTime)/entities.runExchange.duration,0,1);
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
      const target=slingshotTarget({cx,cy},interaction.aimTarget,entities.players.qb.attributes?.arm??entities.players.qb.rating);const mx=target.x,my=target.y;
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
    if(showArc&&tx>cx+XPX){
      ctx.save();ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#101e30';
      ctx.fillRect(cx-72,cy-49,144,24);ctx.fillStyle='#ffdc63';ctx.fillText('Release to scramble',cx,cy-32);ctx.restore();
    }else if(showArc){
      const previewDist=Math.hypot(tx-cx,ty-cy);
      const previewArc=Math.min(60,previewDist*0.12)*(game.throwType==='bullet'?0.3:1);
      drawArcPath(cx,cy,tx,ty,previewArc,'rgba(255,209,102,0.9)',2.5);
      ctx.strokeStyle='#ffd166';ctx.beginPath();ctx.arc(tx,ty,10,0,7);ctx.stroke();
      const camPx=game.cameraYard*XPX;
      const fLat=clamp(ty,LAT_MIN,LAT_MAX);
      const fDown=camPx+(BASE_X-tx);
      const playDef=PLAYS[game.playCall];
      if(playDef){
        const read=passingRead({players:entities.players,play:playDef,los:game.los,elapsed:simulationNow()-game.snapTime,landing:{x:fLat,yfield:fDown},kind:game.throwType,difficulty:currentDiff(),difficultyName:game.difficulty,momentum:game.momentum});
        if(read.target){
          const rc=toCanvas(read.target.predicted),current=toCanvas(entities.players[read.target.key]);
          ctx.strokeStyle=read.target.error<=read.target.tolerance?'#8cf0cf':read.target.reachable?'#ffd166':'rgba(255,255,255,.45)';
          ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(current.cx,current.cy);ctx.lineTo(rc.cx,rc.cy);ctx.stroke();ctx.setLineDash([]);
          ctx.beginPath();ctx.arc(rc.cx,rc.cy,9,0,Math.PI*2);ctx.stroke();
        }
      }
    }
  }
  if(interaction.steering&&interaction.steerAnchor&&interaction.steerCurrent){
    const vector=stickVector(interaction.steerAnchor,interaction.steerCurrent);
    const thumb={x:interaction.steerAnchor.x+vector.x*STICK_TRAVEL,y:interaction.steerAnchor.y+vector.y*STICK_TRAVEL};
    ctx.fillStyle='rgba(255,255,255,0.12)';
    ctx.beginPath();ctx.arc(interaction.steerAnchor.x,interaction.steerAnchor.y,38,0,7);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(interaction.steerAnchor.x,interaction.steerAnchor.y,38,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(interaction.steerAnchor.x,interaction.steerAnchor.y);ctx.lineTo(thumb.x,thumb.y);ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(thumb.x,thumb.y,9,0,7);ctx.fill();
  }
  const ball=entities.ball;
  if((ball.inFlight&&simulationNow()>=ball.startTime)||ball.loose){
    const position=ball.loose?ball:flightPosition(ball,simulationNow());
    const {cx,cy}=toCanvas(position),height=position.height||0;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(cx,cy+4,5,2.5,0,0,7);ctx.fill();
    ctx.save();ctx.translate(Math.round(cx),Math.round(cy-height));ctx.rotate(ball.loose?ball.spin:simulationNow()/110);
    ctx.fillStyle='#341d12';ctx.fillRect(-6,-3,12,6);ctx.fillStyle='#ad6735';ctx.fillRect(-5,-2,10,4);ctx.fillStyle='#fff3d6';ctx.fillRect(-2,-1,4,2);ctx.restore();
  }
  if(game.fumble){ctx.fillStyle='#101e30';ctx.fillRect(canvas.width/2-90,28,180,30);ctx.fillStyle='#ffdb65';ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText('LOOSE BALL!',canvas.width/2,50);}
  if(game.phase==='kicking'&&game.kick.stage!=='flight'){
    const k=game.kick,now=simulationNow(),width=Math.min(300,canvas.width*.6),left=(canvas.width-width)/2;
    const value=k.stage==='power'?(Math.sin((now-k.start)/300-Math.PI/2)+1)/2:(Math.sin((now-k.start)/400)+1)/2;
    ctx.fillStyle='#081b2c';ctx.fillRect(left-12,30,width+24,80);ctx.fillStyle='#f5ead1';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(k.stage==='power'?'TAP: POWER':'TAP: AIM AT CENTER',canvas.width/2,53);
    ctx.fillStyle='#bb5839';ctx.fillRect(left,67,width,22);ctx.fillStyle='#58b46b';ctx.fillRect(left+width*(k.stage==='power'?.7:.35),67,width*.3,22);ctx.fillStyle='#fff';ctx.fillRect(left+width*value-2,63,4,30);
  }
}
