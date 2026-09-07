import { game } from './gameState.js';
import { clamp } from './constants.js';

export const DIFFICULTIES={
  easy:{pursueMult:0.78,reactionDelay:0.6,engageMin:1800,engageMax:2800,catchRadiusMult:1.4,breakTackle:0.35,blockWinChance:0.6,offenseSpeedMult:1.14,runBreakBonus:0.22,blitzChance:0.2,approachDelay:0.35},
  medium:{pursueMult:1.0,reactionDelay:0.42,engageMin:850,engageMax:1600,catchRadiusMult:1.0,breakTackle:0.18,blockWinChance:0.15,offenseSpeedMult:1.0,runBreakBonus:0.08,blitzChance:0.2,approachDelay:0.15},
  hard:{pursueMult:1.15,reactionDelay:0.26,engageMin:600,engageMax:1150,catchRadiusMult:0.8,breakTackle:0.08,blockWinChance:0.05,offenseSpeedMult:0.95,runBreakBonus:0.03,blitzChance:0.2,approachDelay:0.08}
};
export function currentDiff(){
  if(game.difficulty!=='gridiron')return DIFFICULTIES[game.difficulty];
  const from=DIFFICULTIES.medium;
  const to=game.momentum>=0?DIFFICULTIES.hard:DIFFICULTIES.easy;
  const f=Math.min(1,Math.abs(game.momentum));
  const lerp=(a,b)=>a+(b-a)*f;
  return{
    pursueMult:lerp(from.pursueMult,to.pursueMult),
    reactionDelay:lerp(from.reactionDelay,to.reactionDelay),
    engageMin:lerp(from.engageMin,to.engageMin),
    engageMax:lerp(from.engageMax,to.engageMax),
    catchRadiusMult:lerp(from.catchRadiusMult,to.catchRadiusMult),
    breakTackle:lerp(from.breakTackle,to.breakTackle),
    blockWinChance:lerp(from.blockWinChance,to.blockWinChance),
    offenseSpeedMult:lerp(from.offenseSpeedMult,to.offenseSpeedMult),
    blitzChance:lerp(from.blitzChance,to.blitzChance),
    approachDelay:lerp(from.approachDelay,to.approachDelay),
    runBreakBonus:lerp(from.runBreakBonus,to.runBreakBonus)
  };
}
export function adjustMomentum(delta){
  if(game.difficulty!=='gridiron')return;
  game.momentum=clamp(game.momentum*0.9+delta,-1,1);
}
export function momentumLabel(){
  const m=game.momentum;
  if(m>0.5)return 'Gridiron - defense is fired up';
  if(m>0.15)return 'Gridiron - building momentum';
  if(m<-0.5)return 'Gridiron - defense rattled';
  if(m<-0.15)return 'Gridiron - finding a rhythm';
  return 'Gridiron - even fight';
}
