import assert from 'node:assert/strict';
import {harness} from './helpers/engine.mjs';
import {createFranchise,standings} from '../src/state/league.js';
import {contrastingOpponent} from '../src/rendering/uniforms.js';
let checks=0;
async function test(name,fn){await fn(await harness());console.log('ok - '+name);checks++;}
await test('paused flight, route delays, and animations retain simulation time',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();h.engine.releaseThrow({x:120,y:39});h.step();
 const {simulationNow}=await h.load('src/state/clock.js');const before=simulationNow();
 h.game.paused=true;h.step(10000);assert.equal(simulationNow(),before);
 h.game.paused=false;h.step();assert.equal(simulationNow(),before+16);assert.equal(h.entities.ball.inFlight,true);
});
await test('tackle short of goal line cannot round into touchdown',async h=>{
 h.engine.startNewGame();h.engine.startPlayerDrive(93);h.engine.choosePlay('trips_inside');h.game.phase='live';h.game.runActive=true;h.game.thrown=true;h.game.carrierSince=h.now-2000;
 h.entities.ballCarrier=h.entities.players.rb;Object.assign(h.entities.ballCarrier,{x:190,yfield:99.6*28});Object.assign(h.entities.players.cb1,{x:190,yfield:99.6*28});
 h.step();assert.equal(h.game.phase,'tackle');h.step(801);assert.equal(h.game.playerScore,0);assert.ok(h.game.los<100&&h.game.los>99);
 h.engine.initPlay();h.engine.endPlay(1,'Run',false,100);assert.equal(h.game.playerScore,6);
});
for(const [name,x,y] of [['back end line',39,111],['sideline',354,25]])await test('receiver beyond '+name+' cannot complete a pass',async h=>{
 h.engine.startNewGame();h.engine.startPlayerDrive(20);h.engine.choosePlay('trips_verticals');h.engine.onSnap();
 Object.assign(h.entities.players.wr1,{x,yfield:y*28});
 h.entities.ball={inFlight:true,toX:x,toY:y*28,startTime:h.now-1000,duration:100};h.game.thrown=true;h.step();
 assert.equal(h.game.playerScore,0);assert.match(h.game.message,/Incomplete/);assert.equal(h.game.los,20);
});
await test('cancellation releases Formation Lab selection',async h=>{
 await h.load('src/input/pointer.js');h.engine.startPractice();h.editState.editMode=true;h.event('pointerdown');assert.ok(h.editState.dragEntity);
 h.event('pointercancel');const x=h.entities.players.qb.x;h.event('pointermove',{clientY:150});assert.equal(h.entities.players.qb.x,x);assert.equal(h.editState.dragEntity,null);
});
await test('selected matchup and Tap instruction are accurate',async h=>{
 const hub=await h.load('src/ui/leagueHub.js');hub.renderLeagueSchedule();assert.match(h.element('league-schedule-list').innerHTML,/user-game/);
 h.engine.startPractice();h.game.passMode='tap';h.engine.choosePlay('ace_stick');assert.match(h.element('presnap-hint').innerHTML,/Tap a receiver/);
});
await test('kick action and result transition cannot be double-activated',async h=>{
 h.engine.startNewGame();h.engine.startPlayerDrive(30);h.game.down=4;h.hud.showFourthDown();h.engine.attemptFieldGoal();const clock=h.game.clock;
 h.engine.attemptFieldGoal();assert.equal(h.game.clock,clock);h.hud.continueResult();assert.equal(h.game.possession,'player');
 h.step(401);h.hud.continueResult();assert.equal(h.game.possession,'cpu');
});
await test('CPU touchdown recap reports the actual scoring distance',async h=>{
 h.engine.startNewGame();h.setRandom(0.2);h.engine.startOpponentPossession(76,'Turnover');
 assert.match(h.game.message,/touchdown/);assert.match(h.game.message,/24 yards/);
});
await test('turnover HUD has a possession label and one yard is singular',async h=>{
 h.engine.startNewGame();h.engine.startPlayerDrive(20);h.engine.endPlay(1,'Run');assert.match(h.game.message,/1 yard\./);
 h.engine.initPlay();h.game.down=4;h.engine.endPlay(0,'INCOMPLETE');assert.match(h.element('hud-down').innerHTML,/Turnover/);
});
await test('a defender two yards away cannot end the play',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.engine.onSnap();h.game.carrierSince=h.now-2000;
 const runner=h.entities.players.wr1;h.entities.ballCarrier=runner;Object.assign(runner,{x:150,yfield:30*28});
 const {DEF}=await h.load('src/state/constants.js');
 const defenders=[...['cb1','cb2','s1','lb1','dl1','dl2','dl3','dl4'].map(k=>h.entities.players[k]),...h.entities.decor.filter(d=>d.team===DEF)];
 defenders.forEach(d=>Object.assign(d,{x:300,yfield:10*28,state:'released'}));
 Object.assign(defenders[0],{x:150,yfield:runner.yfield+56});h.step();h.step();assert.equal(h.game.phase,'live');assert.notEqual(runner.action,'tackled');
});
await test('dives move physically, miss a cut, and detect swept contact',async h=>{
 const c=await h.load('src/simulation/contact.js');
 const d={x:0,yfield:0},runner={x:0,yfield:40};assert.equal(c.startDive(d,runner,1000),true);assert.equal(d.facing,'left');
 assert.equal(c.touching(d,runner),false);assert.equal(c.advanceDive(d,runner,0.05,1050),false);assert.equal(d.yfield,12.5);
 runner.x=50;assert.equal(c.advanceDive(d,runner,0.13,1180),false);assert.equal(d.x,0);
 const other={x:0,yfield:0};c.startDive(other,{x:0,yfield:40},1000);assert.equal(c.advanceDive(other,{x:0,yfield:40},0.18,1180),true);
 assert.equal(c.touching(other,{x:0,yfield:40}),true);
});
await test('catch pursuit releases linemen and activates every extra defender',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.engine.onSnap();h.game.carrierSince=h.now-2000;
 h.entities.ballCarrier=h.entities.players.wr1;h.entities.ballCarrier.yfield=40*28;
 h.entities.players.dl1.state='engaged';h.step();h.step();assert.equal(h.entities.players.dl1.state,'released');
 const {DEF}=await h.load('src/state/constants.js');assert.ok(h.entities.decor.filter(d=>d.team===DEF).every(d=>d.isPursuing));
});
await test('in-bounds runoff is eight seconds; incompletions and sidelines stop it',async h=>{
 for(const [label,oob,expected] of [['Catch',false,92],['INCOMPLETE',false,100],['Run',true,100]]){
  h.engine.startNewGame();h.engine.startPlayerDrive(20);h.game.clock=100;h.engine.endPlay(label==='INCOMPLETE'?0:3,label,oob);assert.equal(h.game.clock,expected);
 }
});
await test('accurate open catches are repeatable, while misses and pressure stay distinct',async h=>{
 const {catchOutcome}=await h.load('src/simulation/receiving.js');
 for(const roll of [0,0.1,0.5,0.97,0.999])assert.equal(catchOutcome({error:5,tolerance:30},roll),'catch');
 assert.equal(catchOutcome({error:40,tolerance:30},0),'miss');
 assert.equal(catchOutcome({error:29,tolerance:30},0.999),'drop');
 assert.equal(catchOutcome({error:5,tolerance:30,defenderDistance:10,ballDefenderDistance:10},0.9),'breakup');
 assert.equal(catchOutcome({error:5,tolerance:30,defenderDistance:10,ballDefenderDistance:10},0.01),'interception');
});
for(const fallen of [false,true])await test('nearby unassigned defender '+(fallen?'cannot contest while down':'can break up a pass'),async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.engine.onSnap();
 const receiver=h.entities.players.wr1;Object.assign(receiver,{x:150,yfield:35*28});
 const {DEF}=await h.load('src/state/constants.js');
 const all=[...['cb1','cb2','s1','lb1','dl1','dl2','dl3','dl4'].map(k=>h.entities.players[k]),...h.entities.decor.filter(d=>d.team===DEF)];
 all.forEach(d=>Object.assign(d,{x:300,yfield:10*28}));
 const extra=all.at(-1);Object.assign(extra,{x:150,yfield:35*28,missedUntil:fallen?h.now+2000:0});
 h.entities.ball={inFlight:true,toX:150,toY:35*28,startTime:h.now-1000,duration:100};h.game.thrown=true;h.setRandom(0.9);h.step();
 if(fallen)assert.equal(h.entities.ballCarrier,receiver);else assert.match(h.game.message,/broken up/);
});
await test('receiver adjustment moves toward a reachable pass at normal route speed',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.engine.onSnap();h.step();
 const receiver=h.entities.players.wr1;Object.assign(receiver,{x:150,yfield:35*28});
 h.entities.ball={inFlight:true,toX:180,toY:35*28,startTime:h.now-100,duration:450,targetKey:'wr1'};h.game.thrown=true;
 h.step(50);assert.ok(receiver.x>150&&receiver.x<158);assert.equal(receiver.yfield,35*28);
});
await test('nearby offensive player blocks briefly after a catch',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.engine.onSnap();h.game.carrierSince=h.now-2000;
 h.entities.ballCarrier=h.entities.players.wr1;Object.assign(h.entities.ballCarrier,{x:150,yfield:35*28});
 Object.assign(h.entities.players.wr2,{x:190,yfield:37*28});Object.assign(h.entities.players.cb2,{x:190,yfield:37*28});
 h.step();assert.ok(h.entities.players.cb2.blockedUntil>h.now);assert.ok(h.entities.players.cb2.blockedUntil<=h.now+550);assert.equal(h.entities.players.wr2.isBlocking,true);
});
await test('handoffs preserve defensive line engagement and release',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_inside');h.engine.onSnap();
 h.game.snapTime=h.now-2000;h.game.carrierSince=h.now-2000;h.game.runActive=true;h.entities.runExchange=null;
 h.entities.ballCarrier=h.entities.players.rb;Object.assign(h.entities.ballCarrier,{x:30,yfield:50*28});
 const dl=h.entities.players.dl1;Object.assign(dl,{x:dl.blockerX,yfield:h.game.centerYfield+3,state:'approach'});
 h.step();h.step(50);assert.equal(dl.state,'engaged');
 dl.engageDur=0;h.step(50);assert.equal(dl.state,'released');
});
await test('stick input is radial and its thumb stays inside the ring',async h=>{
 const {stickVector,STICK_TRAVEL,STICK_RADIUS}=await h.load('src/input/runnerControls.js');
 for(const point of [{x:1000,y:1000},{x:-1000,y:0},{x:0,y:1000}]){
  const v=stickVector({x:0,y:0},point);assert.ok(Math.hypot(v.x,v.y)<=1.00001);assert.ok(Math.hypot(v.x*STICK_TRAVEL,v.y*STICK_TRAVEL)+9<=STICK_RADIUS+0.001);
 }
});
await test('jukes move smoothly, have a shared cooldown, and reject paused or airborne input',async h=>{
 const c=await h.load('src/input/runnerControls.js');
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.engine.onSnap();h.game.thrown=true;h.entities.ballCarrier=h.entities.players.wr1;
 assert.equal(c.requestJuke(-1),true);assert.equal(c.requestJuke(1),false);
 const runner=h.entities.ballCarrier,start=runner.juke.start;
 assert.equal(c.jukeStep(runner,start),0);const half=c.jukeStep(runner,start+90),end=c.jukeStep(runner,start+180);
 assert.equal(half,-18);assert.equal(end,-18);assert.equal(runner.juke,null);
 runner.jukeReadyAt=0;h.game.paused=true;assert.equal(c.requestJuke(1),false);h.game.paused=false;h.entities.ball.inFlight=true;assert.equal(c.requestJuke(1),false);
});
await test('easy tackles telegraph longer without gaining extra lunge distance',async h=>{
 const c=await h.load('src/simulation/contact.js'),{DIFFICULTIES}=await h.load('src/state/difficulty.js');
 assert.ok(DIFFICULTIES.easy.diveWindup>DIFFICULTIES.hard.diveWindup);
 for(const difficulty of ['easy','medium','hard']){
  const timing=DIFFICULTIES[difficulty],d={x:0,yfield:0},runner={x:0,yfield:40};
  c.startDive(d,runner,1000,timing);c.advanceDive(d,{x:100,yfield:40},timing.diveWindup/1000,1000+timing.diveWindup);
  assert.equal(d.yfield,0);c.advanceDive(d,{x:100,yfield:40},timing.diveDuration/1000,d.dive.until);assert.ok(Math.abs(d.yfield-45)<0.001);
 }
});
const f=createFranchise();const [a,b]=f.teams;a.record.wins=10;a.record.losses=1;b.record.wins=1;b.record.losses=10;b.record.pointsFor=200;
assert.ok(standings(f).indexOf(a)<standings(f).indexOf(b));
const bos=f.teams.find(t=>t.id==='bos'),dal=f.teams.find(t=>t.id==='dal');assert.notEqual(contrastingOpponent(bos,dal).colors.primary,dal.colors.primary);assert.equal(dal.colors.primary,'#234a72');

