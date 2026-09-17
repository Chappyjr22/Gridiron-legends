import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:932,height:430},{width:390,height:740}]){
 test(`gameplay menu layout ${viewport.width}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`test-results/game-menu-${name}-${viewport.width}.png`,animations:'disabled'});};
  await page.goto('/');await page.locator('#btn-new-game').tap();await shot('quickplay');
  await expect(page.locator('#team-select')).toBeInViewport({ratio:1});await expect(page.locator('#opponent-select')).toBeInViewport({ratio:1});await expect(page.locator('#btn-start-play')).toBeInViewport({ratio:1});
  await page.locator('#btn-start-play').tap();await shot('playbook');await expect(page.locator('#formation-tabs')).toBeInViewport({ratio:1});
  if(viewport.width>viewport.height){await expect(page.locator('#play-page-next')).toBeInViewport({ratio:1});await page.locator('#play-page-next').tap();await expect(page.locator('#play-page-label')).toHaveText('2 / 2');}
  await page.locator('.play-btn').first().tap();await page.locator('#btn-pause').tap();await shot('pause');
  await expect(page.locator('#btn-close-settings')).toBeInViewport({ratio:1});await expect(page.locator('#btn-resume')).toBeInViewport({ratio:1});
  await page.locator('#pause-overlay [data-mode="tap"]').tap();await page.locator('#pause-overlay [data-diff="easy"]').tap();await shot('pause-controls');
  await expect(page.locator('#btn-close-settings')).toBeInViewport({ratio:1});await expect(page.locator('#btn-resume')).toBeInViewport({ratio:1});
  await page.locator('#btn-resume').tap();await expect(page.locator('#pause-overlay')).not.toBeVisible();expect(errors).toEqual([]);await context.close();
 });
}
test('sprite inspector exports reversible labels tied to immutable source',async({page})=>{
 await page.goto('/tools/sprite-mask-editor.html');await expect(page.locator('#status')).toContainText('sprites.png');
 await page.locator('#frame').selectOption('2');await page.locator('#zoom').selectOption('8');await page.locator('#tool').selectOption('fill');
 // Source row 0, column 2 has a visible helmet near local x30,y19.
 const canvas=page.locator('#canvas');await canvas.click({position:{x:30*8+4,y:19*8+4}});
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await download.saveAs('test-results/sprite-mask-sample.json');
 await expect(page.locator('#status')).toContainText('Labels are review data only');await page.screenshot({path:'test-results/sprite-inspector.png'});
 await page.locator('#undo').click();await expect(page.locator('#status')).toContainText('0/');
});
