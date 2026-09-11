import {test,expect} from '@playwright/test';
async function enroll(page){
 await page.goto('/');await page.getByRole('button',{name:'Career Mode',exact:true}).click();
 await page.getByRole('button',{name:'Start new career',exact:true}).click();
 await page.getByLabel('Player name',{exact:true}).fill('Campus Legend');
}
test('college school picker fits short landscape and previews tier attributes',async({browser})=>{
 for(const height of [304,390]){
  const context=await browser.newContext({viewport:{width:844,height},hasTouch:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await enroll(page);await page.getByRole('button',{name:'Choose your school',exact:true}).tap();
  await expect(page.locator('#school-grid button')).toHaveCount(8);
  await expect(page.locator('#school-preview')).toContainText('Accuracy 86');
  await page.locator('[data-school="college-bluegrass"]').tap();
  await expect(page.locator('#school-preview')).toContainText('Accuracy 78');
  const confirm=page.getByRole('button',{name:'Choose this school',exact:true});
  const bounds=await confirm.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
  await page.screenshot({path:`test-results/college-picker-${height}.png`});
  await confirm.tap();await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();
  await expect(page.locator('#career-season')).toContainText('College senior');
  await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('[data-upgrade="accuracy"] strong')).toHaveText('78');
  await page.getByRole('tab',{name:'League',exact:true}).tap();await expect(page.locator('#league-stat-team option')).toHaveCount(33);
  await expect(page.locator('#college-schedule .career-list-row')).toHaveCount(12);
  await page.getByRole('tab',{name:'Home',exact:true}).tap();await page.getByRole('button',{name:'Play next game',exact:true}).tap();
  await expect(page.locator('#hud-user-name')).toHaveText('BGS');
  await page.getByRole('button',{name:'Pause',exact:true}).tap();
  await page.locator('#pause-overlay [data-diff="easy"]').tap();
  await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
  await page.getByRole('button',{name:'Resume game',exact:true}).tap();await expect(page.locator('#hud-user-name')).toHaveText('BGS');
  expect(errors).toEqual([]);await context.close();
 }
});
test('college graduation reveals a persistent draft and starts the pro career',async({page})=>{
 await enroll(page);await page.getByRole('button',{name:'Begin senior season',exact:true}).click();
 // Deterministic season fixture exercises graduation and save/UI boundaries.
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),{emptyStats}=await import('/src/career/stats.js');
  const c=C.loadCareer();let count=0;
  while(!c.postseason?.champion){
   const match=C.nextMatch(c);c.activeMatch=match.id;
   C.completeCareerGame(c,match.id,35,7,{players:{[c.playerId]:{...emptyStats(),attempts:20,completions:17,passingYards:240,passingTD:3}},plays:[]});
   if(++count>15)throw Error('Season did not finish');
  }
  c.pendingRecapGameId=null;if(!C.saveCareer(c))throw Error('Save failed');
 });
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
 await page.getByRole('button',{name:'Enter the draft',exact:true}).click();
 await expect(page.locator('#draft-dialog')).toBeVisible();const selection=await page.locator('#draft-selection').innerText();
 await page.screenshot({path:'test-results/college-draft.png'});
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
 await page.getByRole('button',{name:'View draft selection',exact:true}).click();
 await expect(page.locator('#draft-selection')).toHaveText(selection,{useInnerText:true});
 await page.getByRole('button',{name:'Begin pro career',exact:true}).click();
 await expect(page.locator('#career-season')).toContainText('Season 1');
 await page.getByRole('tab',{name:'Player',exact:true}).click();await expect(page.locator('#college-progress')).toContainText('Your college story');
 await page.getByRole('tab',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Play next game',exact:true}).click();
 expect(await page.locator('#hud-user-name').innerText()).not.toBe('CYP');
});
