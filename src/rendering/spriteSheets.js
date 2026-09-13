import { SKIN_SOURCE, SKIN_PALETTES, OFF, DEF } from '../state/constants.js';
import {resolvedUniform} from './uniformVariants.js';

export const spriteImage=new Image();
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

const MASK_STORAGE_KEY='gridironLegendsUniformMaskOverridesV1';
const MASK_CHANNELS=new Set(['helmet','jersey','pants','stripe']);
let maskOverrides=null;
function loadMaskOverrides(){
  if(maskOverrides)return maskOverrides;
  try{
    const parsed=JSON.parse(localStorage.getItem(MASK_STORAGE_KEY)||'{}');
    maskOverrides=parsed&&typeof parsed==='object'?parsed:{};
  }catch(e){maskOverrides={};}
  return maskOverrides;
}
function saveMaskOverrides(){try{localStorage.setItem(MASK_STORAGE_KEY,JSON.stringify(maskOverrides||{}));}catch(e){}}
export function uniformMaskSourceId(sourceImage){
  if(sourceImage===presnapSpriteImage)return 'presnap-offense';
  if(sourceImage===defensePresnapSpriteImage)return 'presnap-defense';
  return 'gameplay';
}
export function getUniformMaskOverrides(){return JSON.parse(JSON.stringify(loadMaskOverrides()));}
export function exportUniformMaskOverrides(){return JSON.stringify(loadMaskOverrides(),null,2);}
export function importUniformMaskOverrides(value){
  const parsed=typeof value==='string'?JSON.parse(value):value;
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Mask JSON must be an object.');
  maskOverrides=parsed;saveMaskOverrides();rebuildSpriteSheets();return true;
}
export function applyUniformMaskEdits(source,row,col,edits=[]){
  const masks=loadMaskOverrides(),frameKey=`${row},${col}`;
  masks[source]??={};masks[source][frameKey]??={};
  const frame=masks[source][frameKey];
  for(const edit of edits){
    const x=Math.max(0,Math.min(63,Number(edit.x)|0)),y=Math.max(0,Math.min(63,Number(edit.y)|0));
    const key=String(y*64+x),channel=edit.channel;
    if(channel==='auto'||channel==null)delete frame[key];
    else if(MASK_CHANNELS.has(channel))frame[key]=channel;
  }
  if(!Object.keys(frame).length)delete masks[source][frameKey];
  if(!Object.keys(masks[source]).length)delete masks[source];
  saveMaskOverrides();rebuildSpriteSheets();
}
export function clearUniformMaskFrame(source,row,col){
  const masks=loadMaskOverrides(),frameKey=`${row},${col}`;
  if(masks[source]){delete masks[source][frameKey];if(!Object.keys(masks[source]).length)delete masks[source];}
  saveMaskOverrides();rebuildSpriteSheets();
}
export function uniformMaskOverride(source,row,col,localX,localY){
  return loadMaskOverrides()?.[source]?.[`${row},${col}`]?.[String(localY*64+localX)]||null;
}

