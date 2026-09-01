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
const FIELD_W=53.333, FIELD_L=120, LOS=-8, END=72;
const SKILL_SCALE=.62, LINE_SCALE=.68, DEF_LINE_SCALE=.68;
const PLAYER_HEAD_Y=2.55, CATCH_Y=1.45, THROW_Y=1.78;
const OL_Z=LOS-.32, WIDE_Z=LOS-.24, SLOT_Z=LOS-.82, DL_Z=LOS+.72;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x071018);
scene.fog=new THREE.Fog(0x071018,80,180);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,300);
camera.position.set(0,13.2,-33);
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
  mesh(new THREE.BoxGeometry(.25,.04,FIELD_L),M.white,-FIELD_W/2,.03,27);
  mesh(new THREE.BoxGeometry(.25,.04,FIELD_L),M.white, FIELD_W/2,.03,27);
  for(let z=-28;z<=82;z+=10){
    mesh(new THREE.BoxGeometry(FIELD_W,.035,.18),M.white,0,.04,z);
    for(const x of [-3.08,3.08]) mesh(new THREE.BoxGeometry(.16,.04,1.05),M.white,x,.05,z+5);
  }
  mesh(new THREE.BoxGeometry(FIELD_W,.05,10),M.black,0,.02,77);
  mesh(new THREE.BoxGeometry(FIELD_W,.04,.28),new THREE.MeshBasicMaterial({color:0x274cb4,transparent:true,opacity:.88}),0,.07,LOS);
  mesh(new THREE.BoxGeometry(FIELD_W,.04,.28),new THREE.MeshBasicMaterial({color:0xe4b12f,transparent:true,opacity:.9}),0,.075,2);
  const goal=material(0xe2c027); mesh(new THREE.CylinderGeometry(.11,.11,9,8),goal,0,4.5,85); mesh(new THREE.BoxGeometry(12,.2,.2),goal,0,8.5,85);
  mesh(new THREE.CylinderGeometry(.09,.09,7,8),goal,-6,12,85); mesh(new THREE.CylinderGeometry(.09,.09,7,8),goal,6,12,85);
  mesh(new THREE.BoxGeometry(11,13,125),M.concrete,-34,6,27); mesh(new THREE.BoxGeometry(11,13,125),M.concrete,34,6,27);
  mesh(new THREE.BoxGeometry(70,12,10),M.concrete,0,6,94);
  for(const side of [-1,1]) for(let row=0;row<5;row++) mesh(new THREE.BoxGeometry(5.4,.9,118),material(row%2?0x1c2329:0x212931),side*(29.5+row*1.25),3+row*1.3,27);
}
field();

const allPlayers=[];
function player({team='LV',number='00',x=0,z=0,scale=SKILL_SCALE,role=''}){
  const g=new THREE.Group(); g.position.set(x,0,z); g.userData={number,role,team,stun:0,prev:new THREE.Vector3(x,0,z),phase:Math.random()*Math.PI*2}; scene.add(g); allPlayers.push(g);
  const jersey=team==='LV'?M.lv:M.white, accent=team==='LV'?M.rust:M.den;
  const torso=mesh(new THREE.BoxGeometry(1.35,1.55,.75),jersey,0,2.35,0,g);
  mesh(new THREE.BoxGeometry(1.7,.42,.88),jersey,0,3.02,0,g);
  mesh(new THREE.SphereGeometry(.44,9,6),M.skin,0,3.65,0,g);
  const helmet=mesh(new THREE.SphereGeometry(.5,9,6,0,Math.PI*2,0,Math.PI*.63),accent,0,3.76,-.02,g); helmet.scale.z=1.08;
  const arms=[];
  for(const sx of [-.48,.48]){const a=mesh(new THREE.BoxGeometry(.32,1.25,.32),M.skin,sx,2.25,0,g);a.rotation.z=sx>0?-.1:.1;arms.push(a);}
  const legs=[];
  for(const sx of [-.34,.34]){const leg=mesh(new THREE.BoxGeometry(.42,1.45,.46),jersey,sx,1,0,g);legs.push(leg);mesh(new THREE.BoxGeometry(.46,.28,.68),accent,sx,.19,.05,g);}
  g.userData.limbs={arms,legs,torso}; g.scale.setScalar(scale); return g;
}

