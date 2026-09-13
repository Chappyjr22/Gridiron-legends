import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:844,height:390},{width:932,height:370},{width:390,height:740}]){
 test(`college player panel scrolls with fixed navigation at ${viewport.width}x${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/');
  await page.getByRole('button',{name:'Career Mode',exact:true}).tap();
  await page.getByRole('button',{name:'Start new career',exact:true}).tap();
  await page.getByLabel('Player name',{exact:true}).fill('Mobile QB');await page.getByRole('button',{name:'Next',exact:true}).tap();
  await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();
  await page.getByRole('tab',{name:'Player',exact:true}).tap();
  const panel=page.locator('#career-player-panel');
  const checkLayout=async()=>{
   const bounds=await panel.boundingBox(),nav=await page.locator('.career-nav').boundingBox();
   expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(nav.y);
   expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   for(const b of await page.locator('.career-nav button').all())expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  };
  await checkLayout();
  await expect(page.locator('#career-upgrades button').first()).toBeInViewport();
  await page.screenshot({path:`test-results/mobile-player-${viewport.width}-${viewport.height}.png`});
  await expect(page.locator('#career-player-sprite')).not.toBeVisible();
  await expect(page.locator('#upgrade-status')).toHaveText('0 points · Level up to earn 1');
  await expect(page.getByRole('button',{name:'Upgrade accuracy by 2 for 1 point',exact:true})).toBeDisabled();
  for(const button of await page.locator('#career-upgrades button').all())await expect(button).toBeInViewport({ratio:1});
  await page.getByRole('button',{name:'Career story',exact:true}).tap();
  await expect(page.locator('#career-progress-dialog')).toBeVisible();
  await expect(page.getByRole('button',{name:'Back to Player',exact:true})).toBeInViewport({ratio:1});
  await page.screenshot({path:`test-results/mobile-story-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('button',{name:'Info',exact:true}).tap();
  await expect(page.locator('#scouting-info')).toBeVisible();
  await page.getByRole('button',{name:'Back to story',exact:true}).tap();
  await page.getByRole('button',{name:'Back to Player',exact:true}).tap();
  await page.getByRole('button',{name:'Stats',exact:true}).tap();
  await expect(page.locator('.stat-comparison>section')).toHaveCount(3);await expect(page.locator('.stat-tiles').first()).toBeVisible();
  await checkLayout();
  // Scrolling long content must not move the navigation or strand the next tab.
  await panel.evaluate(e=>{e.scrollTop=e.scrollHeight;});await checkLayout();
  await expect(page.locator('.stat-comparison>section')).toHaveCount(3);
  await panel.evaluate(e=>{e.scrollTop=0;});
  await page.screenshot({path:`test-results/simple-stats-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('tab',{name:'My Team',exact:true}).tap();
  await page.screenshot({path:`test-results/simple-roster-${viewport.width}-${viewport.height}.png`});
  await expect(page.locator('#my-team-roster')).not.toContainText('Slot Receiver');
  const portraits=await page.locator('.roster-card canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()));
  expect(new Set(portraits).size).toBeGreaterThan(5);
  await page.getByRole('tab',{name:'Player',exact:true}).tap();
  expect(await panel.evaluate(e=>e.scrollTop)).toBe(0);
  await expect(page.locator('#career-upgrades button').first()).toBeInViewport();
  await page.getByRole('tab',{name:'League',exact:true}).tap();
  await expect(page.locator('.leaderboard li').first()).toBeInViewport();
  await page.getByRole('button',{name:'Filters',exact:true}).tap();
  await page.locator('#league-stat-metric').selectOption('passingTD');
  await page.getByRole('button',{name:'Show rankings',exact:true}).tap();
  await expect(page.locator('.leaderboard-caption')).toContainText('Touchdowns');
  expect(await page.locator('#career-league-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/mobile-leaders-${viewport.width}-${viewport.height}.png`});
  await page.locator('[data-league-jump=standings-heading]').tap();await expect(page.locator('#standings-heading')).toBeInViewport();
  await page.screenshot({path:`test-results/mobile-standings-${viewport.width}-${viewport.height}.png`});
  await page.locator('[data-league-jump=career-schedule-section]').tap();await expect(page.locator('#career-schedule-section')).toHaveAttribute('open','');
  await page.locator('[data-league-jump=league-toolbar]').tap();await expect(page.locator('#league-toolbar')).toBeInViewport();
  await page.getByRole('tab',{name:'Home',exact:true}).tap();
  await expect(page.locator('#career-player-sprite')).toBeVisible();
  const helmets=await page.locator('.helmet-matchup').boundingBox(),opponent=await page.locator('#career-next-opponent').boundingBox();
  expect(helmets.y+helmets.height).toBeLessThanOrEqual(opponent.y);
  await page.screenshot({path:`test-results/mobile-home-${viewport.width}-${viewport.height}.png`});
  await page.getByRole('button',{name:'Career menu',exact:true}).tap();await page.getByRole('button',{name:'Save & backup',exact:true}).tap();
  await expect(page.locator('#career-quiet-save')).toBeVisible();
  await context.close();
 });
}

test('leaderboard ranking uses the selected metric and preserves untracked stats',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{
  const C=await import('/src/career/career.js');const {renderCareerStats}=await import('/src/ui/careerStats.js');const {emptyStats}=await import('/src/career/stats.js');
  const c=C.createCareer({name:'Ranking QB'}),[a,b]=c.league.teams;
  const qa=a.roster.find(p=>p.slot==='QB'),qb=b.roster.find(p=>p.slot==='QB');
  c.league.schedule[0].status='completed';c.league.schedule[0].boxScore={players:{[qa.id]:{...emptyStats(),games:1,passingYards:300,passingTD:1,completions:10,attempts:20},[qb.id]:{...emptyStats(),games:1,passingYards:150,passingTD:3,completions:9,attempts:10}}};
  document.getElementById('league-stat-team').innerHTML='<option value="">All teams</option>';
  renderCareerStats(c);
  window.__rankingFixture=c;
 });
 const values=()=>page.locator('.leaderboard li>strong').allTextContents();
 expect((await values()).slice(0,3)).toEqual(['300','150','—']);
 await page.evaluate(async()=>{document.getElementById('league-stat-metric').value='passingTD';(await import('/src/ui/careerStats.js')).renderCareerStats(window.__rankingFixture);});
 expect((await values()).slice(0,3)).toEqual(['3','1','—']);
 await page.evaluate(async()=>{document.getElementById('league-stat-metric').value='completionPct';(await import('/src/ui/careerStats.js')).renderCareerStats(window.__rankingFixture);});
 expect((await values()).slice(0,3)).toEqual(['90.0%','50.0%','—']);
});
