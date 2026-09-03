import * as League from './league.js';

// Core mutable game/session state, shared across simulation, rendering, input, and UI.
export const game={playerScore:0,cpuScore:0,quarter:1,quarterMinutes:3,clock:180,overtime:false,otRound:0,down:1,distance:10,los:20,firstDownYard:30,phase:'menu',message:'',thrown:false,cameraYard:20,playCall:null,formation:null,playbookView:'formations',passMode:'drag',throwType:'lob',difficulty:'medium',momentum:0,paused:false,centerYfield:0,carrierSince:0,blitzer:null,tackle:null,possession:'player',practice:false,showRoutes:true,firstHalfReceiver:'player',secondHalfReceiver:'cpu',userTeamId:'bos',cpuTeamId:'ny1',opponentChoice:'random',runActive:false,runType:'handoff',runPathIndex:0};

const initialFranchise=League.loadFranchise()||League.createFranchise(game.userTeamId);
game.userTeamId=initialFranchise.userTeamId||game.userTeamId;
try{game.opponentChoice=localStorage.getItem('gridironLegendsOpponentChoice')||'random';}catch(e){}

// Selected franchise/team references. Mutated via property assignment (never reassigned
// as a whole binding) so other modules can hold a live reference to this object.
export const teamState={
  franchise:initialFranchise,
  userTeam:League.findTeamState(initialFranchise,game.userTeamId)||initialFranchise.teams[0],
  cpuTeam:League.findTeamState(initialFranchise,game.cpuTeamId)||initialFranchise.teams[1]
};

// Live on-field entities for the play in progress.
export const entities={players:{},decor:[],ball:{inFlight:false},ballCarrier:null,breakCooldown:0,runExchange:null,pendingTapThrow:null};
