export function runnerActionFrame(action,elapsed){
 if(action!=='runnerDive'&&action!=='runnerSlide')return null;
 return {row:action==='runnerSlide'?1:0,col:Math.min(3,Math.floor(Math.max(0,elapsed)/75))};
}
