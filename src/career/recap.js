import {emptyStats,addStats} from './stats.js';
export function xpBreakdown(stats,won){
 return [{label:'Game completed',xp:40},{label:'Win bonus',xp:won?30:0},{label:'Passing yards',xp:Math.min(60,Math.floor(Math.max(0,stats.passingYards)/10))},{label:'Passing touchdowns',xp:Math.min(60,stats.passingTD*15)}];
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
