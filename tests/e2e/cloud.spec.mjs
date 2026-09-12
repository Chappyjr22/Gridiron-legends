import {test,expect} from '@playwright/test';
// Local browser tests use a service stub, not real email delivery or credentials.
test('landscape account entry preserves guest careers and handles unavailable email',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});const page=await context.newPage();
 await page.route('**/api/auth/get-session',r=>r.fulfill({json:null}));
 await page.route('**/api/auth/email-otp/send-verification-otp',r=>r.fulfill({status:503,json:{message:'Email temporarily unavailable. Try again.'}}));
 await page.goto('/');await page.getByRole('button',{name:'Account',exact:true}).tap();await expect(page.locator('#cloud-account')).toBeVisible();
 await page.locator('#cloud-email').fill('player@example.invalid');await page.locator('#cloud-send').tap();await expect(page.locator('#cloud-message')).toContainText('Email temporarily unavailable');await expect(page.locator('#cloud-send')).toBeEnabled();
 await page.screenshot({path:'test-results/cloud-account-landscape.png'});await page.locator('#cloud-close').tap();await page.locator('#btn-practice').tap();await expect(page.locator('#game-view')).toBeVisible();await context.close();
});
test('account conflict keeps both careers and syncs the merged bank',async({page})=>{
 await page.route('**/api/auth/get-session',r=>r.fulfill({json:{user:{id:'account-a',email:'player@example.invalid',emailVerified:true}}}));
 let remote;
 await page.route('**/api/cloud',async r=>{
  if(r.request().method()==='PUT'){const input=r.request().postDataJSON();remote={revision:remote.revision+1,payload:input.payload};return r.fulfill({json:{revision:remote.revision}});}
  return r.fulfill({json:remote||{revision:0,payload:null}});
 });
 await page.goto('/');
 remote=await page.evaluate(async()=>{
  const {createCareer}=await import('/src/career/career.js');const c=createCareer({name:'Conflict QB'});const bank={version:1,lastId:c.careerId,careers:{[c.careerId]:c},recovery:[]};const cloud={revision:2,payload:{gridironLegendsCareersV1:JSON.stringify(bank)}};
  c.xp=9;localStorage.setItem('gridironCloudOwnerV1','account-a');localStorage.setItem('gridironCloudCacheV1:account-a',JSON.stringify({values:{gridironLegendsCareersV1:JSON.stringify(bank)},revision:1,dirty:true,mutation:'device-newer'}));return cloud;
 });
 await page.reload();await page.getByRole('button',{name:'Account',exact:true}).click();await expect(page.locator('#cloud-conflict')).toBeVisible();
 // Keeping both reloads after persistence. Wait for the new document before navigating.
 await Promise.all([page.waitForEvent('load'),page.locator('#cloud-keep-both').click()]);
 await expect.poll(()=>Object.keys(JSON.parse(remote.payload.gridironLegendsCareersV1).careers).length).toBe(2);
 await page.locator('#btn-career').click();await page.locator('#career-my-careers').click();await expect(page.locator('#career-list button')).toHaveCount(2);
});
