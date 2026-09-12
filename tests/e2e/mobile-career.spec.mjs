import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:844,height:390},{width:932,height:370}]){
 test(`college player panel scrolls with fixed navigation at ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');
  await page.getByRole('button',{name:'Career Mode',exact:true}).tap();
  await page.getByRole('button',{name:'Start new career',exact:true}).tap();
  await page.getByLabel('Player name',{exact:true}).fill('Mobile QB');
  await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();
  await page.getByRole('tab',{name:'Player',exact:true}).tap();
  const panel=page.locator('#career-player-panel');
  const checkLayout=async()=>{
   const bounds=await panel.boundingBox(),nav=await page.locator('.career-nav').boundingBox();
   expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(nav.y);
   expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   for(const b of await page.locator('.career-nav button').all())expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  };
  await checkLayout();
  await expect(page.getByRole('heading',{name:'Road to the draft',exact:true})).toBeInViewport();
  await page.screenshot({path:`test-results/mobile-player-${viewport.width}-${viewport.height}.png`});
  await page.locator('.scouting-help summary').tap();await expect(page.locator('.scouting-help')).toHaveAttribute('open','');
  // Scrolling long content must not move the navigation or strand the next tab.
  await panel.evaluate(e=>{e.scrollTop=e.scrollHeight;});await checkLayout();
  expect(await panel.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('tab',{name:'My Team',exact:true}).tap();
  await page.getByRole('tab',{name:'Player',exact:true}).tap();
  expect(await panel.evaluate(e=>e.scrollTop)).toBe(0);
  await expect(page.getByRole('heading',{name:'Road to the draft',exact:true})).toBeInViewport();
  await context.close();
 });
}
