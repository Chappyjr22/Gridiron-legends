import {test,expect} from '@playwright/test';

test('caught-pass fixture tackles only after visible contact in landscape',async({browser},testInfo)=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,recordVideo:{dir:testInfo.outputPath('video'),size:{width:844,height:390}}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 // This fixture isolates contact geometry. The smoke suite separately exercises
 // normal throwing/running with native mouse and touch input.
 await page.evaluate(async()=>{
  const e=await import('/src/simulation/engine.js');const {game,entities}=await import('/src/state/gameState.js');
  const {simulationNow}=await import('/src/state/clock.js');const {DEF}=await import('/src/state/constants.js');
  e.onSnap();Math.random=()=>0.99;
  Object.values(entities.players).forEach(p=>{p.x=300;p.yfield=0;});entities.decor.forEach(p=>{p.x=300;p.yfield=0;});
  const runner=entities.players.wr1;Object.assign(runner,{x:190,yfield:35*28});entities.ballCarrier=runner;entities.ball.inFlight=false;
  game.thrown=true;game.carrierSince=simulationNow()-1000;game.cameraYard=35;
  Object.assign(entities.players.cb1,{x:190,yfield:35*28+65,state:'released'});
  window.contactEvidence=[];
  const watch=()=>{if(game.tackle){window.contactEvidence.push(Math.hypot(game.tackle.carrier.x-game.tackle.tackler.x,game.tackle.carrier.yfield-game.tackle.tackler.yfield));return;}requestAnimationFrame(watch);};watch();
 });
 await page.waitForFunction(()=>window.contactEvidence?.length>0,{},{timeout:5000});
 const distance=await page.evaluate(()=>window.contactEvidence[0]);expect(distance).toBeLessThanOrEqual(18.01);
 await page.getByRole('button',{name:'Pause',exact:true}).tap();
 // Hide just the pause dialog for evidence, keeping the simulation paused.
 await page.locator('#pause-overlay').evaluate(e=>e.style.visibility='hidden');
 await page.screenshot({path:testInfo.outputPath('contact.png')});
 expect(errors).toEqual([]);await context.close();
});
