import {test,expect} from '@playwright/test';
async function create(page,difficulty='medium'){
 await page.goto('/');await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Start new career',exact:true}).click();
 await page.getByLabel('Career starting point',{exact:true}).selectOption('pro');await page.getByLabel('Player name',{exact:true}).fill('Rookie Legend');
 await page.locator('#career-create').getByLabel('Team',{exact:true}).selectOption('bos');
 await page.getByLabel('Difficulty',{exact:true}).selectOption(difficulty);
 await page.getByRole('button',{name:'Begin rookie season'}).click();
 await expect(page.locator('#career-player-name')).toHaveText('Rookie Legend');
}
test('career difficulty matches pause UI and persists independently of exhibition',async({page})=>{
 await create(page,'easy');
 await page.getByRole('button',{name:'Play next game'}).click();
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 const pause=page.locator('#pause-overlay');
 await expect(pause.locator('[data-diff="easy"]')).toHaveClass(/active/);
 expect(await page.evaluate(async()=>(await import('/src/state/gameState.js')).game.difficulty)).toBe('easy');
 await pause.getByRole('button',{name:'Hard',exact:true}).click();
 // Change difficulty without advancing a play, then restore the previous checkpoint.
 await page.reload();
 await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
 await page.getByRole('button',{name:'Resume game'}).click();
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await expect(pause.locator('[data-diff="hard"]')).toHaveClass(/active/);
 expect(await page.evaluate(async()=>(await import('/src/state/gameState.js')).game.difficulty)).toBe('hard');
 await pause.getByRole('button',{name:'Main menu',exact:true}).click();
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await expect(page.locator('#setup-screen [data-diff="medium"]')).toHaveClass(/active/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')));
 expect(saved.settings.difficulty).toBe('hard');
 expect(saved.checkpoint.game.difficulty).toBe('hard');
});
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
  await expect(page.locator('#postgame-dialog')).toBeVisible();
  await expect(page.locator('#postgame-content')).toContainText('25 YDS');
  if(week===1){
   await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
   await expect(page.locator('#postgame-dialog')).toBeVisible();
  }
  await page.getByRole('button',{name:'Continue to career',exact:true}).click();
  await expect(page.locator('#career-season')).toContainText(`Week ${week+1}`);
  await expect(page.locator('#career-result-title')).toContainText('WIN');
  await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();
  await expect(page.locator('#career-season')).toContainText(`Week ${week+1}`);
 }
 await page.getByRole('tab',{name:'Player',exact:true}).click();
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
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();await page.getByRole('button',{name:'Resume game'}).click();
 await expect(page.locator('#overlay-msg')).toContainText('Run for 3 yards');await expect(page.locator('#hud-ball')).toHaveText('OWN 38');await context.close();
});

test('landscape team cards and recap keep navigation visible',async({browser})=>{
 for(const height of [304,390]){
  const context=await browser.newContext({viewport:{width:844,height},hasTouch:true,isMobile:true});
  const page=await context.newPage();await create(page);
  await page.getByRole('tab',{name:'My Team',exact:true}).click();
  await page.locator('.roster-card').first().tap();
  await expect(page.locator('#team-player-dialog')).toBeVisible();
  await expect(page.locator('#team-player-heading')).toHaveText('Rookie Legend');
  const close=page.getByRole('button',{name:'Back to My Team'});
  const bounds=await close.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
  await page.screenshot({path:`test-results/team-card-landscape-${height}.png`});
  await close.tap();await page.getByRole('tab',{name:'Home',exact:true}).tap();await page.getByRole('button',{name:'Play next game'}).tap();
  await page.evaluate(async()=>{
   const {game}=await import('/src/state/gameState.js');const engine=await import('/src/simulation/engine.js');
   game.playerScore=21;game.cpuScore=7;engine.finishGame();
  });
  await expect(page.locator('#postgame-dialog')).toBeVisible();
  const button=page.getByRole('button',{name:'Continue to career',exact:true});
  const rect=await button.boundingBox();expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(height);
  await page.screenshot({path:`test-results/postgame-landscape-${height}.png`});
  await button.tap();await expect(page.locator('#postgame-dialog')).not.toBeVisible();
  await page.getByRole('button',{name:'View recap',exact:true}).tap();await expect(page.locator('#postgame-dialog')).toBeVisible();
  await context.close();
 }
});
