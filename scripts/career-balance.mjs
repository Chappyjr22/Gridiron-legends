import * as C from '../src/career/career.js';
import {COLLEGE_TEAMS} from '../src/career/collegeData.js';
import {QB_KEYS,upgradeOffer,proProjection} from '../src/career/development.js';
import {emptyStats} from '../src/career/stats.js';
export const performances={
 weak:{attempts:20,completions:9,passingYards:100,passingTD:1,interceptions:3,rushingYards:3},
 average:{attempts:20,completions:13,passingYards:160,passingTD:2,interceptions:1,rushingYards:10},
 exceptional:{attempts:20,completions:18,passingYards:240,passingTD:4,interceptions:0,rushingYards:30,rushingTD:1}
};
export function spend(c){
 for(let i=0;i<300;i++){
  const p=C.careerPlayer(c),key=QB_KEYS.filter(k=>{const o=upgradeOffer(p,k,c);return o.gain&&o.cost<=c.points;}).sort((a,b)=>p.attributes[a]-p.attributes[b])[0];
  if(!key)break;C.upgrade(c,key);
 }
}
export function playSeason(c,performance){
 let games=0,xp=0;
 while(!c.postseason?.champion){
  const m=C.nextMatch(c);if(!m)throw Error('Missing next match');c.activeMatch=m.id;
  const won=performance==='exceptional'||performance==='average'&&games%3!==0;
  const r=C.completeCareerGame(c,m.id,won?35:10,won?14:28,{players:{[c.playerId]:{...emptyStats(),...performances[performance]}},plays:[]});
  if(!r||++games>20)throw Error('Season failed');xp+=r.xp;spend(c);
 }
 return {games,xp};
}
export function balanceMatrix(){
 const rows=[],originalRandom=Math.random;let seed=20260921;
 Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 try{
 for(const tier of ['powerhouse','competitive','rebuilding'])for(const development of ['steady','standard','fast'])for(const performance of Object.keys(performances)){
  const school=COLLEGE_TEAMS.find(t=>t.tier===tier),c=C.createCareer({name:'Balance Test',schoolId:school.id,development});
  const start=C.careerPlayer(c).rating,result=playSeason(c,performance),college=C.careerPlayer(c).rating,pro=proProjection(C.careerPlayer(c),c).overall;
  rows.push({tier,development,performance,start,...result,college,pro});
 }
 return rows;
 }finally{Math.random=originalRandom;}
}
if(process.argv[1]?.endsWith('career-balance.mjs'))console.table(balanceMatrix());
