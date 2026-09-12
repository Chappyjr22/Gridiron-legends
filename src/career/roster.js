// The extra eligible receiver keeps the legacy identity used in saved box scores.
// A roster view exposes him without changing star ratings or old roster schemas.
export function availableNumber(used,preferred){
 for(let i=0;i<100;i++){const n=(Number(preferred)+i)%100;if(!used.has(n)){used.add(n);return n;}}
 return Number(preferred);
}
export function playingRoster(team){
 if(team.roster.some(p=>p.slot==='WR3'))return team.roster;
 const used=new Set(team.roster.map(p=>Number(p.number)));
 return [...team.roster,{id:`${team.id}-generic-15`,slot:'WR3',position:'WR',firstName:'Slot',lastName:'Receiver',number:availableNumber(used,15),rating:team.ratings.genericOffense||68,age:21,development:'Supporting player',generic:true}];
}
export function uniqueLineupNumbers(players,team){
 const used=new Set(playingRoster(team).map(p=>Number(p.number)));
 for(const player of players)if(!player.slot)player.num=String(availableNumber(used,player.num));
}
