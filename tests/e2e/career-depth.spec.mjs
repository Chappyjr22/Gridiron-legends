import {test,expect} from '@playwright/test';
for(const height of [304,390])test(`scramble and career depth at 844x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Start new career',exact:true}).tap();await page.getByLabel('Player name',{exact:true}).fill('Depth Test');await page.getByRole('button',{name:'Next',exact:true}).tap();await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();
 await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('#career-upgrades button')).toHaveCount(4);for(const b of await page.locator('#career-upgrades button').all())await expect(b).toBeInViewport({ratio:1});await page.screenshot({path:`test-results/development-${height}.png`});
 await page.getByRole('tab',{name:'Home',exact:true}).tap();await page.getByRole('button',{name:'Play next game',exact:true}).tap();
 for(let i=0;i<4&&!await page.locator('#callsheet-overlay').isVisible();i++){await page.waitForTimeout(450);await page.locator('#btn-continue').tap();}
 await page.locator('.play-btn').first().tap();await expect(page.getByRole('button',{name:'Tuck & Run',exact:true})).toBeInViewport({ratio:1});await page.screenshot({path:`test-results/scramble-presnap-${height}.png`});await page.getByRole('button',{name:'Tuck & Run',exact:true}).tap();
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.scrambling;})).toBe(true);
 await expect(page.getByRole('button',{name:'Tuck & Run',exact:true})).toBeHidden();await page.screenshot({path:`test-results/scramble-live-${height}.png`});
 expect(errors).toEqual([]);await context.close();
});
