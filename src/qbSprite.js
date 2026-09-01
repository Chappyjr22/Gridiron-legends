import * as THREE from 'three';

const FRAME_W = 64;
const FRAME_H = 80;
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
const ROW = { idle:[0], run:[1,2,3,4], throw:[5,6,7,8], slide:[9,10,11] };
const ROWS = 12;

const C = {
  outline:'#08090a', black:'#121416', black2:'#202224', blackHi:'#30312f',
  rust:'#c5461b', rustHi:'#e85d1e', rustDark:'#7e2a12',
  ivory:'#e5d8bb', ivoryHi:'#f5ebd2', ivoryShade:'#bead8e',
  skin:'#b57043', skinHi:'#cd8c56', skinShade:'#854e2f',
  steel:'#c5cbcd', steelDark:'#747c7f', white:'#f5f0e0'
};

function rect(ctx,x1,y1,x2,y2,color){
  const ax=Math.round(Math.min(x1,x2)), ay=Math.round(Math.min(y1,y2));
  const bx=Math.round(Math.max(x1,x2)), by=Math.round(Math.max(y1,y2));
  ctx.fillStyle=color; ctx.fillRect(ax,ay,bx-ax+1,by-ay+1);
}
function poly(ctx,pts,color){
  ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(Math.round(pts[0][0]),Math.round(pts[0][1]));
  for(let i=1;i<pts.length;i++) ctx.lineTo(Math.round(pts[i][0]),Math.round(pts[i][1]));
  ctx.closePath(); ctx.fill();
}
const GLYPH = {1:['010','110','010','010','111'],2:['111','001','111','100','111']};
function digit(ctx,d,x,y,s=2,fill=C.white,outline=C.rust){
  const g=GLYPH[d];
  if(outline){g.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(v==='1')rect(ctx,x+xx*s-1,y+yy*s-1,x+(xx+1)*s,y+(yy+1)*s,outline);}));}
  g.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(v==='1')rect(ctx,x+xx*s,y+yy*s,x+(xx+1)*s-1,y+(yy+1)*s-1,fill);}));
}
function number12(ctx,cx,y,s=2){const w=3*s,gap=s,total=w*2+gap,x=Math.round(cx-total/2);digit(ctx,1,x,y,s);digit(ctx,2,x+w+gap,y,s);}
function helmetLogo(ctx,x,y){
  rect(ctx,x,y,x+1,y+6,C.rust); rect(ctx,x+2,y+5,x+4,y+6,C.rust);
  poly(ctx,[[x+6,y],[x+7,y],[x+9,y+5],[x+11,y],[x+12,y],[x+10,y+7],[x+8,y+7]],C.rust);
}

