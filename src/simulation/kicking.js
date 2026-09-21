import {clamp,XPX} from '../state/constants.js';
export const KICK_GOAL={yard:110,center:190,halfWidth:46,barHeight:32};
export function kickMeter(stage,elapsed,difficulty='medium'){
 const speed={easy:.85,medium:1,hard:1.15,gridiron:1.2}[difficulty]||1;
 return stage==='power'?(1-Math.cos(elapsed*speed/300))/2:-Math.cos(elapsed*speed/400);
}
export function kickTrajectory(los,rating,power,aim,now=0){
 const range=8+(36+clamp(rating,40,99)*.3)*clamp(power,0,1);
 return {inFlight:true,kick:true,fromX:190,fromY:(los-7)*XPX,toX:190+aim*range*3,toY:(los-7+range)*XPX,startTime:now,duration:1400+range*18,arcHeight:45+power*60};
}
export function kickOutcome(ball){
 const p=(KICK_GOAL.yard*XPX-ball.fromY)/(ball.toY-ball.fromY);
 const height=ball.arcHeight*Math.sin(Math.PI*clamp(p,0,1));
 const offset=(ball.toX-ball.fromX)*p;
 const reason=p>=1||height<KICK_GOAL.barHeight?'SHORT':Math.abs(offset)>KICK_GOAL.halfWidth?(offset<0?'WIDE LEFT':'WIDE RIGHT'):'GOOD';
 return {good:reason==='GOOD',reason,p,height,offset};
}
export function kickWindow(los,rating){
 let low=0,high=1;
 if(!kickOutcome(kickTrajectory(los,rating,1,0)).good)return {powerRequired:1.01,aimTolerance:KICK_GOAL.halfWidth/((117-los)*3)};
 for(let i=0;i<20;i++){const mid=(low+high)/2;if(kickOutcome(kickTrajectory(los,rating,mid,0)).good)high=mid;else low=mid;}
 return {powerRequired:high,aimTolerance:clamp(KICK_GOAL.halfWidth/((117-los)*3),0,1)};
}
