import {test,expect} from '@playwright/test';
for(const width of [667,844])test(`full kicking formation at ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:304},hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();
 for(const [stage,elapsed] of [['power',0],['approach',90],['approach',400]]){
  await page.evaluate(async({stage,elapsed})=>{
   const e=await import('/src/simulation/engine.js'),{game}=await import('/src/state/gameState.js'),clock=await import('/src/state/clock.js');
   e.practiceFieldGoal(35);clock.pauseClock(true);game.kick.stage=stage;game.kick.start=clock.simulationNow()-elapsed;
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  },{stage,elapsed});
  await expect(page.locator('#field')).toBeVisible();
  await page.screenshot({path:`test-results/kick-formation-${width}-${stage}-${elapsed}.png`});
 }
 expect(errors).toEqual([]);await context.close();
});
