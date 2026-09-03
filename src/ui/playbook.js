import { game } from '../state/gameState.js';
import { FORMATION_ORDER, FORMATIONS } from '../data/formations.js';
import { PLAYS, PLAYS_BY_FORMATION } from '../data/plays.js';
import { drawPlayDiagram } from '../rendering/playDiagram.js';
import { applyFormation, choosePlay } from '../simulation/engine.js';

const grid=document.getElementById('callsheet-grid');

export function renderFormationMenu(){
  game.playbookView='formations';game.formation=null;grid.innerHTML='';
  document.getElementById('btn-formation-back').style.visibility='hidden';
  document.getElementById('playbook-formation').textContent='Choose a formation';
  FORMATION_ORDER.forEach(id=>{
    const formation=FORMATIONS[id],button=document.createElement('button'),canvas=document.createElement('canvas');
    button.className='play-btn formation-btn';button.dataset.formation=id;
    button.innerHTML='<span class="play-type">FORMATION</span><span class="play-name">'+formation.name+'</span><span class="play-detail">'+formation.description+'</span>';
    canvas.className='play-diagram';canvas.width=190;canvas.height=78;button.insertBefore(canvas,button.children[1]||null);grid.appendChild(button);
    drawPlayDiagram(canvas,id,null);
  });
}
export function renderPlayMenu(formationId){
  game.playbookView='plays';game.formation=formationId;applyFormation(formationId);grid.innerHTML='';
  document.getElementById('btn-formation-back').style.visibility='visible';
  document.getElementById('playbook-formation').textContent=FORMATIONS[formationId].name;
  PLAYS_BY_FORMATION[formationId].forEach(key=>{
    const play=PLAYS[key],button=document.createElement('button'),canvas=document.createElement('canvas');
    button.className='play-btn';button.dataset.play=key;
    button.innerHTML='<span class="play-type">'+play.type.toUpperCase()+'</span><span class="play-name">'+play.name+'</span><span class="play-detail">'+play.detail+' / '+play.runOption+'</span>';
    canvas.className='play-diagram';canvas.width=190;canvas.height=78;button.insertBefore(canvas,button.children[1]||null);grid.appendChild(button);
    drawPlayDiagram(canvas,formationId,play);
  });
}
grid.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.formation)renderPlayMenu(button.dataset.formation);
  else if(button.dataset.play)choosePlay(button.dataset.play);
});
document.getElementById('btn-formation-back').addEventListener('click',renderFormationMenu);

// No-op at load time (the grid has no [data-play] buttons until
// renderPlayMenu creates them), preserved from the original script.
document.querySelectorAll('#callsheet-grid [data-play]').forEach(b=>{
  b.addEventListener('click',()=>choosePlay(b.dataset.play));
});
