import {CATCH_TOL_BASE,CONTEST_NEAR_BASE,CONTEST_MID_BASE,clamp,ratingMultiplier} from '../state/constants.js';
export function catchTolerance(receiver,difficulty){
 return CATCH_TOL_BASE*clamp(difficulty.catchRadiusMult,0.85,1.2)*ratingMultiplier(receiver.rating,0.18);
}
// Precise, uncontested placement is dependable. Pressure and stretching for a ball
// create distinct outcomes rather than adding interception odds to drop odds.
export function catchOutcome({error,tolerance,defenderDistance=Infinity,ballDefenderDistance=Infinity,receiverRating=75,defenderRating=75},roll){
 if(error>tolerance)return 'miss';
 const contested=defenderDistance<CONTEST_MID_BASE;
 if(!contested&&error<=tolerance*0.5)return 'catch';
 const stretch=clamp((error/tolerance-0.5)*2,0,1);
 const pressure=defenderDistance<CONTEST_NEAR_BASE?0.4:contested?0.16:0;
 const completion=clamp(1-stretch*0.2-pressure*ratingMultiplier(defenderRating,0.2)+(receiverRating-75)*0.002,0.35,1);
 const interception=contested&&ballDefenderDistance<18?Math.min(1-completion,0.04+stretch*0.08):0;
 if(roll<interception)return 'interception';
 if(roll<interception+completion)return 'catch';
 return contested?'breakup':'drop';
}
