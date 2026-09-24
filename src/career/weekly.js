import * as League from '../state/league.js';
import {collegeStandings} from './college.js';
import {preparationKey} from './development.js';
import {ensurePlayerAttributes} from './playerAttributes.js';

export function preparationTargets(c){
 const team=League.findTeamState(c.league,c.teamId);
 return team.roster.filter(p=>['WR1','WR2','WR3','TE','RB'].includes(p.slot)&&Number(ensurePlayerAttributes(p,team.id).catching)<97);
}
export function choosePreparation(c,kind,playerId=null){
 if(c.activeMatch||c.postseason?.champion||!['personal','teammate','challenge'].includes(kind))return false;
 const games=c.postseason?.games||c.league.schedule;
 if(!games.some(g=>g.status==='scheduled'&&(g.homeTeamId===c.teamId||g.awayTeamId===c.teamId)))return false;
 const target=kind==='teammate'?preparationTargets(c).find(p=>p.id===playerId):null;
 if(kind==='teammate'&&!target)return false;
 c.weeklyPreparation={key:preparationKey(c),kind,playerId:target?.id||null,name:target?[target.firstName,target.lastName].filter(Boolean).join(' '):null};
 return true;
}
export function settlePreparation(c,goal){
 if(goal.kind!=='teammate')return null;
 const target=preparationTargets(c).find(p=>p.id===goal.playerId);
 if(!goal.met||!target)return {label:goal.label,met:false,summary:'Teammate work: target not met. No catching upgrade.'};
 const before=target.attributes.catching;target.attributes.catching=Math.min(97,before+1);
 return {label:goal.label,met:true,playerId:target.id,summary:`${goal.playerName}: catching ${before} → ${target.attributes.catching}.`};
}
export function seasonStakes(c){
 const team=League.findTeamState(c.league,c.teamId);
 const rows=c.stage==='college'?collegeStandings(c,team.conference):League.standings(c.league,team.conference);
 const rank=rows.findIndex(t=>t.id===c.teamId)+1,cutoff=c.stage==='college'?2:4;
 const remaining=c.league.schedule.filter(g=>g.status==='scheduled'&&(g.homeTeamId===c.teamId||g.awayTeamId===c.teamId)).length;
 if(c.postseason){
  const p=c.postseason,match=p.games.find(g=>g.status==='scheduled'&&(g.homeTeamId===c.teamId||g.awayTeamId===c.teamId));
  const title=p.champion?(p.champion===c.teamId?'Champions':'Season complete'):match?'Win to advance':'Postseason run complete';
  const detail=p.champion?(p.champion===c.teamId?'You finished the season with the title.':`${League.findTeamState(c.league,p.champion).abbr} won the title.`):match?(match.round===3?'One win from the title.':match.round===1&&c.stage==='college'?'Win your conference championship to reach the national semifinal.':'A win keeps your championship run alive.'): 'Your team has been eliminated.';
  return {rank,cutoff,remaining:0,title,detail,contenders:[],postseason:true};
 }
 const boundary=rows[cutoff-1];
 const title=`${rank<=cutoff?'Inside':'Outside'} the current top ${cutoff}`;
 const detail=`${rank} of ${rows.length} in your conference · ${remaining} regular-season ${remaining===1?'game':'games'} left. ${c.stage==='college'?'Top two reach the conference championship; teams rank first by conference wins.':'Top four reach the playoffs.'} Current cutoff: ${boundary.abbr}.`;
 const contenders=rows.filter((t,i)=>t.id!==c.teamId&&(Math.abs(i+1-rank)<=1||i+1===cutoff||i+1===cutoff+1)).slice(0,3).map(t=>({abbr:t.abbr,record:`${t.record.wins}–${t.record.losses}`,rank:rows.indexOf(t)+1}));
 return {rank,cutoff,remaining,title,detail,contenders,postseason:false};
}
export function stakesResult(before,after){
 if(after.postseason)return `${after.title}. ${after.detail}`;
 const change=before.rank-after.rank;
 return `${change>0?`Moved up ${change}`:change<0?`Moved down ${-change}`:'Held position'} to No. ${after.rank} in the conference after this week. ${after.title}. ${after.remaining} regular-season ${after.remaining===1?'game':'games'} left.`;
}
