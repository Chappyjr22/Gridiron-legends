import {ctx} from './canvas.js';
export const staffFrames=[];
const source=new Image();
source.onload=()=>{
  const sheet=document.createElement('canvas');sheet.width=source.width;sheet.height=source.height;
  const sc=sheet.getContext('2d',{willReadFrequently:true});sc.drawImage(source,0,0);
  const image=sc.getImageData(0,0,sheet.width,sheet.height),data=image.data;
  // Remove translucent matte fringe before caching the small game sprites.
  for(let i=3;i<data.length;i+=4)if(data[i]<224)data[i]=0;
  sc.putImageData(image,0,0);
  for(let cell=0;cell<6;cell++){
    const x0=cell%3*sheet.width/3,y0=Math.floor(cell/3)*sheet.height/2;
    let left=sheet.width,right=0,top=sheet.height,bottom=0;
    for(let y=y0;y<y0+sheet.height/2;y++)for(let x=x0;x<x0+sheet.width/3;x++){
      if(!data[(y*sheet.width+x)*4+3])continue;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<left)return;
    const frame=document.createElement('canvas');frame.height=48;frame.width=Math.round((right-left+1)/(bottom-top+1)*48);
    const fc=frame.getContext('2d');fc.imageSmoothingEnabled=false;
    fc.drawImage(sheet,left,top,right-left+1,bottom-top+1,0,0,frame.width,48);staffFrames.push(frame);
  }
};
source.src='assets/stadium/staff-v1.webp';
export function drawStadiumStaff(x,feetY,role,height=28,faceLeft=false){
  const frame=staffFrames[role];if(!frame)return;
  const width=Math.round(frame.width/frame.height*height);
  ctx.save();ctx.translate(Math.round(x),Math.round(feetY));
  if(faceLeft)ctx.scale(-1,1);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(frame,-Math.round(width/2),-height,width,height);ctx.restore();
}
