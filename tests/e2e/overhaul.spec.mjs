import {test,expect} from '@playwright/test';

test('three runner actions stay in one thumb-sized row on short landscape',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{const {game,entities}=await import('/src/state/gameState.js');game.phase='live';entities.ballCarrier=entities.players.wr1;entities.ball.inFlight=false;for(const p of Object.values(entities.players))if(p!==entities.ballCarrier)p.yfield=-10000;entities.decor.forEach(p=>p.yfield=-10000);});
 const controls=page.locator('#runner-controls');await expect(controls).toBeVisible();
 for(const button of await controls.getByRole('button').all())await expect(button).toBeInViewport({ratio:1});
 expect((await controls.boundingBox()).height).toBeLessThan(60);
 await page.screenshot({path:'test-results/overhaul-runner-controls-mobile.png'});await context.close();
});

test('recorded replay keeps the result intact and offers a reachable skip control',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const {game,entities}=await import('/src/state/gameState.js'),e=await import('/src/simulation/engine.js');
  const {captureHighlight,resetHighlight}=await import('/src/simulation/highlights.js');
  const {simulationNow}=await import('/src/state/clock.js');
  e.onSnap();resetHighlight();entities.ballCarrier=entities.players.wr1;
  for(let i=0;i<60;i++){entities.players.wr1.yfield+=2;captureHighlight(simulationNow()+i*60);}
  e.endPlay(25,'Catch',false,45);
 });
 const message=await page.locator('#overlay-msg').textContent();
 await page.getByRole('button',{name:'Replay',exact:true}).tap();
 await expect(page.getByRole('button',{name:'Skip replay',exact:true})).toBeInViewport({ratio:1});
 await expect(page.locator('#result-overlay')).toHaveClass(/replaying/);
 await page.screenshot({path:'test-results/overhaul-replay-mobile.png'});
 await page.getByRole('button',{name:'Skip replay',exact:true}).tap();
 await expect(page.locator('#overlay-msg')).toHaveText(message);
 await expect(page.locator('#result-overlay')).not.toHaveClass(/replaying/);
 await page.waitForFunction(async()=>{const {resultFlow}=await import('/src/ui/hud.js');return performance.now()>=resultFlow.readyAt;});
 await page.getByRole('button',{name:'Next Rep',exact:true}).tap();
 await expect(page.locator('#callsheet-overlay')).toBeVisible();expect(errors).toEqual([]);await context.close();
});

test('mobile field goal takes power and aim taps then follows the ball to the result',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const {game}=await import('/src/state/gameState.js'),e=await import('/src/simulation/engine.js'),hud=await import('/src/ui/hud.js');
  e.startNewGame();e.startPlayerDrive(80);game.down=4;hud.showFourthDown();
 });
 await page.locator('#btn-field-goal').tap();
 const field=page.locator('#field');await expect(field).toBeVisible();
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow()-900;});
 await field.tap();
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.kick.stage;})).toBe('aim');
 await page.screenshot({path:'test-results/overhaul-kick-aim-mobile.png'});
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow();});
 await field.tap();
 await expect(page.locator('#result-overlay')).toBeVisible();
 const result=await page.evaluate(async()=>{const {game,entities}=await import('/src/state/gameState.js');return {score:game.playerScore,camera:game.cameraYard,loose:entities.ball.loose};});
 expect(result.score).toBe(3);expect(result.camera).toBeGreaterThan(90);expect(result.loose).toBe(true);
 await page.screenshot({path:'test-results/overhaul-kick-result-mobile.png'});
 expect(errors).toEqual([]);await context.close();
});

test('TD replay removes backdrop blur and leaves the live result untouched',async({page})=>{
 await page.goto('/');await page.locator('#btn-practice').click();await page.locator('.play-btn').first().click();
 await page.evaluate(async()=>{
  const {game,entities}=await import('/src/state/gameState.js'),e=await import('/src/simulation/engine.js');
  const r=await import('/src/simulation/highlights.js'),{simulationNow}=await import('/src/state/clock.js');
  e.startNewGame();e.startPlayerDrive(95);e.choosePlay('trips_verticals');e.onSnap();r.resetHighlight();entities.ballCarrier=entities.players.wr1;
  for(let i=0;i<40;i++){entities.ballCarrier.yfield=(95+i/8)*28;r.captureHighlight(simulationNow()+i*60);}
  e.endPlay(5,'Catch',false,100);
 });
 const message=await page.locator('#overlay-msg').textContent();
 await page.getByRole('button',{name:'Replay',exact:true}).click();
 await expect(page.locator('#result-overlay')).toHaveCSS('backdrop-filter','none');
 await expect(page.locator('#result-overlay')).toHaveClass(/replaying/);
 await page.screenshot({path:'test-results/td-replay-no-blur.png'});
 await page.getByRole('button',{name:'Skip replay',exact:true}).click();await expect(page.locator('#overlay-msg')).toHaveText(message);
});

test('every new runner pose preserves ball pixels and supports all four skin palettes',async({page})=>{
 await page.goto('/');
 await page.waitForFunction(async()=>{const {spriteState}=await import('/src/rendering/spriteSheets.js');return spriteState.runnerSpritesReady;});
 const checks=await page.evaluate(async()=>{
  const {runnerSpriteSheets,uniformMaskStatus}=await import('/src/rendering/spriteSheets.js');
  const {decodeMask}=await import('/public/tools/uniform-pilot.mjs');
  const mask=await(await fetch('/assets/masks/runner-actions-uniform.json')).json(),labels=decodeMask(mask,mask.sha256,256,128);
  const sheets=runnerSpriteSheets.off.map(c=>c.getContext('2d').getImageData(0,0,256,128).data),result=[];
  for(const frame of mask.frames){
   let skin=0,protectedPixels=0,wrongSkin=0,changedProtected=0;
   for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const index=(frame.row*64+y)*256+frame.col*64+x;
    const colors=sheets.map(s=>Array.from(s.slice(index*4,index*4+4)).join(','));
    if(labels[index]===5){skin++;if(new Set(colors).size!==4)wrongSkin++;}
    if(labels[index]===10){protectedPixels++;if(new Set(colors).size!==1)changedProtected++;}
   }
   result.push({name:frame.name,skin,protectedPixels,wrongSkin,changedProtected});
  }
  const preview=document.createElement('canvas');preview.id='runner-art-review';preview.width=1024;preview.height=512;preview.style='position:fixed;inset:0;width:100%;height:100%;z-index:99999;background:#3c5633;image-rendering:pixelated';
  const ctx=preview.getContext('2d');ctx.imageSmoothingEnabled=false;
  runnerSpriteSheets.off.forEach((sheet,i)=>ctx.drawImage(sheet,(i%2)*512,Math.floor(i/2)*256,512,256));document.body.append(preview);
  return {status:uniformMaskStatus['runner-actions'],result};
 });
 expect(checks.status).toBe('verified');
 for(const f of checks.result){expect(f.skin,f.name).toBeGreaterThan(5);expect(f.protectedPixels,f.name).toBeGreaterThan(10);expect(f.wrongSkin,f.name).toBe(0);expect(f.changedProtected,f.name).toBe(0);}
 await page.screenshot({path:'test-results/runner-actions-four-skin-palettes.png'});
});
