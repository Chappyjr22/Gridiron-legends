const image=new Image();image.src='assets/football.png';
export function drawFootball(ctx,x,y,{time=0,tumble=false,angle=0,size=32}={}){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
 if(image.complete&&image.naturalWidth){
  const frame=Math.floor(time/(tumble?90:65))%4;
  ctx.rotate(tumble?Math.floor(time/360)*Math.PI:angle);
  ctx.drawImage(image,frame*32,tumble?32:0,32,32,-size/2,-size/2,size,size);
 }else{ctx.rotate(angle);ctx.fillStyle='#9a572e';ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,7);ctx.fill();ctx.fillStyle='#fff3d6';ctx.fillRect(-2,-1,4,2);}
 ctx.restore();
}
