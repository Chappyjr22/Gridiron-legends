import {test,expect} from '@playwright/test';
async function assertInViewport(page,selector){
 const boxes=await page.locator(selector).evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
 const viewport=page.viewportSize();
 for(const box of boxes){expect(box.x,box.id).toBeGreaterThanOrEqual(0);expect(box.y,box.id).toBeGreaterThanOrEqual(0);expect(box.right,box.id).toBeLessThanOrEqual(viewport.width+1);expect(box.bottom,box.id).toBeLessThanOrEqual(viewport.height+1);expect(box.h,box.id).toBeGreaterThanOrEqual(36);}
}
for(const viewport of [{width:844,height:304},{width:844,height:390},{width:932,height:430},{width:1366,height:768}]){
 test(`stadium and career fit ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,hasTouch:true});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.game-wordmark')).toBeVisible();
  expect(await page.locator('.game-wordmark').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  await assertInViewport(page,'#start-screen button');
  await page.screenshot({path:`test-results/ui-title-${viewport.width}.png`});
  await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Start new career',exact:true}).tap();
  await page.getByLabel('Player name',{exact:true}).fill('Jacob Chapman');
  await page.getByLabel('Difficulty',{exact:true}).selectOption('easy');
  await page.getByRole('button',{name:'Begin rookie season'}).tap();
  await expect(page.locator('#career-player-name')).toHaveText('Jacob Chapman');
  await expect(page.locator('#career-jersey-number')).toHaveText('7');
  await expect(page.locator('#career-home-panel')).toBeVisible();
  await assertInViewport(page,'#career-back,#career-play,#career-open-player,.career-nav button');
  const playBox=await page.locator('#career-play').boundingBox(),navBox=await page.locator('.career-nav').boundingBox();expect(playBox.y+playBox.height).toBeLessThanOrEqual(navBox.y);
  await page.screenshot({path:`test-results/ui-career-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('#career-upgrades')).toBeVisible();
  await page.getByRole('tab',{name:'League',exact:true}).tap();await expect(page.locator('#career-standings')).toBeVisible();
  await page.getByRole('tab',{name:'Home',exact:true}).tap();
  await page.getByRole('button',{name:'Save & backup',exact:true}).tap();await expect(page.locator('#career-backups')).toBeVisible();
  await page.locator('#career-close-backups').tap();
  await page.getByRole('button',{name:'Play next game'}).tap();
  await assertInViewport(page,'#btn-pause');
  expect(await page.locator('.topbar').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/scorebug-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('button',{name:'Pause',exact:true}).tap();
  await expect(page.locator('#pause-overlay [data-diff="easy"]')).toHaveClass(/active/);
  expect(errors).toEqual([]);await context.close();
 });
}
