import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375],[844,390]])test(`compact decisions and results ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{showFourthDown}=await import('/src/ui/hud.js');game.practice=false;game.los=72;game.distance=3;game.down=4;showFourthDown();});
 for(const id of ['btn-go-for-it','btn-field-goal','btn-punt'])await expect(page.locator('#'+id)).toBeInViewport({ratio:1});
 await expect(page.locator('#btn-field-goal')).toBeEnabled();
 expect((await page.locator('#fourth-down-overlay .card').boundingBox()).y).toBeGreaterThan(height*.35);
 await page.screenshot({path:`test-results/decisions-${width}-${height}.png`});
 await page.locator('#btn-go-for-it').tap();await expect(page.locator('#fourth-down-overlay')).not.toBeVisible();
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{showFourthDown}=await import('/src/ui/hud.js');game.los=20;showFourthDown();});
 await expect(page.locator('#btn-field-goal')).toBeDisabled();await expect(page.locator('#fg-detail')).toHaveText('Out of range');
 const scenarios=[
  ['drive','OPPONENT DRIVE\nKickoff: opponent starts at its own 25.\nThe drive gains 42 yards.\nOpponent 50-yard field goal is good.\nDrive time: 1:37\nBOS 7 | BUF 3','Continue',false],
  ['halftime','HALFTIME\nBOS 14 | BUF 10\nThe Buffalo team will receive the second-half kickoff.','Start 3rd Quarter',false],
  ['final','FINAL\nBOS 21 | BUF 17\nYou win!','Main menu',false],
  ['replay','TOUCHDOWN!\nExtra point attempt next.','Kick extra point',true],
  ['gain','Catch for 35 yards.','Continue',true],
 ];
 for(const [name,message,label,replay] of scenarios){
  await page.evaluate(async({message,label,replay})=>{const {highlights}=await import('/src/simulation/highlights.js'),{showResult}=await import('/src/ui/hud.js');highlights.frames=replay?[{},{}]:[];showResult(message,()=>{},label);},{message,label,replay});
  await expect(page.locator('#btn-continue')).toBeInViewport({ratio:1});
  if(replay)await expect(page.locator('#btn-replay')).toBeInViewport({ratio:1});
  await expect(page.locator('#overlay-msg')).toHaveText(message);
  expect(await page.locator('#overlay-msg').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  expect(await page.locator('#result-card').evaluate(e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/result-${name}-${width}-${height}.png`});
 }
 expect(errors).toEqual([]);await context.close();
});
