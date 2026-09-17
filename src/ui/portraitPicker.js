import {paintPlayerPortrait,portraitChoice,PORTRAITS_PER_TONE} from './playerPortrait.js';
const el=id=>document.getElementById(id);
const TONES=['Light','Tan','Brown','Deep brown'];
let apply,choice,team,onCancel=null,accepted=false;
export function openPortraitPicker(player,t,onApply,cancel=null){
 onCancel=cancel;accepted=false;
 team=t;apply=onApply;const current=portraitChoice(t,player);choice={...player,skin:current.tone,portrait:current.face};
 el('portrait-tone').value=choice.skin;render();el('portrait-dialog').showModal();
 const heading=el('portrait-heading');heading.tabIndex=-1;heading.focus({preventScroll:true});el('portrait-grid').parentElement.scrollTop=0;
}
function render(){
 const toneWrap=el('portrait-tone-buttons');
 if(toneWrap){
  for(const button of toneWrap.querySelectorAll('button')){
   const active=Number(button.dataset.tone)===choice.skin;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
  }
 }
 el('portrait-grid').innerHTML=Array.from({length:PORTRAITS_PER_TONE},(_,i)=>`<button type="button" aria-label="Face ${i+1}" aria-pressed="${choice.portrait===i}" data-face="${i}"><canvas width="64" height="64" aria-hidden="true"></canvas><span>${i+1}</span></button>`).join('');
 for(const b of el('portrait-grid').querySelectorAll('button')){
  paintPlayerPortrait(b.querySelector('canvas'),team,{...choice,portrait:Number(b.dataset.face)});
  b.onclick=()=>{choice.portrait=Number(b.dataset.face);render();};
 }
}
export function initPortraitPicker(){
 const select=el('portrait-tone');
 select.classList.add('app-select-native-hidden');
 select.dataset.appEnhanced='portrait-tones';
 select.tabIndex=-1;
 select.setAttribute('aria-hidden','true');
 const label=document.querySelector('label[for="portrait-tone"]');
 if(label)label.removeAttribute('for');
 let wrap=el('portrait-tone-buttons');
 if(!wrap){
  wrap=document.createElement('div');
  wrap.id='portrait-tone-buttons';
  wrap.className='app-segmented portrait-tone-buttons';
  wrap.setAttribute('aria-label','Skin tone');
  wrap.innerHTML=TONES.map((tone,index)=>`<button type="button" data-tone="${index}" aria-pressed="false">${tone}</button>`).join('');
  select.insertAdjacentElement('afterend',wrap);
 }
 for(const button of wrap.querySelectorAll('button'))button.onclick=()=>{
  choice.skin=Number(button.dataset.tone);
  select.value=String(choice.skin);
  render();
 };
 el('portrait-confirm').onclick=()=>{accepted=true;el('portrait-dialog').close();apply({skin:choice.skin,portrait:choice.portrait});};
 el('portrait-dialog').addEventListener('close',()=>{if(!accepted)onCancel?.();});
 el('portrait-cancel').onclick=()=>el('portrait-dialog').close();
}
