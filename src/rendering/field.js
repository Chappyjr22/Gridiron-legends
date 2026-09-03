import { canvas, ctx } from './canvas.js';
import { LAT_MIN, LAT_MAX } from '../state/constants.js';
import { goalPostImage, spriteState } from './spriteSheets.js';

export const PIXEL_DIGITS={
  '0':['111','101','101','101','111'],
  '1':['010','110','010','010','111'],
  '2':['111','001','111','100','111'],
  '3':['111','001','111','001','111'],
  '4':['101','101','111','001','001'],
  '5':['111','100','111','001','111'],
  '6':['111','100','111','101','111'],
  '7':['111','001','010','010','010'],
  '8':['111','101','111','101','111'],
  '9':['111','101','111','001','111']
};
export const PIXEL_LETTERS={
  'A':['01110','10001','10001','11111','10001','10001','10001'],
  'B':['11110','10001','10001','11110','10001','10001','11110'],
  'C':['01111','10000','10000','10000','10000','10000','01111'],
  'D':['11110','10001','10001','10001','10001','10001','11110'],
  'E':['11111','10000','10000','11110','10000','10000','11111'],
  'F':['11111','10000','10000','11110','10000','10000','10000'],
  'G':['01111','10000','10000','10111','10001','10001','01111'],
  'H':['10001','10001','10001','11111','10001','10001','10001'],
  'I':['11111','00100','00100','00100','00100','00100','11111'],
  'J':['00111','00010','00010','00010','10010','10010','01100'],
  'K':['10001','10010','10100','11000','10100','10010','10001'],
  'L':['10000','10000','10000','10000','10000','10000','11111'],
  'M':['10001','11011','10101','10101','10001','10001','10001'],
  'N':['10001','11001','11001','10101','10011','10011','10001'],
  'O':['01110','10001','10001','10001','10001','10001','01110'],
  'P':['11110','10001','10001','11110','10000','10000','10000'],
  'Q':['01110','10001','10001','10001','10101','10010','01101'],
  'R':['11110','10001','10001','11110','10100','10010','10001'],
  'S':['01111','10000','10000','01110','00001','00001','11110'],
  'T':['11111','00100','00100','00100','00100','00100','00100'],
  'U':['10001','10001','10001','10001','10001','10001','01110'],
  'V':['10001','10001','10001','10001','10001','01010','00100'],
  'W':['10001','10001','10001','10101','10101','11011','10001'],
  'X':['10001','10001','01010','00100','01010','10001','10001'],
  'Y':['10001','10001','01010','00100','00100','00100','00100']
  ,'Z':['11111','00001','00010','00100','01000','10000','11111']
};
export const END_ZONE_STYLE={
  near:{label:'HOME',base:'#164d84',accent:'#2269ad'},
  far:{label:'AWAY',base:'#7e2029',accent:'#a7323d'}
};
export function drawPixelNumber(value,cx,cy,scale,upsideDown){
  const text=String(value);
  const width=(text.length*3+Math.max(0,text.length-1))*scale;
  ctx.save();
  ctx.translate(Math.round(cx),Math.round(cy));
  if(upsideDown)ctx.rotate(Math.PI);
  const paint=(color,ox,oy)=>{
    ctx.fillStyle=color;
    let cursor=-width/2;
    for(const digit of text){
      const rows=PIXEL_DIGITS[digit];
      rows.forEach((row,ry)=>{
        for(let rx=0;rx<3;rx++)if(row[rx]==='1')ctx.fillRect(Math.round(cursor+rx*scale+ox),Math.round(-2.5*scale+ry*scale+oy),scale,scale);
      });
      cursor+=4*scale;
    }
  };
  paint('#174d24',1,1);
  paint('#e2f1d8',0,0);
  ctx.restore();
}
export function drawPixelText(text,cx,cy,scale,rotation){
  const glyphWidth=5*scale,gap=scale;
  const total=text.length*glyphWidth+Math.max(0,text.length-1)*gap;
  ctx.save();ctx.translate(Math.round(cx),Math.round(cy));ctx.rotate(rotation);
  const paint=(color,ox,oy)=>{
    ctx.fillStyle=color;
    let cursor=-total/2;
    for(const char of text){
      const rows=PIXEL_LETTERS[char];
      if(rows)rows.forEach((row,ry)=>{
        for(let rx=0;rx<5;rx++)if(row[rx]==='1')ctx.fillRect(Math.round(cursor+rx*scale+ox),Math.round(-3.5*scale+ry*scale+oy),scale,scale);
      });
      cursor+=glyphWidth+gap;
    }
  };
  paint('rgba(8,18,22,0.55)',2,2);paint('#f1f2de',0,0);
  ctx.restore();
}
export function drawGoalPost(backX,outward){
  const mid=Math.round((LAT_MIN+LAT_MAX)/2);
  if(spriteState.goalPostReady){
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    if(outward>0){ctx.translate(backX*2,0);ctx.scale(-1,1);}
    ctx.drawImage(goalPostImage,Math.round(backX-23),Math.round(mid-132),32,176);
    ctx.restore();
    return;
  }
  const crossX=Math.round(backX+outward*20);
  const paint=(color,ox,oy)=>{
    ctx.fillStyle=color;
    const stemLo=Math.min(backX,crossX)+ox;
    ctx.fillRect(stemLo,mid-2+oy,Math.abs(crossX-backX)+3,5);
    ctx.fillRect(crossX-2+ox,mid-46+oy,5,93);
    const armLo=outward>0?crossX:crossX+outward*17;
    ctx.fillRect(armLo+ox,mid-48+oy,17,5);
    ctx.fillRect(armLo+ox,mid+44+oy,17,5);
  };
  paint('rgba(17,31,18,0.55)',3,3);
  paint('#c38c10',1,1);
  paint('#ffd53d',0,0);
  ctx.fillStyle='#fff1a0';ctx.fillRect(crossX,mid-44,1,88);
}
export function drawBackLinePerson(x,y,outward,shirt){
  const inward=-outward;
  ctx.fillStyle='rgba(16,42,19,0.35)';ctx.fillRect(x-4,y+6,9,3);
  ctx.fillStyle='#17201b';ctx.fillRect(x-outward*3-3,y+3,3,5);ctx.fillRect(x-outward*3+1,y+3,3,5);
  ctx.fillStyle=shirt;ctx.fillRect(x-4,y-4,9,8);
  ctx.fillStyle='#e3aa72';ctx.fillRect(x+inward*4-2,y-3,4,5);
  ctx.fillStyle='#f2f0dc';ctx.fillRect(x-outward*4-1,y-3,2,6);
}
export function drawEndZoneApron(backX,outward){
  if(backX<0||backX>canvas.width)return;
  const lo=outward<0?0:backX;
  const hi=outward<0?backX:canvas.width;
  ctx.fillStyle='#4d9639';ctx.fillRect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);
  ctx.fillStyle='#65ad45';
  for(let px=lo;px<hi;px+=10){
    for(let py=LAT_MIN;py<LAT_MAX;py+=10){
      if((((px-lo)/10+(py-LAT_MIN)/10)|0)&1)ctx.fillRect(px,py,3,3);
    }
  }

  const restrictedX=Math.round(backX+outward*54);
  ctx.fillStyle='#efd12f';
  for(let py=LAT_MIN+3;py<LAT_MAX-3;py+=15)ctx.fillRect(restrictedX-1,py,3,9);

  const staffX=Math.round(backX+outward*78);
  const staffColors=['#243f76','#9c2930','#25292a','#e8e4d0'];
  if(staffX>-12&&staffX<canvas.width+12){
    for(let y=LAT_MIN+28,i=0;y<LAT_MAX-18;y+=48,i++)drawBackLinePerson(staffX,y,outward,staffColors[i%staffColors.length]);
  }
}
export function drawEndZoneBackLine(backX){
  ctx.fillStyle='#f2f3e6';ctx.fillRect(backX-3,LAT_MIN,7,LAT_MAX-LAT_MIN);
  ctx.fillStyle='#f17d16';
  ctx.fillRect(backX-4,LAT_MIN-5,8,10);
  ctx.fillRect(backX-4,LAT_MAX-5,8,10);
  ctx.fillStyle='#2a2418';
  ctx.fillRect(backX-2,LAT_MIN-3,4,5);
  ctx.fillRect(backX-2,LAT_MAX-2,4,5);
}
export function drawPixelEndZone(xAt,goalYard,backYard,style,rotation){
  const goalX=Math.round(xAt(goalYard)),backX=Math.round(xAt(backYard));
  const lo=Math.min(goalX,backX),hi=Math.max(goalX,backX);
  const outward=backYard<goalYard?1:-1;
  drawEndZoneApron(backX,outward);
  if(hi>=0&&lo<=canvas.width){
    ctx.fillStyle=style.base;ctx.fillRect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);
    ctx.fillStyle=style.accent;
    for(let px=lo;px<hi;px+=12){
      for(let py=LAT_MIN;py<LAT_MAX;py+=12){
        if((((px-lo)/12+(py-LAT_MIN)/12)|0)&1)ctx.fillRect(px,py,6,6);
      }
    }
    drawPixelText(style.label,(goalX+backX)/2,(LAT_MIN+LAT_MAX)/2,6,rotation);
    ctx.fillStyle='#f2f4e8';ctx.fillRect(goalX-2,LAT_MIN,4,LAT_MAX-LAT_MIN);
  }
  if(backX>-8&&backX<canvas.width+8)drawEndZoneBackLine(backX);
  if(backX>-45&&backX<canvas.width+45){
    drawGoalPost(backX,outward);
  }
}
export function drawPixelTurf(xAt,w){
  ctx.fillStyle='#174b22';ctx.fillRect(0,0,w,canvas.height);
  for(let yard=-10;yard<=110;yard+=5){
    const x0=xAt(yard),x1=xAt(yard+5);
    const lo=Math.round(Math.min(x0,x1)),hi=Math.round(Math.max(x0,x1));
    if(hi<0||lo>w)continue;
    ctx.fillStyle=(Math.floor(yard/5)&1)?'#2f7d35':'#37883b';
    ctx.fillRect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);
  }
  for(let yard=-10;yard<=110;yard++){
    const baseX=Math.round(xAt(yard));
    if(baseX<-6||baseX>w+6)continue;
    for(let i=0;i<12;i++){
      const seed=((yard+20)*97+i*53)>>>0;
      const px=baseX+(seed%7)-3;
      const py=LAT_MIN+4+((seed*17+i*31)%Math.max(1,LAT_MAX-LAT_MIN-8));
      ctx.fillStyle=(seed&1)?'rgba(12,77,27,0.32)':'rgba(155,205,105,0.25)';
      ctx.fillRect(px,py,seed%3===0?2:1,2);
    }
  }
}
export function drawTinyPerson(x,y,shirt,facesDown){
  const dir=facesDown?1:-1;
  ctx.fillStyle='#171b1a';ctx.fillRect(x-2,y+dir*5,2,3);ctx.fillRect(x+1,y+dir*5,2,3);
  ctx.fillStyle=shirt;ctx.fillRect(x-3,y+dir,7,5*dir);
  ctx.fillStyle='#e4ad75';ctx.fillRect(x-2,y-2*dir,4,3*dir);
  ctx.fillStyle='#f2f0dc';ctx.fillRect(x-4,y+dir,1,3*dir);ctx.fillRect(x+4,y+dir,1,3*dir);
}
export function drawPixelStadium(xAt,w){
  ctx.fillStyle='#070b09';ctx.fillRect(0,0,w,11);
  ctx.fillStyle='#285f28';ctx.fillRect(0,11,w,LAT_MIN-11);
  ctx.fillStyle='#4d9937';ctx.fillRect(0,LAT_MAX,w,canvas.height-LAT_MAX);
  ctx.fillStyle='#d7e8c8';ctx.fillRect(0,11,w,2);
  ctx.fillStyle='#8fc96a';ctx.fillRect(0,LAT_MIN-5,w,3);
  ctx.fillStyle='#f0d43f';
  for(let x=0;x<w;x+=18)ctx.fillRect(x,LAT_MIN-3,11,1);

  const crowdColors=['#f05b2b','#f5f1dc','#2f72b7','#e3c134','#a93232','#8d58a6'];
  for(let yard=-10;yard<=110;yard+=2.5){
    const x=Math.round(xAt(yard));
    if(x<-8||x>w+8)continue;
    const seed=Math.abs(Math.round(yard*37));
    ctx.fillStyle='#d49a68';ctx.fillRect(x-1,1+(seed%2),3,3);
    ctx.fillStyle=crowdColors[seed%crowdColors.length];ctx.fillRect(x-3,4,7,5);
    ctx.fillStyle='#e7e5d5';ctx.fillRect(x-3,9,2,2);ctx.fillRect(x+2,9,2,2);
  }
  for(let yard=-5;yard<=105;yard+=10){
    const x=Math.round(xAt(yard));
    if(x<-10||x>w+10)continue;
    const color=crowdColors[Math.abs(Math.round(yard/5))%crowdColors.length];
    drawTinyPerson(x,16,color,true);
  }
  for(let yard=0;yard<=100;yard+=20){
    const x=Math.round(xAt(yard+4));
    if(x<-12||x>w+12)continue;
    ctx.fillStyle='#f18419';ctx.fillRect(x-5,LAT_MIN-10,10,5);
    ctx.fillStyle='#101514';ctx.fillRect(x-4,LAT_MIN-9,8,2);
    ctx.fillStyle='#ffd24a';ctx.fillRect(x-1,LAT_MIN-12,3,2);
  }
  ctx.fillStyle='#245f2a';ctx.fillRect(0,LAT_MAX+4,w,canvas.height-LAT_MAX-4);
  ctx.fillStyle='#f3d53d';
  for(let x=-8;x<w;x+=18)ctx.fillRect(x,LAT_MAX+9,12,2);
  ctx.fillStyle='#a8d77c';ctx.fillRect(0,LAT_MAX+4,w,2);
  for(let yard=-5;yard<=105;yard+=20){
    const x=Math.round(xAt(yard));
    if(x<-8||x>w+8)continue;
    ctx.fillStyle='#ef7f18';ctx.fillRect(x-4,LAT_MAX+12,8,7);
    ctx.fillStyle='#1d211f';ctx.fillRect(x-3,LAT_MAX+13,6,3);
    ctx.fillStyle='#f8b029';ctx.fillRect(x-5,LAT_MAX+19,10,2);
  }
}
