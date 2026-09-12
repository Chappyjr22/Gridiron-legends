import {ctx} from './canvas.js';

export const stadiumArt={turf:null,crowd:null,equipment:[]};
function load(name,ready){
  const image=new Image();image.onload=()=>ready(image);
  image.src=`assets/stadium/${name}.webp`;
}
load('turf-day-v1',image=>{
  const tile=document.createElement('canvas');tile.width=128;tile.height=128;
  const context=tile.getContext('2d');context.imageSmoothingEnabled=false;
  context.drawImage(image,0,0,128,128);stadiumArt.turf=tile;
});
load('crowd-day-v1',image=>{
  const strip=document.createElement('canvas');strip.width=420;strip.height=26;
  const context=strip.getContext('2d');context.imageSmoothingEnabled=false;
  // The generated atlas has white padding above and below the seating.
  context.drawImage(image,0,Math.round(image.height*.39),image.width,Math.round(image.height*.387),0,0,420,26);
  stadiumArt.crowd=strip;
});
load('equipment-v1',image=>{
  const sheet=document.createElement('canvas');sheet.width=image.width;sheet.height=image.height;
  const context=sheet.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const {data}=context.getImageData(0,0,sheet.width,sheet.height);
  // The bench is wider than the other objects; these gutters follow the atlas.
  for(const [lo,hi] of [[0,.34],[.34,.57],[.58,.79],[.80,1]]){
    let left=sheet.width,right=0,top=sheet.height,bottom=0;
    for(let x=Math.floor(lo*sheet.width);x<Math.floor(hi*sheet.width);x++)for(let y=0;y<sheet.height;y++){
      if(data[(y*sheet.width+x)*4+3]<128)continue;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<left)return;
    const frame=document.createElement('canvas');frame.height=32;frame.width=Math.round((right-left+1)/(bottom-top+1)*32);
    const fc=frame.getContext('2d');fc.imageSmoothingEnabled=false;
    fc.drawImage(image,left,top,right-left+1,bottom-top+1,0,0,frame.width,32);
    stadiumArt.equipment.push(frame);
  }
});

export function drawStadiumEquipment(x,feetY,index){
  const frame=stadiumArt.equipment[index%4];if(!frame)return;
  const height=index%4===3?26:20,width=Math.round(frame.width/frame.height*height);
  ctx.drawImage(frame,Math.round(x-width/2),feetY-height,width,height);
}

export function drawGeneratedTurf(xAt,width,top,bottom){
  if(!stadiumArt.turf)return false;
  const anchor=Math.round(xAt(0)),start=((anchor%128)+128)%128-128;
  ctx.save();ctx.beginPath();ctx.rect(0,top,width,bottom-top);ctx.clip();
  for(let x=start;x<width;x+=128)for(let y=top;y<bottom;y+=128)ctx.drawImage(stadiumArt.turf,x,y);
  ctx.fillStyle='rgba(62,133,46,0.28)';ctx.fillRect(0,top,width,bottom-top);
  ctx.restore();return true;
}
