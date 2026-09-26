import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375],[844,390]])test(`compact settings sections fit ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#btn-menu-settings').tap();
 for(const root of ['#setup-screen','#pause-overlay']){
  if(root==='#pause-overlay'){await page.locator('#btn-setup-close').tap();await page.locator('#btn-practice').tap();await page.locator('#btn-pause').tap();}
  const shell=page.locator(root),scroll=shell.locator('.setup-scroll,.pause-scroll');
  for(const section of ['gameplay','sound','help']){
   await shell.locator(`[data-settings-page=${section}]`).tap();
   await expect(shell.locator(`[data-settings-page=${section}]`)).toHaveAttribute('aria-pressed','true');
   const selectors=section==='gameplay'?['[data-diff=gridiron]','[data-mode=tap]','[data-type=bullet]','[data-routes=off]']:section==='sound'?['[data-audio-mute]','[data-audio-test]','[data-audio-volume=effects]','[data-audio-volume=crowd]']:['[data-open-guide]'];
   for(const selector of selectors)await expect(shell.locator(selector)).toBeInViewport({ratio:1});
   expect(await scroll.evaluate(e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1)).toBe(true);
   await expect(shell.locator(root==='#setup-screen'?'#btn-setup-back':'#btn-resume')).toBeInViewport({ratio:1});
   await page.screenshot({path:`test-results/settings-${root.slice(1)}-${section}-${width}-${height}.png`});
  }
  await shell.locator('[data-open-guide]').tap();await expect(page.locator('#practice-guide')).toBeVisible();await page.locator('#practice-guide-close').tap();
  await shell.locator('[data-settings-page=gameplay]').tap();await shell.locator('[data-mode=direct]').tap();await expect(shell.locator('[data-mode=direct]')).toHaveAttribute('aria-pressed','true');
 }
 await page.locator('#btn-resume').tap();await expect(page.locator('#pause-overlay')).not.toBeVisible();expect(errors).toEqual([]);await context.close();
});
