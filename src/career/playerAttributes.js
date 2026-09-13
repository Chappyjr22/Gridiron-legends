const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

const SCHEMAS={
  QB:{accuracy:0,arm:0,release:0,speed:-5},
  RB:{speed:5,strength:2,catching:-2,stamina:1},
  WR:{speed:6,catching:4,strength:-5,stamina:0},
  TE:{catching:3,strength:5,speed:-4,stamina:1},
  OL:{strength:7,blocking:6,stamina:2,speed:-10},
  DL:{strength:6,tackling:5,speed:-5,stamina:1},
  LB:{tackling:5,strength:3,speed:0,stamina:1},
  DB:{speed:6,tackling:0,catching:-1,stamina:1}
};

function hashString(value){
  let hash=2166136261;
  for(const char of String(value)){
    hash^=char.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function rng(seed){
  let value=seed>>>0;
  return ()=>{
    value+=0x6D2B79F5;
    let t=value;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function positionKey(player){
  const raw=String(player?.position||player?.slot||'').toUpperCase();
  if(raw.startsWith('WR'))return 'WR';
  if(raw.startsWith('OL'))return 'OL';
  if(raw.startsWith('DL'))return 'DL';
  if(raw.startsWith('DB')||raw==='CB'||raw==='S')return 'DB';
  return raw in SCHEMAS?raw:'WR';
}

export function ensurePlayerAttributes(player,seedContext=''){
  if(!player)return {};
  const schema=SCHEMAS[positionKey(player)]||SCHEMAS.WR;
  const existing=player.attributes&&typeof player.attributes==='object'?player.attributes:{};
  const random=rng(hashString(`${seedContext}:${player.id||player.firstName||''}:${player.slot||player.position||''}`));
  const base=Number.isFinite(Number(player.rating))?Number(player.rating):72;
  const attributes={...existing};
  for(const [key,bias] of Object.entries(schema)){
    if(Number.isFinite(Number(attributes[key])))continue;
    const spread=Math.round((random()+random()-1)*13);
    attributes[key]=clamp(Math.round(base+bias+spread),45,97);
  }
  player.attributes=attributes;
  if(!Number.isInteger(player.skin))player.skin=Math.floor(random()*4);
  if(!Number.isInteger(player.portrait))player.portrait=Math.floor(random()*12);
  return attributes;
}

export function attributeRating(player,key,fallbackKey='rating'){
  const value=Number(player?.attributes?.[key]);
  if(Number.isFinite(value))return clamp(value,0,100);
  const fallback=Number(player?.[fallbackKey]);
  return Number.isFinite(fallback)?clamp(fallback,0,100):75;
}

export function speedMultiplier(player,difficulty='medium',momentum=0){
  const speed=attributeRating(player,'speed');
  let range=difficulty==='easy'?0.13:difficulty==='hard'?0.29:0.24;
  if(difficulty==='gridiron')range=0.24+Math.max(-0.03,Math.min(0.04,momentum*0.04));
  return clamp(1+((speed-75)/25)*range,1-range,1+range);
}

export function strengthEdge(carrier,defender){
  const offense=attributeRating(carrier,'strength');
  const defense=attributeRating(defender,'tackling','rating');
  return clamp((offense-defense)/100,-0.22,0.22);
}

export function attributeLabels(player){
  return Object.keys(ensurePlayerAttributes(player)).map(key=>[key,key.replace(/\b\w/g,c=>c.toUpperCase())]);
}
