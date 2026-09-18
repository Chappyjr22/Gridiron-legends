import assert from 'node:assert/strict';
import * as C from '../src/career/career.js';
import * as L from '../src/state/league.js';
import {playingRoster} from '../src/career/roster.js';
import {emptyStats} from '../src/career/stats.js';
import {upgradeOffer,levelThreshold,weeklyGoal} from '../src/career/development.js';
import {xpBreakdown} from '../src/career/recap.js';
import {harness} from './helpers/engine.mjs';
const c=C.createCareer({name:'Regression QB'}),p=C.careerPlayer(c),team=L.findTeamState(c.league,c.teamId);
playingRoster(team);const before=p.rating;c.points=10;assert.ok(C.upgrade(c,'accuracy'));assert.ok(p.rating-before<=1);assert.ok(p.rating<=95);
p.rating=127;const repaired=C.parseCareer(JSON.stringify(c));assert.ok(C.careerPlayer(repaired).rating<100);assert.deepEqual(C.careerPlayer(repaired).attributes,p.attributes);
p.attributes.accuracy=94;assert.equal(upgradeOffer(p,'accuracy').gain,1);
team.colors={...team.colors,primary:'#123456'};team.uniforms={home:{pants:'#654321'}};team.uniformPreference='alternate';
const mate=team.roster[1];mate.age=22;mate.development='Elite';mate.contractYears=2;const oldRating=mate.rating;
c.postseason={champion:c.teamId};assert.ok(C.startNextSeason(c));const next=L.findTeamState(c.league,c.teamId);assert.equal(next.colors.primary,'#123456');assert.equal(next.uniforms.home.pants,'#654321');assert.equal(next.uniformPreference,'alternate');assert.equal(next.roster[1].age,23);assert.equal(next.roster[1].contractYears,1);assert.equal(next.roster[1].rating,Math.min(97,oldRating+3));assert.equal(c.seasonArchive.length,1);
const stats={...emptyStats(),attempts:20,completions:14,passingYards:200,passingTD:2};const xp=s=>xpBreakdown(s,true,{difficulty:'medium'}).reduce((n,r)=>n+r.xp,0);assert.ok(xp(stats)>xp({...stats,interceptions:5}));assert.equal(xp(stats),xp({...stats,attempts:40,completions:28,passingYards:400}));
assert.equal(new Set(Array.from({length:6},(_,i)=>weeklyGoal({...c,league:{...c.league,week:i+1},postseason:null}).kind)).size,6);assert.ok(levelThreshold(50)>levelThreshold(1));
for(const speed of [45,95]){
 const h=await harness();h.engine.startNewGame({career:true});h.engine.startPlayerDrive(25);h.engine.choosePlay('trips_slants');h.entities.players.qb.attributes.speed=speed;
 for(const d of [...Object.values(h.entities.players),...h.entities.decor])if(d!==h.entities.players.qb){d.x=-10000;d.yfield=-10000;}
 const qb=h.entities.players.qb,start=qb.yfield;assert.equal(h.engine.startScramble(),true);assert.equal(h.engine.startScramble(),false);h.engine.releaseThrow({x:300,y:100});assert.equal(h.entities.ball.inFlight,false);
 for(let i=0;i<30;i++)h.step(16);const gain=qb.yfield-start;assert.ok(gain>0);if(speed===45)globalThis.slowGain=gain;else assert.ok(gain>globalThis.slowGain);
 h.engine.endPlay(8,'Scramble',false,h.game.los+8);const s=h.engine.matchState.stats.players[qb.playerId];assert.equal(s.carries,1);assert.equal(s.rushingYards,8);assert.equal(s.attempts,0);assert.equal(s.sacks,0);
}
console.log('Career depth: rating repair, costs, persistence, development, goals, XP and actual scramble movement/accounting passed.');
{
 const h=await harness();h.engine.startNewGame({career:true});h.engine.startPlayerDrive(99);h.engine.choosePlay('trips_slants');const qb=h.entities.players.qb;
 for(const d of [...Object.values(h.entities.players),...h.entities.decor])if(d!==qb){d.x=-10000;d.yfield=-10000;}
 h.engine.startScramble();for(let i=0;i<700&&h.game.phase==='live';i++)h.step(16);
 assert.ok(h.game.playerScore>=6);assert.equal(h.engine.matchState.stats.players[qb.playerId].rushingTD,1);
}
console.log('QB scrambling crosses the goal line, scores and credits a rushing touchdown.');
