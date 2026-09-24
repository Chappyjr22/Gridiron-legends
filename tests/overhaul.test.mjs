import {kickTrajectory,kickOutcome,kickWindow,kickMeter,kickGoalSample,KICK_GOAL} from '../src/simulation/kicking.js';
import assert from 'node:assert/strict';
import {slingshotTarget,maxThrowYards} from '../src/input/aim.js';
import {looseBall,advanceLooseBall,fumbleChance} from '../src/simulation/ballMotion.js';
import {harness} from './helpers/engine.mjs';
import {advanceRoute} from '../src/simulation/passing.js';
import {runnerActionFrame} from '../src/rendering/runnerFrames.js';
let checks=0;
async function test(name,fn){await fn();console.log('ok - '+name);checks++;}
await test('comfortable slingshot throws reach deep and preserve backward intent',()=>{
 for(const width of [800,1200,1600]){const qb={cx:width-185,cy:190};const t=slingshotTarget(qb,{x:qb.cx+140,y:190},80);assert.ok((qb.cx-t.x)/28>30);assert.ok(t.y===190);assert.ok(slingshotTarget(qb,{x:qb.cx-30,y:190}).x>qb.cx+28);}
});
await test('short pulls ease into distance and longer pulls increase smoothly to the arm limit',()=>{
 const qb={cx:615,cy:190};
 for(const arm of [40,68,80,99])for(const kind of ['lob','bullet']){
  const yards=pull=>(qb.cx-slingshotTarget(qb,{x:qb.cx+pull,y:190},arm,kind).x)/28;
  const max=maxThrowYards(arm,kind);
  assert.ok(yards(20)<max*.05);assert.ok(yards(40)<max*.15);
  assert.ok(yards(70)>max*.3&&yards(70)<max*.35);
  let previous=0;
  for(let pull=1;pull<=140;pull++){
   const next=yards(pull);assert.ok(next>previous);assert.ok(next-previous<max*.012);previous=next;
  }
  assert.ok(Math.abs(yards(140)-max)<1e-9);assert.equal(yards(200),yards(140));
 }
});
await test('off-center touches stay neutral and holding still does not build throw power',async()=>{
 const h=await harness();await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.game.passMode='drag';
 h.event('pointerdown',{clientX:690,clientY:220});
 const anchor={...h.interaction.aimAnchor};
 // Simulate pocket/camera movement while the finger remains still.
 h.entities.players.qb.yfield-=56;h.game.cameraYard+=1;
 const {toCanvas}=await h.load('src/rendering/players.js');const qb=toCanvas(h.entities.players.qb);
 const target=slingshotTarget(qb,h.interaction.aimTarget,75,'lob',anchor);
 assert.equal(target.x,qb.cx);assert.equal(target.y,qb.cy);
 h.event('pointerup');assert.equal(h.game.thrown,false);assert.equal(h.interaction.aimAnchor,null);
});
await test('pointer release matches anchored preview and a backward pull still scrambles',async()=>{
 for(const pull of [25,60,100,140,-30]){
  const h=await harness();await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.game.passMode='drag';h.setRandom(.5);
  h.event('pointerdown',{clientX:650,clientY:231});
  h.event('pointermove',{clientX:650+pull,clientY:231});
  const {toCanvas}=await h.load('src/rendering/players.js');const qb=h.entities.players.qb,pos=toCanvas(qb);
  const target=slingshotTarget(pos,h.interaction.aimTarget,qb.attributes.arm,h.game.throwType,h.interaction.aimAnchor);
  h.event('pointerup',{clientX:650+pull,clientY:231});
  if(pull<0){assert.equal(h.game.scrambling,true);continue;}
  assert.equal(h.entities.ball.inFlight,true);
  assert.ok(Math.abs((h.entities.ball.toY-qb.yfield)-(pos.cx-target.x))<1e-8);
  assert.ok(Math.abs(h.entities.ball.toX-target.y)<1e-8);
 }
});
await test('all passing modes enforce arm distance from release including diagonal scatter',async()=>{
 for(const mode of ['drag','direct','tap'])for(const arm of [40,60,75,90,99])for(const kind of ['lob','bullet']){
  const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();h.game.passMode=mode;h.game.throwType=kind;
  h.entities.players.qb.attributes.arm=arm;const qb=h.entities.players.qb;const {BASE_X}=await h.load('src/state/constants.js');
  h.engine.releaseThrow({x:BASE_X-10000,y:320});const b=h.entities.ball;
  const yards=Math.hypot(b.toX-qb.x,b.toY-qb.yfield)/28;
  assert.ok(yards<=maxThrowYards(arm,kind)+.0001);assert.ok(yards>maxThrowYards(arm,kind)-1);
 }
 assert.ok(maxThrowYards(60)<22);assert.ok(maxThrowYards(68)<27);assert.ok(maxThrowYards(75)<31);assert.equal(maxThrowYards(99),50);
});
await test('vertical and crossing routes continue after their final waypoint and stay in bounds',()=>{
 const vertical={x:39,yfield:20*28,routeIdx:0};advanceRoute(vertical,[{x:39,y:22}],140,8,20);assert.ok(vertical.yfield>42*28);assert.equal(vertical.x,39);
 const route=[{x:39,y:5},{x:330,y:8}],one={x:39,yfield:20*28,routeIdx:0},many={...one};
 advanceRoute(one,route,140,8,20);for(let i=0;i<80;i++)advanceRoute(many,route,140,.1,20);
 assert.ok(Math.abs(one.x-many.x)<.001);assert.ok(Math.abs(one.yfield-many.yfield)<.001);assert.ok(one.x<350);assert.ok(one.yfield>28*28);
});
await test('runner actions select separate four-frame dive and feet-first slide strips',()=>{
 for(const action of ['runnerDive','runnerSlide'])for(let frame=0;frame<4;frame++)assert.deepEqual(runnerActionFrame(action,frame*75),{row:action==='runnerDive'?0:1,col:frame});
 assert.equal(runnerActionFrame('tackle',100),null);assert.equal(runnerActionFrame('dive',100),null);assert.equal(runnerActionFrame('runnerDive',10000).col,3);
});
await test('loose ball rebounds, loses energy and settles without disappearing',()=>{
 const b=looseBall({x:100,yfield:500},{vx:20,vy:90,vz:110});let rebounded=false;
 for(let i=0;i<600;i++){advanceLooseBall(b,1/60);if(b.bounces>0&&b.height>2)rebounded=true;}
 assert.ok(rebounded);assert.ok(b.settled);assert.ok(b.loose);assert.ok(b.yfield>500);assert.equal(b.height,0);
});
await test('ball security affects bounded fumble risk',()=>{assert.ok(fumbleChance({rating:50},{rating:90})>fumbleChance({rating:95},{rating:90}));assert.ok(fumbleChance({rating:1},{rating:100})<=.045);});
await test('incompletion leaves a dead bouncing ball and stops game clock',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(25);h.engine.choosePlay('trips_verticals');h.engine.onSnap();
 h.entities.ball={inFlight:true,fromX:190,fromY:600,toX:10,toY:2400,startTime:h.now-1000,duration:100};h.game.thrown=true;h.step();
 assert.equal(h.entities.ball.loose,true);assert.equal(h.entities.ball.live,false);const clock=h.game.clock;h.step(200);assert.equal(h.game.clock,clock);assert.ok(h.entities.ball.height>0);
 h.step(1000);h.step(500);assert.equal(h.game.phase,'callsheet');
});
await test('RB route tap queues a pass, not an exchange',async()=>{
 const h=await harness();await h.load('src/input/pointer.js');const {PLAYS}=await h.load('src/data/plays.js');const id=Object.keys(PLAYS).find(k=>PLAYS[k].routes?.rb&&PLAYS[k].type==='screen');assert.ok(id);
 h.engine.startPractice();h.game.passMode='tap';h.engine.choosePlay(id);const rb=h.entities.players.rb;const {BASE_X}=await h.load('src/state/constants.js');const {SCENE_TOP}=await h.load('src/rendering/sceneLayout.js');
 h.event('pointerdown',{clientX:BASE_X-(rb.yfield-h.game.cameraYard*28),clientY:rb.x+SCENE_TOP});h.event('pointerup');h.step(260);assert.equal(h.entities.runExchange,null);assert.equal(h.game.playFacts.threw,true);
});
await test('a mid-flight deflection reaches the turf before becoming incomplete',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(25);h.engine.choosePlay('trips_verticals');h.engine.onSnap();
 h.entities.ball={inFlight:true,fromX:190,fromY:25*28,toX:190,toY:35*28,startTime:h.now-500,duration:1000,arcHeight:10};h.game.thrown=true;
 Object.assign(h.entities.players.cb1,{x:190,yfield:30*28});h.step();
 assert.equal(h.game.phase,'deadball');assert.equal(h.entities.ball.loose,true);assert.equal(h.entities.ball.bounces,0);
 h.step(100);assert.equal(h.game.phase,'deadball');h.step(700);assert.equal(h.game.phase,'result');assert.match(h.game.message,/Incomplete/);
});
await test('kick has two timing stages, visible flight and a single scoring result',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(80);h.game.down=4;h.hud.showFourthDown();h.engine.attemptFieldGoal();assert.equal(h.game.phase,'kicking');
 h.step(940);h.engine.kickInput();assert.ok(h.game.kick.power>.99);h.engine.kickInput();assert.equal(h.game.kick.stage,'aim');h.step(628);h.engine.kickInput();assert.equal(h.game.kick.stage,'approach');h.step(560);assert.equal(h.game.kick.stage,'flight');assert.ok(h.entities.ball.inFlight);
 h.step(1000);h.step(1000);h.step(1000);h.step(950);assert.equal(h.game.playerScore,3);h.engine.kickInput();assert.equal(h.game.playerScore,3);assert.ok(h.entities.ball.loose);h.engine.startOpponentPossession(20,'Kickoff');assert.equal(h.game.kick,null);
});
await test('out-of-range kicks cannot start and weak kicks miss',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(20);h.hud.showFourthDown();h.engine.attemptFieldGoal();assert.equal(h.game.phase,'decision');assert.ok(h.element('btn-field-goal').disabled);
 h.engine.startPlayerDrive(75);h.hud.showFourthDown();h.engine.attemptFieldGoal();h.engine.kickInput();h.step(628);h.engine.kickInput();h.step(560);h.step(1000);h.step(1000);h.step(950);assert.equal(h.game.playerScore,0);assert.match(h.game.message,/no good/);
});
await test('runner dive ends the rep and cannot be extended by repeated taps',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_inside');h.engine.startRunOption();h.step(200);
 for(const p of Object.values(h.entities.players))if(p!==h.entities.players.rb)p.yfield=-10000;h.entities.decor.forEach(p=>p.yfield=-10000);
 const controls=await h.load('src/input/runnerControls.js');assert.ok(controls.requestDive());assert.equal(h.entities.players.rb.action,'runnerDive');assert.equal(controls.requestDive(),false);h.step(320);assert.equal(h.game.phase,'result');assert.ok(!h.game.fumble);
});
await test('contact during an offensive dive preserves its pose and skin through the result',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_inside');h.engine.startRunOption();h.step(200);
 const runner=h.entities.players.rb,def=h.entities.players.cb1;
 for(const p of [...Object.values(h.entities.players),...h.entities.decor])if(p!==runner)p.yfield=-10000;
 runner.skin=3;h.game.carrierSince=h.now-1000;Object.assign(def,{x:runner.x,yfield:runner.yfield+2});
 const controls=await h.load('src/input/runnerControls.js');controls.requestDive();h.step();assert.equal(h.game.phase,'tackle');
 h.step(1000);assert.equal(h.game.phase,'result');assert.equal(runner.action,'runnerDive');assert.equal(runner.skin,3);
});
await test('scrambling preserves engaged linemen until their original block expires',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();
 const {DL_KEYS}=await h.load('src/state/constants.js');
 for(const p of [...Object.values(h.entities.players),...h.entities.decor])if(p!==h.entities.players.qb)p.yfield=-10000;
 for(const key of DL_KEYS)Object.assign(h.entities.players[key],{state:'engaged',engageStart:h.now,engageDur:900});
 assert.ok(h.engine.startScramble());h.step(300);
 for(const key of DL_KEYS)assert.equal(h.entities.players[key].state,'engaged');
 h.step(650);for(const key of DL_KEYS)assert.equal(h.entities.players[key].state,'released');
});
await test('a clean scramble lane lets both slower and faster QBs advance using their speed attribute',async()=>{
 const gains=[];
 for(const speed of [55,85]){
  const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();
  const qb=h.entities.players.qb;qb.attributes.speed=speed;
  for(const p of [...Object.values(h.entities.players),...h.entities.decor])if(p!==qb)p.yfield=-10000;
  h.engine.startScramble();for(let i=0;i<150;i++)h.step(16);
  gains.push(qb.yfield/28-h.game.los);assert.equal(h.game.phase,'live');
 }
 assert.ok(gains[0]>2);assert.ok(gains[1]>gains[0]+2);
});
await test('scramble recognition is brief and ends immediately when the QB crosses the line',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();
 const qb=h.entities.players.qb;
 for(const p of [...Object.values(h.entities.players),...h.entities.decor])if(p!==qb)p.yfield=-10000;
 h.engine.startScramble();h.step(300);const extra=h.entities.decor[5];
 assert.notEqual(extra.isPursuing,true);qb.yfield=h.game.los*28+1;h.step();assert.equal(extra.isPursuing,true);
});
await test('nearby lineman wins the block assignment and contact holds until release',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_inside');h.engine.startRunOption();h.step(150);
 const runner=h.entities.players.rb,def=h.entities.decor[6],line=h.entities.decor[0],receiver=h.entities.players.wr1;
 for(const p of [...Object.values(h.entities.players),...h.entities.decor]){p.x=300;p.yfield=-10000;}
 h.game.activeRunPath=[];h.game.carrierSince=h.now-1000;
 Object.assign(runner,{x:190,yfield:600});Object.assign(def,{x:190,yfield:650});Object.assign(line,{x:190,yfield:645});Object.assign(receiver,{x:190,yfield:730});
 h.step();assert.equal(line.isBlocking,true);assert.equal(receiver.isBlocking,false);assert.ok(def.blockedUntil>h.now);
 runner.yfield=def.yfield-10;h.step();assert.equal(h.game.phase,'live');
 line.yfield=-10000;receiver.yfield=-10000;def.blockedUntil=h.now-1;def.x=runner.x;def.yfield=runner.yfield+2;
 h.step();assert.equal(h.game.phase,'tackle');
});
await test('recorded replay does not mutate score, clock, entities or stats',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();h.step(200);
 const r=await h.load('src/simulation/highlights.js');h.engine.endPlay(25,'Catch');const before=JSON.stringify({g:h.game,e:h.entities,s:h.engine.matchState});r.toggleReplay();assert.ok(r.highlights.playing);assert.ok(r.replayFrame());assert.equal(JSON.stringify({g:h.game,e:h.entities,s:h.engine.matchState}),before);r.toggleReplay();assert.equal(r.highlights.playing,false);
});
await test('replay interpolates between samples without retaining mutable live player data',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();
 const r=await h.load('src/simulation/highlights.js');r.resetHighlight();const start=h.now;
 h.entities.players.wr1.yfield=100;r.captureHighlight(start);h.entities.players.wr1.yfield=200;r.captureHighlight(start+100);
 h.engine.endPlay(1,'Catch');r.toggleReplay();h.step(50);const f=r.replayFrame();
 assert.ok(Math.abs(f.players.wr1.yfield-140)<.001);assert.equal(r.highlights.frames[0].players.wr1.yfield,100);
 f.players.wr1.x=999;assert.notEqual(r.highlights.frames[0].players.wr1.x,999);assert.equal(f.players.wr1.attributes,undefined);
});
await test('fumble recovery credits turnover once and legacy stats accept new fields',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(25);h.engine.choosePlay('trips_inside');h.engine.startRunOption();h.step(150);
 const carrier=h.entities.players.rb;h.engine.matchState.stats.players[carrier.playerId]={carries:0,rushingYards:0,rushingTD:0};
 h.game.playFacts.fumbled=true;h.game.fumble={carrier,spot:25,start:h.now-1000};h.entities.ballCarrier=null;h.entities.ball=looseBall({x:100,yfield:25*28},{live:true,vz:0,now:h.now-1000});
 for(const p of Object.values(h.entities.players))p.x=320;h.entities.decor.forEach(p=>p.x=320);Object.assign(h.entities.players.cb1,{x:100,yfield:25*28});h.step();
 assert.match(h.game.message,/FUMBLE LOST/);assert.equal(h.engine.matchState.stats.players[carrier.playerId].fumbles,1);assert.equal(h.engine.matchState.stats.players[carrier.playerId].fumblesLost,1);assert.equal(h.engine.matchState.stats.plays.length,1);
});