const offense={
  qb:player({number:'12',x:0,z:-15,role:'QB'}), rb:player({number:'28',x:4.8,z:-17.2,role:'RB'}),
  Y:player({number:'87',x:-19,z:WIDE_Z,role:'WR'}), X:player({number:'1',x:-10.5,z:SLOT_Z,role:'WR'}),
  A:player({number:'9',x:10.5,z:SLOT_Z,role:'WR'}), B:player({number:'88',x:19,z:WIDE_Z,role:'WR'})
};
const lineX=[-4.6,-2.3,0,2.3,4.6];
const linemen=lineX.map((x,i)=>player({number:String(70+i),x,z:OL_Z,scale:LINE_SCALE,role:'OL'}));

// 4-3 shell. The four down linemen straddle the defensive side of the neutral zone.
const defStart=[
  [-5.35,DL_Z],[-1.8,DL_Z],[1.8,DL_Z],[5.35,DL_Z],
  [-10,4.8],[0,4.2],[10,4.8],
  [-20,1.3],[20,1.3],
  [-8,13.5],[8,13.5]
];
const defense=defStart.map(([x,z],i)=>player({team:'DEN',number:String(20+i),x,z,scale:i<4?DEF_LINE_SCALE:SKILL_SCALE,role:i<4?'DL':i<7?'LB':i<9?'CB':'S'}));

const routes={
  Y:[[-19,WIDE_Z],[-18,4],[-10,14],[-4,24]],
  X:[[-10.5,SLOT_Z],[-10,6],[-10,22],[-9,38]],
  A:[[10.5,SLOT_Z],[10.5,7],[16,11],[22,12]],
  B:[[19,WIDE_Z],[19,8],[18,24],[16,42]]
};
const routeVec=(key)=>routes[key].map(([x,z])=>new THREE.Vector3(x,0,z));
function routePoint(key,d){const pts=routeVec(key);for(let i=0;i<pts.length-1;i++){const len=pts[i].distanceTo(pts[i+1]);if(d<=len)return pts[i].clone().lerp(pts[i+1],d/len);d-=len;}const a=pts.at(-2),b=pts.at(-1),dir=b.clone().sub(a).normalize();return b.clone().addScaledVector(dir,d);}

const football=new THREE.Group();const ball=mesh(new THREE.SphereGeometry(.12,9,6),M.ball,0,0,0,football);ball.scale.set(1,.72,1.65);football.visible=false;scene.add(football);
const aimLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xf3e4b6,dashSize:.75,gapSize:.55}));aimLine.visible=false;scene.add(aimLine);
const ring=mesh(new THREE.RingGeometry(1.35,1.8,24),new THREE.MeshBasicMaterial({color:0xe0b02f,side:THREE.DoubleSide,transparent:true,opacity:.85}),0,.08,0);ring.rotation.x=-Math.PI/2;ring.visible=false;

let state='PRE_SNAP', controlled=offense.qb, routeTime=0, aim=null, flight=null, down=1, toGo=10, firstDownZ=2, ballSpot=28, playClock=14, clockAcc=0, last=performance.now(), slideTime=0, powerHeld=false;
let jukeTime=0,jukeCooldown=0,jukeDir=0,powerCooldown=0,runGesture=null,throwAnim=0;
const keys=new Set(), stickMove={x:0,z:0}; let stickId=null;
const ord=(n)=>['','1ST','2ND','3RD','4TH'][n]||`${n}TH`;
function status(a,b){ui.statusTitle.textContent=a;ui.statusText.textContent=b;}
function setState(s){state=s;ui.snap.disabled=s!=='PRE_SNAP';ui.tuck.disabled=!['POCKET','AIMING'].includes(s);ui.slide.disabled=s!=='SCRAMBLE';ui.power.disabled=!['SCRAMBLE','RUN'].includes(s);ui.hint.style.display=['POCKET','AIMING'].includes(s)?'block':'none';}
function reset(msg='Press SNAP to start the play'){
  setState('PRE_SNAP');controlled=offense.qb;offense.qb.position.set(0,0,-15);offense.rb.position.set(4.8,0,-17.2);
  for(const k of ['Y','X','A','B']){const [x,z]=routes[k][0];offense[k].position.set(x,0,z);offense[k].rotation.set(0,0,0);}
  linemen.forEach((o,i)=>{o.position.set(lineX[i],0,OL_Z);o.rotation.set(0,0,0);});
  defense.forEach((d,i)=>{d.position.set(defStart[i][0],0,defStart[i][1]);d.rotation.set(0,0,0);d.userData.stun=0;});
  football.visible=false;aimLine.visible=false;ring.visible=false;aim=flight=null;slideTime=0;powerHeld=false;playClock=14;jukeTime=jukeCooldown=powerCooldown=throwAnim=0;runGesture=null;status('READY',msg);
}
function snap(){if(state!=='PRE_SNAP')return;routeTime=0;setState('POCKET');status('BALL LIVE','Read the coverage, move in the pocket, pull back and release to throw');}
function arc(a,b,lift){const pts=[];for(let i=0;i<=28;i++){const t=i/28,p=a.clone().lerp(b,t);p.y+=Math.sin(Math.PI*t)*lift;pts.push(p);}return pts;}
function beginAim(x,y){if(state!=='POCKET')return;aim={sx:x,sy:y,target:null,power:0,lift:0};setState('AIMING');updateAim(x,y);}
function updateAim(x,y){if(!aim)return;const dx=x-aim.sx,dy=y-aim.sy,p=clamp(Math.hypot(dx,dy)/220,.12,1),side=clamp(dx/185,-1,1),q=offense.qb.position;
  aim.target=new THREE.Vector3(clamp(q.x+side*18,-24,24),.7,clamp(q.z+lerp(12,46,p),q.z+8,67));aim.power=p;aim.lift=lerp(3.5,11,p);
  const start=q.clone().add(new THREE.Vector3(0,THROW_Y,.35));aimLine.geometry.setFromPoints(arc(start,aim.target.clone(),aim.lift));aimLine.computeLineDistances();aimLine.visible=true;ring.position.copy(aim.target);ring.visible=true;}
