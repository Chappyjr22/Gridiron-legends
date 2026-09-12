import assert from 'node:assert/strict';
import {harness} from '../../../tests/helpers/engine.mjs';
import {createCareer,parseCareer,nextMatch} from '../../../src/career/career.js';
import {createFranchise} from '../../../src/state/league.js';
import {simulatedBoxScore} from '../../../src/career/leagueStats.js';
import {recordPlay} from '../../../src/career/stats.js';
const results=[];
{
 const h=await harness();await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');h.game.passMode='tap';
 h.event('pointerdown',{clientX:565,clientY:39});h.event('pointercancel');const pending=!!h.entities.pendingTapThrow;h.step(250);
 results.push({issue:'Cancelled tap still throws',pendingAfterCancel:pending,thrown:h.game.thrown});assert.equal(h.game.thrown,true);
}
{
 const h=await harness();await h.load('src/input/pointer.js');h.engine.startPractice();h.engine.choosePlay('trips_slants');h.game.passMode='tap';
 h.event('pointerdown',{clientX:100,clientY:150});const old=h.entities.pendingTapThrow.target.x;
 const v=await h.load('src/rendering/viewport.js');v.fitFieldViewport(1200,380);
 results.push({issue:'Pending tap point omitted by resize',before:old,after:h.entities.pendingTapThrow.target.x,newAnchor:(await h.load('src/state/constants.js')).BASE_X});assert.equal(h.entities.pendingTapThrow.target.x,old);
}
{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(20);h.engine.choosePlay('trips_verticals');h.engine.onSnap();h.step();
 const clock=h.game.clock,r=h.entities.players.wr1,start={x:r.x,y:r.yfield},now=h.now;h.step(1000);
 results.push({issue:'Frame stall advances timers but caps movement/clock',elapsedMs:h.now-now,gameClockSeconds:clock-h.game.clock,receiverDistance:Math.hypot(r.x-start.x,r.yfield-start.y)});
 assert.ok(clock-h.game.clock<.051);
}
{
 const c=createCareer({name:'Audit'});c.activeMatch=nextMatch(c).id;c.checkpoint={game:{},stats:{},resume:{type:'offense'}};
 const accepted=!!parseCareer(JSON.stringify(c));let error;try{recordPlay(c.checkpoint.stats,{id:'1',qbId:c.playerId,threw:true});}catch(e){error=e.message;}
 results.push({issue:'Malformed checkpoint passes backup validation',accepted,error});assert.ok(accepted&&error);
}
{
 const team=createFranchise('bos').teams[0],id=team.roster.find(p=>p.slot==='QB').id;let sample;
 for(let i=0;i<10000;i++){const s=simulatedBoxScore(team,[0],String(i))[id];if(s.completions+s.interceptions>s.attempts){sample={seed:String(i),attempts:s.attempts,completions:s.completions,interceptions:s.interceptions};break;}}
 results.push({issue:'Simulated QB can have 100% completions and an INT',...sample});assert.ok(sample);
}
console.log(JSON.stringify(results,null,2));
{
 const h=await harness();h.engine.startNewGame();h.engine.startPlayerDrive(20);h.engine.choosePlay('trips_mesh');
 const slot=h.entities.players.wr3;
 console.log(JSON.stringify({issue:'Playable slot receiver absent from roster',id:slot.playerId,number:slot.num,rosterContains:h.teamState.userTeam.roster.some(p=>p.id===slot.playerId)}));
 assert.equal(h.teamState.userTeam.roster.some(p=>p.id===slot.playerId),false);
}
{
 const h=await harness();h.engine.startPractice();const {OFF}=await h.load('src/state/constants.js');
 const offense=[...['qb','rb','wr1','wr2','wr3','te'].map(k=>h.entities.players[k]),...h.entities.decor.filter(p=>p.team===OFF)];
 const nums=offense.map(p=>String(p.num)),duplicates=[...new Set(nums.filter((n,i)=>nums.indexOf(n)!==i))];
 console.log(JSON.stringify({issue:'Duplicate offensive jersey numbers',team:h.teamState.userTeam.abbr,duplicates,numbers:nums}));assert.ok(duplicates.length);
}
