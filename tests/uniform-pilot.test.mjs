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
