import {test,expect} from '@playwright/test';
test('touch can start a test sound in settings and pause',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});
 const page=await context.newPage();await page.goto('/');await page.locator('#btn-menu-settings').tap();
 await page.locator('#setup-screen [data-audio-test]').tap();
 await expect(page.locator('#setup-screen [data-audio-status]')).toContainText('Test tone sent');
 await page.screenshot({path:'test-results/audio-settings-landscape.png'});
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('#btn-pause').tap();
 await page.locator('#pause-overlay [data-audio-test]').tap();
 await expect(page.locator('#pause-overlay [data-audio-status]')).toContainText('Test tone sent');
 await page.locator('#pause-overlay [data-audio-mute]').tap();await page.locator('#pause-overlay [data-audio-test]').tap();
 await expect(page.locator('#pause-overlay [data-audio-status]')).toContainText('Turn Sound on');
 await context.close();
});
