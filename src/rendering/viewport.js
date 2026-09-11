import {canvas} from './canvas.js';
import {BASE_X,setFieldWidth} from '../state/constants.js';
import {interaction} from '../input/interactionState.js';

export function fitFieldViewport(width,height){
  if(width<=0||height<=0)return;
  const next=Math.max(800,Math.min(1600,Math.round(width/height*380)));
  if(next===canvas.width)return;
  const previous=BASE_X;
  canvas.width=next;
  setFieldWidth(next);
  // Keep an active gesture attached to the same world point on rotation/toolbar resize.
  const points=new Set([interaction.aimTarget,interaction.steerAnchor,interaction.steerCurrent]);
  for(const point of points)if(point)point.x+=BASE_X-previous;
}
export function initFieldViewport(){
  const container=canvas.parentElement;
  new ResizeObserver(()=>{const r=container.getBoundingClientRect();fitFieldViewport(r.width,r.height);}).observe(container);
}
