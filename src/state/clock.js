// One clock for simulation and animation; pauses never age an active play.
let pausedAt = null;
let excluded = 0;
export function simulationNow(){ return (pausedAt ?? performance.now()) - excluded; }
export function isClockPaused(){ return pausedAt !== null; }
export function pauseClock(paused){
  if(paused && pausedAt === null) pausedAt = performance.now();
  if(!paused && pausedAt !== null){ excluded += performance.now() - pausedAt; pausedAt = null; }
}