function drawStraight(ctx,direction,action,frame){
  const front=direction==='S', back=direction==='N';
  const phase=action==='run'?[0,1,0,-1][frame%4]:0;
  const bob=action==='run'&&frame%2?1:0;
  const slide=action==='slide', throwing=action==='throw';
  const torsoTop=slide?38:30+bob, torsoBottom=slide?58:57+bob;

  if(slide){
    rect(ctx,21,57,32,64,C.ivoryShade); rect(ctx,30,58,44,65,C.ivory);
    rect(ctx,18,64,31,68,C.black); rect(ctx,34,65,49,69,C.black);
  }else{
    const l=-phase*2,r=phase*2;
    rect(ctx,21+l,55+bob,30+l,66,C.outline); rect(ctx,22+l,55+bob,29+l,64,C.ivory);
    rect(ctx,34+r,55+bob,43+r,66,C.outline); rect(ctx,35+r,55+bob,42+r,64,C.ivory);
    rect(ctx,22+l,60,24+l,64,C.ivoryHi); rect(ctx,40+r,60,42+r,64,C.ivoryShade);
    rect(ctx,22+l,65,29+l,71,C.outline); rect(ctx,23+l,65,28+l,70,C.black);
    rect(ctx,35+r,65,42+r,71,C.outline); rect(ctx,36+r,65,41+r,70,C.black);
    rect(ctx,20+l,70,30+l,74,C.outline); rect(ctx,21+l,70,29+l,72,C.black2);
    rect(ctx,34+r,70,44+r,74,C.outline); rect(ctx,35+r,70,43+r,72,C.black2);
  }

  poly(ctx,[[14,torsoTop+5],[19,torsoTop],[45,torsoTop],[50,torsoTop+5],[48,torsoTop+14],[45,torsoBottom],[19,torsoBottom],[16,torsoTop+14]],C.outline);
  poly(ctx,[[16,torsoTop+6],[21,torsoTop+2],[43,torsoTop+2],[48,torsoTop+6],[46,torsoTop+14],[44,torsoBottom-2],[20,torsoBottom-2],[18,torsoTop+14]],C.black);
  poly(ctx,[[17,torsoTop+5],[21,torsoTop+1],[28,torsoTop+3],[27,torsoTop+8],[18,torsoTop+10]],C.blackHi);
  poly(ctx,[[47,torsoTop+5],[43,torsoTop+1],[36,torsoTop+3],[37,torsoTop+8],[46,torsoTop+10]],C.black2);
  rect(ctx,16,torsoTop+11,21,torsoTop+14,C.rust); rect(ctx,43,torsoTop+11,48,torsoTop+14,C.rust);
  rect(ctx,19,torsoTop+17,20,torsoBottom-4,C.rustDark); rect(ctx,44,torsoTop+17,45,torsoBottom-4,C.rust);
  rect(ctx,20,torsoBottom-4,44,torsoBottom-1,C.outline); rect(ctx,22,torsoBottom-4,42,torsoBottom-3,C.ivoryShade);
  rect(ctx,30,torsoBottom-4,34,torsoBottom-2,C.black);

  const la=action==='run'?phase*2:0,ra=-la;
  if(throwing){
    rect(ctx,11,torsoTop+13,17,torsoTop+29,C.outline); rect(ctx,12,torsoTop+14,16,torsoTop+27,C.skin);
    if(frame===0){rect(ctx,47,torsoTop+12,53,torsoTop+27,C.outline);rect(ctx,48,torsoTop+13,52,torsoTop+25,C.skin);}
    else if(frame===1){poly(ctx,[[47,torsoTop+12],[52,torsoTop+9],[56,torsoTop+13],[52,torsoTop+20],[48,torsoTop+22]],C.outline);poly(ctx,[[48,torsoTop+13],[52,torsoTop+11],[54,torsoTop+13],[51,torsoTop+19],[49,torsoTop+20]],C.skin);}
    else if(frame===2){poly(ctx,[[46,torsoTop+10],[50,torsoTop+3],[55,torsoTop+5],[55,torsoTop+10],[49,torsoTop+17]],C.outline);poly(ctx,[[47,torsoTop+10],[51,torsoTop+5],[53,torsoTop+6],[53,torsoTop+9],[49,torsoTop+15]],C.skin);}
    else{poly(ctx,[[45,torsoTop+11],[53,torsoTop+9],[58,torsoTop+11],[57,torsoTop+15],[48,torsoTop+17]],C.outline);poly(ctx,[[47,torsoTop+12],[53,torsoTop+11],[56,torsoTop+12],[55,torsoTop+14],[49,torsoTop+15]],C.skin);}
  }else{
    rect(ctx,11+la,torsoTop+12,17+la,torsoTop+29,C.outline); rect(ctx,12+la,torsoTop+13,16+la,torsoTop+27,C.skin);
    rect(ctx,47+ra,torsoTop+12,53+ra,torsoTop+29,C.outline); rect(ctx,48+ra,torsoTop+13,52+ra,torsoTop+27,C.skin);
    rect(ctx,12+la,torsoTop+23,16+la,torsoTop+26,C.black); rect(ctx,48+ra,torsoTop+23,52+ra,torsoTop+26,C.black);
    rect(ctx,11+la,torsoTop+27,17+la,torsoTop+32,C.outline); rect(ctx,12+la,torsoTop+28,16+la,torsoTop+31,C.skinShade);
    rect(ctx,47+ra,torsoTop+27,53+ra,torsoTop+32,C.outline); rect(ctx,48+ra,torsoTop+28,52+ra,torsoTop+31,C.skinShade);
  }

  const hy=14+bob+(slide?5:0);
  rect(ctx,28,hy+15,36,hy+20,C.skinShade);
  poly(ctx,[[20,hy+2],[24,hy-2],[40,hy-2],[45,hy+2],[47,hy+11],[44,hy+19],[20,hy+19],[17,hy+11]],C.outline);
  poly(ctx,[[22,hy+2],[25,hy],[39,hy],[43,hy+3],[44,hy+10],[42,hy+16],[22,hy+16],[20,hy+10]],C.black);
  rect(ctx,24,hy+1,27,hy+3,C.blackHi); rect(ctx,39,hy+3,42,hy+11,C.black2);
  rect(ctx,30,hy,34,hy+16,C.rustDark); rect(ctx,31,hy,33,hy+16,C.rust);
  if(front){
    rect(ctx,23,hy+8,41,hy+16,C.outline); rect(ctx,25,hy+9,39,hy+15,C.skin);
    rect(ctx,27,hy+10,29,hy+11,C.outline); rect(ctx,35,hy+10,37,hy+11,C.outline);
    rect(ctx,21,hy+13,43,hy+15,C.steelDark); rect(ctx,22,hy+13,42,hy+13,C.steel);
    rect(ctx,23,hy+10,25,hy+17,C.steel); rect(ctx,39,hy+10,41,hy+17,C.steel); rect(ctx,24,hy+17,40,hy+18,C.steelDark);
  }else if(back){
    rect(ctx,24,hy+15,40,hy+18,C.black2); number12(ctx,32,hy+12,1);
    rect(ctx,39,torsoBottom-1,44,torsoBottom+8,C.rustDark); rect(ctx,40,torsoBottom,43,torsoBottom+7,C.rust);
  }
  number12(ctx,32,torsoTop+20,2);
}

