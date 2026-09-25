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
 await expect(panel).toContainText('70.0%');await expect(panel).toContainText('Protect the ball');
 await expect(dialog.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
 expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`test-results/rookie-goals-${width}-${height}.png`});
 await panel.locator('.rookie-review summary').tap();await expect(panel.getByRole('heading',{name:'Focus for the second half'})).toBeHidden();
 await panel.locator('.rookie-review summary').tap();await panel.getByRole('heading',{name:'Focus for the second half'}).scrollIntoViewIfNeeded();
 await expect(dialog.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
 await page.screenshot({path:`test-results/rookie-review-${width}-${height}.png`});
 const review=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')).rookieSeason.review);
 await page.reload();await open();await expect(panel).toContainText('Protect the ball');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')).rookieSeason.review)).toEqual(review);
 await dialog.getByRole('button',{name:'Back to Player',exact:true}).tap();await expect(dialog).toBeHidden();
 expect(errors).toEqual([]);await context.close();
});
