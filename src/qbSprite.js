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
  power: 3,
};
const FPS = { idle: 2, dropback: 8, run: 10, throw: 11, jukeL: 14, jukeR: 14, slide: 7, power: 9 };
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
  rust: '#c54517',
  skin: '#b77145',
  skinDark: '#805033',
  white: '#f9f4e4',
  ball: '#86451f',
  ballDark: '#542a16',
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

function drawBase(ctx, source, dirIndex, frameX, frameY, { dx=0, dy=0, sx=1, sy=1, rotation=0 } = {}) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(frameX + FRAME_W / 2 + dx, frameY + FRAME_H - 3 + dy);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale(sx, sy);
  ctx.drawImage(source, dirIndex * FRAME_W, 0, FRAME_W, FRAME_H, -FRAME_W / 2, -FRAME_H + 3, FRAME_W, FRAME_H);
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
    N:[60,67], NE:[57,66], E:[56,67], SE:[55,67],
    S:[47,68], SW:[41,67], W:[40,67], NW:[39,66],
  }[direction] || [48,67];
}

function thickSegment(ctx, a, b, width, fill) {
  const dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy)||1;
  const px=-dy/len, py=dx/len;
  const polygon=(w)=>[
    [a[0]+px*w/2,a[1]+py*w/2], [b[0]+px*w/2,b[1]+py*w/2],
    [b[0]-px*w/2,b[1]-py*w/2], [a[0]-px*w/2,a[1]-py*w/2],
  ];
  ctx.fillStyle=P.outline;
  ctx.beginPath();
  polygon(width+4).forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));
  ctx.closePath(); ctx.fill();
  ctx.fillStyle=fill;
  ctx.beginPath();
  polygon(width).forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));
  ctx.closePath(); ctx.fill();
}

function clearThrowArm(ctx, direction) {
  const regions = {
    N:[64,49,32,48], NE:[61,49,35,47], E:[51,48,45,50], SE:[61,49,35,48],
    S:[0,49,35,49], SW:[0,49,36,49], W:[0,48,45,50], NW:[0,49,35,47],
  };
  const r=regions[direction];
  ctx.clearRect(...r);
  ctx.fillStyle=P.black;
  if (direction==='N') ctx.fillRect(61,51,13,12);
  else if (direction==='S') ctx.fillRect(23,51,13,12);
  else if (direction==='E') ctx.fillRect(47,51,14,12);
  else if (direction==='W') ctx.fillRect(35,51,14,12);
  else if (direction==='NE'||direction==='SE') ctx.fillRect(58,51,14,12);
  else ctx.fillRect(24,51,14,12);
  ctx.fillStyle=P.rust;
  if (direction==='S'||direction==='SW'||direction==='W'||direction==='NW') ctx.fillRect(24,59,7,3);
  else ctx.fillRect(64,59,7,3);
}

function drawThrowArm(ctx, direction, stage) {
  const back = ['N','NE','NW'].includes(direction);
  let shoulder, side;
  if (direction==='N') { shoulder=[68,57]; side=1; }
  else if (direction==='NE') { shoulder=[66,57]; side=1; }
  else if (direction==='NW') { shoulder=[30,57]; side=-1; }
  else if (direction==='S') { shoulder=[28,57]; side=-1; }
  else if (direction==='SE') { shoulder=[67,57]; side=1; }
  else if (direction==='SW') { shoulder=[29,57]; side=-1; }
  else if (direction==='E') { shoulder=[55,56]; side=1; }
  else { shoulder=[41,56]; side=-1; }

  const poses = [
    [[3,10],[5,24]],
    [[6,-2],[14,-7]],
    [[6,-8],[11,-19]],
    [[5,-9],[19,-15]],
    [[4,-1],[23,4]],
    [[-2,5],[17,12]],
  ];
  const [e,h]=poses[stage];
  const elbow=[shoulder[0]+e[0]*side, shoulder[1]+e[1]];
  const hand=[shoulder[0]+h[0]*side, shoulder[1]+h[1]];
  thickSegment(ctx,shoulder,elbow,8,P.skin);
  thickSegment(ctx,elbow,hand,7,P.skin);
  ctx.fillStyle=P.white;
  ctx.fillRect(hand[0]-3,hand[1]-2,7,4);

  const offSide=-side;
  const offShoulder=[48+18*offSide,58];
  const offElbow=[48+10*offSide,70];
  const offHand=[48+4*offSide,72];
  thickSegment(ctx,offShoulder,offElbow,7,P.skinDark);
  thickSegment(ctx,offElbow,offHand,6,P.skin);

  if (stage < 4) pixelBall(ctx,48+2*side,69);
  if (back && stage===5) ctx.fillStyle=P.rust;
}

