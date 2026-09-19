// Record what actually happened; playback never advances the game or random rolls.
import {game,entities} from '../state/gameState.js';
import {simulationNow} from '../state/clock.js';
export const highlights={frames:[],lastAt:0,playing:false,start:0};
export function resetHighlight(){highlights.frames=[];highlights.lastAt=0;highlights.playing=false;}
export function captureHighlight(now){
 if(now-highlights.lastAt<50)return;
 highlights.lastAt=now;
 const carrierKey=Object.keys(entities.players).find(k=>entities.players[k]===entities.ballCarrier);
 const snapshot=JSON.parse(JSON.stringify({time:now,players:entities.players,decor:entities.decor,ball:entities.ball,carrierKey,cameraYard:game.cameraYard,los:game.los,firstDownYard:game.firstDownYard,scrambling:game.scrambling,phase:game.phase}));
 highlights.frames.push(snapshot);if(highlights.frames.length>240)highlights.frames.shift();
}
export function toggleReplay(){
 if(highlights.playing){highlights.playing=false;return;}
 if(game.phase!=='result'||highlights.frames.length<2)return;
 highlights.playing=true;highlights.start=simulationNow();
}
export function replayFrame(){
 if(!highlights.playing)return null;
 const first=highlights.frames[0],elapsed=(simulationNow()-highlights.start)*.8;
 const frame=highlights.frames.find(f=>f.time>=first.time+elapsed);
 if(!frame){highlights.playing=false;return null;}
 return frame;
}
