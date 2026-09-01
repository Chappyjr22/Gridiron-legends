import * as THREE from 'three';

const FRAME_W = 48;
const FRAME_H = 64;
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const ROW = { idle:[0], run:[1,2,3,4], throw:[5,6,7,8], slide:[9,10,11] };
const ROWS = 12;

const C = {
  outline:'#08090a', black:'#151517', black2:'#242326', rust:'#b84621', rust2:'#e05b21',
  ivory:'#eadcbb', ivory2:'#d2c3a5', skin:'#b57748', skin2:'#8f5634', steel:'#aeb2ae', white:'#faf6e5',
};

function rect(ctx,x1,y1,x2,y2,color){ ctx.fillStyle=color; ctx.fillRect(Math.round(x1),Math.round(y1),Math.round(x2-x1+1),Math.round(y2-y1+1)); }
function poly(ctx,points,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(points[0][0],points[0][1]); for(let i=1;i<points.length;i++) ctx.lineTo(points[i][0],points[i][1]); ctx.closePath(); ctx.fill(); }
function tinyNumber(ctx,x,y,scale=1){
  const glyph={1:['010','110','010','010','111'],2:['110','001','010','100','111']};
  const chars=['1','2']; const total=7*scale; const start=Math.round(x-total/2);
  chars.forEach((ch,di)=>glyph[ch].forEach((row,yy)=>[...row].forEach((bit,xx)=>{ if(bit==='1') rect(ctx,start+di*4*scale+xx*scale,y+yy*scale,start+di*4*scale+(xx+1)*scale-1,y+(yy+1)*scale-1,C.white); })));
}

