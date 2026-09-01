import * as THREE from 'three';
import { QB_BASE_ATLAS } from './qbSpriteBase.js';

const FRAME_W = 96;
const FRAME_H = 128;
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const ACTIONS = {
  idle: 2,
  dropback: 4,
  run: 6,
  throw: 6,
  jukeL: 4,
  jukeR: 4,
  slide: 4,
  power: 4,
};
const FPS = { idle: 2, dropback: 9, run: 11, throw: 12, jukeL: 16, jukeR: 16, slide: 8, power: 10 };
const ROW_START = {};
let rowCursor = 0;
for (const [action, count] of Object.entries(ACTIONS)) {
  ROW_START[action] = rowCursor;
  rowCursor += count;
}
const ROWS = rowCursor;

const P = {
  outline: '#08090a',
  black: '#17191b',
  blackHi: '#2a2d30',
  rust: '#c54517',
  rustHi: '#e2652d',
  skin: '#b77145',
  skinDark: '#805033',
  white: '#f9f4e4',
  ivory: '#e9dcc3',
  ball: '#86451f',
  steel: '#b9c1c4',
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function dirIndex(direction) {
  return Math.max(0, DIRS.indexOf(direction));
}

function rotateDirection(direction, steps) {
  const i = dirIndex(direction);
  return DIRS[(i + steps + DIRS.length * 4) % DIRS.length];
}

function drawBase(ctx, source, sourceDirIndex, frameX, frameY, { dx=0, dy=0, sx=1, sy=1, rotation=0 } = {}) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(frameX + FRAME_W / 2 + dx, frameY + FRAME_H - 3 + dy);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale(sx, sy);
  ctx.drawImage(source, sourceDirIndex * FRAME_W, 0, FRAME_W, FRAME_H, -FRAME_W / 2, -FRAME_H + 3, FRAME_W, FRAME_H);
  ctx.restore();
}

function pixelBall(ctx, x, y) {
  ctx.fillStyle = P.outline;
  ctx.fillRect(x - 4, y - 2, 9, 5);
  ctx.fillRect(x - 2, y - 4, 5, 9);
  ctx.fillStyle = P.ball;
  ctx.fillRect(x - 3, y - 2, 7, 5);
  ctx.fillRect(x - 1, y - 3, 3, 7);
  ctx.fillStyle = P.white;
  ctx.fillRect(x - 1, y, 3, 1);
}

function ballPosition(direction) {
  return {
    N:[59,69], NE:[57,68], E:[55,69], SE:[54,69],
    S:[47,69], SW:[42,69], W:[40,69], NW:[40,68],
  }[direction] || [48,69];
}

function segmentPolygon(a, b, width) {
  const dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy)||1;
  const px=-dy/len, py=dx/len;
  return [
    [a[0]+px*width/2,a[1]+py*width/2],
    [b[0]+px*width/2,b[1]+py*width/2],
    [b[0]-px*width/2,b[1]-py*width/2],
    [a[0]-px*width/2,a[1]-py*width/2],
  ];
}

function fillPolygon(ctx, points, fill) {
  ctx.fillStyle=fill;
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));
  ctx.closePath();
  ctx.fill();
}

function thickSegment(ctx, a, b, width, fill, outline=3) {
  fillPolygon(ctx, segmentPolygon(a,b,width+outline*2), P.outline);
  fillPolygon(ctx, segmentPolygon(a,b,width), fill);
}

function drawJoint(ctx, x, y, r, fill) {
  ctx.fillStyle=P.outline;
  ctx.fillRect(Math.round(x-r-2),Math.round(y-r-2),Math.round(r*2+4),Math.round(r*2+4));
  ctx.fillStyle=fill;
  ctx.fillRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));
}

function throwSourceDirection(direction, stage) {
  const seq = {
    N:  ['N','NE','NE','NE','N','N'],
    NE: ['NE','NE','E','NE','N','NE'],
    NW: ['NW','N','NE','NE','N','NW'],
  };
  return (seq[direction] || seq.N)[stage];
}

function clearThrowSide(ctx, direction) {
  const regions = {
    N:[62,49,34,51], NE:[58,47,38,53], E:[50,47,46,53],
    NW:[0,47,38,53], W:[0,47,46,53],
  };
  const r=regions[direction] || regions.N;
  ctx.clearRect(...r);
}

function drawShoulderCap(ctx, shoulder, side) {
  const x=Math.round(shoulder[0]), y=Math.round(shoulder[1]);
  ctx.fillStyle=P.outline;
  ctx.fillRect(x-(side<0?8:4),y-8,12,15);
  ctx.fillStyle=P.black;
  ctx.fillRect(x-(side<0?6:3),y-6,9,11);
  ctx.fillStyle=P.rust;
  ctx.fillRect(x-(side<0?7:1),y+3,8,3);
}

