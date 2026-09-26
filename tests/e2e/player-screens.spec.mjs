import {test,expect} from '@playwright/test';
for(const [width,height] of [[844,304],[667,375],[844,390]])test(`fixed player screens fit ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js'),c=C.createCareer({name:'Jacob Chapman',schoolId:'college-bluegrass',development:'fast'});
  Object.assign(c.seasonStats,{games:6,attempts:120,completions:84,passingYards:1432,passingTD:12,interceptions:3,sacks:7,carries:18,rushingYards:104,rushingTD:2});
  c.totals={...c.seasonStats};c.lastResult={stats:{...c.seasonStats,games:1,attempts:20,completions:14,passingYards:212,passingTD:2,interceptions:1},opponentId:c.league.teams.find(t=>t.id!==c.teamId).id,userScore:21,cpuScore:14,xp:20,levels:0};
  c.awards=[{season:1,title:'College MVP'},{season:1,title:'National college champion'},{season:1,title:'1,000 career passing yards'}];c.points=6;C.saveCareer(c);
 });
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Continue last career',exact:true}).tap();
 await page.getByRole('tab',{name:'Player',exact:true}).tap();
 const panel=page.locator('#career-player-panel');
 async function fits(){
  expect(await panel.evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  for(const b of await page.locator('.career-nav button').all())await expect(b).toBeInViewport({ratio:1});
  await expect(page.getByRole('button',{name:'Career menu',exact:true})).toBeInViewport({ratio:1});
 }
 await fits();for(const b of await page.locator('#career-upgrades button').all()){await expect(b).toBeInViewport({ratio:1});expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:`test-results/player-overview-${width}-${height}.png`});
 const accuracy=page.locator('[data-upgrade=accuracy]'),before=Number(await accuracy.locator('strong').innerText());await accuracy.tap();await expect(accuracy.locator('strong')).toHaveText(String(before+2));await fits();
 await page.getByRole('button',{name:'Stats',exact:true}).tap();await fits();
 await expect(page.locator('.stat-comparison')).toContainText('84/120 · 70.0%');
 await expect(page.getByRole('button',{name:'View accomplishments: 1 titles, 1 MVPs, 1 honors',exact:true})).toBeInViewport({ratio:1});
 for(const tile of await page.locator('#career-qb-stats .stat-tiles>div').all())await expect(tile).toBeInViewport({ratio:1});
 await page.screenshot({path:`test-results/player-passing-${width}-${height}.png`});
 await page.getByRole('button',{name:'Rushing',exact:true}).tap();await fits();await expect(page.locator('.stat-comparison')).toContainText('104');await page.screenshot({path:`test-results/player-rushing-${width}-${height}.png`});
 await page.getByRole('button',{name:/View accomplishments:/}).tap();await expect(page.locator('#player-awards-list')).toContainText('College MVP');await page.screenshot({path:`test-results/player-honors-${width}-${height}.png`});
 await page.getByRole('button',{name:'Back to stats',exact:true}).tap();await expect(page.getByRole('button',{name:'Rushing',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Overview',exact:true}).tap();await fits();
 await page.getByRole('button',{name:'Career story',exact:true}).tap();await page.getByRole('button',{name:'Back to Player',exact:true}).tap();await fits();
 await page.getByRole('tab',{name:'Home',exact:true}).tap();await expect(page.locator('.career-header')).toBeVisible();
 expect(errors).toEqual([]);await context.close();
});
