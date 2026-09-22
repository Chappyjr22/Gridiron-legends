import {seasonPlayerRows} from './leagueStats.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const percentile=(value,values)=>values.length<2?.5:(values.filter(v=>v<value).length+(values.filter(v=>v===value).length-1)/2)/(values.length-1);
// Compare efficiency and production within positions before comparing MVP scores.
// Regular season only: every school has the same opportunity to earn the award.
export function collegeMvpCandidates(c){
 const rows=seasonPlayerRows(c).rows.filter(({player:p,stats:s})=>s&&s.games>=9&&(p.position==='QB'?s.attempts>=54:p.position==='RB'?s.carries>=27:s.targets>=27)).map(({player:p,team,stats:s})=>{
  const role=p.position==='QB'?'QB':p.position==='RB'?'RB':'REC';
  const efficiency=role==='QB'?(s.completions/s.attempts+s.passingYards/s.attempts/10)/2:role==='RB'?s.rushingYards/s.carries/6:(s.receptions/s.targets+s.receivingYards/s.targets/10)/2;
  const yards=(s.passingYards+s.rushingYards+s.receivingYards)/s.games,td=(s.passingTD+s.rushingTD+s.receivingTD)/s.games;
  const security=role==='QB'?clamp(1-s.interceptions/s.attempts*12):clamp(1-(s.fumblesLost||0)/Math.max(1,s.carries+s.receptions)*12);
  return {playerId:p.id,name:[p.firstName,p.lastName].filter(Boolean).join(' '),teamId:team.id,team:team.abbr,role,efficiency,yards,td,security,wins:team.record.wins/12,stats:{...s}};
 });
 for(const r of rows){const peers=rows.filter(p=>p.role===r.role);r.score=Math.round((45*percentile(r.efficiency,peers.map(p=>p.efficiency))+15*percentile(r.yards,peers.map(p=>p.yards))+15*percentile(r.td,peers.map(p=>p.td))+15*r.security+10*clamp(r.wins))*100)/100;}
 return rows.sort((a,b)=>b.score-a.score||b.td-a.td||a.playerId.localeCompare(b.playerId));
}
export function finalizeCollegeHonors(c){
 if(c.stage!=='college'||c.league.schedule.some(g=>g.status!=='completed'))return null;
 if(c.collegeHonors?.season===c.league.season)return c.collegeHonors;
 const candidates=collegeMvpCandidates(c),winner=candidates[0]||null;
 c.collegeHonors={season:c.league.season,mvp:winner,finalists:candidates.slice(0,3),eligiblePlayers:candidates.length};
 if(winner?.playerId===c.playerId&&!c.awards.some(a=>a.season===c.league.season&&a.title==='College MVP'))c.awards.push({season:c.league.season,title:'College MVP'});
 return c.collegeHonors;
}
export function awardDraftBoosts(c,basePick){
 let pick=basePick;const boosts=[];
 const has=title=>c.awards.some(a=>a.season===c.league.season&&a.title===title);
 for(const [title,fraction,earned] of [['College MVP',.28,has('College MVP')],['National championship',.16,c.postseason?.champion===c.teamId||has('National college champion')]]){
  if(!earned)continue;
  const before=pick;pick=Math.max(1,Math.round(1+(pick-1)*(1-fraction)));
  boosts.push({title,before,after:pick,places:before-pick});
 }
 return {pick,boosts};
}
