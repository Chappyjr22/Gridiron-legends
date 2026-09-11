import assert from 'node:assert/strict';
import * as C from '../src/career/career.js';
import {emptyStats,emptyMatch,recordPlay} from '../src/career/stats.js';
import {harness} from './helpers/engine.mjs';
const storage=new Map([['gridironLegendsFranchiseV1','legacy-exhibition']]);
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
let c=C.createCareer({name:'Rookie Legend',number:7,teamId:'bos',archetype:'precision'});
const id=c.playerId,p=C.careerPlayer(c);assert.equal(p.attributes.accuracy,82);assert.equal(p.firstName,'Rookie');
const match=emptyMatch(),base={id:'1',qbId:id,threw:true,receiverId:'receiver',targetId:'receiver',yards:25,touchdown:true};
assert.equal(recordPlay(match,base),true);assert.equal(recordPlay(match,base),false);assert.equal(match.players[id].attempts,1);assert.equal(match.players[id].passingTD,1);
recordPlay(match,{id:'2',qbId:id,sacked:true,yards:-4});assert.equal(match.players[id].attempts,1);assert.equal(match.players[id].sacks,1);
for(let week=1;week<=3;week++){
 const g=C.nextMatch(c);assert.equal(g.week,week);c.activeMatch=g.id;
 assert.ok(C.completeCareerGame(c,g.id,21,7,match));const xp=c.xp,history=c.history.length;
 assert.equal(C.completeCareerGame(c,g.id,21,7,match),false);assert.equal(c.xp,xp);assert.equal(c.history.length,history);
 assert.equal(c.league.week,week+1);assert.equal(c.league.completedGames.length,16*week);
 assert.ok(C.saveCareer(c));c=C.loadCareer();assert.equal(c.playerId,id);
}
assert.equal(c.totals.games,3);assert.equal(storage.get('gridironLegendsFranchiseV1'),'legacy-exhibition');
assert.ok(c.points>0);const before=C.careerPlayer(c).attributes.accuracy;assert.ok(C.upgrade(c,'accuracy'));assert.equal(C.careerPlayer(c).attributes.accuracy,before+2);
c.activeMatch=C.nextMatch(c).id;assert.equal(C.upgrade(c,'arm'),false);c.activeMatch=null;
// A full winning season reaches all three playoff rounds and preserves identity next season.
while(!c.postseason?.champion){const g=C.nextMatch(c);assert.ok(g);c.activeMatch=g.id;assert.ok(C.completeCareerGame(c,g.id,28,7,emptyMatch()));}
assert.equal(c.postseason.champion,c.teamId);assert.equal(c.history.length,20);assert.equal(c.awards.filter(a=>a.title==='League champion').length,1);assert.equal(c.awards.filter(a=>a.title==='Rookie debut').length,1);
const lifetime=c.totals.games,attrs={...C.careerPlayer(c).attributes};assert.ok(C.startNextSeason(c));assert.equal(c.league.season,2);assert.equal(c.league.week,1);assert.equal(c.playerId,id);assert.equal(c.totals.games,lifetime);assert.equal(c.seasonStats.games,0);assert.deepEqual(C.careerPlayer(c).attributes,attrs);
// A losing season still resolves the bracket and permits another season.
const losing=C.createCareer({name:'Second Player',teamId:'dal'});for(let i=0;i<17;i++){const g=C.nextMatch(losing);losing.activeMatch=g.id;C.completeCareerGame(losing,g.id,0,42,emptyMatch());}
assert.ok(losing.postseason.champion);assert.ok(C.startNextSeason(losing));
// Exercise actual engine outcome accounting and reload checkpoints, without DOM rendering.
const h=await harness();let snapshot;
h.uiHooks=h.engine.uiHooks;h.uiHooks.checkpoint=s=>snapshot=s;
h.game.cpuTeamId='dal';h.engine.startNewGame({career:true});
assert.equal(snapshot.resume.type,'kickoff');h.engine.startPlayerDrive(25);h.engine.choosePlay('trips_slants');h.engine.onSnap();h.engine.releaseThrow({x:300,y:39});
h.game.playFacts.receiverId=h.entities.players.wr1.playerId;h.game.playFacts.targetId=h.entities.players.wr1.playerId;
h.engine.endPlay(12,'Catch',false,37);assert.equal(snapshot.resume.type,'afterPlay');assert.equal(snapshot.game.los,37);
const saved=JSON.parse(JSON.stringify(snapshot));h.engine.restoreCheckpoint(saved);assert.equal(h.game.los,37);assert.equal(h.engine.matchState.stats.plays.length,1);
h.hud.resultFlow.continueAction();assert.equal(h.game.phase,'callsheet');assert.equal(h.game.down,1);
h.game.down=4;h.hud.showFourthDown();h.engine.simulatePunt();const punt=JSON.parse(JSON.stringify(snapshot));assert.equal(punt.resume.type,'turnover');
h.engine.restoreCheckpoint(punt);h.hud.resultFlow.continueAction();assert.equal(snapshot.resume.type,'cpuResult');const cpu=JSON.parse(JSON.stringify(snapshot));
const score=cpu.game.cpuScore;h.engine.restoreCheckpoint(cpu);h.hud.resultFlow.continueAction();assert.equal(h.game.cpuScore,score);assert.equal(h.game.possession,'player');
// Attributes drive actual ball velocity and windup, independently of overall rating.
function throwWith(arm,release){h.engine.startPlayerDrive(20);h.engine.choosePlay('trips_verticals');h.entities.players.qb.attributes={accuracy:94,arm,release};h.engine.onSnap();h.engine.releaseThrow({x:100,y:39});return {...h.entities.ball};}
const slow=throwWith(60,60),fast=throwWith(90,90);assert.ok(fast.duration<slow.duration);assert.ok(fast.startTime<slow.startTime);
console.log('Career checks passed: stats, duplicate prevention, 3-week reload, upgrades, full winning/losing seasons, checkpoints, and attribute effects.');
// Multiple slots migrate the legacy career, keep checkpoints separate, and survive failed writes.
const {readSlots,writeSlot,SLOTS_KEY}=await import('../src/career/slots.js');
const legacy=C.createCareer({name:'Legacy QB'});delete legacy.careerId;
const bankStore=new Map([[C.CAREER_KEY,JSON.stringify(legacy)]]),mem={getItem:k=>bankStore.get(k)??null,setItem:(k,v)=>bankStore.set(k,v)};
const migrated=readSlots(mem,C.parseCareer,C.CAREER_KEY);assert.equal(Object.keys(migrated.careers).length,1);assert.equal(bankStore.get(C.CAREER_KEY+'.legacyBackup'),JSON.stringify(legacy));
const second=C.createCareer({name:'Separate QB',teamId:'dal',difficulty:'easy'});writeSlot(mem,C.parseCareer,C.CAREER_KEY,second);
let bank=readSlots(mem,C.parseCareer,C.CAREER_KEY);assert.equal(Object.keys(bank.careers).length,2);assert.equal(bank.lastId,second.careerId);assert.equal(bank.careers['legacy-career'].teamId,'bos');
const beforeBank=bankStore.get(SLOTS_KEY);assert.throws(()=>writeSlot({...mem,setItem:()=>{throw Error('Quota');}},C.parseCareer,C.CAREER_KEY,C.createCareer({name:'No space'})));assert.equal(bankStore.get(SLOTS_KEY),beforeBank);
const {simulatedBoxScore,seasonPlayerRows}=await import('../src/career/leagueStats.js');
const team=second.league.teams.find(t=>t.id===second.teamId),box=simulatedBoxScore(team,[7,0,3,6],'fixed');
assert.deepEqual(box,simulatedBoxScore(team,[7,0,3,6],'fixed'));
const qb=box[team.roster.find(p=>p.slot==='QB').id];const values=Object.values(box);
assert.equal(qb.passingYards,values.reduce((sum,s)=>sum+s.receivingYards,0));assert.equal(qb.completions,values.reduce((sum,s)=>sum+s.receptions,0));assert.equal(values.reduce((sum,s)=>sum+s.receivingTD+s.rushingTD,0),2);
assert.equal(seasonPlayerRows(second).covered,0);assert.equal(seasonPlayerRows(second).rows.find(r=>r.player.id===second.playerId).stats,null);
console.log('Slot migration, isolation, failed-write protection and simulated box-score consistency passed.');

