import {weeklyGoal} from './development.js';

// Keep the existing confidence rules; the breakdown only makes their effects visible.
export function confidenceFeedback(before,won,goal,stats){
 const reasons=[{label:won?'Game won':'Game lost',delta:won?3:-2}];
 if(goal.met)reasons.push({label:'Weekly objective met',delta:2});
 if(goal.kind==='challenge'&&goal.met)reasons.push({label:'Coach challenge bonus',delta:2});
 const penalty=Math.min(6,stats.interceptions*2);
 if(penalty)reasons.push({label:`${stats.interceptions} ${stats.interceptions===1?'interception':'interceptions'}`,delta:-penalty});
 const after=Math.max(0,Math.min(100,before+(won?3:-2)+(goal.met?2:0)+(goal.kind==='challenge'&&goal.met?2:0)-penalty));
 const delta=after-before;
 return {before,after,delta,reasons,capped:delta!==reasons.reduce((sum,reason)=>sum+reason.delta,0)};
}

// Read-only view model. Old saves do not contain enough information to reconstruct
// the previous confidence at a cap, so never infer a historical change from a score.
export function coachProgress(c){
 if(c.stage==='college')return null;
 const confidence=c.coachConfidence??50;
 const player=c.league.teams.find(t=>t.id===c.teamId)?.roster.find(p=>p.id===c.playerId);
 const contractYears=Number.isFinite(player?.contractYears)?player.contractYears:null;
 const renewalYears=confidence>=70?4:confidence>=40?3:1;
 const result=c.lastResult;
 let latest=null;
 if(result?.coachFeedback){
  latest={...structuredClone(result.coachFeedback),season:result.season,week:result.week};
 }else if(result){
  latest={before:null,after:Number.isFinite(result.coachConfidence)?result.coachConfidence:null,delta:null,reasons:[],capped:false,season:result.season,week:result.week};
 }
 const goal=weeklyGoal(c);
 let nextFocus={title:'Next objective',detail:goal.label};
 if(result?.stats?.interceptions>0){
  nextFocus={title:'Protect the ball',detail:`Your last game had ${result.stats.interceptions} ${result.stats.interceptions===1?'interception':'interceptions'}. Take the open throw or throw it away when coverage wins.`};
 }else if(result?.goal&&!result.goal.met){
  nextFocus={title:'Complete your weekly objective',detail:`Next target: ${goal.label}. Meeting it adds 2 confidence.`};
 }else if(result){
  nextFocus={title:'Keep building',detail:`Next target: ${goal.label}. Wins add 3 confidence; completed objectives add 2.`};
 }
 if(c.postseason?.champion)nextFocus={title:'Ready for next season',detail:'Your season is complete. Review your results, then advance to the next year.'};
 return {confidence,confidenceLabel:confidence>=70?'Strong':confidence>=40?'Building':'Low',contractYears,renewalYears,
  renewalDetail:`At current confidence, your next renewal would be ${renewalYears} ${renewalYears===1?'season':'seasons'}. Renewal happens when your contract expires.`,latest,nextFocus};
}
