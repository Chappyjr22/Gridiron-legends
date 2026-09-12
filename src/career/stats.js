export function emptyStats(){return {games:0,attempts:0,completions:0,passingYards:0,passingTD:0,interceptions:0,sacks:0,sackYards:0,carries:0,rushingYards:0,rushingTD:0,targets:0,receptions:0,receivingYards:0,receivingTD:0};}
export function emptyMatch(){return {plays:[],players:{}};}
export function addStats(total,delta){for(const key of Object.keys(emptyStats()))total[key]=(total[key]||0)+(delta[key]||0);return total;}
export function recordPlay(match,play){
 if(match.plays.some(p=>p.id===play.id))return false;
 match.plays.push({...play});
 const player=id=>match.players[id]??=emptyStats();
 const qb=player(play.qbId);
 if(play.threw){
  qb.attempts++;
  if(play.targetId)player(play.targetId).targets++;
  if(play.intercepted)qb.interceptions++;
  if(play.receiverId){
   qb.completions++;qb.passingYards+=play.yards;qb.passingTD+=Number(play.touchdown);
   const receiver=player(play.receiverId);receiver.receptions++;receiver.receivingYards+=play.yards;receiver.receivingTD+=Number(play.touchdown);
  }
 }else if(play.sacked){qb.sacks++;qb.sackYards+=Math.abs(play.yards);}
 else if(play.carrierId){const carrier=player(play.carrierId);carrier.carries++;carrier.rushingYards+=play.yards;carrier.rushingTD+=Number(play.touchdown);}
 return true;
}
