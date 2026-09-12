// Stable portraits for both existing saves and newly generated rosters.
export function identitySeed(id){let n=2166136261;for(const c of String(id)){n=Math.imul(n^c.charCodeAt(0),16777619);}return n>>>0;}
function paintFallbackPortrait(canvas,team,player){
 if(!canvas||!team)return;
 const seed=identitySeed(player.id),skinIndex=player.skin??(seed%4);
 const skin=['#f1c49d','#cd936a','#a76b48','#72452f'][skinIndex];
 const shadow=['#c99470','#a66e4e','#7b472f','#4d2b21'][skinIndex];
 const hair=['#211b1c','#3b2521','#815330','#c4a05c'][(seed>>>4)%4];
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,64,64);ctx.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x*2,y*2,w*2,h*2);};
 // Shoulder pads and jersey.
 const broad=/OL|DL|LB|TE/.test(player.position),left=broad?3:5,right=broad?26:22;
 rect(left,22,right,10,'#0a1b2b');rect(left+1,23,right-2,9,team.colors.primary);
 rect(left+1,24,3,3,team.colors.secondary||'#eee5cc');rect(28-left,24,3,3,team.colors.secondary||'#eee5cc');
 rect(13,19,6,5,shadow);rect(14,20,4,4,skin);
 // Face silhouette, ears and hairstyle.
 const wide=(seed>>>8)%2;rect(10-wide,6,12+wide*2,13,hair);
 rect(10-wide,10,12+wide*2,9,skin);rect(12,19,8,2,skin);
 rect(8-wide,11,2,5,shadow);rect(22+wide,11,2,5,shadow);
 const style=(seed>>>10)%4;
 if(style===0){rect(10-wide,5,12+wide*2,4,hair);rect(10-wide,8,3,3,hair);}
 if(style===1){rect(11,4,10,4,hair);rect(9,7,14,3,hair);rect(9,9,2,5,hair);}
 if(style===2){rect(10,7,12,2,hair);rect(11,6,9,2,hair);}
 if(style===3){rect(11,6,10,4,skin);rect(10,8,2,3,hair);rect(20,8,2,3,hair);}
 rect(12,12,3,1,hair);rect(18,12,3,1,hair);
 rect(13,13,1,2,'#131e29');rect(19,13,1,2,'#131e29');rect(16,14,1,3,shadow);
 if((seed>>>14)%3===0){rect(12,17,9,3,hair);rect(14,17,5,1,skin);}else rect(14,18,5,1,shadow);
 // Tiny pixel jersey numbers, not browser text.
 const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001010010010','111101111101111','111101111001111'];
 const number=String(player.number??0),x=16-(number.length*4-1)/2;
 [...number].forEach((d,i)=>[...digits[Number(d)]].forEach((v,j)=>{if(v==='1')rect(x+i*4+j%3,26+Math.floor(j/3),1,1,'#fff5da');}));
}

const atlas=new Image();atlas.src='/assets/portraits/players-v1.webp';
const pending=new WeakMap();
export function paintPlayerPortrait(canvas,team,player){
 if(!canvas||!team)return;
 const token={};pending.set(canvas,token);
 const draw=()=>{
  if(pending.get(canvas)!==token)return;
  if(!atlas.naturalWidth){paintFallbackPortrait(canvas,team,player);return;}
  const seed=identitySeed(player.id);
  const tone=Number.isInteger(Number(player.skin))&&Number(player.skin)>=0&&Number(player.skin)<4?Number(player.skin):seed%4;
  const face=Number.isInteger(player.portrait)&&player.portrait>=0&&player.portrait<7?player.portrait:(seed>>>4)%7;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
  const w=atlas.naturalWidth/7,h=atlas.naturalHeight/4;
  ctx.drawImage(atlas,face*w,tone*h,w,h,0,0,canvas.width,canvas.height);
 };
 draw();if(!atlas.complete){atlas.addEventListener('load',draw,{once:true});}
}
