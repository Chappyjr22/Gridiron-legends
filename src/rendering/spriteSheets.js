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

function uprightChannel(localX,localY,row){
  // Helmet is deliberately broad in X but shallow in Y. Only source uniform
  // pixels are eligible, so face/skin pixels inside the box are never touched.
  const helmetBottom=row===3?25:24;
  if(localY>=6&&localY<=helmetBottom&&localX>=13&&localX<=51){
    // A narrow crown stripe gives the stripe control a real, isolated channel.
    if(localX>=30&&localX<=34&&localY<=21)return 'stripe';
    return 'helmet';
  }
  // Torso stripe. Keep it narrow so shoulder/arm pixels remain jersey colored.
  if(localY>=24&&localY<=39&&localX>=30&&localX<=34)return 'stripe';
  if(localY>=37&&localY<=54&&localX>=11&&localX<=53)return 'pants';
  return 'jersey';
}
function groundedChannel(localX,localY,col){
  // Row 4 contains catch/drop/tackle/down/dive poses. The last three frames
  // compress or rotate the body, so use pose-specific horizontal separation.
  if(col>=3){
    // Source faces left in these frames: head/helmet stays toward the left,
    // lower body extends toward the right. Keep the middle as jersey.
    if(localX>=7&&localX<=27&&localY>=19&&localY<=46){
      if(localY>=28&&localY<=32)return 'stripe';
      return 'helmet';
    }
    if(localX>=38&&localX<=58&&localY>=22&&localY<=51)return 'pants';
    if(localX>=27&&localX<=38&&localY>=30&&localY<=34)return 'stripe';
    return 'jersey';
  }
  // Catch/deflect/drop are still mostly upright/crouched.
  if(localY>=7&&localY<=25&&localX>=12&&localX<=52){
    if(localX>=30&&localX<=34&&localY<=22)return 'stripe';
    return 'helmet';
  }
  if(localY>=25&&localY<=40&&localX>=30&&localX<=34)return 'stripe';
  if(localY>=38&&localY<=55&&localX>=10&&localX<=54)return 'pants';
  return 'jersey';
}

// Returns the intended recolor channel for one source-uniform pixel. The
// source sheet itself still uses one blue palette, so geometry is the safest
// reversible split until/if the PNG artwork receives authored mask layers.
export function uniformChannelForPixel(x,y){
  const localX=x%64,localY=y%64;
  const row=Math.floor(y/64),col=Math.floor(x/64);
  return row===4?groundedChannel(localX,localY,col):uprightChannel(localX,localY,row);
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
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]===0)continue;
    const pixel=i/4,x=pixel%out.width,y=Math.floor(pixel/out.width);
    const r=data[i],g=data[i+1],b=data[i+2];
    let skinSlot=SKIN_SOURCE.indexOf(r+','+g+','+b);
    if(skinSlot<0&&expandedSkin&&r>95&&r>g*1.08&&g>b*1.05&&r-b>40){
      const light=r+g+b;
      skinSlot=light>560?0:light>500?1:light>440?2:light>370?3:4;
    }
    if(skinSlot>=0){
      const color=SKIN_PALETTES[skinIndex][skinSlot];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    } else if(b>r*1.22&&b>g*1.08){
      const light=(r+g+b)/3;
      const ramp=ramps[uniformChannelForPixel(x,y)]||uniformRamp;
      const color=ramp[light<45?0:light<80?1:light<135?2:3];
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
