import {resolvedUniform} from './uniformVariants.js';

// Compare the actual selected jerseys, not branding colors. Keep the saved sets intact.
export function contrastingOpponent(user,opponent){
  const copy=team=>({...team,uniforms:team.uniforms?structuredClone(team.uniforms):undefined});
  const userUniform=resolvedUniform(copy(user),true),matchTeam=copy(opponent);
  const opponentUniform=resolvedUniform(matchTeam,false);
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const a=rgb(userUniform.jersey),b=rgb(opponentUniform.jersey);
  if(Math.hypot(...a.map((v,i)=>v-b[i]))>=100)return opponent;
  const jersey=a.reduce((s,v)=>s+v,0)/3<140?'#edf0e7':'#20262d';
  matchTeam.uniforms[opponentUniform.variant]={...matchTeam.uniforms[opponentUniform.variant],jersey};
  return matchTeam;
}
