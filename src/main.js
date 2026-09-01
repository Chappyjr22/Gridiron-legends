import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const ui = {
  viewport: $('#viewport'), snap: $('#snapBtn'), tuck: $('#tuckBtn'), slide: $('#slideBtn'), power: $('#powerBtn'),
  statusTitle: $('#statusTitle'), statusText: $('#statusText'), hint: $('#targetHint'), playClock: $('#playClock'),
  down: $('#downDistance'), spot: $('#ballSpot'), stick: $('#stick'), knob: $('#stickKnob'), score: $('#homeScore'),
  badges: { Y: $('.badge-y'), X: $('.badge-x'), A: $('.badge-a'), B: $('.badge-b') }
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const FIELD_W=53.3, LOS=-8, END=72;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x071018);
scene.fog=new THREE.Fog(0x071018,80,180);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,300);
camera.position.set(0,14.2,-33.5);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.BasicShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
ui.viewport.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc8ddf2,0x11140f,1.8));
const sun=new THREE.DirectionalLight(0xffefc7,2.2); sun.position.set(-35,55,-30); sun.castShadow=true; scene.add(sun);

const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.84,metalness:.02});
const M={turf:material(0x365f31),turf2:material(0x31582d),white:material(0xeee7d5),black:material(0x111317),
  lv:material(0x151515),rust:material(0xa53d22),den:material(0x1f503b),skin:material(0xc78c63),ball:material(0x73411f),concrete:material(0x34393d)};
function mesh(g,m,x=0,y=0,z=0,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}

function field(){
  for(let i=0;i<12;i++) mesh(new THREE.BoxGeometry(FIELD_W,.18,10),i%2?M.turf:M.turf2,0,-.12,-28+i*10);
  mesh(new THREE.BoxGeometry(.25,.04,120),M.white,-FIELD_W/2,.03,27);
  mesh(new THREE.BoxGeometry(.25,.04,120),M.white, FIELD_W/2,.03,27);
  for(let z=-28;z<=82;z+=10){
    mesh(new THREE.BoxGeometry(FIELD_W,.035,.18),M.white,0,.04,z);
    for(const x of [-8.5,8.5]) mesh(new THREE.BoxGeometry(.18,.04,1.2),M.white,x,.05,z+5);
  }
  mesh(new THREE.BoxGeometry(FIELD_W,.05,10),M.black,0,.02,77);
  const los=mesh(new THREE.BoxGeometry(FIELD_W,.04,.35),new THREE.MeshBasicMaterial({color:0x274cb4,transparent:true,opacity:.88}),0,.07,LOS);
  const first=mesh(new THREE.BoxGeometry(FIELD_W,.04,.35),new THREE.MeshBasicMaterial({color:0xe4b12f,transparent:true,opacity:.9}),0,.075,2);
  const goal=material(0xe2c027); mesh(new THREE.CylinderGeometry(.13,.13,9,8),goal,0,4.5,85); mesh(new THREE.BoxGeometry(12,.22,.22),goal,0,8.5,85);
  mesh(new THREE.CylinderGeometry(.11,.11,7,8),goal,-6,12,85); mesh(new THREE.CylinderGeometry(.11,.11,7,8),goal,6,12,85);
  mesh(new THREE.BoxGeometry(11,13,125),M.concrete,-34,6,27); mesh(new THREE.BoxGeometry(11,13,125),M.concrete,34,6,27);
  mesh(new THREE.BoxGeometry(70,12,10),M.concrete,0,6,94);
  for(const side of [-1,1]) for(let row=0;row<5;row++) mesh(new THREE.BoxGeometry(5.4,.9,118),material(row%2?0x1c2329:0x212931),side*(29.5+row*1.25),3+row*1.3,27);
}
field();

