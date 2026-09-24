import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375],[844,390]])test(`draft report and award payoff fit ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),{emptyStats}=await import('/src/career/stats.js');
  const c=C.createCareer({name:'Draft Star',schoolId:'college-bluegrass'});
  while(!c.postseason?.champion){const g=C.nextMatch(c);c.activeMatch=g.id;C.completeCareerGame(c,g.id,35,7,{players:{[c.playerId]:{...emptyStats(),attempts:12,completions:11,passingYards:180,passingTD:3}},plays:[]});}
  c.pendingRecapGameId=null;C.saveCareer(c);
 });
 async function open(){await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Continue last career',exact:true}).tap();await page.getByRole('button',{name:/Enter the draft|View draft selection/,exact:true}).tap();}
 await page.reload();await open();
 const dialog=page.locator('#draft-dialog');await expect(dialog).toBeVisible();
 for(const tab of ['Season','Scouting','Draft','Rookie']){
  await dialog.getByRole('tab',{name:tab,exact:true}).tap();await expect(dialog.getByRole('tab',{name:tab,exact:true})).toHaveAttribute('aria-selected','true');
  await expect(dialog.getByRole('button',{name:'Begin pro career',exact:true})).toBeInViewport({ratio:1});
  expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/draft-${tab.toLowerCase()}-${width}-${height}.png`});
 }
 await dialog.getByRole('tab',{name:'Scouting',exact:true}).tap();await expect(page.locator('#draft-panel-scouting')).toContainText('College MVP');await expect(page.locator('#draft-panel-scouting')).toContainText('National championship');
 const selected=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')).draft.pick);
 await page.reload();await open();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')).draft.pick)).toBe(selected);
 await dialog.getByRole('button',{name:'Begin pro career',exact:true}).tap();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')));expect(saved.stage).toBe('pro');expect(saved.collegeArchive.draftReport.projection.boosts).toHaveLength(2);expect(saved.proEntry.expectations).toHaveLength(3);
 expect(errors).toEqual([]);await context.close();
});
