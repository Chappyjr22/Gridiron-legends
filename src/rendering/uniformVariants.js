export const UNIFORM_VARIANTS=['home','away','alternate'];

// Each variant carries four independent editable channels. The defaults mirror
// the previous look so older saves do not change until a user customizes them.
export function defaultUniforms(team){
 const primary=team?.colors?.primary||'#2458a6';
 const secondary=team?.colors?.secondary||'#eef1f4';
 const accent=team?.colors?.accent||'#f4c542';
 return {
  home:{jersey:primary,pants:primary,helmet:secondary,stripe:accent},
  away:{jersey:secondary,pants:secondary,helmet:primary,stripe:accent},
  alternate:{jersey:accent,pants:accent,helmet:primary,stripe:secondary}
 };
}

export function ensureUniformVariants(team){
 const defaults=defaultUniforms(team);
 const legacy=team?.uniform||{};
 if(!team.uniforms||typeof team.uniforms!=='object')team.uniforms={};
 for(const key of UNIFORM_VARIANTS){
  const base=key==='home'?{...defaults[key],...legacy}:defaults[key];
  team.uniforms[key]={...base,...(team.uniforms[key]||{})};
  if(!team.uniforms[key].pants)team.uniforms[key].pants=team.uniforms[key].jersey;
  if(!team.uniforms[key].helmet)team.uniforms[key].helmet=defaults[key].helmet;
  if(!team.uniforms[key].stripe)team.uniforms[key].stripe=defaults[key].stripe;
 }
 if(!['auto',...UNIFORM_VARIANTS].includes(team.uniformPreference))team.uniformPreference='auto';
 return team.uniforms;
}

export function resolvedUniform(team,isHome=true){
 const uniforms=ensureUniformVariants(team);
 const preference=team.uniformPreference||'auto';
 const variant=preference==='auto'?(isHome?'home':'away'):preference;
 return {variant,...uniforms[variant]};
}
