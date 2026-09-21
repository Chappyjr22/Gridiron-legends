import {test,expect} from '@playwright/test';
for(const height of [304,390])test(`college rewards stay readable and consistent after reload at 844x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height},hasTouch:true,isMobile:true}),page=await context.newPage();
 await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),{emptyStats}=await import('/src/career/stats.js');
  const c=C.createCareer({name:'Reward Check',schoolId:'college-bluegrass',development:'fast',difficulty:'medium'}),m=C.nextMatch(c);
  c.activeMatch=m.id;
  C.completeCareerGame(c,m.id,12,7,{players:{[c.playerId]:{...emptyStats(),attempts:11,completions:7,passingYards:86,passingTD:1}},plays:[]});
  C.saveCareer(c);
 });
 await page.reload();await resume(page);
 const recap=page.locator('#postgame-dialog');await expect(recap).toBeVisible();
 await expect(recap).toContainText('+252 XP');await expect(recap).toContainText('6 upgrade points earned.');
 await expect(recap.getByRole('heading',{name:/Weekly (goal|objective)/})).toHaveCount(1);
 await expect(recap.locator('.career-list-row').first()).toHaveCSS('color','rgb(24, 42, 64)');
 const continueButton=page.getByRole('button',{name:'Continue to career',exact:true});await expect(continueButton).toBeInViewport({ratio:1});
 expect(await recap.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`test-results/college-rewards-${height}.png`});
 await continueButton.tap();await expect(page.locator('#career-result-xp')).toHaveText('+252 XP · 6 upgrade points earned');
 await page.getByRole('tab',{name:'Player',exact:true}).tap();
 await expect(page.locator('#upgrade-status')).toHaveText('6 upgrade points available');
 await page.getByRole('button',{name:'Upgrade accuracy by 2 for 1 points',exact:true}).tap();
 await expect(page.locator('[data-upgrade="accuracy"] strong')).toHaveText('68');
 await page.reload();await resume(page);await page.getByRole('tab',{name:'Player',exact:true}).tap();
 await expect(page.locator('#upgrade-status')).toHaveText('5 upgrade points available');
 await expect(page.locator('[data-upgrade="accuracy"] strong')).toHaveText('68');
 await page.getByRole('tab',{name:'Home',exact:true}).tap();await page.getByRole('button',{name:'View recap',exact:true}).tap();
 await expect(recap).toContainText('6 upgrade points earned.');await continueButton.tap();
 await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('#upgrade-status')).toHaveText('5 upgrade points available');
 await context.close();
});
async function resume(page){await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();}
test('mobile enrollment separates development from school and preserves the choice',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Start new career',exact:true}).tap();
 await page.getByLabel('Player name',{exact:true}).fill('Growth Rookie');await page.getByRole('button',{name:'Next',exact:true}).tap();
 await expect(page.locator('#career-development-note')).toContainText('Steady development');
 await page.getByLabel('Development speed',{exact:true}).selectOption('fast');await expect(page.locator('#career-development-note')).toContainText('Fast development');
 await expect(page.locator('#chosen-school-attributes')).toContainText('College overall 73');
 await page.screenshot({path:'test-results/development-enrollment-mobile.png'});
 await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();await page.getByRole('tab',{name:'Player',exact:true}).tap();
 await expect(page.locator('#career-points')).toContainText('Fast development');await expect(page.locator('#college-progress')).toContainText('Projected pro overall');
 await page.reload();await resume(page);await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('#career-points')).toContainText('Fast development');
 expect(errors).toEqual([]);await context.close();
});
test('mobile draft previews 99 to 85 and archives college abilities',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),{normalizeQuarterback}=await import('/src/career/development.js');
  const c=C.createCareer({name:'Campus Star',schoolId:'college-cypress',development:'fast'}),p=C.careerPlayer(c);
  for(const k of Object.keys(p.attributes))p.attributes[k]=99;normalizeQuarterback(p);
  c.postseason={champion:c.teamId,games:[],round:3,seeds:[]};C.saveCareer(c);
 });
 await page.reload();await resume(page);await page.getByRole('button',{name:'Enter the draft',exact:true}).tap();
 await expect(page.locator('#draft-selection')).toContainText('College overall 99 → Pro overall 85');
 const begin=page.getByRole('button',{name:'Begin pro career',exact:true});await expect(begin).toBeInViewport({ratio:1});
 await page.screenshot({path:'test-results/pro-conversion-mobile.png'});await begin.tap();
 await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('[data-upgrade="accuracy"] strong')).toHaveText('85');await expect(page.locator('#college-progress')).toContainText('Final college overall 99');
 await page.reload();await resume(page);await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('[data-upgrade="accuracy"] strong')).toHaveText('85');
 expect(errors).toEqual([]);await context.close();
});
