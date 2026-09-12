import {entities} from '../state/gameState.js';
import {canvas} from './canvas.js';
import {BASE_X,setFieldWidth} from '../state/constants.js';
import {interaction} from '../input/interactionState.js';
import {SCENE_HEIGHT} from './sceneLayout.js';

export function fitFieldViewport(width,height){
  if(width<=0||height<=0)return;
  const next=Math.max(800,Math.min(1600,Math.round(width/height*SCENE_HEIGHT)));
  const scale=Math.min(width/next,height/SCENE_HEIGHT,2);
  canvas.style.width=`${Math.floor(next*scale)}px`;canvas.style.height=`${Math.floor(SCENE_HEIGHT*scale)}px`;
  if(next===canvas.width)return;
  const previous=BASE_X;
  canvas.width=next;
  setFieldWidth(next);
  // Keep an active gesture attached to the same world point on rotation/toolbar resize.
  const points=new Set([interaction.aimTarget,interaction.steerAnchor,interaction.steerCurrent,entities.pendingTapThrow?.target]);
  for(const point of points)if(point)point.x+=BASE_X-previous;
}
export function initFieldViewport(){
  const container=canvas.parentElement;
  new ResizeObserver(()=>{const r=container.getBoundingClientRect();fitFieldViewport(r.width,r.height);}).observe(container);
}