function buildAnimationAtlas(source) {
  const canvas=document.createElement('canvas');
  canvas.width=FRAME_W*DIRS.length;
  canvas.height=FRAME_H*ROWS;
  const ctx=canvas.getContext('2d',{alpha:true});
  ctx.imageSmoothingEnabled=false;

  for (let dirIndex=0; dirIndex<DIRS.length; dirIndex++) {
    const direction=DIRS[dirIndex];
    const bx=dirIndex*FRAME_W;

    for (let f=0; f<ACTIONS.idle; f++) {
      const y=(ROW_START.idle+f)*FRAME_H;
      drawBase(ctx,source,dirIndex,bx,y,{dy:f?-1:0});
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX,y+ballY+(f?-1:0));
    }

    const drop=[[0,0],[-1,-1],[1,0],[0,-1]];
    for (let f=0; f<ACTIONS.dropback; f++) {
      const y=(ROW_START.dropback+f)*FRAME_H,[dx,dy]=drop[f];
      drawBase(ctx,source,dirIndex,bx,y,{dx,dy});
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX,y+ballY+dy);
    }

    const run=[[-2,0,1,1],[-1,-2,1.02,.99],[1,-1,1,1.01],[2,0,.98,1],[1,-2,1.01,.99],[-1,-1,1,1.01]];
    for (let f=0; f<ACTIONS.run; f++) {
      const y=(ROW_START.run+f)*FRAME_H,[dx,dy,sx,sy]=run[f];
      drawBase(ctx,source,dirIndex,bx,y,{dx,dy,sx,sy});
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX+Math.round(dx/2),y+ballY+dy);
    }

    for (let f=0; f<ACTIONS.throw; f++) {
      const y=(ROW_START.throw+f)*FRAME_H;
      drawBase(ctx,source,dirIndex,bx,y,{dx:[0,0,1,1,2,2][f],rotation:[0,1,2,1,-1,-2][f]});
      ctx.save(); ctx.translate(bx,y); clearThrowArm(ctx,direction); drawThrowArm(ctx,direction,f); ctx.restore();
    }

    for (const action of ['jukeL','jukeR']) {
      const left=action==='jukeL';
      const shift=left?[0,-2,-6,-3]:[0,2,6,3];
      const rotation=left?[0,1,4,2]:[0,-1,-4,-2];
      for (let f=0; f<4; f++) {
        const y=(ROW_START[action]+f)*FRAME_H;
        drawBase(ctx,source,dirIndex,bx,y,{dx:shift[f],rotation:rotation[f]});
        const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX+shift[f],y+ballY);
      }
    }

    for (let f=0; f<ACTIONS.slide; f++) {
      const y=(ROW_START.slide+f)*FRAME_H;
      const useRight=!['W','NW','SW'].includes(direction);
      const sourceDir=useRight?DIRS.indexOf('E'):DIRS.indexOf('W');
      drawBase(ctx,source,sourceDir,bx,y,{dx:(useRight?1:-1)*[0,5,9,12][f],dy:4+f*3,sy:[.96,.88,.80,.76][f],rotation:(useRight?-1:1)*[10,22,31,35][f]});
      pixelBall(ctx,bx+(useRight?58:38)+(useRight?1:-1)*[0,4,8,10][f],y+70+f*2);
    }

    for (let f=0; f<ACTIONS.power; f++) {
      const y=(ROW_START.power+f)*FRAME_H;
      drawBase(ctx,source,dirIndex,bx,y,{sx:[1,1.04,1.07][f],rotation:[0,-2,-4][f],dx:[0,1,2][f]});
      const [ballX,ballY]=ballPosition(direction); pixelBall(ctx,bx+ballX,y+ballY);
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

function setFrame(controller,action,frame,direction) {
  const dirIndex=Math.max(0,DIRS.indexOf(direction));
  const row=ROW_START[action]+Math.max(0,Math.min(ACTIONS[action]-1,frame));
  controller.texture.repeat.set(1/DIRS.length,1/ROWS);
  controller.texture.offset.x=dirIndex/DIRS.length;
  controller.texture.offset.y=1-((row+1)/ROWS);
  controller.texture.needsUpdate=true;
}

function makeShadow() {
  const canvas=document.createElement('canvas'); canvas.width=16; canvas.height=8;
  const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='rgba(0,0,0,.36)';
  ctx.fillRect(3,2,10,4); ctx.fillRect(5,1,6,6); ctx.fillRect(1,3,14,2);
  const tex=new THREE.CanvasTexture(canvas); tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter; tex.generateMipmaps=false;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.72),mat);
  shadow.rotation.x=-Math.PI/2; shadow.position.y=.018; shadow.renderOrder=1;
  return shadow;
}

