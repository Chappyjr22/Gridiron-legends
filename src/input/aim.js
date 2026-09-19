import {XPX,clamp} from '../state/constants.js';
// Air distance is measured from the QB, not the line of scrimmage.
export function maxThrowYards(rating=75,kind='lob'){
 const arm=Number.isFinite(rating)?clamp(rating,40,99):75;
 return (14+36*Math.pow((arm-40)/59,1.5))*(kind==='bullet'?.82:1);
}
export function limitThrowTarget(qb,target,rating=75,kind='lob'){
 const dx=target.x-qb.cx,dy=target.y-qb.cy,distance=Math.hypot(dx,dy);
 const scale=Math.min(1,maxThrowYards(rating,kind)*XPX/(distance||1));
 return {x:qb.cx+dx*scale,y:qb.cy+dy*scale};
}
// A comfortable pull covers the arm's range, independent of screen-edge space.
export function slingshotTarget(qb,point,rating=75,kind='lob'){
 const dx=point.x-qb.cx,dy=point.y-qb.cy;
 const reach=maxThrowYards(rating,kind)*XPX;
 return limitThrowTarget(qb,{x:qb.cx-clamp(dx/140,-1,1)*reach,y:qb.cy-clamp(dy/140,-1,1)*330},rating,kind);
}
