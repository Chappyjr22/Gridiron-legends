import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:932,height:430}]){
 test(`complete secondary menu review ${viewport.width}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shot=async(name)=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`test-results/review-${name}-${viewport.width}.png`});};
  await page.goto('/');await page.locator('#btn-menu-settings').tap();await shot('settings');
  await page.locator('#setup-screen [data-open-guide]').tap();await shot('guide');await expect(page.locator('#practice-guide-heading')).toBeInViewport({ratio:1});await page.locator('#practice-guide-close').tap();await page.locator('#btn-setup-close').tap();
  await page.locator('#btn-new-game').tap();await shot('quickplay');await expect(page.locator('#btn-start-play')).toBeInViewport({ratio:1});await page.locator('.roster-details summary').tap();await shot('quick-roster');await page.locator('#btn-setup-close').tap();
  await page.locator('#btn-extras').tap();await shot('extras');await page.locator('#btn-league-hub').tap();await shot('league');await page.locator('#btn-week-next').tap();await expect(page.locator('#league-week-title')).toContainText('2');await page.locator('#btn-league-close').tap();
  await page.locator('#btn-extras').tap();await page.locator('#btn-start-editor').tap();await shot('formation-lab');const toolbar=await page.locator('#edit-panel').boundingBox();expect(toolbar.height).toBeLessThan(65);await page.locator('#btn-formation-data').tap();await shot('formation-data');await page.locator('#btn-close-formation-data').tap();await page.locator('#btn-done-edit').tap();
  await page.locator('[data-open-account]').first().tap();await shot('account');await page.locator('#cloud-close').tap();
  await page.locator('#btn-career').tap();await shot('career-gateway');await expect(page.locator('#career-gateway-back')).toBeInViewport({ratio:1});await page.locator('#career-my-careers').tap();await shot('career-list');await page.locator('#career-list-back').tap();
  await page.locator('#career-gateway-backups').tap();await shot('recovery');await page.locator('#career-close-backups').tap();
  expect(errors).toEqual([]);await context.close();
 });
}
