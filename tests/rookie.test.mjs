import assert from 'node:assert/strict';
import * as C from '../src/career/career.js';
import {rookieProgress,rookieGoals} from '../src/career/rookie.js';
function play(c,win=true,line={attempts:20,completions:14,interceptions:0}){
 const game=C.nextMatch(c);c.activeMatch=game.id;
 assert.ok(C.completeCareerGame(c,game.id,win?21:7,win?7:21,{players:{[c.playerId]:line},plays:[]}));
 return game;
}
const c=C.createCareer({name:'Rookie Review'});
assert.equal(rookieProgress(c).targets[0].target,7);
c.proEntry={expectations:[{kind:'wins',target:9,label:'Win 9 regular-season games'},{kind:'completion',target:.6,minAttempts:100,label:'Complete 60% of passes on 100+ attempts'},{kind:'interceptionRate',target:.03,minAttempts:100,label:'Keep interceptions at 3% or less on 100+ attempts'}]};
let progress=rookieProgress(c);
assert.equal(progress.targets[0].target,9);
assert.equal(rookieGoals(progress.stats,progress.targets)[1].value,null);
assert.equal(rookieGoals(progress.stats,progress.targets)[2].met,false);
for(let i=0;i<4;i++)play(c);
progress=rookieProgress(c);
assert.equal(rookieGoals(progress.stats,progress.targets)[1].status,'Building sample');
play(c);progress=rookieProgress(c);
assert.equal(rookieGoals(progress.stats,progress.targets)[1].status,'On target');
assert.equal(progress.review,null);
for(let i=0;i<4;i++)play(c,false,{attempts:20,completions:8,interceptions:3});
progress=rookieProgress(c);
assert.equal(progress.stats.games,9);assert.equal(progress.stats.wins,5);
assert.equal(progress.review.afterGames,9);assert.equal(progress.review.stats.attempts,180);
assert.ok(progress.review.focus.some(s=>s.includes('Protect the ball')));
assert.ok(progress.review.focus.some(s=>s.includes('Improve accuracy')));
const review=structuredClone(progress.review),xp=c.xp,confidence=c.coachConfidence;
const duplicate=c.lastResult;assert.equal(C.completeCareerGame(c,duplicate.gameId,21,7,{players:{}}),false);
assert.equal(c.xp,xp);assert.equal(c.coachConfidence,confidence);
// Reads and reloads do not reward the player or revise the game-nine snapshot.
assert.deepEqual(C.parseCareer(JSON.stringify(c)).rookieSeason.review,review);
play(c);assert.deepEqual(rookieProgress(c).review,review);
// Existing first-year saves backfill the review from the first nine games, not current totals.
const legacy=structuredClone(c);delete legacy.rookieSeason;
assert.deepEqual(C.parseCareer(JSON.stringify(legacy)).rookieSeason.review,review);
while(!c.postseason?.champion)play(c);
progress=rookieProgress(c);
assert.equal(progress.stats.games,17);assert.equal(progress.stats.attempts,340);
assert.ok(c.totals.games>=17);assert.deepEqual(progress.review,review);
const final=structuredClone(progress);assert.ok(C.startNextSeason(c));
play(c);assert.deepEqual(rookieProgress(c),final);
assert.deepEqual(C.parseCareer(JSON.stringify(c)).rookieSeason,final);
const veteran=C.createCareer({name:'Legacy Veteran'});veteran.league.season=2;
assert.equal(rookieProgress(veteran),null);
const college=C.createCareer({name:'College Star',schoolId:'college-bluegrass'});
assert.equal(rookieProgress(college),null);
while(!college.postseason?.champion)play(college);
C.enterDraft(college);const targets=structuredClone(college.draft.report.expectations);
assert.ok(C.beginProCareer(college));assert.deepEqual(rookieProgress(college).targets,targets);
assert.equal(rookieProgress(college).stats.games,0);play(college);
assert.equal(rookieProgress(college).stats.attempts,20);
// Rate goals can fall below target after qualifying. Exact threshold comparisons stay unrounded.
const goals=rookieProgress(college).targets;
assert.equal(rookieGoals({games:5,wins:3,attempts:100,completions:60,interceptions:3},goals)[2].met,true);
assert.equal(rookieGoals({games:6,wins:3,attempts:101,completions:60,interceptions:4},goals)[1].met,false);
assert.equal(rookieGoals({games:17,wins:9,attempts:99,completions:99,interceptions:0},goals)[2].status,'Not met');
console.log('Rookie goals and review passed: draft targets, thresholds, game-nine snapshot, legacy reload, duplicate prevention, college/playoff exclusion and season rollover.');
