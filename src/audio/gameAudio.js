import {onFeedback} from '../state/feedback.js';
const KEY='gridironLegendsAudioV1';
const settings={muted:false,effects:.35,crowd:.15};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof saved.muted==='boolean')settings.muted=saved.muted;for(const k of ['effects','crowd'])if(Number.isFinite(saved[k]))settings[k]=Math.max(0,Math.min(1,saved[k]));}catch{}
let context,master,noiseBuffer;
function unlock(){
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);noiseBuffer=context.createBuffer(1,context.sampleRate,context.sampleRate);const data=noiseBuffer.getChannelData(0);let seed=1729;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}}
  master.gain.value=settings.muted?0:1;
  if(context.state==='suspended')context.resume().catch(()=>{});
 }catch{}
}
function sound(kind){
 if(settings.muted||!context||context.state!=='running'||document.hidden)return;
 const crowd=kind==='score',volume=crowd?settings.crowd:settings.effects;if(!volume)return;
 const noise=['snap','catch','tackle','score'].includes(kind),duration=kind==='score'?1.2:kind==='whistle'?.28:kind==='tackle'?.15:.08;
 const source=noise?context.createBufferSource():context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter(),start=context.currentTime;
 if(noise){source.buffer=noiseBuffer;source.loop=true;}else{source.type='sine';source.frequency.setValueAtTime(kind==='whistle'?1800:620,start);source.frequency.linearRampToValueAtTime(kind==='whistle'?2100:820,start+duration);}
 filter.type='lowpass';filter.frequency.value=kind==='tackle'?230:kind==='score'?950:2400;
 gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*(noise?.14:.07),start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 source.connect(filter);filter.connect(gain);gain.connect(master);source.start(start);source.stop(start+duration+.02);
 source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
export function initAudio(){
 document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
 const sync=()=>{
  for(const b of document.querySelectorAll('[data-audio-mute]')){b.textContent=settings.muted?'Sound off':'Sound on';b.setAttribute('aria-pressed',String(!settings.muted));}
  for(const input of document.querySelectorAll('[data-audio-volume]'))input.value=Math.round(settings[input.dataset.audioVolume]*100);
 };
 const save=()=>{if(master)master.gain.value=settings.muted?0:1;try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}sync();};
 for(const button of document.querySelectorAll('[data-audio-mute]'))button.onclick=()=>{settings.muted=!settings.muted;save();};
 for(const input of document.querySelectorAll('[data-audio-volume]'))input.oninput=()=>{settings[input.dataset.audioVolume]=Number(input.value)/100;save();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend().catch(()=>{});});
 onFeedback(type=>{try{sound(type);}catch{}});sync();
}