await test('all 18 plays still resolve on all four difficulties',async h=>{
 const {PLAYS}=await h.load('src/data/plays.js');
 for(const difficulty of ['easy','medium','hard','gridiron'])for(const [key,play] of Object.entries(PLAYS)){
  h.engine.startPractice();h.game.difficulty=difficulty;h.engine.choosePlay(key);
  if(play.type==='run')h.engine.startRunOption();else{h.engine.onSnap();h.engine.releaseThrow({x:300,y:120});}
  let steps=0;while(['live','tackle'].includes(h.game.phase)&&steps++<1200)h.step(50);
  assert.equal(h.game.phase,'result',key+' '+difficulty);
 }
});

await test('a second pointer cannot steal aim or cancel the primary gesture',async h=>{
 await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');
 h.event('pointerdown');const before={...h.interaction.aimTarget};
 h.event('pointerdown',{pointerId:2,clientX:100,clientY:100});h.event('pointermove',{pointerId:2,clientX:100,clientY:100});
 h.event('pointercancel',{pointerId:2});assert.equal(h.interaction.aiming,true);assert.equal(h.interaction.aimTarget.x,before.x);assert.equal(h.interaction.aimTarget.y,before.y);
 h.event('pointercancel');assert.equal(h.interaction.aiming,false);
});
await test('a paused throw cannot be released by a delayed pointer-up',async h=>{
 h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();h.game.paused=true;
 h.engine.releaseThrow({x:100,y:39});assert.equal(h.game.thrown,false);
});

