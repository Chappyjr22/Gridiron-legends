// Stable world positions keep groups stationary as the camera scrolls.
export const TEAM_GROUPS=[20,30,40,50,60,70,80];
export const GROUP_POSES=[[-.9,4],[-.1,3],[.7,5],[-.5,18],[.3,19],[1.1,18]];
export function chainPositions(game){
  const target=Math.max(0,Math.min(100,game.firstDownYard));
  return {showChains:game.firstDownYard<100,start:Math.max(0,target-10),target,down:Math.max(0,Math.min(100,game.los)),number:Math.max(1,Math.min(4,game.down))};
}
