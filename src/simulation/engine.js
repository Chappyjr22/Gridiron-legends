import {flightPosition,looseBall,advanceLooseBall,fumbleChance} from './ballMotion.js';
import {captureHighlight,resetHighlight,highlights} from './highlights.js';
import {feedback} from '../state/feedback.js';
import {advanceSkillBlocks} from './blocking.js';
import {playingRoster,uniqueLineupNumbers} from '../career/roster.js';
import {speedMultiplier,strengthEdge,attributeRating} from '../career/playerAttributes.js';
import {controlPreferences} from '../state/preferences.js';
import {advanceRoute,passingRead,throwProfile} from './passing.js';
import {stickVector,jukeStep,syncRunnerControls} from '../input/runnerControls.js';
import {catchTolerance,catchOutcome} from './receiving.js';
import {separation, touching, pursuitTarget, startDive, advanceDive} from './contact.js';
import { emptyMatch, recordPlay } from '../career/stats.js';
import { simulationNow, advanceSimulation, resetFrameClock } from '../state/clock.js';
import * as League from '../state/league.js';
import { game, entities, teamState } from '../state/gameState.js';
import {
  XPX, SPEED_SCALE, BASE_X, LAT_MIN, LAT_MAX, DL_KEYS, DL_CONFIG, OFF, DEF,
  BALL_SPEED_LOB, BALL_SPEED_BULLET,
  RUSH_SPEED, RUSH_SPEED_BLITZ, BASE_RUN_YPS, LATERAL_YPS, PURSUE_YPS_BASE, ROUTE_YPS, COVER_YPS,
  TACKLE_RESULT_DELAY, BREAK_SLOW_MS, BREAK_SPEED_MULT, MISSED_TACKLE_RECOVERY_MS,
  SPRITE_GROUND_Y_OFFSET, SIDELINE_STEP_DEPTH, BETWEEN_PLAY_RUNOFF, PAT_CHANCE, SKIN_PALETTES,
  clamp, fieldGoalChance
} from '../state/constants.js';
import { currentDiff, adjustMomentum } from '../state/difficulty.js';
import { FORMATIONS } from '../data/formations.js';
import { PLAYS, FORMATION_RUN_PATHS } from '../data/plays.js';
import { draw } from '../rendering/draw.js';
import { toCanvas } from '../rendering/players.js';
import { continueResult, hideAllOverlays, updateHUD, showResult, showFourthDown, formatFieldPosition, ordinalQuarter } from '../ui/hud.js';
import { editState } from '../input/editState.js';
import { interaction } from '../input/interactionState.js';

// Hooks the UI layer fills in at startup (src/main.js), so this module never
// has to import from src/ui/menus.js or src/ui/playbook.js directly — both of
// those import simulation functions (applyFormation, choosePlay, ...), and a
// direct import back here would create a circular module dependency.
export const uiHooks={renderCallsheet:()=>{},syncMatchup:()=>{},returnToMainMenu:()=>{},checkpoint:()=>{},finishCareer:()=>{}};
export const matchState={stats:emptyMatch()};
let restoring=false;
const checkpointFields=['playerScore','cpuScore','quarter','quarterMinutes','clock','overtime','otRound','down','distance','los','firstDownYard','difficulty','momentum','possession','firstHalfReceiver','secondHalfReceiver','userTeamId','cpuTeamId','userIsHome','career','practice','passMode','throwType','showRoutes'];
export function getCheckpoint(resume){
 return JSON.parse(JSON.stringify({game:Object.fromEntries(checkpointFields.map(k=>[k,game[k]])),stats:matchState.stats,resume}));
}
function checkpoint(resume){if(game.career&&!restoring)uiHooks.checkpoint(getCheckpoint(resume));}
export function restoreCheckpoint(saved){
 restoring=true;Object.assign(game,saved.game);game.paused=false;initPlay();Object.assign(game,saved.game,controlPreferences());matchState.stats=saved.stats;restoring=false;
 const r=saved.resume;
 if(r.type==='offense'){game.phase='callsheet';updateHUD();return;}
 let action;
 if(r.type==='afterPlay')action=afterPlayerPlay;
 else if(r.type==='turnover')action=()=>advanceExpiredPeriod(()=>startOpponentPossession(r.cpuStart,r.reason));
 else if(r.type==='cpuResult')action=()=>finishOpponentPossession(r.playerStart);
 else if(r.type==='kickoff')action=r.receiver==='player'?()=>startPlayerDrive(r.spot):()=>startOpponentPossession(r.spot,'Opening kickoff');
 if(action)showResult(r.message,action,r.buttonLabel||'Continue');
}


