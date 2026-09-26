import LZString from 'lz-string';
// Guest keys remain byte-for-byte compatible. Account data is stored separately.
export const OWNER_KEY='gridironCloudOwnerV1';
export const CACHE_PREFIX='gridironCloudCacheV1:';
export const SAVE_KEYS=['gridironLegendsCareersV1','gridironLegendsCareerV1'];
const COMPRESSED_PREFIX='gridiron-lz-v1:';
export function encodeDeviceSave(raw){
 const compressed=COMPRESSED_PREFIX+LZString.compressToUTF16(raw);
 return compressed.length<raw.length?compressed:raw;
}
export function decodeDeviceSave(raw){
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
  if(raw&&!raw.startsWith(COMPRESSED_PREFIX)){
   const packed=encodeDeviceSave(raw);
   if(packed.length<raw.length)try{storage.setItem(key,packed);}catch{}
  }
 }
 let lastRaw=owner?storage.getItem(cacheKey):null;
 const put=c=>{const raw=encodeDeviceSave(JSON.stringify(c));storage.setItem(cacheKey,raw);lastRaw=raw;};
 const empty=()=>({values:{},revision:0,dirty:false,mutation:''});
 const read=()=>{const raw=storage.getItem(cacheKey);if(raw!==lastRaw)throw Error('Career changed in another tab. Reload before saving.');if(!raw)return empty();const c=JSON.parse(decodeDeviceSave(raw));if(!c.values||!Number.isSafeInteger(c.revision))throw Error('Cloud cache needs recovery.');return c;};
 const check=()=>{if((storage.getItem(OWNER_KEY)||'')!==owner)throw Error('Account changed in another tab. Reload before saving.');};
 return {
  owner,read,
  backup(expected){check();if(!owner||JSON.stringify(read())!==JSON.stringify(expected))throw Error('Save changed. Retry.');storage.setItem(cacheKey+':recovery',encodeDeviceSave(JSON.stringify(expected)));},
  getItem(key){check();return owner?(read().values[key]??null):storage.getItem(key);},
  setItem(key,value){check();if(!owner){storage.setItem(key,value);return;}
   const c=read();if(c.values[key]===String(value))return;c.values[key]=String(value);c.dirty=true;c.mutation=crypto.randomUUID();put(c);notify();
  },
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