function throwBall(){if(state!=='AIMING'||!aim?.target){aimLine.visible=ring.visible=false;aim=null;if(state==='AIMING')setState('POCKET');return;}
  const start=offense.qb.position.clone().add(new THREE.Vector3(0,THROW_Y,.35)),end=aim.target.clone().setY(.95);flight={t:0,duration:clamp(start.distanceTo(end)/34,.58,1.45),start,end,lift:aim.lift};
  football.position.copy(start);football.visible=true;aimLine.visible=ring.visible=false;aim=null;throwAnim=.32;setState('BALL');status('PASS AWAY','Lead the receiver into space');}
function tuck(){if(!['POCKET','AIMING'].includes(state))return;aimLine.visible=ring.visible=false;aim=null;controlled=offense.qb;setState('SCRAMBLE');status('SCRAMBLE','QB has tucked the ball');}
function slide(){if(state!=='SCRAMBLE'||slideTime>0)return;slideTime=.65;status('SLIDE','QB gives himself up');}
function juke(screenDir){if(!['SCRAMBLE','RUN'].includes(state)||jukeCooldown>0||slideTime>0)return;jukeDir=-Math.sign(screenDir||1);jukeTime=.2;jukeCooldown=.6;status('JUKE',jukeDir>0?'Hard cut left':'Hard cut right');
  for(const d of defense){if(d.position.distanceTo(controlled.position)<2.3)d.userData.stun=Math.max(d.userData.stun,.42);}
}

ui.snap.addEventListener('click',snap);ui.tuck.addEventListener('click',tuck);ui.slide.addEventListener('click',slide);
ui.power.addEventListener('pointerdown',()=>{powerHeld=true;status('POWER MOVE','Hold through contact to truck or stiff-arm');});
for(const e of ['pointerup','pointercancel','pointerleave'])ui.power.addEventListener(e,()=>powerHeld=false);
addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();snap();}if(e.code==='KeyR')tuck();if(e.code.startsWith('Shift'))slide();if(e.code==='KeyQ')juke(-1);if(e.code==='KeyE')juke(1);});addEventListener('keyup',e=>keys.delete(e.code));
renderer.domElement.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(['RUN','SCRAMBLE'].includes(state)){runGesture={x:e.clientX,y:e.clientY,t:performance.now()};return;}
  beginAim(e.clientX,e.clientY);
});
renderer.domElement.addEventListener('pointermove',e=>{if(state==='AIMING')updateAim(e.clientX,e.clientY);});
renderer.domElement.addEventListener('pointerup',e=>{
  if(runGesture&&['RUN','SCRAMBLE'].includes(state)){
    const dx=e.clientX-runGesture.x,dy=e.clientY-runGesture.y,elapsed=performance.now()-runGesture.t;
    if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.25&&elapsed<380)juke(dx);
    runGesture=null;return;
  }
  throwBall();
});
renderer.domElement.addEventListener('pointercancel',()=>{runGesture=null;throwBall();});

