import { FORMATIONS } from '../data/formations.js';

// Small preview diagrams drawn on each playbook/formation button's own canvas
// (not the main field canvas), so this takes its own 2d context per call.
export function diagramPoint(lateral,depth,width,height){
  return {x:width-24-depth*5.4,y:6+(lateral/380)*(height-12)};
}
export function drawDiagramArrow(context,a,b,color){
  const angle=Math.atan2(b.y-a.y,b.x-a.x);
  context.fillStyle=color;
  context.beginPath();context.moveTo(b.x,b.y);
  context.lineTo(b.x-Math.cos(angle-0.55)*5,b.y-Math.sin(angle-0.55)*5);
  context.lineTo(b.x-Math.cos(angle+0.55)*5,b.y-Math.sin(angle+0.55)*5);
  context.closePath();context.fill();
}
export function drawPlayDiagram(canvas,formationId,play){
  const formation=FORMATIONS[formationId],context=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
  context.clearRect(0,0,width,height);context.fillStyle='#173d25';context.fillRect(0,0,width,height);
  const losX=diagramPoint(190,0,width,height).x;
  context.strokeStyle='rgba(255,255,255,.58)';context.lineWidth=1;context.setLineDash([3,3]);
  context.beginPath();context.moveTo(losX,2);context.lineTo(losX,height-2);context.stroke();context.setLineDash([]);
  formation.line.forEach(lineman=>{
    const p=diagramPoint(lineman.x,lineman.y,width,height);context.fillStyle='#e8eee8';context.fillRect(p.x-2,p.y-2,4,4);
  });
  Object.entries(formation.players).forEach(([key,player])=>{
    const p=diagramPoint(player.x,player.y,width,height);
    context.fillStyle=key==='qb'?'#f4c542':'#e8eee8';context.beginPath();context.arc(p.x,p.y,key==='qb'?3:2.4,0,Math.PI*2);context.fill();
  });
  if(!play)return;
  Object.entries(play.routes||{}).forEach(([key,waypoints])=>{
    const start=formation.players[key],points=[diagramPoint(start.x,start.y,width,height),...waypoints.map(wp=>diagramPoint(wp.x,wp.y,width,height))];
    context.strokeStyle='#58a6ff';context.lineWidth=2;context.setLineDash(play.routeDelays?.[key]?[3,3]:[]);
    context.beginPath();context.moveTo(points[0].x,points[0].y);points.slice(1).forEach(p=>context.lineTo(p.x,p.y));context.stroke();context.setLineDash([]);
    drawDiagramArrow(context,points[points.length-2]||points[0],points[points.length-1],'#58a6ff');
  });
  if(play.runPath?.length){
    const start=formation.players.rb,points=[diagramPoint(start.x,start.y,width,height),...play.runPath.map(wp=>diagramPoint(wp.x,wp.y,width,height))];
    context.strokeStyle='#f4c542';context.lineWidth=2.5;context.beginPath();context.moveTo(points[0].x,points[0].y);points.slice(1).forEach(p=>context.lineTo(p.x,p.y));context.stroke();
    drawDiagramArrow(context,points[points.length-2],points[points.length-1],'#f4c542');
  }
  (play.blocks||[]).forEach(key=>{
    const player=formation.players[key];if(!player)return;
    const p=diagramPoint(player.x,player.y,width,height);context.strokeStyle='#fff';context.lineWidth=2;
    context.beginPath();context.moveTo(p.x-5,p.y-3);context.lineTo(p.x-5,p.y+3);context.stroke();
  });
}
