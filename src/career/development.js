// A single QB model is shared by creation, save repair, upgrades and the roster.
export const QB_KEYS=['accuracy','arm','release','speed'];
export const QB_DEFAULT_SPEED={precision:68,power:65,quick:76};
export function normalizeQuarterback(p){
 p.attributes.speed=Number.isFinite(p.attributes.speed)?Math.max(0,Math.min(100,p.attributes.speed)):(QB_DEFAULT_SPEED[p.archetype]||68);
 p.rating=Math.round(QB_KEYS.reduce((n,k)=>n+p.attributes[k],0)/QB_KEYS.length);
 return p;
}
export function upgradeOffer(p,key){
 const value=p.attributes[key];
 const specialty={precision:'accuracy',power:'arm',quick:'release'}[p.archetype];
 const cost=(value<80?1:value<86?2:value<90?3:5)+(value>=86&&key!==specialty?1:0);
 return {cost,gain:Math.max(0,Math.min(2,95-value))};
}
export function levelThreshold(level){return Math.min(200,100+Math.floor(Math.max(0,level-1)/5)*10);}
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
 return {...goals[(week-1)%goals.length],xp:c.stage==='college'?20:25};
}
export function assessGoal(c,s,won){
 const g=weeklyGoal(c),a=s.attempts||0;
 const met={efficient:a>=6&&s.completions/a>=g.target,secure:a>=6&&!s.interceptions,moving:a>=6&&s.passingYards/a>=g.target,balanced:s.passingTD+s.rushingTD>=2,scramble:s.rushingYards>=15,win:won&&s.interceptions<=1}[g.kind];
 return {...g,met:!!met,xp:met?g.xp:0};
}
