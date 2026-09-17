import { SKIN_SOURCE, SKIN_PALETTES, OFF, DEF } from '../state/constants.js';
import {resolvedUniform} from './uniformVariants.js';
import {decodeMask,recolorPixels} from '../../public/tools/uniform-pilot.mjs';
const uniformMasks=new WeakMap();
export const uniformMaskStatus={};

export const spriteImage=new Image();
export const spriteLoaded=new Promise(resolve=>{spriteImage.addEventListener('load',resolve,{once:true});spriteImage.addEventListener('error',resolve,{once:true});});
export const spriteSheets={off:[],def:[]};
export const presnapSpriteImage=new Image();
export const presnapSpriteSheets={off:[],def:[]};
export const PRESNAP_COLUMNS={qb:0,rb:1,wr:2,ol:3};
export const defensePresnapSpriteImage=new Image();
export const defensePresnapSpriteSheets=[];
export const DEFENSE_PRESNAP_COLUMNS={dl:0,cb:1,s:2};
export const spriteState={spritesReady:false,presnapSpritesReady:false,defensePresnapSpritesReady:false,goalPostReady:false};
export const goalPostImage=new Image();
goalPostImage.onload=function(){spriteState.goalPostReady=true;};
goalPostImage.src='assets/goal-post.png';

export function hexToRGB(hex){
  const clean=hex.replace('#','');
  const value=parseInt(clean.length===3?clean.split('').map(c=>c+c).join(''):clean,16);
  return [(value>>16)&255,(value>>8)&255,value&255];
}
export function colorRamp(hex){
  const rgb=hexToRGB(hex);
  return [0.38,0.62,0.9,1.2].map(mult=>rgb.map(channel=>Math.max(0,Math.min(255,Math.round(channel*mult)))));
}
export function applyUniform(team,target){
  // OFF is the user's side and DEF the opponent side. Auto therefore uses the
  // traditional home look for the user and away look for the opponent; a
  // team's explicit Home/Away/Alternate preference overrides this.
  const uniform=resolvedUniform(team,target===OFF);
  target.jersey=uniform.jersey;
  target.helmet=uniform.helmet;
  target.stripe=uniform.stripe;
  target.pants=uniform.pants;
  target.ramp=colorRamp(target.jersey);
}
export function rebuildSpriteSheets(){
  if(!spriteImage.complete||!spriteImage.naturalWidth)return;
  spriteSheets.off=SKIN_PALETTES.map((_,i)=>makeTeamSpriteSheet(OFF,i,spriteImage,false));
  spriteSheets.def=SKIN_PALETTES.map((_,i)=>makeTeamSpriteSheet(DEF,i,spriteImage,false));
  spriteState.spritesReady=true;
  if(presnapSpriteImage.complete&&presnapSpriteImage.naturalWidth){
    presnapSpriteSheets.off=SKIN_PALETTES.map((_,i)=>makeTeamSpriteSheet(OFF,i,presnapSpriteImage,true));
    presnapSpriteSheets.def=SKIN_PALETTES.map((_,i)=>makeTeamSpriteSheet(DEF,i,presnapSpriteImage,true));
    spriteState.presnapSpritesReady=true;
  }
  if(defensePresnapSpriteImage.complete&&defensePresnapSpriteImage.naturalWidth){
    defensePresnapSpriteSheets.splice(0,defensePresnapSpriteSheets.length,...SKIN_PALETTES.map((_,i)=>makeTeamSpriteSheet(DEF,i,defensePresnapSpriteImage,true)));
    spriteState.defensePresnapSpritesReady=true;
  }
}
export function makeTeamSpriteSheet(team,skinIndex,sourceImage=spriteImage,expandedSkin=false){
  const out=document.createElement('canvas');
  out.width=sourceImage.width;out.height=sourceImage.height;
  const outCtx=out.getContext('2d',{willReadFrequently:true});
  outCtx.imageSmoothingEnabled=false;
  outCtx.drawImage(sourceImage,0,0);
  const image=outCtx.getImageData(0,0,out.width,out.height);
  const labels=uniformMasks.get(sourceImage);
  const palette={1:hexToRGB(team.helmet||team.jersey),2:hexToRGB(team.stripe||'#ffffff'),3:hexToRGB(team.jersey),4:hexToRGB(team.pants||'#ffffff')};
  if(labels)image.data.set(recolorPixels(image.data,labels,palette));
  const data=image.data;
  const uniformRamp=team.ramp||colorRamp(team.jersey);
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]===0)continue;
    const r=data[i],g=data[i+1],b=data[i+2];
    let skinSlot=SKIN_SOURCE.indexOf(r+','+g+','+b);
    if(skinSlot<0&&expandedSkin&&r>95&&r>g*1.08&&g>b*1.05&&r-b>40){
      const light=r+g+b;
      skinSlot=light>560?0:light>500?1:light>440?2:light>370?3:4;
    }
    if(skinSlot>=0 && (!labels || labels[i/4]===10)){
      const color=SKIN_PALETTES[skinIndex][skinSlot];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    } else if(!labels && b>r*1.22&&b>g*1.08){
      const light=(r+g+b)/3;
      const color=uniformRamp[light<45?0:light<80?1:light<135?2:3];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    }
  }
  outCtx.putImageData(image,0,0);
  return out;
}
// Verify the exact bytes used by Image, so a stale or replaced sheet cannot
// silently receive another version's anatomical coordinates. On failure the
// existing renderer remains available, without independent material colors.
async function loadUniformSource(image,name){
  let url;
  try{
    const response=await fetch(`assets/${name}.png`);
    if(!response.ok)throw Error('Sprite source unavailable');
    const bytes=await response.arrayBuffer();
    try{
      const maskResponse=await fetch(`assets/masks/${name}-uniform.json`);
      if(!maskResponse.ok)throw Error('Uniform mask unavailable');
      const mask=await maskResponse.json();
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
      const labels=decodeMask(mask,hash,new DataView(bytes).getUint32(16),new DataView(bytes).getUint32(20));
      uniformMasks.set(image,labels);
      uniformMaskStatus[name]='verified';
    }catch(error){uniformMaskStatus[name]='fallback';console.warn(`${name}: ${error.message}; using original uniform renderer.`);}
    url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
    image.onload=()=>{
      const labels=uniformMasks.get(image);
      if(labels&&labels.length!==image.naturalWidth*image.naturalHeight){uniformMasks.delete(image);uniformMaskStatus[name]='fallback';}
      URL.revokeObjectURL(url);rebuildSpriteSheets();
    };
    image.onerror=()=>{URL.revokeObjectURL(url);uniformMasks.delete(image);uniformMaskStatus[name]='fallback';image.onload=rebuildSpriteSheets;image.onerror=null;image.src=`assets/${name}.png`;};
    image.src=url;
  }catch{
    uniformMaskStatus[name]='fallback';image.onload=rebuildSpriteSheets;image.src=`assets/${name}.png`;
  }
}
loadUniformSource(presnapSpriteImage,'presnap-offense');
loadUniformSource(defensePresnapSpriteImage,'presnap-defense');
loadUniformSource(spriteImage,'sprites');
