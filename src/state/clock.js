// One clock for movement, flight and animation. Pauses do not age a play.
let pausedAt = null;
let excluded = 0;
let frameTime = null;
let lastFrame = performance.now();
const wallTime = () => (pausedAt ?? performance.now()) - excluded;
export function simulationNow(){ return frameTime ?? wallTime(); }
export function isClockPaused(){ return pausedAt !== null; }
export function pauseClock(paused){
  if(paused && pausedAt === null) pausedAt = performance.now();
  if(!paused && pausedAt !== null){ excluded += performance.now() - pausedAt; pausedAt = null; }
}
// Catch up in small physics steps, drawing once. Long interruptions freeze the
// excess time instead of aging throws while skipping player movement.
export function advanceSimulation(update){
  let target=wallTime();
  if(target-lastFrame>1000){excluded+=target-lastFrame-1000;target=wallTime();}
  try{
    while(lastFrame<target){
      const elapsed=Math.min(16,target-lastFrame);
      lastFrame+=elapsed;frameTime=lastFrame;
      update(elapsed/1000,frameTime);
    }
  }finally{frameTime=null;}
}