function rosterPlayer(team,slot){return (team?playingRoster(team):[]).find(player=>player.slot===slot)||null;}
function rosterNumber(team,slot,fallback){return String(rosterPlayer(team,slot)?.number??fallback);}
function genericRating(team,side){return team?.ratings?.[side==='offense'?'genericOffense':'genericDefense']||68;}
function positionRating(team,slot,side){return rosterPlayer(team,slot)?.rating||genericRating(team,side);}
function ratedEntity(base,team,slot,side){
  const star=rosterPlayer(team,slot);
  return {...base,slot,playerId:star?.id||`${team.id}-generic-${base.num}`,attributes:star?.attributes,skin:star?.skin,rating:star?.rating||genericRating(team,side),isStar:!!star&&!star.generic};
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
  resetHighlight();game.autoContinueAt=0;game.drivePresentation=null;game.kick=null;game.fumble=null;game.playFacts={threw:false,receiverId:null,targetId:null};game.playResolved=false;
  const los=game.los;
  game.centerYfield=los*XPX;
  entities.breakCooldown=0;
  entities.players={
    qb:ratedEntity({x:191,yfield:(los-3.4)*XPX,num:rosterNumber(teamState.userTeam,'QB','7'),presnapRole:'qb'},teamState.userTeam,'QB','offense'),
    rb:ratedEntity({x:228,yfield:(los-3.4)*XPX,num:rosterNumber(teamState.userTeam,'RB','22'),routeIdx:0,presnapRole:'rb'},teamState.userTeam,'RB','offense'),
    wr1:ratedEntity({x:39,yfield:(los-1.6)*XPX,num:rosterNumber(teamState.userTeam,'WR1','81'),routeIdx:0,presnapRole:'wr'},teamState.userTeam,'WR1','offense'),
    wr3:ratedEntity({x:84,yfield:(los-0.7)*XPX,num:rosterNumber(teamState.userTeam,'WR3','15'),routeIdx:0,presnapRole:'wr'},teamState.userTeam,'WR3','offense'),
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
  uniqueLineupNumbers([...['qb','rb','wr1','wr2','wr3','te'].map(k=>entities.players[k]),...entities.decor.filter(p=>p.team===OFF)],teamState.userTeam);
  uniqueLineupNumbers([...['cb1','cb2','s1','lb1',...DL_KEYS].map(k=>entities.players[k]),...entities.decor.filter(p=>p.team===DEF)],teamState.cpuTeam);
  applyFormation('trips');
  Object.entries(entities.players).forEach(([key,e])=>{e.skin=e.skin??SKIN_BY_POSITION[key]??0;});
  entities.decor.forEach((e,i)=>{e.skin=(i+(e.team===DEF?2:0))%SKIN_PALETTES.length;});
  entities.ballCarrier=entities.players.qb;
  entities.ball={inFlight:false};
  game.passFeedback='';
  entities.runExchange=null;
  entities.playFake=null;
  entities.pendingTapThrow=null;
  game.phase='callsheet';
  game.message='';
  game.thrown=false;
  game.playCall=null;
  game.formation=null;
  game.playbookView='formations';
  game.runActive=false;game.scrambling=false;
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
  checkpoint({type:'offense'});
}

function moveToward(e,tx,ty,speed,dt){
  const dx=tx-e.x,dy=ty-e.yfield,d=Math.hypot(dx,dy);
  if(d>2){
    if(Math.abs(dy)>0.5)e.facing=dy>0?'left':'right';
    const step=Math.min(d,speed*dt);e.x+=dx/d*step;e.yfield+=dy/d*step;
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
  hint.innerHTML=(play.type==='run'?'Tap the field to run':game.passMode==='tap'?'Tap a receiver to pass':'Drag from QB to pass')+(play.routes?.rb?' <span>|</span> RB is a receiver':' <span>|</span> Tap RB to '+play.runOption);
  hint.style.display='block';
}

export function resetDownsAt(los){
  game.los=clamp(los,1,99.999);
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

export function startNewGame(options={}){
  game.career=!!options.career;
  game.userIsHome=options.userIsHome??true;
  matchState.stats=emptyMatch();
  game.practice=false;
  teamState.userTeam=League.findTeamState(teamState.franchise,game.userTeamId)||teamState.franchise.teams[0];
  teamState.cpuTeam=game.career?League.findTeamState(teamState.franchise,game.cpuTeamId):resolveOpponentChoice();
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
  checkpoint({type:'kickoff',receiver:game.firstHalfReceiver,spot:openingSpot,message:game.message,buttonLabel:game.firstHalfReceiver==='player'?'Receive Kickoff':'Kick Off'});
}
export function startPractice(){
  game.career=false;
  game.userIsHome=true;
  matchState.stats=emptyMatch();
  game.practice=true;
  teamState.userTeam=League.findTeamState(teamState.franchise,game.userTeamId)||teamState.franchise.teams[0];
  teamState.cpuTeam=game.career?League.findTeamState(teamState.franchise,game.cpuTeamId):resolveOpponentChoice();
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
  if(game.career){game.phase='gameover';uiHooks.finishCareer(matchState.stats);return;}
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
  checkpoint({type:'turnover',message,cpuStart,reason});
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
  feedback('score');
  game.playerScore+=6;
  const patGood=simulateExtraPoint('player');
  adjustMomentum(0.35);
  completePlayerPossession('TOUCHDOWN!\n'+(entities.ballCarrier?.slot||'Player')+' · '+Math.round(entities.ballCarrier.yfield/XPX-game.los)+' yards\nExtra point '+(patGood?'is good.':'missed.')+'\n'+scoreLine(),kickoffSpot(),'Kickoff');
}
export function endPlay(yardGained,label,outOfBounds=false,exactSpot=game.los+yardGained){
  if(game.playResolved)return;
  game.playResolved=true;feedback('whistle');
  const newLOS=clamp(exactSpot,0,100);
  if(!game.practice){
    const facts=game.playFacts||{};
    recordPlay(matchState.stats,{id:String(matchState.stats.plays.length+1),qbId:entities.players.qb.playerId,carrierId:entities.ballCarrier?.playerId,threw:!!facts.threw,targetId:facts.targetId,receiverId:facts.receiverId,yards:Math.round(newLOS-game.los),touchdown:newLOS>=100,intercepted:label==='INTERCEPTED',sacked:label==='Sacked'||!!facts.sacked,fumbled:!!facts.fumbled,fumbleLost:label==='FUMBLE LOST',play:game.playCall});
  }
  if(game.practice){
    if(label==='FUMBLE LOST'){showResult('Fumble lost. Protect the ball with a dive or slide.',()=>startPlayerDrive(20),'Next Rep');return;}
    if(newLOS>=100){
      showResult('TOUCHDOWN!\nPractice rep complete.',()=>startPlayerDrive(20),'Next Rep');
      return;
    }
    if(label==='INTERCEPTED'){
      showResult('Intercepted.\nReset and try the read again.',()=>startPlayerDrive(20),'Next Rep');
      return;
    }
    if(label==='INCOMPLETE'){
      showResult('Incomplete pass.'+(game.passFeedback?' '+game.passFeedback:''),initPlay,'Next Rep');
      return;
    }
    game.los=clamp(newLOS,1,99.999);
    resetDownsAt(game.los);
    showResult(label+' for '+yardGained+(Math.abs(yardGained)===1?' yard':' yards')+(outOfBounds?', out of bounds.':'.'),initPlay,'Next Rep');
    return;
  }
  if(label==='FUMBLE LOST'){adjustMomentum(-.25);completePlayerPossession('FUMBLE LOST\nDefense recovers.',clamp(100-newLOS,1,99),'Fumble');return;}
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
    game.message='Incomplete pass.'+(game.passFeedback?' '+game.passFeedback:'');
    adjustMomentum(-0.04);
  } else {
    game.los=newLOS;
    if(!outOfBounds)consumeClock(BETWEEN_PLAY_RUNOFF);
    if(newLOS>=game.firstDownYard){
      resetDownsAt(newLOS);
      game.message=label+' for '+yardGained+(Math.abs(yardGained)===1?' yard':' yards')+(outOfBounds?', out of bounds. ':'. ')+'First down!';
      adjustMomentum(0.07);
    } else {
      game.down+=1;
      game.distance=game.firstDownYard-newLOS;
      game.message=label+' for '+yardGained+(Math.abs(yardGained)===1?' yard':' yards')+(outOfBounds?', out of bounds.':'.');
    }
    if(yardGained<0)adjustMomentum(-0.05);
  }
  if(game.down>4){
    adjustMomentum(-0.22);
    completePlayerPossession(game.message+' Turnover on downs.',clamp(100-game.los,1,99),'Turnover on downs');
    return;
  }
  showResult(game.message,afterPlayerPlay);
  checkpoint({type:'afterPlay',message:game.message});
}

export function attemptFieldGoal(){
 if(game.phase!=='decision'||117-game.los>=65)return;
 hideAllOverlays();game.phase='kicking';
 const distance=Math.round(117-game.los),rating=positionRating(teamState.userTeam,'K','offense');
 game.kick={stage:'power',start:simulationNow(),distance,power:0,aim:0,powerRequired:clamp((distance-15)/65,.18,.72),aimTolerance:clamp(.72-(distance-20)*.009+(rating-75)*.004,.2,.85)};
}
export function kickInput(){
 const k=game.kick;if(game.paused||game.phase!=='kicking'||!k)return;
 const now=simulationNow();
 if(k.stage==='power'){k.power=(Math.sin((now-k.start)/300-Math.PI/2)+1)/2;k.stage='aim';k.start=now;return;}
 if(k.stage!=='aim')return;
 k.aim=Math.sin((now-k.start)/400);k.stage='flight';k.start=now;
 k.good=k.power>k.powerRequired&&Math.abs(k.aim)<k.aimTolerance;
 entities.ball={inFlight:true,fromX:190,fromY:(game.los-7)*XPX,toX:190+k.aim*170,toY:Math.min(110,game.los-7+20+k.power*80)*XPX,startTime:now,duration:1400,arcHeight:45+k.power*40};
}
function finishKick(){
 const k=game.kick;consumeClock(5);
 const pos=flightPosition(entities.ball,simulationNow());entities.ball=looseBall(pos,{vy:70,vz:80,now:simulationNow()});
 if(k.good){game.playerScore+=3;adjustMomentum(.12);completePlayerPossession(k.distance+'-yard field goal is GOOD!\n'+scoreLine(),kickoffSpot(),'Kickoff');}
 else{adjustMomentum(-.1);completePlayerPossession(k.distance+'-yard field goal is no good.',clamp(100-game.los,1,99),'Missed field goal');}
}
export function simulatePunt(){
  if(game.phase!=='decision')return;
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
  const scoreBefore=game.cpuScore;
  let driveTurnover=false;
  const strength=cpuStrength();
  let driveSeconds=Math.round(38+Math.random()*58+strength*5);
  if(!game.overtime&&game.quarter===4&&game.cpuScore>game.playerScore)driveSeconds+=20;
  const consumedSeconds=game.overtime?driveSeconds:Math.min(driveSeconds,Math.ceil(game.clock));
  consumeClock(consumedSeconds);
  const opportunity=Math.min(1,consumedSeconds/driveSeconds);
  let gain=Math.min(100-startField,Math.round((14+Math.random()*36+strength*7+(startField-20)*0.12)*opportunity));
  const endField=clamp(startField+gain,1,100);
  const lines=['OPPONENT DRIVE',reason+': opponent starts at '+cpuFieldLabel(startField)+'.'];

  const turnoverChance=clamp(0.18-strength*0.045,0.055,0.2);
  const tdChance=clamp(0.10+strength*0.07+Math.max(0,endField-45)*0.006,0.10,0.62);
  const roll=Math.random();
  let playerStart=20;
  let outcome='';
  if(roll<turnoverChance){
    driveTurnover=true;
    playerStart=clamp(100-endField,5,95);
    outcome='Turnover! You take over at '+formatFieldPosition(playerStart)+'.';
    adjustMomentum(-0.08);
  } else if(endField>=100||roll<turnoverChance+tdChance*opportunity){
    gain=100-startField;
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
  (matchState.stats.opponentDrives??=[]).push({points:game.cpuScore-scoreBefore,yards:Math.round(gain),turnover:driveTurnover});
  lines.push('The drive gains '+Math.round(gain)+(Math.round(gain)===1?' yard.':' yards.'));
  lines.push(outcome);
  lines.push('Drive time: '+Math.floor(consumedSeconds/60)+':'+String(consumedSeconds%60).padStart(2,'0'));
  lines.push(scoreLine());
  return {message:lines.join('\n'),playerStart,gain};
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
  resetHighlight();
  showResult(result.message,()=>finishOpponentPossession(result.playerStart),'Skip drive');
  game.drivePresentation={start:simulationNow(),lines:result.message.split('\n'),startField,gain:result.gain};
  document.getElementById('result-overlay').classList.add('compact-result');
  game.autoContinueAt=simulationNow()+5500;
  checkpoint({type:'cpuResult',message:result.message,playerStart:result.playerStart});
}
export function onSnap(){
  if(game.phase!=='presnap')return false;
  game.phase='live';game.snapTime=simulationNow();feedback('snap');
  document.getElementById('presnap-hint').style.display='none';
  const play=PLAYS[game.playCall];
  game.blitzBlockedUntil=game.snapTime;
  if(play?.type==='playaction')entities.playFake={start:game.snapTime,duration:380,from:{x:entities.players.rb.x,yfield:entities.players.rb.yfield}};
  if(Math.random()<currentDiff().blitzChance){
    game.blitzer=Math.random()<0.5?'lb1':'s1';
  }
  game.coverage=Math.random()<.38?'zone':'man';
  game.coverAssignments={};
  const keys=Object.keys(PLAYS[game.playCall]?.routes||{}),available=[...keys];
  for(const dk of ['cb1','cb2','s1','lb1']){
    const d=entities.players[dk];available.sort((a,b)=>Math.abs(entities.players[a].x-d.x)-Math.abs(entities.players[b].x-d.x));
    game.coverAssignments[dk]=available.shift()||keys[0];
  }
  return true;
}
export function startRunOption(){
  if(!onSnap())return;
  const now=simulationNow();
  const play=PLAYS[game.playCall];
  entities.playFake=null;
  game.thrown=true;
  game.runActive=true;
  game.runType=play.runOption||'handoff';
  game.runPathIndex=0;
  game.activeRunPath=play.runPath||FORMATION_RUN_PATHS[play.formation]||[];
  entities.ballCarrier=null;
  entities.runExchange={type:game.runType,startTime:now,duration:(game.runType==='pitch'?240:110)+(play.runDelay||0)};
}
export function startScramble(){
 if(game.paused||game.thrown||!['presnap','live'].includes(game.phase)||entities.ball.inFlight)return false;
 if(game.phase==='presnap')onSnap();
 game.scrambling=true;game.thrown=true;game.runActive=true;game.runType='scramble';
 entities.pendingTapThrow=null;entities.playFake=null;entities.runExchange=null;
 entities.ballCarrier=entities.players.qb;game.carrierSince=simulationNow();
 entities.players.qb.action='carry';entities.players.qb.actionStart=simulationNow();
 interaction.aiming=false;interaction.aimTarget=null;
 return true;
}
export function releaseThrow(t,explicitReceiver=false){
  if(game.paused||game.thrown||game.phase!=='live')return;
  const qb=entities.players.qb;
  // Judge intent before accuracy scatter: one yard behind the QB commits to a run.
  if(!explicitReceiver&&game.cameraYard*XPX+(BASE_X-t.x)<qb.yfield-XPX)return startScramble();
  game.thrown=true;
  entities.playFake=null;
  game.playFacts.threw=true;feedback('throw');
  const throwStart=simulationNow();
  qb.action='throw';qb.actionStart=throwStart;
  const camPx=game.cameraYard*XPX;
  const aimDistance=Math.hypot(t.y-qb.x,camPx+(BASE_X-t.x)-qb.yfield);
  const accuracyError=clamp((94-(qb.attributes?.accuracy??qb.rating??75))*0.14,0,6)*clamp(aimDistance/(25*XPX),0.5,1.5);
  const lateralError=(Math.random()+Math.random()-1)*accuracyError;
  const depthError=(Math.random()+Math.random()-1)*accuracyError*1.25;
  const fLat=clamp(t.y+lateralError,LAT_MIN,LAT_MAX);
  const fDown=camPx+(BASE_X-t.x)+depthError;
  const dist=Math.hypot(fLat-qb.x,fDown-qb.yfield);
  const landing={x:fLat,yfield:fDown},profile=throwProfile(qb,landing,game.throwType);
  entities.ball={inFlight:true,fromX:qb.x,fromY:qb.yfield,toX:fLat,toY:fDown,startTime:throwStart+profile.releaseDelay,duration:profile.duration,arcHeight:profile.arcHeight};
  const read=passingRead({players:entities.players,play:PLAYS[game.playCall],los:game.los,elapsed:throwStart-game.snapTime,landing,kind:game.throwType,difficulty:currentDiff(),difficultyName:game.difficulty,momentum:game.momentum});
  if(read.target?.reachable){entities.ball.targetKey=read.target.key;game.playFacts.targetId=entities.players[read.target.key].playerId;}

}
function dropBall(deflected=false){
 const b=entities.ball;
 entities.ball=looseBall({x:b.toX,yfield:b.toY,height:deflected?14:0},{vx:(b.toX-(b.fromX??b.toX))*.07,vy:(b.toY-(b.fromY??b.toY))*.08,vz:deflected?150:100,now:simulationNow()});
}
function advanceFumble(dt,now){
 const f=game.fumble,b=entities.ball;
 const defense=[...['cb1','cb2','s1','lb1',...DL_KEYS].map(k=>entities.players[k]),...entities.decor.filter(p=>p.team===DEF)];
 const offense=[...Object.values(entities.players).filter(p=>!defense.includes(p)),...entities.decor.filter(p=>p.team===OFF)];
 const candidates=[...offense,...defense].filter(p=>!(p.missedUntil>now)&&!(p===f.carrier&&now-f.start<650));
 for(const p of candidates)moveToward(p,b.x,b.yfield,80*speedMultiplier(p,game.difficulty,game.momentum),dt);
 const closest=candidates.sort((a,c)=>separation(a,b)-separation(c,b))[0];
 const outside=b.x<LAT_MIN||b.x>LAT_MAX;
 if(outside||(now-f.start>450&&b.height<12&&closest&&separation(closest,b)<18)||now-f.start>5000){
   const lost=!outside&&defense.includes(closest);
   const spot=clamp(Math.min(b.yfield/XPX,f.spot),1,99); // No forward progress from a loose ball.
   b.live=false;entities.ballCarrier=f.carrier;game.fumble=null;
   endPlay(Math.round(spot-game.los),lost?'FUMBLE LOST':'Fumble recovered',outside,spot);
   if(!outside&&closest){b.loose=false;b.settled=true;closest.action='carry';closest.actionStart=now;entities.ballCarrier=closest;}
 }
}
function resolveCatchAtTarget(){
  const diff=currentDiff();
  const routeKeys=Object.keys(PLAYS[game.playCall].routes);
  let best=null,bestKey=null,bestD=Infinity,bestTol=30,bestScore=Infinity;
  routeKeys.forEach(k=>{
    const r=entities.players[k];
    const feet=r.x+SPRITE_GROUND_Y_OFFSET;
    if(feet<=LAT_MIN-SIDELINE_STEP_DEPTH||feet>=LAT_MAX+SIDELINE_STEP_DEPTH||r.yfield/XPX<=-10||r.yfield/XPX>=110)return;
    const d=Math.hypot(r.x-entities.ball.toX,r.yfield-entities.ball.toY);
    const tolerance=catchTolerance(r,diff);
    const score=d/tolerance;
    if(score<bestScore){bestScore=score;bestD=d;best=r;bestKey=k;bestTol=tolerance;}
  });
  if(best&&bestD<=bestTol)game.playFacts.targetId=best.playerId;
  if(!best||bestD>bestTol){game.passFeedback='Out of reach.';dropBall();endPlay(0,'INCOMPLETE');return;}
  const defenders=[...['cb1','cb2','s1','lb1',...DL_KEYS].map(k=>entities.players[k]),...entities.decor.filter(d=>d.team===DEF)].filter(d=>!(d.missedUntil>simulationNow())&&!d.dive);
  let nearestDefender=null,dist=Infinity;
  for(const defender of defenders){const distance=separation(best,defender);if(distance<dist){dist=distance;nearestDefender=defender;}}
  const outcome=catchOutcome({error:bestD,tolerance:bestTol,defenderDistance:dist,ballDefenderDistance:nearestDefender?separation(nearestDefender,{x:entities.ball.toX,yfield:entities.ball.toY}):Infinity,receiverRating:attributeRating(best,'catching'),defenderRating:nearestDefender?.rating},Math.random());
  if(outcome==='interception'){entities.ballCarrier=nearestDefender;nearestDefender.action='carry';nearestDefender.actionStart=simulationNow();endPlay(0,'INTERCEPTED');return;}
  if(outcome!=='catch'){
    game.passFeedback=outcome==='breakup'?'Pass broken up.':'Dropped pass.';
    best.action='drop';best.actionStart=simulationNow();
    if(outcome==='breakup'&&nearestDefender){nearestDefender.action='deflect';nearestDefender.actionStart=simulationNow();}
    dropBall(outcome==='breakup');endPlay(0,'INCOMPLETE');return;
  }
  entities.ballCarrier=best;
  game.playFacts.receiverId=best.playerId;
  feedback('catch');
  best.action='catch';best.actionStart=simulationNow();
  game.carrierSince=simulationNow();
}
function resolveTackle(tackler){
  const yardGained=Math.round(entities.ballCarrier.yfield/XPX-game.los);
  let label;
  if(entities.ballCarrier===entities.players.qb)label=!game.scrambling&&yardGained<0?'Sacked':'Scramble';
  else if(game.runActive)label=game.runType==='pitch'?'Pitch':'Run';
  else label='Catch';
  if(!tackler){endPlay(yardGained,label,false,entities.ballCarrier.yfield/XPX);return;}
  const now=simulationNow();
  if(!entities.ballCarrier.runnerDive&&!game.playFacts.fumbled&&entities.ballCarrier.yfield/XPX>2&&entities.ballCarrier.yfield/XPX<98&&Math.random()<fumbleChance(entities.ballCarrier,tackler)){
    const carrier=entities.ballCarrier;game.playFacts.fumbled=true;game.playFacts.sacked=label==='Sacked';game.fumble={carrier,spot:carrier.yfield/XPX,start:now};
    entities.ball=looseBall({x:carrier.x,yfield:carrier.yfield,height:12},{vx:(carrier.x-tackler.x)*3,vy:45,vz:120,live:true,now});
    entities.ballCarrier=null;carrier.action='tackled';carrier.actionStart=now;interaction.steering=false;return;
  }
  game.phase='tackle';feedback('tackle');
  game.tackle={startTime:now,carrier:entities.ballCarrier,tackler,yardGained,label,exactSpot:entities.ballCarrier.yfield/XPX};
  entities.ballCarrier.action='tackled';entities.ballCarrier.actionStart=now;
  if(Math.abs(entities.ballCarrier.yfield-tackler.yfield)>0.5)tackler.facing=entities.ballCarrier.yfield>tackler.yfield?'left':'right';
  tackler.dive=null;
  tackler.action='tackle';tackler.actionStart=now;
  interaction.steering=false;interaction.steerAnchor=null;interaction.steerCurrent=null;
}
function resolveOutOfBounds(){
  const yardGained=Math.round(entities.ballCarrier.yfield/XPX-game.los);
  let label;
  if(entities.ballCarrier===entities.players.qb)label=!game.scrambling&&yardGained<0?'Sacked':'Scramble';
  else if(game.runActive)label=game.runType==='pitch'?'Pitch':'Run';
  else label='Catch';
  interaction.steering=false;interaction.steerAnchor=null;interaction.steerCurrent=null;
  endPlay(yardGained,label,true,entities.ballCarrier.yfield/XPX);
}
function finishTackle(){
  const tackle=game.tackle;
  if(!tackle)return;
  tackle.carrier.action='';tackle.tackler.action='';
  game.tackle=null;
  endPlay(tackle.yardGained,tackle.label,false,tackle.exactSpot);
}

let loopStarted=false;
export function ensureLoopStarted(){
  if(!loopStarted){resetFrameClock();loopStarted=true;requestAnimationFrame(tick);}
}
function updateSimulation(dt,now){
  if(editState.editMode)return;
  if(!game.paused){
    if(game.phase==='result'&&game.drivePresentation){const d=game.drivePresentation;const count=Math.min(d.lines.length,2+Math.floor((now-d.start)/1000));document.getElementById('overlay-msg').textContent=d.lines.slice(0,count).join('\n');}
    advanceLooseBall(entities.ball,dt);
    if(game.phase==='deadball'){
      if(!game.practice&&!game.overtime)game.clock=Math.max(0,game.clock-dt);
      updateHUD();
      if(entities.ball.bounces>0)endPlay(0,'INCOMPLETE');
      return;
    }
    if(game.phase==='kicking'){
      if(game.kick.stage==='flight'){
        game.cameraYard+=(flightPosition(entities.ball,now).yfield/XPX-game.cameraYard)*Math.min(1,dt*3);
        if(now-game.kick.start>=1400)finishKick();
      }
      return;
    }
    if(game.phase==='result'&&!highlights.playing&&game.autoContinueAt&&now>=game.autoContinueAt){game.autoContinueAt=0;continueResult({automatic:true});}
  }
  if(!game.paused&&!game.overtime&&game.phase==='live'){
    game.clock=Math.max(0,game.clock-dt);
    updateHUD();
  }
  if(game.phase==='live'&&!game.paused){
    if(game.fumble){advanceFumble(dt,now);captureHighlight(now);return;}
    const diff=currentDiff();
    const t=(now-game.snapTime)/1000;
    const cb1=entities.players.cb1,cb2=entities.players.cb2,qb=entities.players.qb,s1=entities.players.s1,lb1=entities.players.lb1;
    const playDef=PLAYS[game.playCall];
    const screenMult=(playDef?.type==='screen'&&t<1.3)?0.25:1;
    entities.breakCooldown=Math.max(0,entities.breakCooldown-dt);
    for(const p of Object.values(entities.players))p.isBlocking=false;
    if(playDef&&entities.ballCarrier===qb&&!game.scrambling)advanceSkillBlocks({players:entities.players,defenders:[cb1,cb2,s1,lb1,...DL_KEYS.map(k=>entities.players[k]),...entities.decor.filter(p=>p.team===DEF)],play:playDef,los:game.los,elapsed:now-game.snapTime,now,dt,moveToward});
    if(entities.playFake){
      const fake=entities.playFake,progress=clamp((now-fake.start)/fake.duration,0,1),rb=entities.players.rb;
      const reach=Math.sin(progress*Math.PI);
      rb.x=fake.from.x+(qb.x-fake.from.x)*reach;
      rb.yfield=fake.from.yfield+(qb.yfield-fake.from.yfield)*reach;
      if(progress>=1)entities.playFake=null;
    }

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
      releaseThrow({x:target.cx??target.x,y:target.cy??target.y},!!pending.playerKey);
    }

    DL_KEYS.forEach(key=>{
      const dl=entities.players[key];
      if(entities.ballCarrier!==qb&&!game.runActive)return;
      if(now<(dl.blockedUntil||0))return;
      if(dl.state==='approach'){
        if(t>diff.approachDelay){
          moveToward(dl,dl.blockerX,game.centerYfield,RUSH_SPEED*screenMult*speedMultiplier(dl,game.difficulty,game.momentum),dt);
          if(dl.yfield<=game.centerYfield+2){
            dl.state='engaged';
            dl.engageStart=now;
            const matchup=(dl.blockRating||68)-(dl.rating||68);
            const blockWinChance=clamp(diff.blockWinChance+matchup*0.006,0.02,0.82);
            const baseDuration=(diff.engageMin+Math.random()*(diff.engageMax-diff.engageMin))*(game.runActive&&!game.scrambling?1.5:1);
            dl.engageDur=Math.random()<blockWinChance?baseDuration*1.7:baseDuration*clamp(1+matchup/55,0.55,1.55);
          }
        }
      } else if(dl.state==='engaged'){
        if(now-dl.engageStart>=dl.engageDur){dl.state='released';}
      }
    });

    if(playDef&&playDef.type!=='run'&&entities.ballCarrier===qb&&!game.scrambling){
      Object.keys(playDef.routes).forEach(key=>{
        if(t*1000<(playDef.routeDelays?.[key]||0))return;
        const receiver=entities.players[key],speed=ROUTE_YPS*XPX*SPEED_SCALE*diff.offenseSpeedMult*speedMultiplier(receiver,game.difficulty,game.momentum);
        const ball=entities.ball,remaining=ball.startTime+ball.duration-now;
        const landing={x:ball.toX,yfield:ball.toY};
        const canAdjust=ball.inFlight&&ball.targetKey===key&&now>=ball.startTime&&remaining<=450&&remaining>=0&&separation(receiver,landing)<=catchTolerance(receiver,diff)+speed*remaining/1000;
        if(canAdjust)moveToward(receiver,clamp(ball.toX,LAT_MIN,LAT_MAX-SPRITE_GROUND_Y_OFFSET),clamp(ball.toY,-9.9*XPX,109.9*XPX),speed,dt);
        else advanceRoute(receiver,playDef.routes[key],speed,dt,game.los);
      });
      const coverAssign=game.coverAssignments||{};
      ['cb1','cb2','s1','lb1'].forEach((dk,index)=>{
        if(coverAssign[dk]&&dk!==game.blitzer&&t>diff.reactionDelay){
          const recv=entities.players[coverAssign[dk]],defender=entities.players[dk];
          let tx=recv.x,ty=recv.yfield+8;
          if(game.coverage==='zone'){
            const zoneX=[65,310,170,210][index],depth=[7,7,16,5][index];
            const nearby=Object.keys(playDef.routes).map(k=>entities.players[k]).filter(r=>Math.abs(r.x-zoneX)<100).sort((a,b)=>Math.abs(a.yfield-(game.los+depth)*XPX)-Math.abs(b.yfield-(game.los+depth)*XPX))[0];
            tx=nearby?clamp(nearby.x,zoneX-70,zoneX+70):zoneX;
            ty=nearby?clamp(nearby.yfield+12,(game.los+depth-3)*XPX,(game.los+depth+6)*XPX):(game.los+depth)*XPX;
          }
          const sMult=(playDef.type==='screen'&&dk==='cb1')?screenMult:1;
          moveToward(defender,tx,ty,COVER_YPS*XPX*SPEED_SCALE*sMult*(now<(defender.blockedUntil||0)?.25:1)*speedMultiplier(defender,game.difficulty,game.momentum),dt);
        }
      });
      if(game.blitzer&&t>0.25&&now>=(game.blitzBlockedUntil||0)){
        const blitzer=entities.players[game.blitzer];
        moveToward(blitzer,qb.x,qb.yfield,RUSH_SPEED_BLITZ*screenMult*(now<(blitzer.blockedUntil||0)?.25:1)*speedMultiplier(blitzer,game.difficulty,game.momentum),dt);
      }
    }

    if(entities.ball.inFlight&&now>=entities.ball.startTime){
      const p=Math.min(1,(now-entities.ball.startTime)/entities.ball.duration);
      const position=flightPosition(entities.ball,now);
      if(p>.12&&p<.88&&position.height<18){
        const defender=[...['cb1','cb2','s1','lb1',...DL_KEYS].map(k=>entities.players[k])].find(d=>!d.dive&&!(d.missedUntil>now)&&separation(d,position)<12);
        if(defender){defender.action='deflect';defender.actionStart=now;entities.ball.toX=position.x;entities.ball.toY=position.yfield;game.passFeedback='Deflected in the passing lane.';dropBall(true);game.phase='deadball';}
      }
      if(p>=1&&entities.ball.inFlight){entities.ball.inFlight=false;resolveCatchAtTarget();}
    }

    if(entities.ballCarrier){
      const reacted=(now-game.carrierSince)/1000>diff.reactionDelay;
      let pursuers=[];
      const releasedDL=DL_KEYS.map(k=>entities.players[k]).filter(dl=>dl.state==='released');
      if(entities.ballCarrier===qb&&!game.scrambling){
        pursuers=pursuers.concat(releasedDL);
        if(game.blitzer)pursuers.push(entities.players[game.blitzer]);
      } else {
        if(game.runActive&&!game.scrambling){
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
            const extras=entities.decor.filter(d=>d.team===DEF);extras.forEach(d=>{d.isPursuing=true;});
            pursuers=[cb1,cb2,s1,...extras];
            if(lb1.state!=='engaged')pursuers.push(lb1);
          }
          pursuers=pursuers.concat(releasedDL);
        } else if(reacted){
          const extraDefenders=entities.decor.filter(d=>d.team===DEF);
          extraDefenders.forEach(d=>{d.isPursuing=true;});
          pursuers=[cb1,cb2,s1,lb1,...DL_KEYS.map(k=>entities.players[k]),...extraDefenders];
          pursuers.forEach(d=>{d.state='released';});
        }
        let jx=0,jy=0;
        if(interaction.steering&&interaction.steerAnchor&&interaction.steerCurrent){
          const stick=stickVector(interaction.steerAnchor,interaction.steerCurrent);jx=stick.x;jy=stick.y;
        }
        const fwdMult = jx>0 ? (1-jx*0.85) : (1-jx*0.15);
        const normalize=1/Math.max(1,Math.hypot(fwdMult,jy*LATERAL_YPS/BASE_RUN_YPS));
        const breakSlowMult=now<(entities.ballCarrier.breakSlowUntil||0)?BREAK_SPEED_MULT:1;
        const carrierSpeedMult=speedMultiplier(entities.ballCarrier,game.difficulty,game.momentum);
        if(game.runActive&&entities.ballCarrier===entities.players.rb&&game.activeRunPath?.length){
          const runPath=game.activeRunPath;
          while(game.runPathIndex<runPath.length-1&&entities.ballCarrier.yfield/XPX-game.los>=runPath[game.runPathIndex].y)game.runPathIndex++;
          const lane=runPath[Math.min(game.runPathIndex,runPath.length-1)];
          const laneAssist=interaction.steering&&Math.abs(jy)>.1?0:2.2;
          entities.ballCarrier.x+=clamp(lane.x-entities.ballCarrier.x,-laneAssist,laneAssist)*dt*8;
        }
        const previousX=entities.ballCarrier.x,previousY=entities.ballCarrier.yfield;
        entities.ballCarrier.facing='left';
        entities.ballCarrier.yfield += BASE_RUN_YPS*fwdMult*normalize*(entities.ballCarrier.runnerDive?1.2:1)*XPX*SPEED_SCALE*diff.offenseSpeedMult*carrierSpeedMult*breakSlowMult*dt;
        const jukeDelta=jukeStep(entities.ballCarrier,now);
        const nextX=previousX+(jukeDelta??(jy*normalize*(entities.ballCarrier.runnerDive?0:1)*LATERAL_YPS*XPX*SPEED_SCALE*diff.offenseSpeedMult*carrierSpeedMult*breakSlowMult*dt));
        const sidelineMin=LAT_MIN-SPRITE_GROUND_Y_OFFSET-SIDELINE_STEP_DEPTH;
        const sidelineMax=LAT_MAX-SPRITE_GROUND_Y_OFFSET+SIDELINE_STEP_DEPTH;
        entities.ballCarrier.x=clamp(nextX,sidelineMin,sidelineMax);
        entities.ballCarrier.velocity={x:(entities.ballCarrier.x-previousX)/Math.max(dt,0.001),yfield:(entities.ballCarrier.yfield-previousY)/Math.max(dt,0.001)};
        if(entities.ballCarrier.runnerDive&&now-entities.ballCarrier.runnerDive.start>=300&&entities.ballCarrier.yfield/XPX<100)resolveTackle();
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

      if((entities.ballCarrier!==qb||game.scrambling) && entities.ballCarrier.yfield/XPX>=100){
        resolveTackle();
      }

      if(game.phase==='live'){
        const pursueSpeed=PURSUE_YPS_BASE*diff.pursueMult*XPX*SPEED_SCALE;
        // Receivers and nearby linemen can escort the runner, one blocker per defender.
        const blocked=new Set();
        if(entities.ballCarrier!==qb||game.scrambling){
          const blockers=[...new Set([...Object.keys(playDef.routes||{}),...(playDef.blocks||[])]).values()].map(k=>entities.players[k]).concat(entities.decor.filter(d=>d.team===OFF));
          const assignedBlockers=new Set(),pairs=[];
          for(const blocker of blockers){
            if(blocker===entities.ballCarrier||blocker===qb)continue;
            for(const def of pursuers){
              const distance=separation(blocker,def);
              if(!def.dive&&def.yfield>=entities.ballCarrier.yfield-28&&distance<110)pairs.push({blocker,def,distance});
            }
          }
          // The closest available blocker takes a matchup, regardless of roster order.
          pairs.sort((a,b)=>a.distance-b.distance);
          for(const {blocker,def} of pairs){
            if(assignedBlockers.has(blocker)||blocked.has(def))continue;
            assignedBlockers.add(blocker);blocked.add(def);
            moveToward(blocker,def.x,def.yfield,ROUTE_YPS*XPX*SPEED_SCALE*0.9,dt);
            blocker.isBlocking=true;
            if(touching(blocker,def)&&now>=(def.nextBlockAt||0)){
              const strength=blocker.attributes?.blocking??blocker.attributes?.strength??blocker.rating??75;
              const runBlock=game.runActive&&!game.scrambling;
              const hold=clamp((runBlock?1400:650)+(strength-(def.attributes?.strength??def.rating??75))*12,runBlock?850:300,runBlock?2200:1100);
              def.blockedUntil=now+hold;
              def.nextBlockAt=now+hold+700;
            }
          }
        }
        for(const def of pursuers){
          if(def.dive){
            advanceDive(def,entities.ballCarrier,dt,now);
            if(touching(def,entities.ballCarrier))continue;
            if(now>=def.dive.until){def.dive=null;def.action='missedTackle';def.actionStart=now;def.missedUntil=now+MISSED_TACKLE_RECOVERY_MS;}
            continue;
          }
          const target=pursuitTarget(def,entities.ballCarrier,entities.ballCarrier.velocity||{x:0,yfield:0});
          const blockedMult=now<(def.blockedUntil||0)?0:1;
          moveToward(def,clamp(target.x,LAT_MIN,LAT_MAX),target.yfield,pursueSpeed*speedMultiplier(def,game.difficulty,game.momentum)*blockedMult,dt);
          if(!entities.ball.inFlight&&(entities.ballCarrier!==qb||game.scrambling)&&blockedMult===1&&entities.breakCooldown<=0)startDive(def,entities.ballCarrier,now,diff);
        }
        if(!entities.ball.inFlight&&entities.breakCooldown<=0){
          let nearest=Infinity,nearestDefender=null;
          pursuers.forEach(def=>{
            if(def.missedUntil>now||def.blockedUntil>now)return;
            const distance=Math.hypot(def.x-entities.ballCarrier.x,def.yfield-entities.ballCarrier.yfield);
            if(distance<nearest){nearest=distance;nearestDefender=def;}
          });
          if(nearestDefender&&!(nearestDefender.missedUntil>now)&&touching(nearestDefender,entities.ballCarrier)){
            if(entities.ballCarrier.runnerDive&&entities.ballCarrier===qb){resolveTackle();return;}
            const matchup=strengthEdge(entities.ballCarrier,nearestDefender);
            const breakChance=clamp(diff.breakTackle+(game.runActive&&entities.ballCarrier===entities.players.rb?diff.runBreakBonus:0)+matchup,0.02,0.72);
            if(Math.random()<breakChance){
              entities.breakCooldown=0.45;
              entities.ballCarrier.breakSlowUntil=now+BREAK_SLOW_MS;
              if(Math.abs(entities.ballCarrier.yfield-nearestDefender.yfield)>0.5){
                nearestDefender.facing=entities.ballCarrier.yfield>nearestDefender.yfield?'left':'right';
              }
              nearestDefender.dive=null;
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
    // Screen-space aiming must stay stable while the finger is held down.
    if(game.phase==='live'&&!interaction.aiming){
      const focus=entities.ball.inFlight?flightPosition(entities.ball,now).yfield/XPX:entities.ballCarrier?entities.ballCarrier.yfield/XPX:game.los;
      game.cameraYard+=(focus-game.cameraYard)*Math.min(1,dt*3);
    }
  }
  if(['live','tackle'].includes(game.phase)&&!game.paused)captureHighlight(now);
  if(game.phase==='tackle'&&!game.paused&&game.tackle&&now-game.tackle.startTime>=TACKLE_RESULT_DELAY)finishTackle();
}
function tick(){
  advanceSimulation(updateSimulation);
  syncRunnerControls();
  draw();
  requestAnimationFrame(tick);
}
