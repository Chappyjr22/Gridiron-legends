import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:390,height:740}]){
 test(`player creation keeps its action visible at ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');
  await page.getByRole('button',{name:'Career Mode',exact:true}).tap();
  await page.getByRole('button',{name:'Start new career',exact:true}).tap();
  const action=page.locator('#career-begin'),fields=page.locator('.enrollment-fields');
  await expect(action).toBeInViewport({ratio:1});
  expect(await fields.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.getByLabel('Player name',{exact:true}).fill('Touch QB');
  await page.getByLabel('Jersey number',{exact:true}).fill('12');
  await page.screenshot({path:`test-results/create-player-${viewport.width}-${viewport.height}.png`});
  await page.getByLabel('Quarter length',{exact:true}).selectOption('3');
  await page.getByRole('button',{name:'Choose your school',exact:true}).tap();
  await expect(page.locator('#school-dialog')).toBeVisible();
  await page.locator('#school-confirm').tap();
  await expect(action).toBeInViewport({ratio:1});
  await page.screenshot({path:`test-results/create-school-${viewport.width}-${viewport.height}.png`});
  await page.getByLabel('Career starting point',{exact:true}).selectOption('pro');
  await expect(page.locator('#career-team')).toBeVisible();
  await expect(action).toHaveText('Begin rookie season');
  await page.getByLabel('Career starting point',{exact:true}).selectOption('college');
  await expect(action).toHaveText('Begin senior season');
  await action.tap();await expect(page.locator('#career-header-name')).toHaveText('Touch QB');
  await context.close();
 });
}
