import {test,expect} from '@playwright/test';
async function ready(page){await page.goto('/');await page.locator('#btn-practice').click();await page.locator('[data-play="trips_slants"]').click();}
async function rbPoint(page){return page.evaluate(async()=>{const {entities}=await import('/src/state/gameState.js'),{toCanvas}=await import('/src/rendering/players.js'),p=toCanvas(entities.players.rb),canvas=document.getElementById('field'),r=canvas.getBoundingClientRect();return {x:r.x+p.cx*r.width/canvas.width,y:r.y+p.cy*r.height/canvas.height};});}
for(const touch of [false,true])test(`RB-origin drag remains a pass (${touch?'touch':'mouse'})`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 const p=await rbPoint(page);
 if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:p.x,y:p.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:p.x+60,y:p.y+12}]});
  await page.screenshot({path:'test-results/lead-guide-touch.png'});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+60,p.y+12,{steps:6});await page.mouse.up();}
 const state=await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');return {threw:game.playFacts.threw,run:game.runActive};});expect(state.threw).toBe(true);expect(state.run).toBe(false);expect(errors).toEqual([]);await context.close();
});
test('routine result leaves most of the field visible and continue advances once',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();await ready(page);
 await page.evaluate(async()=>{const e=await import('/src/simulation/engine.js');e.endPlay(7,'Catch',false,27);});
 await expect(page.locator('#result-overlay')).toHaveClass(/compact-result/);
 const card=await page.locator('#result-card').boundingBox(),field=await page.locator('#field').boundingBox();expect(card.height).toBeLessThan(field.height*.5);
 await expect(page.locator('#btn-continue')).toBeInViewport();await page.screenshot({path:'test-results/compact-play-result.png'});
 await page.waitForTimeout(450);await page.locator('#btn-continue').tap();await expect(page.locator('#callsheet-overlay')).toBeVisible();await context.close();
});
