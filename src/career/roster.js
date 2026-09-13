import {ensurePlayerAttributes} from './playerAttributes.js';

// The extra eligible receiver keeps the legacy identity used in saved box scores.
// A roster view exposes him without changing star ratings or old roster schemas.
export function availableNumber(used,preferred){
 for(let i=0;i<100;i++){const n=(Number(preferred)+i)%100;if(!used.has(n)){used.add(n);return n;}}
 return Number(preferred);
}
const SUPPORT_FIRST=['Adrian','Brandon','Damon','Elliott','Felix','Gavin','Holden','Isaac','Jonah','Kellan','Landon','Mason'];
const SUPPORT_LAST=['Abbott','Bishop','Conley','Dalton','Everett','Finley','Gaines','Hampton','Ingram','Jennings','Keller','Lawrence'];
function withAttributes(team,players){
 for(const player of players)ensurePlayerAttributes(player,team.id);
 return players;
}
export function playingRoster(team){
 if(team.roster.some(p=>p.slot==='WR3'))return withAttributes(team,team.roster);
 let seed=0;for(const c of team.id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const used=new Set(team.roster.map(p=>Number(p.number)));
 const support={id:`${team.id}-generic-15`,slot:'WR3',position:'WR',firstName:SUPPORT_FIRST[seed%SUPPORT_FIRST.length],lastName:SUPPORT_LAST[Math.floor(seed/13)%SUPPORT_LAST.length],number:availableNumber(used,15),rating:team.ratings.genericOffense||68,age:21,development:'Supporting player',generic:true};
 return withAttributes(team,[...team.roster,support]);
}
export function uniqueLineupNumbers(players,team){
 const used=new Set(playingRoster(team).map(p=>Number(p.number)));
 for(const player of players)if(!player.slot)player.num=String(availableNumber(used,player.num));
}
