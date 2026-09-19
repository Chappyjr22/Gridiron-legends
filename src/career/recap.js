import {emptyStats,addStats} from './stats.js';
export function xpBreakdown(stats,won,settings={}){
 const a=stats.attempts||0,ints=stats.interceptions||0;
 const efficiency=a>=6?Math.round(Math.max(0,Math.min(1,stats.completions/a))*20+Math.min(10,Math.max(0,stats.passingYards/a))*2):0;
 const security=a>=6?Math.max(0,20-ints*10):0;
 const impact=Math.min(20,(stats.passingTD||0)*5+(stats.rushingTD||0)*5+Math.floor(Math.max(0,stats.rushingYards||0)/10));
 return [{label:'Game completed',xp:30},{label:'Win bonus',xp:won?20:0},{label:'Passing efficiency',xp:efficiency},{label:'Ball security',xp:security},{label:'Scoring and rushing',xp:impact},{label:'Difficulty',xp:{easy:0,medium:3,hard:6,gridiron:9}[settings.difficulty]||0}];
}
export function captureMoments(plays=[]){
 return plays.map((p,i)=>({play:i+1,yards:p.yards||0,touchdown:!!p.touchdown,intercepted:!!p.intercepted,sacked:!!p.sacked,receiverId:p.receiverId||null}))
 .filter(p=>p.touchdown||p.intercepted||p.sacked||p.yards>=20).slice(-6);
}
export function playerGameLog(c,id){
 return c.history.map(r=>{
  const match=r.season===c.league.season?[...c.league.schedule,...(c.postseason?.games||[])].find(g=>g.id===r.gameId):null;
  const stats=r.playerStats?.[id]||match?.boxScore?.players?.[id]||(id===c.playerId?r.stats:null);
  return {...r,stats:stats?{...emptyStats(),...stats}:null};
 }).reverse();
}
export function playerSeasonStats(c,id){
 const total=emptyStats();let tracked=0;
 for(const r of playerGameLog(c,id))if(r.season===c.league.season&&r.stats){addStats(total,r.stats);tracked++;}
 return {stats:total,tracked};
}
