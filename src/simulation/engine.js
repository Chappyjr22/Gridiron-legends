import * as League from '../state/league.js';
import { game, entities, teamState } from '../state/gameState.js';
import {
  XPX, SPEED_SCALE, BASE_X, LAT_MIN, LAT_MAX, DL_KEYS, DL_CONFIG, OFF, DEF,
  CATCH_TOL_BASE, CONTEST_NEAR_BASE, CONTEST_MID_BASE, BALL_SPEED_LOB, BALL_SPEED_BULLET,
  RUSH_SPEED, RUSH_SPEED_BLITZ, BASE_RUN_YPS, LATERAL_YPS, PURSUE_YPS_BASE, ROUTE_YPS, COVER_YPS,
  TACKLE_R, TACKLE_RESULT_DELAY, BREAK_SLOW_MS, BREAK_SPEED_MULT, MISSED_TACKLE_RECOVERY_MS,
  SPRITE_GROUND_Y_OFFSET, SIDELINE_STEP_DEPTH, BETWEEN_PLAY_RUNOFF, PAT_CHANCE, SKIN_PALETTES,
  clamp, ratingMultiplier, fieldGoalChance
} from '../state/constants.js';
import { currentDiff, adjustMomentum } from '../state/difficulty.js';
import { FORMATIONS } from '../data/formations.js';
import { PLAYS, FORMATION_RUN_PATHS } from '../data/plays.js';
import { draw } from '../rendering/draw.js';
import { toCanvas } from '../rendering/players.js';
import { hideAllOverlays, updateHUD, showResult, showFourthDown, formatFieldPosition, ordinalQuarter } from '../ui/hud.js';
import { editState } from '../input/editState.js';
import { interaction } from '../input/interactionState.js';

// Hooks the UI layer fills in at startup (src/main.js), so this module never
// has to import from src/ui/menus.js or src/ui/playbook.js directly — both of
// those import simulation functions (applyFormation, choosePlay, ...), and a
// direct import back here would create a circular module dependency.
export const uiHooks={renderCallsheet:()=>{},syncMatchup:()=>{},returnToMainMenu:()=>{}};

function rosterPlayer(team,slot){return team?.roster?.find(player=>player.slot===slot)||null;}
function rosterNumber(team,slot,fallback){return String(rosterPlayer(team,slot)?.number??fallback);}
function genericRating(team,side){return team?.ratings?.[side==='offense'?'genericOffense':'genericDefense']||68;}
function positionRating(team,slot,side){return rosterPlayer(team,slot)?.rating||genericRating(team,side);}
function ratedEntity(base,team,slot,side){
  const star=rosterPlayer(team,slot);
  return {...base,slot,rating:star?.rating||genericRating(team,side),isStar:!!star};
}
export function scoreLine(){return teamState.userTeam.abbr+' '+game.playerScore+'  |  '+teamState.cpuTeam.abbr+' '+game.cpuScore;}
export function chooseOpponent(){
  const candidates=teamState.franchise.teams.filter(team=>team.id!==game.userTeamId);
  return candidates[Math.floor(Math.random()*candidates.length)]||candidates[0];
}
export function resolveOpponentChoice(){
  if(game.opponentChoice==='random')return chooseOpponent();
  const selected=League.findTeamState(teamState.franchise,game.opponentChoice);
  return selected&&selected.id!==game.userTeamId?selected:chooseOpponent();
}

const SKIN_BY_POSITION={
  qb:2,rb:3,wr1:1,wr3:0,te:2,wr2:3,
  cb1:3,cb2:1,s1:2,lb1:0,dl1:3,dl2:2,dl3:1,dl4:0
};

export function applyFormation(formationId){
  const formation=FORMATIONS[formationId]||FORMATIONS.trips;
  game.formation=formationId in FORMATIONS?formationId:'trips';
  Object.entries(formation.players).forEach(([key,spot])=>{
    const entity=entities.players[key];if(!entity)return;
    entity.x=spot.x;entity.yfield=(game.los+spot.y)*XPX;entity.presnapRole=spot.presnapRole;
    entity.onLine=!!spot.onLine;entity.formationLabel=spot.label;entity.routeIdx=0;entity.facing='left';
  });
  Object.entries(formation.defense.players).forEach(([key,spot])=>{
    const entity=entities.players[key];if(!entity)return;
    entity.x=spot.x;entity.yfield=(game.los+spot.y)*XPX;entity.presnapRole=spot.presnapRole;
    entity.state=key.startsWith('dl')||key==='lb1'?'approach':entity.state;entity.engageStart=0;entity.engageDur=0;entity.facing='right';
  });
  formation.line.forEach((spot,index)=>{
    const entity=entities.decor[index];if(!entity)return;
    entity.x=spot.x;entity.yfield=(game.los+spot.y)*XPX;entity.presnapRole=spot.presnapRole;entity.onLine=true;entity.facing='left';
  });
  formation.defense.decor.forEach((spot,index)=>{
    const entity=entities.decor[index+5];if(!entity)return;
    entity.x=spot.x;entity.yfield=(game.los+spot.y)*XPX;entity.presnapRole=spot.presnapRole||null;entity.facing='right';
  });
  const blockerIndexes=[2,0,3,4];
  DL_KEYS.forEach((key,index)=>{if(entities.players[key])entities.players[key].blockerX=formation.line[blockerIndexes[index]].x;});
  game.centerYfield=game.los*XPX;
  if(entities.ballCarrier===entities.players.qb||!entities.ballCarrier)entities.ballCarrier=entities.players.qb;
}

