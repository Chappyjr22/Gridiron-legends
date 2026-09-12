// Independent device-local careers. Unreadable entries are retained for recovery.
export const SLOTS_KEY='gridironLegendsCareersV1';
function emptyBank(){return {version:1,lastId:null,careers:{},recovery:[]};}
export function readSlots(storage,parse,legacyKey){
 const raw=storage.getItem(SLOTS_KEY);
 if(raw){
  let bank;try{bank=JSON.parse(raw);}catch{}
  if(bank?.version!==1||!bank.careers||typeof bank.careers!=='object'||Array.isArray(bank.careers))return {...emptyBank(),recovery:[{id:'career-list',raw,reason:'Unreadable career list'}]};
  const result=emptyBank();result.recovery=Array.isArray(bank.recovery)?bank.recovery:[];
  for(const [id,c] of Object.entries(bank.careers)){
   const saved=parse(JSON.stringify(c));
   if(saved){saved.careerId=id;Object.defineProperty(result.careers,id,{value:saved,enumerable:true,writable:true,configurable:true});}
   else result.recovery.push({id,raw:JSON.stringify(c),reason:'This career needs recovery'});
  }
  result.lastId=Object.hasOwn(result.careers,bank.lastId)?bank.lastId:Object.keys(result.careers)[0]||null;
  return result;
 }
 const legacy=storage.getItem(legacyKey),c=parse(legacy),bank=emptyBank();
 if(legacy&&!c)return {...bank,recovery:[{id:'legacy-career',raw:legacy,reason:'Unreadable older career'}]};
 if(c){c.careerId||='legacy-career';bank.lastId=c.careerId;bank.careers[c.careerId]=c;storage.setItem(legacyKey+'.legacyBackup',legacy);storage.setItem(SLOTS_KEY,JSON.stringify(bank));}
 return bank;
}
export function writeSlot(storage,parse,legacyKey,c){
 const bank=readSlots(storage,parse,legacyKey);c.careerId||='legacy-career';
 Object.defineProperty(bank.careers,c.careerId,{value:c,enumerable:true,writable:true,configurable:true});bank.lastId=c.careerId;
 // The same atomic write retains every unreadable original in recovery.
 storage.setItem(SLOTS_KEY,JSON.stringify(bank));
 try{storage.setItem(legacyKey,JSON.stringify(c));}catch{}
 return true;
}
