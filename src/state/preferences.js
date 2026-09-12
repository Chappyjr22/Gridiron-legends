const KEY='gridironLegendsControlsV1';
const valid={passMode:v=>['drag','direct','tap'].includes(v),throwType:v=>['lob','bullet'].includes(v),showRoutes:v=>typeof v==='boolean'};
export function controlPreferences(){
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.fromEntries(Object.entries(valid).filter(([k,test])=>test(raw[k])).map(([k])=>[k,raw[k]]));}catch{return {};}
}
export function saveControlPreferences(game){
 const prefs=Object.fromEntries(Object.keys(valid).map(k=>[k,game[k]]));
 try{localStorage.setItem(KEY,JSON.stringify(prefs));return true;}catch{return false;}
}
