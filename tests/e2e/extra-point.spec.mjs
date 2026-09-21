import {test,expect} from '@playwright/test';

for(const good of [true,false])test(`mobile touchdown requires an extra point: ${good?'made':'missed'}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const e=await import('/src/simulation/engine.js'),{game,entities}=await import('/src/state/gameState.js');
  e.startNewGame();e.startPlayerDrive(95);game.clock=30;game.difficulty='medium';entities.ballCarrier=entities.players.wr1;entities.ballCarrier.yfield=2800;
  e.endPlay(5,'Catch',false,100);
 });
 await expect(page.locator('#hud-user-score')).toHaveText('6');
 const kick=page.getByRole('button',{name:'Kick extra point',exact:true});await expect(kick).toBeInViewport({ratio:1});
 await expect.poll(()=>page.evaluate(async()=>{const {resultFlow}=await import('/src/ui/hud.js');return performance.now()>=resultFlow.readyAt;})).toBe(true);
 await kick.tap();await expect(page.locator('#hud-down')).toHaveText('Extra point');
 await expect(page.locator('#result-overlay')).not.toBeVisible();
 await page.screenshot({path:`test-results/extra-point-${good?'made':'missed'}-power.png`});
 await page.evaluate(async(good)=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow()-(good?900:0);},good);
 await page.locator('#field').tap();
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.kick.stage;})).toBe('aim');
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow()-600;});
 await page.locator('#field').tap();await expect(page.locator('#result-overlay')).toBeVisible({timeout:10000});
 await expect(page.locator('#overlay-msg')).toContainText(good?'Extra point is GOOD':'Extra point is no good');
 await expect(page.locator('#hud-user-score')).toHaveText(good?'7':'6');await expect(page.locator('#hud-clock')).toHaveText('0:30');
 await page.screenshot({path:`test-results/extra-point-${good?'made':'missed'}-result.png`});
 await expect.poll(()=>page.evaluate(async()=>{const {resultFlow}=await import('/src/ui/hud.js');return performance.now()>=resultFlow.readyAt;})).toBe(true);
 await page.locator('#btn-continue').tap();await expect(page.locator('#overlay-msg')).toContainText('OPPONENT DRIVE');
 expect(errors).toEqual([]);await context.close();
});