function player({team='LV',number='00',x=0,z=0,scale=1,role=''}){
  const g=new THREE.Group(); g.position.set(x,0,z); g.userData={number,role}; scene.add(g);
  const jersey=team==='LV'?M.lv:M.white, accent=team==='LV'?M.rust:M.den;
  mesh(new THREE.BoxGeometry(1.35,1.55,.75),jersey,0,2.35,0,g);
  mesh(new THREE.BoxGeometry(1.7,.42,.88),jersey,0,3.02,0,g);
  mesh(new THREE.SphereGeometry(.44,9,6),M.skin,0,3.65,0,g);
  const helmet=mesh(new THREE.SphereGeometry(.5,9,6,0,Math.PI*2,0,Math.PI*.63),accent,0,3.76,-.02,g); helmet.scale.z=1.08;
  for(const sx of [-.48,.48]){const a=mesh(new THREE.BoxGeometry(.32,1.25,.32),M.skin,sx,2.25,0,g);a.rotation.z=sx>0?-.1:.1;}
  for(const sx of [-.34,.34]){mesh(new THREE.BoxGeometry(.42,1.45,.46),jersey,sx,1,0,g);mesh(new THREE.BoxGeometry(.46,.28,.68),accent,sx,.19,.05,g);}
  g.scale.setScalar(scale); return g;
}
const offense={
  qb:player({number:'12',x:0,z:-15,role:'QB'}), rb:player({number:'28',x:5.2,z:-17.5,role:'RB'}),
  Y:player({number:'87',x:-19,z:-7,role:'Y'}), X:player({number:'1',x:-10.5,z:-7,role:'X'}),
  A:player({number:'9',x:10.5,z:-7,role:'A'}), B:player({number:'88',x:19,z:-7,role:'B'})
};
[-6,-3,0,3,6].forEach((x,i)=>player({number:String(70+i),x,z:-9.3,scale:1.08,role:'OL'}));
const defStart=[[-18,-1],[-9,0],[0,1],[9,0],[18,-1],[-12,8],[0,10],[12,8],[-18,18],[18,18],[0,24]];
const defense=defStart.map(([x,z],i)=>player({team:'DEN',number:String(20+i),x,z,scale:i<5?1.07:.98,role:'DEF'}));
const routes={
  Y:[[-19,-7],[-17,4],[-10,14],[-4,24]], X:[[-10.5,-7],[-10,6],[-10,22],[-9,38]],
  A:[[10.5,-7],[10.5,7],[16,11],[22,12]], B:[[19,-7],[19,8],[18,24],[16,42]]
};
const routeVec=(key)=>routes[key].map(([x,z])=>new THREE.Vector3(x,0,z));
function routePoint(key,d){const pts=routeVec(key);for(let i=0;i<pts.length-1;i++){const len=pts[i].distanceTo(pts[i+1]);if(d<=len)return pts[i].clone().lerp(pts[i+1],d/len);d-=len;}const a=pts.at(-2),b=pts.at(-1),dir=b.clone().sub(a).normalize();return b.clone().addScaledVector(dir,d);}

const football=new THREE.Group();const ball=mesh(new THREE.SphereGeometry(.34,9,6),M.ball,0,0,0,football);ball.scale.set(1,.7,1.55);football.visible=false;scene.add(football);
const aimLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xf3e4b6,dashSize:.75,gapSize:.55}));aimLine.visible=false;scene.add(aimLine);
const ring=mesh(new THREE.RingGeometry(1.6,2.15,24),new THREE.MeshBasicMaterial({color:0xe0b02f,side:THREE.DoubleSide,transparent:true,opacity:.85}),0,.08,0);ring.rotation.x=-Math.PI/2;ring.visible=false;

let state='PRE_SNAP', controlled=offense.qb, routeTime=0, aim=null, flight=null, down=1, toGo=10, firstDownZ=2, ballSpot=28, playClock=14, clockAcc=0, last=performance.now(), slideTime=0, powerHeld=false;
const keys=new Set(), stickMove={x:0,z:0}; let stickId=null;
const ord=(n)=>['','1ST','2ND','3RD','4TH'][n]||`${n}TH`;
function status(a,b){ui.statusTitle.textContent=a;ui.statusText.textContent=b;}
function setState(s){state=s;ui.snap.disabled=s!=='PRE_SNAP';ui.tuck.disabled=!['POCKET','AIMING'].includes(s);ui.slide.disabled=s!=='SCRAMBLE';ui.power.disabled=!['SCRAMBLE','RUN'].includes(s);ui.hint.style.display=['POCKET','AIMING'].includes(s)?'block':'none';}
function reset(msg='Press SNAP to start the play'){
  setState('PRE_SNAP');controlled=offense.qb;offense.qb.position.set(0,0,-15);offense.rb.position.set(5.2,0,-17.5);
  for(const k of ['Y','X','A','B']){const [x,z]=routes[k][0];offense[k].position.set(x,0,z);offense[k].rotation.set(0,0,0);}
  defense.forEach((d,i)=>d.position.set(defStart[i][0],0,defStart[i][1]));football.visible=false;aimLine.visible=false;ring.visible=false;aim=flight=null;slideTime=0;powerHeld=false;playClock=14;status('READY',msg);
}
function snap(){if(state!=='PRE_SNAP')return;routeTime=0;setState('POCKET');status('BALL LIVE','Move in the pocket, pull back to aim, release to throw');}
function arc(a,b,lift){const pts=[];for(let i=0;i<=28;i++){const t=i/28,p=a.clone().lerp(b,t);p.y+=Math.sin(Math.PI*t)*lift;pts.push(p);}return pts;}
function beginAim(x,y){if(state!=='POCKET')return;aim={sx:x,sy:y,target:null,power:0,lift:0};setState('AIMING');updateAim(x,y);}
function updateAim(x,y){if(!aim)return;const dx=x-aim.sx,dy=y-aim.sy,p=clamp(Math.hypot(dx,dy)/220,.12,1),side=clamp(dx/185,-1,1),q=offense.qb.position;
  aim.target=new THREE.Vector3(clamp(q.x+side*18,-24,24),.7,clamp(q.z+lerp(12,46,p),q.z+8,67));aim.power=p;aim.lift=lerp(3.5,11,p);
  const start=q.clone().add(new THREE.Vector3(0,3,.5));aimLine.geometry.setFromPoints(arc(start,aim.target.clone(),aim.lift));aimLine.computeLineDistances();aimLine.visible=true;ring.position.copy(aim.target);ring.visible=true;}
