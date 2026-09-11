import assert from 'node:assert/strict';
import * as C from '../src/career/career.js';
import * as L from '../src/state/league.js';
import {COLLEGE_TEAMS,SCHOOL_TIERS} from '../src/career/collegeData.js';
import {collegeGameAssessment,collegeStandings} from '../src/career/college.js';
import {emptyStats} from '../src/career/stats.js';
assert.equal(COLLEGE_TEAMS.length,32);
assert.equal(new Set(COLLEGE_TEAMS.map(t=>t.conference)).size,4);
for(const school of COLLEGE_TEAMS){
 const c=C.createCareer({name:'Senior Tester',schoolId:school.id});
 const p=C.careerPlayer(c);
 assert.equal(p.attributes.accuracy,82+SCHOOL_TIERS[school.tier].attributeBonus);
 assert.equal(c.league.schedule.length,192);
 assert.ok(C.parseCareer(JSON.stringify(c)));
 for(const team of c.league.teams){
  const games=c.league.schedule.filter(g=>g.homeTeamId===team.id||g.awayTeamId===team.id);
  assert.equal(games.length,12);
  assert.equal(games.filter(g=>g.homeTeamId===team.id).length,6);
  assert.ok([3,4].includes(games.filter(g=>g.week<=7&&g.homeTeamId===team.id).length));
  assert.equal(new Set(games.map(g=>g.week)).size,12);
  const rivals=games.map(g=>g.homeTeamId===team.id?g.awayTeamId:g.homeTeamId);
  assert.equal(new Set(rivals).size,12);
  assert.equal(rivals.filter(id=>L.findTeamState(c.league,id).conference===team.conference).length,7);
 }
}
for(const win of [true,false]){
 let c=C.createCareer({name:'Draft Prospect',schoolId:'college-bluegrass'});
 let played=0;
 while(!c.postseason?.champion){
  const match=C.nextMatch(c);assert.ok(match);c.activeMatch=match.id;
  c.matchContext={difficulty:'medium',quarterMinutes:2};
  const stats={...emptyStats(),attempts:20,completions:win?16:8,passingYards:win?240:70,passingTD:win?3:0,interceptions:win?0:3};
  const result=C.completeCareerGame(c,match.id,win?35:7,win?7:35,{players:{[c.playerId]:stats},plays:[]});
  assert.ok(result);played++;assert.ok(played<=15);
  assert.equal(result.collegeAssessment.goal.met,win);
  assert.equal(result.xpBreakdown.reduce((n,x)=>n+x.xp,0),result.xp);
  c=C.parseCareer(JSON.stringify(c));assert.ok(c);
 }
 assert.ok(played>=12);
 assert.equal(C.startNextSeason(c),false);
 for(const conf of new Set(c.league.teams.map(t=>t.conference)))assert.equal(collegeStandings(c,conf).length,8);
 const draft=C.enterDraft(c);assert.ok(draft);assert.deepEqual(C.enterDraft(c),draft);
 assert.ok(draft.pick>=1&&draft.pick<=224);
 c=C.parseCareer(JSON.stringify(c));assert.ok(c);
 const before={id:c.playerId,attrs:{...C.careerPlayer(c).attributes},xp:c.xp,points:c.points};
 assert.equal(C.beginProCareer(c),true);assert.equal(C.beginProCareer(c),false);
 assert.equal(c.stage,'pro');assert.equal(c.playerId,before.id);
 assert.deepEqual(C.careerPlayer(c).attributes,before.attrs);assert.equal(c.xp,before.xp);assert.equal(c.points,before.points);
 assert.equal(c.collegeArchive.history.length,played);assert.equal(c.totals.games,0);
 assert.equal(c.league.schedule.length,272);assert.ok(C.parseCareer(JSON.stringify(c)));
 const team=L.findTeamState(c.league,c.teamId);assert.equal(new Set(team.roster.map(p=>p.number)).size,team.roster.length);
 const first=C.nextMatch(c);c.activeMatch=first.id;assert.ok(C.completeCareerGame(c,first.id,14,7,{players:{},plays:[]}));
 assert.equal(c.totals.games,1);assert.equal(c.collegeArchive.history.length,played);
}
{
 const c=C.createCareer({name:'Fair Scout',schoolId:'college-cypress'}),opponent=c.league.teams[1];
 const stats={...emptyStats(),attempts:20,completions:14,passingYards:180,passingTD:2,interceptions:1};
 c.settings.quarterMinutes=2;const short=collegeGameAssessment(c,stats,true,opponent);
 c.settings.quarterMinutes=5;const long=collegeGameAssessment(c,stats,true,opponent);
 assert.equal(short.score,long.score);
 c.settings.difficulty='hard';assert.ok(collegeGameAssessment(c,stats,true,opponent).score>=long.score);
 c.matchContext={difficulty:'easy',quarterMinutes:2};
 const locked=collegeGameAssessment(c,stats,true,opponent);assert.equal(locked.difficulty,'easy');
 const legacy=C.createCareer({name:'Existing Pro'});delete legacy.stage;assert.ok(C.parseCareer(JSON.stringify(legacy)));
 assert.equal(C.enterDraft(legacy),false);
 const malformed=C.createCareer({name:'Bad College',schoolId:'college-cypress'});malformed.league.teams[1].id=malformed.league.teams[0].id;
 assert.equal(C.parseCareer(JSON.stringify(malformed)),null);
}
console.log('College checks passed: 32 schools, schedules, tiers, full seasons, draft persistence, pro transition, legacy saves and scouting fairness.');