function drawHelmet(ctx,direction,yoff=0){
  const front=['S','SE','SW'].includes(direction), side=['E','W'].includes(direction), right=['E','NE','SE'].includes(direction);
  if(side){
    const hx=right?16:12;
    ctx.fillStyle=C.outline; ctx.beginPath(); ctx.ellipse(hx+10,14+yoff,11,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.black2; ctx.beginPath(); ctx.ellipse(hx+10,14+yoff,9,8,0,0,Math.PI*2); ctx.fill();
    rect(ctx,hx+9,6+yoff,hx+11,21+yoff,C.rust);
    if(right){ rect(ctx,hx+13,11+yoff,hx+18,18+yoff,C.skin); rect(ctx,hx+17,12+yoff,hx+21,14+yoff,C.steel); rect(ctx,hx+17,16+yoff,hx+22,18+yoff,C.steel); }
    else { rect(ctx,hx+2,11+yoff,hx+7,18+yoff,C.skin); rect(ctx,hx-1,12+yoff,hx+3,14+yoff,C.steel); rect(ctx,hx-2,16+yoff,hx+3,18+yoff,C.steel); }
    return;
  }
  ctx.fillStyle=C.outline; ctx.beginPath(); ctx.ellipse(24,14+yoff,11,10.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=C.black2; ctx.beginPath(); ctx.ellipse(24,14+yoff,9,8.5,0,0,Math.PI*2); ctx.fill();
  rect(ctx,23,5+yoff,25,21+yoff,C.rust);
  if(front){
    rect(ctx,18,10+yoff,30,18+yoff,C.skin); rect(ctx,20,12+yoff,22,13+yoff,C.outline); rect(ctx,26,12+yoff,28,13+yoff,C.outline);
    rect(ctx,16,17+yoff,32,19+yoff,C.steel); rect(ctx,17,14+yoff,19,20+yoff,C.steel); rect(ctx,29,14+yoff,31,20+yoff,C.steel);
  } else { rect(ctx,20,17+yoff,28,20+yoff,C.black); tinyNumber(ctx,24,14+yoff,1); }
}

function drawPlayerFrame(ctx,direction,action,frame){
  ctx.clearRect(0,0,FRAME_W,FRAME_H);
  const phase=action==='run'?[0,1,0,-1][frame%4]:0; const yoff=action==='run'?-Math.abs(phase):0;
  const front=['S','SE','SW'].includes(direction), back=['N','NE','NW'].includes(direction), side=['E','W'].includes(direction), right=['E','NE','SE'].includes(direction);

  if(action==='slide'){
    const lean=[0,3,6][Math.min(frame,2)];
    rect(ctx,23+lean,43,29+lean,56,C.ivory); rect(ctx,29+lean,48,42+lean,54,C.ivory); rect(ctx,39+lean,53,46+lean,58,C.outline);
    poly(ctx,[[14+lean,26],[34+lean,26],[38+lean,42],[16+lean,44]],C.black); rect(ctx,14+lean,28,18+lean,39,C.rust);
    ctx.save(); ctx.translate(lean,0); drawHelmet(ctx,'E',0); ctx.restore(); rect(ctx,10+lean,29,16+lean,40,C.skin); return;
  }

  const legShift=action==='run'?phase*2:0;
  if(side){
    const near=right?25:17, far=right?18:24;
    rect(ctx,far,39+yoff,far+6,52+yoff,C.ivory2); rect(ctx,near,39+yoff,near+7,53+yoff,C.ivory);
    rect(ctx,far-legShift,50+yoff,far+5-legShift,59+yoff,C.black); rect(ctx,near+legShift,51+yoff,near+6+legShift,60+yoff,C.black);
  } else {
    const lx=14+legShift, rx=27-legShift;
    rect(ctx,lx,39+yoff,lx+7,53+yoff,C.ivory); rect(ctx,rx,39+yoff,rx+7,53+yoff,C.ivory);
    rect(ctx,lx,50+yoff,lx+7,59+yoff,C.black); rect(ctx,rx,50+yoff,rx+7,59+yoff,C.black);
    rect(ctx,lx,50+yoff,lx+7,52+yoff,C.rust); rect(ctx,rx,50+yoff,rx+7,52+yoff,C.rust);
  }

  if(side){
    poly(ctx,[[15,20+yoff],[32,18+yoff],[35,22+yoff],[33,39+yoff],[17,39+yoff],[14,31+yoff]],C.outline);
    poly(ctx,[[17,21+yoff],[31,20+yoff],[33,23+yoff],[31,38+yoff],[18,38+yoff],[16,30+yoff]],C.black);
    rect(ctx,right?28:12,20+yoff,right?36:20,27+yoff,C.black2); rect(ctx,right?32:13,21+yoff,right?35:16,25+yoff,C.rust);
  } else {
    poly(ctx,[[9,22+yoff],[14,18+yoff],[34,18+yoff],[39,22+yoff],[37,39+yoff],[11,39+yoff]],C.outline);
    poly(ctx,[[11,23+yoff],[15,20+yoff],[33,20+yoff],[37,23+yoff],[35,38+yoff],[13,38+yoff]],C.black);
    rect(ctx,10,21+yoff,17,29+yoff,C.black2); rect(ctx,31,21+yoff,38,29+yoff,C.black2); rect(ctx,11,22+yoff,14,27+yoff,C.rust); rect(ctx,34,22+yoff,37,27+yoff,C.rust);
  }

  rect(ctx,14,37+yoff,34,41+yoff,C.ivory); rect(ctx,14,37+yoff,34,38+yoff,C.rust); rect(ctx,22,38+yoff,26,40+yoff,C.outline);

  if(action==='throw'){
    const p=frame/3;
    if(back){ ctx.strokeStyle=C.skin; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(13,25+yoff); ctx.lineTo(8-2*p,31-15*p+yoff); ctx.stroke(); ctx.beginPath(); ctx.moveTo(35,25+yoff); ctx.lineTo(30,34+yoff); ctx.stroke(); }
    else if(side){ ctx.strokeStyle=C.skin; ctx.lineWidth=5; const sx=right?30:18, ex=right?34+7*p:14-7*p; ctx.beginPath(); ctx.moveTo(sx,24+yoff); ctx.lineTo(ex,29-13*p+yoff); ctx.stroke(); rect(ctx,right?16:28,25+yoff,right?20:32,36+yoff,C.skin); }
    else { ctx.strokeStyle=C.skin; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(35,25+yoff); ctx.lineTo(40+2*p,31-15*p+yoff); ctx.stroke(); ctx.beginPath(); ctx.moveTo(13,25+yoff); ctx.lineTo(18,34+yoff); ctx.stroke(); }
  } else if(side){
    const swing=action==='run'?phase*2:0; rect(ctx,right?31:12,25+yoff-swing,right?36:17,37+yoff-swing,C.skin); rect(ctx,right?13:30,25+yoff+swing,right?18:35,36+yoff+swing,C.skin2);
  } else {
    const swing=action==='run'?phase*2:0; rect(ctx,6,25+yoff-swing,12,38+yoff-swing,C.skin); rect(ctx,36,25+yoff+swing,42,38+yoff+swing,C.skin); rect(ctx,7,34+yoff-swing,12,38+yoff-swing,C.black); rect(ctx,36,34+yoff+swing,41,38+yoff+swing,C.black);
  }

  if(front||back) tinyNumber(ctx,24,26+yoff,2);
  drawHelmet(ctx,direction,yoff);
}

function buildAtlas(){
  const canvas=document.createElement('canvas'); canvas.width=FRAME_W*DIRS.length; canvas.height=FRAME_H*ROWS;
  const ctx=canvas.getContext('2d',{alpha:true}); ctx.imageSmoothingEnabled=false;
  const rows=[]; Object.entries(ROW).forEach(([action,list])=>list.forEach((_,frame)=>rows.push([action,frame])));
  rows.forEach(([action,frame],row)=>DIRS.forEach((dir,col)=>{ ctx.save(); ctx.translate(col*FRAME_W,row*FRAME_H); drawPlayerFrame(ctx,dir,action,frame); ctx.restore(); }));
  return canvas;
}

function directionFromVector(x,z,fallback='N'){
  const mag=Math.hypot(x,z); if(mag<0.08) return fallback;
  const horizontal=Math.abs(x)>mag*0.38, vertical=Math.abs(z)>mag*0.38;
  if(z>0&&horizontal) return x>0?'NW':'NE'; if(z<0&&horizontal) return x>0?'SW':'SE'; if(vertical) return z>0?'N':'S'; return x>0?'W':'E';
}

function setFrame(c,action,frame,direction){
  const dir=Math.max(0,DIRS.indexOf(direction)), rows=ROW[action]||ROW.idle, row=rows[Math.max(0,Math.min(rows.length-1,frame))];
  c.texture.repeat.set(1/DIRS.length,1/ROWS); c.texture.offset.set(dir/DIRS.length,1-((row+1)/ROWS)); c.texture.needsUpdate=true;
}

export function attachPixelQB(qbGroup,fallbackRig){
  const atlas=buildAtlas(); const texture=new THREE.CanvasTexture(atlas);
  texture.colorSpace=THREE.SRGBColorSpace; texture.magFilter=THREE.NearestFilter; texture.minFilter=THREE.NearestFilter; texture.generateMipmaps=false; texture.wrapS=THREE.RepeatWrapping; texture.wrapT=THREE.RepeatWrapping;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:0.4,depthWrite:true,depthTest:true,toneMapped:false});
  const sprite=new THREE.Sprite(material); sprite.name='pixel_qb_v1'; sprite.center.set(.5,0); sprite.position.set(0,.02,0); sprite.scale.set(2.95,3.93,1); sprite.renderOrder=3; qbGroup.add(sprite);
  if(fallbackRig) fallbackRig.visible=false;
  const c={ready:true,sprite,texture,group:qbGroup,fallbackRig,action:'idle',direction:'N',elapsed:0,frame:0,prev:qbGroup.position.clone()}; setFrame(c,'idle',0,'N');
  console.info('[Gridiron Legends] Fixed-grid 48x64 pixel QB active'); return c;
}