export function initPlay(){
  const los=game.los;
  game.centerYfield=los*XPX;
  entities.breakCooldown=0;
  entities.players={
    qb:ratedEntity({x:191,yfield:(los-3.4)*XPX,num:rosterNumber(teamState.userTeam,'QB','7'),presnapRole:'qb'},teamState.userTeam,'QB','offense'),
    rb:ratedEntity({x:228,yfield:(los-3.4)*XPX,num:rosterNumber(teamState.userTeam,'RB','22'),routeIdx:0,presnapRole:'rb'},teamState.userTeam,'RB','offense'),
    wr1:ratedEntity({x:39,yfield:(los-1.6)*XPX,num:rosterNumber(teamState.userTeam,'WR1','81'),routeIdx:0,presnapRole:'wr'},teamState.userTeam,'WR1','offense'),
    wr3:ratedEntity({x:84,yfield:(los-0.7)*XPX,num:'15',routeIdx:0,presnapRole:'wr'},teamState.userTeam,null,'offense'),
    te:ratedEntity({x:293,yfield:(los-0.6)*XPX,num:rosterNumber(teamState.userTeam,'TE','87'),routeIdx:0,presnapRole:'wr'},teamState.userTeam,'TE','offense'),
    wr2:ratedEntity({x:333,yfield:(los-1.7)*XPX,num:rosterNumber(teamState.userTeam,'WR2','84'),routeIdx:0,presnapRole:'wr'},teamState.userTeam,'WR2','offense'),
    cb1:ratedEntity({x:48,yfield:(los+2.9)*XPX,num:rosterNumber(teamState.cpuTeam,'DB1','24'),presnapRole:'cb'},teamState.cpuTeam,'DB1','defense'),
    cb2:ratedEntity({x:336,yfield:(los+3.2)*XPX,num:rosterNumber(teamState.cpuTeam,'DB2','21'),presnapRole:'cb'},teamState.cpuTeam,'DB2','defense'),
    s1:ratedEntity({x:156,yfield:(los+7.5)*XPX,num:'1',presnapRole:'s'},teamState.cpuTeam,null,'defense'),
    lb1:ratedEntity({x:192,yfield:(los+3.2)*XPX,num:rosterNumber(teamState.cpuTeam,'LB','50'),state:'approach',engageStart:0,engageDur:0},teamState.cpuTeam,'LB','defense')
  };
  DL_CONFIG[0].num=rosterNumber(teamState.cpuTeam,'DL1','90');
  DL_CONFIG[1].num=rosterNumber(teamState.cpuTeam,'DL2','93');
  const dlSlots=['DL1','DL2',null,null],blockerSlots=[null,'OL1',null,'OL2'];
  DL_CONFIG.forEach((c,index)=>{
    entities.players[c.key]=ratedEntity({x:c.startX,yfield:(los+0.7)*XPX,num:c.num,state:'approach',engageStart:0,engageDur:0,blockerX:c.blockerX,blockRating:positionRating(teamState.userTeam,blockerSlots[index],'offense'),presnapRole:'dl'},teamState.cpuTeam,dlSlots[index],'defense');
  });
  entities.decor=[
    ratedEntity({x:163,yfield:(los-1.3)*XPX,team:OFF,num:rosterNumber(teamState.userTeam,'OL1','60'),presnapRole:'ol'},teamState.userTeam,'OL1','offense'),ratedEntity({x:176,yfield:(los-1)*XPX,team:OFF,num:'66',presnapRole:'ol'},teamState.userTeam,null,'offense'),
    ratedEntity({x:189,yfield:(los-0.7)*XPX,team:OFF,num:'67',presnapRole:'ol'},teamState.userTeam,null,'offense'),ratedEntity({x:207,yfield:(los-0.9)*XPX,team:OFF,num:'68',presnapRole:'ol'},teamState.userTeam,null,'offense'),
    ratedEntity({x:224,yfield:(los-1.1)*XPX,team:OFF,num:rosterNumber(teamState.userTeam,'OL2','79'),presnapRole:'ol'},teamState.userTeam,'OL2','offense'),
    ratedEntity({x:157,yfield:(los+2.4)*XPX,team:DEF,num:'51'},teamState.cpuTeam,null,'defense'),ratedEntity({x:241,yfield:(los+2)*XPX,team:DEF,num:'52'},teamState.cpuTeam,null,'defense'),
    ratedEntity({x:223,yfield:(los+6.8)*XPX,team:DEF,num:'3',presnapRole:'s'},teamState.cpuTeam,null,'defense')
  ];
  applyFormation('trips');
  Object.entries(entities.players).forEach(([key,e])=>{e.skin=SKIN_BY_POSITION[key]??0;});
  entities.decor.forEach((e,i)=>{e.skin=(i+(e.team===DEF?2:0))%SKIN_PALETTES.length;});
  entities.ballCarrier=entities.players.qb;
  entities.ball={inFlight:false};
  entities.runExchange=null;
  entities.pendingTapThrow=null;
  game.phase='callsheet';
  game.message='';
  game.thrown=false;
  game.playCall=null;
  game.formation=null;
  game.playbookView='formations';
  game.runActive=false;
  game.runType='handoff';
  game.activeRunPath=[];
  game.runPathIndex=0;
  game.blitzer=null;
  game.tackle=null;
  game.possession='player';
  game.cameraYard=los;
  hideAllOverlays();
  document.getElementById('callsheet-overlay').classList.add('show');
  uiHooks.renderCallsheet();
  document.getElementById('presnap-hint').style.display='none';
  updateHUD();
}

