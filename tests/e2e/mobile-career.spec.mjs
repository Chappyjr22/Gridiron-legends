import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:844,height:390},{width:932,height:370},{width:390,height:740}]){
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
  await expect(page.getByRole('heading',{name:'Develop your quarterback',exact:true})).toBeInViewport();
  await page.screenshot({path:`test-results/mobile-player-${viewport.width}-${viewport.height}.png`});
  await expect(page.locator('#career-player-sprite')).not.toBeVisible();
  for(const button of await page.locator('#career-upgrades button').all())await expect(button).toBeInViewport({ratio:1});
  await page.getByRole('button',{name:'Career story',exact:true}).tap();
  await expect(page.locator('#career-progress-dialog')).toBeVisible();
  await expect(page.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
  await page.screenshot({path:`test-results/mobile-story-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('button',{name:'Back to Player',exact:true}).tap();
  await page.getByRole('button',{name:'Stats',exact:true}).tap();
  await expect(page.locator('.stat-tiles')).toBeVisible();
  await checkLayout();
  // Scrolling long content must not move the navigation or strand the next tab.
  await panel.evaluate(e=>{e.scrollTop=e.scrollHeight;});await checkLayout();
  if(viewport.height<500)expect(await panel.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('tab',{name:'My Team',exact:true}).tap();
  await page.getByRole('tab',{name:'Player',exact:true}).tap();
  expect(await panel.evaluate(e=>e.scrollTop)).toBe(0);
  await expect(page.getByRole('heading',{name:'Develop your quarterback',exact:true})).toBeInViewport();
  await page.getByRole('tab',{name:'League',exact:true}).tap();
  await page.locator('#league-stat-metric').selectOption('passingTD');
  await expect(page.locator('.leaderboard-caption')).toContainText('Touchdowns');
  expect(await page.locator('#career-league-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/mobile-leaders-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('tab',{name:'Home',exact:true}).tap();
  await expect(page.locator('#career-player-sprite')).toBeVisible();
  await page.screenshot({path:`test-results/mobile-home-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('button',{name:'Save & backup',exact:true}).tap();
  await expect(page.locator('#career-quiet-save')).toBeVisible();
  await context.close();
 });
}