await test('drag from the RB on a pass play stays a pass, but a tap hands off',async h=>{
 await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');
 const {toCanvas}=await h.load('src/rendering/players.js');let p=toCanvas(h.entities.players.rb);
 h.event('pointerdown',{clientX:p.cx,clientY:p.cy});assert.equal(h.game.phase,'presnap');
 h.event('pointermove',{clientX:p.cx+90,clientY:p.cy});assert.equal(h.interaction.aiming,true);assert.equal(h.game.runActive,false);
 h.event('pointerup',{clientX:p.cx+90,clientY:p.cy});assert.equal(h.game.playFacts.threw,true);assert.equal(h.game.runActive,false);
 h.engine.initPlay();h.engine.choosePlay('trips_slants');p=toCanvas(h.entities.players.rb);
 h.event('pointerdown',{clientX:p.cx,clientY:p.cy});h.event('pointerup',{clientX:p.cx,clientY:p.cy});assert.equal(h.game.runActive,true);
});
await test('cancelled or paused RB taps cannot snap a run',async h=>{
 await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');
 const {toCanvas}=await h.load('src/rendering/players.js'),p=toCanvas(h.entities.players.rb);
 h.event('pointerdown',{clientX:p.cx,clientY:p.cy});h.event('pointercancel');h.event('pointerup');assert.equal(h.game.phase,'presnap');
 h.event('pointerdown',{clientX:p.cx,clientY:p.cy});h.game.paused=true;h.event('pointerup');assert.equal(h.game.runActive,false);
});
await test('route turns spend distance without overshoot and prediction leaves players unchanged',async h=>{
 const {advanceRoute,passingRead}=await h.load('src/simulation/passing.js');
 const p={x:0,yfield:0,routeIdx:0},route=[{x:10,y:0},{x:10,y:1}];advanceRoute(p,route,20,1,0);assert.equal(p.x,10);assert.equal(p.yfield,10);
 const q={x:0,yfield:0,routeIdx:0};for(let i=0;i<20;i++)advanceRoute(q,route,20,.05,0);assert.equal(q.x,p.x);assert.equal(q.yfield,p.yfield);
 h.engine.startPractice();h.engine.choosePlay('trips_verticals');
 const {PLAYS}=await h.load('src/data/plays.js'),{currentDiff}=await h.load('src/state/difficulty.js');
 const before=JSON.stringify(h.entities.players),r=h.entities.players.wr1;
 const read=passingRead({players:h.entities.players,play:PLAYS.trips_verticals,los:h.game.los,elapsed:0,landing:{x:r.x,yfield:r.yfield+160},kind:'lob',difficulty:currentDiff()});
 assert.equal(JSON.stringify(h.entities.players),before);assert.ok(read.target.predicted.yfield>r.yfield);assert.ok(read.duration>0);
});
await test('routine results keep the field clear while scoring remains a full result',async h=>{
 h.hud.showResult('Catch for 7 yards.',()=>{});assert.ok(h.element('result-overlay').classList.contains('compact-result'));
 h.hud.showResult('TOUCHDOWN!\nExtra point is good.',()=>{});assert.equal(h.element('result-overlay').classList.contains('compact-result'),false);
});