await test('kick scoring agrees with plane crossing, height and lateral position',()=>{
 for(const distance of [20,35,50,60])for(const rating of [40,70,99]){
  const los=117-distance,window=kickWindow(los,rating);
  const weak=kickTrajectory(los,rating,Math.max(0,window.powerRequired-.02),0);
  assert.equal(kickOutcome(weak).good,false);assert.equal(kickOutcome(weak).reason,'SHORT');
  if(window.powerRequired<=1){
   const power=(window.powerRequired+1)/2,good=kickTrajectory(los,rating,power,0),outcome=kickOutcome(good);
   assert.equal(outcome.good,true);assert.ok(outcome.p<1&&outcome.height>=32);assert.ok(good.toY>110*28);
   assert.equal(kickOutcome(kickTrajectory(los,rating,power,-1)).reason,'WIDE LEFT');
   assert.equal(kickOutcome(kickTrajectory(los,rating,power,1)).reason,'WIDE RIGHT');
  }
 }
 assert.equal(kickMeter('aim',0),-1);assert.ok(Math.abs(kickMeter('aim',Math.PI*200))<.00001);
});
await test('practice kicks repeat without awarding points or advancing the opponent',async()=>{
 const h=await harness();h.engine.startPractice();h.engine.practiceFieldGoal(50);assert.equal(h.game.kick.distance,50);
 h.step(940);h.engine.kickInput();h.step(628);h.engine.kickInput();h.step(560);h.step(1000);h.step(1000);h.step(1000);h.step(950);
 assert.equal(h.game.phase,'result');assert.equal(h.game.playerScore,0);assert.match(h.game.message,/field goal/);
});
await test('deep lob flight gives routes time while short throws and bullets stay quick',async()=>{
 const h=await harness(),{throwProfile}=await h.load('src/simulation/passing.js');
 const qb={x:190,yfield:0,rating:75,attributes:{arm:75,release:75}};
 const profile=(yards,kind)=>throwProfile(qb,{x:190,yfield:yards*28},kind);
 assert.ok(profile(6,'lob').duration<400);assert.ok(profile(25,'lob').duration>2200);
 assert.ok(profile(25,'bullet').duration<850);assert.ok(profile(35,'lob').duration>profile(25,'lob').duration);
});