function drawAngled(ctx,direction,action,frame){
  const front=direction==='SE',phase=action==='run'?[0,1,0,-1][frame%4]:0,bob=action==='run'&&frame%2?1:0;
  const slide=action==='slide',throwing=action==='throw',torsoTop=slide?39:30+bob,torsoBottom=slide?58:57+bob;
  if(slide){
    poly(ctx,[[27,57],[39,58],[50,64],[48,68],[35,65],[23,64]],C.outline);rect(ctx,28,57,38,63,C.ivory);rect(ctx,39,61,49,65,C.ivoryShade);rect(ctx,46,65,56,69,C.black);
  }else{
    const stride=phase*2;
    rect(ctx,27-stride,56,34-stride,66,C.outline);rect(ctx,28-stride,56,33-stride,64,C.ivoryShade);rect(ctx,27-stride,65,33-stride,72,C.black);rect(ctx,24-stride,70,34-stride,74,C.outline);rect(ctx,25-stride,70,33-stride,72,C.black2);
    rect(ctx,37+stride,55,45+stride,66,C.outline);rect(ctx,38+stride,55,44+stride,64,C.ivory);rect(ctx,38+stride,65,44+stride,72,C.black);rect(ctx,37+stride,70,49+stride,74,C.outline);rect(ctx,38+stride,70,48+stride,72,C.black2);
  }
  poly(ctx,[[18,torsoTop+7],[24,torsoTop+1],[42,torsoTop+1],[51,torsoTop+7],[49,torsoTop+15],[44,torsoBottom],[23,torsoBottom],[20,torsoTop+16]],C.outline);
  poly(ctx,[[20,torsoTop+7],[25,torsoTop+3],[40,torsoTop+3],[49,torsoTop+8],[47,torsoTop+14],[43,torsoBottom-2],[25,torsoBottom-2],[22,torsoTop+15]],C.black);
  poly(ctx,[[39,torsoTop+3],[47,torsoTop+5],[51,torsoTop+10],[48,torsoTop+14],[40,torsoTop+10]],C.blackHi);
  rect(ctx,45,torsoTop+11,50,torsoTop+14,C.rust);rect(ctx,24,torsoTop+17,25,torsoBottom-4,C.rustDark);
  rect(ctx,24,torsoBottom-4,44,torsoBottom-1,C.outline);rect(ctx,26,torsoBottom-4,42,torsoBottom-3,C.ivoryShade);
  if(throwing){
    if(frame===0){poly(ctx,[[44,torsoTop+12],[50,torsoTop+13],[53,torsoTop+27],[48,torsoTop+29]],C.outline);poly(ctx,[[45,torsoTop+13],[49,torsoTop+14],[51,torsoTop+25],[49,torsoTop+27]],C.skin);}
    else if(frame===1){poly(ctx,[[43,torsoTop+11],[48,torsoTop+5],[52,torsoTop+6],[53,torsoTop+12],[48,torsoTop+20]],C.outline);poly(ctx,[[44,torsoTop+12],[48,torsoTop+7],[50,torsoTop+8],[51,torsoTop+12],[47,torsoTop+18]],C.skin);}
    else if(frame===2){poly(ctx,[[42,torsoTop+10],[47,torsoTop+1],[52,torsoTop+1],[54,torsoTop+5],[50,torsoTop+13]],C.outline);poly(ctx,[[43,torsoTop+11],[48,torsoTop+3],[50,torsoTop+3],[52,torsoTop+5],[49,torsoTop+12]],C.skin);}
    else{poly(ctx,[[42,torsoTop+12],[52,torsoTop+8],[58,torsoTop+9],[59,torsoTop+13],[49,torsoTop+17]],C.outline);poly(ctx,[[44,torsoTop+12],[52,torsoTop+10],[56,torsoTop+10],[57,torsoTop+12],[49,torsoTop+15]],C.skin);}
    rect(ctx,20,torsoTop+13,25,torsoTop+28,C.outline);rect(ctx,21,torsoTop+14,24,torsoTop+26,C.skinShade);
  }else{
    const s=action==='run'?phase:0;
    rect(ctx,45+s,torsoTop+12,51+s,torsoTop+29,C.outline);rect(ctx,46+s,torsoTop+13,50+s,torsoTop+27,C.skin);rect(ctx,46+s,torsoTop+23,50+s,torsoTop+26,C.black);
    rect(ctx,20-s,torsoTop+13,25-s,torsoTop+28,C.outline);rect(ctx,21-s,torsoTop+14,24-s,torsoTop+26,C.skinShade);
  }
  const hy=14+bob+(slide?5:0);
  rect(ctx,29,hy+15,36,hy+20,C.skinShade);
  poly(ctx,[[19,hy+3],[24,hy-1],[39,hy-1],[47,hy+4],[48,hy+11],[44,hy+17],[23,hy+18],[18,hy+11]],C.outline);
  poly(ctx,[[21,hy+3],[25,hy+1],[38,hy+1],[45,hy+5],[46,hy+10],[42,hy+15],[24,hy+16],[20,hy+10]],C.black);
  poly(ctx,[[34,hy+1],[38,hy+1],[44,hy+5],[45,hy+8],[42,hy+8],[37,hy+4]],C.rust);
  if(front)rect(ctx,39,hy+8,46,hy+15,C.skin);
  rect(ctx,43,hy+12,53,hy+14,C.steelDark);rect(ctx,44,hy+12,52,hy+12,C.steel);rect(ctx,49,hy+9,51,hy+18,C.steel);rect(ctx,43,hy+17,53,hy+18,C.steelDark);
  helmetLogo(ctx,25,hy+6);number12(ctx,34,torsoTop+20,2);rect(ctx,43,57,45,65,C.rust);if(!front)rect(ctx,22,torsoBottom-1,26,torsoBottom+7,C.rust);
}

