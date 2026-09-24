import {test,expect} from '@playwright/test';
// Local browser tests use a service stub, not real email delivery or credentials.
test('landscape account entry preserves guest careers and handles unavailable email',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});const page=await context.newPage();
 await page.route('**/api/auth/get-session',r=>r.fulfill({json:null}));
 await page.route('**/api/auth/email-otp/send-verification-otp',r=>r.fulfill({status:503,json:{message:'Email temporarily unavailable. Try again.'}}));
 await page.goto('/');await page.getByRole('button',{name:'Account',exact:true}).tap();await expect(page.locator('#cloud-account')).toBeVisible();
 await page.locator('[data-auth-mode=code]').tap();await page.locator('#cloud-email').fill('player@example.invalid');await page.locator('#cloud-send').tap();await expect(page.locator('#cloud-message')).toContainText('Email temporarily unavailable');await expect(page.locator('#cloud-send')).toBeEnabled();
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

for(const viewport of [{width:844,height:304},{width:667,height:375}])test(`password sign-in and returning session at ${viewport.width}x${viewport.height}`,async({browser})=>{
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage();let signedIn=false,login;
 const user={id:'password-player',email:'player@example.invalid',emailVerified:true};
 await page.route('**/api/auth/get-session',r=>r.fulfill({json:signedIn?{user}:null}));
 await page.route('**/api/auth/sign-in/email',r=>{login=r.request().postDataJSON();signedIn=true;return r.fulfill({json:{user}});});
 await page.route('**/api/cloud',r=>r.fulfill({json:{revision:0,payload:null}}));
 await page.goto('/');await page.getByRole('button',{name:'Account',exact:true}).tap();
 await expect(page.locator('#cloud-google')).toBeInViewport({ratio:1});
 await page.locator('#cloud-email').fill(user.email);await page.locator('#cloud-password').fill('my-test-password');
 await page.locator('#cloud-submit').scrollIntoViewIfNeeded();await expect(page.locator('#cloud-submit')).toBeInViewport({ratio:1});
 await page.screenshot({path:`test-results/account-password-${viewport.width}.png`});
 await Promise.all([page.waitForEvent('load'),page.locator('#cloud-submit').tap()]);
 expect(login).toEqual({email:user.email,password:'my-test-password',rememberMe:true});
 await expect(page.locator('#cloud-signed-in')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('my-test-password');
 await page.reload();await page.getByRole('button',{name:'Account',exact:true}).tap();await expect(page.locator('#cloud-login')).toBeHidden();await expect(page.locator('#cloud-email-label')).toHaveText(user.email);await context.close();
});

test('signup verifies once and recovery returns to password sign-in',async({page})=>{
 const calls=[];await page.route('**/api/auth/**',r=>{const path=new URL(r.request().url()).pathname;calls.push({path,body:r.request().postDataJSON()});return r.fulfill({json:path.endsWith('get-session')?null:path.endsWith('sign-up/email')?{user:{emailVerified:false}}:{success:true}});});
 await page.goto('/');await page.getByRole('button',{name:'Account',exact:true}).click();await page.locator('[data-auth-mode=signup]').click();
 await page.locator('#cloud-email').fill('new@example.invalid');await page.locator('#cloud-password').fill('signup-password');await page.locator('#cloud-submit').click();
 await expect(page.locator('#cloud-code')).toBeVisible();expect(calls.some(c=>c.path.endsWith('send-verification-otp')&&c.body.type==='email-verification')).toBe(true);
 await page.locator('#cloud-code').fill('123456');await page.locator('#cloud-submit').click();await expect(page.locator('#cloud-message')).toContainText('Email verified');
 await page.locator('[data-auth-mode=forgot]').click();await page.locator('#cloud-submit').click();await expect(page.locator('#cloud-message')).toContainText('recovery code');
 await page.locator('#cloud-code').fill('654321');await page.locator('#cloud-password').fill('replacement-password');await page.locator('#cloud-submit').click();await expect(page.locator('#cloud-message')).toContainText('Password saved');
 expect(calls.find(c=>c.path.endsWith('/email-otp/reset-password')).body).toEqual({email:'new@example.invalid',otp:'654321',password:'replacement-password'});await expect(page.locator('#cloud-password')).toHaveValue('');
});

test('Google return opens the account and a cancelled return remains recoverable',async({page})=>{
 let signedIn=false;const user={id:'google-player',email:'google@example.invalid',emailVerified:true};
 await page.route('**/api/auth/get-session',r=>r.fulfill({json:signedIn?{user}:null}));await page.route('**/api/cloud',r=>r.fulfill({json:{revision:0,payload:null}}));
 await page.route('**/api/auth/sign-in/social',r=>{signedIn=true;return r.fulfill({json:{url:'https://google-flow.invalid/authorize'}});});
 await page.route('https://google-flow.invalid/authorize',r=>r.fulfill({status:302,headers:{Location:'http://127.0.0.1:5174/?account=signed-in'}}));
 await page.goto('/');await page.getByRole('button',{name:'Account',exact:true}).click();await page.locator('#cloud-google').click();await expect(page.locator('#cloud-signed-in')).toBeVisible();
 await expect(page.locator('#cloud-email-label')).toHaveText(user.email);expect(page.url()).not.toContain('account=');
 signedIn=false;await page.evaluate(()=>localStorage.removeItem('gridironCloudOwnerV1'));await page.goto('/?account=error');await expect(page.locator('#cloud-message')).toContainText('cancelled');await expect(page.locator('#cloud-google')).toBeEnabled();
});
