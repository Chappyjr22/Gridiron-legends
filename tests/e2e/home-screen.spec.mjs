import {test,expect} from '@playwright/test';
for(const [width,height,played] of [[844,304,false],[667,375,true],[844,390,true]])test(`compact Home fits ${width}x${height} played=${played}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async played=>{const C=await import('/src/career/career.js'),c=C.createCareer({name:'Home Test',schoolId:'college-bluegrass'});if(played){const g=C.nextMatch(c);c.activeMatch=g.id;C.completeCareerGame(c,g.id,21,14,{players:{[c.playerId]:{attempts:10,completions:7,passingYards:110,passingTD:1}},plays:[]});c.pendingRecapGameId=null;}C.saveCareer(c);},played);
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Continue last career',exact:true}).tap();
 for(const selector of ['#career-play','#career-open-player','#career-view-standings','#career-preparation-kind','#career-weekly-goal','#home-season-position','.career-nav'])await expect(page.locator(selector)).toBeInViewport({ratio:1});
 expect(await page.locator('#career-home-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)).toBe(true);
 for(const card of await page.locator('#career-home-panel>.paper-board').all())expect(await card.evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
 if(played)await expect(page.locator('#career-review-game')).toBeInViewport({ratio:1});
 await page.screenshot({path:`test-results/home-compact-${width}-${height}.png`});
 await page.locator('#career-preparation-kind').tap();await page.getByRole('option',{name:'Teammate work',exact:true}).tap();
 await expect(page.locator('#career-preparation-target')).toBeInViewport({ratio:1});await expect(page.locator('#career-play')).toBeInViewport({ratio:1});
 await page.locator('#career-preparation-target').tap();await page.getByRole('listbox',{name:'Work with',exact:true}).getByRole('option').nth(1).tap();
 await expect(page.locator('#career-weekly-goal')).toBeInViewport({ratio:1});await page.screenshot({path:`test-results/home-preparation-${width}-${height}.png`});
 await page.locator('#career-view-standings').tap();await expect(page.locator('#league-standings-view')).toBeVisible();await page.getByRole('tab',{name:'Home',exact:true}).tap();await expect(page.locator('#career-play')).toBeInViewport({ratio:1});
 expect(errors).toEqual([]);await context.close();
});
