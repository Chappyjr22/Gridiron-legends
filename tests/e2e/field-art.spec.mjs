import {test,expect} from '@playwright/test';

for(const viewport of [{width:844,height:304},{width:932,height:430}]){
  test(`daytime field art and touch alignment ${viewport.width}x${viewport.height}`,async({browser})=>{
    const context=await browser.newContext({viewport,hasTouch:true});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');await page.locator('#btn-practice').tap();
    await page.locator('[data-play="trips_slants"]').tap();
    await expect.poll(()=>page.evaluate(async()=>{
      const {stadiumArt}=await import('/src/rendering/stadiumArt.js');
      const {staffFrames}=await import('/src/rendering/stadiumStaff.js');
      return !!stadiumArt.turf&&!!stadiumArt.crowd&&stadiumArt.equipment.length===4&&staffFrames.length===6;
    })).toBe(true);
    await page.screenshot({path:`test-results/daytime-field-${viewport.width}.png`});
    const rb=await page.evaluate(async()=>{
      const {entities}=await import('/src/state/gameState.js');
      const {toCanvas}=await import('/src/rendering/players.js');
      const {SCENE_TOP}=await import('/src/rendering/sceneLayout.js');
      const p=toCanvas(entities.players.rb),canvas=document.getElementById('field'),r=canvas.getBoundingClientRect();
      return {x:r.x+p.cx*r.width/canvas.width,y:r.y+(p.cy+SCENE_TOP)*r.height/canvas.height};
    });
    await page.touchscreen.tap(rb.x,rb.y);
    expect(await page.evaluate(async()=>(await import('/src/state/gameState.js')).game.runActive)).toBe(true);
    await page.evaluate(async()=>{
      const {game}=await import('/src/state/gameState.js');game.paused=true;game.cameraYard=99;
      (await import('/src/rendering/draw.js')).draw();
    });
    await page.screenshot({path:`test-results/daytime-endzone-${viewport.width}.png`});
    const chains=await page.evaluate(async()=>{
      const {chainPositions}=await import('/src/rendering/stadiumLayout.js');
      return [chainPositions({los:26,firstDownYard:30,down:2}),chainPositions({los:97,firstDownYard:107,down:1})];
    });
    expect(chains[0]).toEqual({showChains:true,start:20,target:30,down:26,number:2});
    expect(chains[1].showChains).toBe(false);
    await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');game.cameraYard=-10;(await import('/src/rendering/draw.js')).draw();});
    await page.screenshot({path:`test-results/daytime-home-endzone-${viewport.width}.png`});
    expect(errors).toEqual([]);await context.close();
  });
}
