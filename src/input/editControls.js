import { game, entities } from '../state/gameState.js';
import { XPX } from '../state/constants.js';
import { toCanvas } from '../rendering/players.js';

export function allEntities(){return [...Object.values(entities.players),...entities.decor];}
export function findNearEntity(p){
  let best=null,bestD=24;
  allEntities().forEach(e=>{
    const {cx,cy}=toCanvas(e);
    const d=Math.hypot(cx-p.x,cy-p.y);
    if(d<bestD){bestD=d;best=e;}
  });
  return best;
}
export function updateEditJSON(){
  const playersOut={};
  ['wr1','wr2','wr3','te','rb','qb','dl1','dl2','dl3','dl4','cb1','cb2','s1','lb1'].forEach(k=>{
    const e=entities.players[k];
    playersOut[k]={x:Math.round(e.x),y:Math.round((e.yfield/XPX-game.los)*10)/10};
  });
  const decorOut=entities.decor.map(d=>({num:d.num,x:Math.round(d.x),y:Math.round((d.yfield/XPX-game.los)*10)/10}));
  const ta=document.getElementById('edit-json');
  if(ta)ta.value=JSON.stringify({formation:game.formation||'trips',players:playersOut,decor:decorOut},null,1);
}
