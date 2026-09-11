// All distances use the same field pixels as the player anchors.
import {TACKLE_R} from '../state/constants.js';
export const CONTACT_RADIUS=TACKLE_R;
export const DIVE_REACH=44;
export const DIVE_DURATION=180;
export const DIVE_SPEED=250;
export function separation(a,b){return Math.hypot(a.x-b.x,a.yfield-b.yfield);}
export function touching(a,b){return separation(a,b)<=CONTACT_RADIUS;}
export function pursuitTarget(def,carrier,velocity){
 const lead=Math.min(0.3,separation(def,carrier)/360);
 return {x:carrier.x+velocity.x*lead,yfield:carrier.yfield+velocity.yfield*lead};
}
// A lunge commits to a direction; it cannot home in after the runner cuts.
export function startDive(def,carrier,now,timing={}){
 const distance=separation(def,carrier);
 if(distance<=CONTACT_RADIUS||distance>DIVE_REACH||now<(def.nextDiveAt||0))return false;
 const duration=timing.diveDuration??DIVE_DURATION,windup=timing.diveWindup??0,speed=45/(duration/1000);
 def.dive={launchAt:now+windup,vx:(carrier.x-def.x)/distance*speed,vy:(carrier.yfield-def.yfield)/distance*speed,until:now+windup+duration};
 if(Math.abs(carrier.yfield-def.yfield)>0.5)def.facing=carrier.yfield>def.yfield?'left':'right';
 def.action=windup?'diveWindup':'dive';def.actionStart=now;def.nextDiveAt=now+1400;
 return true;
}
// Swept contact prevents a lunge stepping through the runner on a slower frame.
export function advanceDive(def,carrier,dt,now){
 const dive=def.dive;if(!dive)return false;
 if(now>=dive.launchAt&&def.action==='diveWindup'){def.action='dive';def.actionStart=dive.launchAt;}
 const step=Math.max(0,(Math.min(now,dive.until)-Math.max(now-dt*1000,dive.launchAt??0))/1000);
 const dx=dive.vx*step,dy=dive.vy*step;
 const length2=dx*dx+dy*dy;
 const t=length2?Math.max(0,Math.min(1,((carrier.x-def.x)*dx+(carrier.yfield-def.yfield)*dy)/length2)):0;
 const closest={x:def.x+dx*t,yfield:def.yfield+dy*t};
 if(touching(closest,carrier)){def.x=closest.x;def.yfield=closest.yfield;return true;}
 def.x+=dx;def.yfield+=dy;return false;
}
