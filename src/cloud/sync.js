import {careerStorage,OWNER_KEY,CACHE_PREFIX,SAVE_KEYS} from './storage.js';
import {parseCareer} from '../career/career.js';
import {readSlots} from '../career/slots.js';
export function mergePayload(remote,local){
 const remoteBank=readSlots({getItem:k=>remote?.[k]??null,setItem(){}},parseCareer,SAVE_KEYS[1]);
 const localBank=readSlots({getItem:k=>local?.[k]??null,setItem(){}},parseCareer,SAVE_KEYS[1]);
 for(const c of Object.values(localBank.careers)){
  const content=value=>JSON.stringify({...value,careerId:null});
  if(Object.values(remoteBank.careers).some(saved=>content(saved)===content(c)))continue;
  const copy=structuredClone(c);copy.careerId='restored-'+crypto.randomUUID();remoteBank.careers[copy.careerId]=copy;remoteBank.lastId=copy.careerId;
 }
 remoteBank.recovery.push(...localBank.recovery);
 const values={[SAVE_KEYS[0]]:JSON.stringify(remoteBank)};
 if(remoteBank.lastId&&remoteBank.careers[remoteBank.lastId])values[SAVE_KEYS[1]]=JSON.stringify(remoteBank.careers[remoteBank.lastId]);
 return values;
}
export function initCloud(){
 const store=careerStorage(),owner=store.owner;
 const dialog=document.getElementById('cloud-account');
 const el=id=>document.getElementById(id);
 let busy=false,conflict=false,timer,user=null;
 function message(text){el('cloud-message').textContent=text;for(const label of document.querySelectorAll('[data-cloud-status]'))label.textContent=text;}
 async function api(path,body,method){
  const response=await fetch(path,{method:method||(body?'POST':'GET'),credentials:'same-origin',headers:{'Content-Type':'application/json',...(owner?{'X-Career-Owner':owner}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok){const e=Error(data?.message||'Could not sync. Your device save is safe.');e.status=response.status;e.conflict=!!data?.conflict;throw e;}return data;
 }
 const atMenu=()=>document.getElementById('start-screen').classList.contains('show');
 async function sync(){
  if(!owner||busy||conflict)return;
  busy=true;
  try{
   store.snapshot();message('Checking cloud save…');
   const remote=await api('/api/cloud');
   const current=store.snapshot();
   if(remote.revision!==current.revision){
    if(current.dirty){conflict=true;el('cloud-conflict').hidden=false;message('Two versions found. Open Account to keep both.');return;}
    if(!atMenu()){message('Newer cloud save available. Return to the main menu and open Account.');return;}
    if(!store.install(remote,current)){message('Saved on device. Syncing again shortly.');return;}
    location.reload();return;
   }
   if(current.dirty){
    message('Saving to cloud…');
    const result=await api('/api/cloud',{revision:current.revision,mutation:current.mutation,payload:current.values},'PUT');
    store.acknowledge(current,result.revision);
   }
   message(store.snapshot().dirty?'Saved on device. Waiting to sync.':'Saved to cloud');
  }catch(error){if(error.conflict){conflict=true;el('cloud-conflict').hidden=false;}message(error.status===401?'Saved on device. Sign in again to sync.':error.conflict?'Two versions found. Open Account to keep both.':'Saved on device. Sync unavailable. Retry from Account.');}
  finally{busy=false;}
 }
 async function session(){
  try{const result=await api('/api/auth/get-session');user=result?.user||null;
   el('cloud-email-label').textContent=user?.email||'';
   el('cloud-login').hidden=!!user&&user.id===owner;el('cloud-signed-in').hidden=!user||user.id!==owner;
   if(user&&user.id!==owner){el('cloud-switch').hidden=false;el('cloud-switch').textContent='Open signed-in account';}
   if(!owner)message('Guest careers are saved on this device.');
   else if(user?.id===owner)await sync();else message('Saved on device. Sign in again to sync.');
  }catch{message(owner?'Saved on device. Connect to sync.':'Guest careers are saved on this device.');}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>void sync(),3000);message(owner?'Saved on device. Waiting to sync.':'Saved on this device');}
 for(const button of document.querySelectorAll('[data-open-account]'))button.onclick=()=>{dialog.showModal();void session();};
 el('cloud-close').onclick=()=>dialog.close();
 el('cloud-send').onclick=async()=>{
  const email=el('cloud-email').value.trim();if(!el('cloud-email').reportValidity())return;
  el('cloud-send').disabled=true;
  try{await api('/api/auth/email-otp/send-verification-otp',{email,type:'sign-in'});el('cloud-code-row').hidden=false;message('Check your email for the sign-in code.');el('cloud-code').focus();}
  catch(error){message(error.message);}finally{el('cloud-send').disabled=false;}
 };
 el('cloud-login').onsubmit=async event=>{
  event.preventDefault();el('cloud-verify').disabled=true;
  try{await api('/api/auth/sign-in/email-otp',{email:el('cloud-email').value.trim(),otp:el('cloud-code').value.trim()});const s=await api('/api/auth/get-session');if(!s?.user?.id)throw Error('Sign-in did not finish. Please try again.');localStorage.setItem(OWNER_KEY,s.user.id);sessionStorage.setItem('gridironOpenAccount','1');location.reload();}
  catch(error){message(error.message);}finally{el('cloud-verify').disabled=false;}
 };
 el('cloud-switch').onclick=()=>{if(user){localStorage.setItem(OWNER_KEY,user.id);location.reload();}};
 el('cloud-signout').onclick=async()=>{
  if(busy)return;el('cloud-signout').disabled=true;
  try{await api('/api/auth/sign-out',{});localStorage.removeItem(OWNER_KEY);location.reload();}
  catch{message('Could not sign out. Reconnect and try again. Your careers are retained.');el('cloud-signout').disabled=false;}
 };
 el('cloud-guest').onclick=()=>{localStorage.removeItem(OWNER_KEY);location.reload();};
 el('cloud-retry').onclick=()=>void sync();
 async function mergeIntoCloud(local){
  if(busy)return;busy=true;
  try{
   const current=store.snapshot(),remote=await api('/api/cloud');
   const values=mergePayload(remote.payload,local);
   // Preserve all pending account work too when importing guest/history saves.
   const merged=current.dirty?mergePayload(values,current.values):values;
   if(JSON.stringify(store.snapshot())!==JSON.stringify(current))throw Error('Save changed. Retry.');
   // Keep the old cache for manual recovery before the atomic replacement.
   localStorage.setItem(CACHE_PREFIX+owner+':recovery',JSON.stringify(current));
   // Install updates the storage adapter's tab snapshot. Writes mark it dirty atomically.
   if(!store.install({payload:merged,revision:remote.revision},current,true))throw Error('Save changed. Retry.');
   // Mark the merged payload pending without depending on another gameplay action.

   conflict=false;el('cloud-conflict').hidden=true;message('Both versions kept. Syncing…');
  }catch(error){message(error.message);return;}finally{busy=false;}
  await sync();if(!conflict&&!store.snapshot().dirty)location.reload();
 }
 el('cloud-upload').onclick=()=>void mergeIntoCloud(Object.fromEntries(SAVE_KEYS.map(k=>[k,localStorage.getItem(k)]).filter(([,v])=>v)));
 el('cloud-keep-both').onclick=()=>void mergeIntoCloud(store.snapshot().values);
 el('cloud-history').onclick=async()=>{
  try{const items=await api('/api/cloud/history'),list=el('cloud-history-list');list.replaceChildren();
   for(const item of items){const b=document.createElement('button');b.className='sports-button blue';b.textContent='Restore copy · '+new Date(item.updatedAt).toLocaleString();b.onclick=async()=>{try{await mergeIntoCloud(await api('/api/cloud/history?revision='+item.revision));}catch(error){message(error.message);}};list.append(b);}
   if(!items.length)list.textContent='Backups appear after your next cloud save.';
  }catch(error){message(error.message);}
 };
 el('cloud-signed-in').hidden=!owner;
 window.addEventListener('career-cloud-dirty',schedule);
 window.addEventListener('online',()=>void session());
 window.addEventListener('storage',event=>{if(event.key===OWNER_KEY||event.key===CACHE_PREFIX+owner){conflict=true;message('Account or career changed in another tab. Reload before playing.');}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void session();});
 setInterval(()=>void sync(),30000);
 if(sessionStorage.getItem('gridironOpenAccount')){sessionStorage.removeItem('gridironOpenAccount');dialog.showModal();}
 void session();
}
