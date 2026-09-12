import {paintPlayerPortrait,portraitChoice,PORTRAITS_PER_TONE} from './playerPortrait.js';
const el=id=>document.getElementById(id);
let apply,choice,team;
export function openPortraitPicker(player,t,onApply){
 team=t;apply=onApply;const current=portraitChoice(t,player);choice={...player,skin:current.tone,portrait:current.face};
 el('portrait-tone').value=choice.skin;render();el('portrait-dialog').showModal();
}
function render(){
 el('portrait-grid').innerHTML=Array.from({length:PORTRAITS_PER_TONE},(_,i)=>`<button type="button" aria-label="Face ${i+1}" aria-pressed="${choice.portrait===i}" data-face="${i}"><canvas width="64" height="64" aria-hidden="true"></canvas><span>${i+1}</span></button>`).join('');
 for(const b of el('portrait-grid').querySelectorAll('button')){
  paintPlayerPortrait(b.querySelector('canvas'),team,{...choice,portrait:Number(b.dataset.face)});
  b.onclick=()=>{choice.portrait=Number(b.dataset.face);render();};
 }
}
export function initPortraitPicker(){
 el('portrait-tone').onchange=()=>{choice.skin=Number(el('portrait-tone').value);render();};
 el('portrait-confirm').onclick=()=>{apply({skin:choice.skin,portrait:choice.portrait});el('portrait-dialog').close();};
 el('portrait-cancel').onclick=()=>el('portrait-dialog').close();
}
