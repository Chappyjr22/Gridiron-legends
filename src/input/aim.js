import {XPX,clamp} from '../state/constants.js';
// A comfortable pull covers the arm's range, independent of screen-edge space.
export function slingshotTarget(qb,point,rating=75){
 const dx=point.x-qb.cx,dy=point.y-qb.cy;
 const reach=clamp(30+(rating-60)*.35,25,44)*XPX;
 return {x:qb.cx-clamp(dx/140,-1,1)*reach,y:qb.cy-clamp(dy/140,-1,1)*330};
}
