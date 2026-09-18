import {test,expect} from '@playwright/test';
for(const height of [304,390])test(`scramble and career depth at 844x${height}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Start new career',exact:true}).tap();await page.getByLabel('Player name',{exact:true}).fill('Depth Test');await page.getByRole('button',{name:'Next',exact:true}).tap();await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();
 await page.getByRole('tab',{name:'Player',exact:true}).tap();await expect(page.locator('#career-upgrades button')).toHaveCount(4);for(const b of await page.locator('#career-upgrades button').all())await expect(b).toBeInViewport({ratio:1});await page.screenshot({path:`test-results/development-${height}.png`});
 await page.getByRole('button',{name:'Stats',exact:true}).tap();
 await page.evaluate(async()=>{const {renderPlayerStats}=await import('/src/ui/careerStats.js');const {emptyStats}=await import('/src/career/stats.js');const s=(n)=>({...emptyStats(),attempts:n*10,completions:n*7,passingYards:n*100,passingTD:n,carries:n*2,rushingYards:n*15,rushingTD:n});renderPlayerStats({lastResult:{stats:s(1)},seasonStats:s(2),totals:s(3)});});
 await expect(page.getByRole('button',{name:'Passing',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('region',{name:'Game passing'})).toContainText('100');
 await page.screenshot({path:`test-results/passing-stats-${height}.png`});
 await page.getByRole('button',{name:'Rushing',exact:true}).tap();
 for(const [title,values] of [['Game',['2','15','7.5','1']],['Season',['4','30','7.5','2']],['Career',['6','45','7.5','3']]]){
  const section=page.getByRole('region',{name:title+' rushing'});await expect(section.locator('dd')).toHaveText(values);await expect(section).toBeInViewport({ratio:1});
 }
 await page.screenshot({path:`test-results/rushing-stats-${height}.png`});
 await page.getByRole('tab',{name:'Home',exact:true}).tap();await page.getByRole('button',{name:'Play next game',exact:true}).tap();
 for(let i=0;i<4&&!await page.locator('#callsheet-overlay').isVisible();i++){await page.waitForTimeout(450);await page.locator('#btn-continue').tap();}
 await page.locator('.play-btn').first().tap();
 await expect(page.locator('#btn-scramble')).toHaveCount(0);
 const qbPoint=()=>page.evaluate(async()=>{const {entities}=await import('/src/state/gameState.js');const {toCanvas}=await import('/src/rendering/players.js');const {SCENE_TOP}=await import('/src/rendering/sceneLayout.js');const {cx,cy}=toCanvas(entities.players.qb);const c=document.getElementById('field'),r=c.getBoundingClientRect();return {x:r.left+cx*r.width/c.width,y:r.top+(cy+SCENE_TOP)*r.height/c.height,pull:45*r.width/c.width};});
 let point=await qbPoint();await page.mouse.click(point.x,point.y);await page.waitForTimeout(500);
 point=await qbPoint();await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-point.pull,point.y);await page.mouse.up();
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.scrambling;})).toBe(true);
 await page.screenshot({path:`test-results/scramble-live-${height}.png`});
 expect(errors).toEqual([]);await context.close();
});
