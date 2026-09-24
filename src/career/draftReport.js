import {proProjection} from './development.js';
export function buildDraftReport(c,draft){
 const college=c.league.teams.find(t=>t.id===c.teamId),player=college.roster.find(p=>p.id===c.playerId),team=draft.league.teams.find(t=>t.id===draft.teamId),qb=team.roster.find(p=>p.slot==='QB');
 const s=c.totals,attempts=s.attempts||0,strengths=[],concerns=[];
 if(attempts>=6){
  const completion=s.completions/attempts,ypa=s.passingYards/attempts,turnovers=s.interceptions/attempts;
  (completion>=.65?strengths:concerns).push(`${Math.round(completion*100)}% completion rate${completion>=.65?' shows consistent accuracy':'; accuracy needs work'}.`);
  (ypa>=7?strengths:concerns).push(`${ypa.toFixed(1)} yards per attempt${ypa>=7?' shows productive passing':'; create more gains through the air'}.`);
  (turnovers<=.025?strengths:concerns).push(`${s.interceptions} interceptions on ${attempts} attempts${turnovers<=.025?' shows ball security':'; protect the ball against pro defenses'}.`);
 }else concerns.push('Limited passing sample. Scouts have fewer throws to evaluate.');
 if(s.rushingYards>=100)strengths.push(`${s.rushingYards} rushing yards adds a threat on the ground.`);
 const rating=proProjection(player,c),wins=draft.round<=2?9:draft.round<=4?7:5;
 const expectations=[{kind:'wins',target:wins,label:`Win ${wins} regular-season games`},{kind:'completion',target:.6,minAttempts:100,label:'Complete 60% of passes on 100+ attempts'},{kind:'interceptionRate',target:.03,minAttempts:100,label:'Keep interceptions at 3% or less on 100+ attempts'}];
 return {school:`${college.city} ${college.name}`,record:{...college.record},stats:{...s},awards:c.awards.filter(a=>a.season===c.league.season).map(a=>a.title),honors:c.collegeHonors||null,rating,strengths,concerns,projection:draft.projection,
  selectionReason:`${team.abbr} selected you near your projected pick ${draft.projection.pick}. Their current QB is rated ${qb.rating}; quarterback need helped determine your destination among teams picking nearby.`,
  teammates:team.roster.filter(p=>['WR1','WR2','TE','RB'].includes(p.slot)).sort((a,b)=>b.rating-a.rating).slice(0,3).map(p=>({name:[p.firstName,p.lastName].filter(Boolean).join(' '),slot:p.slot,rating:p.rating})),expectations,contractYears:draft.round<=2?4:draft.round<=4?3:2};
}
