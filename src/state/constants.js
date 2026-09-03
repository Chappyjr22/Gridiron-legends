// Physics, timing, and tuning constants shared across simulation, rendering, and input.
export const XPX=28;
export const Z=XPX/6;
export const SPEED_SCALE=0.55;
export const TACKLE_R=15*Z;
export const CATCH_TOL_BASE=34*Z, CONTEST_NEAR_BASE=14*Z, CONTEST_MID_BASE=30*Z;
export const BALL_SPEED_LOB=22*XPX, BALL_SPEED_BULLET=36*XPX;
export const BASE_X=520;
export const LAT_MIN=25, LAT_MAX=355, LAT_MID=190;
export const RUSH_SPEED=3.0*XPX*SPEED_SCALE;
export const RUSH_SPEED_BLITZ=3.6*XPX*SPEED_SCALE;
export const BASE_RUN_YPS=6.3, LATERAL_YPS=7.0, PURSUE_YPS_BASE=5.5;
export const ROUTE_YPS=5.6, COVER_YPS=5.3;
export const MIN_PULL=15;
export const TACKLE_RESULT_DELAY=800;
export const BREAK_SLOW_MS=280;
export const BREAK_SPEED_MULT=0.35;
export const MISSED_TACKLE_DIVE_MS=180;
export const MISSED_TACKLE_DOWN_MS=2000;
export const MISSED_TACKLE_GET_UP_MS=150;
export const MISSED_TACKLE_RECOVERY_MS=MISSED_TACKLE_DOWN_MS+MISSED_TACKLE_GET_UP_MS;
export const SPRITE_GROUND_Y_OFFSET=12;
export const SIDELINE_STEP_DEPTH=4;
export const BETWEEN_PLAY_RUNOFF=18;
export const PAT_CHANCE=0.97;
export const SPRITE_CELL=64;
export const SPRITE_DRAW=56;
export const SPRITE_ANCHOR_X=32;
export const SPRITE_ANCHOR_Y=55;

export const SKIN_SOURCE=['247,196,145','243,186,134','236,182,135','238,175,118','213,148,95'];
export const SKIN_PALETTES=[
  [[247,196,145],[243,186,134],[236,182,135],[238,175,118],[213,148,95]],
  [[232,174,118],[218,151,94],[207,140,85],[193,123,68],[158,90,46]],
  [[204,137,88],[184,112,67],[171,101,59],[151,82,47],[115,58,33]],
  [[158,98,64],[137,77,52],[124,68,46],[105,55,38],[75,36,26]]
];

export const DL_CONFIG=[
  {key:'dl1',num:'90',startX:188,blockerX:189},
  {key:'dl2',num:'93',startX:160,blockerX:163},
  {key:'dl3',num:'95',startX:214,blockerX:207},
  {key:'dl4',num:'97',startX:241,blockerX:224}
];
export const DL_KEYS=DL_CONFIG.map(c=>c.key);

export const OFF={jersey:'#2f6fb0',helmet:'#0c2c4a',stripe:'#ffffff'};
export const DEF={jersey:'#a32d2d',helmet:'#1a1a1a',stripe:'#c9a227'};

export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function ratingMultiplier(rating,range=0.2){return clamp(1+((rating-75)/25)*range,1-range,1+range);}
// Pure (no game-state dependency) so both the simulation engine and the HUD's
// fourth-down overlay can import it without one depending on the other.
export function fieldGoalChance(distance){
  if(distance<30)return 0.97;
  if(distance<40)return 0.90;
  if(distance<50)return 0.75;
  if(distance<60)return 0.50;
  if(distance<65)return 0.08;
  return 0;
}
