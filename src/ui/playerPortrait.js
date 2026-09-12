import {playingRoster} from '../career/roster.js';
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

export const PORTRAITS_PER_TONE=12;
export function portraitChoice(team,player){
 const seed=identitySeed(player.id);
 const tone=Number.isInteger(Number(player.skin))&&Number(player.skin)>=0&&Number(player.skin)<4?Number(player.skin):seed%4;
 if(Number.isInteger(player.portrait)&&player.portrait>=0&&player.portrait<PORTRAITS_PER_TONE)return {tone,face:player.portrait};
 // Allocate unused faces within each team, without altering saves or chosen faces.
 const roster=team?.roster?playingRoster(team):[player],used=new Set();
 for(const p of roster)if(Number.isInteger(p.portrait)&&p.portrait>=0&&p.portrait<PORTRAITS_PER_TONE){
  const t=Number.isInteger(Number(p.skin))&&Number(p.skin)>=0&&Number(p.skin)<4?Number(p.skin):identitySeed(p.id)%4;used.add(t*12+p.portrait);
 }
 for(const p of [...roster].sort((a,b)=>a.id.localeCompare(b.id))){
  if(Number.isInteger(p.portrait)&&p.portrait>=0&&p.portrait<12)continue;
  const n=identitySeed(p.id),t=Number.isInteger(Number(p.skin))&&Number(p.skin)>=0&&Number(p.skin)<4?Number(p.skin):n%4;
  let f=(n>>>4)%12;
  for(let i=0;i<12;i++){const candidate=(f+i)%12;if(!used.has(t*12+candidate)){f=candidate;break;}}
  used.add(t*12+f);if(p.id===player.id)return {tone:t,face:f};
 }
 return {tone,face:(seed>>>4)%12};
}
const atlases=['/assets/portraits/players-v1.webp','/assets/portraits/players-v2.webp'].map(src=>{const img=new Image();img.src=src;return img;});
const pending=new WeakMap();
export function paintPlayerPortrait(canvas,team,player){
 if(!canvas||!team)return;
 const {tone,face}=portraitChoice(team,player),atlas=atlases[face<7?0:1],columns=face<7?7:5,column=face<7?face:face-7;
 const token={};pending.set(canvas,token);
 const draw=()=>{
  if(pending.get(canvas)!==token)return;
  if(!atlas.naturalWidth){paintFallbackPortrait(canvas,team,player);return;}
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
  const w=atlas.naturalWidth/columns,h=atlas.naturalHeight/4;
  ctx.drawImage(atlas,column*w,tone*h,w,h,0,0,canvas.width,canvas.height);
 };
 draw();if(!atlas.complete)atlas.addEventListener('load',draw,{once:true});
}
