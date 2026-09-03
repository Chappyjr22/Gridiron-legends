import { game } from '../state/gameState.js';
import { FORMATION_ORDER, FORMATIONS } from '../data/formations.js';
import { applyFormation, initPlay, ensureLoopStarted } from '../simulation/engine.js';
import { hideAllOverlays } from './hud.js';
import { editState } from '../input/editState.js';
import { updateEditJSON } from '../input/editControls.js';

const formationEditorSelect=document.getElementById('formation-editor-select');
FORMATION_ORDER.forEach(id=>{
  const option=document.createElement('option');option.value=id;option.textContent=FORMATIONS[id].name;formationEditorSelect.appendChild(option);
});
formationEditorSelect.addEventListener('change',()=>{
  applyFormation(formationEditorSelect.value);game.cameraYard=game.los;updateEditJSON();
});
document.getElementById('btn-done-edit').addEventListener('click',()=>{
  editState.editMode=false;
  document.getElementById('edit-panel').style.display='none';
  document.getElementById('game-view').style.display='none';
  document.getElementById('start-screen').classList.add('show');
});
document.getElementById('btn-copy-formation').addEventListener('click',()=>{
  const ta=document.getElementById('edit-json');
  ta.focus();ta.select();
  try{document.execCommand('copy');}catch(e){}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(ta.value).catch(()=>{});
  }
});

export function enterFormationLab(){
  document.getElementById('start-screen').classList.remove('show');
  document.getElementById('game-view').style.display='flex';
  initPlay();
  formationEditorSelect.value='trips';
  applyFormation('trips');
  editState.editMode=true;
  hideAllOverlays();
  document.getElementById('presnap-hint').style.display='none';
  document.getElementById('edit-panel').style.display='block';
  updateEditJSON();
  ensureLoopStarted();
}
