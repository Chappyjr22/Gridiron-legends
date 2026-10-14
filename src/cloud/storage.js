import LZString from 'lz-string';
import {gzipSync,gunzipSync,strToU8,strFromU8} from 'fflate';
// Guest keys remain byte-for-byte compatible. Account data is stored separately.
export const OWNER_KEY='gridironCloudOwnerV1';
export const CACHE_PREFIX='gridironCloudCacheV1:';
export const SAVE_KEYS=['gridironLegendsCareersV1','gridironLegendsCareerV1'];
const COMPRESSED_PREFIX='gridiron-lz-v1:';
const FAST_PREFIX='gridiron-gzip-v1:';
const isPacked=raw=>raw.startsWith(COMPRESSED_PREFIX)||raw.startsWith(FAST_PREFIX);
export function encodeDeviceSave(raw){
 const compressed=FAST_PREFIX+btoa(strFromU8(gzipSync(strToU8(raw),{level:1,mtime:0}),true));
 return compressed.length<raw.length?compressed:raw;
}
function writeDeviceSave(storage,key,decoded){
 let raw=encodeDeviceSave(decoded);
 try{storage.setItem(key,raw);}catch(error){
  if(error?.name!=='QuotaExceededError'&&error?.code!==22&&error?.code!==1014)throw error;
  // Preserve the previous format's tighter storage footprint near quota.
  // Normal gameplay uses the fast path; only storage pressure pays this cost.
  const compact=COMPRESSED_PREFIX+LZString.compressToUTF16(decoded);
  if(compact.length>=raw.length)throw error;
  storage.setItem(key,compact);raw=compact;
 }
 return raw;
}
export function decodeDeviceSave(raw){
 if(raw?.startsWith(FAST_PREFIX))return strFromU8(gunzipSync(strToU8(atob(raw.slice(FAST_PREFIX.length)),true)));
 if(!raw?.startsWith(COMPRESSED_PREFIX))return raw;
 const decoded=LZString.decompressFromUTF16(raw.slice(COMPRESSED_PREFIX.length));
 if(decoded===null||decoded==='')throw Error('Device save could not be read. Keep this tab open and export a backup.');
 return decoded;
}
export function storageErrorMessage(error){
 return error?.name==='QuotaExceededError'||error?.code===22||error?.code===1014
  ?'Device save storage is full. This operation did not finish. Keep this tab open and export a backup from My careers. Do not clear website data.'
  :error?.message||'Could not save. Keep this tab open and export a backup.';
}
export function makeAccountStorage(storage,notify=()=>{}){
 const owner=storage.getItem(OWNER_KEY)||'';
 const cacheKey=CACHE_PREFIX+owner;
 // Shrink legacy account data in place. setItem is atomic: a failed migration
 // leaves the original untouched. Never remove another account or a recovery copy.
 if(owner)for(const key of [cacheKey,cacheKey+':recovery']){
  const raw=storage.getItem(key);
  if(raw&&!isPacked(raw)){
   const packed=encodeDeviceSave(raw);
   if(packed.length<raw.length)try{storage.setItem(key,packed);}catch{}
  }
 }
 let lastRaw=owner?storage.getItem(cacheKey):null;
 let lastDecoded=null;
 const put=c=>{const decoded=JSON.stringify(c),raw=writeDeviceSave(storage,cacheKey,decoded);lastRaw=raw;lastDecoded=decoded;};
 const empty=()=>({values:{},revision:0,dirty:false,mutation:''});
 const read=()=>{const raw=storage.getItem(cacheKey);if(raw!==lastRaw)throw Error('Career changed in another tab. Reload before saving.');if(!raw)return empty();const c=JSON.parse(lastDecoded??=decodeDeviceSave(raw));if(!c.values||!Number.isSafeInteger(c.revision))throw Error('Cloud cache needs recovery.');return c;};
 const check=()=>{if((storage.getItem(OWNER_KEY)||'')!==owner)throw Error('Account changed in another tab. Reload before saving.');};
 // Commit the slot bank and its compatibility copy together. Compression is
 // synchronous for durable saves, so do it once per checkpoint, not per key.
 const setItems=entries=>{
  check();if(!owner){for(const [key,value] of Object.entries(entries))storage.setItem(key,String(value));return;}
  const c=read();let changed=false;
  for(const [key,value] of Object.entries(entries))if(c.values[key]!==String(value)){c.values[key]=String(value);changed=true;}
  if(!changed)return;
  c.dirty=true;c.mutation=crypto.randomUUID();put(c);notify();
 };
 return {
  owner,read,setItems,
  backup(expected){check();if(!owner||JSON.stringify(read())!==JSON.stringify(expected))throw Error('Save changed. Retry.');writeDeviceSave(storage,cacheKey+':recovery',JSON.stringify(expected));},
  getItem(key){check();return owner?(read().values[key]??null):storage.getItem(key);},
  setItem(key,value){setItems({[key]:value});},
  markDirty(){check();const c=read();c.dirty=true;c.mutation=crypto.randomUUID();put(c);notify();},
  snapshot(){check();return owner?read():null;},
  install(remote,expected,pending=false){check();if(!owner)throw Error('No account');const c=read();if(JSON.stringify(c)!==JSON.stringify(expected))return false;
   put({values:remote.payload||{},revision:remote.revision,dirty:pending,mutation:pending?crypto.randomUUID():''});return true;},
  acknowledge(sent,revision){check();const c=read();c.revision=revision;if(c.mutation===sent.mutation)c.dirty=false;put(c);},
 };
}
let instance;
export function careerStorage(){
 if(!instance)instance=makeAccountStorage(localStorage,()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('career-cloud-dirty'));});
 return instance;
}
