// Independent device-local careers. Legacy save is backed up before migration.
export const SLOTS_KEY='gridironLegendsCareersV1';
export function readSlots(storage,parse,legacyKey){
 const raw=storage.getItem(SLOTS_KEY);
 if(raw){const bank=JSON.parse(raw);if(bank?.version!==1||!bank.careers||typeof bank.careers!=='object')throw Error('Career list could not be read. Export a backup before continuing.');
  for(const c of Object.values(bank.careers))if(!parse(JSON.stringify(c)))throw Error('A saved career could not be read. Your saves have not been changed.');return bank;}
 const legacy=storage.getItem(legacyKey),c=parse(legacy);
 if(legacy&&!c)throw Error('An unreadable career save exists. Export it before creating a career.');
 const bank={version:1,lastId:null,careers:{}};
 if(c){c.careerId||='legacy-career';bank.lastId=c.careerId;bank.careers[c.careerId]=c;storage.setItem(legacyKey+'.legacyBackup',legacy);storage.setItem(SLOTS_KEY,JSON.stringify(bank));}
 return bank;
}
export function writeSlot(storage,parse,legacyKey,c){
 const bank=readSlots(storage,parse,legacyKey);c.careerId||='legacy-career';bank.careers[c.careerId]=c;bank.lastId=c.careerId;
 storage.setItem(SLOTS_KEY,JSON.stringify(bank));
 // Compatibility mirror for old clients and existing export tools. The slot bank is authoritative.
 try{storage.setItem(legacyKey,JSON.stringify(c));}catch{}
 return true;
}
