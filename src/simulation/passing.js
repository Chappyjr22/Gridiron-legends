import {XPX,SPEED_SCALE,ROUTE_YPS,BALL_SPEED_BULLET,BALL_SPEED_LOB,clamp,ratingMultiplier} from '../state/constants.js';
import {catchTolerance} from './receiving.js';
export function advanceRoute(player,waypoints,speed,dt,los){
 if(!waypoints?.length)return;
 let remaining=Math.max(0,speed*dt);
 for(let count=0;count<=waypoints.length;count++){
  const index=Math.min(player.routeIdx||0,waypoints.length-1),wp=waypoints[index];
  const dx=wp.x-player.x,dy=(los+wp.y)*XPX-player.yfield,d=Math.hypot(dx,dy);
  if(d>0){const step=Math.min(d,remaining);if(Math.abs(dy)>.5)player.facing=dy>0?'left':'right';player.x+=dx/d*step;player.yfield+=dy/d*step;remaining-=step;}
  if(Math.hypot(wp.x-player.x,(los+wp.y)*XPX-player.yfield)>.001)return;
  if(index>=waypoints.length-1)return;
  player.routeIdx=index+1;if(remaining<=0)return;
 }
}
export function throwProfile(qb,landing,kind){
 const distance=Math.hypot(landing.x-qb.x,landing.yfield-qb.yfield);
 const speed=(kind==='bullet'?BALL_SPEED_BULLET:BALL_SPEED_LOB)*ratingMultiplier(qb.attributes?.arm??qb.rating,.16);
 return {duration:Math.max(180,distance/speed*1000),releaseDelay:clamp(125-((qb.attributes?.release??qb.rating)-60)*2,55,125),arcHeight:Math.min(60,distance*.12)*(kind==='bullet'?.3:1)};
}
// Predict from route data without modifying the receiver or moving the landing point.
export function passingRead({players,play,los,elapsed,landing,kind,difficulty}){
 const profile=throwProfile(players.qb,landing,kind),arrival=profile.duration+profile.releaseDelay;
 let best=null;
 for(const [key,route] of Object.entries(play.routes||{})){
  const receiver=players[key],predicted={...receiver},speed=ROUTE_YPS*XPX*SPEED_SCALE*difficulty.offenseSpeedMult*ratingMultiplier(receiver.rating,.18);
  const delay=Math.max(0,(play.routeDelays?.[key]||0)-elapsed);
  advanceRoute(predicted,route,speed,Math.max(0,arrival-delay)/1000,los);
  const error=Math.hypot(predicted.x-landing.x,predicted.yfield-landing.yfield),tolerance=catchTolerance(receiver,difficulty);
  if(!best||error/tolerance<best.error/best.tolerance)best={key,predicted,error,tolerance,reachable:error<=tolerance+speed*Math.min(450,Math.max(0,arrival-delay))/1000};
 }
 return {...profile,target:best};
}
