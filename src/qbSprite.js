import * as THREE from 'three';
import { QB_BASE_ATLAS } from './qbSpriteBase.js';

const FRAME_W = 96;
const FRAME_H = 128;
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const ACTIONS = { idle:2, dropback:4, run:6, aim:4, throw:3, jukeL:4, jukeR:4, slide:4, power:4 };
const FPS = { idle:2, dropback:9, run:11, aim:10, throw:12, jukeL:12, jukeR:12, slide:8, power:9 };
const JUKE_VISUAL_TIME = .42;
const SLIDE_VISUAL_TIME = .56;
const ROW_START = {};
let rowCursor = 0;
for (const [action,count] of Object.entries(ACTIONS)) { ROW_START[action]=rowCursor; rowCursor+=count; }
const ROWS = rowCursor;

const P = {
  outline:'#08090a', black:'#17191b', rust:'#c54517',
  skin:'#b77145', skinDark:'#805033', white:'#f9f4e4',
  ivory:'#e9dcc3', ball:'#86451f',
};

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=reject;
    image.src=src;
  });
}
function dirIndex(direction){ return Math.max(0,DIRS.indexOf(direction)); }
function rotateDirection(direction,steps){
  const i=dirIndex(direction);
  return DIRS[(i+steps+DIRS.length*4)%DIRS.length];
}

// The authored right-facing source cells contain parts of adjacent #12 poses.
// Build E/NE/SE from the clean opposite cells and mirror them inside the frame.
function sourceSpec(direction){
  if(direction==='E') return {index:dirIndex('W'),mirror:true};
  if(direction==='NE') return {index:dirIndex('NW'),mirror:true};
  if(direction==='SE') return {index:dirIndex('SW'),mirror:true};
  return {index:dirIndex(direction),mirror:false};
}

function drawBase(ctx,source,direction,frameX,frameY,{dx=0,dy=0,sx=1,sy=1,rotation=0}={}){
  const spec=sourceSpec(direction);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.translate(frameX+FRAME_W/2+dx,frameY+FRAME_H-3+dy);
  ctx.rotate(rotation*Math.PI/180);
  ctx.scale((spec.mirror?-1:1)*sx,sy);
  ctx.drawImage(source,spec.index*FRAME_W,0,FRAME_W,FRAME_H,-FRAME_W/2,-FRAME_H+3,FRAME_W,FRAME_H);
  ctx.restore();
}
function drawUpperBase(ctx,source,direction,frameX,frameY,{dx=0,dy=0,rotation=0,upperH=80}={}){
  const spec=sourceSpec(direction);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.translate(frameX+FRAME_W/2+dx,frameY+upperH+dy);
  ctx.rotate(rotation*Math.PI/180);
  ctx.scale(spec.mirror?-1:1,1);
  ctx.drawImage(source,spec.index*FRAME_W,0,FRAME_W,upperH,-FRAME_W/2,-upperH,FRAME_W,upperH);
  ctx.restore();
}
function pixelBall(ctx,x,y){
  ctx.fillStyle=P.outline; ctx.fillRect(x-4,y-2,9,5); ctx.fillRect(x-2,y-4,5,9);
  ctx.fillStyle=P.ball; ctx.fillRect(x-3,y-2,7,5); ctx.fillRect(x-1,y-3,3,7);
  ctx.fillStyle=P.white; ctx.fillRect(x-1,y,3,1);
}
function ballPosition(direction){
  return {N:[59,69],NE:[57,68],E:[55,69],SE:[54,69],S:[47,69],SW:[42,69],W:[40,69],NW:[40,68]}[direction]||[48,69];
}
function segmentPolygon(a,b,width){
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,px=-dy/len,py=dx/len;
  return [[a[0]+px*width/2,a[1]+py*width/2],[b[0]+px*width/2,b[1]+py*width/2],[b[0]-px*width/2,b[1]-py*width/2],[a[0]-px*width/2,a[1]-py*width/2]];
}
function fillPolygon(ctx,points,fill){
  ctx.fillStyle=fill; ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));
  ctx.closePath(); ctx.fill();
}
function thickSegment(ctx,a,b,width,fill,outline=3){
  fillPolygon(ctx,segmentPolygon(a,b,width+outline*2),P.outline);
  fillPolygon(ctx,segmentPolygon(a,b,width),fill);
}
function drawJoint(ctx,x,y,r,fill){
  ctx.fillStyle=P.outline; ctx.fillRect(Math.round(x-r-2),Math.round(y-r-2),Math.round(r*2+4),Math.round(r*2+4));
  ctx.fillStyle=fill; ctx.fillRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));
}
function drawShoulderCap(ctx,shoulder,side){
  const x=Math.round(shoulder[0]),y=Math.round(shoulder[1]);
  ctx.fillStyle=P.outline; ctx.fillRect(x-(side<0?8:4),y-8,12,15);
  ctx.fillStyle=P.black; ctx.fillRect(x-(side<0?6:3),y-6,9,11);
  ctx.fillStyle=P.rust; ctx.fillRect(x-(side<0?7:1),y+3,8,3);
}
function drawFootballArm(ctx,shoulder,elbow,hand,side,{handBall=false}={}){
  const sleeveEnd=[shoulder[0]+(elbow[0]-shoulder[0])*.42,shoulder[1]+(elbow[1]-shoulder[1])*.42];
  drawShoulderCap(ctx,shoulder,side);
  thickSegment(ctx,shoulder,sleeveEnd,10,P.black,3);
  thickSegment(ctx,sleeveEnd,elbow,8,P.skinDark,3);
  thickSegment(ctx,elbow,hand,7,P.skin,3);
  const wrist=[hand[0]+(elbow[0]-hand[0])*.20,hand[1]+(elbow[1]-hand[1])*.20];
  thickSegment(ctx,wrist,hand,7,P.black,2); drawJoint(ctx,hand[0],hand[1],3,P.skin);
  if(handBall) pixelBall(ctx,hand[0]+side*2,hand[1]-1);
}