function moveToward(e,tx,ty,speed,dt){
  const dx=tx-e.x,dy=ty-e.yfield,d=Math.hypot(dx,dy);
  if(d>2){
    if(Math.abs(dy)>0.5)e.facing=dy>0?'left':'right';
    e.x+=dx/d*speed*dt;e.yfield+=dy/d*speed*dt;
  }
}
function advanceRoute(e,waypoints,speed,dt){
  const wp=waypoints[Math.min(e.routeIdx,waypoints.length-1)];
  const ty=(game.los+wp.y)*XPX;
  const dx=wp.x-e.x, dy=ty-e.yfield, d=Math.hypot(dx,dy);
  if(d>4){
    if(Math.abs(dy)>0.5)e.facing=dy>0?'left':'right';
    e.x+=dx/d*speed*dt;
    e.yfield+=dy/d*speed*dt;
  } else if(e.routeIdx<waypoints.length-1){
    e.routeIdx++;
  }
}

export function choosePlay(p){
  const play=PLAYS[p];
  if(!play)return;
  if(game.formation!==play.formation)applyFormation(play.formation);
  game.playCall=p;
  game.phase='presnap';
  document.getElementById('callsheet-overlay').classList.remove('show');
  Object.values(entities.players).forEach(player=>{player.routeIdx=0;});
  const hint=document.getElementById('presnap-hint');
  hint.innerHTML=(play.type==='run'?'Tap the field to run':'Drag from QB to pass')+' <span>|</span> Tap RB to '+play.runOption;
  hint.style.display='block';
}

export function resetDownsAt(los){
  game.los=clamp(los,1,99);
  game.down=1;
  game.firstDownYard=Math.min(100,game.los+10);
  game.distance=game.firstDownYard-game.los;
}
export function startPlayerDrive(los=20){
  game.possession='player';
  resetDownsAt(los);
  initPlay();
}
function kickoffSpot(){
  if(Math.random()<0.58)return 25;
  return Math.round(18+Math.random()*16);
}
function consumeClock(seconds){
  if(!game.overtime)game.clock=Math.max(0,game.clock-seconds);
}

export function startNewGame(){
  game.practice=false;
  teamState.userTeam=League.findTeamState(teamState.franchise,game.userTeamId)||teamState.franchise.teams[0];
  teamState.cpuTeam=resolveOpponentChoice();
  game.cpuTeamId=teamState.cpuTeam.id;
  uiHooks.syncMatchup();
  game.playerScore=0;
  game.cpuScore=0;
  game.quarter=1;
  game.clock=game.quarterMinutes*60;
  game.overtime=false;
  game.otRound=0;
  game.momentum=0;
  game.paused=false;
  resetDownsAt(20);
  initPlay();
  game.firstHalfReceiver=Math.random()<0.5?'player':'cpu';
  game.secondHalfReceiver=game.firstHalfReceiver==='player'?'cpu':'player';
  const openingSpot=kickoffSpot();
  if(game.firstHalfReceiver==='player'){
    showResult('OPENING KICKOFF\nThe '+teamState.userTeam.name+' will receive.\nKickoff return to '+formatFieldPosition(openingSpot)+'.',()=>startPlayerDrive(openingSpot),'Receive Kickoff');
  } else {
    showResult('OPENING KICKOFF\nThe '+teamState.cpuTeam.name+' will receive.\nThey begin at their own '+openingSpot+'.',()=>startOpponentPossession(openingSpot,'Opening kickoff'),'Kick Off');
  }
}
export function startPractice(){
  game.practice=true;
  teamState.userTeam=League.findTeamState(teamState.franchise,game.userTeamId)||teamState.franchise.teams[0];
  teamState.cpuTeam=resolveOpponentChoice();
  game.cpuTeamId=teamState.cpuTeam.id;
  uiHooks.syncMatchup();
  game.playerScore=0;
  game.cpuScore=0;
  game.quarter=1;
  game.clock=0;
  game.overtime=false;
  game.otRound=0;
  game.momentum=0;
  game.paused=false;
  startPlayerDrive(20);
}
export function finishGame(){
  const result=game.playerScore===game.cpuScore?'Tie game':game.playerScore>game.cpuScore?teamState.userTeam.name+' win!':teamState.cpuTeam.name+' win.';
  showResult('FINAL\n'+scoreLine()+'\n'+result,uiHooks.returnToMainMenu,'Main menu');
  game.phase='gameover';
}
function startOvertime(){
  game.overtime=true;
  game.quarter=5;
  game.clock=0;
  game.otRound=1;
  showResult('End of regulation. The game is tied.\nOvertime gives each team one possession.',()=>startPlayerDrive(20),'Start overtime');
}
function advanceExpiredPeriod(resumeAction){
  if(game.overtime||game.clock>0){resumeAction();return;}
  const ended=game.quarter;
  if(ended<4){
    game.quarter+=1;
    game.clock=game.quarterMinutes*60;
    if(ended===2){
      const secondHalfSpot=kickoffSpot();
      const playerReceives=game.secondHalfReceiver==='player';
      const receiverLine=playerReceives?'The '+teamState.userTeam.name+' receive the second-half kickoff.':'The '+teamState.cpuTeam.name+' receive the second-half kickoff.';
      const kickoffAction=playerReceives?()=>startPlayerDrive(secondHalfSpot):()=>startOpponentPossession(secondHalfSpot,'Second-half kickoff');
      showResult('HALFTIME\n'+scoreLine()+'\n'+receiverLine,kickoffAction,'Start 3rd Quarter');
    } else {
      showResult('End of the '+ordinalQuarter(ended)+' quarter.',resumeAction,'Start '+ordinalQuarter(game.quarter)+' quarter');
    }
    return;
  }
  if(game.playerScore===game.cpuScore)startOvertime();
  else finishGame();
}

