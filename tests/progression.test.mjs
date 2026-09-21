import assert from 'node:assert/strict';
import * as C from '../src/career/career.js';
import {QB_KEYS,proAttribute,proProjection,normalizeQuarterback,upgradeOffer,awardExperience,levelThreshold} from '../src/career/development.js';
import {balanceMatrix,playSeason,spend} from '../scripts/career-balance.mjs';

for(const [college,pro] of [[60,57],[70,64],[80,71],[90,78],[99,85]])assert.equal(proAttribute(college),pro);
for(let n=1;n<=100;n++){assert.ok(proAttribute(n)>=proAttribute(n-1));assert.ok(proAttribute(n)<=n);assert.ok(proAttribute(n)<=85);}
for(const development of ['steady','standard','fast']){
 let c=C.createCareer({name:'Generational QB',schoolId:'college-cypress',development}),p=C.careerPlayer(c);
 for(const k of QB_KEYS)p.attributes[k]=99;normalizeQuarterback(p);c.postseason={champion:c.teamId};c.points=8;c.xp=70;
 const projection=proProjection(p,c);assert.equal(projection.collegeOverall,99);assert.equal(projection.overall,85);
 C.enterDraft(c);c=C.parseCareer(JSON.stringify(c));assert.ok(c);assert.ok(C.beginProCareer(c));
 p=C.careerPlayer(c);assert.equal(p.rating,85);assert.ok(QB_KEYS.every(k=>p.attributes[k]===85));
 assert.equal(c.collegeArchive.finalOverall,99);assert.ok(QB_KEYS.every(k=>c.collegeArchive.attributes[k]===99));
 assert.equal(c.settings.development,development);assert.equal(c.points,3);assert.equal(c.xp,36);
 const before=JSON.stringify(c);assert.equal(C.beginProCareer(c),false);assert.equal(JSON.stringify(c),before);
 assert.ok(C.parseCareer(JSON.stringify(c)));
}
// Legacy saves retain their ratings, XP, point economy and draft behavior.
{
 let c=C.createCareer({name:'Original Save',schoolId:'college-cypress'});delete c.progressionVersion;delete c.settings.development;
 c.points=8;c.xp=45;const attrs={...C.careerPlayer(c).attributes};c=C.parseCareer(JSON.stringify(c));assert.ok(c);
 assert.deepEqual(C.careerPlayer(c).attributes,attrs);assert.equal(upgradeOffer(C.careerPlayer(c),'accuracy',c).gain,2);
 const reward=awardExperience(c,100);assert.equal(reward.points,1);
 c.postseason={champion:c.teamId};C.enterDraft(c);const points=c.points,xp=c.xp;C.beginProCareer(c);
 assert.deepEqual(C.careerPlayer(c).attributes,attrs);assert.equal(c.points,points);assert.equal(c.xp,xp);
}
{
 const c=C.createCareer({name:'Persistence',development:'fast'}),p=C.careerPlayer(c);
 const saved=C.parseCareer(JSON.stringify(c));assert.equal(saved.settings.development,'fast');
 c.settings.development='unknown';assert.equal(C.parseCareer(JSON.stringify(c)),null);c.settings.development='fast';
 c.progressionVersion=99;assert.equal(C.parseCareer(JSON.stringify(c)),null);c.progressionVersion=2;
 p.attributes.arm=99;assert.equal(upgradeOffer(p,'arm',c).gain,0);assert.equal(C.upgrade(c,'arm'),false);
 assert.ok(levelThreshold(40,c)>levelThreshold(1,c));
}
const matrix=balanceMatrix();
for(const r of matrix){assert.ok(r.college>r.start);assert.ok(r.college<=99);assert.ok(r.pro<=85);if(r.development!=='fast'||r.performance!=='exceptional')assert.ok(r.college<99);}
assert.ok(matrix.some(r=>r.college===99));
for(const tier of ['powerhouse','competitive','rebuilding'])for(const performance of ['weak','average','exceptional']){
 const rows=matrix.filter(r=>r.tier===tier&&r.performance===performance);assert.ok(rows[0].college<=rows[1].college&&rows[1].college<=rows[2].college);
}
// An exceptional fast-growth prospect still has multiple pro seasons to develop.
const progression=[];
for(const development of ['steady','standard','fast']){
 const c=C.createCareer({name:'Pro Growth',schoolId:'college-cypress',development});playSeason(c,'exceptional');C.enterDraft(c);C.beginProCareer(c);spend(c);
 const ratings=[C.careerPlayer(c).rating];
 for(let season=0;season<3;season++){playSeason(c,'exceptional');ratings.push(C.careerPlayer(c).rating);assert.ok(C.startNextSeason(c));}
 assert.ok(ratings.every((v,i)=>v<=99&&(!i||v>=ratings[i-1])));assert.ok(ratings[1]<99);progression.push({development,entry:ratings[0],year1:ratings[1],year2:ratings[2],year3:ratings[3]});
}
console.table(progression);
console.log('Progression checks passed: 27 college paths, 3 pro trajectories, conversion, banking, caps and legacy saves.');