await test('goal camera holds the scoring crossing, including kicks landing outside the posts',()=>{
 for(const distance of [20,35,50,60]){
  const aim=(KICK_GOAL.halfWidth-KICK_GOAL.ballRadius-1)/(distance*3),ball=kickTrajectory(117-distance,99,1,aim,1000),out=kickOutcome(ball);
  assert.equal(out.good,true);
  const at=1000+ball.duration*out.p;
  const before=kickGoalSample(ball,at-1),crossed=kickGoalSample(ball,at+1),landed=kickGoalSample(ball,1000+ball.duration+900);
  assert.equal(before.crossed,false);assert.equal(crossed.crossed,true);
  assert.equal(crossed.offset,out.offset);assert.equal(landed.offset,out.offset);assert.equal(landed.height,out.height);
  assert.ok(Math.abs(crossed.offset)+KICK_GOAL.ballRadius<KICK_GOAL.halfWidth);
  assert.ok(crossed.height-KICK_GOAL.ballRadius>=KICK_GOAL.barHeight);
  if(distance===20)assert.ok(Math.abs(ball.toX-190)>KICK_GOAL.halfWidth,'landing can be outside despite a legal crossing');
 }
 const boundary=kickTrajectory(82,99,1,44/(35*3));assert.equal(kickOutcome(boundary).good,false,'ball must fully clear the post');
});
async function touchdown(h){
 h.engine.startPlayerDrive(95);h.entities.ballCarrier=h.entities.players.wr1;h.entities.ballCarrier.yfield=100*28;
 h.engine.endPlay(5,'Catch',false,100);
 assert.equal(h.game.playerScore,6);assert.equal(h.element('btn-continue').textContent,'Kick extra point');
 h.engine.endPlay(5,'Catch',false,100);assert.equal(h.game.playerScore,6);
 h.step(450);h.hud.continueResult();assert.equal(h.game.kick.kind,'extraPoint');assert.equal(h.game.kick.distance,33);
}
function resolvePAT(h,good){
 if(good)h.step(940);
 h.engine.kickInput();h.step(628);h.engine.kickInput();h.step(560);
 for(let i=0;i<4;i++)h.step(1000);
 assert.equal(h.game.phase,'result');h.step(450);
}
for(const good of [true,false])await test(`player extra point ${good?'scores one':'misses'} and both outcomes lead to kickoff`,async()=>{
 const h=await harness();h.engine.startNewGame();await touchdown(h);const clock=h.game.clock;
 resolvePAT(h,good);assert.equal(h.game.playerScore,good?7:6);assert.equal(h.game.clock,clock);
 assert.match(h.game.message,good?/Extra point is GOOD/:/Extra point is no good/);
 h.engine.kickInput();h.step(1000);assert.equal(h.game.playerScore,good?7:6);
 h.hud.continueResult();assert.equal(h.game.possession,'cpu');assert.equal(h.game.kick,null);
 assert.match(h.game.message,/Kickoff/);assert.equal(h.engine.matchState.stats.plays.length,1);
});
for(const quarter of [2,4])await test(`expired quarter ${quarter} waits for the extra point`,async()=>{
 const h=await harness();h.engine.startNewGame();h.game.quarter=quarter;h.game.clock=0;h.game.cpuScore=6;
 await touchdown(h);assert.equal(h.game.quarter,quarter);resolvePAT(h,true);assert.equal(h.game.clock,0);
 h.hud.continueResult();assert.match(h.game.message,quarter===2?/HALFTIME/:/FINAL/);
 assert.equal(h.game.playerScore,7);
});
await test('missed final PAT can send a tied game into overtime',async()=>{
 const h=await harness();h.engine.startNewGame();h.game.quarter=4;h.game.clock=0;h.game.cpuScore=6;
 await touchdown(h);resolvePAT(h,false);h.hud.continueResult();assert.equal(h.game.overtime,true);
});
await test('overtime touchdown still requires a PAT before the opponent possession',async()=>{
 const h=await harness();h.engine.startNewGame();h.game.overtime=true;h.game.quarter=5;
 await touchdown(h);resolvePAT(h,true);h.hud.continueResult();assert.equal(h.game.possession,'cpu');
});
await test('career reload preserves a pending PAT and never re-awards a completed kick',async()=>{
 const h=await harness();let saved;h.engine.uiHooks.checkpoint=s=>saved=structuredClone(s);
 h.engine.startNewGame({career:true});await touchdown(h);assert.equal(saved.resume.type,'extraPoint');
 h.engine.kickInput();h.engine.restoreCheckpoint(saved);assert.equal(h.game.playerScore,6);
 assert.equal(h.element('btn-continue').textContent,'Kick extra point');h.step(450);h.hud.continueResult();
 assert.equal(h.game.kick.stage,'power');resolvePAT(h,true);assert.equal(saved.resume.type,'turnover');
 h.engine.restoreCheckpoint(saved);assert.equal(h.game.playerScore,7);h.step(450);h.hud.continueResult();
 assert.equal(h.game.possession,'cpu');assert.equal(h.game.playerScore,7);assert.equal(h.engine.matchState.stats.plays.length,1);
});