function continuePlayerPossession(){
  if(game.down===4)showFourthDown();
  else initPlay();
}
function afterPlayerPlay(){advanceExpiredPeriod(continuePlayerPossession);}
function completePlayerPossession(message,cpuStart,reason){
  showResult(message,()=>advanceExpiredPeriod(()=>startOpponentPossession(cpuStart,reason)));
}
function simulateExtraPoint(team){
  const good=Math.random()<PAT_CHANCE;
  if(good){
    if(team==='player')game.playerScore+=1;
    else game.cpuScore+=1;
  }
  return good;
}
function handlePlayerTouchdown(){
  game.playerScore+=6;
  const patGood=simulateExtraPoint('player');
  adjustMomentum(0.35);
  completePlayerPossession('TOUCHDOWN!\nExtra point '+(patGood?'is good.':'missed.')+'\n'+scoreLine(),kickoffSpot(),'Kickoff');
}
export function endPlay(yardGained,label,outOfBounds=false){
  const newLOS=clamp(game.los+yardGained,0,100);
  if(game.practice){
    if(newLOS>=100){
      showResult('TOUCHDOWN!\nPractice rep complete.',()=>startPlayerDrive(20),'Next Rep');
      return;
    }
    if(label==='INTERCEPTED'){
      showResult('Intercepted.\nReset and try the read again.',()=>startPlayerDrive(20),'Next Rep');
      return;
    }
    if(label==='INCOMPLETE'){
      showResult('Incomplete pass.',initPlay,'Next Rep');
      return;
    }
    game.los=clamp(newLOS,1,99);
    resetDownsAt(game.los);
    showResult(label+' for '+yardGained+' yards'+(outOfBounds?', out of bounds.':'.'),initPlay,'Next Rep');
    return;
  }
  if(newLOS>=100){handlePlayerTouchdown();return;}
  if(newLOS<=0&&yardGained<0&&label!=='INCOMPLETE'&&label!=='INTERCEPTED'){
    game.cpuScore+=2;
    adjustMomentum(-0.2);
    completePlayerPossession('Safety. CPU scores 2 points.',35,'Free kick after safety');
    return;
  }
  if(label==='INTERCEPTED'){
    const interceptionSpot=clamp(Math.round(entities.ball.toY/XPX),1,99);
    adjustMomentum(-0.3);
    completePlayerPossession('Intercepted. Turnover.',clamp(100-interceptionSpot,1,99),'Interception');
    return;
  }
  if(label==='INCOMPLETE'){
    game.down+=1;
    game.message='Incomplete pass.';
    adjustMomentum(-0.04);
  } else {
    game.los=newLOS;
    if(!outOfBounds)consumeClock(BETWEEN_PLAY_RUNOFF);
    if(newLOS>=game.firstDownYard){
      resetDownsAt(newLOS);
      game.message=label+' for '+yardGained+' yards'+(outOfBounds?', out of bounds. ':'. ')+'First down!';
      adjustMomentum(0.07);
    } else {
      game.down+=1;
      game.distance=game.firstDownYard-newLOS;
      game.message=label+' for '+yardGained+' yards'+(outOfBounds?', out of bounds.':'.');
    }
    if(yardGained<0)adjustMomentum(-0.05);
  }
  if(game.down>4){
    adjustMomentum(-0.22);
    completePlayerPossession(game.message+' Turnover on downs.',clamp(100-game.los,1,99),'Turnover on downs');
    return;
  }
  showResult(game.message,afterPlayerPlay);
}

