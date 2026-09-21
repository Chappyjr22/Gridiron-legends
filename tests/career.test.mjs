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
assert.ok(c.points>0);c.points=2;const before=C.careerPlayer(c).attributes.accuracy;assert.ok(C.upgrade(c,'accuracy'));assert.equal(C.careerPlayer(c).attributes.accuracy,before+2);
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
 assert.equal(xpBreakdown({attempts:25,completions:18,passingYards:250,passingTD:3,interceptions:0},true).reduce((s,x)=>s+x.xp,0),119);
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

{
 const c=C.createCareer({name:'Checkpoint validation'}),m=C.nextMatch(c);c.activeMatch=m.id;
 const h=await harness();h.game.userTeamId=c.teamId;h.game.cpuTeamId=m.homeTeamId===c.teamId?m.awayTeamId:m.homeTeamId;h.engine.startNewGame({career:true});
 c.checkpoint=JSON.parse(JSON.stringify(h.engine.getCheckpoint({type:'offense'})));
 assert.ok(C.parseCareer(JSON.stringify(c)));
 for(const edit of [s=>s.stats={},s=>s.game.clock=null,s=>s.game.cpuTeamId='missing',s=>s.resume={type:'turnover'},s=>s.stats.players={unknown:emptyStats()}]){
  const bad=structuredClone(c);edit(bad.checkpoint);assert.equal(C.parseCareer(JSON.stringify(bad)),null);
 }
 c.checkpoint={game:{},stats:{},resume:{type:'offense'}};assert.equal(C.parseCareer(JSON.stringify(c)),null);
 console.log('Checkpoint imports reject incomplete state and unknown identities.');
}
{
 const c=C.createCareer({name:'Roster stats'}),team=c.league.teams.find(t=>t.id===c.teamId);
 for(let seed=0;seed<1000;seed++){
  const players=simulatedBoxScore(team,[0,7,3,0,6],String(seed)),qb=players[c.playerId];assert.ok(qb.completions+qb.interceptions<=qb.attempts);
  assert.equal(qb.attempts,Object.values(players).reduce((n,s)=>n+s.targets,0));
 }
 const m=C.nextMatch(c);m.status='completed';m.boxScore={players:{[`${team.id}-generic-15`]:{...emptyStats(),receptions:3,receivingYards:42}}};
 const slot=seasonPlayerRows(c).rows.find(r=>r.player.id===`${team.id}-generic-15`);assert.equal(slot.stats.receivingYards,42);
 console.log('Simulated pass outcomes and legacy slot receiver statistics passed.');
}
{
 const c=C.createCareer({name:'Recovery test'}),good=C.createCareer({name:'Unaffected'}),broken=structuredClone(c);broken.activeMatch=C.nextMatch(broken).id;broken.checkpoint={game:{},stats:{},resume:{type:'offense'}};
 const raw=JSON.stringify({version:1,lastId:c.careerId,careers:{[c.careerId]:broken,[good.careerId]:good}}),data=new Map([[SLOTS_KEY,raw]]),store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const bank=readSlots(store,C.parseCareer,C.CAREER_KEY);assert.equal(Object.keys(bank.careers).length,1);assert.equal(bank.lastId,good.careerId);assert.equal(bank.recovery.length,1);assert.equal(data.get(SLOTS_KEY),raw);
 writeSlot(store,C.parseCareer,C.CAREER_KEY,good);assert.deepEqual(JSON.parse(readSlots(store,C.parseCareer,C.CAREER_KEY).recovery[0].raw),broken);
 data.set(SLOTS_KEY,'broken-json');writeSlot(store,C.parseCareer,C.CAREER_KEY,good);assert.equal(readSlots(store,C.parseCareer,C.CAREER_KEY).recovery[0].raw,'broken-json');
 const {opponentBoxScore}=await import('../src/career/leagueStats.js'),team=c.league.teams[1],drives=[{points:7,yards:80,turnover:false},{points:0,yards:22,turnover:true}],box=opponentBoxScore(team,drives,'fixed');
 const qb=box[team.roster.find(p=>p.slot==='QB').id],values=Object.values(box);
 assert.equal(qb.passingYards+values.reduce((n,s)=>n+s.rushingYards,0)-qb.sackYards,102);assert.equal(values.reduce((n,s)=>n+s.receivingTD+s.rushingTD,0),1);assert.equal(qb.interceptions,1);assert.ok(qb.attempts>=qb.completions+qb.interceptions);
 console.log('Save quarantine and opponent drive allocation passed.');
}
{
 const {importSlotArchive}=await import('../src/career/slots.js'),original=C.createCareer({name:'Archive original'}),data=new Map(),store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 writeSlot(store,C.parseCareer,C.CAREER_KEY,original);
 const archive=JSON.stringify({format:'gridiron-all-saved-data-v1',careers:data.get(SLOTS_KEY),legacy:null});
 const result=importSlotArchive(store,C.parseCareer,C.CAREER_KEY,archive);assert.equal(result.count,1);assert.notEqual(result.career.careerId,original.careerId);assert.equal(Object.keys(readSlots(store,C.parseCareer,C.CAREER_KEY).careers).length,2);
 const before=data.get(SLOTS_KEY);assert.throws(()=>importSlotArchive({...store,setItem(){throw Error('Quota');}},C.parseCareer,C.CAREER_KEY,archive));assert.equal(data.get(SLOTS_KEY),before);
 console.log('Full saved-data archives restore as separate careers with atomic writes.');
}