export function attachPixelQB(qbGroup,fallbackRig) {
  const controller={ready:false,failed:false,sprite:null,texture:null,group:qbGroup,fallbackRig,action:'idle',direction:'N',elapsed:0,frame:0,prev:qbGroup.position.clone()};
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
    sprite.name='pixel_qb_production_v1';
    sprite.center.set(.5,0);
    sprite.position.set(0,.02,0);
    sprite.scale.set(3.72,4.96,1);
    sprite.renderOrder=3;
    qbGroup.add(makeShadow());
    qbGroup.add(sprite);
    if (fallbackRig) fallbackRig.visible=false;

    Object.assign(controller,{ready:true,sprite,texture});
    setFrame(controller,'idle',0,'N');
    console.info('[Gridiron Legends] Reference-derived 96x128 QB sprite active');
  }).catch((error)=>{
    controller.failed=true;
    if (fallbackRig) fallbackRig.visible=true;
    console.warn('[Gridiron Legends] Pixel QB failed, using 3D fallback.',error);
  });
  return controller;
}

export function updatePixelQB(controller,dt,{state,moving=false,throwing=false,sliding=false}) {
  if (!controller?.ready) return;
  const vx=(controller.group.position.x-controller.prev.x)/Math.max(dt,.001);
  const vz=(controller.group.position.z-controller.prev.z)/Math.max(dt,.001);
  controller.prev.copy(controller.group.position);
  const speed=Math.hypot(vx,vz);
  const lateralBurst=Math.abs(vx)>10.4 && Math.abs(vx)>Math.abs(vz)*1.15;

  let action='idle';
  if (sliding) action='slide';
  else if (throwing) action='throw';
  else if ((state==='POCKET'||state==='AIMING') && (moving||speed>.3)) action='dropback';
  else if (state==='SCRAMBLE' && lateralBurst) action=vx>0?'jukeL':'jukeR';
  else if (state==='SCRAMBLE' && (moving||speed>.3)) action='run';

  let direction=controller.direction||'N';
  if (action==='dropback') direction=pocketDirection(vx);
  else if (action==='jukeL'||action==='jukeR') direction='N';
  else if (action==='throw') direction=['N','NE','NW'].includes(direction)?direction:'N';
  else if (action==='idle' && state==='PRE_SNAP') direction='N';
  else if (speed>.3) direction=directionFromVelocity(vx,vz,direction);

  const changed=action!==controller.action;
  const directionChanged=direction!==controller.direction;
  if (changed) { controller.action=action; controller.elapsed=0; controller.frame=0; }
  else controller.elapsed+=dt;
  controller.direction=direction;

  const count=ACTIONS[action];
  const looping=['idle','dropback','run'].includes(action);
  let frame=Math.floor(controller.elapsed*FPS[action]);
  frame=looping?frame%count:Math.min(count-1,frame);
  if (changed||directionChanged||frame!==controller.frame) {
    controller.frame=frame;
    setFrame(controller,action,frame,direction);
  }
}
