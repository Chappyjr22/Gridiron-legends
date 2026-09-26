import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375],[844,390]])test(`compact playbook leaves field visible ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#btn-practice').tap();
 const overlay=page.locator('#callsheet-overlay');
 for(const formation of ['trips','ace','pistol']){
  await page.locator(`[data-formation=${formation}]`).tap();
  await expect(page.locator('#play-page-label')).toHaveText('1 / 2');
  for(let n=0;n<2;n++){
   await expect(page.locator('#callsheet-grid .play-btn')).toHaveCount(3);
   for(const card of await page.locator('#callsheet-grid .play-btn').all())await expect(card).toBeInViewport({ratio:1});
   expect(await overlay.locator('.card-body').evaluate(e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1)).toBe(true);
   const box=await overlay.locator('.card').boundingBox();expect(box.y).toBeGreaterThan(height*.25);
   await expect(page.locator('#btn-pause')).toBeInViewport({ratio:1});
   if(!n)await page.locator('#play-page-next').tap();
  }
 }
 await page.screenshot({path:`test-results/playbook-compact-${width}-${height}.png`});
 await page.locator('#callsheet-grid .play-btn').first().tap();await expect(overlay).not.toBeVisible();
 // Keep the late-game field goal reachable alongside the formations.
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{renderFormationMenu}=await import('/src/ui/playbook.js');game.practice=false;game.phase='callsheet';game.los=80;game.quarter=4;game.clock=3;renderFormationMenu();document.getElementById('callsheet-overlay').classList.add('show');});
 await expect(page.locator('#playbook-field-goal')).toBeEnabled();await expect(page.locator('#playbook-field-goal')).toBeInViewport({ratio:1});
 expect(await overlay.locator('.callsheet-toolbar').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`test-results/playbook-kicking-${width}-${height}.png`});
 expect(errors).toEqual([]);await context.close();
});
