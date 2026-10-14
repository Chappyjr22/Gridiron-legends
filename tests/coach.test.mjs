import assert from 'node:assert/strict';
import * as C from '../src/career/career.js';
import {confidenceFeedback,coachProgress} from '../src/career/coach.js';
import {preparationKey} from '../src/career/development.js';
import {evolveLeague} from '../src/career/offseason.js';
import {createFranchise} from '../src/state/league.js';

// Every score boundary and rule combination retains the previous formula.
for(let before=0;before<=100;before++)for(const won of [true,false])for(const met of [true,false])for(const kind of ['efficient','challenge','teammate'])for(const interceptions of [0,1,2,3,4,7]){
 const feedback=confidenceFeedback(before,won,{met,kind},{interceptions});
 const expected=Math.max(0,Math.min(100,before+(won?3:-2)+(met?2:0)+(kind==='challenge'&&met?2:0)-Math.min(6,interceptions*2)));
 assert.equal(feedback.after,expected);assert.equal(feedback.delta,expected-before);
 assert.equal(feedback.capped,feedback.delta!==feedback.reasons.reduce((sum,r)=>sum+r.delta,0));
}
const capped=confidenceFeedback(99,true,{met:true,kind:'challenge'},{interceptions:0});
assert.equal(capped.delta,1);assert.equal(capped.reasons.reduce((sum,r)=>sum+r.delta,0),7);assert.equal(capped.capped,true);
const c=C.createCareer({name:'Coach Progress'});
assert.equal(coachProgress(c).latest,null);assert.equal(coachProgress(c).confidence,50);
for(const [confidence,years] of [[0,1],[39,1],[40,3],[69,3],[70,4],[100,4]]){
 c.coachConfidence=confidence;C.careerPlayer(c).contractYears=1;
 const next=createFranchise(c.teamId,c.league.season+1);evolveLeague(c,next);
 assert.equal(coachProgress(c).renewalYears,years);
 assert.equal(next.teams.find(t=>t.id===c.teamId).roster.find(p=>p.id===c.playerId).contractYears,years);
}
c.coachConfidence=98;
c.weeklyPreparation={key:preparationKey(c),kind:'challenge'};
const game=C.nextMatch(c);c.activeMatch=game.id;
const result=C.completeCareerGame(c,game.id,21,7,{players:{[c.playerId]:{attempts:10,completions:8,passingTD:2,interceptions:0}},plays:[]});
assert.equal(result.coachFeedback.before,98);assert.equal(result.coachConfidence,100);assert.equal(result.coachFeedback.delta,2);
assert.deepEqual(result.coachFeedback.reasons.map(r=>r.delta),[3,2,2]);
const saved=JSON.stringify(c),view=coachProgress(c);
assert.equal(JSON.stringify(c),saved);assert.equal(view.latest.after,100);
view.latest.reasons[0].label='Modified display';assert.equal(result.coachFeedback.reasons[0].label,'Game won');
assert.deepEqual(coachProgress(C.parseCareer(saved)),coachProgress(c));
assert.equal(C.completeCareerGame(c,game.id,21,7,{players:{}}),false);assert.equal(JSON.stringify(c),saved);
const legacy=structuredClone(c);delete legacy.lastResult.coachFeedback;
assert.equal(coachProgress(legacy).latest.delta,null);assert.equal(coachProgress(legacy).latest.before,null);
assert.deepEqual(coachProgress(legacy).latest.reasons,[]);delete legacy.lastResult.coachConfidence;
assert.equal(coachProgress(legacy).latest.after,null);assert.equal(coachProgress(legacy).latest.delta,null);
c.lastResult.stats.interceptions=2;assert.equal(coachProgress(c).nextFocus.title,'Protect the ball');
c.lastResult.stats.interceptions=0;c.lastResult.goal.met=false;
assert.equal(coachProgress(c).nextFocus.title,'Complete your weekly objective');
c.postseason={champion:c.teamId};assert.equal(coachProgress(c).nextFocus.title,'Ready for next season');
// Advancing clears the last-game explanation without changing the rookie archive.
const rollover=C.createCareer({name:'Coach Rollover'});
rollover.league.season=2;rollover.rookieSeason={season:1,targets:[],stats:{games:17},review:{headline:'Archived review'}};
rollover.lastResult=structuredClone(result);rollover.postseason={champion:rollover.teamId,games:[]};
const archived=structuredClone(rollover.rookieSeason);
assert.ok(C.startNextSeason(rollover));assert.equal(coachProgress(rollover).latest,null);assert.deepEqual(rollover.rookieSeason,archived);
const college=C.createCareer({name:'College Coach',schoolId:'college-bluegrass'});
assert.equal(coachProgress(college),null);
console.log('Coach progress passed: unchanged confidence rules, cap explanations, actual renewal thresholds, save/reload, pure views, legacy fallback and duplicate prevention.');
