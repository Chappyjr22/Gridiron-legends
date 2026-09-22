import {test,expect} from '@playwright/test';

test('runner buttons do not cover the field on short landscape',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{const {game,entities}=await import('/src/state/gameState.js');game.phase='live';entities.ballCarrier=entities.players.wr1;entities.ball.inFlight=false;for(const p of Object.values(entities.players))if(p!==entities.ballCarrier)p.yfield=-10000;entities.decor.forEach(p=>p.yfield=-10000);});
 await expect(page.locator('#runner-controls, #btn-dive, #btn-juke-up, #btn-juke-down')).toHaveCount(0);
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
 await expect.poll(()=>page.evaluate(async()=>{const {resultFlow}=await import('/src/ui/hud.js');return performance.now()>=resultFlow.readyAt;})).toBe(true);
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
 await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js'),{simulationNow}=await import('/src/state/clock.js');game.kick.start=simulationNow()-600;});
 await field.tap();
 await expect(page.locator('#result-overlay')).toBeVisible({timeout:10000});
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

for(const viewport of [{width:844,height:304},{width:932,height:430}])test(`drag aiming starts neutral and progresses from short to deep at ${viewport.width}x${viewport.height}`,async({browser})=>{
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 const origin=await page.evaluate(async()=>{
  const {game,entities}=await import('/src/state/gameState.js'),{toCanvas}=await import('/src/rendering/players.js');
  const {SCENE_TOP}=await import('/src/rendering/sceneLayout.js');
  game.passMode='drag';entities.players.qb.attributes.arm=68;
  for(const p of [...Object.values(entities.players),...entities.decor])if(p!==entities.players.qb)p.yfield=-10000;
  const qb=toCanvas(entities.players.qb),canvas=document.querySelector('#field'),r=canvas.getBoundingClientRect();
  return {x:r.left+(qb.cx+20)*r.width/canvas.width,y:r.top+(qb.cy+SCENE_TOP-10)*r.height/canvas.height,scale:r.width/canvas.width};
 });
 await page.mouse.move(origin.x,origin.y);await page.mouse.down();
 async function readAim(){return page.evaluate(async()=>{
  const {interaction}=await import('/src/input/interactionState.js'),{game,entities}=await import('/src/state/gameState.js');
  const {toCanvas}=await import('/src/rendering/players.js'),{slingshotTarget,maxThrowYards}=await import('/src/input/aim.js');
  const qb=toCanvas(entities.players.qb),t=slingshotTarget(qb,interaction.aimTarget,68,game.throwType,interaction.aimAnchor);
  return {yards:(qb.cx-t.x)/28,max:maxThrowYards(68,game.throwType)};
 });}
 expect((await readAim()).yards).toBe(0);
 const distances=[];
 for(const pull of [30,70,140]){
  await page.mouse.move(origin.x+pull*origin.scale,origin.y,{steps:8});const aim=await readAim();distances.push(aim.yards);
  if(pull===30)expect(aim.yards).toBeLessThan(3);
  if(pull===70)expect(aim.yards).toBeLessThan(aim.max*.35);
  if(pull===140)expect(aim.yards).toBeCloseTo(aim.max,1);
 }
 expect(distances[1]).toBeGreaterThan(distances[0]);expect(distances[2]).toBeGreaterThan(distances[1]);
 // Returning to a short pull must also lower power immediately.
 await page.mouse.move(origin.x+30*origin.scale,origin.y,{steps:8});expect((await readAim()).yards).toBeLessThan(3);
 await page.screenshot({path:`test-results/progressive-short-pass-${viewport.width}.png`});
 await page.mouse.up();
 expect(await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.playFacts.threw;})).toBe(true);
 expect(errors).toEqual([]);await context.close();
});

test('kicking practice is reachable through controls and preserves its chosen distance',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Practice guide',exact:true}).click();
 await page.locator('#practice-kick-distance').selectOption('50');await page.locator('#practice-kicking').click();
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return [game.practice,game.kick?.distance,game.kick?.stage];})).toEqual([true,50,'power']);
 await page.screenshot({path:'test-results/kick-practice-50.png'});
});

for(const viewport of [{width:844,height:304},{width:932,height:430}])test(`goal crossing remains visible after landing at ${viewport.width}`,async({browser})=>{
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#btn-practice').tap();
 await page.evaluate(async()=>{
  const e=await import('/src/simulation/engine.js'),{game,entities}=await import('/src/state/gameState.js');
  const {kickTrajectory,kickOutcome}=await import('/src/simulation/kicking.js'),{simulationNow}=await import('/src/state/clock.js');
  e.practiceFieldGoal(20);const now=simulationNow();const ball=kickTrajectory(game.los,99,1,.6,now-2100);
  Object.assign(game.kick,{flight:ball,stage:'flight',start:ball.startTime,...kickOutcome(ball)});entities.ball=ball;
 });
 await expect.poll(()=>page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return game.kick.stage;})).toBe('settle');
 await page.screenshot({path:`test-results/goal-crossing-${viewport.width}.png`});
 await expect(page.locator('#overlay-msg')).toContainText('GOOD');expect(errors).toEqual([]);await context.close();
});