function stickUpdate(e){const r=ui.stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;let dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy);if(m>max){dx=dx/m*max;dy=dy/m*max;}ui.knob.style.transform=`translate(${dx}px,${dy}px)`;stickMove.x=-dx/max;stickMove.z=-dy/max;}
ui.stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;ui.stick.setPointerCapture(e.pointerId);stickUpdate(e);});ui.stick.addEventListener('pointermove',e=>{if(stickId===e.pointerId)stickUpdate(e);});
function stickEnd(e){if(stickId!==e.pointerId)return;stickId=null;stickMove.x=stickMove.z=0;ui.knob.style.transform='translate(0,0)';}ui.stick.addEventListener('pointerup',stickEnd);ui.stick.addEventListener('pointercancel',stickEnd);
function input(){let x=stickMove.x,z=stickMove.z;if(keys.has('KeyA')||keys.has('ArrowLeft'))x++;if(keys.has('KeyD')||keys.has('ArrowRight'))x--;if(keys.has('KeyW')||keys.has('ArrowUp'))z++;if(keys.has('KeyS')||keys.has('ArrowDown'))z--;const l=Math.hypot(x,z);return l>1?{x:x/l,z:z/l}:{x,z};}
function move(dt){if(!['POCKET','AIMING','SCRAMBLE','RUN'].includes(state))return;const v=input(),p=controlled.position,s=['POCKET','AIMING'].includes(state)?5.4:9.2*(powerHeld?.88:1)*(slideTime>0?.2:1);
  if(jukeTime>0){p.x+=jukeDir*12.5*dt;jukeTime=Math.max(0,jukeTime-dt);}else{p.x+=v.x*s*dt;p.z+=v.z*s*dt;}
  if(controlled===offense.qb&&['POCKET','AIMING'].includes(state)){p.x=clamp(p.x,-8.5,8.5);p.z=clamp(p.z,-20,-7.8);}else{p.x=clamp(p.x,-25.5,25.5);p.z=clamp(p.z,-24,82);}if(Math.hypot(v.x,v.z)>.1&&!jukeTime)controlled.rotation.y=Math.atan2(v.x,v.z);}
function receivers(dt){if(!['POCKET','AIMING','BALL'].includes(state))return;routeTime+=dt;for(const k of ['Y','X','A','B']){const old=offense[k].position.clone(),next=routePoint(k,routeTime*7.7);offense[k].position.copy(next);const d=next.clone().sub(old);if(d.lengthSq()>.0001)offense[k].rotation.y=Math.atan2(d.x,d.z);}}

function moveDefenderToward(d,target,speed,dt){
  if(d.userData.stun>0){d.userData.stun=Math.max(0,d.userData.stun-dt);return;}
  const v=target.clone().sub(d.position);v.y=0;
  if(v.lengthSq()<.02)return;
  v.normalize();d.position.addScaledVector(v,speed*dt);d.rotation.y=Math.atan2(v.x,v.z);
}

function passRush(dt){if(!['POCKET','AIMING','BALL'].includes(state))return;
  for(let i=0;i<4;i++){
    const d=defense[i],o=linemen[Math.min(4,Math.round(i*4/3))];
    if(d.userData.stun>0){d.userData.stun=Math.max(0,d.userData.stun-dt);continue;}
    const gap=o.position.clone().sub(d.position);gap.y=0;const dist=gap.length();
    if(dist>1.05){gap.normalize();d.position.addScaledVector(gap,3.5*dt);d.rotation.y=Math.atan2(gap.x,gap.z);}
    else{
      const toRush=d.position.clone().sub(o.position);toRush.y=0;if(toRush.lengthSq()>.01){toRush.normalize();o.position.addScaledVector(toRush,1.0*dt);o.rotation.y=Math.atan2(toRush.x,toRush.z);}
      const toQB=offense.qb.position.clone().sub(d.position);toQB.y=0;if(toQB.lengthSq()>.01){toQB.normalize();d.position.addScaledVector(toQB,.58*dt);}
    }
  }
}

