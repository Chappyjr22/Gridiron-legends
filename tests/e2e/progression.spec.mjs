import {test,expect} from '@playwright/test';
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
