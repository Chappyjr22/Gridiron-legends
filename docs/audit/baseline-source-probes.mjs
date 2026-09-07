// Evidence for the untouched db4bbf7 audit baseline, not a regression suite.
// These probes ASSERT the observed defects. They should change or be retired
// when the corresponding fixed-behavior regression tests are implemented.
// Executes the original modules in Node. Rendering/DOM are stubs, no browser
// is launched, and localStorage exists only in a disposable in-memory Map.
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
async function harness(){
  let now=1000, frame, random=0.99;
  const elements=new Map(), storage=new Map();
  function element(id){
    if(elements.has(id))return elements.get(id);
    const classes=new Set(),events={};
    const e={id,events,children:[],style:{setProperty(){}},dataset:{},value:'',innerHTML:'',textContent:'',width:800,height:380,
      classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);},toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x);}},
      addEventListener(type,fn){(events[type]??=[]).push(fn);},appendChild(child){this.children.push(child);},insertBefore(child){this.children.push(child);},
      setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:800,height:380};},focus(){},select(){},getContext(){return {};}};
    elements.set(id,e);return e;
  }
  const document={getElementById:element,querySelectorAll(){return [];},createElement(type){return element(type+elements.size);},addEventListener(){}};
  const math=Object.create(Math);math.random=()=>random;
  const context=vm.createContext({console,document,Math:math,Date,performance:{now:()=>now},requestAnimationFrame:cb=>{frame=cb;},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},navigator:{}});
  const cache=new Map();
  const stubs={
    'src/rendering/draw.js':`export function draw(){}`,
    'src/rendering/canvas.js':`export const canvas=document.getElementById('field'),ctx={};`,
    'src/rendering/players.js':`import {game} from '../state/gameState.js'; import {XPX,BASE_X} from '../state/constants.js'; export function toCanvas(e){return {cx:BASE_X-(e.yfield-game.cameraYard*XPX),cy:e.x};}`,
    'src/rendering/spriteSheets.js':`export function applyUniform(){} export function rebuildSpriteSheets(){}`,
    'src/rendering/field.js':`export const END_ZONE_STYLE={near:{},far:{}};`
  };
  async function getModule(file){
    if(cache.has(file))return cache.get(file);
    const rel=path.relative(root,file);
    const promise=(async()=>new vm.SourceTextModule(stubs[rel]??await fs.readFile(file,'utf8'),{context,identifier:file}))();
    cache.set(file,promise);return promise;
  }
  async function load(rel){
    const mod=await getModule(path.join(root,rel));
    if(mod.status==='unlinked')await mod.link((spec,parent)=>getModule(path.resolve(path.dirname(parent.identifier),spec)));
    if(mod.status!=='evaluated')await mod.evaluate();
    return mod.namespace;
  }
  const engine=await load('src/simulation/engine.js');
  const state=await load('src/state/gameState.js');
  const hud=await load('src/ui/hud.js');
  const interaction=(await load('src/input/interactionState.js')).interaction;
  const editState=(await load('src/input/editState.js')).editState;
  engine.ensureLoopStarted();
  function step(ms=16){now+=ms;const cb=frame;frame=null;assert.ok(cb);cb(now);}
  function click(id){for(const fn of element(id).events.click??[])fn({target:element(id)});}
  function event(type,props={}){for(const fn of element('field').events[type]??[])fn({pointerId:1,clientX:615,clientY:191,...props});}
  return {...state,engine,hud,interaction,editState,load,step,click,event,element,setRandom(v){random=v;},get now(){return now;}};
}
const results=[];
async function probe(id,fn){const h=await harness();const evidence=await fn(h);results.push({id,evidence});if(!process.argv.includes('--json'))console.log(id,JSON.stringify(evidence));}
await probe('AUD-001',async h=>{
  h.engine.startPractice();h.engine.choosePlay('trips_verticals');h.engine.onSnap();
  h.engine.releaseThrow({x:120,y:39});h.step();
  const before={flight:h.entities.ball.inFlight,start:h.entities.ball.startTime,duration:h.entities.ball.duration};
  h.game.paused=true;h.step(10000);
  const during=h.entities.ball.inFlight;
  h.game.paused=false;h.step();
  assert.equal(before.flight,true);assert.equal(during,true);assert.equal(h.entities.ball.inFlight,false);
  return {before,flightWhilePaused:during,flightAfter16msResume:h.entities.ball.inFlight,phase:h.game.phase,message:h.game.message};
});
await probe('AUD-002',async h=>{
  h.engine.startNewGame();h.engine.startPlayerDrive(93);h.engine.choosePlay('trips_inside');
  h.game.phase='live';h.game.runActive=true;h.game.thrown=true;h.game.carrierSince=h.now-2000;
  h.entities.ballCarrier=h.entities.players.rb;h.entities.ballCarrier.x=190;h.entities.ballCarrier.yfield=99.6*28;
  h.entities.players.cb1.x=190;h.entities.players.cb1.yfield=99.6*28;
  h.step();assert.equal(h.game.phase,'tackle');
  const spot=h.game.tackle.carrier.yfield/28;
  h.step(801);
  assert.ok(spot<100);assert.equal(h.game.playerScore,6);
  return {tackleSpot:spot,score:h.game.playerScore,message:h.game.message};
});
await probe('AUD-003',async h=>{
  h.engine.startNewGame();h.engine.startPlayerDrive(90);h.engine.choosePlay('trips_verticals');h.engine.onSnap();
  h.entities.players.wr1.x=39;h.entities.players.wr1.yfield=111*28;
  h.entities.ball={inFlight:true,toX:39,toY:111*28,startTime:h.now-1000,duration:100};h.game.thrown=true;
  h.step();assert.equal(h.game.playerScore,6);
  return {receiverSpot:h.entities.players.wr1.yfield/28,score:h.game.playerScore,message:h.game.message};
});
await probe('AUD-004',async h=>{
  h.engine.startNewGame();h.engine.startPlayerDrive(20);h.engine.choosePlay('trips_verticals');h.engine.onSnap();
  h.entities.players.wr1.x=354;h.entities.players.wr1.yfield=25*28;
  h.entities.ball={inFlight:true,toX:354,toY:25*28,startTime:h.now-1000,duration:100};h.game.thrown=true;
  h.step();assert.equal(h.game.los,25);assert.match(h.game.message,/Catch.*out of bounds/);
  return {catchLateralPosition:354,declaredSidelineMaximum:347,newLOS:h.game.los,message:h.game.message};
});
await probe('AUD-005',async h=>{
  await h.load('src/input/pointer.js');
  h.engine.startPractice();h.editState.editMode=true;
  h.event('pointerdown');assert.ok(h.editState.dragEntity);
  h.event('pointercancel');const stillSelected=!!h.editState.dragEntity;
  const before=h.entities.players.qb.x;h.event('pointermove',{clientX:650,clientY:150});
  assert.equal(stillSelected,true);assert.notEqual(h.entities.players.qb.x,before);
  return {stillSelectedAfterCancel:stillSelected,lateralBefore:before,lateralAfterUnpressedMove:h.entities.players.qb.x};
});
await probe('AUD-006',async h=>{
  const hub=await h.load('src/ui/leagueHub.js');hub.renderLeagueSchedule();
  const html=h.element('league-schedule-list').innerHTML;
  assert.ok(html.includes('BOS'));assert.ok(!html.includes('user-game'));
  return {selectedTeam:h.game.userTeamId,selectedTeamPresent:html.includes('BOS'),highlightedRows:(html.match(/user-game/g)||[]).length};
});
await probe('AUD-007',async h=>{
  h.engine.startPractice();h.game.passMode='tap';h.engine.choosePlay('ace_stick');
  const hint=h.element('presnap-hint').innerHTML;assert.match(hint,/Drag from QB/);
  return {passMode:h.game.passMode,hint};
});
await probe('AUD-008',async h=>{
  h.engine.startNewGame();h.engine.startPlayerDrive(30);h.game.down=4;h.game.distance=5;
  h.engine.attemptFieldGoal();const once=h.game.clock;
  h.engine.attemptFieldGoal();const twice=h.game.clock;
  assert.equal(once-twice,5);
  return {phaseAfterFirst:'result',clockAfterFirst:once,clockAfterSecond:twice,note:'Exported handler lacks phase guard; live UI double activation still needs browser reproduction.'};
});
await probe('COVERAGE-PLAYS',async h=>{
  const {PLAYS}=await h.load('src/data/plays.js');
  const outcomes=[];
  for(const difficulty of ['easy','medium','hard','gridiron']){
    for(const [key,play] of Object.entries(PLAYS)){
      h.setRandom(0.99);h.engine.startPractice();h.game.difficulty=difficulty;h.engine.choosePlay(key);
      if(play.type==='run')h.engine.startRunOption();
      else {h.engine.onSnap();h.engine.releaseThrow({x:300,y:120});}
      let steps=0;
      while(h.game.phase==='live'||h.game.phase==='tackle'){
        h.step(50);if(++steps>1200)throw Error('Unresolved '+key+' '+difficulty);
      }
      assert.equal(h.game.phase,'result');
      for(const entity of Object.values(h.entities.players)){assert.ok(Number.isFinite(entity.x));assert.ok(Number.isFinite(entity.yfield));}
      outcomes.push({difficulty,play:key,phase:h.game.phase,message:h.game.message});
    }
  }
  return {count:outcomes.length,note:'Fixed-input source executions only. Not browser play, route accuracy, balance or visual verification.',outcomes};
});
await probe('COVERAGE-RULE-FLOW',async h=>{
  h.engine.startNewGame();h.engine.startPlayerDrive(20);h.game.clock=180;
  for(let i=0;i<3;i++){h.engine.endPlay(0,'INCOMPLETE');h.hud.resultFlow.continueAction();}
  assert.equal(h.game.down,4);assert.equal(h.game.phase,'decision');
  h.engine.simulatePunt();assert.match(h.game.message,/Punt travels/);h.hud.resultFlow.continueAction();assert.equal(h.game.possession,'cpu');
  const puntMessage=h.game.message;
  h.hud.resultFlow.continueAction();assert.equal(h.game.possession,'player');
  h.game.quarter=1;h.game.clock=0;h.engine.endPlay(0,'INCOMPLETE');h.hud.resultFlow.continueAction();assert.equal(h.game.quarter,2);assert.match(h.game.message,/End of the 1st/);
  const quarter=h.game.message;
  h.game.quarter=2;h.game.clock=0;h.game.secondHalfReceiver='player';h.engine.endPlay(0,'INCOMPLETE');h.hud.resultFlow.continueAction();assert.equal(h.game.quarter,3);assert.match(h.game.message,/HALFTIME/);
  const halftime=h.game.message;
  h.engine.startPlayerDrive(20);h.game.quarter=4;h.game.clock=0;h.game.playerScore=0;h.game.cpuScore=0;
  h.engine.endPlay(0,'INCOMPLETE');h.hud.resultFlow.continueAction();assert.equal(h.game.overtime,true);assert.equal(h.game.otRound,1);
  const overtime=h.game.message;
  h.hud.resultFlow.continueAction();h.engine.simulatePunt();h.hud.resultFlow.continueAction();h.hud.resultFlow.continueAction();
  assert.equal(h.game.otRound,2);assert.match(h.game.message,/Overtime remains tied/);
  return {fourthDown:true,puntMessage,quarter,halftime,overtime,nextOvertimeRound:h.game.otRound,note:'Source callbacks in an isolated Node context, no browser interaction.'};
});
await probe('COVERAGE-BROKEN-TACKLE',async h=>{
  h.engine.startPractice();h.engine.choosePlay('trips_inside');h.engine.startRunOption();h.step(150);
  const rb=h.entities.players.rb,cb=h.entities.players.cb1;
  h.game.carrierSince=h.now-1000;h.entities.runExchange=null;h.entities.ballCarrier=rb;rb.x=100;rb.yfield=40*28;cb.x=100;cb.yfield=40*28;
  for(const [key,e] of Object.entries(h.entities.players))if(key!== 'rb'&&key!=='cb1'&&key!=='qb'){e.x=340;e.yfield=20*28;}
  h.setRandom(0);h.step(16);
  assert.equal(cb.action,'missedTackle');assert.equal(h.game.phase,'live');assert.ok(rb.breakSlowUntil>h.now);assert.equal(h.entities.breakCooldown,0.45);
  return {phase:h.game.phase,tacklerAction:cb.action,recoveryMs:cb.missedUntil-h.now,slowMs:rb.breakSlowUntil-h.now,cooldown:h.entities.breakCooldown};
});
if(process.argv.includes('--json'))console.log(JSON.stringify({kind:'Node source-only, browser rendering stubbed',base:'db4bbf79bf11b161283a50b660cac73f025f6110',results},null,2));