await import("./career-depth.test.mjs");

// Pending extra points are accepted by the persisted career schema.
{
 const c=C.createCareer({name:'PAT Reload'}),match=C.nextMatch(c),h=await harness();
 c.activeMatch=match.id;h.game.userTeamId=c.teamId;h.game.cpuTeamId=match.homeTeamId===c.teamId?match.awayTeamId:match.homeTeamId;
 h.engine.startNewGame({career:true});h.engine.startPlayerDrive(95);h.engine.uiHooks.checkpoint=s=>c.checkpoint=JSON.parse(JSON.stringify(s));
 h.engine.endPlay(5,'Run',false,100);
 assert.equal(c.checkpoint.resume.type,'extraPoint');assert.ok(C.parseCareer(JSON.stringify(c)));
 h.hud.resultFlow.continueAction();assert.ok(C.parseCareer(JSON.stringify(c)));
 const invalid=structuredClone(c);invalid.checkpoint.game.playerScore=0;assert.equal(C.parseCareer(JSON.stringify(invalid)),null);
}

await import("./progression.test.mjs");

// Weekly preparation is saved, locks at kickoff and settles only once per game.
{
 const {choosePreparation,preparationTargets,seasonStakes}=await import('../src/career/weekly.js');
 const {weeklyGoal}=await import('../src/career/development.js');
 for(const schoolId of [null,'bgs']){
  const school=schoolId?(await import('../src/career/collegeData.js')).COLLEGE_TEAMS[0].id:null;
  let c=C.createCareer({name:'Weekly Rookie',schoolId:school});
  const baseline=weeklyGoal(c);assert.equal(choosePreparation(c,'invalid'),false);
  assert.equal(choosePreparation(c,'teammate',c.playerId),false);
  const target=preparationTargets(c)[0],catching=target.attributes.catching;
  assert.ok(choosePreparation(c,'teammate',target.id));
  c=C.parseCareer(JSON.stringify(c));assert.equal(weeklyGoal(c).playerId,target.id);
  const game=C.nextMatch(c);c.activeMatch=game.id;assert.equal(choosePreparation(c,'challenge'),false);
  const stats={players:{[c.playerId]:{...emptyStats(),attempts:6,completions:4,passingYards:60,passingTD:2},[target.id]:{...emptyStats(),receptions:3}},plays:[]};
  const result=C.completeCareerGame(c,game.id,21,7,stats);
  assert.equal(result.goal.xp,0);assert.ok(result.preparationResult.met);
  assert.equal(c.league.teams.find(t=>t.id===c.teamId).roster.find(p=>p.id===target.id).attributes.catching,catching+1);
  const saved=JSON.stringify(c);assert.equal(C.completeCareerGame(c,game.id,21,7,stats),false);assert.equal(JSON.stringify(c),saved);
  assert.notEqual(weeklyGoal(c).kind,'teammate');assert.equal(result.stakes.after.remaining,school?11:16);
  assert.equal(seasonStakes(c).cutoff,school?2:4);
  assert.ok(choosePreparation(c,'challenge'));assert.equal(weeklyGoal(c).xp,Math.round(baseline.xp*1.5));
  const next=C.nextMatch(c);c.activeMatch=next.id;const confidence=c.coachConfidence;
  const challenge=C.completeCareerGame(c,next.id,21,7,stats);assert.ok(challenge.goal.met);assert.equal(c.coachConfidence,confidence+7);
  assert.ok(choosePreparation(c,'challenge'));const failed=C.nextMatch(c);c.activeMatch=failed.id;
  stats.players[c.playerId].interceptions=1;assert.equal(C.completeCareerGame(c,failed.id,21,7,stats).goal.xp,0);
  assert.ok(choosePreparation(c,'teammate',target.id));const missed=C.nextMatch(c);c.activeMatch=missed.id;stats.players[target.id].receptions=2;
  const before=c.league.teams.find(t=>t.id===c.teamId).roster.find(p=>p.id===target.id).attributes.catching;
  assert.equal(C.completeCareerGame(c,missed.id,21,7,stats).preparationResult.met,false);
  assert.equal(c.league.teams.find(t=>t.id===c.teamId).roster.find(p=>p.id===target.id).attributes.catching,before);
 }
 const legacy=C.createCareer({name:'Legacy weekly'});delete legacy.progressionVersion;delete legacy.settings.development;
 assert.ok(C.parseCareer(JSON.stringify(legacy)));assert.equal(weeklyGoal(legacy).xp,25);
 const target=preparationTargets(legacy)[0];target.attributes.catching=97;assert.equal(choosePreparation(legacy,'teammate',target.id),false);
 const stakes=seasonStakes(legacy);assert.equal(stakes.remaining,17);assert.equal(stakes.contenders.some(t=>t.abbr===legacy.league.teams.find(t=>t.id===legacy.teamId).abbr),false);
 legacy.postseason={round:3,games:[{round:3,status:'scheduled',homeTeamId:legacy.teamId,awayTeamId:'dal'}]};
 assert.equal(seasonStakes(legacy).detail,'One win from the title.');
 legacy.postseason.champion=legacy.teamId;assert.equal(seasonStakes(legacy).title,'Champions');assert.equal(choosePreparation(legacy,'personal'),false);
}
console.log('Weekly preparation: college/pro rewards, locks, reloads, misses, caps, legacy defaults, postseason stakes and duplicate prevention passed.');