// Retro-Bowl-inspired passing: Set -> Load -> Cock -> Hold happens while aiming.
// Finger release only performs Stride -> Release -> Follow-through.
const THROW_POSES=[
  {e:[63,66],h:[55,71],ball:true}, {e:[71,57],h:[80,48],ball:true},
  {e:[73,46],h:[68,32],ball:true}, {e:[77,45],h:[86,37],ball:true},
  {e:[74,55],h:[92,54],ball:false}, {e:[65,69],h:[79,84],ball:false},
];
const OFF_ARM=[
  {e:[35,68],h:[46,70]}, {e:[38,65],h:[49,65]}, {e:[40,62],h:[51,63]},
  {e:[38,64],h:[49,67]}, {e:[32,70],h:[43,77]}, {e:[29,74],h:[36,84]},
];
function drawThrowPose(ctx,direction,stage){
  const backDir=['N','NE','NW'].includes(direction)?direction:'N';
  const shoulder=backDir==='NW'?[65,56]:backDir==='NE'?[66,56]:[67,56];
  const p=THROW_POSES[stage],off=OFF_ARM[stage];
  drawFootballArm(ctx,shoulder,p.e,p.h,1,{handBall:p.ball});
  const offShoulder=[29,58];
  thickSegment(ctx,offShoulder,[33,63],10,P.black,3);
  thickSegment(ctx,[33,63],off.e,8,P.skinDark,3);
  thickSegment(ctx,off.e,off.h,7,P.skin,3);
}
function clearThrowSide(ctx,direction){
  const r=({N:[62,49,34,51],NE:[58,47,38,53],E:[48,45,48,56],NW:[0,47,38,53],W:[0,47,46,53]})[direction]||[62,49,34,51];
  ctx.clearRect(...r);
}
function aimSourceDirection(direction,stage){
  const seq={N:['N','NE','NE','NE'],NE:['NE','NE','NE','NE'],NW:['NW','N','NE','NE']};
  return (seq[direction]||seq.N)[stage];
}
function releaseSourceDirection(direction,stage){
  const seq={N:['NE','NE','N'],NE:['NE','NE','NE'],NW:['NE','N','NW']};
  return (seq[direction]||seq.N)[stage];
}
function drawThrowComposite(ctx,source,direction,bx,y,sourceName,poseStage,transform){
  drawBase(ctx,source,sourceName,bx,y,transform);
  ctx.save(); ctx.translate(bx,y); clearThrowSide(ctx,sourceName); drawThrowPose(ctx,direction,poseStage); ctx.restore();
}

