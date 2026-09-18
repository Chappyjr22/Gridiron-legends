import * as League from '../state/league.js';
import {ensurePlayerAttributes} from './playerAttributes.js';
import {normalizeQuarterback} from './development.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function seasonReview(c){
 c.seasonArchive??=[];
 if(c.seasonArchive.some(s=>s.season===c.league.season))return;
 const regular=c.history.filter(g=>g.season===c.league.season&&g.week<=17);
 const stats=regular.reduce((s,g)=>{for(const k of ['passingYards','passingTD','interceptions','rushingYards'])s[k]+=g.stats[k]||0;return s;},{passingYards:0,passingTD:0,interceptions:0,rushingYards:0});
 const totals={};
 for(const g of c.league.schedule)for(const [id,s] of Object.entries(g.boxScore?.players||{}))totals[id]=(totals[id]||0)+(s.passingYards||0);
 const best=Math.max(0,...Object.values(totals));
 if(best>0&&totals[c.playerId]===best)c.awards.push({season:c.league.season,title:'Regular-season passing yards leader'});
 if(regular.length>=12&&stats.passingTD>=25&&stats.interceptions<=10)c.awards.push({season:c.league.season,title:'Outstanding quarterback season'});
 const team=League.findTeamState(c.league,c.teamId);
 c.seasonArchive.push({season:c.league.season,team:team.abbr,record:{...team.record},stats,champion:c.postseason.champion,awards:c.awards.filter(a=>a.season===c.league.season).map(a=>a.title)});
}
export function evolveLeague(c,next){
 const news=[],expired=[];
 next.teams.forEach(t=>{
  const prior=League.findTeamState(c.league,t.id),rookies=t.roster;
  for(const key of ['city','name','abbr','colors','uniforms','uniformPreference','uniform'])if(prior[key]!==undefined)t[key]=structuredClone(prior[key]);
  t.coaches=structuredClone(prior.coaches);
  for(const coach of Object.values(t.coaches)){coach.contractYears=Math.max(0,(coach.contractYears||1)-1);if(!coach.contractYears)coach.contractYears=3;}
  t.roster=prior.roster.map((old,i)=>{
   const p=structuredClone(old);p.age++;p.contractYears=Math.max(0,(p.contractYears||1)-1);
   if(p.id===c.playerId){normalizeQuarterback(p);if(!p.contractYears){p.contractYears=3;news.push(`${t.abbr}: your contract renewed for 3 seasons. Coach confidence ${c.coachConfidence??50}%.`);}return p;}
   if(p.age>=36||(p.age>=33&&p.rating<72)){
    const rookie={...rookies.find(r=>r.slot===p.slot)||rookies[i],age:21,contractYears:4};
    news.push(`${t.abbr}: ${p.firstName} ${p.lastName} retired. Rookie ${rookie.firstName} ${rookie.lastName} joins at ${rookie.slot}.`);return rookie;
   }
   ensurePlayerAttributes(p,t.id);
   const delta=p.age<=25?(p.development==='Elite'?3:p.development==='Impact'?2:1):p.age>=31?-2:p.age>=29?-1:0;
   p.rating=clamp(p.rating+delta,45,97);for(const key of Object.keys(p.attributes))p.attributes[key]=clamp(p.attributes[key]+delta,45,97);
   if(delta&&t.id===c.teamId)news.push(`${p.firstName} ${p.lastName}: ${delta>0?'+':''}${delta} OVR (${p.rating}).`);
   if(!p.contractYears)expired.push({team:t,p});
   return p;
  });
 });
 // A small, deterministic free-agent market swaps same-position expired contracts.
 const moved=new Set();
 for(const a of expired){
  if(moved.has(a.p.id))continue;
  const b=expired.find(b=>b.team!==a.team&&b.p.slot===a.p.slot&&!moved.has(b.p.id));
  a.p.contractYears=2;
  if(!b)continue;
  b.p.contractYears=2;moved.add(a.p.id);moved.add(b.p.id);
  const ai=a.team.roster.indexOf(a.p),bi=b.team.roster.indexOf(b.p);
  a.team.roster[ai]=b.p;b.team.roster[bi]=a.p;
  news.push(`${a.p.firstName} ${a.p.lastName} signs with ${b.team.abbr}; ${b.p.firstName} ${b.p.lastName} joins ${a.team.abbr}.`);
 }
 for(const t of next.teams){const used=new Set();for(const p of [...t.roster].sort((a,b)=>Number(b.id===c.playerId)-Number(a.id===c.playerId))){if(used.has(p.number))for(let n=0;n<100;n++)if(!used.has(n)){p.number=n;break;}used.add(p.number);}}
 c.offseasonNews=news;
}
