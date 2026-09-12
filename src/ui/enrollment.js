import {paintMenuPlayer} from './menuArt.js';
import {COLLEGE_TEAMS} from '../career/collegeData.js';
import {TEAMS} from '../state/league.js';
const el=id=>document.getElementById(id);
let step=0;
function preview(){
 const team=(el('career-path').value==='college'?COLLEGE_TEAMS:TEAMS).find(t=>t.id===el(el('career-path').value==='college'?'career-school':'career-team').value);
 paintMenuPlayer(el('enrollment-sprite'),team,el('career-skin').value);
 el('enrollment-preview-name').textContent=el('career-name').value.trim()||'Your quarterback';
 el('enrollment-preview-detail').textContent=`#${el('career-number').value||'7'} · QB`;
}
function show(value){
 step=value;
 el('enrollment-identity').hidden=step!==0;el('enrollment-season').hidden=step!==1;
 el('enrollment-back').hidden=step===0;el('enrollment-next').hidden=step===1;el('career-begin').hidden=step===0;
 el('enrollment-step').textContent=`${step+1} / 2`;el('enrollment-title').textContent=step?'Your season':'Your player';
 document.querySelector('.enrollment-fields').scrollTop=0;preview();
}
export function resetEnrollment(){show(0);}
export function initEnrollment(){
 el('enrollment-next').onclick=()=>{
  for(const id of ['career-name','career-number'])if(!el(id).reportValidity())return;
  show(1);el('enrollment-back').focus();
 };
 el('enrollment-back').onclick=()=>{show(0);el('enrollment-next').focus();};
 el('career-create').addEventListener('input',preview);
 el('career-create').addEventListener('change',preview);
 el('school-confirm').addEventListener('click',()=>queueMicrotask(preview));
 el('career-create').addEventListener('keydown',e=>{if(e.key==='Enter'&&step===0&&e.target.tagName==='INPUT'){e.preventDefault();el('enrollment-next').click();}});
 el('career-create').addEventListener('invalid',e=>{if(el('enrollment-identity').contains(e.target))show(0);},true);
}