export function hexToRGB(hex){
  const clean=hex.replace('#','');
  const value=parseInt(clean.length===3?clean.split('').map(c=>c+c).join(''):clean,16);
  return [(value>>16)&255,(value>>8)&255,value&255];
}
export function colorRamp(hex){
  const rgb=hexToRGB(hex);
  return [0.40,0.68,1.00,1.22].map(mult=>rgb.map(channel=>Math.max(0,Math.min(255,Math.round(channel*mult)))));
}
export function applyUniform(team,target){
  const uniform=resolvedUniform(team,target===OFF);
  target.jersey=uniform.jersey;
  target.pants=uniform.pants||uniform.jersey;
  target.helmet=uniform.helmet;
  target.stripe=uniform.stripe;
  target.ramp=colorRamp(target.jersey);
  target.pantsRamp=colorRamp(target.pants);
  target.helmetRamp=colorRamp(target.helmet);
  target.stripeRamp=colorRamp(target.stripe);
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

function inBox(x,y,left,top,right,bottom){return x>=left&&x<=right&&y>=top&&y<=bottom;}
function uprightChannel(localX,localY,row,col){
  const shift=(row===3||row===0&&col>=2)?3:0;
  const helmetLeft=15+shift,helmetRight=49+shift,helmetBottom=row===3?26:24;
  if(inBox(localX,localY,helmetLeft,6,helmetRight,helmetBottom)){
    if(inBox(localX,localY,31+shift,8,33+shift,19))return 'stripe';
    return 'helmet';
  }
  if(inBox(localX,localY,31+shift,25,33+shift,36))return 'stripe';
  const pantsLeft=row===2?9:12,pantsRight=row===2?55:52;
  if(inBox(localX,localY,pantsLeft,39,pantsRight,55))return 'pants';
  return 'jersey';
}
function groundedChannel(localX,localY,col){
  if(col<=2){
    if(inBox(localX,localY,14,8,50,26)){
      if(inBox(localX,localY,31,9,33,20))return 'stripe';
      return 'helmet';
    }
    if(inBox(localX,localY,31,26,33,37))return 'stripe';
    if(inBox(localX,localY,10,39,54,56))return 'pants';
    return 'jersey';
  }
  if(inBox(localX,localY,6,18,26,46)){
    if(inBox(localX,localY,16,20,18,30))return 'stripe';
    return 'helmet';
  }
  if(inBox(localX,localY,39,22,60,52))return 'pants';
  return 'jersey';
}

export function uniformChannelForPixel(x,y,source='gameplay'){
  const localX=x%64,localY=y%64,row=Math.floor(y/64),col=Math.floor(x/64);
  const override=uniformMaskOverride(source,row,col,localX,localY);
  if(override)return override;
  if(source!=='gameplay')return uprightChannel(localX,localY,0,col);
  return row===4?groundedChannel(localX,localY,col):uprightChannel(localX,localY,row,col);
}

function rampColor(ramp,r,g,b){
  const light=(r+g+b)/3;
  return ramp[light<45?0:light<80?1:light<135?2:3];
}
export function makeTeamSpriteSheet(team,skinIndex,sourceImage=spriteImage,expandedSkin=false){
  const out=document.createElement('canvas');
  out.width=sourceImage.width;out.height=sourceImage.height;
  const outCtx=out.getContext('2d',{willReadFrequently:true});
  outCtx.imageSmoothingEnabled=false;
  outCtx.drawImage(sourceImage,0,0);
  const image=outCtx.getImageData(0,0,out.width,out.height);
  const data=image.data;
  const uniformRamp=team.ramp||colorRamp(team.jersey);
  const pantsRamp=team.pantsRamp||colorRamp(team.pants||team.jersey);
  const helmetRamp=team.helmetRamp||colorRamp(team.helmet||team.jersey);
  const stripeRamp=team.stripeRamp||colorRamp(team.stripe||team.jersey);
  const ramps={jersey:uniformRamp,pants:pantsRamp,helmet:helmetRamp,stripe:stripeRamp};
  const source=uniformMaskSourceId(sourceImage);
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]===0)continue;
    const pixel=i/4,x=pixel%out.width,y=Math.floor(pixel/out.width);
    const localX=x%64,localY=y%64,row=Math.floor(y/64),col=Math.floor(x/64);
    const r=data[i],g=data[i+1],b=data[i+2];

    // Exact dev masks deliberately outrank every source-palette heuristic.
    // This lets a manually-labelled gray/black helmet pixel become part of the
    // helmet channel even though the original art did not use the blue ramp.
    const manual=uniformMaskOverride(source,row,col,localX,localY);
    if(manual){
      const color=rampColor(ramps[manual]||uniformRamp,r,g,b);
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
      continue;
    }

    let skinSlot=SKIN_SOURCE.indexOf(r+','+g+','+b);
    if(skinSlot<0&&expandedSkin&&r>95&&r>g*1.08&&g>b*1.05&&r-b>40){
      const light=r+g+b;
      skinSlot=light>560?0:light>500?1:light>440?2:light>370?3:4;
    }
    if(skinSlot>=0){
      const color=SKIN_PALETTES[skinIndex][skinSlot];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    } else if(b>r*1.22&&b>g*1.08){
      const color=rampColor(ramps[uniformChannelForPixel(x,y,source)]||uniformRamp,r,g,b);
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    }
  }
  outCtx.putImageData(image,0,0);
  return out;
}
presnapSpriteImage.onload=function(){rebuildSpriteSheets();};
presnapSpriteImage.src='assets/presnap-offense.png';
defensePresnapSpriteImage.onload=function(){rebuildSpriteSheets();};
defensePresnapSpriteImage.src='assets/presnap-defense.png';
spriteImage.onload=function(){rebuildSpriteSheets();};
spriteImage.src='assets/sprites.png';