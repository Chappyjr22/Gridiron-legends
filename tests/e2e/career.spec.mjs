import {test,expect} from '@playwright/test';
async function create(page){
 await page.goto('/');await page.getByRole('button',{name:'Career Mode',exact:true}).click();
 await page.getByLabel('Player name',{exact:true}).fill('Rookie Legend');
 await page.getByLabel('Team',{exact:true}).selectOption('bos');
 await page.getByRole('button',{name:'Begin rookie season'}).click();
 await expect(page.locator('#career-player-name')).toHaveText('Rookie Legend');
}
test('career creation, three weekly results, reload and upgrade',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await create(page);
 await page.screenshot({path:'test-results/career-desktop.png',fullPage:true});
 for(let week=1;week<=3;week++){
  await page.getByRole('button',{name:'Play next game'}).click();
  // Deterministic engine fixture, not manual play: verify the UI/result/save boundary.
  await page.evaluate(async()=>{
   const {game,entities}=await import('/src/state/gameState.js');
   const engine=await import('/src/simulation/engine.js');
   engine.startPlayerDrive(25);engine.choosePlay('trips_slants');engine.onSnap();engine.releaseThrow({x:300,y:39});
   game.playFacts.receiverId=entities.players.wr1.playerId;game.playFacts.targetId=entities.players.wr1.playerId;
   engine.endPlay(25,'Catch',false,50);game.playerScore=21;game.cpuScore=7;engine.finishGame();
  });
  await expect(page.locator('#career-season')).toContainText(`Week ${week+1}`);
  await expect(page.locator('#career-result-title')).toContainText('WIN');
  await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();
  await expect(page.locator('#career-season')).toContainText(`Week ${week+1}`);
 }
 await expect(page.locator('#career-lifetime')).toContainText('75 passing yards');
 const upgrade=page.locator('[data-upgrade="accuracy"]');await expect(upgrade).toBeEnabled();await upgrade.click();await expect(upgrade.locator('strong')).toHaveText('84');
 await page.screenshot({path:'test-results/career-after-three-weeks.png',fullPage:true});
 await page.getByRole('button',{name:'Main menu',exact:true}).click();await page.locator('#btn-practice').click();
 await expect(page.locator('#hud-quarter')).toHaveText('Practice');expect(errors).toEqual([]);
});
test('mobile career layout and between-play resume',async({browser})=>{
 const context=await browser.newContext({viewport:{width:400,height:780},hasTouch:true,isMobile:true});const page=await context.newPage();
 await create(page);await page.screenshot({path:'test-results/career-mobile.png',fullPage:true});
 const panel=page.locator('.career-panel');expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.getByRole('button',{name:'Play next game'}).click();
 await page.evaluate(async()=>{const e=await import('/src/simulation/engine.js');e.startPlayerDrive(35);e.choosePlay('trips_inside');e.endPlay(3,'Run',false,38);});
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Resume game'}).click();
 await expect(page.locator('#overlay-msg')).toContainText('Run for 3 yards');await expect(page.locator('#hud-ball')).toHaveText('OWN 38');await context.close();
});
