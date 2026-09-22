import {test,expect} from '@playwright/test';

for(const side of [25,355])test(`mobile juke stops at the ${side===25?'upper':'lower'} sideline`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#btn-practice').tap();await page.locator('.play-btn').first().tap();
 await page.evaluate(async(side)=>{
  const e=await import('/src/simulation/engine.js'),{game,entities}=await import('/src/state/gameState.js');
  e.startNewGame();e.startPlayerDrive(30);e.choosePlay('trips_verticals');e.onSnap();
  game.thrown=true;entities.ball.inFlight=false;entities.ballCarrier=entities.players.wr1;Object.assign(entities.ballCarrier,{x:side-12+(side===25?5:-5),yfield:45*28});
  for(const p of [...Object.values(entities.players),...entities.decor])if(p!==entities.ballCarrier)p.yfield=-10000;
 },side);
 const box=await page.locator('#field').boundingBox(),cdp=await context.newCDPSession(page);
 const start={x:box.x+box.width*.5,y:box.y+box.height*.5,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...start,y:start.y+(side===25?-55:55)}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('#overlay-msg')).toContainText('out of bounds');
 await expect(page.locator('#hud-user-score')).toHaveText('0');
 await expect(page.locator('#runner-controls')).toHaveCount(0);
 await page.screenshot({path:`test-results/sideline-${side}.png`});await context.close();
});
