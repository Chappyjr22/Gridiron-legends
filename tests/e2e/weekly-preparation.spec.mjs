import {test,expect} from '@playwright/test';
async function resume(page){await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();}
for(const [width,height,kind,schoolId] of [[844,304,'teammate','college-bluegrass'],[667,375,'challenge',null],[844,390,'teammate',null]])test(`weekly choices and stakes at ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async schoolId=>{const C=await import('/src/career/career.js');C.saveCareer(C.createCareer({name:'Weekly Test',schoolId}));},schoolId);
 await page.reload();await resume(page);
 await expect(page.locator('#career-stakes')).toContainText(schoolId?'Top two':'Top four');
 const picker=page.getByRole('button',{name:'Weekly preparation',exact:true});
 await expect(page.locator('#career-preparation select')).toHaveCount(0);
 await picker.tap();await expect(picker).toHaveAttribute('aria-expanded','true');
 const menu=page.getByRole('listbox',{name:'Weekly preparation',exact:true});
 await expect(menu).toBeInViewport();
 await page.screenshot({path:`test-results/weekly-dropdown-${width}-${height}.png`});
 await menu.getByRole('option',{name:kind==='teammate'?'Teammate work':'Coach challenge',exact:true}).tap();
 await expect(picker).toHaveAttribute('aria-expanded','false');
 if(kind==='teammate'){
  const teammate=page.getByRole('button',{name:'Work with',exact:true});await teammate.tap();
  const targets=page.getByRole('listbox',{name:'Work with',exact:true});
  await targets.getByRole('option').nth(1).tap();
  await expect(teammate).toHaveAttribute('aria-expanded','false');
 }
 await picker.tap();await page.keyboard.press('Escape');await expect(picker).toHaveAttribute('aria-expanded','false');
 await picker.tap();await page.locator('#career-page-title').tap();await expect(picker).toHaveAttribute('aria-expanded','false');
 if(kind==='teammate')await expect(page.locator('#career-goal-reward')).toHaveText('+1 CATCHING');
 else await expect(page.locator('#career-preparation')).toContainText('+2 extra coach confidence');
 await page.reload();await resume(page);await expect(page.getByRole('button',{name:'Weekly preparation',exact:true})).toContainText(kind==='teammate'?'Teammate work':'Coach challenge');
 await page.locator('#career-preparation').scrollIntoViewIfNeeded();
 expect(await page.locator('.stat-board').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`test-results/weekly-preparation-${width}-${height}.png`});
 await page.locator('#career-stakes').scrollIntoViewIfNeeded();await expect(page.locator('#career-stakes')).toBeInViewport();
 await page.screenshot({path:`test-results/weekly-stakes-${width}-${height}.png`});
 await page.getByRole('button',{name:'Play next game',exact:true}).click();
 await page.reload();await resume(page);await expect(page.getByRole('button',{name:'Weekly preparation',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Resume game',exact:true}).click();
 // Deterministic result fixture verifies real UI/save settlement, not manual play.
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),c=C.loadCareer(),{game}=await import('/src/state/gameState.js'),engine=await import('/src/simulation/engine.js'),{emptyStats}=await import('/src/career/stats.js');
  engine.matchState.stats.players[c.playerId]={...emptyStats(),attempts:6,completions:4,passingYards:60,passingTD:2};
  if(c.weeklyPreparation.playerId)engine.matchState.stats.players[c.weeklyPreparation.playerId]={...emptyStats(),receptions:3,receivingYards:45};
  game.playerScore=21;game.cpuScore=7;engine.finishGame();
 });
 await expect(page.locator('#postgame-dialog')).toBeVisible();await expect(page.locator('#postgame-content')).toContainText('Season stakes');
 await expect(page.locator('#postgame-content')).toContainText(kind==='teammate'?'Preparation result':'Coach challenge complete');
 const saved=await page.evaluate(()=>localStorage.getItem('gridironLegendsCareerV1'));
 await page.reload();await resume(page);await expect(page.locator('#postgame-content')).toContainText('Season stakes');
 const current=await page.evaluate(()=>localStorage.getItem('gridironLegendsCareerV1'));
 expect(JSON.parse(current).xp).toBe(JSON.parse(saved).xp);expect(JSON.parse(current).points).toBe(JSON.parse(saved).points);
 await page.getByRole('button',{name:'Continue to career',exact:true}).click();await expect(page.getByRole('button',{name:'Weekly preparation',exact:true})).toContainText('Personal development');
 expect(errors).toEqual([]);await context.close();
});
