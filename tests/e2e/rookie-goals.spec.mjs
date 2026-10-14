import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375],[844,390]])test(`rookie goals and coach review fit ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),c=C.createCareer({name:'Rookie Goals'});
  for(let i=0;i<9;i++){const g=C.nextMatch(c);c.activeMatch=g.id;C.completeCareerGame(c,g.id,i<5?21:7,i<5?7:21,{players:{[c.playerId]:{attempts:20,completions:14,interceptions:1}},plays:[]});}
  c.pendingRecapGameId=null;C.saveCareer(c);
 });
 async function open(){
  await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Continue last career',exact:true}).tap();
  await page.getByRole('tab',{name:'Player',exact:true}).tap();await page.getByRole('button',{name:'Career story',exact:true}).tap();
 }
 await page.reload();await open();
 const panel=page.locator('#rookie-progress'),dialog=page.locator('#career-progress-dialog');
 await expect(panel).toContainText('9/17 games');await expect(panel).toContainText('5 / 7 wins');
 await expect(panel).toContainText('70.0%');
 await expect(dialog.getByRole('button',{name:'Pro Journey',exact:true})).toHaveAttribute('aria-pressed','true');
 for(const card of await panel.locator('.rookie-goals>li').all())await expect(card).toBeInViewport({ratio:1});
 for(const button of await panel.locator('[data-journey-view]').all()){const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);}
 await expect(dialog.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
 expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`test-results/rookie-goals-${width}-${height}.png`});
 await expect(panel.getByRole('heading',{name:'Focus for the second half'})).toBeHidden();
 await panel.getByRole('button',{name:'Coach',exact:true}).tap();
 await expect(panel.locator('#journey-season')).toBeHidden();
 await expect(panel.locator('#journey-coach')).toBeVisible();
 await expect(panel.locator('#journey-coach')).toContainText('Coach confidence');
 await expect(panel.locator('#journey-coach')).toContainText('Renewal outlook:');
 await expect(panel.locator('#journey-coach')).toContainText('Last game · S1 W9');
 await expect(panel.locator('#journey-coach')).toContainText('Protect the ball');
 await page.screenshot({path:`test-results/pro-journey-coach-${width}-${height}.png`});
 await panel.locator('.rookie-review summary').tap();await panel.getByRole('heading',{name:'Focus for the second half'}).scrollIntoViewIfNeeded();
 await expect(dialog.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
 await expect(panel.getByRole('button',{name:'Season',exact:true})).toBeInViewport({ratio:1});
 await page.screenshot({path:`test-results/rookie-review-${width}-${height}.png`});
 await page.locator('[data-story-view=goals]').tap();await expect(page.locator('#story-goals')).toBeVisible();await expect(panel).not.toBeVisible();
 await page.screenshot({path:`test-results/story-goals-${width}-${height}.png`});
 await page.locator('[data-story-view=honors]').tap();await expect(page.locator('#story-honors')).toBeVisible();await expect(page.locator('#story-goals')).not.toBeVisible();
 await expect(dialog.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
 await page.screenshot({path:`test-results/story-honors-${width}-${height}.png`});
 await page.locator('[data-story-view=progress]').tap();await expect(panel).toBeVisible();
 const review=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')).rookieSeason.review);
 await page.reload();await open();await expect(panel).toContainText('70.0%');
 await panel.getByRole('button',{name:'Coach',exact:true}).tap();await expect(panel).toContainText('Protect the ball');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')).rookieSeason.review)).toEqual(review);
 await dialog.getByRole('button',{name:'Back to Player',exact:true}).tap();await expect(dialog).toBeHidden();
 expect(errors).toEqual([]);await context.close();
});

test('later pro seasons keep Coach available without inventing season targets',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),c=C.createCareer({name:'Veteran Journey'});
  c.league.season=3;c.rookieSeason=null;c.coachConfidence=85;C.saveCareer(c);
 });
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
 await page.getByRole('tab',{name:'Player',exact:true}).click();await page.getByRole('button',{name:'Career story',exact:true}).click();
 const panel=page.locator('#rookie-progress');
 await expect(panel.locator('#journey-coach')).toBeVisible();await expect(panel).toContainText('85%');
 await panel.getByRole('button',{name:'Season',exact:true}).click();await expect(panel.locator('#journey-season')).toContainText('No rookie record available');
 await expect(panel.locator('.rookie-goals')).toHaveCount(0);
});
