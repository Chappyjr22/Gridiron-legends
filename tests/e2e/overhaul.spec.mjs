import {test,expect} from '@playwright/test';

test('three runner actions stay in one thumb-sized row on short landscape',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{const {game,entities}=await import('/src/state/gameState.js');game.phase='live';entities.ballCarrier=entities.players.wr1;entities.ball.inFlight=false;for(const p of Object.values(entities.players))if(p!==entities.ballCarrier)p.yfield=-10000;entities.decor.forEach(p=>p.yfield=-10000);});
 const controls=page.locator('#runner-controls');await expect(controls).toBeVisible();
 for(const button of await controls.getByRole('button').all())await expect(button).toBeInViewport({ratio:1});
 expect((await controls.boundingBox()).height).toBeLessThan(60);
 await page.screenshot({path:'test-results/overhaul-runner-controls-mobile.png'});await context.close();
});

test('recorded replay keeps the result intact and offers a reachable skip control',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const {game,entities}=await import('/src/state/gameState.js'),e=await import('/src/simulation/engine.js');
  const {captureHighlight,resetHighlight}=await import('/src/simulation/highlights.js');
  const {simulationNow}=await import('/src/state/clock.js');
  e.onSnap();resetHighlight();entities.ballCarrier=entities.players.wr1;
  for(let i=0;i<60;i++){entities.players.wr1.yfield+=2;captureHighlight(simulationNow()+i*60);}
  e.endPlay(25,'Catch',false,45);
 });
 const message=await page.locator('#overlay-msg').textContent();
 await page.getByRole('button',{name:'Replay',exact:true}).tap();
 await expect(page.getByRole('button',{name:'Skip replay',exact:true})).toBeInViewport({ratio:1});
 await expect(page.locator('#result-overlay')).toHaveClass(/replaying/);
 await page.screenshot({path:'test-results/overhaul-replay-mobile.png'});
 await page.getByRole('button',{name:'Skip replay',exact:true}).tap();
 await expect(page.locator('#overlay-msg')).toHaveText(message);
 await expect(page.locator('#result-overlay')).not.toHaveClass(/replaying/);
 await page.waitForFunction(async()=>{const {resultFlow}=await import('/src/ui/hud.js');return performance.now()>=resultFlow.readyAt;});
 await page.getByRole('button',{name:'Next Rep',exact:true}).tap();
 await expect(page.locator('#callsheet-overlay')).toBeVisible();expect(errors).toEqual([]);await context.close();
});

test('mobile field goal takes power and aim taps then follows the ball to the result',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const {game}=await import('/src/state/gameState.js'),e=await import('/src/simulation/engine.js'),hud=await import('/src/ui/hud.js');
  e.startNewGame();e.startPlayerDrive(80);game.down=4;hud.showFourthDown();
 });
 await page.locator('#btn-field-goal').tap();
 const field=page.locator('#field');await expect(field).toBeVisible();
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow()-900;});
 await field.tap();
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.kick.stage;})).toBe('aim');
 await page.screenshot({path:'test-results/overhaul-kick-aim-mobile.png'});
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow();});
 await field.tap();
 await expect(page.locator('#result-overlay')).toBeVisible();
 const result=await page.evaluate(async()=>{const {game,entities}=await import('/src/state/gameState.js');return {score:game.playerScore,camera:game.cameraYard,loose:entities.ball.loose};});
 expect(result.score).toBe(3);expect(result.camera).toBeGreaterThan(90);expect(result.loose).toBe(true);
 await page.screenshot({path:'test-results/overhaul-kick-result-mobile.png'});
 expect(errors).toEqual([]);await context.close();
});
