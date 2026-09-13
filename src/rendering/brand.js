// Retain the approved art; discard translucent presentation glow when rendering.
export const brandArt={shield:null,wordmark:null};
export function loadBrand(kind){
 return new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
   const c=source.getContext('2d');c.drawImage(image,0,0);
   const pixels=c.getImageData(0,0,source.width,source.height);
   let left=image.width,top=image.height,right=0,bottom=0;
   for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
    const a=(y*image.width+x)*4+3;
    if(pixels.data[a]<224)pixels.data[a]=0;
    else{left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   }
   c.putImageData(pixels,0,0);
   const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;
   cropped.getContext('2d').drawImage(source,-left,-top);
   brandArt[kind]=cropped;resolve(cropped);
  };
  image.onerror=()=>resolve(null);
  image.src=`/assets/brand/${kind}-v1.webp`;
 });
}
loadBrand('shield');
