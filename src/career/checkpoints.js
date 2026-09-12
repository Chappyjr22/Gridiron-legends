import {emptyStats} from './stats.js';
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const text=v=>typeof v==='string'&&v.length<=2000;
export function validStats(stats){
 return object(stats)&&Object.keys(emptyStats()).every(k=>Number.isInteger(stats[k])&&number(stats[k],['passingYards','rushingYards','receivingYards'].includes(k)?-100000:0,10000000));
}
export function validCheckpoint(saved,career){
 if(!object(saved)||!object(saved.game)||!object(saved.stats)||!object(saved.resume))return false;
 const {game:g,stats:s,resume:r}=saved;
 const match=[...career.league.schedule,...(career.postseason?.games||[])].find(m=>m.id===career.activeMatch);
 if(!match||g.userTeamId!==career.teamId||g.cpuTeamId!==(match.homeTeamId===career.teamId?match.awayTeamId:match.homeTeamId))return false;
 if(!['playerScore','cpuScore','quarter','otRound','down'].every(k=>Number.isInteger(g[k])&&g[k]>=0))return false;
 if(!number(g.quarter,1,5)||!number(g.down,1,5)||!number(g.los,0,100)||!number(g.firstDownYard,0,110)||!number(g.distance,0,110)||!number(g.momentum,-1,1))return false;
 if(![2,3,4,5].includes(g.quarterMinutes)||!number(g.clock,0,300))return false;
 if(!['easy','medium','hard','gridiron'].includes(g.difficulty)||!['drag','direct','tap'].includes(g.passMode)||!['lob','bullet'].includes(g.throwType))return false;
 if(g.career!==true||g.practice!==false||typeof g.overtime!=='boolean'||typeof g.showRoutes!=='boolean')return false;
 if(!['possession','firstHalfReceiver','secondHalfReceiver'].every(k=>['player','cpu'].includes(g[k])))return false;
 if(!Array.isArray(s.plays)||!object(s.players)||!Object.values(s.players).every(validStats))return false;
 if(s.opponentDrives!==undefined&&(!Array.isArray(s.opponentDrives)||!s.opponentDrives.every(d=>object(d)&&[0,3,6,7].includes(d.points)&&Number.isInteger(d.yards)&&number(d.yards,0,100)&&typeof d.turnover==='boolean')))return false;
 const team=career.league.teams.find(t=>t.id===career.teamId);
 const known=id=>team.roster.some(p=>p.id===id)||new RegExp('^'+team.id+'-generic-[0-9]{1,2}$').test(id);
 if(!Object.keys(s.players).every(known))return false;
 const ids=new Set();
 for(const p of s.plays){
  if(!object(p)||!text(p.id)||ids.has(p.id)||!known(p.qbId)||!Number.isInteger(p.yards)||!number(p.yards,-110,110))return false;
  ids.add(p.id);
  if(!['carrierId','targetId','receiverId'].every(k=>p[k]==null||known(p[k])))return false;
  if(!['threw','touchdown','intercepted','sacked'].every(k=>typeof p[k]==='boolean'))return false;
 }
 if(r.type==='offense')return true;
 if(!text(r.message))return false;
 if(r.type==='afterPlay')return true;
 if(r.type==='turnover')return number(r.cpuStart,0,100)&&text(r.reason);
 if(r.type==='cpuResult')return number(r.playerStart,0,100);
 if(r.type==='kickoff')return ['player','cpu'].includes(r.receiver)&&number(r.spot,0,100)&&text(r.buttonLabel);
 return false;
}