function drawPlayerFrame(ctx,direction,action,frame){
  ctx.clearRect(0,0,FRAME_W,FRAME_H);
  const mirror=['W','NW','SW'].includes(direction);
  const d=mirror?({W:'E',NW:'NE',SW:'SE'}[direction]):direction;
  ctx.save();if(mirror){ctx.translate(FRAME_W,0);ctx.scale(-1,1);}if(d==='N'||d==='S')drawStraight(ctx,d,action,frame);else drawAngled(ctx,d,action,frame);ctx.restore();
}
function buildAtlas(){
  const canvas=document.createElement('canvas');canvas.width=FRAME_W*DIRS.length;canvas.height=FRAME_H*ROWS;
  const ctx=canvas.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;const rows=[];
  Object.entries(ROW).forEach(([action,list])=>list.forEach((_,frame)=>rows.push([action,frame])));
  rows.forEach(([action,frame],row)=>DIRS.forEach((dir,col)=>{ctx.save();ctx.translate(col*FRAME_W,row*FRAME_H);drawPlayerFrame(ctx,dir,action,frame);ctx.restore();}));return canvas;
}
function directionFromVector(x,z,fallback='N'){
  const mag=Math.hypot(x,z);if(mag<0.08)return fallback;const horizontal=Math.abs(x)>mag*0.38,vertical=Math.abs(z)>mag*0.38;
  if(z>0&&horizontal)return x>0?'NW':'NE';if(z<0&&horizontal)return x>0?'SW':'SE';if(vertical)return z>0?'N':'S';return x>0?'W':'E';
}
function setFrame(c,action,frame,direction){
  const dir=Math.max(0,DIRS.indexOf(direction)),rows=ROW[action]||ROW.idle,row=rows[Math.max(0,Math.min(rows.length-1,frame))];
  c.texture.repeat.set(1/DIRS.length,1/ROWS);c.texture.offset.set(dir/DIRS.length,1-((row+1)/ROWS));c.texture.needsUpdate=true;
}
export function attachPixelQB(qbGroup,fallbackRig){
  const atlas=buildAtlas(),texture=new THREE.CanvasTexture(atlas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:0.4,depthWrite:true,depthTest:true,toneMapped:false});
  const sprite=new THREE.Sprite(material);sprite.name='pixel_qb_v2';sprite.center.set(.5,0);sprite.position.set(0,.02,0);sprite.scale.set(3.35,4.18,1);sprite.renderOrder=3;qbGroup.add(sprite);if(fallbackRig)fallbackRig.visible=false;
  const c={ready:true,sprite,texture,group:qbGroup,fallbackRig,action:'idle',direction:'N',elapsed:0,frame:0,prev:qbGroup.position.clone()};setFrame(c,'idle',0,'N');console.info('[Gridiron Legends] Detailed fixed-grid 64x80 pixel QB active');return c;
}
export function updatePixelQB(c,dt,{state,moveX=null,moveZ=null,throwing=false,sliding=false}){
  if(!c?.ready)return;let vx=moveX,vz=moveZ;if(vx===null||vz===null){vx=(c.group.position.x-c.prev.x)/Math.max(dt,.001);vz=(c.group.position.z-c.prev.z)/Math.max(dt,.001);}c.prev.copy(c.group.position);
  let action='idle';if(sliding)action='slide';else if(throwing)action='throw';else if(state==='SCRAMBLE'||Math.hypot(vx,vz)>.16)action='run';const direction=directionFromVector(vx,vz,c.direction||'N'),changed=action!==c.action,dirChanged=direction!==c.direction;
  if(changed){c.action=action;c.elapsed=0;c.frame=0;}else c.elapsed+=dt;c.direction=direction;const frames=ROW[action];let frame=0;if(action==='run')frame=Math.floor(c.elapsed*10)%frames.length;else if(action==='throw')frame=Math.min(frames.length-1,Math.floor(c.elapsed*9));else if(action==='slide')frame=Math.min(frames.length-1,Math.floor(c.elapsed*7));if(changed||dirChanged||frame!==c.frame){c.frame=frame;setFrame(c,action,frame,direction);}
}
