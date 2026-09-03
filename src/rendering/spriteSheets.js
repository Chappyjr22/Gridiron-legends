import { SKIN_SOURCE, SKIN_PALETTES, OFF, DEF } from '../state/constants.js';

export const spriteImage=new Image();
export const spriteSheets={off:[],def:[]};
export const presnapSpriteImage=new Image();
export const presnapSpriteSheets={off:[],def:[]};
export const PRESNAP_COLUMNS={qb:0,rb:1,wr:2,ol:3};
export const defensePresnapSpriteImage=new Image();
export const defensePresnapSpriteSheets=[];
export const DEFENSE_PRESNAP_COLUMNS={dl:0,cb:1,s:2};
// Readiness flags: reassigned (not just mutated) as each sheet loads, so callers
// in other modules read the current value off this shared object.
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
  target.jersey=team.colors.primary;
  target.helmet=team.colors.secondary;
  target.stripe=team.colors.accent;
  target.ramp=colorRamp(team.colors.primary);
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
function makeTeamSpriteSheet(team,skinIndex,sourceImage=spriteImage,expandedSkin=false){
  const out=document.createElement('canvas');
  out.width=sourceImage.width;out.height=sourceImage.height;
  const outCtx=out.getContext('2d',{willReadFrequently:true});
  outCtx.imageSmoothingEnabled=false;
  outCtx.drawImage(sourceImage,0,0);
  const image=outCtx.getImageData(0,0,out.width,out.height);
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
    if(skinSlot>=0){
      const color=SKIN_PALETTES[skinIndex][skinSlot];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    } else if(b>r*1.22&&b>g*1.08){
      const light=(r+g+b)/3;
      const color=uniformRamp[light<45?0:light<80?1:light<135?2:3];
      data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
    }
  }
  outCtx.putImageData(image,0,0);
  return out;
}
presnapSpriteImage.onload=function(){
  rebuildSpriteSheets();
};
presnapSpriteImage.src='assets/presnap-offense.png';
defensePresnapSpriteImage.onload=function(){
  rebuildSpriteSheets();
};
defensePresnapSpriteImage.src='assets/presnap-defense.png';
spriteImage.onload=function(){
  rebuildSpriteSheets();
};
spriteImage.src='assets/sprites.png';