function drawFootballArm(ctx, shoulder, elbow, hand, side, { handBall=false } = {}) {
  const sleeveEnd=[
    shoulder[0]+(elbow[0]-shoulder[0])*.42,
    shoulder[1]+(elbow[1]-shoulder[1])*.42,
  ];
  drawShoulderCap(ctx,shoulder,side);
  thickSegment(ctx, shoulder, sleeveEnd, 10, P.black, 3);
  thickSegment(ctx, sleeveEnd, elbow, 8, P.skinDark, 3);
  thickSegment(ctx, elbow, hand, 7, P.skin, 3);

  const wrist=[
    hand[0]+(elbow[0]-hand[0])*.20,
    hand[1]+(elbow[1]-hand[1])*.20,
  ];
  thickSegment(ctx,wrist,hand,7,P.black,2);
  drawJoint(ctx,hand[0],hand[1],3,P.skin);

  if (handBall) pixelBall(ctx,hand[0]+side*2,hand[1]-1);
}

function drawThrowPose(ctx, direction, stage) {
  const backDir=['N','NE','NW'].includes(direction)?direction:'N';
  let shoulder, side=1;
  if (backDir==='NW') { shoulder=[65,56]; side=1; }
  else if (backDir==='NE') { shoulder=[66,56]; side=1; }
  else shoulder=[67,56];

  const poses=[
    {e:[64,67], h:[56,72], ball:true},
    {e:[71,57], h:[78,49], ball:true},
    {e:[72,48], h:[67,37], ball:true},
    {e:[75,48], h:[83,42], ball:true},
    {e:[75,57], h:[88,61], ball:false},
    {e:[67,68], h:[82,76], ball:false},
  ];
  const pose=poses[stage];

  drawFootballArm(ctx,shoulder,pose.e,pose.h,side,{handBall:pose.ball});

  const offShoulder=[29,58];
  const offPoses=[
    {e:[35,68],h:[46,70]},
    {e:[37,65],h:[49,66]},
    {e:[38,64],h:[49,65]},
    {e:[36,66],h:[47,69]},
    {e:[32,70],h:[42,76]},
    {e:[29,73],h:[36,82]},
  ];
  const off=offPoses[stage];
  thickSegment(ctx,offShoulder,[offShoulder[0]+4,offShoulder[1]+5],10,P.black,3);
  thickSegment(ctx,[offShoulder[0]+4,offShoulder[1]+5],off.e,8,P.skinDark,3);
  thickSegment(ctx,off.e,off.h,7,P.skin,3);
}

function runSourceDirection(direction, frame) {
  const offsets=[0,-1,0,1,0,0];
  return rotateDirection(direction,offsets[frame]);
}

