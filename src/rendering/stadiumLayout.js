// Stable world positions keep groups stationary as the camera scrolls.
export const TEAM_GROUPS=[20,30,40,50,60,70,80];
export const GROUP_POSES=[[-.9,0],[-.1,-1],[.7,1],[-.5,13],[.3,14],[1.1,13]];
export function chainPositions(game){
  const target=Math.max(0,Math.min(100,game.firstDownYard));
  return {showChains:game.firstDownYard<100,start:Math.max(0,target-10),target,down:Math.max(0,Math.min(100,game.los)),number:Math.max(1,Math.min(4,game.down))};
}
