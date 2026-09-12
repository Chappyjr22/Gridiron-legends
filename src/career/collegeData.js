// Original programs inspired by the geography and traditions of college football.
export const COLLEGE_CONFERENCES={
  "southern": {
    "id": "southern",
    "name": "Southern Conference"
  },
  "heartland": {
    "id": "heartland",
    "name": "Heartland Conference"
  },
  "atlantic": {
    "id": "atlantic",
    "name": "Atlantic Conference"
  },
  "western": {
    "id": "western",
    "name": "Western Conference"
  }
};
export const SCHOOL_TIERS={
 powerhouse:{name:'Powerhouse',attributeBonus:4,rosterBonus:6,expectation:'Win the conference',goalCompletions:0.65,goalTurnovers:0,goalXP:15},
 competitive:{name:'Competitive',attributeBonus:0,rosterBonus:0,expectation:'Build a winning season',goalCompletions:0.60,goalTurnovers:1,goalXP:20},
 rebuilding:{name:'Rebuilding',attributeBonus:-4,rosterBonus:-6,expectation:'Lead the turnaround',goalCompletions:0.55,goalTurnovers:1,goalXP:25}
};
export const SCHEMES={spread:'Spread passing',balanced:'Balanced offense',run:'Run-heavy offense'};
export const COLLEGE_TEAMS=[
  {
    "id": "college-cypress",
    "city": "Cypress State",
    "name": "Gators",
    "abbr": "CYP",
    "conference": "southern",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "balanced",
    "colors": {
      "primary": "#1659a0",
      "accent": "#ef7c25",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-redriver",
    "city": "Red River",
    "name": "Longhorns",
    "abbr": "RRU",
    "conference": "southern",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "spread",
    "colors": {
      "primary": "#aa5424",
      "accent": "#fff1d6",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-ironridge",
    "city": "Iron Ridge",
    "name": "Crimson Hawks",
    "abbr": "IRU",
    "conference": "southern",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "balanced",
    "colors": {
      "primary": "#9e2135",
      "accent": "#eee5d5",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-peachtree",
    "city": "Peachtree",
    "name": "Bulldogs",
    "abbr": "PTU",
    "conference": "southern",
    "division": "college",
    "tier": "competitive",
    "scheme": "run",
    "colors": {
      "primary": "#b62d3a",
      "accent": "#151e29",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-bayou",
    "city": "Bayou State",
    "name": "Marshcats",
    "abbr": "BAY",
    "conference": "southern",
    "division": "college",
    "tier": "competitive",
    "scheme": "spread",
    "colors": {
      "primary": "#55308d",
      "accent": "#e8bf37",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-rockytop",
    "city": "Smoky Mountain",
    "name": "Volunteers",
    "abbr": "SMU",
    "conference": "southern",
    "division": "college",
    "tier": "competitive",
    "scheme": "spread",
    "colors": {
      "primary": "#e46b22",
      "accent": "#f7f0df",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-bluegrass",
    "city": "Bluegrass State",
    "name": "Stallions",
    "abbr": "BGS",
    "conference": "southern",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "balanced",
    "colors": {
      "primary": "#2460b5",
      "accent": "#f3f0df",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-delta",
    "city": "Delta Tech",
    "name": "Riverdogs",
    "abbr": "DLT",
    "conference": "southern",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "run",
    "colors": {
      "primary": "#7a293d",
      "accent": "#e7dddd",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-buckeye",
    "city": "Central Ohio",
    "name": "Scarlet Knights",
    "abbr": "COH",
    "conference": "heartland",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "spread",
    "colors": {
      "primary": "#ae2537",
      "accent": "#ccd0d2",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-greatlakes",
    "city": "Great Lakes",
    "name": "Wolverines",
    "abbr": "GLU",
    "conference": "heartland",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "balanced",
    "colors": {
      "primary": "#14325c",
      "accent": "#edbf30",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-keystone",
    "city": "Keystone State",
    "name": "Mountain Lions",
    "abbr": "KEY",
    "conference": "heartland",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "balanced",
    "colors": {
      "primary": "#183d72",
      "accent": "#edf1ee",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-badger",
    "city": "Northwoods",
    "name": "Badgers",
    "abbr": "NWD",
    "conference": "heartland",
    "division": "college",
    "tier": "competitive",
    "scheme": "run",
    "colors": {
      "primary": "#b7313e",
      "accent": "#f0eee4",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-prairie",
    "city": "Prairie State",
    "name": "Hawkeyes",
    "abbr": "PRS",
    "conference": "heartland",
    "division": "college",
    "tier": "competitive",
    "scheme": "run",
    "colors": {
      "primary": "#23272f",
      "accent": "#e5b52f",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-spartan",
    "city": "Lake Lansing",
    "name": "Sentinels",
    "abbr": "LLS",
    "conference": "heartland",
    "division": "college",
    "tier": "competitive",
    "scheme": "balanced",
    "colors": {
      "primary": "#215942",
      "accent": "#ebe8d7",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-cornfield",
    "city": "Cornfield",
    "name": "Bison",
    "abbr": "CFU",
    "conference": "heartland",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "run",
    "colors": {
      "primary": "#b92e38",
      "accent": "#f3e4ce",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-hoosier",
    "city": "Crossroads",
    "name": "Crusaders",
    "abbr": "CRU",
    "conference": "heartland",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "spread",
    "colors": {
      "primary": "#922d3b",
      "accent": "#f0e4d1",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-palmetto",
    "city": "Palmetto",
    "name": "Tigers",
    "abbr": "PAL",
    "conference": "atlantic",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "spread",
    "colors": {
      "primary": "#df6b24",
      "accent": "#66378a",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-gulf",
    "city": "Gulf State",
    "name": "Flames",
    "abbr": "GSU",
    "conference": "atlantic",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "balanced",
    "colors": {
      "primary": "#8c293b",
      "accent": "#d9be7b",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-coastal",
    "city": "Coastal Metro",
    "name": "Cyclones",
    "abbr": "CMU",
    "conference": "atlantic",
    "division": "college",
    "tier": "competitive",
    "scheme": "spread",
    "colors": {
      "primary": "#137958",
      "accent": "#ee7828",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-blueridge",
    "city": "Blue Ridge",
    "name": "Tarheels",
    "abbr": "BRU",
    "conference": "atlantic",
    "division": "college",
    "tier": "competitive",
    "scheme": "balanced",
    "colors": {
      "primary": "#67a3d6",
      "accent": "#eeeade",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-virginia",
    "city": "Appalachian Tech",
    "name": "Ospreys",
    "abbr": "APT",
    "conference": "atlantic",
    "division": "college",
    "tier": "competitive",
    "scheme": "run",
    "colors": {
      "primary": "#742c40",
      "accent": "#d87532",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-piedmont",
    "city": "Piedmont State",
    "name": "Wolves",
    "abbr": "PDS",
    "conference": "atlantic",
    "division": "college",
    "tier": "competitive",
    "scheme": "spread",
    "colors": {
      "primary": "#b7333e",
      "accent": "#e6e4df",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-harbor",
    "city": "Harbor College",
    "name": "Golden Eagles",
    "abbr": "HBC",
    "conference": "atlantic",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "balanced",
    "colors": {
      "primary": "#772c3c",
      "accent": "#d2b674",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-orange",
    "city": "Northern Lakes",
    "name": "Foxes",
    "abbr": "NLU",
    "conference": "atlantic",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "spread",
    "colors": {
      "primary": "#d96929",
      "accent": "#243e69",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-pacific",
    "city": "Pacific Coast",
    "name": "Trojans",
    "abbr": "PCU",
    "conference": "western",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "spread",
    "colors": {
      "primary": "#9c2936",
      "accent": "#e8bb34",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-cascadia",
    "city": "Cascadia",
    "name": "Ducks",
    "abbr": "CAS",
    "conference": "western",
    "division": "college",
    "tier": "powerhouse",
    "scheme": "spread",
    "colors": {
      "primary": "#1f7251",
      "accent": "#e6d733",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-sound",
    "city": "Puget Sound",
    "name": "Huskies",
    "abbr": "PSU",
    "conference": "western",
    "division": "college",
    "tier": "competitive",
    "scheme": "balanced",
    "colors": {
      "primary": "#503477",
      "accent": "#c5aa72",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-foothill",
    "city": "Foothill State",
    "name": "Bruins",
    "abbr": "FHS",
    "conference": "western",
    "division": "college",
    "tier": "competitive",
    "scheme": "balanced",
    "colors": {
      "primary": "#3378ab",
      "accent": "#e2bb62",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-desert",
    "city": "Desert State",
    "name": "Firebirds",
    "abbr": "DSU",
    "conference": "western",
    "division": "college",
    "tier": "competitive",
    "scheme": "spread",
    "colors": {
      "primary": "#792939",
      "accent": "#e2b13a",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-mountain",
    "city": "Mountain West",
    "name": "Rams",
    "abbr": "MWU",
    "conference": "western",
    "division": "college",
    "tier": "competitive",
    "scheme": "run",
    "colors": {
      "primary": "#245744",
      "accent": "#d8c589",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-mesa",
    "city": "Mesa Valley",
    "name": "Roadrunners",
    "abbr": "MSV",
    "conference": "western",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "spread",
    "colors": {
      "primary": "#b73543",
      "accent": "#234674",
      "secondary": "#f4ecd7"
    }
  },
  {
    "id": "college-frontier",
    "city": "Frontier Tech",
    "name": "Buffaloes",
    "abbr": "FTU",
    "conference": "western",
    "division": "college",
    "tier": "rebuilding",
    "scheme": "run",
    "colors": {
      "primary": "#34302c",
      "accent": "#c1a467",
      "secondary": "#f4ecd7"
    }
  }
];