export function updatePixelQB(c,dt,{state,moveX=null,moveZ=null,throwing=false,sliding=false}){
  if(!c?.ready)return;
  let vx=moveX,vz=moveZ; if(vx===null||vz===null){ vx=(c.group.position.x-c.prev.x)/Math.max(dt,.001); vz=(c.group.position.z-c.prev.z)/Math.max(dt,.001); } c.prev.copy(c.group.position);
  let action='idle'; if(sliding)action='slide'; else if(throwing)action='throw'; else if(state==='SCRAMBLE'||Math.hypot(vx,vz)>.16)action='run';
  const direction=directionFromVector(vx,vz,c.direction||'N'), changed=action!==c.action, dirChanged=direction!==c.direction;
  if(changed){c.action=action;c.elapsed=0;c.frame=0;}else c.elapsed+=dt; c.direction=direction;
  const frames=ROW[action]; let frame=0; if(action==='run')frame=Math.floor(c.elapsed*10)%frames.length; else if(action==='throw')frame=Math.min(frames.length-1,Math.floor(c.elapsed*9)); else if(action==='slide')frame=Math.min(frames.length-1,Math.floor(c.elapsed*7));
  if(changed||dirChanged||frame!==c.frame){c.frame=frame;setFrame(c,action,frame,direction);}
}
