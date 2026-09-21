import {clamp} from '../state/constants.js';
export function flightPosition(ball,now){
 const p=clamp((now-ball.startTime)/ball.duration,0,1);
 return {x:(ball.fromX??ball.toX)+(ball.toX-(ball.fromX??ball.toX))*p,yfield:(ball.fromY??ball.toY)+(ball.toY-(ball.fromY??ball.toY))*p,height:(ball.arcHeight||0)*Math.sin(Math.PI*p),p};
}
export function looseBall(position,{vx=0,vy=0,vz=110,live=false,now=0}={}){
 return {inFlight:false,loose:true,live,x:position.x,yfield:position.yfield,height:position.height||2,vx,vy,vz,spin:0,bounces:0,createdAt:now};
}
export function advanceLooseBall(ball,dt){
 if(!ball.loose||ball.settled)return;
 ball.x+=ball.vx*dt;ball.yfield+=ball.vy*dt;
 ball.height+=ball.vz*dt;ball.vz-=430*dt;ball.spin+=dt*(6+Math.hypot(ball.vx,ball.vy)*.035);
 if(ball.height<=0){
  ball.height=0;ball.bounces++;ball.vz=Math.abs(ball.vz)*.43;
  ball.vx*=.64;ball.vy*=.64;
  if(ball.vz<12){ball.vz=0;ball.vx*=Math.exp(-12*dt);ball.vy*=Math.exp(-12*dt);}
  if(ball.vz===0&&Math.hypot(ball.vx,ball.vy)<5){ball.vx=0;ball.vy=0;ball.settled=true;}
 }
}
export function fumbleChance(runner,defender){
 const security=runner.attributes?.catching??runner.rating??75;
 const strength=defender.attributes?.strength??defender.rating??75;
 return clamp(.012+(75-security)*.0006+(strength-75)*.00025,.003,.045);
}
