// Replay contains only render data. Sampling never copies roster/stat graphs.
import {game,entities} from '../state/gameState.js';
import {simulationNow} from '../state/clock.js';
export const highlights={frames:[],lastAt:0,playing:false,start:0};
const renderKeys=['x','yfield','num','skin','facing','action','actionStart','state','breakSlowUntil','presnapRole','isBlocking','isPursuing','blockedUntil'];
function recordPlayer(player){return Object.fromEntries(renderKeys.map(key=>[key,player[key]]));}
export function resetHighlight(){highlights.frames=[];highlights.lastAt=0;highlights.playing=false;}
export function captureHighlight(now){
 if(now-highlights.lastAt<50)return;
 highlights.lastAt=now;
 const carrierKey=Object.keys(entities.players).find(k=>entities.players[k]===entities.ballCarrier);
 const snapshot={time:now,players:Object.fromEntries(Object.entries(entities.players).map(([key,p])=>[key,recordPlayer(p)])),decor:entities.decor.map(recordPlayer),ball:{...entities.ball},carrierKey,cameraYard:game.cameraYard,los:game.los,firstDownYard:game.firstDownYard,scrambling:game.scrambling,phase:game.phase};
 highlights.frames.push(snapshot);if(highlights.frames.length>240)highlights.frames.shift();
}
export function toggleReplay(){
 if(highlights.playing){highlights.playing=false;return;}
 if(game.phase!=='result'||highlights.frames.length<2)return;
 highlights.playing=true;highlights.start=simulationNow();
}
const mix=(a,b,p)=>a+(b-a)*p;
function interpolatePlayer(a,b,p){return b?{...a,x:mix(a.x,b.x,p),yfield:mix(a.yfield,b.yfield,p)}:{...a};}
export function replayFrame(){
 if(!highlights.playing)return null;
 const frames=highlights.frames,time=frames[0].time+(simulationNow()-highlights.start)*.8;
 if(time>frames[frames.length-1].time){highlights.playing=false;return null;}
 let index=frames.findIndex(f=>f.time>=time);if(index<0)index=frames.length-1;
 const a=frames[Math.max(0,index-1)],b=frames[index],p=a===b?0:(time-a.time)/(b.time-a.time);
 const ball={...a.ball};
 if(a.ball.loose&&b.ball.loose)for(const key of ['x','yfield','height','spin'])if(Number.isFinite(a.ball[key])&&Number.isFinite(b.ball[key]))ball[key]=mix(a.ball[key],b.ball[key],p);
 return {...a,time,players:Object.fromEntries(Object.entries(a.players).map(([key,player])=>[key,interpolatePlayer(player,b.players[key],p)])),decor:a.decor.map((player,i)=>interpolatePlayer(player,b.decor[i],p)),ball,cameraYard:mix(a.cameraYard,b.cameraYard,p)};
}
