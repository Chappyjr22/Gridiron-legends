import {separation,touching} from './contact.js';
import {XPX,ROUTE_YPS,SPEED_SCALE,clamp} from '../state/constants.js';
// Skill blockers must reach a defender. Delayed routes chip only until release.
export function advanceSkillBlocks({players,defenders,play,los,elapsed,now,dt,moveToward}){
 const keys=new Set([...(play.blocks||[]),...Object.keys(play.routeDelays||{}).filter(k=>elapsed<play.routeDelays[k])]);
 const assigned=new Set();
 for(const key of keys){
  const blocker=players[key];if(!blocker)continue;
  let target=null,distance=120;
  for(const defender of defenders){
   if(assigned.has(defender)||defender.dive||defender.missedUntil>now)continue;
   const d=separation(blocker,defender);if(d<distance){target=defender;distance=d;}
  }
  if(!target)continue;assigned.add(target);
  const run=play.type==='run'||play.type==='screen';
  moveToward(blocker,target.x,run?target.yfield:Math.min(target.yfield,(los+1)*XPX),ROUTE_YPS*XPX*SPEED_SCALE*.85,dt);
  blocker.isBlocking=true;
  if(touching(blocker,target)&&now>=(target.nextBlockAt||0)){
   target.blockedUntil=now+clamp(300+((blocker.rating||68)-(target.rating||68))*5,160,500);
   target.nextBlockAt=now+1500;
  }
 }
}