function buildAnimationAtlas(source) {
  const canvas=document.createElement('canvas');
  canvas.width=FRAME_W*DIRS.length;
  canvas.height=FRAME_H*ROWS;
  const ctx=canvas.getContext('2d',{alpha:true});
  ctx.imageSmoothingEnabled=false;

  for (let dirIdx=0; dirIdx<DIRS.length; dirIdx++) {
    const direction=DIRS[dirIdx];
    const bx=dirIdx*FRAME_W;

    for (let f=0; f<ACTIONS.idle; f++) {
      const y=(ROW_START.idle+f)*FRAME_H;
      drawBase(ctx,source,dirIdx,bx,y,{dy:f?-1:0});
      const [ballX,ballY]=ballPosition(direction);
      pixelBall(ctx,bx+ballX,y+ballY+(f?-1:0));
    }

    const drop=[
      {dx:0,dy:0,sx:1,sy:1},
      {dx:-1,dy:-2,sx:1.01,sy:.99},
      {dx:1,dy:0,sx:.99,sy:1.01},
      {dx:0,dy:-1,sx:1,sy:1},
    ];
    for (let f=0; f<ACTIONS.dropback; f++) {
      const y=(ROW_START.dropback+f)*FRAME_H,p=drop[f];
      drawBase(ctx,source,dirIdx,bx,y,p);
      const [ballX,ballY]=ballPosition(direction);
      pixelBall(ctx,bx+ballX+p.dx,y+ballY+p.dy);
    }

    const run=[
      {dx:-1,dy:0,sx:1.00,sy:1.00},
      {dx:-2,dy:-3,sx:1.03,sy:.97},
      {dx:0,dy:-1,sx:.99,sy:1.01},
      {dx:2,dy:0,sx:1.00,sy:1.00},
      {dx:2,dy:-3,sx:1.03,sy:.97},
      {dx:0,dy:-1,sx:.99,sy:1.01},
    ];
    for (let f=0; f<ACTIONS.run; f++) {
      const y=(ROW_START.run+f)*FRAME_H,p=run[f];
      const sourceName=runSourceDirection(direction,f);
      drawBase(ctx,source,dirIndex(sourceName),bx,y,p);
      const [ballX,ballY]=ballPosition(sourceName);
      pixelBall(ctx,bx+ballX+p.dx,y+ballY+p.dy);
    }

    for (let f=0; f<ACTIONS.throw; f++) {
      const y=(ROW_START.throw+f)*FRAME_H;
      const sourceName=throwSourceDirection(direction,f);
      drawBase(ctx,source,dirIndex(sourceName),bx,y,{
        dx:[0,0,1,2,2,1][f],
        dy:[0,-1,-1,-2,-1,0][f],
        sx:[1,1.01,1.01,1.02,1.01,1][f],
        rotation:[0,0,1,1,-1,-2][f],
      });
      ctx.save();
      ctx.translate(bx,y);
      clearThrowSide(ctx,sourceName);
      drawThrowPose(ctx,direction,f);
      ctx.restore();
    }

    for (const action of ['jukeL','jukeR']) {
      const left=action==='jukeL';
      const offsets=left?[0,-1,-2,-1]:[0,1,2,1];
      const shift=left?[0,-5,-11,-4]:[0,5,11,4];
      const dy=[0,-1,-3,-1];
      for (let f=0; f<4; f++) {
        const y=(ROW_START[action]+f)*FRAME_H;
        const sourceName=rotateDirection(direction,offsets[f]);
        drawBase(ctx,source,dirIndex(sourceName),bx,y,{
          dx:shift[f],
          dy:dy[f],
          sx:[1,1.02,1.06,1.01][f],
          sy:[1,.99,.96,1][f],
        });
        const [ballX,ballY]=ballPosition(sourceName);
        pixelBall(ctx,bx+ballX+shift[f],y+ballY+dy[f]);
      }
    }

    for (let f=0; f<ACTIONS.slide; f++) {
      const y=(ROW_START.slide+f)*FRAME_H;
      const useRight=!['W','NW','SW'].includes(direction);
      const sourceName=useRight?'E':'W';
      const sign=useRight?1:-1;
      drawBase(ctx,source,dirIndex(sourceName),bx,y,{
        dx:sign*[0,6,12,17][f],
        dy:[1,6,14,22][f],
        sx:[1,.98,.92,.88][f],
        sy:[1,.90,.76,.62][f],
        rotation:sign*[8,22,43,63][f],
      });
      pixelBall(ctx,bx+(useRight?58:38)+sign*[0,4,8,11][f],y+70+[0,3,7,11][f]);
    }

    const powerSource=[direction,rotateDirection(direction,1),rotateDirection(direction,1),direction];
    for (let f=0; f<ACTIONS.power; f++) {
      const y=(ROW_START.power+f)*FRAME_H;
      const sourceName=powerSource[f];
      drawBase(ctx,source,dirIndex(sourceName),bx,y,{
        dx:[0,1,3,1][f],
        dy:[0,1,3,1][f],
        sx:[1,1.05,1.10,1.03][f],
        sy:[1,.98,.94,.99][f],
        rotation:[0,-2,-5,-2][f],
      });
      const [ballX,ballY]=ballPosition(sourceName);
      pixelBall(ctx,bx+ballX+[0,1,3,1][f],y+ballY+[0,1,3,1][f]);
    }
  }
  return canvas;
}

function directionFromVelocity(x,z,fallback='N') {
  const mag=Math.hypot(x,z);
  if (mag<.12) return fallback;
  const angle=Math.atan2(x,z);
  const oct=Math.round(angle/(Math.PI/4));
  const index=(oct+8)%8;
  return ['N','NW','W','SW','S','SE','E','NE'][index];
}

function pocketDirection(vx) {
  if (vx>1.1) return 'NW';
  if (vx<-1.1) return 'NE';
  return 'N';
}

function stabilizeDirection(controller,candidate,dt) {
  if (!candidate || candidate===controller.direction) {
    controller.pendingDirection=null;
    controller.pendingDirectionTime=0;
    return controller.direction || candidate || 'N';
  }
  if (candidate!==controller.pendingDirection) {
    controller.pendingDirection=candidate;
    controller.pendingDirectionTime=0;
  } else {
    controller.pendingDirectionTime+=dt;
  }
  if (controller.pendingDirectionTime>=.085) {
    controller.pendingDirection=null;
    controller.pendingDirectionTime=0;
    return candidate;
  }
  return controller.direction || 'N';
}

