// Rookie targets use only completed regular-season games from the first pro year.
const defaultTargets=()=>[
 {kind:'wins',target:7,label:'Win 7 regular-season games'},
 {kind:'completion',target:.6,minAttempts:100,label:'Complete 60% of passes on 100+ attempts'},
 {kind:'interceptionRate',target:.03,minAttempts:100,label:'Keep interceptions at 3% or less on 100+ attempts'}
];
function summarize(c,games){
 const stats={games:games.length,wins:0,attempts:0,completions:0,interceptions:0};
 for(const g of games){
  const home=g.homeTeamId===c.teamId;
  stats.wins+=Number(home?g.homeScore>g.awayScore:g.awayScore>g.homeScore);
  const line=g.boxScore?.players?.[c.playerId]||c.history.find(h=>h.season===1&&h.gameId===g.id)?.stats;
  for(const key of ['attempts','completions','interceptions'])stats[key]+=line?.[key]||0;
 }
 return stats;
}
export function rookieGoals(stats,targets,totalGames=17){
 return targets.map(target=>{
  const wins=target.kind==='wins',value=wins?stats.wins:stats.attempts?(target.kind==='completion'?stats.completions:stats.interceptions)/stats.attempts:null;
  const eligible=wins||stats.attempts>=(target.minAttempts||100);
  const met=eligible&&(target.kind==='interceptionRate'?value<=target.target:value>=target.target);
  const finished=stats.games>=totalGames;
  const status=finished?(met?'Met':'Not met'):wins?(met?'Met':stats.wins+totalGames-stats.games<target.target?'Out of reach':stats.wins>=target.target*stats.games/totalGames&&stats.games>0?'On pace':'Needs wins'):!eligible?'Building sample':met?'On target':'Needs work';
  return {...target,value,eligible,met,status};
 });
}
function coachReview(stats,targets,totalGames){
 const goals=rookieGoals(stats,targets,totalGames),wins=goals.find(g=>g.kind==='wins');
 const strengths=[],focus=[];
 for(const goal of goals){
  if(goal.kind==='wins'){
   if(goal.status==='Met'||goal.status==='On pace')strengths.push('You are keeping the team on pace for its win target.');
   else focus.push(`Chase ${Math.max(0,goal.target-stats.wins)} more wins in the remaining ${totalGames-stats.games} games.`);
  }else if(!goal.eligible){
   if(!focus.some(s=>s.startsWith('Build a larger')))focus.push('Build a larger passing sample before we judge your efficiency. Take the open throws.');
  }else if(goal.kind==='completion'){
   if(goal.met)strengths.push('Your completion rate meets the accuracy target.');
   else focus.push('Improve accuracy with quick reads and high-percentage throws.');
  }else if(goal.kind==='interceptionRate'){
   if(goal.met)strengths.push('You are protecting the ball at the expected level.');
   else focus.push('Protect the ball. Check down or throw it away when coverage wins.');
  }
 }
 if(!focus.length)focus.push('Keep your efficiency steady and finish the season at this standard.');
 return {afterGames:stats.games,stats:{...stats},goals,strengths,focus,headline:goals.every(g=>g.met||(g.kind==='wins'&&g.status==='On pace'))?'Strong first half':wins?.status==='Out of reach'?'Build a stronger finish':'Keep building'};
}
export function rookieProgress(c){
 if(c.stage!=='pro')return null;
 if(c.league.season!==1)return c.rookieSeason||null;
 const schedule=c.league.schedule.filter(g=>!g.round&&(g.homeTeamId===c.teamId||g.awayTeamId===c.teamId));
 const games=schedule.filter(g=>g.status==='completed').sort((a,b)=>a.week-b.week);
 const targets=structuredClone(c.rookieSeason?.targets||c.proEntry?.expectations||defaultTargets());
 const totalGames=schedule.length,stats=summarize(c,games);
 const review=c.rookieSeason?.review||(games.length>=9?coachReview(summarize(c,games.slice(0,9)),targets,totalGames):null);
 return {season:1,targets,totalGames,stats,review};
}
export function updateRookieProgress(c){
 const progress=rookieProgress(c);
 if(progress&&c.league.season===1)c.rookieSeason=progress;
 return progress;
}
