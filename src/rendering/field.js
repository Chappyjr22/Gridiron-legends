import { canvas, ctx } from './canvas.js';
import { LAT_MIN, LAT_MAX } from '../state/constants.js';
import { goalPostImage, spriteState } from './spriteSheets.js';
import {game} from '../state/gameState.js';
import {drawStadiumStaff} from './stadiumStaff.js';
import {TEAM_GROUPS,GROUP_POSES,chainPositions} from './stadiumLayout.js';
import { drawSidelinePlayer } from './sidelinePlayers.js';
import { SCENE_TOP, FIELD_HEIGHT } from './sceneLayout.js';
import { stadiumArt, drawGeneratedTurf, drawStadiumEquipment } from './stadiumArt.js';

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
export function drawEndZoneApron(backX,outward,xAt){
  if(backX<0||backX>canvas.width)return;
  const lo=outward<0?0:backX;
  const hi=outward<0?backX:canvas.width;
  ctx.fillStyle='#4d9639';ctx.fillRect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);
  if(xAt){
    ctx.save();ctx.beginPath();ctx.rect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);ctx.clip();
    drawGeneratedTurf(xAt,canvas.width,LAT_MIN,LAT_MAX);
    ctx.restore();
  }

  const restrictedX=Math.round(backX+outward*54);
  ctx.fillStyle='#efd12f';
  for(let py=LAT_MIN+3;py<LAT_MAX-3;py+=15)ctx.fillRect(restrictedX-1,py,3,9);

  const mediaX=Math.round(backX+outward*94);
  const barrierX=Math.round(backX+outward*160);
  const outerLo=outward<0?0:barrierX,outerHi=outward<0?barrierX:canvas.width;
  ctx.fillStyle='#34404b';ctx.fillRect(outerLo,LAT_MIN,Math.max(0,outerHi-outerLo),LAT_MAX-LAT_MIN);
  ctx.fillStyle='#87949b';ctx.fillRect(barrierX-3,LAT_MIN,6,LAT_MAX-LAT_MIN);
  ctx.fillStyle='#162c43';
  for(let y=LAT_MIN+4;y<LAT_MAX-4;y+=40)ctx.fillRect(barrierX-5,y,10,32);
  for(const [i,y] of [76,110,286,327].entries()){
    drawStadiumStaff(mediaX+(i%2?outward*18:0),y,i%2?5:4,i%2?25:31,outward>0);
  }
  drawStadiumEquipment(barrierX-outward*30,150,3);
  drawStadiumEquipment(barrierX-outward*30,300,2);
  drawStadiumStaff(backX+outward*32,LAT_MIN+30,2,29,outward>0);

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
  drawEndZoneApron(backX,outward,xAt);
  if(hi>=0&&lo<=canvas.width){
    ctx.fillStyle=style.base;ctx.fillRect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);
    ctx.fillStyle=style.accent;
    ctx.fillRect(lo+6,LAT_MIN+6,3,LAT_MAX-LAT_MIN-12);
    ctx.fillRect(hi-9,LAT_MIN+6,3,LAT_MAX-LAT_MIN-12);
    drawPixelText(style.label,(goalX+backX)/2,(LAT_MIN+LAT_MAX)/2,6,rotation);
    ctx.fillStyle='#f2f4e8';ctx.fillRect(goalX-2,LAT_MIN,4,LAT_MAX-LAT_MIN);
  }
  if(backX>-8&&backX<canvas.width+8)drawEndZoneBackLine(backX);
  if(backX>-45&&backX<canvas.width+45){
    drawGoalPost(backX,outward);
  }
}
export function drawPixelTurf(xAt,w){
  ctx.fillStyle='#285f28';ctx.fillRect(0,-SCENE_TOP,w,FIELD_HEIGHT+SCENE_TOP);
  const textured=drawGeneratedTurf(xAt,w,LAT_MIN,LAT_MAX);
  for(let yard=-10;yard<=110;yard+=5){
    const x0=xAt(yard),x1=xAt(yard+5);
    const lo=Math.round(Math.min(x0,x1)),hi=Math.round(Math.max(x0,x1));
    if(hi<0||lo>w)continue;
    ctx.fillStyle=textured?((Math.floor(yard/5)&1)?'rgba(17,62,25,0.15)':'rgba(84,141,47,0.05)'):((Math.floor(yard/5)&1)?'#2f7d35':'#37883b');
    ctx.fillRect(lo,LAT_MIN,hi-lo,LAT_MAX-LAT_MIN);
  }
  if(textured)return;
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
  ctx.fillStyle='#172638';ctx.fillRect(0,-SCENE_TOP,w,26);
  if(stadiumArt.crowd){
    const anchor=Math.round(xAt(0)),start=((anchor%420)+420)%420-420;
    for(let x=start;x<w;x+=420)ctx.drawImage(stadiumArt.crowd,x,-SCENE_TOP);
  }
  ctx.fillStyle='#4c8434';ctx.fillRect(0,-14,w,LAT_MIN+14);
  ctx.fillStyle='#718164';ctx.fillRect(0,-14,w,3);
  ctx.fillStyle='#98b775';ctx.fillRect(0,LAT_MIN-7,w,4);
  ctx.fillStyle='#f0d43f';
  const stripeStart=((Math.round(xAt(0))%18)+18)%18-18;
  for(let x=stripeStart;x<w;x+=18)ctx.fillRect(x,LAT_MIN-4,11,1);
  const chains=chainPositions(game),markerXs=[...(chains.showChains?[chains.start,chains.target]:[]),chains.down].map(xAt);
  TEAM_GROUPS.forEach((yard,group)=>{
    drawStadiumEquipment(xAt(yard-2.2),4,group%3);
    GROUP_POSES.forEach(([offset,feet],index)=>{
      const x=xAt(yard+offset);
      if(x<-24||x>w+24||markerXs.some(marker=>Math.abs(marker-x)<20))return;
      drawSidelinePlayer(x,feet,group*6+index,false,index<3?27:30);
    });
    const coachX=xAt(yard+2.6);
    if(!markerXs.some(marker=>Math.abs(marker-coachX)<22))drawStadiumStaff(coachX,18,group%2,28);
  });
  for(const yard of [5,95])drawStadiumStaff(xAt(yard),20,2,28);
  for(const yard of chains.showChains?[chains.start,chains.target]:[]){
    const x=Math.round(xAt(yard));
    drawStadiumStaff(x+12,23,3,28);
    ctx.fillStyle='#121619';ctx.fillRect(x-2,-15,4,39);
    ctx.fillStyle='#fa8b19';ctx.fillRect(x-1,-12,2,34);
    ctx.fillRect(x-5,-17,10,10);ctx.fillStyle='#171b1f';ctx.fillRect(x-3,-15,6,6);
  }
  const downX=Math.round(xAt(chains.down));
  if(!chains.showChains||[chains.start,chains.target].map(xAt).every(x=>Math.abs(x-downX)>22))drawStadiumStaff(downX+12,23,3,28);
  ctx.fillStyle='#11181d';ctx.fillRect(downX-2,-3,4,27);
  ctx.fillStyle='#f58c22';ctx.fillRect(downX-7,-8,14,16);
  ctx.fillStyle='#11181d';ctx.fillRect(downX-5,-6,10,12);
  drawPixelNumber(chains.number,downX,0,2,false);
  ctx.fillStyle='#3d7730';ctx.fillRect(0,LAT_MAX,w,FIELD_HEIGHT-LAT_MAX);
  ctx.fillStyle='#a8d77c';ctx.fillRect(0,LAT_MAX+4,w,2);
  ctx.fillStyle='#f3d53d';
  for(let x=stripeStart;x<w;x+=18)ctx.fillRect(x,LAT_MAX+9,12,2);
  TEAM_GROUPS.forEach((yard,group)=>{
    for(let index=0;index<5;index++){
      const x=xAt(yard+(index-2)*.75);
      if(x<-16||x>w+16)continue;
      drawSidelinePlayer(x,FIELD_HEIGHT-1-(index%2)*2,group*5+index,true,21);
    }
  });
  for(let yard=-5;yard<=105;yard+=20){
    const x=Math.round(xAt(yard));
    if(x<-8||x>w+8)continue;
    ctx.fillStyle='#ef7f18';ctx.fillRect(x-4,LAT_MAX+12,8,7);
    ctx.fillStyle='#1d211f';ctx.fillRect(x-3,LAT_MAX+13,6,3);
    ctx.fillStyle='#f8b029';ctx.fillRect(x-5,LAT_MAX+19,10,2);
  }
}
