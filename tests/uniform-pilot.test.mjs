import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeMask,recolorPixels} from '../public/tools/uniform-pilot.mjs';
const mask=JSON.parse(readFileSync('public/assets/masks/uniform-pilot.json','utf8')),hash=createHash('sha256').update(readFileSync('public/assets/sprites.png')).digest('hex');
const labels=decodeMask(mask,hash,384,320);
assert.throws(()=>decodeMask(mask,'changed',384,320));
for(let i=0;i<labels.length;i++){if(!labels[i])continue;const x=i%384,y=Math.floor(i/384);assert.ok(mask.pilotFrames.some(f=>x>=f.col*64&&x<(f.col+1)*64&&y>=f.row*64&&y<(f.row+1)*64));}
for(const f of mask.pilotFrames)for(const id of [1,2,3,4]){let n=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(labels[(f.row*64+y)*384+f.col*64+x]===id)n++;assert.ok(n>10,`${f.name} part ${id}`);}
const pixels=new Uint8ClampedArray([19,73,184,255,252,252,252,128,12,30,70,255,19,73,184,0]),before=new Uint8ClampedArray(pixels);
const out=recolorPixels(pixels,new Uint8Array([1,4,10,1]),{1:[255,0,0],4:[0,255,0]});
assert.deepEqual(pixels,before);assert.deepEqual([...out.slice(0,4)],[255,0,0,255]);assert.deepEqual([...out.slice(4,8)],[0,255,0,128]);assert.deepEqual(out.slice(8),pixels.slice(8));
assert.equal(mask.reviewed,false);console.log('Uniform pilot checks passed: source hash, frame scope, part coverage, alpha, protected pixels, immutable source.');
for(const [name,count]of [['sprites',26],['presnap-offense',4],['presnap-defense',3]]){
 const mask=JSON.parse(readFileSync(`public/assets/masks/${name}-uniform.json`,'utf8')),bytes=readFileSync(`public/assets/${name}.png`),hash=createHash('sha256').update(bytes).digest('hex');
 const labels=decodeMask(mask,hash,bytes.readUInt32BE(16),bytes.readUInt32BE(20));assert.equal(mask.frames.length,count);assert.throws(()=>decodeMask({...mask,width:mask.width+1},hash,mask.width,mask.height));
 for(const f of mask.frames){const parts=new Set();for(let y=0;y<64;y++)for(let x=0;x<64;x++)parts.add(labels[(f.row*64+y)*mask.width+f.col*64+x]);for(const id of [1,2,3,4])assert.ok(parts.has(id),`${name} ${f.row}:${f.col} part ${id}`);}
}
const {ensureUniformVariants}=await import('../src/rendering/uniformVariants.js');
const legacy={uniform:{jersey:'#123456',helmet:'#eeeeee',stripe:'#abcdef'}};ensureUniformVariants(legacy);assert.equal(legacy.uniforms.home.jersey,'#123456');for(const v of Object.values(legacy.uniforms))assert.equal(v.pants,'#ffffff');legacy.uniforms.away.pants='#102030';ensureUniformVariants(legacy);assert.equal(legacy.uniforms.away.pants,'#102030');
console.log('All 33 poses cover four materials with immutable source hashes; legacy pants defaults preserve saved variants.');
const {defaultUniforms,resolvedUniform}=await import('../src/rendering/uniformVariants.js');
const {contrastingOpponent}=await import('../src/rendering/uniforms.js');
const colors={primary:'#174a7e',secondary:'#dce8ef',accent:'#d44a3a'};
const defaults=defaultUniforms({colors});assert.equal(defaults.home.helmet,colors.primary);assert.equal(defaults.away.helmet,colors.primary);
const oldDefault={colors,uniformPreference:'auto',uniforms:structuredClone(defaults)};oldDefault.uniforms.home.helmet=colors.secondary;ensureUniformVariants(oldDefault);assert.equal(oldDefault.uniforms.home.helmet,colors.primary);
for(const kind of ['material','explicit','saved']){const t={colors,uniformPreference:'auto',uniforms:structuredClone(defaults)};t.uniforms.home.helmet=colors.secondary;if(kind==='material')t.uniforms.away.pants='#102030';if(kind==='explicit')t.uniformPreference='home';if(kind==='saved')t.uniformsCustomized=true;const expected=structuredClone(t.uniforms);ensureUniformVariants(t);assert.deepEqual(t.uniforms,expected);}
const user={colors},opponent={colors,uniformPreference:'home',uniforms:structuredClone(defaults)},snapshot=structuredClone(opponent);
const contrasting=contrastingOpponent(user,opponent);assert.equal(resolvedUniform(contrasting,false).jersey,colors.secondary);assert.deepEqual(opponent,snapshot);
assert.equal(resolvedUniform(user,false).jersey,colors.secondary);assert.equal(resolvedUniform(user,true).jersey,colors.primary);
console.log('Uniform regression: restored defaults, custom colors preserved, home/away selection and real alternate contrast kits passed.');

{const m=JSON.parse(readFileSync('public/assets/masks/presnap-offense-uniform.json'));const labels=new Uint8Array(m.width*m.height);for(const [s,n,id]of m.runs)labels.fill(id,s,s+n);assert.equal(labels[41*m.width+3*64+17],3,'OL forward sleeve must use jersey color');}