function drawSlideLimb(ctx,hip,knee,ankle,foot,near=true){
  thickSegment(ctx,hip,knee,near?11:9,P.ivory,3);
  thickSegment(ctx,knee,ankle,near?8:7,P.black,3);
  thickSegment(ctx,ankle,foot,near?9:8,P.black,3);
}
function drawSlideFrame(ctx,source,direction,bx,y,frame){
  const useRight=!['W','NW','SW'].includes(direction),sourceName=useRight?'E':'W',sign=useRight?1:-1;
  if(frame===0){
    drawBase(ctx,source,sourceName,bx,y,{dy:1,sx:1.02,sy:.98});
    pixelBall(ctx,bx+(useRight?58:38),y+70); return;
  }
  const torsoDx=sign*[0,1,3,5][frame],torsoDy=[0,4,9,13][frame],torsoLean=sign*[0,-5,-10,-14][frame];
  drawUpperBase(ctx,source,sourceName,bx,y,{dx:torsoDx,dy:torsoDy,rotation:torsoLean,upperH:78});
  const hip=[bx+48+torsoDx-sign*[0,1,3,5][frame],y+79+torsoDy];
  ctx.fillStyle=P.outline; ctx.fillRect(hip[0]-11,hip[1]-5,22,16);
  ctx.fillStyle=P.ivory; ctx.fillRect(hip[0]-9,hip[1]-3,18,12);
  ctx.fillStyle=P.rust; ctx.fillRect(useRight?hip[0]-9:hip[0]+6,hip[1]-3,3,12);
  const reach=[0,17,25,32][frame];
  const knee1=[hip[0]+sign*reach,hip[1]+[0,4,5,5][frame]];
  const ankle1=[hip[0]+sign*(reach+[0,8,12,16][frame]),hip[1]+[0,12,14,14][frame]];
  const foot1=[ankle1[0]+sign*[0,8,10,11][frame],ankle1[1]+1];
  const knee2=[hip[0]+sign*Math.max(10,reach-5),hip[1]+[0,8,9,9][frame]];
  const ankle2=[hip[0]+sign*(reach+[0,3,7,10][frame]),hip[1]+[0,17,19,19][frame]];
  const foot2=[ankle2[0]+sign*[0,7,9,10][frame],ankle2[1]+2];
  drawSlideLimb(ctx,hip,knee2,ankle2,foot2,false);
  drawSlideLimb(ctx,[hip[0]+sign*2,hip[1]-2],knee1,ankle1,foot1,true);
  pixelBall(ctx,bx+(useRight?57:39)+torsoDx-sign*[0,0,2,3][frame],y+67+torsoDy);
}

