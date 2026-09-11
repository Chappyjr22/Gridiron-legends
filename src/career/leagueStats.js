import {emptyStats,addStats} from './stats.js';
// A separate seeded stream models player production from the simulation's actual
// scoring drives. It never changes scores or consumes gameplay randomness.
export function simulatedBoxScore(team,drives,seed){
 let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619);
 const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 const players={},qb=team.roster.find(p=>p.slot==='QB'),rb=team.roster.find(p=>p.slot==='RB');
 const receivers=team.roster.filter(p=>/^(WR|TE)/.test(p.slot));
 if(!qb||!rb||!receivers.length)return players;
 for(const p of [qb,rb,...receivers])players[p.id]={...emptyStats(),games:1};
 for(const points of drives){
  const touchdown=points===6||points===7,passTD=touchdown&&random()<.65;
  const completions=1+Math.floor(random()*4),attempts=completions+Math.floor(random()*4);
  players[qb.id].attempts+=attempts;players[qb.id].interceptions+=Number(points===0&&random()<.15);
  for(let i=0;i<attempts;i++){
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
 const rows=c.league.teams.flatMap(team=>team.roster.filter(p=>/^(QB|RB|WR|TE)/.test(p.slot)).map(player=>({team,player,stats:totals[player.id]||null})));
 return {rows,games,covered};
}
