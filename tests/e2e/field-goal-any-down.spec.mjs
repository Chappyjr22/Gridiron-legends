import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375]])test(`late field goal on first down is reachable at ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#btn-practice').tap();
 await page.evaluate(async()=>{const e=await import('/src/simulation/engine.js'),{game}=await import('/src/state/gameState.js');e.startNewGame();e.startPlayerDrive(52);Object.assign(game,{quarter:4,clock:3,playerScore:14,cpuScore:16});});
 await expect(page.locator('#playbook-field-goal')).toBeDisabled();
 await page.evaluate(async()=>{const e=await import('/src/simulation/engine.js');e.startPlayerDrive(75);});
 const fg=page.getByRole('button',{name:'Attempt 42-yard field goal',exact:true});await expect(fg).toBeEnabled();await expect(fg).toBeInViewport({ratio:1});
 const box=await fg.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);
 for(const control of await page.locator('#formation-tabs button,.playbook-pages button').all())await expect(control).toBeInViewport({ratio:1});
 expect(await page.locator('.callsheet-toolbar').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`test-results/field-goal-any-down-${width}-${height}.png`});await fg.tap();
 await expect(page.locator('#callsheet-overlay')).not.toBeVisible();
 expect(await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return {phase:game.phase,distance:game.kick.distance,clock:game.clock,down:game.down};})).toEqual({phase:'kicking',distance:42,clock:3,down:1});
 expect(errors).toEqual([]);await context.close();
});
