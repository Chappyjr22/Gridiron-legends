import {resolvedUniform,UNIFORM_VARIANTS} from './uniformVariants.js';

// Compare the actual selected jerseys, not branding colors. Keep the saved sets intact.
export function contrastingOpponent(user,opponent,userIsHome=true){
  const copy=team=>({...team,uniforms:team.uniforms?structuredClone(team.uniforms):undefined});
  const userUniform=resolvedUniform(copy(user),userIsHome),matchTeam=copy(opponent);
  const opponentUniform=resolvedUniform(matchTeam,!userIsHome);
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const a=rgb(userUniform.jersey),b=rgb(opponentUniform.jersey);
  if(Math.hypot(...a.map((v,i)=>v-b[i]))>=100)return opponent;
 // Prefer a real saved kit before resorting to an emergency contrast jersey.
 const alternative=UNIFORM_VARIANTS.map(variant=>({variant,distance:Math.hypot(...a.map((v,i)=>v-rgb(matchTeam.uniforms[variant].jersey)[i]))})).sort((x,y)=>y.distance-x.distance)[0];
 if(alternative.distance>=100){matchTeam.uniformPreference=alternative.variant;return matchTeam;}
  const jersey=a.reduce((s,v)=>s+v,0)/3<140?'#edf0e7':'#20262d';
  matchTeam.uniforms[opponentUniform.variant]={...matchTeam.uniforms[opponentUniform.variant],jersey};
  return matchTeam;
}