function coverageAI(dt){
  if(!['POCKET','AIMING','BALL'].includes(state))return;

  const y=offense.Y.position,x=offense.X.position,a=offense.A.position,b=offense.B.position;
  const ballBreak=state==='BALL'&&football.visible;

  const cbLeftTarget=ballBreak
    ? football.position.clone().setY(0)
    : new THREE.Vector3(y.x-.6,0,Math.max(LOS+1.2,y.z+1.35));
  const cbRightTarget=ballBreak
    ? football.position.clone().setY(0)
    : new THREE.Vector3(b.x+.6,0,Math.max(LOS+1.2,b.z+1.35));
  moveDefenderToward(defense[7],cbLeftTarget,ballBreak?8.0:6.15,dt);
  moveDefenderToward(defense[8],cbRightTarget,ballBreak?8.0:6.15,dt);

  const lbLeftTarget=new THREE.Vector3(x.x+.45,0,clamp(x.z+1.8,1.8,13));
  const lbRightTarget=new THREE.Vector3(a.x-.45,0,clamp(a.z+1.8,1.8,13));
  moveDefenderToward(defense[4],ballBreak?football.position.clone().setY(0):lbLeftTarget,ballBreak?7.4:5.65,dt);
  moveDefenderToward(defense[6],ballBreak?football.position.clone().setY(0):lbRightTarget,ballBreak?7.4:5.65,dt);

  const midX=clamp((x.x+a.x)*.22,-4.5,4.5);
  const mlbTarget=ballBreak
    ? football.position.clone().setY(0)
    : new THREE.Vector3(midX,0,clamp(Math.max(x.z,a.z)*.55+3,3.5,11.5));
  moveDefenderToward(defense[5],mlbTarget,ballBreak?7.1:5.25,dt);

  const deepestLeft=Math.max(y.z,x.z),deepestRight=Math.max(a.z,b.z);
  const sLeftTarget=ballBreak
    ? football.position.clone().setY(0)
    : new THREE.Vector3(clamp((y.x+x.x)*.48,-14,-3),0,clamp(deepestLeft+5.5,12,31));
  const sRightTarget=ballBreak
    ? football.position.clone().setY(0)
    : new THREE.Vector3(clamp((a.x+b.x)*.48,3,14),0,clamp(deepestRight+5.5,12,31));
  moveDefenderToward(defense[9],sLeftTarget,ballBreak?8.2:5.9,dt);
  moveDefenderToward(defense[10],sRightTarget,ballBreak?8.2:5.9,dt);
}

function catchCandidate(pos){let best=null,dist=99;for(const k of ['Y','X','A','B']){const d=offense[k].position.clone().add(new THREE.Vector3(0,CATCH_Y,0)).distanceTo(pos);if(d<dist){dist=d;best=offense[k];}}return dist<1.85?best:null;}
function ballFlight(dt){if(state!=='BALL'||!flight)return;flight.t+=dt/flight.duration;const t=clamp(flight.t,0,1),p=flight.start.clone().lerp(flight.end,t);p.y+=Math.sin(Math.PI*t)*flight.lift;football.position.copy(p);football.rotation.x+=dt*12;football.rotation.z+=dt*6;
  const c=t>.38&&catchCandidate(p);if(c){football.visible=false;controlled=c;flight=null;setState('RUN');status('CAUGHT',`#${c.userData.number} has the ball`);return;}if(t>=1){football.visible=false;flight=null;down=down>=4?1:down+1;ui.down.textContent=`${ord(down)} & ${toGo}`;setState('DEAD');status('INCOMPLETE','Pass hits the turf');setTimeout(()=>reset('Incomplete pass. Press SNAP for the next play.'),850);}}
function defenseAI(dt){if(!['SCRAMBLE','RUN'].includes(state))return;let nearest=99,nearPlayer=null;for(const d of defense){if(d.userData.stun>0){d.userData.stun=Math.max(0,d.userData.stun-dt);d.rotation.z=Math.sin(d.userData.stun*18)*.24;continue;}d.rotation.z=0;const v=controlled.position.clone().sub(d.position),dist=v.length();if(dist<nearest){nearest=dist;nearPlayer=d;}if(dist<32){v.y=0;v.normalize();d.position.addScaledVector(v,(d.userData.role==='DL'?6.0:6.8)*dt);d.rotation.y=Math.atan2(v.x,v.z);}}
  if(nearest<1.05&&slideTime<=0){
    if(powerHeld&&powerCooldown<=0&&nearPlayer){const away=nearPlayer.position.clone().sub(controlled.position);away.y=0;away.normalize();nearPlayer.position.addScaledVector(away,2.4);nearPlayer.userData.stun=.6;powerCooldown=.85;status('BROKEN TACKLE','Power move wins the contact');return;}
    if(jukeTime<=0){finishRun(false);return;}
  }
  if(controlled.position.z>=END){ui.score.textContent='24';setState('DEAD');status('TOUCHDOWN','LAS VEGAS OUTLAWS');setTimeout(()=>reset('Touchdown! Prototype drive reset.'),1200);}}
