import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/audio/gameAudio.js',import.meta.url),'utf8').replace("import {onFeedback} from '../state/feedback.js';",'').replace('export function','function');
function setup({muted=false,volume=35,unsupported=false,reject=false}={}){
 const events={},elements={};let feedback,ctx,starts=0,resumes=0;
 const mute={setAttribute(){}};const test={};const label={textContent:''};
 elements['[data-audio-mute]']=[mute];elements['[data-audio-test]']=[test];elements['[data-audio-status]']=[label];elements['[data-audio-volume]']=[];
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),start(){starts++;},stop(){}});
 class Audio{
  constructor(){ctx=this;this.state='suspended';this.sampleRate=100;this.currentTime=0;}
  createGain(){return node();}createBuffer(){return {getChannelData:()=>new Float32Array(100)};}
  createOscillator(){return node();}createBufferSource(){return node();}createBiquadFilter(){return node();}
  async resume(){resumes++;if(reject)throw Error('blocked');this.state='running';}
  async suspend(){this.state='suspended';}
 }
 const document={hidden:false,querySelectorAll:q=>elements[q]||[],addEventListener:(e,f)=>{events[e]=f;}};
 const navigator={audioSession:{type:'auto'}};
 const scope=vm.createContext({document,navigator,window:unsupported?{}:{AudioContext:Audio},localStorage:{getItem:()=>JSON.stringify({muted,effects:volume/100}),setItem(){}},performance:{now:()=>0},onFeedback:f=>{feedback=f;}});
 vm.runInContext(source+'\ninitAudio();',scope);
 return {events,test,mute,label,document,navigator,feedback:()=>feedback('snap'),ctx:()=>ctx,starts:()=>starts,resumes:()=>resumes};
}
const flush=()=>new Promise(r=>setImmediate(r));
{
 const t=setup();assert.equal(t.starts(),0);assert.ok(t.events.touchend);assert.ok(t.events.click);
 await t.test.onclick();assert.equal(t.starts(),1);assert.equal(t.navigator.audioSession.type,'playback');assert.match(t.label.textContent,/Test tone sent/);
 t.ctx().state='interrupted';await t.events.touchend();assert.equal(t.ctx().state,'running');assert.equal(t.resumes(),2);
 t.document.hidden=true;await t.events.visibilitychange();assert.equal(t.ctx().state,'suspended');t.feedback();await flush();assert.equal(t.starts(),1);
 t.document.hidden=false;await t.events.click();t.feedback();assert.equal(t.starts(),2);
 t.mute.onclick();t.feedback();assert.equal(t.starts(),2);await t.test.onclick();assert.match(t.label.textContent,/Turn Sound on/);
}
{
 const t=setup();t.feedback();await flush();assert.equal(t.starts(),1,'first sound waits for resume');
}
{
 const t=setup({muted:true});await t.events.click();assert.equal(t.ctx(),undefined);await t.test.onclick();assert.equal(t.starts(),0);
}
{
 const t=setup({volume:0});await t.test.onclick();assert.match(t.label.textContent,/Raise Effects/);assert.equal(t.starts(),0);
}
{
 const t=setup({unsupported:true});await t.test.onclick();assert.match(t.label.textContent,/unavailable/);
}
{
 const t=setup({reject:true});await t.test.onclick();assert.match(t.label.textContent,/could not start/);assert.equal(t.starts(),0);
}
console.log('Audio regression checks passed: gesture startup, interrupted recovery, visibility, first event, mute, zero volume, unsupported and rejected startup.');
