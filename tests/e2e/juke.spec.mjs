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
 await expect(page.locator('#runner-controls')).toBeVisible();
 const box=await page.locator('#field').boundingBox(),button=await page.locator('#btn-juke-up').boundingBox();
 const cdp=await context.newCDPSession(page),first={x:box.x+box.width*0.5,y:box.y+box.height*0.6,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,{x:button.x+button.width/2,y:button.y+button.height/2,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[first]});
 await expect.poll(()=>page.evaluate(async()=>(await import('/src/state/gameState.js')).entities.ballCarrier.x)).toBeLessThan(175);
 expect(await page.evaluate(async()=>(await import('/src/input/interactionState.js')).interaction.steering)).toBe(true);
 await page.screenshot({path:'test-results/juke-landscape.png'});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await context.close();
});
