(function(){
'use strict';

const CONFERENCES={
  legacy:{id:'legacy',name:'Legacy Conference'},
  frontier:{id:'frontier',name:'Frontier Conference'}
};

const TEAMS=[
  {id:'bos',city:'Boston',name:'Harborhawks',abbr:'BOS',conference:'legacy',division:'east',colors:{primary:'#174a7e',secondary:'#dce8ef',accent:'#d44a3a'}},
  {id:'buf',city:'Buffalo',name:'Snowcats',abbr:'BUF',conference:'legacy',division:'east',colors:{primary:'#2458a6',secondary:'#eef5ff',accent:'#ef4c3f'}},
  {id:'mia',city:'Miami',name:'Tidebreakers',abbr:'MIA',conference:'legacy',division:'east',colors:{primary:'#087f83',secondary:'#f2f1df',accent:'#ef7f32'}},
  {id:'ny1',city:'New York',name:'Skyliners',abbr:'NYS',conference:'legacy',division:'east',colors:{primary:'#2556a6',secondary:'#eef1f4',accent:'#d62f3e'}},

  {id:'bal',city:'Baltimore',name:'Admirals',abbr:'BAL',conference:'legacy',division:'north',colors:{primary:'#33215d',secondary:'#d7c56b',accent:'#11131a'}},
  {id:'cin',city:'Cincinnati',name:'Rivermen',abbr:'CIN',conference:'legacy',division:'north',colors:{primary:'#d85a22',secondary:'#f4ede1',accent:'#262626'}},
  {id:'cle',city:'Cleveland',name:'Rockhounds',abbr:'CLE',conference:'legacy',division:'north',colors:{primary:'#6f351d',secondary:'#f4e4c3',accent:'#df672d'}},
  {id:'pit',city:'Pittsburgh',name:'Forge',abbr:'PIT',conference:'legacy',division:'north',colors:{primary:'#1a1d20',secondary:'#f3f0df',accent:'#f0b92f'}},

  {id:'hou',city:'Houston',name:'Apollos',abbr:'HOU',conference:'legacy',division:'south',colors:{primary:'#15395d',secondary:'#e8edf0',accent:'#c8433b'}},
  {id:'ind',city:'Indianapolis',name:'Checkers',abbr:'IND',conference:'legacy',division:'south',colors:{primary:'#245194',secondary:'#f2f4ef',accent:'#78a9d4'}},
  {id:'jax',city:'Jacksonville',name:'Tridents',abbr:'JAX',conference:'legacy',division:'south',colors:{primary:'#08757c',secondary:'#1b2428',accent:'#d6a83e'}},
  {id:'nas',city:'Nashville',name:'Copperheads',abbr:'NSH',conference:'legacy',division:'south',colors:{primary:'#2e639a',secondary:'#d9edf5',accent:'#bd6335'}},

  {id:'den',city:'Denver',name:'Highliners',abbr:'DEN',conference:'legacy',division:'west',colors:{primary:'#204b82',secondary:'#f0eee4',accent:'#e36c2e'}},
  {id:'kc',city:'Kansas City',name:'Stampede',abbr:'KCS',conference:'legacy',division:'west',colors:{primary:'#b72e34',secondary:'#f3ead6',accent:'#e8af39'}},
  {id:'lv',city:'Las Vegas',name:'Neon',abbr:'LVN',conference:'legacy',division:'west',colors:{primary:'#202229',secondary:'#dde0df',accent:'#b744c7'}},
  {id:'la1',city:'Los Angeles',name:'Comets',abbr:'LAC',conference:'legacy',division:'west',colors:{primary:'#225aa8',secondary:'#f0ede0',accent:'#f0b637'}},

  {id:'dal',city:'Dallas',name:'Outriders',abbr:'DAL',conference:'frontier',division:'east',colors:{primary:'#234a72',secondary:'#e5e8e5',accent:'#8aa0ad'}},
  {id:'ny2',city:'New York',name:'Empire',abbr:'NYE',conference:'frontier',division:'east',colors:{primary:'#273f78',secondary:'#ece7d8',accent:'#d0443d'}},
  {id:'phi',city:'Philadelphia',name:'Foundry',abbr:'PHI',conference:'frontier',division:'east',colors:{primary:'#17615e',secondary:'#e9eee8',accent:'#909b99'}},
  {id:'was',city:'Washington',name:'Monuments',abbr:'WAS',conference:'frontier',division:'east',colors:{primary:'#6f2434',secondary:'#f0e6cc',accent:'#d9a934'}},

  {id:'chi',city:'Chicago',name:'Union',abbr:'CHI',conference:'frontier',division:'north',colors:{primary:'#172d4d',secondary:'#e8e8df',accent:'#cc542e'}},
  {id:'det',city:'Detroit',name:'Gearheads',abbr:'DET',conference:'frontier',division:'north',colors:{primary:'#2971a5',secondary:'#edf0eb',accent:'#7f8b91'}},
  {id:'gb',city:'Green Bay',name:'Northwind',abbr:'GBN',conference:'frontier',division:'north',colors:{primary:'#1e5945',secondary:'#f1e9ca',accent:'#e1b83a'}},
  {id:'min',city:'Minneapolis',name:'Voyageurs',abbr:'MIN',conference:'frontier',division:'north',colors:{primary:'#50317c',secondary:'#eee6cf',accent:'#ddb74c'}},

  {id:'atl',city:'Atlanta',name:'Firebirds',abbr:'ATL',conference:'frontier',division:'south',colors:{primary:'#9d2832',secondary:'#f0e9df',accent:'#26272a'}},
  {id:'cha',city:'Charlotte',name:'Crowns',abbr:'CLT',conference:'frontier',division:'south',colors:{primary:'#1680a8',secondary:'#e8eff0',accent:'#292d39'}},
  {id:'no',city:'New Orleans',name:'Brass',abbr:'NOB',conference:'frontier',division:'south',colors:{primary:'#2a2928',secondary:'#f0e8d4',accent:'#c49b48'}},
  {id:'tb',city:'Tampa',name:'Tritons',abbr:'TAM',conference:'frontier',division:'south',colors:{primary:'#9e3438',secondary:'#eee8dc',accent:'#bd7c42'}},

  {id:'phx',city:'Phoenix',name:'Scorpions',abbr:'PHX',conference:'frontier',division:'west',colors:{primary:'#8d2733',secondary:'#eee7d7',accent:'#d58b31'}},
  {id:'la2',city:'Los Angeles',name:'Aftershock',abbr:'LAS',conference:'frontier',division:'west',colors:{primary:'#372460',secondary:'#eee7d2',accent:'#d7a536'}},
  {id:'sf',city:'San Francisco',name:'Fog',abbr:'SFF',conference:'frontier',division:'west',colors:{primary:'#9e3033',secondary:'#f0e8d5',accent:'#d2a240'}},
  {id:'sea',city:'Seattle',name:'Orcas',abbr:'SEA',conference:'frontier',division:'west',colors:{primary:'#164b66',secondary:'#e1edf0',accent:'#59a848'}}
];

const FIRST_NAMES=['Marcus','Andre','Devin','Malik','Darius','Jalen','Isaiah','Cameron','Trey','Jordan','Caleb','Xavier','Miles','Dante','Tyler','Evan','Cole','Nolan','Grant','Luke','Jayden','Micah','Roman','Bryce','Kai','Desmond','Terrance','Elijah','Noah','Julian','Damien','Rashad'];
const LAST_NAMES=['Carter','Brooks','Hayes','Bennett','Reed','Foster','Mitchell','Price','Warren','Coleman','Turner','Ward','Simmons','Porter','Griffin','Marshall','Parker','Ellis','Stone','Cross','Freeman','Banks','Morris','Holland','Lawson','Grant','Wells','Harris','Owens','Bryant','Dawson','Webb'];
const COACH_FIRST=['Arthur','Calvin','Derek','Franklin','Graham','Harold','Isaac','Leon','Martin','Quentin','Russell','Victor','Wesley','Avery','Bryan','Cliff'];
const COACH_LAST=['Maddox','Mercer','Holt','Keene','Rhodes','Sutton','Vaughn','Pierce','Dalton','Morrow','Barrett','Callahan','Hawkins','Boone','Fletcher','Cobb'];
const ROSTER_SLOTS=['QB','RB','WR1','WR2','TE','OL1','OL2','DL1','DL2','LB','DB1','DB2'];
const NUMBER_RANGES={QB:[1,19],RB:[20,49],WR1:[0,19],WR2:[0,19],TE:[80,89],OL1:[60,79],OL2:[60,79],DL1:[90,99],DL2:[50,99],LB:[40,59],DB1:[20,39],DB2:[20,39]};

function hashString(value){
  let hash=2166136261;
  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function rng(seed){
  let value=seed>>>0;
  return function(){
    value+=0x6D2B79F5;
    let t=value;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function pick(list,random){return list[Math.floor(random()*list.length)];}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

function playerNumber(slot,random,used){
  const range=NUMBER_RANGES[slot];
  for(let tries=0;tries<100;tries++){
    const number=Math.floor(range[0]+random()*(range[1]-range[0]+1));
    if(!used.has(number)){used.add(number);return number;}
  }
  for(let number=0;number<=99;number++)if(!used.has(number)){used.add(number);return number;}
  return 0;
}

function basePosition(slot){return slot.replace(/[12]$/,'');}

function createRoster(team,season){
  const random=rng(hashString(team.id+':'+season+':roster'));
  const usedNumbers=new Set();
  return ROSTER_SLOTS.map((slot,index)=>{
    const rating=clamp(Math.round(64+random()*25+(index<5?2:0)),60,94);
    const potentialRoll=random();
    return {
      id:team.id+'-'+season+'-'+slot.toLowerCase(),
      slot,
      position:basePosition(slot),
      firstName:pick(FIRST_NAMES,random),
      lastName:pick(LAST_NAMES,random),
      number:playerNumber(slot,random,usedNumbers),
      age:Math.floor(21+random()*13),
      rating,
      development:potentialRoll>0.92?'Elite':potentialRoll>0.7?'Impact':'Normal',
      contractYears:Math.floor(1+random()*4)
    };
  });
}

function createCoach(team,side,season){
  const random=rng(hashString(team.id+':'+side+':'+season));
  return {
    id:team.id+'-'+side.toLowerCase(),
    role:side,
    firstName:pick(COACH_FIRST,random),
    lastName:pick(COACH_LAST,random),
    rating:Math.round(55+random()*36),
    contractYears:Math.floor(1+random()*4)
  };
}

function average(values){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;}

function calculateRatings(roster,coaches){
  const offense=roster.filter(player=>['QB','RB','WR','TE','OL'].includes(player.position));
  const defense=roster.filter(player=>['DL','LB','DB'].includes(player.position));
  const genericOffense=Math.round(44+coaches.oc.rating*0.43);
  const genericDefense=Math.round(44+coaches.dc.rating*0.43);
  const offenseRating=Math.round(average([...offense.map(player=>player.rating),genericOffense,genericOffense]));
  const defenseRating=Math.round(average([...defense.map(player=>player.rating),genericDefense,genericDefense,genericDefense]));
  return {
    offense:offenseRating,
    defense:defenseRating,
    overall:Math.round((offenseRating+defenseRating)/2),
    genericOffense,
    genericDefense
  };
}

function createTeamState(team,season){
  const roster=createRoster(team,season);
  const coaches={oc:createCoach(team,'OC',season),dc:createCoach(team,'DC',season)};
  return {...team,roster,coaches,ratings:calculateRatings(roster,coaches),record:{wins:0,losses:0,ties:0}};
}

function createFranchise(userTeamId='bos',season=1){
  return {
    schemaVersion:1,
    leagueName:'Gridiron Legends League',
    season,
    week:1,
    userTeamId,
    createdAt:new Date().toISOString(),
    teams:TEAMS.map(team=>createTeamState(team,season))
  };
}

function findTeam(id){return TEAMS.find(team=>team.id===id)||TEAMS[0];}
function findTeamState(franchise,id){return franchise?.teams?.find(team=>team.id===id)||null;}
function fullName(team){return team.city+' '+team.name;}
function conferenceName(id){return CONFERENCES[id]?.name||id;}
function divisionName(team){return conferenceName(team.conference)+' '+team.division[0].toUpperCase()+team.division.slice(1);}

function loadFranchise(){
  try{
    const raw=localStorage.getItem('gridironLegendsFranchiseV1');
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(parsed.schemaVersion!==1||!Array.isArray(parsed.teams)||parsed.teams.length!==32)return null;
    return parsed;
  }catch(error){return null;}
}

function saveFranchise(franchise){
  try{localStorage.setItem('gridironLegendsFranchiseV1',JSON.stringify(franchise));return true;}
  catch(error){return false;}
}

window.GridironLeague={
  CONFERENCES,
  TEAMS,
  ROSTER_SLOTS,
  createFranchise,
  findTeam,
  findTeamState,
  fullName,
  divisionName,
  loadFranchise,
  saveFranchise
};
})();
