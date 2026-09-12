import {test,expect} from '@playwright/test';
test('desktop field fits the available width and guided practice remains playable',async({page})=>{
 await page.setViewportSize({width:1363,height:936});await page.goto('/');await page.locator('#btn-menu-settings').click();await page.locator('#setup-screen [data-open-guide]').click();await expect(page.locator('#practice-guide')).toBeVisible();await page.locator('#practice-guide-start').click();
 await expect(page.locator('#practice-coach')).toContainText('Lead your receiver');await expect.poll(async()=>{const b=await page.locator('#field').boundingBox();return b.width;}).toBeGreaterThan(1100);
 const field=await page.locator('#field').boundingBox();await page.mouse.move(field.x+field.width*.65,field.y+field.height*.5);await page.mouse.down();await page.mouse.move(field.x+field.width*.8,field.y+field.height*.5,{steps:5});await page.mouse.up();
 await expect(page.locator('#practice-coach-next')).toBeVisible();await page.locator('#practice-coach-next').click();await expect(page.locator('#practice-coach')).toContainText('Make a defender miss');await page.screenshot({path:'test-results/audit-desktop-practice.png'});
});
test('short landscape settings retain sound controls and keyboard focus',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('#btn-pause').tap();
 await page.locator('#pause-overlay [data-audio-mute]').tap();await expect(page.locator('#pause-overlay [data-audio-mute]')).toHaveAttribute('aria-pressed','false');
 await page.locator('#pause-overlay [data-mode="direct"]').tap();await expect(page.locator('#pause-overlay [data-mode="direct"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#btn-resume').focus();await page.keyboard.press('Tab');await expect(page.locator('#btn-close-settings')).toBeFocused();
 await page.screenshot({path:'test-results/audit-landscape-pause.png'});await page.reload();await page.locator('#btn-menu-settings').tap();await expect(page.locator('#setup-screen [data-audio-mute]')).toHaveText('Sound off');await expect(page.locator('#setup-screen [data-mode="direct"]')).toHaveAttribute('aria-pressed','true');await context.close();
});
test('a damaged checkpoint leaves other slots usable and exposes recovery',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),{SLOTS_KEY}=await import('/src/career/slots.js');const good=C.createCareer({name:'Healthy QB'}),bad=C.createCareer({name:'Recover QB'});bad.activeMatch=C.nextMatch(bad).id;bad.checkpoint={game:{},stats:{},resume:{type:'offense'}};
  localStorage.setItem(SLOTS_KEY,JSON.stringify({version:1,lastId:bad.careerId,careers:{[good.careerId]:good,[bad.careerId]:bad}}));
 });await page.reload();await page.locator('#btn-career').click();await expect(page.locator('#career-continue-last')).toBeEnabled();await expect(page.locator('#career-gateway-error')).toContainText('need recovery');await page.locator('#career-gateway-backups').click();await page.getByRole('button',{name:'Recover without unfinished game',exact:true}).click();await expect(page.locator('#career-recovery-list')).toContainText('Recovered as a separate career');await page.locator('#career-close-backups').click();await page.locator('#career-my-careers').click();await expect(page.locator('#career-list button')).toHaveCount(2);
});
