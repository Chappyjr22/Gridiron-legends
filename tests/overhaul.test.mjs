import assert from 'node:assert/strict';
import {slingshotTarget,maxThrowYards} from '../src/input/aim.js';
import {looseBall,advanceLooseBall,fumbleChance} from '../src/simulation/ballMotion.js';
import {harness} from './helpers/engine.mjs';
import {advanceRoute} from '../src/simulation/passing.js';
import {runnerActionFrame} from '../src/rendering/runnerFrames.js';
let checks=0;
async function test(name,fn){await fn();console.log('ok - '+name);checks++;}
await test('comfortable slingshot throws reach deep and preserve backward intent',()=>{
 for(const width of [800,1200,1600]){const qb={cx:width-185,cy:190};const t=slingshotTarget(qb,{x:qb.cx+130,y:190},80);assert.ok((qb.cx-t.x)/28>30);assert.ok(t.y===190);assert.ok(slingshotTarget(qb,{x:qb.cx-30,y:190}).x>qb.cx+28);}
});
await test('all passing modes enforce arm distance from release including diagonal scatter',async()=>{
 for(const mode of ['drag','direct','tap'])for(const arm of [40,60,75,90,99])for(const kind of ['lob','bullet']){
  const h=await harness();h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();h.game.passMode=mode;h.game.throwType=kind;
  h.entities.players.qb.attributes.arm=arm;const qb=h.entities.players.qb;const {BASE_X}=await h.load('src/state/constants.js');
  h.engine.releaseThrow({x:BASE_X-10000,y:320});const b=h.entities.ball;
  const yards=Math.hypot(b.toX-qb.x,b.toY-qb.yfield)/28;
  assert.ok(yards<=maxThrowYards(arm,kind)+.0001);assert.ok(yards>maxThrowYards(arm,kind)-1);
 }
 assert.equal(maxThrowYards(60),30);assert.ok(maxThrowYards(75)<40);assert.ok(maxThrowYards(99)>50);
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
 h.step(940);h.engine.kickInput();assert.ok(h.game.kick.power>.99);h.engine.kickInput();assert.equal(h.game.kick.stage,'flight');assert.ok(h.entities.ball.inFlight);
 h.step(1000);h.step(500);assert.equal(h.game.playerScore,3);h.engine.kickInput();assert.equal(h.game.playerScore,3);assert.ok(h.entities.ball.loose);
});
await test('out-of-range kicks cannot start and weak kicks miss',async()=>{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(20);h.hud.showFourthDown();h.engine.attemptFieldGoal();assert.equal(h.game.phase,'decision');assert.ok(h.element('btn-field-goal').disabled);
 h.engine.startPlayerDrive(75);h.hud.showFourthDown();h.engine.attemptFieldGoal();h.engine.kickInput();h.engine.kickInput();h.step(1000);h.step(500);assert.equal(h.game.playerScore,0);assert.match(h.game.message,/no good/);
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
console.log(`${checks} overhaul checks passed.`);
