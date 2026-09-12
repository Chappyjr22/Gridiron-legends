import {onFeedback} from '../state/feedback.js';
const KEY='gridironLegendsAudioV1';
const settings={muted:false,effects:.35,crowd:.15};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof saved.muted==='boolean')settings.muted=saved.muted;for(const k of ['effects','crowd'])if(Number.isFinite(saved[k]))settings[k]=Math.max(0,Math.min(1,saved[k]));}catch{}
let context,master,noiseBuffer;
function status(message){
 for(const el of document.querySelectorAll('[data-audio-status]'))el.textContent=message;
}
function updateStatus(){
 status(settings.muted?'Sound is off.':context?.state==='running'?'Audio ready.':context?.state==='interrupted'?'Audio interrupted. Tap Test sound to retry.':'Tap Test sound to enable audio.');
}
// Run directly in a trusted gesture, including touchend/click on mobile Safari.
async function unlock(){
 if(settings.muted||document.hidden)return false;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){status('Audio is unavailable in this browser.');return false;}
  // Feature-detected: use media playback routing instead of Web Audio's ambient default.
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
  if(!context||context.state==='closed'){
   context=new Audio();master=context.createGain();master.connect(context.destination);
   context.onstatechange=updateStatus;
   noiseBuffer=context.createBuffer(1,context.sampleRate,context.sampleRate);
   const data=noiseBuffer.getChannelData(0);let seed=1729;
   for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
  }
  master.gain.value=settings.muted?0:1;
  if(context.state!=='running')await context.resume();
  updateStatus();return context.state==='running';
 }catch{status('Audio could not start. Tap Test sound to retry.');return false;}
}
function sound(kind){
 if(settings.muted||!context||context.state!=='running'||document.hidden)return false;
 const crowd=kind==='score',volume=crowd?settings.crowd:settings.effects;if(!volume)return false;
 const noise=['snap','catch','tackle','score'].includes(kind),duration=kind==='score'?1.2:kind==='whistle'?.28:kind==='tackle'?.15:.08;
 const source=noise?context.createBufferSource():context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter(),start=context.currentTime;
 if(noise){source.buffer=noiseBuffer;source.loop=true;}else{source.type='sine';source.frequency.setValueAtTime(kind==='whistle'?1800:620,start);source.frequency.linearRampToValueAtTime(kind==='whistle'?2100:820,start+duration);}
 filter.type='lowpass';filter.frequency.value=kind==='tackle'?650:kind==='score'?950:2400;
 gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*(noise?.5:.25),start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 source.connect(filter);filter.connect(gain);gain.connect(master);source.start(start);source.stop(start+duration+.02);
 source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 return true;
}
export function initAudio(){
 for(const event of ['pointerdown','touchend','click','keydown'])document.addEventListener(event,unlock,{passive:true,capture:true});
 const sync=()=>{
  for(const b of document.querySelectorAll('[data-audio-mute]')){b.textContent=settings.muted?'Sound off':'Sound on';b.setAttribute('aria-pressed',String(!settings.muted));}
  for(const input of document.querySelectorAll('[data-audio-volume]'))input.value=Math.round(settings[input.dataset.audioVolume]*100);
 };
 const save=()=>{if(master)master.gain.value=settings.muted?0:1;try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}sync();updateStatus();};
 for(const button of document.querySelectorAll('[data-audio-mute]'))button.onclick=()=>{settings.muted=!settings.muted;save();if(!settings.muted)void unlock();};
 for(const input of document.querySelectorAll('[data-audio-volume]'))input.oninput=()=>{settings[input.dataset.audioVolume]=Number(input.value)/100;save();};
 for(const button of document.querySelectorAll('[data-audio-test]'))button.onclick=async()=>{
  if(settings.muted){status('Turn Sound on, then tap Test sound.');return;}
  if(!settings.effects){status('Raise Effects volume, then tap Test sound.');return;}
  status('Starting audio. If this stays here, tap Test sound again.');
  if(await unlock()){
   try{if(sound('whistle'))status('Test tone sent. No sound? Check phone volume and audio output.');}
   catch{status('Test sound failed. Tap again to retry.');}
  }
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend().catch(()=>{});});
 onFeedback(type=>{
  if(settings.muted||document.hidden)return;
  if(context?.state==='running'){try{sound(type);}catch{updateStatus();}return;}
  // Keep a first-gesture sound while resume resolves, but never replay old gameplay.
  const requestedAt=performance.now();
  void unlock().then(ready=>{if(ready&&performance.now()-requestedAt<250){try{sound(type);}catch{updateStatus();}}});
 });sync();updateStatus();
}
