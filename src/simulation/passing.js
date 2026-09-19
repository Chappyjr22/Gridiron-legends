import {speedMultiplier} from '../career/playerAttributes.js';
import {XPX,LAT_MIN,LAT_MAX,SPRITE_GROUND_Y_OFFSET,SPEED_SCALE,ROUTE_YPS,BALL_SPEED_BULLET,BALL_SPEED_LOB,clamp,ratingMultiplier} from '../state/constants.js';
import {catchTolerance} from './receiving.js';
export function advanceRoute(player,waypoints,speed,dt,los){
 if(!waypoints?.length)return;
 player.routeOrigin??={x:player.x,yfield:player.yfield};
 let remaining=Math.max(0,speed*dt);
 if(player.routeIdx>=waypoints.length){continueRoute(player,remaining);return;}
 for(let count=0;count<=waypoints.length;count++){
  const index=Math.min(player.routeIdx||0,waypoints.length-1),wp=waypoints[index];
  const dx=wp.x-player.x,dy=(los+wp.y)*XPX-player.yfield,d=Math.hypot(dx,dy);
  if(d>0){const step=Math.min(d,remaining);if(Math.abs(dy)>.5)player.facing=dy>0?'left':'right';player.x+=dx/d*step;player.yfield+=dy/d*step;remaining-=step;}
  if(Math.hypot(wp.x-player.x,(los+wp.y)*XPX-player.yfield)>.001)return;
  if(index>=waypoints.length-1){
   const previous=waypoints[index-1];
   let vx=wp.x-(previous?.x??player.routeOrigin.x),vy=(los+wp.y)*XPX-(previous?(los+previous.y)*XPX:player.routeOrigin.yfield);
   // Hitches work sideways at their depth; deep routes keep their final heading.
   if(waypoints.length===1&&wp.y<8){vx=wp.x<(LAT_MIN+LAT_MAX)/2?1:-1;vy=0;}
   const length=Math.hypot(vx,vy)||1;
   player.routeExit={x:vx/length,y:Math.max(0,vy/length)};player.routeIdx=waypoints.length;
   continueRoute(player,remaining);return;
  }
  player.routeIdx=index+1;if(remaining<=0)return;
 }
}
function continueRoute(player,distance){
 const direction=player.routeExit||{x:0,y:1};
 const low=LAT_MIN+8,high=LAT_MAX-SPRITE_GROUND_Y_OFFSET-8;
 const edge=direction.x>0?high:low;
 const toEdge=direction.x?Math.max(0,(edge-player.x)/direction.x):Infinity;
 const step=Math.min(distance,toEdge);
 player.x=clamp(player.x+direction.x*step,low,high);
 player.yfield+=direction.y*step;
 if(distance>toEdge){player.routeExit={x:0,y:1};player.yfield+=distance-step;}
 player.yfield=Math.min(player.yfield,109*XPX);player.facing='left';
}
export function throwProfile(qb,landing,kind){
 const distance=Math.hypot(landing.x-qb.x,landing.yfield-qb.yfield);
 const speed=(kind==='bullet'?BALL_SPEED_BULLET:BALL_SPEED_LOB)*ratingMultiplier(qb.attributes?.arm??qb.rating,.16);
 return {duration:Math.max(180,distance/speed*1000),releaseDelay:clamp(125-((qb.attributes?.release??qb.rating)-60)*2,55,125),arcHeight:Math.min(60,distance*.12)*(kind==='bullet'?.3:1)};
}
// Predict from route data without modifying the receiver or moving the landing point.
export function passingRead({players,play,los,elapsed,landing,kind,difficulty,difficultyName='medium',momentum=0}){
 const profile=throwProfile(players.qb,landing,kind),arrival=profile.duration+profile.releaseDelay;
 let best=null;
 for(const [key,route] of Object.entries(play.routes||{})){
  const receiver=players[key],predicted={...receiver},speed=ROUTE_YPS*XPX*SPEED_SCALE*difficulty.offenseSpeedMult*speedMultiplier(receiver,difficultyName,momentum);
  const delay=Math.max(0,(play.routeDelays?.[key]||0)-elapsed);
  advanceRoute(predicted,route,speed,Math.max(0,arrival-delay)/1000,los);
  const error=Math.hypot(predicted.x-landing.x,predicted.yfield-landing.yfield),tolerance=catchTolerance(receiver,difficulty);
  if(!best||error/tolerance<best.error/best.tolerance)best={key,predicted,error,tolerance,reachable:error<=tolerance+speed*Math.min(450,Math.max(0,arrival-delay))/1000};
 }
 return {...profile,target:best};
}
