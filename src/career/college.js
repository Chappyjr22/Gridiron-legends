import * as League from '../state/league.js';
import {COLLEGE_TEAMS,SCHOOL_TIERS} from './collegeData.js';
import {emptyStats} from './stats.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function collegeSchedule(teams){
 const games=[],groups=[...new Set(teams.map(t=>t.conference))].map(c=>teams.filter(t=>t.conference===c).map(t=>t.id));
 const add=(a,b,week,swap)=>games.push({id:`college-w${week}-${a}-${b}`,week,homeTeamId:swap?b:a,awayTeamId:swap?a:b,status:'scheduled',homeScore:null,awayScore:null});
 for(const ids of groups){const ring=[...ids];for(let round=0;round<7;round++){for(let i=0;i<4;i++)add(ring[i],ring[7-i],round+1,(round+i)%2);ring.splice(1,0,ring.pop());}}
 const pairs=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 for(let r=0;r<5;r++)for(const [a,b] of pairs[r%3])for(let i=0;i<8;i++)add(groups[a][i],groups[b][(i+Math.floor(r/3))%8],r+8,(r+i)%2);
 return games;
}
export function createCollegeLeague(schoolId){
 if(!COLLEGE_TEAMS.some(t=>t.id===schoolId))throw Error('Choose a college.');
 const league=League.createFranchise('bos');
 league.kind='college';league.leagueName='Gridiron College League';league.userTeamId=schoolId;
 league.teams=league.teams.map((template,i)=>{
  const school=COLLEGE_TEAMS[i],tier=SCHOOL_TIERS[school.tier];
  const team={...template,...school};
  team.roster=template.roster.map((p,j)=>({...p,id:school.id+'-'+p.slot.toLowerCase(),age:19+j%4,rating:clamp(p.rating+tier.rosterBonus,55,94)}));
  // Scheme affects the supporting cast, not the user's available playbook.
  for(const p of team.roster)if(school.scheme==='spread'&&['WR','TE'].includes(p.position)||school.scheme==='run'&&['RB','OL'].includes(p.position))p.rating=clamp(p.rating+3,55,94);
  team.coaches={oc:{...template.coaches.oc,rating:clamp(template.coaches.oc.rating+tier.rosterBonus,50,95)},dc:{...template.coaches.dc,rating:clamp(template.coaches.dc.rating+tier.rosterBonus,50,95)}};
  return team;
 });
 league.schedule=collegeSchedule(league.teams);League.refreshRatings(league);return league;
}
export function collegeStandings(c,conf){return c.league.teams.filter(t=>t.conference===conf).sort((a,b)=>b.record.conferenceWins-a.record.conferenceWins||b.record.wins-a.record.wins||(b.record.pointsFor-b.record.pointsAgainst)-(a.record.pointsFor-a.record.pointsAgainst)||a.id.localeCompare(b.id));}
export function seedCollegePostseason(c){
 const conferenceIds=[...new Set(c.league.teams.map(t=>t.conference))];
 c.postseason={round:1,seeds:[],games:[],champion:null};
 for(const conf of conferenceIds){
  const teams=collegeStandings(c,conf);
  c.postseason.seeds.push(teams[0].id,teams[1].id);
  c.postseason.games.push({id:'college-final-'+conf,week:13,round:1,conference:conf,homeTeamId:teams[0].id,awayTeamId:teams[1].id,status:'scheduled',homeScore:null,awayScore:null});
 }
}
export function collegeGameAssessment(c,stats,won,opponent){
 const school=COLLEGE_TEAMS.find(t=>t.id===c.teamId),tier=SCHOOL_TIERS[school.tier],settings=c.matchContext||c.settings;
 const attempts=Math.max(1,stats.attempts),completion=stats.completions/attempts;
 const goalMet=stats.attempts>=6&&completion>=tier.goalCompletions&&stats.interceptions<=tier.goalTurnovers;
 const difficulty={easy:0,medium:3,hard:6,gridiron:9}[settings.difficulty]||0;
 // Efficiency avoids rewarding longer quarters simply for generating more snaps.
 const score=stats.attempts<6?20:clamp(completion*30+clamp(stats.passingYards/attempts,0,10)*3+clamp(stats.passingTD/attempts,0,.12)/.12*20-stats.interceptions/attempts*120+(won?8:0)+clamp((opponent.ratings.defense-65)/3,-5,8)+difficulty,0,100);
 return {score:Math.round(score),difficulty:settings.difficulty,quarterMinutes:settings.quarterMinutes,opponentDefense:opponent.ratings.defense,goal:{label:`Complete ${Math.round(tier.goalCompletions*100)}% of passes, at most ${tier.goalTurnovers} INT (6+ attempts)`,met:goalMet,xp:goalMet?tier.goalXP:0}};
}
export function draftProjection(c){
 const games=c.history.filter(r=>r.collegeAssessment);
 if(!games.length)return {score:50,pick:112,round:4,label:'Unscouted · prove yourself this season'};
 const score=(games.reduce((s,r)=>s+r.collegeAssessment.score,0)+50*2)/(games.length+2);
 const adjusted=clamp((score-20)/70,0,1),pick=clamp(Math.round(224-adjusted*223),1,224);
 return {score:Math.round(score),pick,round:Math.ceil(pick/32),label:`Projected round ${Math.ceil(pick/32)} · around pick ${pick}`};
}
export function enterDraft(c){
 if(c.stage!=='college'||!c.postseason?.champion||c.activeMatch)return false;
 if(c.draft)return c.draft;
 const projection=draftProjection(c),league=League.createFranchise('bos');
 // A fresh pro league's strength supplies draft order; QB need breaks nearby choices.
 const order=[...league.teams].sort((a,b)=>a.ratings.overall-b.ratings.overall||a.id.localeCompare(b.id));
 const candidates=[];
 for(let pick=Math.max(1,projection.pick-5);pick<=Math.min(224,projection.pick+5);pick++){
  const team=order[(pick-1)%32],qb=team.roster.find(p=>p.slot==='QB');
  candidates.push({pick,team,need:100-qb.rating-Math.abs(pick-projection.pick)});
 }
 candidates.sort((a,b)=>b.need-a.need||a.pick-b.pick);
 const choice=candidates[0];c.draft={pick:choice.pick,round:Math.ceil(choice.pick/32),teamId:choice.team.id,projection,league};return c.draft;
}
export function beginProCareer(c){
 if(c.stage!=='college'||!c.draft||c.activeMatch)return false;
 const oldTeam=League.findTeamState(c.league,c.teamId),player=oldTeam.roster.find(p=>p.id===c.playerId);
 c.collegeArchive={school:{id:oldTeam.id,city:oldTeam.city,name:oldTeam.name,abbr:oldTeam.abbr},stats:{...c.totals},history:c.history,awards:c.awards,champion:c.postseason.champion,draft:{pick:c.draft.pick,round:c.draft.round,teamId:c.draft.teamId}};
 const next=c.draft.league,team=League.findTeamState(next,c.draft.teamId),index=team.roster.findIndex(p=>p.slot==='QB');
 const occupied=new Set(team.roster.filter((_,i)=>i!==index).map(p=>p.number));
 for(const teammate of team.roster)if(teammate!==team.roster[index]&&teammate.number===player.number){for(let n=0;n<100;n++)if(!occupied.has(n)&&n!==player.number){teammate.number=n;occupied.add(n);break;}}
 team.roster[index]={...player,attributes:{...player.attributes},age:22,contractYears:4};
 c.teamId=team.id;next.userTeamId=team.id;c.league=next;c.stage='pro';c.totals=emptyStats();c.seasonStats=emptyStats();c.history=[];c.awards=[];c.postseason=null;c.lastResult=null;c.pendingRecapGameId=null;c.matchContext=null;c.draft=null;League.refreshRatings(next);return true;
}
