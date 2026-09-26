import {test,expect} from '@playwright/test';
for(const [width,height,stage] of [[844,304,'college'],[667,375,'pro'],[844,390,'college']])test(`League screens fit ${stage} ${width}x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 const fixture=await page.evaluate(async(stage)=>{
  const C=await import('/src/career/career.js'),c=C.createCareer({name:'League QB',...(stage==='college'?{schoolId:'college-bluegrass'}:{})});
  const own=c.league.teams.find(t=>t.id===c.teamId),other=c.league.teams.find(t=>t.conference!==own.conference),g=c.league.schedule.find(g=>g.homeTeamId===own.id||g.awayTeamId===own.id);
  g.status='completed';g.homeScore=g.homeTeamId===own.id?24:17;g.awayScore=g.awayTeamId===own.id?24:17;
  c.postseason={round:1,games:[{id:'league-ui-playoff',week:18,round:1,homeTeamId:own.id,awayTeamId:other.id,status:'scheduled',homeScore:null,awayScore:null}],champion:null,seeds:[]};
  C.saveCareer(c);return {own:own.id,other:other.id,otherName:other.name,otherCity:other.city,conference:other.conference,games:c.league.schedule.filter(g=>g.homeTeamId===own.id||g.awayTeamId===own.id).length+1};
 },stage);
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Continue last career',exact:true}).tap();await page.getByRole('tab',{name:'League',exact:true}).tap();
 const panel=page.locator('#career-league-panel');
 async function fits(){
  expect(await panel.evaluate(e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1)).toBe(true);
  for(const button of await page.locator('.league-screen-toolbar button,.career-nav button').all()){await expect(button).toBeInViewport({ratio:1});expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);}
  expect(await panel.locator('select:visible').count()).toBe(0);
 }
 await fits();await expect(page.locator('.leaderboard li').first()).toBeInViewport({ratio:1});
 for(const b of await page.locator('#league-metrics button').all())await expect(b).toBeInViewport({ratio:1});
 await page.getByRole('button',{name:'Touchdowns',exact:true}).tap();await expect(page.locator('.leaderboard-caption')).toContainText('Touchdowns');
 await page.locator('#league-team-open').tap();await expect(page.locator('#league-team-close')).toBeInViewport({ratio:1});await page.getByLabel('Find a team',{exact:true}).fill(fixture.otherCity+' '+fixture.otherName);await expect(page.locator('#league-team-options button')).toHaveCount(1);await page.locator(`#league-team-options [data-team="${fixture.other}"]`).tap();await expect(page.locator('#league-team-dialog')).not.toBeVisible();await expect(page.locator('#league-stat-team')).toHaveValue(fixture.other);await fits();
 await page.locator('#league-team-open').tap();await page.locator('#league-team-reset').tap();await expect(page.locator('#league-stat-team')).toHaveValue('');
 await page.getByRole('button',{name:'Season phase: Regular season',exact:true}).tap();await expect(page.locator('#league-season-scope')).toHaveValue('playoffs');await page.locator('#league-info-open').tap();await expect(page.locator('#league-stat-coverage')).toContainText('Playoffs only.');await page.locator('#league-info-close').tap();
 await page.getByRole('button',{name:'Season phase: Playoffs',exact:true}).tap();
 await page.screenshot({path:`test-results/league-leaders-${width}-${height}.png`});
 await page.locator('[data-league-category=receiving]').tap();await expect(page.locator('#league-metrics button')).toHaveCount(4);await page.getByRole('button',{name:'Receptions',exact:true}).tap();await expect(page.locator('.leaderboard-caption')).toContainText('Receptions');
 await page.locator('[data-league-view=standings]').tap();await expect(page.locator('#league-leaders-view')).not.toBeVisible();await fits();await page.locator(`[data-conference="${fixture.conference}"]`).tap();await expect(page.locator('#career-standings')).toContainText(fixture.otherName);await page.screenshot({path:`test-results/league-standings-${width}-${height}.png`});
 await page.locator('[data-league-view=schedule]').tap();await expect(page.locator('#college-schedule .league-game')).toHaveCount(fixture.games);await expect(page.locator('#college-schedule')).toContainText('W 24–17');await expect(page.locator('#college-schedule')).toContainText('Playoff 1');await fits();await page.screenshot({path:`test-results/league-schedule-${width}-${height}.png`});
 await page.locator('#league-schedule-team').tap();await page.screenshot({path:`test-results/league-team-picker-${width}-${height}.png`});await page.locator(`#league-team-options [data-team="${fixture.other}"]`).tap();await expect(page.locator('#career-schedule-section h3')).toContainText(fixture.otherName);
 await page.locator('#league-schedule-team').tap();await page.locator('#league-team-reset').tap();await expect(page.locator('#career-schedule-section h3')).toHaveText('Your season');
 await page.locator('[data-league-view=leaders]').tap();await expect(page.locator('[data-league-metric=receptions]')).toHaveAttribute('aria-pressed','true');await fits();
 await page.getByRole('tab',{name:'Home',exact:true}).tap();await page.getByRole('button',{name:'View standings',exact:true}).tap();await expect(page.locator('#league-standings-view')).toBeVisible();await fits();
 expect(errors).toEqual([]);await context.close();
});