function buildAnimationAtlas(source){
  const canvas=document.createElement('canvas'); canvas.width=FRAME_W*DIRS.length; canvas.height=FRAME_H*ROWS;
  const ctx=canvas.getContext('2d',{alpha:true}); ctx.imageSmoothingEnabled=false;
  for(let dirIdx=0;dirIdx<DIRS.length;dirIdx++){
    const direction=DIRS[dirIdx],bx=dirIdx*FRAME_W;
    for(let f=0;f<2;f++){
      const y=(ROW_START.idle+f)*FRAME_H; drawBase(ctx,source,direction,bx,y,{dy:f?-1:0});
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX,y+ballY+(f?-1:0));
    }
    const drop=[{dx:0,dy:0,sx:1,sy:1},{dx:-1,dy:-2,sx:1.01,sy:.99},{dx:1,dy:0,sx:.99,sy:1.01},{dx:0,dy:-1,sx:1,sy:1}];
    for(let f=0;f<4;f++){
      const y=(ROW_START.dropback+f)*FRAME_H,p=drop[f]; drawBase(ctx,source,direction,bx,y,p);
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX+p.dx,y+ballY+p.dy);
    }
    const run=[{dx:-1,dy:0,sx:1,sy:1},{dx:-2,dy:-4,sx:1.04,sy:.96},{dx:-1,dy:-1,sx:.99,sy:1.01},{dx:1,dy:0,sx:1,sy:1},{dx:2,dy:-4,sx:1.04,sy:.96},{dx:1,dy:-1,sx:.99,sy:1.01}];
    for(let f=0;f<6;f++){
      const y=(ROW_START.run+f)*FRAME_H,p=run[f]; drawBase(ctx,source,direction,bx,y,p);
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX+p.dx,y+ballY+p.dy);
    }
    for(let f=0;f<4;f++){
      const y=(ROW_START.aim+f)*FRAME_H,sourceName=aimSourceDirection(direction,f);
      drawThrowComposite(ctx,source,direction,bx,y,sourceName,f,{dx:[0,1,2,3][f],dy:[0,-1,-2,-3][f],sx:[1,1.01,1.03,1.04][f],sy:[1,1,.99,.98][f],rotation:[0,1,2,3][f]});
    }
    const releaseStages=[3,4,5];
    for(let f=0;f<3;f++){
      const y=(ROW_START.throw+f)*FRAME_H,sourceName=releaseSourceDirection(direction,f);
      drawThrowComposite(ctx,source,direction,bx,y,sourceName,releaseStages[f],{dx:[3,3,1][f],dy:[-3,-1,0][f],sx:[1.04,1.03,1][f],sy:[.98,1,1][f],rotation:[3,-2,-4][f]});
    }
    for(const action of ['jukeL','jukeR']){
      const left=action==='jukeL',offsets=left?[0,-1,-1,0]:[0,1,1,0],shift=left?[0,-7,-13,-5]:[0,7,13,5],dy=[0,-2,-4,-1];
      for(let f=0;f<4;f++){
        const y=(ROW_START[action]+f)*FRAME_H,sourceName=rotateDirection(direction,offsets[f]);
        drawBase(ctx,source,sourceName,bx,y,{dx:shift[f],dy:dy[f],sx:[1,1.04,1.09,1.02][f],sy:[1,.97,.93,.99][f],rotation:left?[0,-3,-7,-2][f]:[0,3,7,2][f]});
        const [ballX,ballY]=ballPosition(sourceName); pixelBall(ctx,bx+ballX+shift[f],y+ballY+dy[f]);
      }
    }
    for(let f=0;f<4;f++) drawSlideFrame(ctx,source,direction,bx,(ROW_START.slide+f)*FRAME_H,f);
    for(let f=0;f<4;f++){
      const y=(ROW_START.power+f)*FRAME_H,sourceName=['N','NE','NW'].includes(direction)?direction:'N';
      const pose=[{dx:0,dy:0,sx:1,sy:1,rot:0},{dx:1,dy:4,sx:1.11,sy:.92,rot:-2},{dx:3,dy:9,sx:1.23,sy:.82,rot:-5},{dx:1,dy:5,sx:1.12,sy:.90,rot:-2}][f];
      drawBase(ctx,source,sourceName,bx,y,{dx:pose.dx,dy:pose.dy,sx:pose.sx,sy:pose.sy,rotation:pose.rot});
      ctx.save();ctx.translate(bx+pose.dx,y+pose.dy);if(f>0)drawFootballArm(ctx,[66,57],[62,67],[55,70],1,{handBall:true});else pixelBall(ctx,55,70);ctx.restore();
    }
  }
  return canvas;
}
function directionFromVelocity(x,z,fallback='N'){
  const mag=Math.hypot(x,z);if(mag<.12)return fallback;
  const angle=Math.atan2(x,z),oct=Math.round(angle/(Math.PI/4)),index=(oct+8)%8;
  return ['N','NW','W','SW','S','SE','E','NE'][index];
}
function pocketDirection(vx){if(vx>1.1)return'NW';if(vx<-1.1)return'NE';return'N';}
function stabilizeDirection(controller,candidate,dt){
  if(!candidate||candidate===controller.direction){controller.pendingDirection=null;controller.pendingDirectionTime=0;return controller.direction||candidate||'N';}
  if(candidate!==controller.pendingDirection){controller.pendingDirection=candidate;controller.pendingDirectionTime=0;}else controller.pendingDirectionTime+=dt;
  if(controller.pendingDirectionTime>=.085){controller.pendingDirection=null;controller.pendingDirectionTime=0;return candidate;}
  return controller.direction||'N';
}
function setFrame(controller,action,frame,direction){
  const row=ROW_START[action]+Math.max(0,Math.min(ACTIONS[action]-1,frame));
  controller.texture.repeat.set(1/DIRS.length,1/ROWS);controller.texture.offset.x=dirIndex(direction)/DIRS.length;controller.texture.offset.y=1-((row+1)/ROWS);controller.texture.needsUpdate=true;
}
export function attachPixelQB(qbGroup,fallbackRig){
  const controller={ready:false,failed:false,sprite:null,texture:null,group:qbGroup,fallbackRig,action:'idle',direction:'N',elapsed:0,frame:0,prev:qbGroup.position.clone(),pendingDirection:null,pendingDirectionTime:0,jukeLock:0,jukeAction:null,slideLock:0};
  loadImage(QB_BASE_ATLAS).then(image=>{
    const atlas=buildAnimationAtlas(image),texture=new THREE.CanvasTexture(atlas);
    texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.22,depthWrite:true,depthTest:true,toneMapped:false});
    const sprite=new THREE.Sprite(material);sprite.name='pixel_qb_production_v7';sprite.center.set(.5,0);sprite.position.set(0,.02,0);sprite.scale.set(3.72,4.96,1);sprite.renderOrder=3;qbGroup.add(sprite);
    if(fallbackRig)fallbackRig.visible=false;Object.assign(controller,{ready:true,sprite,texture});setFrame(controller,'idle',0,'N');console.info('[Gridiron Legends] Retro aiming QB sprite v7 active');
  }).catch(error=>{controller.failed=true;if(fallbackRig)fallbackRig.visible=true;console.warn('[Gridiron Legends] Pixel QB failed, using 3D fallback.',error);});
  return controller;
}
export function updatePixelQB(controller,dt,{state,moving=false,aiming=false,throwing=false,sliding=false,power=false}){
  if(!controller?.ready)return;
  const vx=(controller.group.position.x-controller.prev.x)/Math.max(dt,.001),vz=(controller.group.position.z-controller.prev.z)/Math.max(dt,.001);controller.prev.copy(controller.group.position);
  const speed=Math.hypot(vx,vz),lateralBurst=Math.abs(vx)>10.4&&Math.abs(vx)>Math.abs(vz)*1.15;
  controller.jukeLock=Math.max(0,(controller.jukeLock||0)-dt);controller.slideLock=Math.max(0,(controller.slideLock||0)-dt);
  if((state==='SCRAMBLE'||state==='RUN')&&lateralBurst&&controller.jukeLock<=0){controller.jukeAction=vx>0?'jukeL':'jukeR';controller.jukeLock=JUKE_VISUAL_TIME;}
  if(sliding&&controller.slideLock<=0)controller.slideLock=SLIDE_VISUAL_TIME;
  if(state!=='SCRAMBLE'&&state!=='RUN'){controller.jukeLock=0;controller.jukeAction=null;}
  let action='idle';
  if(sliding||controller.slideLock>0)action='slide';
  else if(throwing)action='throw';
  else if(aiming)action='aim';
  else if((state==='SCRAMBLE'||state==='RUN')&&controller.jukeLock>0&&controller.jukeAction)action=controller.jukeAction;
  else if((state==='SCRAMBLE'||state==='RUN')&&power)action='power';
  else if((state==='POCKET'||state==='AIMING')&&(moving||speed>.3))action='dropback';
  else if((state==='SCRAMBLE'||state==='RUN')&&(moving||speed>.3))action='run';
  let direction=controller.direction||'N';
  if(action==='dropback')direction=pocketDirection(vx);
  else if(['jukeL','jukeR','power','aim','throw'].includes(action))direction=['N','NE','NW'].includes(direction)?direction:'N';
  else if(action==='idle'&&state==='PRE_SNAP')direction='N';
  else if(speed>.3)direction=stabilizeDirection(controller,directionFromVelocity(vx,vz,direction),dt);
  const changed=action!==controller.action,directionChanged=direction!==controller.direction;
  if(changed){controller.action=action;controller.elapsed=0;controller.frame=0;}else controller.elapsed+=dt;
  controller.direction=direction;
  const count=ACTIONS[action],looping=['idle','dropback','run','power'].includes(action);
  let frame=Math.floor(controller.elapsed*FPS[action]);frame=looping?frame%count:Math.min(count-1,frame);
  if(changed||directionChanged||frame!==controller.frame){controller.frame=frame;setFrame(controller,action,frame,direction);}
}
