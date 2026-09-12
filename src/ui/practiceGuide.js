import {onFeedback} from '../state/feedback.js';
import {game} from '../state/gameState.js';
import {choosePlay} from '../simulation/engine.js';
import {enterGame} from './menus.js';
import {requestJuke} from '../input/runnerControls.js';
const el=id=>document.getElementById(id);
let lesson=null;
export function initPracticeGuide(){
 const guide=el('practice-guide'),coach=el('practice-coach');
 const end=()=>{lesson=null;coach.hidden=true;};
 const set=(title,text)=>{el('practice-coach-title').textContent=title;el('practice-coach-text').textContent=text;};
 for(const button of document.querySelectorAll('[data-open-guide]'))button.onclick=()=>{
  el('practice-guide-start').disabled=!!game.career;el('practice-guide-note').textContent=game.career?'Finish or leave your career game before starting a practice session.':'Guided practice starts a fresh practice rep.';guide.showModal();
 };
 el('practice-guide-close').onclick=()=>guide.close();
 el('practice-guide-start').onclick=()=>{
  if(game.career)return;
  guide.close();enterGame(true);choosePlay('trips_slants');lesson='pass';coach.hidden=false;el('practice-coach-next').hidden=true;
  const text=game.passMode==='tap'?'Tap a receiver to snap and pass.':game.passMode==='direct'?'Drag toward your receiver’s next spot, then release.':'Pull away from the receiver’s next spot, then release.';
  set('1 · Lead your receiver',text);
 };
 el('practice-coach-next').onclick=()=>{
  enterGame(true);choosePlay('trips_inside');lesson='juke';el('practice-coach-next').hidden=true;set('2 · Make a defender miss','Tap the field to hand off. Use Juke up or Juke down when a defender crouches.');
 };
 el('practice-coach-close').onclick=end;
 el('btn-main-menu').addEventListener('click',end);
 onFeedback(type=>{
  if(!lesson||!game.practice)return;
  if(lesson==='pass'&&type==='throw'){set('Pass released','Watch the lead and the coverage. Try another pass, or move on to juking.');el('practice-coach-next').hidden=false;}
  if(lesson==='pass'&&type==='catch')set('Caught it!','Drag to steer your runner. Ready to practice a quick cut?');
  if(lesson==='juke'&&type==='juke'){set('You made the cut!','Time it as the defender commits. Keep practicing or close this coach card.');lesson='done';}
 });
 document.addEventListener('keydown',event=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea'))return;
  if(['ArrowUp','ArrowDown'].includes(event.key)&&requestJuke(event.key==='ArrowUp'?-1:1))event.preventDefault();
  if(event.key==='Escape'&&['live','presnap','tackle'].includes(game.phase)){
   event.preventDefault();el(game.paused?'btn-resume':'btn-pause').click();
  }
 });
}
