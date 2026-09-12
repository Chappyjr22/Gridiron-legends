import {playingRoster} from './roster.js';
import {emptyStats,addStats} from './stats.js';
// A separate seeded stream models player production from the simulation's actual
// scoring drives. It never changes scores or consumes gameplay randomness.
export function simulatedBoxScore(team,drives,seed){
 let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619);
 const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 const players={},qb=team.roster.find(p=>p.slot==='QB'),rb=team.roster.find(p=>p.slot==='RB');
 const receivers=playingRoster(team).filter(p=>/^(WR|TE)/.test(p.slot));
 if(!qb||!rb||!receivers.length)return players;
 for(const p of [qb,rb,...receivers])players[p.id]={...emptyStats(),games:1};
 for(const points of drives){
  const touchdown=points===6||points===7,passTD=touchdown&&random()<.65;
  const completions=1+Math.floor(random()*4),attempts=completions+Math.floor(random()*4);
  const intercepted=Number(points===0&&random()<.15);
  players[qb.id].attempts+=Math.max(attempts,completions+intercepted);players[qb.id].interceptions+=intercepted;
  for(let i=0;i<Math.max(attempts,completions+intercepted);i++){
   const receiver=receivers[Math.floor(random()*receivers.length)],r=players[receiver.id];r.targets++;
   if(i<completions){const yards=3+Math.floor(random()*16),td=Number(passTD&&i===0);r.receptions++;r.receivingYards+=yards;r.receivingTD+=td;players[qb.id].completions++;players[qb.id].passingYards+=yards;players[qb.id].passingTD+=td;}
  }
  const carries=1+Math.floor(random()*4);players[rb.id].carries+=carries;players[rb.id].rushingYards+=Math.floor(carries*(2+random()*4));players[rb.id].rushingTD+=Number(touchdown&&!passTD);
  if(random()<.2){players[qb.id].sacks++;players[qb.id].sackYards+=3+Math.floor(random()*6);}
 }
 return players;
}
export function seasonPlayerRows(c){
 const totals={};let games=0,covered=0;
 for(const g of [...c.league.schedule,...(c.postseason?.games||[])]){
  if(g.status!=='completed')continue;games++;if(!g.boxScore)continue;covered++;
  for(const [id,stats] of Object.entries(g.boxScore.players))addStats(totals[id]??=emptyStats(),stats);
 }
 const rows=c.league.teams.flatMap(team=>playingRoster(team).filter(p=>/^(QB|RB|WR|TE)/.test(p.slot)).map(player=>({team,player,stats:totals[player.id]||null})));
 return {rows,games,covered};
}

// Opponent possessions are simulated, so allocate their actual drive gain and
// scoring result to a separate seeded box score without touching gameplay RNG.
export function opponentBoxScore(team,drives,seed){
 const totals={};
 drives.forEach((drive,index)=>{
  const players=simulatedBoxScore(team,[drive.points],`${seed}-${index}`),qb=players[team.roster.find(p=>p.slot==='QB').id],rb=players[team.roster.find(p=>p.slot==='RB').id];
  const oldAttempts=qb.attempts;qb.interceptions=Number(drive.turnover);qb.attempts=Math.max(qb.attempts,qb.completions+qb.interceptions);rb.targets+=qb.attempts-oldAttempts;
  const production=Object.values(players),original=production.reduce((n,s)=>n+s.receivingYards+s.rushingYards,0),yards=Math.max(0,Math.round(drive.yards))+qb.sackYards;
  let used=0;
  for(const stats of production){stats.receivingYards=Math.floor(stats.receivingYards/Math.max(1,original)*yards);stats.rushingYards=Math.floor(stats.rushingYards/Math.max(1,original)*yards);used+=stats.receivingYards+stats.rushingYards;}
  rb.rushingYards+=yards-used;qb.passingYards=production.reduce((n,s)=>n+s.receivingYards,0);
  for(const [id,stats] of Object.entries(players))addStats(totals[id]??=emptyStats(),stats);
 });
 for(const stats of Object.values(totals))stats.games=1;
 return totals;
}