export function attemptFieldGoal(){
  const distance=Math.round(117-game.los);
  const good=Math.random()<fieldGoalChance(distance);
  consumeClock(5);
  if(good){
    game.playerScore+=3;
    adjustMomentum(0.12);
    completePlayerPossession(distance+'-yard field goal is GOOD!\n'+scoreLine(),kickoffSpot(),'Kickoff');
  } else {
    adjustMomentum(-0.1);
    completePlayerPossession(distance+'-yard field goal is no good.',clamp(100-game.los,1,99),'Missed field goal');
  }
}
export function simulatePunt(){
  consumeClock(8);
  const net=Math.round(38+Math.random()*12);
  const landing=game.los+net;
  const touchback=landing>=100;
  const cpuStart=touchback?20:clamp(100-landing,1,99);
  completePlayerPossession('Punt travels '+net+' yards.'+(touchback?' Touchback.':''),cpuStart,'Punt');
}
function cpuFieldLabel(field){
  const spot=Math.round(clamp(field,0,100));
  if(spot===50)return 'the 50';
  return spot<50?'its own '+spot:'your '+(100-spot);
}
function cpuStrength(){
  let difficultyStrength=1;
  if(game.difficulty==='easy')difficultyStrength=0;
  else if(game.difficulty==='hard')difficultyStrength=2;
  else if(game.difficulty==='gridiron')difficultyStrength=game.momentum>0.25?2:game.momentum<-0.25?0:1;
  const matchup=((teamState.cpuTeam?.ratings?.offense||72)-(teamState.userTeam?.ratings?.defense||72))/14;
  return clamp(difficultyStrength+matchup,0,2.5);
}
function simulateOpponentDrive(startField,reason){
  const strength=cpuStrength();
  let driveSeconds=Math.round(38+Math.random()*58+strength*5);
  if(!game.overtime&&game.quarter===4&&game.cpuScore>game.playerScore)driveSeconds+=20;
  const consumedSeconds=game.overtime?driveSeconds:Math.min(driveSeconds,Math.ceil(game.clock));
  consumeClock(consumedSeconds);
  const gain=Math.round(14+Math.random()*36+strength*7+(startField-20)*0.12);
  const endField=clamp(startField+gain,1,100);
  const lines=['OPPONENT DRIVE',reason+': opponent starts at '+cpuFieldLabel(startField)+'.'];
  if(gain>0)lines.push('The drive gains '+gain+' yards.');
  const turnoverChance=clamp(0.18-strength*0.045,0.055,0.2);
  const tdChance=clamp(0.10+strength*0.07+Math.max(0,endField-45)*0.006,0.10,0.62);
  const roll=Math.random();
  let playerStart=20;
  let outcome='';
  if(roll<turnoverChance){
    playerStart=clamp(100-endField,5,95);
    outcome='Turnover! You take over at '+formatFieldPosition(playerStart)+'.';
    adjustMomentum(-0.08);
  } else if(endField>=100||roll<turnoverChance+tdChance){
    game.cpuScore+=6;
    const patGood=simulateExtraPoint('cpu');
    outcome='Opponent touchdown. Extra point '+(patGood?'is good.':'missed.');
    playerStart=kickoffSpot();
    adjustMomentum(0.18);
  } else if(endField>=55){
    const distance=Math.round(117-endField);
    const good=Math.random()<fieldGoalChance(distance);
    if(good){
      game.cpuScore+=3;
      outcome='Opponent '+distance+'-yard field goal is good.';
      playerStart=kickoffSpot();
      adjustMomentum(0.08);
    } else {
      outcome='Opponent '+distance+'-yard field goal is no good.';
      playerStart=clamp(100-endField,5,95);
      adjustMomentum(-0.05);
    }
  } else {
    const puntNet=Math.round(38+Math.random()*11);
    const landing=endField+puntNet;
    const touchback=landing>=100;
    playerStart=touchback?20:clamp(100-landing,5,95);
    outcome='Opponent punts '+puntNet+' yards.'+(touchback?' Touchback.':' You start at '+formatFieldPosition(playerStart)+'.');
  }
  lines.push(outcome);
  lines.push('Drive time: '+Math.floor(consumedSeconds/60)+':'+String(consumedSeconds%60).padStart(2,'0'));
  lines.push(scoreLine());
  return {message:lines.join('\n'),playerStart};
}
function finishOpponentPossession(playerStart){
  if(game.overtime){
    if(game.playerScore!==game.cpuScore){finishGame();return;}
    game.otRound+=1;
    showResult('Overtime remains tied.\nStarting possession round '+game.otRound+'.',()=>startPlayerDrive(20),'Next possession');
    return;
  }
  advanceExpiredPeriod(()=>startPlayerDrive(playerStart));
}
export function startOpponentPossession(startField,reason){
  game.possession='cpu';
  game.phase='simulation';
  const result=simulateOpponentDrive(startField,reason);
  showResult(result.message,()=>finishOpponentPossession(result.playerStart));
}
export function onSnap(){
  if(game.phase!=='presnap')return false;
  game.phase='live';game.snapTime=performance.now();
  document.getElementById('presnap-hint').style.display='none';
  const play=PLAYS[game.playCall];
  game.blitzBlockedUntil=game.snapTime+Math.min(850,(play?.blocks?.length||0)*150);
  if(Math.random()<currentDiff().blitzChance){
    game.blitzer=Math.random()<0.5?'lb1':'s1';
  }
  return true;
}
export function startRunOption(){
  if(!onSnap())return;
  const now=performance.now();
  const play=PLAYS[game.playCall];
  game.thrown=true;
  game.runActive=true;
  game.runType=play.runOption||'handoff';
  game.runPathIndex=0;
  game.activeRunPath=play.runPath||FORMATION_RUN_PATHS[play.formation]||[];
  entities.ballCarrier=null;
  entities.runExchange={type:game.runType,startTime:now,duration:(game.runType==='pitch'?240:110)+(play.runDelay||0)};
}
export function releaseThrow(t){
  if(game.thrown||game.phase!=='live')return;
  game.thrown=true;
  const qb=entities.players.qb;
  const throwStart=performance.now();
  qb.action='throw';qb.actionStart=throwStart;
  const camPx=game.cameraYard*XPX;
  const accuracyError=Math.max(0,(94-(qb.rating||75))*0.32);
  const lateralError=(Math.random()+Math.random()-1)*accuracyError;
  const depthError=(Math.random()+Math.random()-1)*accuracyError*1.25;
  const fLat=clamp(t.y+lateralError,LAT_MIN,LAT_MAX);
  const fDown=camPx+(BASE_X-t.x)+depthError;
  const dist=Math.hypot(fLat-qb.x,fDown-qb.yfield);
  const armMult=ratingMultiplier(qb.rating,0.16);
  const speed=(game.throwType==='bullet'?BALL_SPEED_BULLET:BALL_SPEED_LOB)*armMult;
  const arcHeight = Math.min(60,dist*0.12) * (game.throwType==='bullet' ? 0.3 : 1);
  const releaseDelay=clamp(125-(qb.rating-60)*2,55,125);
  entities.ball={inFlight:true,fromX:qb.x,fromY:qb.yfield,toX:fLat,toY:fDown,startTime:throwStart+releaseDelay,duration:Math.max(180,dist/speed*1000),arcHeight};
}
function resolveCatchAtTarget(){
  const diff=currentDiff();
  const CONTEST_NEAR=CONTEST_NEAR_BASE*diff.catchRadiusMult;
  const CONTEST_MID=CONTEST_MID_BASE*diff.catchRadiusMult;
  const routeKeys=Object.keys(PLAYS[game.playCall].routes);
  let best=null,bestKey=null,bestD=Infinity,bestTol=CATCH_TOL_BASE*diff.catchRadiusMult,bestScore=Infinity;
  routeKeys.forEach(k=>{
    const r=entities.players[k];
    const d=Math.hypot(r.x-entities.ball.toX,r.yfield-entities.ball.toY);
    const tolerance=CATCH_TOL_BASE*diff.catchRadiusMult*ratingMultiplier(r.rating,0.18);
    const score=d/tolerance;
    if(score<bestScore){bestScore=score;bestD=d;best=r;bestKey=k;bestTol=tolerance;}
  });
  if(!best||bestD>bestTol){endPlay(0,'INCOMPLETE');return;}
  const defKeys=PLAYS[game.playCall].defenders[bestKey]||[];
  const defs=defKeys.map(k=>entities.players[k]);
  let nearestDefender=null,dist=Infinity;
  defs.forEach(defender=>{
    const distance=Math.hypot(best.x-defender.x,best.yfield-defender.yfield);
    if(distance<dist){dist=distance;nearestDefender=defender;}
  });
  const accuracy=1-clamp(bestD/bestTol,0,1);
  const handsBonus=((best.rating||75)-75)*0.004;
  const coverageStrength=ratingMultiplier(nearestDefender?.rating||75,0.22);
  let pComplete=0.6+accuracy*0.37+handsBonus;
  if(dist<CONTEST_NEAR)pComplete-=0.42*coverageStrength;
  else if(dist<CONTEST_MID)pComplete-=0.13*coverageStrength;
  pComplete=clamp(pComplete,0.04,0.97);
  let pInt=0;
  if(dist<CONTEST_NEAR)pInt=0.18*(1-accuracy)*ratingMultiplier(nearestDefender?.rating||75,0.3);
  const roll=Math.random();
  if(roll<pInt){endPlay(0,'INTERCEPTED');return;}
  if(roll<pInt+(1-pComplete)){endPlay(0,'INCOMPLETE');return;}
  entities.ballCarrier=best;
  best.action='catch';best.actionStart=performance.now();
  game.carrierSince=performance.now();
}
function resolveTackle(tackler){
  const yardGained=Math.round(entities.ballCarrier.yfield/XPX-game.los);
  let label;
  if(entities.ballCarrier===entities.players.qb)label=yardGained<0?'Sacked':'Scramble';
  else if(game.runActive)label=game.runType==='pitch'?'Pitch':'Run';
  else label='Catch';
  if(!tackler){endPlay(yardGained,label);return;}
  const now=performance.now();
  game.phase='tackle';
  game.tackle={startTime:now,carrier:entities.ballCarrier,tackler,yardGained,label};
  entities.ballCarrier.action='tackled';entities.ballCarrier.actionStart=now;
  if(Math.abs(entities.ballCarrier.yfield-tackler.yfield)>0.5)tackler.facing=entities.ballCarrier.yfield>tackler.yfield?'left':'right';
  tackler.action='tackle';tackler.actionStart=now;
  interaction.steering=false;interaction.steerAnchor=null;interaction.steerCurrent=null;
}
function resolveOutOfBounds(){
  const yardGained=Math.round(entities.ballCarrier.yfield/XPX-game.los);
  let label;
  if(entities.ballCarrier===entities.players.qb)label=yardGained<0?'Sacked':'Scramble';
  else if(game.runActive)label=game.runType==='pitch'?'Pitch':'Run';
  else label='Catch';
  interaction.steering=false;interaction.steerAnchor=null;interaction.steerCurrent=null;
  endPlay(yardGained,label,true);
}
function finishTackle(){
  const tackle=game.tackle;
  if(!tackle)return;
  tackle.carrier.action='';tackle.tackler.action='';
  game.tackle=null;
  endPlay(tackle.yardGained,tackle.label);
}

