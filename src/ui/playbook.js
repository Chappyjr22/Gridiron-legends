import {game} from '../state/gameState.js';
import {FORMATION_ORDER,FORMATIONS} from '../data/formations.js';
import {PLAYS,PLAYS_BY_FORMATION} from '../data/plays.js';
import {drawPlayDiagram} from '../rendering/playDiagram.js';
import {applyFormation,choosePlay} from '../simulation/engine.js';
const grid=document.getElementById('callsheet-grid'),tabs=document.getElementById('formation-tabs');
let selected=FORMATION_ORDER[0],page=0;
const compact=matchMedia('(orientation: landscape) and (max-height: 550px)');
export function renderFormationMenu(){renderPlayMenu(selected);}
export function renderPlayMenu(id){
 if(!FORMATION_ORDER.includes(id))id=FORMATION_ORDER[0];
 if(selected!==id)page=0;selected=id;game.playbookView='plays';game.formation=id;applyFormation(id);
 tabs.replaceChildren();
 for(const formation of FORMATION_ORDER){const b=document.createElement('button');b.className='formation-tab';b.dataset.formation=formation;b.textContent=formation==='trips'?'Trips':formation==='ace'?'Ace':'Pistol';b.setAttribute('aria-pressed',String(formation===id));b.addEventListener('click',()=>renderPlayMenu(formation));tabs.appendChild(b);}
 document.getElementById('playbook-formation').textContent=FORMATIONS[id].name;
 const keys=PLAYS_BY_FORMATION[id],size=compact.matches?3:6,pages=Math.ceil(keys.length/size);page=Math.min(page,pages-1);grid.replaceChildren();
 document.getElementById('play-page-label').textContent=pages>1?`${page+1} / ${pages}`:'6 plays';
 document.getElementById('play-page-prev').disabled=page===0;document.getElementById('play-page-next').disabled=page===pages-1;
 document.querySelector('.playbook-pages').hidden=pages===1;
 for(const key of keys.slice(page*size,(page+1)*size)){
  const play=PLAYS[key],b=document.createElement('button'),canvas=document.createElement('canvas');b.className='play-btn';b.dataset.play=key;
  b.innerHTML=`<span class="play-type">${play.type.toUpperCase()}</span><span class="play-name">${play.name}</span>`;
  canvas.className='play-diagram';canvas.width=270;canvas.height=112;b.insertBefore(canvas,b.children[1]);grid.appendChild(b);drawPlayDiagram(canvas,id,play);
 }
}
grid.addEventListener('click',event=>{const b=event.target.closest('[data-play]');if(b)choosePlay(b.dataset.play);});
document.getElementById('play-page-prev').addEventListener('click',()=>{page=Math.max(0,page-1);renderPlayMenu(selected);});
document.getElementById('play-page-next').addEventListener('click',()=>{page++;renderPlayMenu(selected);});
compact.addEventListener('change',()=>{if(game.phase==='callsheet'){page=0;renderPlayMenu(selected);}});