function setFrame(controller,action,frame,direction) {
  const dIndex=dirIndex(direction);
  const row=ROW_START[action]+Math.max(0,Math.min(ACTIONS[action]-1,frame));
  controller.texture.repeat.set(1/DIRS.length,1/ROWS);
  controller.texture.offset.x=dIndex/DIRS.length;
  controller.texture.offset.y=1-((row+1)/ROWS);
  controller.texture.needsUpdate=true;
}

export function attachPixelQB(qbGroup,fallbackRig) {
  const controller={
    ready:false,failed:false,sprite:null,texture:null,group:qbGroup,fallbackRig,
    action:'idle',direction:'N',elapsed:0,frame:0,prev:qbGroup.position.clone(),
    pendingDirection:null,pendingDirectionTime:0,
  };
  loadImage(QB_BASE_ATLAS).then((image)=>{
    const atlas=buildAnimationAtlas(image);
    const texture=new THREE.CanvasTexture(atlas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.magFilter=THREE.NearestFilter;
    texture.minFilter=THREE.NearestFilter;
    texture.generateMipmaps=false;
    texture.wrapS=THREE.RepeatWrapping;
    texture.wrapT=THREE.RepeatWrapping;

    const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.22,depthWrite:true,depthTest:true,toneMapped:false});
    const sprite=new THREE.Sprite(material);
    sprite.name='pixel_qb_production_v2';
    sprite.center.set(.5,0);
    sprite.position.set(0,.02,0);
    sprite.scale.set(3.72,4.96,1);
    sprite.renderOrder=3;
    qbGroup.add(sprite);
    if (fallbackRig) fallbackRig.visible=false;

    Object.assign(controller,{ready:true,sprite,texture});
    setFrame(controller,'idle',0,'N');
    console.info('[Gridiron Legends] QB sprite animation rebuild active');
  }).catch((error)=>{
    controller.failed=true;
    if (fallbackRig) fallbackRig.visible=true;
    console.warn('[Gridiron Legends] Pixel QB failed, using 3D fallback.',error);
  });
  return controller;
}

export function updatePixelQB(controller,dt,{state,moving=false,throwing=false,sliding=false,power=false}) {
  if (!controller?.ready) return;
  const vx=(controller.group.position.x-controller.prev.x)/Math.max(dt,.001);
  const vz=(controller.group.position.z-controller.prev.z)/Math.max(dt,.001);
  controller.prev.copy(controller.group.position);
  const speed=Math.hypot(vx,vz);
  const lateralBurst=Math.abs(vx)>10.4 && Math.abs(vx)>Math.abs(vz)*1.15;

  let action='idle';
  if (sliding) action='slide';
  else if (throwing) action='throw';
  else if (state==='SCRAMBLE' && lateralBurst) action=vx>0?'jukeL':'jukeR';
  else if ((state==='SCRAMBLE'||state==='RUN') && power) action='power';
  else if ((state==='POCKET'||state==='AIMING') && (moving||speed>.3)) action='dropback';
  else if ((state==='SCRAMBLE'||state==='RUN') && (moving||speed>.3)) action='run';

  let direction=controller.direction||'N';
  if (action==='dropback') direction=pocketDirection(vx);
  else if (action==='jukeL'||action==='jukeR'||action==='power') {
    direction=['N','NE','NW'].includes(direction)?direction:'N';
  } else if (action==='throw') {
    direction=['N','NE','NW'].includes(direction)?direction:'N';
  } else if (action==='idle' && state==='PRE_SNAP') {
    direction='N';
  } else if (speed>.3) {
    const candidate=directionFromVelocity(vx,vz,direction);
    direction=stabilizeDirection(controller,candidate,dt);
  }

  const changed=action!==controller.action;
  const directionChanged=direction!==controller.direction;
  if (changed) {
    controller.action=action;
    controller.elapsed=0;
    controller.frame=0;
  } else {
    controller.elapsed+=dt;
  }
  controller.direction=direction;

  const count=ACTIONS[action];
  const looping=['idle','dropback','run','power'].includes(action);
  let frame=Math.floor(controller.elapsed*FPS[action]);
  frame=looping?frame%count:Math.min(count-1,frame);
  if (changed||directionChanged||frame!==controller.frame) {
    controller.frame=frame;
    setFrame(controller,action,frame,direction);
  }
}
