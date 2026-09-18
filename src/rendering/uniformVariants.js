export const UNIFORM_VARIANTS=['home','away','alternate'];

export function defaultUniforms(team){
 const primary=team?.colors?.primary||'#2458a6';
 const secondary=team?.colors?.secondary||'#eef1f4';
 const accent=team?.colors?.accent||'#f4c542';
 return {
  home:{jersey:primary,helmet:primary,stripe:accent,pants:'#ffffff'},
  away:{jersey:secondary,helmet:primary,stripe:accent,pants:'#ffffff'},
  alternate:{jersey:accent,helmet:primary,stripe:secondary,pants:'#ffffff'}
 };
}

export function ensureUniformVariants(team){
 const defaults=defaultUniforms(team);
 const legacy=team?.uniform||{};
 // Earlier defaults were invisible to the old jersey-only renderer. Repair only
 // complete, untouched auto sets; any custom material or explicit set is preserved.
 if(!team.uniformSchemaVersion&&!team.uniformsCustomized&&!team.uniform&&(!team.uniformPreference||team.uniformPreference==='auto')&&team.uniforms){
  const previous={...defaults,home:{...defaults.home,helmet:team.colors?.secondary||'#eef1f4'}};
  if(UNIFORM_VARIANTS.every(v=>Object.keys(defaults[v]).every(k=>team.uniforms[v]?.[k]===previous[v][k])))team.uniforms.home.helmet=defaults.home.helmet;
 }
 team.uniformSchemaVersion=2;
 if(!team.uniforms||typeof team.uniforms!=='object')team.uniforms={};
 for(const key of UNIFORM_VARIANTS){
  const base=key==='home'?{...defaults[key],...legacy}:defaults[key];
  team.uniforms[key]={...base,...(team.uniforms[key]||{})};
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
