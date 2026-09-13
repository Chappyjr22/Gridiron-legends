export const UNIFORM_VARIANTS=['home','away','alternate'];

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
  // Existing saves predate a separate pants channel. Preserve their exact look
  // by matching pants to the jersey until the player explicitly customizes it.
  if(!team.uniforms[key].pants)team.uniforms[key].pants=team.uniforms[key].jersey;
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
