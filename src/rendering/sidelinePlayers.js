import { ctx } from './canvas.js';
import { OFF, DEF, SKIN_PALETTES } from '../state/constants.js';

const source=new Image();
const frames=[];
const cache=new Map();
const rgb=hex=>hex.replace('#','').match(/.{2}/g).map(value=>parseInt(value,16));

source.onload=()=>{
  const sheet=document.createElement('canvas');
  sheet.width=source.naturalWidth;sheet.height=source.naturalHeight;
  const context=sheet.getContext('2d',{willReadFrequently:true});
  context.drawImage(source,0,0);
  const {data}=context.getImageData(0,0,sheet.width,sheet.height);
  // Trim each generated cell using alpha, retaining the complete helmet and feet.
  for(let pose=0;pose<4;pose++){
    const start=Math.floor(pose*sheet.width/4),end=Math.floor((pose+1)*sheet.width/4);
    let left=end,right=start,top=sheet.height,bottom=0;
    for(let y=0;y<sheet.height;y++)for(let x=start;x<end;x++){
      if(data[(y*sheet.width+x)*4+3]<128)continue;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<left)continue;
    const frame=document.createElement('canvas');
    frame.height=48;frame.width=Math.round((right-left+1)/(bottom-top+1)*48);
    const fc=frame.getContext('2d');fc.imageSmoothingEnabled=false;
    fc.drawImage(source,left,top,right-left+1,bottom-top+1,0,0,frame.width,48);
    frames.push(frame);
  }
  cache.clear();
};
source.src='assets/stadium/sideline-standing-v1.webp';

function coloredFrame(team,pose,skin){
  const key=[team.jersey,team.helmet,team.stripe,pose,skin].join(':');
  if(cache.has(key))return cache.get(key);
  if(cache.size>128)cache.clear();
  const base=frames[pose];
  const out=document.createElement('canvas');out.width=base.width;out.height=base.height;
  const context=out.getContext('2d');context.drawImage(base,0,0);
  const image=context.getImageData(0,0,out.width,out.height),data=image.data;
  const jersey=rgb(team.jersey),helmet=rgb(team.helmet),stripe=rgb(team.stripe);
  for(let i=0;i<data.length;i+=4){
    if(!data[i+3])continue;
    const r=data[i],g=data[i+1],b=data[i+2],y=Math.floor(i/4/out.width);
    let color;
    if(y<10&&r>140&&g>90&&b<g*.8)color=stripe;
    else if(r>95&&r>g*1.08&&g>b*1.05&&r-b>40){
      const light=r+g+b;
      color=SKIN_PALETTES[skin][light>560?0:light>500?1:light>440?2:light>370?3:4];
    }else if(b>r*1.22&&b>g*1.08){
      const scale=Math.max(.38,Math.min(1.2,(r+g+b)/230));
      color=(y<22?helmet:jersey).map(channel=>Math.min(255,Math.round(channel*scale)));
    }
    if(color){data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];}
  }
  context.putImageData(image,0,0);cache.set(key,out);return out;
}

export function drawSidelinePlayer(x,feetY,index,away=false){
  if(frames.length!==4)return;
  const pose=index%4,skin=Math.floor(index/3)%SKIN_PALETTES.length;
  const frame=coloredFrame(away?DEF:OFF,pose,skin);
  const height=22,width=Math.round(frame.width/frame.height*height);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(frame,Math.round(x-width/2),feetY-height,width,height);
}