console.log(`${checks+2} gameplay/league checks passed.`);

await test('stalled frames match normal movement, clock and ball flight',async h=>{
 const other=await harness();
 for(const x of [h,other]){x.engine.startNewGame();x.engine.startPlayerDrive(20);x.engine.choosePlay('trips_verticals');x.engine.onSnap();x.engine.releaseThrow({x:100,y:39});}
 for(let i=0;i<62;i++)h.step(16);h.step(8);other.step(1000);
 assert.equal(h.game.clock,other.game.clock);
 assert.equal(h.entities.players.wr1.yfield,other.entities.players.wr1.yfield);
 assert.equal(h.entities.ball.inFlight,other.entities.ball.inFlight);
 const clock=await other.load('src/state/clock.js');const before=clock.simulationNow();other.step(60000);
 assert.equal(clock.simulationNow()-before,1000);
});
await test('cancelled tap is discarded; completed tap survives capture release',async h=>{
 await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');h.game.passMode='tap';
 h.event('pointerdown',{clientX:565,clientY:39});h.event('pointercancel');h.step(250);assert.equal(h.game.thrown,false);
 h.engine.startPractice();h.engine.choosePlay('trips_slants');h.event('pointerdown',{clientX:565,clientY:39});h.event('pointerup');h.event('lostpointercapture');h.step(250);assert.equal(h.game.thrown,true);
});
await test('queued field taps retain world destination on resize',async h=>{
 await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');h.game.passMode='tap';
 h.event('pointerdown',{clientX:100,clientY:150});const target=h.entities.pendingTapThrow.target;
 const viewport=await h.load('src/rendering/viewport.js');viewport.fitFieldViewport(1200,380);assert.equal(target.x,500);
});
await test('device controls override stale career checkpoint preferences',async h=>{
 h.engine.startNewGame({career:true});const saved=h.engine.getCheckpoint({type:'offense'});
 h.game.passMode='direct';h.game.throwType='bullet';h.game.showRoutes=false;
 const prefs=await h.load('src/state/preferences.js');assert.ok(prefs.saveControlPreferences(h.game));
 h.engine.restoreCheckpoint(saved);assert.equal(h.game.passMode,'direct');assert.equal(h.game.throwType,'bullet');assert.equal(h.game.showRoutes,false);
});
await test('supporting receiver keeps legacy identity and every lineup number is unique',async h=>{
 h.engine.startPractice();assert.equal(h.entities.players.wr3.playerId,'bos-generic-15');
 const {OFF,DEF,DL_KEYS}=await h.load('src/state/constants.js');
 for(const [keys,side] of [[['qb','rb','wr1','wr2','wr3','te'],OFF],[['cb1','cb2','s1','lb1',...DL_KEYS],DEF]]){
  const numbers=[...keys.map(k=>h.entities.players[k].num),...h.entities.decor.filter(p=>p.team===side).map(p=>p.num)];assert.equal(new Set(numbers).size,numbers.length);
 }
});
await test('skill blocks require contact and delayed routes release after their chip',async h=>{
 h.engine.startPractice();h.engine.choosePlay('ace_levels');h.engine.onSnap();
 const chip=h.entities.players.wr3;h.step(100);assert.equal(chip.isBlocking,true);const start=chip.yfield;h.step(400);assert.equal(chip.isBlocking,false);assert.ok(chip.yfield>start);
});
await test('play-action fake keeps QB possession and cancels on an early throw',async h=>{
 h.engine.startPractice();h.engine.choosePlay('ace_pa_cross');h.engine.onSnap();assert.ok(h.entities.playFake);const y=h.entities.players.rb.yfield;h.step(180);assert.notEqual(h.entities.players.rb.yfield,y);assert.equal(h.entities.ballCarrier,h.entities.players.qb);
 h.engine.releaseThrow({x:100,y:39});assert.equal(h.entities.playFake,null);assert.equal(h.game.runActive,false);assert.ok(h.entities.ball.inFlight);
});
