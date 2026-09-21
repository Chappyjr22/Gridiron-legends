// A single QB model is shared by creation, save repair, upgrades and the roster.
export const QB_KEYS=['accuracy','arm','release','speed'];
export const QB_DEFAULT_SPEED={precision:68,power:65,quick:76};
export function normalizeQuarterback(p){
 p.attributes.speed=Number.isFinite(p.attributes.speed)?Math.max(0,Math.min(100,p.attributes.speed)):(QB_DEFAULT_SPEED[p.archetype]||68);
 p.rating=Math.round(QB_KEYS.reduce((n,k)=>n+p.attributes[k],0)/QB_KEYS.length);
 return p;
}
export function upgradeOffer(p,key,c){
 const value=p.attributes[key];
 if(c?.progressionVersion===2&&c.stage==='college')return {cost:value<80?1:value<90?2:3,gain:Math.max(0,Math.min(2,99-value))};
 const specialty={precision:'accuracy',power:'arm',quick:'release'}[p.archetype];
 const cost=(value<80?1:value<86?2:value<90?3:5)+(value>=86&&key!==specialty?1:0);
 return {cost,gain:Math.max(0,Math.min(2,(c?.progressionVersion===2?99:95)-value))};
}
export const DEVELOPMENT={
 steady:{name:'Steady',multiplier:.75,description:'Slower growth. Every upgrade matters.'},
 standard:{name:'Standard',multiplier:1,description:'Balanced growth through your career.'},
 fast:{name:'Fast',multiplier:2,description:'Faster growth in college and the pros.'}
};
export const RECOMMENDED_DEVELOPMENT={powerhouse:'steady',competitive:'standard',rebuilding:'fast'};
export function developmentProfile(c){return c?.progressionVersion===2?DEVELOPMENT[c.settings.development]:DEVELOPMENT.standard;}
export function pointsPerLevel(c){return c?.progressionVersion===2&&c.stage==='college'?3:1;}
export function levelThreshold(level,c){
 if(c?.progressionVersion===2&&c.stage==='college')return 100;
 const start=c?.progressionVersion===2?(c.proEntry?.levelAtEntry||1):1;
 return Math.min(200,100+Math.floor(Math.max(0,level-start)/5)*10);
}
export function applyDevelopment(breakdown,c){
 const multiplier=developmentProfile(c).multiplier;
 return breakdown.map(item=>({...item,xp:Math.round(item.xp*multiplier)}));
}
export function awardExperience(c,xp){
 c.xp+=xp;let levels=0,points=0;
 while(c.xp>=levelThreshold(c.level,c)){c.xp-=levelThreshold(c.level,c);c.level++;const gain=pointsPerLevel(c);c.points+=gain;points+=gain;levels++;}
 return {levels,points};
}
// Ratings are relative to competition. Apply the same monotonic curve to each
// ability so the player's strengths survive and gameplay matches the new OVR.
export function proAttribute(value){return Math.round(Math.min(value,Math.max(0,Math.min(85,value>90?78+(value-90)*7/9:15+value*.7))));}
export function proProjection(player,c){
 const attributes=Object.fromEntries(Object.entries(player.attributes).map(([k,v])=>[k,c?.progressionVersion===2?proAttribute(v):v]));
 return {collegeOverall:player.rating,overall:Math.round(QB_KEYS.reduce((n,k)=>n+attributes[k],0)/4),attributes};
}
export function weeklyGoal(c){
 const week=c.postseason?12+c.postseason.round:c.league.week;
 const goals=[
  {kind:'efficient',label:'Complete 60% of passes on 6+ attempts',target:.6},
  {kind:'secure',label:'No interceptions on 6+ attempts',target:0},
  {kind:'moving',label:'Average 7 yards per pass on 6+ attempts',target:7},
  {kind:'balanced',label:'Score 2 passing or rushing touchdowns',target:2},
  {kind:'scramble',label:'Gain 15 rushing yards with your QB',target:15},
  {kind:'win',label:'Win with no more than 1 interception',target:1}
 ];
 return {...goals[(week-1)%goals.length],xp:Math.round((c.stage==='college'?20:25)*developmentProfile(c).multiplier)};
}
export function assessGoal(c,s,won){
 const g=weeklyGoal(c),a=s.attempts||0;
 const met={efficient:a>=6&&s.completions/a>=g.target,secure:a>=6&&!s.interceptions,moving:a>=6&&s.passingYards/a>=g.target,balanced:s.passingTD+s.rushingTD>=2,scramble:s.rushingYards>=15,win:won&&s.interceptions<=1}[g.kind];
 return {...g,met:!!met,xp:met?g.xp:0};
}
