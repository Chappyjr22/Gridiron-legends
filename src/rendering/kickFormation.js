// Presentation only. These actors never enter tackle, block, or scoring physics.
import {XPX,clamp} from '../state/constants.js';
export const KICK_SNAP_MS=180;
export const KICK_CONTACT_MS=550;
export function kickFormation(los,elapsed=0,active=false){
 const drive=active?clamp(elapsed/420,0,1):0;
 const actors=[];
 // Seven on the line, two wing protectors, plus the holder and kicker.
 for(let i=-3;i<=3;i++)actors.push({side:'off',role:i===0?'snapper':'line',x:190+i*29,yfield:(los-.35-drive*.16)*XPX,skin:(i+3)%5});
 for(const sign of [-1,1])actors.push({side:'off',role:'wing',x:190+sign*113,yfield:(los-1.3-drive*.25)*XPX,skin:sign<0?1:3});
 for(let i=-4;i<=4;i++)actors.push({side:'def',role:'rush',x:190+i*28,yfield:(los+.9-drive*1.18)*XPX,skin:(i+4)%5});
 for(const sign of [-1,1])actors.push({side:'def',role:'contain',x:190+sign*(145-drive*7),yfield:(los+2.4-drive*1.8)*XPX,skin:sign<0?2:4});
 return actors.sort((a,b)=>a.x-b.x);
}
export function kickSnapPosition(los,elapsed){
 const p=clamp(elapsed/KICK_SNAP_MS,0,1);
 return {x:190,yfield:(los-.35-(6.65*p))*XPX,height:Math.sin(p*Math.PI)*9};
}
