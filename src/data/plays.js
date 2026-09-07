import { FORMATION_ORDER } from './formations.js';

// Play library: routes, run paths, blocking assignments, and per-formation groupings.
export const PLAYS={
  trips_slants:{formation:'trips',name:'Quick Slants',type:'pass',detail:'3-man quick game',runOption:'handoff',blocks:['te'],
    routes:{wr1:[{x:39,y:2},{x:132,y:7}],wr3:[{x:84,y:2},{x:176,y:6}],wr2:[{x:333,y:2},{x:246,y:7}]},
    defenders:{wr1:['cb1'],wr3:['s1'],wr2:['cb2']}},
  trips_mesh:{formation:'trips',name:'Mesh Crossers',type:'pass',detail:'Crossers + TE flat',runOption:'handoff',blocks:[],
    routes:{wr1:[{x:39,y:3},{x:285,y:5}],wr2:[{x:333,y:3},{x:98,y:5}],te:[{x:293,y:1},{x:344,y:2}]},
    defenders:{wr1:['cb1'],wr2:['cb2'],te:['lb1']}},
  trips_verticals:{formation:'trips',name:'Four Verticals',type:'pass',detail:'Four vertical stretch',runOption:'pitch',blocks:[],
    routes:{wr1:[{x:39,y:22}],wr3:[{x:104,y:22}],te:[{x:275,y:20}],wr2:[{x:333,y:22}]},
    defenders:{wr1:['cb1'],wr3:['s1'],te:['lb1'],wr2:['cb2']}},
  trips_bubble:{formation:'trips',name:'Bubble Screen',type:'screen',detail:'Slot screen with escorts',runOption:'handoff',blocks:['wr1','te'],
    routes:{wr3:[{x:105,y:0},{x:52,y:2}]},defenders:{wr3:['cb1']}},
  trips_inside:{formation:'trips',name:'Inside Zone',type:'run',detail:'Handoff through A gap',runOption:'handoff',blocks:['wr1','wr2','wr3','te'],
    runPath:[{x:205,y:-1},{x:202,y:5},{x:194,y:13}],routes:{},defenders:{}},
  trips_draw:{formation:'trips',name:'RB Draw',type:'run',detail:'Pass look, delayed handoff',runOption:'handoff',blocks:['wr1','wr2','wr3','te'],
    runDelay:180,runPath:[{x:218,y:-1},{x:208,y:5},{x:220,y:13}],routes:{},defenders:{}},

  ace_stick:{formation:'ace',name:'Stick',type:'pass',detail:'TE option + flat',runOption:'handoff',blocks:['wr3'],
    routes:{te:[{x:243,y:5},{x:286,y:5}],wr2:[{x:333,y:12}],rb:[{x:225,y:0},{x:284,y:2}]},
    defenders:{te:['lb1'],wr2:['cb2'],rb:['s1']}},
  ace_levels:{formation:'ace',name:'Levels',type:'pass',detail:'Layered crossers',runOption:'handoff',blocks:['te'],routeDelays:{wr3:260},
    routes:{wr1:[{x:39,y:4},{x:252,y:5}],wr2:[{x:333,y:9},{x:118,y:10}],wr3:[{x:145,y:3},{x:265,y:7}]},
    defenders:{wr1:['cb1'],wr2:['cb2'],wr3:['lb1']}},
  ace_flood:{formation:'ace',name:'Flood',type:'pass',detail:'Three-level sideline stretch',runOption:'pitch',blocks:['wr3'],
    routes:{wr2:[{x:333,y:18}],te:[{x:243,y:7},{x:332,y:9}],rb:[{x:226,y:0},{x:322,y:2}]},
    defenders:{wr2:['cb2'],te:['s1'],rb:['lb1']}},
  ace_pa_cross:{formation:'ace',name:'PA Deep Cross',type:'playaction',detail:'Run fake + deep crosser',runOption:'handoff',blocks:['wr3'],routeDelays:{te:220},
    routes:{wr1:[{x:39,y:9},{x:270,y:14}],wr2:[{x:333,y:21}],te:[{x:243,y:5},{x:148,y:10}]},
    defenders:{wr1:['cb1','s1'],wr2:['cb2'],te:['lb1']}},
  ace_power:{formation:'ace',name:'Power',type:'run',detail:'Downhill off right guard',runOption:'handoff',blocks:['wr1','wr2','wr3','te'],
    runPath:[{x:210,y:-1},{x:220,y:5},{x:236,y:13}],routes:{},defenders:{}},
  ace_outside:{formation:'ace',name:'Outside Zone',type:'run',detail:'Stretch toward left edge',runOption:'handoff',blocks:['wr1','wr2','wr3','te'],
    runPath:[{x:174,y:-1},{x:145,y:4},{x:95,y:12}],routes:{},defenders:{}},

  pistol_smash:{formation:'pistol',name:'Smash',type:'pass',detail:'Hitch + corner high-low',runOption:'handoff',blocks:['wr3'],
    routes:{wr1:[{x:39,y:5}],te:[{x:145,y:7},{x:65,y:15}],wr2:[{x:333,y:12}]},
    defenders:{wr1:['cb1'],te:['s1'],wr2:['cb2']}},
  pistol_seam:{formation:'pistol',name:'TE Seam',type:'pass',detail:'Seam with outside clearouts',runOption:'handoff',blocks:['wr3'],routeDelays:{te:180},
    routes:{te:[{x:145,y:4},{x:164,y:19}],wr1:[{x:39,y:21}],wr2:[{x:333,y:20}]},
    defenders:{te:['lb1','s1'],wr1:['cb1'],wr2:['cb2']}},
  pistol_screen:{formation:'pistol',name:'RB Screen',type:'screen',detail:'Delay screen behind H-back',runOption:'pitch',blocks:['wr3','te'],routeDelays:{rb:220},
    routes:{rb:[{x:218,y:-1},{x:286,y:2}]},defenders:{rb:['lb1']}},
  pistol_pa_post:{formation:'pistol',name:'PA Post',type:'playaction',detail:'Run fake + post shot',runOption:'handoff',blocks:['wr3'],
    routes:{wr1:[{x:39,y:10},{x:156,y:21}],wr2:[{x:333,y:20}],te:[{x:145,y:3},{x:286,y:6}]},
    defenders:{wr1:['cb1','s1'],wr2:['cb2'],te:['lb1']}},
  pistol_counter:{formation:'pistol',name:'Counter',type:'run',detail:'Misdirection behind H-back',runOption:'handoff',blocks:['wr1','wr2','wr3','te'],
    runPath:[{x:223,y:-2},{x:204,y:1},{x:158,y:7},{x:132,y:14}],routes:{},defenders:{}},
  pistol_toss:{formation:'pistol',name:'Strong Toss',type:'run',detail:'Pitch to the strong edge',runOption:'pitch',blocks:['wr1','wr2','wr3','te'],
    runPath:[{x:230,y:-3},{x:277,y:1},{x:322,y:7},{x:340,y:14}],routes:{},defenders:{}}
};
export const PLAYS_BY_FORMATION=Object.fromEntries(FORMATION_ORDER.map(id=>[id,Object.keys(PLAYS).filter(key=>PLAYS[key].formation===id)]));
export const FORMATION_RUN_PATHS={
  trips:[{x:214,y:-1},{x:205,y:5},{x:198,y:13}],
  ace:[{x:205,y:-1},{x:214,y:5},{x:225,y:13}],
  pistol:[{x:226,y:-2},{x:266,y:2},{x:308,y:9},{x:324,y:14}]
};