function throwBall(){if(state!=='AIMING'||!aim?.target){aimLine.visible=ring.visible=false;aim=null;if(state==='AIMING')setState('POCKET');return;}
  const start=offense.qb.position.clone().add(new THREE.Vector3(0,3,.5)),end=aim.target.clone().setY(1.35);flight={t:0,duration:clamp(start.distanceTo(end)/34,.58,1.45),start,end,lift:aim.lift};
  football.position.copy(start);football.visible=true;aimLine.visible=ring.visible=false;aim=null;setState('BALL');status('PASS AWAY','Lead the receiver into space');}
function tuck(){if(!['POCKET','AIMING'].includes(state))return;aimLine.visible=ring.visible=false;aim=null;controlled=offense.qb;setState('SCRAMBLE');status('SCRAMBLE','QB has tucked the ball');}
function slide(){if(state!=='SCRAMBLE'||slideTime>0)return;slideTime=.65;status('SLIDE','QB gives himself up');}

ui.snap.addEventListener('click',snap);ui.tuck.addEventListener('click',tuck);ui.slide.addEventListener('click',slide);
ui.power.addEventListener('pointerdown',()=>{powerHeld=true;status('POWER MOVE','Truck / stiff-arm window active');});
for(const e of ['pointerup','pointercancel','pointerleave'])ui.power.addEventListener(e,()=>powerHeld=false);
addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();snap();}if(e.code==='KeyR')tuck();if(e.code.startsWith('Shift'))slide();});addEventListener('keyup',e=>keys.delete(e.code));
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;beginAim(e.clientX,e.clientY);});
renderer.domElement.addEventListener('pointermove',e=>{if(state==='AIMING')updateAim(e.clientX,e.clientY);});renderer.domElement.addEventListener('pointerup',throwBall);renderer.domElement.addEventListener('pointercancel',throwBall);
function stickUpdate(e){const r=ui.stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;let dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy);if(m>max){dx=dx/m*max;dy=dy/m*max;}ui.knob.style.transform=`translate(${dx}px,${dy}px)`;stickMove.x=-dx/max;stickMove.z=-dy/max;}
ui.stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;ui.stick.setPointerCapture(e.pointerId);stickUpdate(e);});ui.stick.addEventListener('pointermove',e=>{if(stickId===e.pointerId)stickUpdate(e);});
function stickEnd(e){if(stickId!==e.pointerId)return;stickId=null;stickMove.x=stickMove.z=0;ui.knob.style.transform='translate(0,0)';}ui.stick.addEventListener('pointerup',stickEnd);ui.stick.addEventListener('pointercancel',stickEnd);
function input(){let x=stickMove.x,z=stickMove.z;if(keys.has('KeyA')||keys.has('ArrowLeft'))x++;if(keys.has('KeyD')||keys.has('ArrowRight'))x--;if(keys.has('KeyW')||keys.has('ArrowUp'))z++;if(keys.has('KeyS')||keys.has('ArrowDown'))z--;const l=Math.hypot(x,z);return l>1?{x:x/l,z:z/l}:{x,z};}
function move(dt){if(!['POCKET','AIMING','SCRAMBLE','RUN'].includes(state))return;const v=input(),p=controlled.position,s=['POCKET','AIMING'].includes(state)?5.7:9.5*(powerHeld?.86:1)*(slideTime>0?.2:1);p.x+=v.x*s*dt;p.z+=v.z*s*dt;
  if(controlled===offense.qb&&['POCKET','AIMING'].includes(state)){p.x=clamp(p.x,-9,9);p.z=clamp(p.z,-20,-7.8);}else{p.x=clamp(p.x,-25,25);p.z=clamp(p.z,-24,82);}if(Math.hypot(v.x,v.z)>.1)controlled.rotation.y=Math.atan2(v.x,v.z);}
