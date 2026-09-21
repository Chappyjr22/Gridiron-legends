import {proProjection,normalizeQuarterback,awardExperience} from './development.js';
import * as League from '../state/league.js';
import {COLLEGE_TEAMS,SCHOOL_TIERS} from './collegeData.js';
import {emptyStats} from './stats.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const COLLEGE_TALENT={powerhouse:'elite',competitive:'average',rebuilding:'rebuilding'};
export function collegeSchedule(teams){
 const games=[],groups=[...new Set(teams.map(t=>t.conference))].map(c=>teams.filter(t=>t.conference===c).map(t=>t.id));
 const add=(a,b,week,swap)=>games.push({id:`college-w${week}-${a}-${b}`,week,homeTeamId:swap?b:a,awayTeamId:swap?a:b,status:'scheduled',homeScore:null,awayScore:null});
 for(const ids of groups){const ring=[...ids];for(let round=0;round<7;round++){for(let i=0;i<4;i++){const a=ids.indexOf(ring[i]),b=ids.indexOf(ring[7-i]),distance=(b-a+8)%8;add(ring[i],ring[7-i],round+1,groups.indexOf(ids)%2===0?!(distance<4||distance===4&&a<b):(distance<4||distance===4&&a<b));}ring.splice(1,0,ring.pop());}}
 const pairs=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 for(let r=0;r<5;r++)for(const [a,b] of pairs[r%3])for(let i=0;i<8;i++)add(groups[a][i],groups[b][(i+Math.floor(r/3))%8],r+8,(r+i)%2);
 balanceCrossConferenceVenues(games,teams);
 return games;
}
function balanceCrossConferenceVenues(games,teams){
 const cross=games.filter(g=>g.week>7),source=0,gameStart=1,teamStart=1+cross.length,sink=teamStart+teams.length;
 const graph=Array.from({length:sink+1},()=>[]);
 const edge=(a,b,capacity)=>{const forward={to:b,capacity,reverse:graph[b].length},back={to:a,capacity:0,reverse:graph[a].length};graph[a].push(forward);graph[b].push(back);return forward;};
 const choices=cross.map((g,i)=>{
  edge(source,gameStart+i,1);
  return [g.homeTeamId,g.awayTeamId].map(id=>({id,edge:edge(gameStart+i,teamStart+teams.findIndex(t=>t.id===id),1)}));
 });
 teams.forEach((t,i)=>edge(teamStart+i,sink,6-games.filter(g=>g.week<=7&&g.homeTeamId===t.id).length));
 let flow=0;
 while(flow<cross.length){
  const previous=Array(graph.length).fill(null),queue=[source];previous[source]={};
  for(let n=0;n<queue.length&&!previous[sink];n++)for(let i=0;i<graph[queue[n]].length;i++){
   const e=graph[queue[n]][i];if(e.capacity>0&&!previous[e.to]){previous[e.to]={from:queue[n],index:i};queue.push(e.to);}
  }
  if(!previous[sink])throw Error('College home/away schedule could not be balanced.');
  for(let node=sink;node!==source;){const p=previous[node],e=graph[p.from][p.index];e.capacity--;graph[node][e.reverse].capacity++;node=p.from;}flow++;
 }
 cross.forEach((g,i)=>{g.homeTeamId=choices[i].find(c=>c.edge.capacity===0).id;g.awayTeamId=choices[i].find(c=>c.id!==g.homeTeamId).id;});
}
function collegeDevelopment(player,schoolTier,index,schoolId){
 const rating=player.rating;
 const roll=(rating*7+index*13+schoolId.length*11)%100;
 const baseElite={powerhouse:17,competitive:8,rebuilding:3}[schoolTier]||8;
 const baseImpact={powerhouse:39,competitive:27,rebuilding:17}[schoolTier]||27;
 const eliteCut=clamp(baseElite+Math.max(0,rating-84)*2,2,48);
 const impactCut=clamp(eliteCut+baseImpact+Math.max(0,rating-76),eliteCut+10,88);
 if(roll<eliteCut)return 'Elite';
 if(roll<impactCut)return 'Impact';
 return 'Normal';
}
export function ensureCollegeTalent(league){
 if(!league||league.kind!=='college')return league;
 for(const [i,team] of league.teams.entries()){
  if(team.talentModelVersion>=1)continue;
  const school=COLLEGE_TEAMS.find(s=>s.id===team.id)||COLLEGE_TEAMS[i];
  if(!school)continue;
  const talentTier=COLLEGE_TALENT[school.tier]||'average';
  const generated=League.createRosterForTier(school,league.season||1,talentTier);
  for(const [j,player] of team.roster.entries()){
   if(player.archetype)continue;
   const template=generated.find(p=>p.slot===player.slot)||generated[j];
   if(!template)continue;
   const old=Number(player.rating)||74;
   let rating=template.rating;
   if(school.scheme==='spread'&&['WR','TE'].includes(player.position)||school.scheme==='run'&&['RB','OL'].includes(player.position))rating=clamp(rating+3,55,97);
   const delta=rating-old;
   player.rating=rating;
   player.development=collegeDevelopment(player,school.tier,j,school.id);
   if(player.attributes&&typeof player.attributes==='object')for(const key of Object.keys(player.attributes)){
    const value=Number(player.attributes[key]);if(Number.isFinite(value))player.attributes[key]=clamp(Math.round(value+delta),45,97);
   }
  }
  const coachTemplate={oc:League.createCoachForTier(school,'OC',league.season||1,talentTier),dc:League.createCoachForTier(school,'DC',league.season||1,talentTier)};
  for(const side of ['oc','dc'])if(team.coaches?.[side])team.coaches[side].rating=coachTemplate[side].rating;
  team.talentTier=talentTier;team.programTier=school.tier;team.talentModelVersion=1;
 }
 League.refreshRatings(league);return league;
}
export function createCollegeLeague(schoolId){
 if(!COLLEGE_TEAMS.some(t=>t.id===schoolId))throw Error('Choose a college.');
 const league=League.createFranchise('bos');
 league.kind='college';league.leagueName='Gridiron College League';league.userTeamId=schoolId;
 league.teams=league.teams.map((template,i)=>{
  const school=COLLEGE_TEAMS[i],talentTier=COLLEGE_TALENT[school.tier]||'average';
  const team={...template,...school,talentTier,programTier:school.tier,talentModelVersion:1};
  team.roster=League.createRosterForTier(school,1,talentTier).map((p,j)=>({...p,id:school.id+'-'+p.slot.toLowerCase(),age:19+j%4}));
  // Scheme affects the supporting cast, not the user's available playbook.
  for(const [j,p] of team.roster.entries()){
   if(school.scheme==='spread'&&['WR','TE'].includes(p.position)||school.scheme==='run'&&['RB','OL'].includes(p.position))p.rating=clamp(p.rating+3,55,97);
   p.development=collegeDevelopment(p,school.tier,j,school.id);
  }
  team.coaches={oc:League.createCoachForTier(school,'OC',1,talentTier),dc:League.createCoachForTier(school,'DC',1,talentTier)};
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
 const performance=clamp(completion*30+clamp(stats.passingYards/attempts,0,10)*3+clamp(stats.passingTD/attempts,0,.12)/.12*20-stats.interceptions/attempts*120+(won?8:0)+clamp((opponent.ratings.defense-65)/3,-5,8)+difficulty,0,100);
 const weight=Math.min(1,stats.attempts/6);const score=20*(1-weight)+performance*weight;
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
 for(let pick=Math.max(1,projection.pick-5);pick<=(projection.pick===1?1:Math.min(224,projection.pick+5));pick++){
  const team=order[(pick-1)%32],qb=team.roster.find(p=>p.slot==='QB');
  candidates.push({pick,team,need:100-qb.rating-Math.abs(pick-projection.pick)});
 }
 candidates.sort((a,b)=>b.need-a.need||a.pick-b.pick);
 const choice=candidates[0];c.draft={pick:choice.pick,round:Math.ceil(choice.pick/32),teamId:choice.team.id,projection,league};return c.draft;
}
export function beginProCareer(c){
 if(c.stage!=='college'||!c.draft||c.activeMatch)return false;
 const oldTeam=League.findTeamState(c.league,c.teamId),player=oldTeam.roster.find(p=>p.id===c.playerId);
 const projection=proProjection(player,c);
 c.collegeArchive={finalOverall:player.rating,attributes:{...player.attributes},development:c.settings.development||'standard',school:{id:oldTeam.id,city:oldTeam.city,name:oldTeam.name,abbr:oldTeam.abbr},stats:{...c.totals},history:c.history,awards:c.awards,champion:c.postseason.champion,draft:{pick:c.draft.pick,round:c.draft.round,teamId:c.draft.teamId}};
 const next=c.draft.league,team=League.findTeamState(next,c.draft.teamId),index=team.roster.findIndex(p=>p.slot==='QB');
 const occupied=new Set(team.roster.filter((_,i)=>i!==index).map(p=>p.number));
 for(const teammate of team.roster)if(teammate!==team.roster[index]&&teammate.number===player.number){for(let n=0;n<100;n++)if(!occupied.has(n)&&n!==player.number){teammate.number=n;occupied.add(n);break;}}
 team.roster[index]={...player,attributes:projection.attributes,age:22,contractYears:c.draft.round<=2?4:c.draft.round<=4?3:2};
 normalizeQuarterback(team.roster[index]);
 c.proEntry={collegeOverall:projection.collegeOverall,rookieOverall:projection.overall,levelAtEntry:c.level,round:c.draft.round,pick:c.draft.pick,expectation:c.draft.round<=2?'Lead a winning season':c.draft.round<=4?'Establish yourself as a starter':'Prove you belong'};c.coachConfidence=c.draft.round<=2?65:c.draft.round<=4?50:40;
 next.careerQuarterMinutes=c.settings.quarterMinutes;
 c.teamId=team.id;next.userTeamId=team.id;c.league=next;c.stage='pro';
 if(c.progressionVersion===2){
  // College levels award three points; carry unused value into the pro economy.
  const remainder=c.points%3;c.points=Math.floor(c.points/3);awardExperience(c,Math.floor(remainder*100/3));
 }
 c.totals=emptyStats();c.seasonStats=emptyStats();c.history=[];c.awards=[];c.postseason=null;c.lastResult=null;c.pendingRecapGameId=null;c.matchContext=null;c.draft=null;League.refreshRatings(next);return true;
}