for(const down of [1,2,3,4])await test(`field goal available on down ${down} with three seconds remaining`,async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(75);
 Object.assign(h.game,{down,quarter:4,clock:3,playerScore:14,cpuScore:16});
 assert.ok(h.engine.canAttemptFieldGoal());h.engine.attemptFieldGoal();assert.equal(h.game.phase,'kicking');assert.equal(h.game.kick.distance,42);
 h.step(940);h.engine.kickInput();h.step(628);h.engine.kickInput();h.step(560);
 for(let i=0;i<6;i++)h.step(1000);
 assert.equal(h.game.playerScore,17);assert.equal(h.game.clock,0);h.hud.continueResult();assert.equal(h.game.phase,'gameover');
 h.engine.attemptFieldGoal();assert.equal(h.game.playerScore,17);assert.equal(h.game.phase,'gameover');
});
await test('any-down kicking respects range, possession, pause and live-play guards',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(52);assert.equal(h.engine.canAttemptFieldGoal(),false);
 h.engine.startPlayerDrive(75);h.game.paused=true;assert.equal(h.engine.canAttemptFieldGoal(),false);h.game.paused=false;
 h.game.possession='cpu';assert.equal(h.engine.canAttemptFieldGoal(),false);h.game.possession='player';
 h.engine.choosePlay('trips_slants');assert.ok(h.engine.canAttemptFieldGoal());h.engine.onSnap();assert.equal(h.engine.canAttemptFieldGoal(),false);
 h.game.phase='callsheet';h.game.clock=0;assert.equal(h.engine.canAttemptFieldGoal(),false);h.game.overtime=true;assert.ok(h.engine.canAttemptFieldGoal());
});

console.log(`${checks} overhaul checks passed.`);