function finishRun(slid){const gained=Math.max(0,Math.round(controlled.position.z-LOS)),first=controlled.position.z>=firstDownZ;if(first){down=1;toGo=10;firstDownZ=controlled.position.z+10;}else{down=Math.min(4,down+1);toGo=Math.max(1,Math.round(firstDownZ-controlled.position.z));}
  ballSpot=clamp(ballSpot+gained,1,99);ui.down.textContent=`${ord(down)} & ${toGo}`;ui.spot.textContent=ballSpot<50?`LV ${ballSpot}`:`DEN ${100-ballSpot}`;setState('DEAD');status(slid?'SLIDE':first?'FIRST DOWN':'TACKLED',`Gain of ${gained} yards`);setTimeout(()=>reset('Next play ready.'),800);}

function animatePlayers(dt,now){
  for(const p of allPlayers){
    const dx=p.position.x-p.userData.prev.x,dz=p.position.z-p.userData.prev.z,speed=Math.hypot(dx,dz)/Math.max(dt,.001),moving=speed>.35;
    const phase=now*.012+p.userData.phase,swing=moving?Math.sin(phase)*.6:0;
    const {arms,legs}=p.userData.limbs;
    arms[0].rotation.x=lerp(arms[0].rotation.x,swing,.28);arms[1].rotation.x=lerp(arms[1].rotation.x,-swing,.28);
    legs[0].rotation.x=lerp(legs[0].rotation.x,-swing*.7,.28);legs[1].rotation.x=lerp(legs[1].rotation.x,swing*.7,.28);
    p.userData.prev.copy(p.position);
  }
  if(throwAnim>0){throwAnim=Math.max(0,throwAnim-dt);offense.qb.userData.limbs.arms[1].rotation.x=-1.7*(throwAnim/.32);}
}
function cam(dt){const running=['RUN','SCRAMBLE'].includes(state),focus=running?controlled.position:offense.qb.position,desired=running?new THREE.Vector3(focus.x*.16,10.8,focus.z-17.5):new THREE.Vector3(offense.qb.position.x*.12,13.2,offense.qb.position.z-18.5);camera.position.lerp(desired,1-Math.pow(.001,dt));const look=focus.clone().add(new THREE.Vector3(0,1.65,16.5)),q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position,look,new THREE.Vector3(0,1,0)));camera.quaternion.slerp(q,1-Math.pow(.0008,dt));}
function badges(){const show=['PRE_SNAP','POCKET','AIMING','BALL'].includes(state);for(const k of ['Y','X','A','B']){const el=ui.badges[k];el.style.display=show?'grid':'none';if(!show)continue;const p=offense[k].position.clone().add(new THREE.Vector3(0,PLAYER_HEAD_Y,0)).project(camera);el.style.left=`${(p.x*.5+.5)*innerWidth}px`;el.style.top=`${(-p.y*.5+.5)*innerHeight}px`;el.style.opacity=p.z>1?'0':'1';}}
function clock(dt){if(state!=='PRE_SNAP')return;clockAcc+=dt;if(clockAcc>=1){clockAcc-=1;playClock=Math.max(0,playClock-1);ui.playClock.textContent=`:${String(playClock).padStart(2,'0')}`;ui.playClock.style.color=playClock<=5?'#ef604a':playClock<=10?'#e8ae4a':'';if(playClock===0){playClock=14;status('DELAY','Play clock expired');}}}
function frame(now){const dt=Math.min(.035,(now-last)/1000||.016);last=now;jukeCooldown=Math.max(0,jukeCooldown-dt);powerCooldown=Math.max(0,powerCooldown-dt);if(slideTime>0){slideTime-=dt;controlled.rotation.x=lerp(controlled.rotation.x,-1.05,.2);if(slideTime<=0){controlled.rotation.x=0;finishRun(true);}}
  move(dt);receivers(dt);passRush(dt);coverageAI(dt);ballFlight(dt);defenseAI(dt);animatePlayers(dt,now);cam(dt);badges();clock(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
reset();