let lastT=null;
let loopStarted=false;
export function ensureLoopStarted(){
  if(!loopStarted){loopStarted=true;requestAnimationFrame(tick);}
}
function tick(now){
  if(lastT===null)lastT=now;
  const dt=Math.min((now-lastT)/1000,0.05);
  lastT=now;
  if(editState.editMode){draw();requestAnimationFrame(tick);return;}
  if(!game.paused&&!game.overtime&&(game.phase==='live'||game.phase==='tackle')){
    game.clock=Math.max(0,game.clock-dt);
    updateHUD();
  }
  if(game.phase==='live'&&!game.paused){
    const diff=currentDiff();
    const t=(now-game.snapTime)/1000;
    const cb1=entities.players.cb1,cb2=entities.players.cb2,qb=entities.players.qb,s1=entities.players.s1,lb1=entities.players.lb1;
    const playDef=PLAYS[game.playCall];
    const screenMult=(playDef?.type==='screen'&&t<1.3)?0.25:1;
    entities.breakCooldown=Math.max(0,entities.breakCooldown-dt);

    if(entities.runExchange&&now-entities.runExchange.startTime>=entities.runExchange.duration){
      entities.runExchange=null;
      entities.ballCarrier=entities.players.rb;
      entities.players.rb.action='carry';
      entities.players.rb.actionStart=now;
      game.carrierSince=now;
    }
    if(entities.pendingTapThrow&&now>=entities.pendingTapThrow.releaseAt){
      const pending=entities.pendingTapThrow;
      entities.pendingTapThrow=null;
      const target=pending.playerKey?toCanvas(entities.players[pending.playerKey]):pending.target;
      releaseThrow({x:target.cx??target.x,y:target.cy??target.y});
    }

    DL_KEYS.forEach(key=>{
      const dl=entities.players[key];
      if(dl.state==='approach'){
        if(t>diff.approachDelay){
          moveToward(dl,dl.blockerX,game.centerYfield,RUSH_SPEED*screenMult*ratingMultiplier(dl.rating,0.18),dt);
          if(dl.yfield<=game.centerYfield+2){
            dl.state='engaged';
            dl.engageStart=now;
            const matchup=(dl.blockRating||68)-(dl.rating||68);
            const blockWinChance=clamp(diff.blockWinChance+matchup*0.006,0.02,0.82);
            const baseDuration=diff.engageMin+Math.random()*(diff.engageMax-diff.engageMin);
            const extraProtection=1+Math.min(0.36,(playDef?.blocks?.length||0)*0.09);
            dl.engageDur=Math.random()<blockWinChance?20000:baseDuration*clamp(1+matchup/55,0.55,1.55)*extraProtection;
          }
        }
      } else if(dl.state==='engaged'){
        if(now-dl.engageStart>=dl.engageDur){dl.state='released';}
      }
    });

    if(playDef&&playDef.type!=='run'&&entities.ballCarrier===qb){
      Object.keys(playDef.routes).forEach(key=>{
        if(t*1000>=(playDef.routeDelays?.[key]||0))advanceRoute(entities.players[key],playDef.routes[key],ROUTE_YPS*XPX*SPEED_SCALE*diff.offenseSpeedMult*ratingMultiplier(entities.players[key].rating,0.18),dt);
      });
      const coverAssign={};
      Object.entries(playDef.defenders||{}).forEach(([recvKey,defKeys])=>{
        defKeys.forEach(dk=>{coverAssign[dk]=recvKey;});
      });
      ['cb1','cb2','s1','lb1'].forEach(dk=>{
        if(coverAssign[dk]&&dk!==game.blitzer){
          const recv=entities.players[coverAssign[dk]];
          const sMult=(playDef.type==='screen'&&dk==='cb1')?screenMult:1;
          moveToward(entities.players[dk],recv.x,recv.yfield-4,COVER_YPS*XPX*SPEED_SCALE*sMult*ratingMultiplier(entities.players[dk].rating,0.18),dt);
        }
      });
      if(game.blitzer&&t>0.25&&now>=(game.blitzBlockedUntil||0)){
        moveToward(entities.players[game.blitzer],qb.x,qb.yfield,RUSH_SPEED_BLITZ*screenMult*ratingMultiplier(entities.players[game.blitzer].rating,0.18),dt);
      }
    }

    if(entities.ball.inFlight&&now>=entities.ball.startTime){
      const p=Math.min(1,(now-entities.ball.startTime)/entities.ball.duration);
      if(p>=1){entities.ball.inFlight=false;resolveCatchAtTarget();}
    }

    if(entities.ballCarrier){
      const reacted=(now-game.carrierSince)/1000>diff.reactionDelay;
      let pursuers=[];
      const releasedDL=DL_KEYS.map(k=>entities.players[k]).filter(dl=>dl.state==='released');
      if(entities.ballCarrier===qb){
        pursuers=pursuers.concat(releasedDL);
        if(game.blitzer)pursuers.push(entities.players[game.blitzer]);
      } else {
        if(game.runActive){
          if(lb1.state==='approach'){
            if(reacted&&lb1.yfield<=game.centerYfield+3*XPX){
              lb1.state='engaged';
              lb1.engageStart=now;
              lb1.engageDur=(diff.engageMin+Math.random()*(diff.engageMax-diff.engageMin))*0.5;
            }
          } else if(lb1.state==='engaged'){
            if(now-lb1.engageStart>=lb1.engageDur){lb1.state='released';}
          }
          if(reacted){
            pursuers=[cb1,cb2,s1];
            if(lb1.state!=='engaged')pursuers.push(lb1);
          }
          pursuers=pursuers.concat(releasedDL);
        } else if(reacted){
          const extraDefenders=entities.decor.filter(d=>d.team===DEF);
          extraDefenders.forEach(d=>{d.isPursuing=true;});
          pursuers=[cb1,cb2,s1,lb1,...DL_KEYS.map(k=>entities.players[k]),...extraDefenders];
        }
        let jx=0,jy=0;
        if(interaction.steering&&interaction.steerAnchor&&interaction.steerCurrent){
          jx=clamp((interaction.steerCurrent.x-interaction.steerAnchor.x)/70,-1,1);
          jy=clamp((interaction.steerCurrent.y-interaction.steerAnchor.y)/70,-1,1);
        }
        const fwdMult = jx>0 ? (1-jx*0.85) : (1-jx*0.15);
        const breakSlowMult=now<(entities.ballCarrier.breakSlowUntil||0)?BREAK_SPEED_MULT:1;
        const carrierSpeedMult=ratingMultiplier(entities.ballCarrier.rating,0.18);
        if(game.runActive&&entities.ballCarrier===entities.players.rb&&game.activeRunPath?.length){
          const runPath=game.activeRunPath;
          while(game.runPathIndex<runPath.length-1&&entities.ballCarrier.yfield/XPX-game.los>=runPath[game.runPathIndex].y)game.runPathIndex++;
          const lane=runPath[Math.min(game.runPathIndex,runPath.length-1)];
          const laneAssist=interaction.steering?0.75:2.2;
          entities.ballCarrier.x+=clamp(lane.x-entities.ballCarrier.x,-laneAssist,laneAssist)*dt*8;
        }
        const previousX=entities.ballCarrier.x;
        entities.ballCarrier.facing='left';
        entities.ballCarrier.yfield += BASE_RUN_YPS*fwdMult*XPX*SPEED_SCALE*diff.offenseSpeedMult*carrierSpeedMult*breakSlowMult*dt;
        const nextX=previousX+jy*LATERAL_YPS*XPX*SPEED_SCALE*diff.offenseSpeedMult*carrierSpeedMult*breakSlowMult*dt;
        const sidelineMin=LAT_MIN-SPRITE_GROUND_Y_OFFSET-SIDELINE_STEP_DEPTH;
        const sidelineMax=LAT_MAX-SPRITE_GROUND_Y_OFFSET+SIDELINE_STEP_DEPTH;
        entities.ballCarrier.x=clamp(nextX,sidelineMin,sidelineMax);
        if(nextX<=sidelineMin||nextX>=sidelineMax){
          if(entities.ballCarrier.yfield/XPX<100)resolveOutOfBounds();
        }
      }

      pursuers=pursuers.filter(def=>{
        if(def.action==='missedTackle'&&now>=(def.missedUntil||0)){
          def.action='';
          def.missedUntil=0;
        }
        return !(def.missedUntil>now);
      });

      if(entities.ballCarrier!==qb && entities.ballCarrier.yfield/XPX>=100){
        resolveTackle();
      }

      if(game.phase==='live'){
        const pursueSpeed=PURSUE_YPS_BASE*diff.pursueMult*XPX*SPEED_SCALE;
        pursuers.forEach(def=>moveToward(def,entities.ballCarrier.x,entities.ballCarrier.yfield,pursueSpeed*ratingMultiplier(def.rating,0.2),dt));
        if(!entities.ball.inFlight&&entities.breakCooldown<=0){
          let nearest=Infinity,nearestDefender=null;
          pursuers.forEach(def=>{
            const distance=Math.hypot(def.x-entities.ballCarrier.x,def.yfield-entities.ballCarrier.yfield);
            if(distance<nearest){nearest=distance;nearestDefender=def;}
          });
          const tackleReach=TACKLE_R*ratingMultiplier(nearestDefender?.rating||75,0.1);
          if(nearest<tackleReach){
            const matchup=((entities.ballCarrier.rating||75)-(nearestDefender?.rating||75))*0.004;
            const breakChance=clamp(diff.breakTackle+(game.runActive&&entities.ballCarrier===entities.players.rb?diff.runBreakBonus:0)+matchup,0.02,0.72);
            if(Math.random()<breakChance){
              entities.breakCooldown=0.45;
              entities.ballCarrier.breakSlowUntil=now+BREAK_SLOW_MS;
              if(Math.abs(entities.ballCarrier.yfield-nearestDefender.yfield)>0.5){
                nearestDefender.facing=entities.ballCarrier.yfield>nearestDefender.yfield?'left':'right';
              }
              nearestDefender.action='missedTackle';
              nearestDefender.actionStart=now;
              nearestDefender.missedUntil=now+MISSED_TACKLE_RECOVERY_MS;
            } else {
              resolveTackle(nearestDefender);
            }
          }
        }
      }
    }
    if(game.phase==='live'){
      game.cameraYard+= ((entities.ballCarrier?entities.ballCarrier.yfield/XPX:game.los)-game.cameraYard)*Math.min(1,dt*4);
    }
  }
  if(game.phase==='tackle'&&!game.paused&&game.tackle&&now-game.tackle.startTime>=TACKLE_RESULT_DELAY)finishTackle();
  draw();
  requestAnimationFrame(tick);
}
