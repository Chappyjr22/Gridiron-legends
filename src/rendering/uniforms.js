export function contrastingOpponent(user,opponent){
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const a=rgb(user.colors.primary), b=rgb(opponent.colors.primary);
  if(Math.hypot(...a.map((v,i)=>v-b[i]))>=100)return opponent;
  const light=a.reduce((s,v)=>s+v,0)/3<140;
  return {...opponent,colors:{...opponent.colors,primary:light?'#edf0e7':'#20262d',secondary:opponent.colors.primary,accent:opponent.colors.primary}};
}
