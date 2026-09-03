// Formation layouts: player spots, offensive line, and base defensive shell.
export const OFFENSE_SKILL_KEYS=['qb','rb','wr1','wr2','wr3','te'];
export const FORMATION_ORDER=['trips','ace','pistol'];
export const BASE_LINE=[
  {num:'60',x:163,y:-1.3,position:'OL1',presnapRole:'ol',onLine:true},
  {num:'66',x:176,y:-1.0,position:null,presnapRole:'ol',onLine:true},
  {num:'67',x:189,y:-0.7,position:null,presnapRole:'ol',onLine:true},
  {num:'68',x:207,y:-0.9,position:null,presnapRole:'ol',onLine:true},
  {num:'79',x:224,y:-1.1,position:'OL2',presnapRole:'ol',onLine:true}
];
export const BASE_DEFENSE={
  players:{
    dl1:{x:188,y:0.7,presnapRole:'dl'},dl2:{x:160,y:0.7,presnapRole:'dl'},
    dl3:{x:214,y:0.7,presnapRole:'dl'},dl4:{x:241,y:0.7,presnapRole:'dl'},
    cb1:{x:48,y:2.9,presnapRole:'cb'},cb2:{x:336,y:3.2,presnapRole:'cb'},
    s1:{x:156,y:7.5,presnapRole:'s'},lb1:{x:192,y:3.2,presnapRole:null}
  },
  decor:[{num:'51',x:157,y:2.4},{num:'52',x:241,y:2.0},{num:'3',x:223,y:6.8,presnapRole:'s'}]
};
export const FORMATIONS={
  trips:{name:'Shotgun Trips',short:'Trips',description:'Three-receiver spacing with the tight end opposite.',
    players:{
      wr1:{x:39,y:-1.6,presnapRole:'wr',onLine:false,label:'X'},wr2:{x:333,y:-1.7,presnapRole:'wr',onLine:false,label:'Z'},
      wr3:{x:84,y:-0.7,presnapRole:'wr',onLine:true,label:'Slot'},te:{x:293,y:-0.6,presnapRole:'wr',onLine:true,label:'TE'},
      rb:{x:228,y:-3.4,presnapRole:'rb',onLine:false,label:'RB'},qb:{x:191,y:-3.4,presnapRole:'qb',onLine:false,label:'QB'}
    },line:BASE_LINE,defense:BASE_DEFENSE},
  ace:{name:'Shotgun Ace',short:'Ace',description:'Balanced two-tight-end set with a single deep back.',
    players:{
      wr1:{x:39,y:-1.7,presnapRole:'wr',onLine:false,label:'X'},wr2:{x:333,y:-1.7,presnapRole:'wr',onLine:false,label:'Z'},
      wr3:{x:145,y:-0.6,presnapRole:'wr',onLine:true,label:'Y'},te:{x:243,y:-0.6,presnapRole:'wr',onLine:true,label:'U'},
      rb:{x:191,y:-6.2,presnapRole:'rb',onLine:false,label:'RB'},qb:{x:191,y:-3.4,presnapRole:'qb',onLine:false,label:'QB'}
    },line:BASE_LINE,defense:BASE_DEFENSE},
  pistol:{name:'Pistol Strong',short:'Pistol',description:'Deep back with an offset H-back for power and play action.',
    players:{
      wr1:{x:39,y:-1.7,presnapRole:'wr',onLine:false,label:'X'},wr2:{x:333,y:-0.7,presnapRole:'wr',onLine:true,label:'Z'},
      wr3:{x:264,y:-3.0,presnapRole:'rb',onLine:false,label:'H'},te:{x:145,y:-0.6,presnapRole:'wr',onLine:true,label:'TE'},
      rb:{x:191,y:-6.3,presnapRole:'rb',onLine:false,label:'RB'},qb:{x:191,y:-3.4,presnapRole:'qb',onLine:false,label:'QB'}
    },line:BASE_LINE,defense:BASE_DEFENSE}
};