function receivers(dt){if(!['POCKET','AIMING','BALL'].includes(state))return;routeTime+=dt;for(const k of ['Y','X','A','B']){const old=offense[k].position.clone(),next=routePoint(k,routeTime*8.1);offense[k].position.copy(next);const d=next.clone().sub(old);if(d.lengthSq()>.0001)offense[k].rotation.y=Math.atan2(d.x,d.z);}}
function catchCandidate(pos){let best=null,dist=99;for(const k of ['Y','X','A','B']){const d=offense[k].position.clone().add(new THREE.Vector3(0,2.3,0)).distanceTo(pos);if(d<dist){dist=d;best=offense[k];}}return dist<2.65?best:null;}
function ballFlight(dt){if(state!=='BALL'||!flight)return;flight.t+=dt/flight.duration;const t=clamp(flight.t,0,1),p=flight.start.clone().lerp(flight.end,t);p.y+=Math.sin(Math.PI*t)*flight.lift;football.position.copy(p);football.rotation.x+=dt*12;football.rotation.z+=dt*6;
  const c=t>.38&&catchCandidate(p);if(c){football.visible=false;controlled=c;flight=null;setState('RUN');status('CAUGHT',`#${c.userData.number} has the ball`);return;}if(t>=1){football.visible=false;flight=null;down=down>=4?1:down+1;ui.down.textContent=`${ord(down)} & ${toGo}`;setState('DEAD');status('INCOMPLETE','Pass hits the turf');setTimeout(()=>reset('Incomplete pass. Press SNAP for the next play.'),850);}}
function defenseAI(dt){if(!['SCRAMBLE','RUN'].includes(state))return;let nearest=99;for(const d of defense){const v=controlled.position.clone().sub(d.position),dist=v.length();nearest=Math.min(nearest,dist);if(dist<30){v.y=0;v.normalize();d.position.addScaledVector(v,6.7*dt);d.rotation.y=Math.atan2(v.x,v.z);}}
  if(nearest<1.45&&slideTime<=0){finishRun(false);return;}if(controlled.position.z>=END){ui.score.textContent='24';setState('DEAD');status('TOUCHDOWN','LAS VEGAS OUTLAWS');setTimeout(()=>reset('Touchdown! Prototype drive reset.'),1200);}}
function finishRun(slid){const gained=Math.max(0,Math.round(controlled.position.z-LOS)),first=controlled.position.z>=firstDownZ;if(first){down=1;toGo=10;firstDownZ=controlled.position.z+10;}else{down=Math.min(4,down+1);toGo=Math.max(1,Math.round(firstDownZ-controlled.position.z));}
  ballSpot=clamp(ballSpot+gained,1,99);ui.down.textContent=`${ord(down)} & ${toGo}`;ui.spot.textContent=ballSpot<50?`LV ${ballSpot}`:`DEN ${100-ballSpot}`;setState('DEAD');status(slid?'SLIDE':first?'FIRST DOWN':'TACKLED',`Gain of ${gained} yards`);setTimeout(()=>reset('Next play ready.'),800);}
function cam(dt){const running=['RUN','SCRAMBLE'].includes(state),focus=running?controlled.position:offense.qb.position,desired=running?new THREE.Vector3(focus.x*.16,11.8,focus.z-17.5):new THREE.Vector3(offense.qb.position.x*.12,14.2,offense.qb.position.z-18.5);camera.position.lerp(desired,1-Math.pow(.001,dt));const look=focus.clone().add(new THREE.Vector3(0,2.2,15.5)),q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position,look,new THREE.Vector3(0,1,0)));camera.quaternion.slerp(q,1-Math.pow(.0008,dt));}
function badges(){const show=['PRE_SNAP','POCKET','AIMING','BALL'].includes(state);for(const k of ['Y','X','A','B']){const el=ui.badges[k];el.style.display=show?'grid':'none';if(!show)continue;const p=offense[k].position.clone().add(new THREE.Vector3(0,4.6,0)).project(camera);el.style.left=`${(p.x*.5+.5)*innerWidth}px`;el.style.top=`${(-p.y*.5+.5)*innerHeight}px`;el.style.opacity=p.z>1?'0':'1';}}
function clock(dt){if(state!=='PRE_SNAP')return;clockAcc+=dt;if(clockAcc>=1){clockAcc-=1;playClock=Math.max(0,playClock-1);ui.playClock.textContent=`:${String(playClock).padStart(2,'0')}`;ui.playClock.style.color=playClock<=5?'#ef604a':playClock<=10?'#e8ae4a':'';if(playClock===0){playClock=14;status('DELAY','Play clock expired');}}}
function frame(now){const dt=Math.min(.035,(now-last)/1000||.016);last=now;if(slideTime>0){slideTime-=dt;controlled.rotation.x=lerp(controlled.rotation.x,-1.05,.2);if(slideTime<=0){controlled.rotation.x=0;finishRun(true);}}
  move(dt);receivers(dt);ballFlight(dt);defenseAI(dt);cam(dt);badges();clock(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
reset();