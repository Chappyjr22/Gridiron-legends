import {spriteImage,spriteLoaded,makeTeamSpriteSheet} from '../rendering/spriteSheets.js';
import {resolvedUniform} from '../rendering/uniformVariants.js';
import {SPRITE_CELL} from '../state/constants.js';
import {loadBrand} from '../rendering/brand.js';
const requests=new WeakMap();
// Reuse the game's exact sprite and recoloring code, without changing OFF/DEF.
export async function paintMenuPlayer(canvas,team,skin=2,isHome=true){
 if(!canvas||!team)return;
 const request={};requests.set(canvas,request);
 if(!spriteImage.naturalWidth)await spriteLoaded;
 if(!spriteImage.naturalWidth||requests.get(canvas)!==request)return;
 const sheet=makeTeamSpriteSheet(resolvedUniform(team,isHome),Math.max(0,Math.min(3,Number(skin)||0)),spriteImage);
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,64,64);
 ctx.drawImage(sheet,3*SPRITE_CELL,0,SPRITE_CELL,SPRITE_CELL,0,0,64,64);
}
export function initMenuArt(){
 loadBrand('wordmark').then(art=>{if(art){const mark=document.querySelector('.game-wordmark');mark.src=art.toDataURL();mark.width=art.width;mark.height=art.height;}});
 const extras=document.getElementById('extras-dialog');
 document.getElementById('btn-extras').addEventListener('click',()=>extras.showModal());
 document.getElementById('btn-extras-close').addEventListener('click',()=>extras.close());
 for(const id of ['btn-league-hub','btn-start-editor'])document.getElementById(id).addEventListener('click',()=>extras.close());
}