{
 const {xpBreakdown,captureMoments,playerGameLog}=await import('../src/career/recap.js');
 assert.equal(xpBreakdown({passingYards:250,passingTD:3},true).reduce((s,x)=>s+x.xp,0),140);
 assert.deepEqual(captureMoments([{yards:3},{yards:25,receiverId:'wr'},{intercepted:true}]).map(m=>m.play),[2,3]);
 const c=C.createCareer({name:'Recap Rookie',teamId:'bos'});
 const match=C.nextMatch(c),wr=c.league.teams.find(t=>t.id===c.teamId).roster.find(p=>p.slot==='WR1');
 c.activeMatch=match.id;
 const raw={players:{[c.playerId]:{passingYards:25,passingTD:1},[wr.id]:{receivingYards:25,receptions:1,targets:1}},plays:[{yards:25,touchdown:true,receiverId:wr.id}]};
 const r=C.completeCareerGame(c,match.id,7,0,raw);
 assert.equal(c.pendingRecapGameId,match.id);
 assert.equal(r.xpBreakdown.reduce((s,x)=>s+x.xp,0),r.xp);
 raw.players[wr.id].receivingYards=999;
 assert.equal(r.playerStats[wr.id].receivingYards,25);
 assert.equal(playerGameLog(c,wr.id)[0].stats.receivingYards,25);
 const before=JSON.stringify(c);assert.equal(C.completeCareerGame(c,match.id,7,0,raw),false);assert.equal(JSON.stringify(c),before);
 const restored=C.parseCareer(JSON.stringify(c));assert.equal(restored.pendingRecapGameId,match.id);
 delete restored.history[0].playerStats;
 assert.equal(playerGameLog(restored,wr.id)[0].stats.receivingYards,25);
 c.league.schedule=[];c.league.season++;assert.equal(playerGameLog(c,wr.id)[0].stats.receivingYards,25);
}

await import('./college.test.mjs');
