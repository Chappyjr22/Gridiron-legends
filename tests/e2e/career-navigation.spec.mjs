import {test,expect} from '@playwright/test';
test('career submenu creates and switches independent saves',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Career Mode',exact:true}).click();
 await expect(page.getByRole('button',{name:'Continue last career',exact:true})).toBeDisabled();
 for(const name of ['First QB','Second QB']){
  await page.getByRole('button',{name:'Start new career',exact:true}).click();await page.getByLabel('Career starting point',{exact:true}).selectOption('pro');await page.getByLabel('Player name',{exact:true}).fill(name);await page.getByRole('button',{name:'Begin rookie season'}).click();await expect(page.locator('#career-player-name')).toHaveText(name);
  await page.getByRole('button',{name:'Main menu',exact:true}).click();await page.getByRole('button',{name:'Career Mode',exact:true}).click();
 }
 await page.getByRole('button',{name:'My careers',exact:true}).click();await expect(page.locator('#career-list button')).toHaveCount(2);
 await page.locator('#career-list button').filter({hasText:'First QB'}).click();await expect(page.locator('#career-player-name')).toHaveText('First QB');
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();await expect(page.locator('#career-player-name')).toHaveText('First QB');
 await page.getByRole('tab',{name:'Player',exact:true}).click();await page.locator('#career-stat-scope').selectOption('last');await expect(page.locator('#career-qb-stats')).toContainText('No completed game');
});
test('short landscape playbook pages without losing formation',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});const page=await context.newPage();await page.goto('/');await page.locator('#btn-practice').tap();
 await expect(page.locator('[data-play]')).toHaveCount(3);await page.locator('.formation-tab').nth(1).tap();await page.getByRole('button',{name:'Next plays',exact:true}).tap();await expect(page.locator('#play-page-label')).toHaveText('2 / 2');await expect(page.locator('.formation-tab[aria-pressed=true]')).toHaveText('Ace');await page.screenshot({path:'test-results/playbook-844-304.png'});await context.close();
});
