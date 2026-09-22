import {test,expect} from '@playwright/test';
test('second-finger juke works while steering stays captured',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true});const page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const engine=await import('/src/simulation/engine.js'),{game,entities}=await import('/src/state/gameState.js');
  engine.onSnap();for(const p of [...Object.values(entities.players),...entities.decor]){p.x=300;p.yfield=0;}
  Object.assign(entities.players.wr1,{x:190,yfield:35*28});entities.ballCarrier=entities.players.wr1;
  entities.ball.inFlight=false;game.thrown=true;game.cameraYard=35;
 });
 await expect(page.locator('#runner-controls')).toHaveCount(0);
 const box=await page.locator('#field').boundingBox();
 const cdp=await context.newCDPSession(page),first={x:box.x+box.width*0.5,y:box.y+box.height*0.6,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
 expect(await page.evaluate(async()=>(await import('/src/input/interactionState.js')).interaction.steering)).toBe(true);
 const second={x:box.x+box.width*.7,y:box.y+box.height*.6,id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[first,{...second,y:second.y-55}]});
 // CDP's WebTouchEvent path ends the listed touch, leaving the other finger held.
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...second,y:second.y-55}]});
 await expect.poll(()=>page.evaluate(async()=>(await import('/src/state/gameState.js')).entities.ballCarrier.x)).toBeLessThan(175);
 expect(await page.evaluate(async()=>(await import('/src/input/interactionState.js')).interaction.steering)).toBe(true);
 await page.screenshot({path:'test-results/juke-landscape.png'});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await context.close();
});

for(const [runner,dx,dy,expected] of [['wr1',0,55,'juke'],['wr1',-65,0,'runnerDive'],['qb',-65,0,'runnerSlide']])test(`quick touch swipe gives ${runner} ${expected}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:667,height:304},hasTouch:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async key=>{
  const e=await import('/src/simulation/engine.js'),{game,entities}=await import('/src/state/gameState.js');e.onSnap();
  for(const p of [...Object.values(entities.players),...entities.decor]){p.x=300;p.yfield=-10000;}
  entities.ballCarrier=entities.players[key];Object.assign(entities.ballCarrier,{x:190,yfield:35*28});
  entities.ball.inFlight=false;game.thrown=true;game.scrambling=key==='qb';game.cameraYard=35;
 },runner);
 const box=await page.locator('#field').boundingBox(),cdp=await context.newCDPSession(page),start={x:box.x+box.width*.65,y:box.y+box.height*.45,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...start,x:start.x+dx,y:start.y+dy}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.evaluate(async()=>{const {entities}=await import('/src/state/gameState.js');return entities.ballCarrier.jukeReadyAt?'juke':entities.ballCarrier.action;})).toBe(expected);
 await context.close();
});

test('cancelled second finger leaves steering active and does not juke',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async()=>{
  const e=await import('/src/simulation/engine.js'),{game,entities}=await import('/src/state/gameState.js');e.onSnap();
  for(const p of [...Object.values(entities.players),...entities.decor])p.yfield=-10000;
  entities.ballCarrier=entities.players.wr1;Object.assign(entities.ballCarrier,{x:190,yfield:35*28});entities.ball.inFlight=false;game.thrown=true;
 });
 const box=await page.locator('#field').boundingBox(),cdp=await context.newCDPSession(page),first={x:box.x+box.width*.5,y:box.y+box.height*.5,id:1},second={...first,x:first.x+100,id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
 await page.evaluate(()=>{window.secondaryPointer=null;document.getElementById('field').addEventListener('pointerdown',e=>window.secondaryPointer=e.pointerId,{once:true});});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});
 await page.evaluate(()=>document.getElementById('field').dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.secondaryPointer})));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[first,{...second,y:second.y-55}]});
 // CDP's WebTouchEvent path ends the listed touch, leaving the other finger held.
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...second,y:second.y-55}]});
 expect(await page.evaluate(async()=>{const {interaction}=await import('/src/input/interactionState.js'),{entities}=await import('/src/state/gameState.js');return {steering:interaction.steering,juked:!!entities.ballCarrier.jukeReadyAt};})).toEqual({steering:true,juked:false});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await context.close();
});
