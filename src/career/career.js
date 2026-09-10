import * as League from '../state/league.js';
import {emptyStats,addStats} from './stats.js';
export const CAREER_KEY='gridironLegendsCareerV1';
export const ARCHETYPES={
 precision:{name:'Precision passer',description:'Place the ball into tighter windows.',attributes:{accuracy:82,arm:68,release:73}},
 power:{name:'Strong arm',description:'Put more velocity behind downfield throws.',attributes:{accuracy:70,arm:84,release:69}},
 quick:{name:'Quick release',description:'Get the ball out before pressure arrives.',attributes:{accuracy:74,arm:69,release:83}}
};
export function careerPlayer(c){return League.findTeamState(c.league,c.teamId).roster.find(p=>p.id===c.playerId);}
export function createCareer({name,number=7,teamId='bos',archetype='precision',skin=2,difficulty='medium',quarterMinutes=2}){
 const cleanName=String(name||'').trim().replace(/\s+/g,' ').slice(0,28);
 if(!cleanName)throw Error('Enter your player name.');
 if(!League.TEAMS.some(t=>t.id===teamId)||!ARCHETYPES[archetype])throw Error('Choose a team and playing style.');
 number=Number(number);if(!Number.isInteger(number)||number<0||number>19)throw Error('Choose a QB number from 0 to 19.');
 const league=League.createFranchise(teamId),team=League.findTeamState(league,teamId),player=team.roster.find(p=>p.slot==='QB');
 const used=new Set(team.roster.map(p=>p.number));
 for(const teammate of team.roster)if(teammate!==player&&teammate.number===number){for(let n=0;n<100;n++)if(!used.has(n)&&n!==number){teammate.number=n;used.add(n);break;}}
 const names=cleanName.split(' ');Object.assign(player,{firstName:names.shift(),lastName:names.join(' '),number,age:21,skin:Math.max(0,Math.min(3,Number(skin)||0)),archetype,attributes:{...ARCHETYPES[archetype].attributes}});
 player.rating=Math.round(Object.values(player.attributes).reduce((a,b)=>a+b)/3);
 League.refreshRatings(league);
 return {schemaVersion:1,teamId,playerId:player.id,league,settings:{difficulty:['easy','medium','hard','gridiron'].includes(difficulty)?difficulty:'medium',quarterMinutes:[2,3,4,5].includes(Number(quarterMinutes))?Number(quarterMinutes):2},xp:0,level:1,points:0,totals:emptyStats(),seasonStats:emptyStats(),history:[],awards:[],postseason:null,lastResult:null,activeMatch:null,checkpoint:null};
}
export function saveCareer(c){try{localStorage.setItem(CAREER_KEY,JSON.stringify(c));return true;}catch{return false;}}
export function parseCareer(raw){
 try{
  const c=JSON.parse(raw);
  if(c?.schemaVersion!==1||!Array.isArray(c.league?.teams)||c.league.teams.length!==32||!Array.isArray(c.league.schedule)||c.league.schedule.length!==272||!c.totals||!c.seasonStats||!Array.isArray(c.history)||!Array.isArray(c.awards))return null;
  if(!c.league.teams.every(t=>League.TEAMS.some(base=>base.id===t.id)&&Array.isArray(t.roster)&&t.record&&t.coaches?.oc&&t.coaches?.dc&&t.ratings))return null;
  const p=careerPlayer(c);if(!p||!ARCHETYPES[p.archetype]||!['accuracy','arm','release'].every(k=>Number.isFinite(p.attributes?.[k])&&p.attributes[k]>=0&&p.attributes[k]<=100))return null;
  if(!['xp','level','points'].every(k=>Number.isFinite(c[k])&&c[k]>=0)||!c.settings)return null;
  if(c.activeMatch&&![...c.league.schedule,...(c.postseason?.games||[])].some(g=>g.id===c.activeMatch&&g.status==='scheduled'))return null;
  if(c.checkpoint&&(!c.activeMatch||!c.checkpoint.game||!c.checkpoint.stats||!['offense','afterPlay','turnover','cpuResult','kickoff'].includes(c.checkpoint.resume?.type)))return null;
  return c;
 }catch{return null;}
}
export function loadCareer(){try{return parseCareer(localStorage.getItem(CAREER_KEY));}catch{return null;}}
export function nextMatch(c){
 if(c.activeMatch)return [...c.league.schedule,...(c.postseason?.games||[])].find(g=>g.id===c.activeMatch)||null;
 if(c.postseason)return c.postseason.games.find(g=>g.status==='scheduled'&&(g.homeTeamId===c.teamId||g.awayTeamId===c.teamId))||null;
 return League.getWeekGames(c.league).find(g=>g.status==='scheduled'&&(g.homeTeamId===c.teamId||g.awayTeamId===c.teamId))||null;
}
export function upgrade(c,attribute){
 const p=careerPlayer(c);if(c.activeMatch||c.points<1||!Object.hasOwn(p.attributes,attribute)||p.attributes[attribute]>=95)return false;
 p.attributes[attribute]=Math.min(95,p.attributes[attribute]+2);p.rating=Math.round(Object.values(p.attributes).reduce((a,b)=>a+b)/3);c.points--;
 League.refreshRatings(c.league);return true;
}
function bracketGame(c,home,away,round,index){return {id:`s${c.league.season}-p${round}-${index}`,week:17+round,round,homeTeamId:home,awayTeamId:away,status:'scheduled',homeScore:null,awayScore:null};}
function seedPlayoffs(c){
 const seeds=Object.keys(League.CONFERENCES).flatMap(conf=>League.standings(c.league,conf).slice(0,4).map(t=>t.id));
 c.postseason={round:1,seeds,games:[],champion:null};
 for(let i=0;i<8;i+=4){c.postseason.games.push(bracketGame(c,seeds[i],seeds[i+3],1,i),bracketGame(c,seeds[i+1],seeds[i+2],1,i+1));}
}
function simulatePostseasonGame(c,g){
 const score=League.simulateScore(c.league,g);g.homeScore=score.homeScore;g.awayScore=score.awayScore;
 if(g.homeScore===g.awayScore)g.homeScore+=3;
 g.status='completed';g.source='simulation';
}
export function progressPostseason(c){
 const p=c.postseason;if(!p||p.champion)return;
 for(let round=0;round<3;round++){
  const games=p.games.filter(g=>g.round===p.round);
  for(const g of games)if(g.status!=='completed'&&g.homeTeamId!==c.teamId&&g.awayTeamId!==c.teamId)simulatePostseasonGame(c,g);
  if(games.some(g=>g.status!=='completed'))return;
  const winners=games.map(g=>g.homeScore>g.awayScore?g.homeTeamId:g.awayTeamId);
  if(winners.length===1){p.champion=winners[0];if(p.champion===c.teamId)c.awards.push({season:c.league.season,title:'League champion'});return;}
  p.round++;
  for(let i=0;i<winners.length;i+=2)p.games.push(bracketGame(c,winners[i],winners[i+1],p.round,i));
 }
}
export function completeCareerGame(c,gameId,userScore,cpuScore,matchStats){
 const match=[...c.league.schedule,...(c.postseason?.games||[])].find(g=>g.id===gameId);
 if(!match||match.status==='completed'||c.activeMatch!==gameId)return false;
 if(![userScore,cpuScore].every(n=>Number.isInteger(n)&&n>=0)||userScore===cpuScore)return false;
 const home=match.homeTeamId===c.teamId,homeScore=home?userScore:cpuScore,awayScore=home?cpuScore:userScore;
 if(match.round)Object.assign(match,{homeScore,awayScore,status:'completed',source:'player'});
 else if(!League.recordGameResult(c.league,gameId,homeScore,awayScore,'player'))return false;
 const stats={...emptyStats(),...(matchStats.players[c.playerId]||{}),games:1};
 addStats(c.totals,stats);addStats(c.seasonStats,stats);
 const xp=40+(userScore>cpuScore?30:0)+Math.min(60,Math.floor(Math.max(0,stats.passingYards)/10))+Math.min(60,stats.passingTD*15);
 c.xp+=xp;let gained=0;while(c.xp>=100){c.xp-=100;c.level++;c.points++;gained++;}
 c.lastResult={gameId,season:c.league.season,week:match.week,userScore,cpuScore,xp,levels:gained,stats,opponentId:home?match.awayTeamId:match.homeTeamId};
 c.history.push(c.lastResult);c.activeMatch=null;c.checkpoint=null;
 if(!match.round){League.simulateWeek(c.league,c.league.week,c.teamId);if(c.league.week<17)League.advanceWeek(c.league);else seedPlayoffs(c);}
 progressPostseason(c);return c.lastResult;
}
export function startNextSeason(c){
 if(c.activeMatch||!c.postseason?.champion)return false;
 const old=c.league,next=League.createFranchise(c.teamId,old.season+1);
 // Keep the people and development. Only schedule and standings restart.
 next.teams.forEach(t=>{const prior=League.findTeamState(old,t.id);t.roster=prior.roster;t.coaches=prior.coaches;t.roster.forEach(p=>p.age++);});
 c.league=next;c.seasonStats=emptyStats();c.postseason=null;c.lastResult=null;League.refreshRatings(c.league);return true;
}
