import {test,expect} from '@playwright/test';
for(const viewport of [{width:844,height:304},{width:932,height:430},{width:390,height:740}]){
 test(`gameplay menu layout ${viewport.width}`,async({browser})=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`test-results/game-menu-${name}-${viewport.width}.png`,animations:'disabled'});};
  await page.goto('/');await page.locator('#btn-new-game').tap();await shot('quickplay');
  await expect(page.locator('#team-select')).toBeInViewport({ratio:1});await expect(page.locator('#opponent-select')).toBeInViewport({ratio:1});await expect(page.locator('#btn-start-play')).toBeInViewport({ratio:1});
  await page.locator('#btn-start-play').tap();for(let i=0;i<4&&!await page.locator('#callsheet-overlay').isVisible();i++){await page.waitForTimeout(450);await page.locator('#btn-continue').tap();}await shot('playbook');await expect(page.locator('#formation-tabs')).toBeInViewport({ratio:1});
  if(viewport.width>viewport.height){await expect(page.locator('#play-page-next')).toBeInViewport({ratio:1});await page.locator('#play-page-next').tap();await expect(page.locator('#play-page-label')).toHaveText('2 / 2');}
  await page.locator('.play-btn').first().tap();await page.locator('#btn-pause').tap();await shot('pause');
  await expect(page.locator('#btn-close-settings')).toBeInViewport({ratio:1});await expect(page.locator('#btn-resume')).toBeInViewport({ratio:1});
  await page.locator('#pause-overlay [data-mode="tap"]').tap();await page.locator('#pause-overlay [data-diff="easy"]').tap();await shot('pause-controls');
  await expect(page.locator('#btn-close-settings')).toBeInViewport({ratio:1});await expect(page.locator('#btn-resume')).toBeInViewport({ratio:1});
  await page.locator('#btn-resume').tap();await expect(page.locator('#pause-overlay')).not.toBeVisible();
  await page.evaluate(async()=>{const {game}=await import('/src/state/gameState.js');game.los=72;game.distance=3;game.down=4;const hud=await import('/src/ui/hud.js');hud.showFourthDown();});
  await shot('fourth-down');for(const id of ['btn-go-for-it','btn-field-goal','btn-punt'])await expect(page.locator('#'+id)).toBeInViewport({ratio:1});
  await page.evaluate(async()=>{const hud=await import('/src/ui/hud.js');hud.showResult('OPPONENT DRIVE\nKickoff: opponent starts at its own 25.\nThe drive gains 42 yards.\nOpponent 50-yard field goal is good.\nDrive time: 1:37\nBOS 7 | BUF 3',()=>{});});
  await shot('drive-result');await expect(page.locator('#btn-continue')).toBeInViewport({ratio:1});await expect(page.locator('#result-kicker')).toBeInViewport({ratio:1});
  expect(errors).toEqual([]);await context.close();
 });
}
test('sprite inspector exports reversible labels tied to immutable source',async({page})=>{
 await page.goto('/tools/sprite-mask-editor.html');await expect(page.locator('#status')).toContainText('sprites.png');
 await page.locator('#frame').selectOption('2');await page.locator('#zoom').selectOption('8');await page.locator('#tool').selectOption('fill');
 // Source row 0, column 2 has a visible helmet near local x30,y19.
 const canvas=page.locator('#canvas');await canvas.click({position:{x:30*8+4,y:19*8+4}});
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await download.saveAs('test-results/sprite-mask-sample.json');
 await expect(page.locator('#status')).toContainText('Labels are review data only');await page.screenshot({path:'test-results/sprite-inspector.png'});
 await page.locator('#undo').click();await expect(page.locator('#status')).toContainText('0/');
});
test('uniform pilot isolates three masks and preserves all protected source pixels',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/tools/uniform-pilot.html');await expect(page.locator('#status')).toContainText('Source hash verified');
 await page.locator('#helmet').fill('#ff0000');await page.locator('#jersey').fill('#00ff00');await page.locator('#pants').fill('#0000ff');
 const check=await page.evaluate(async()=>{
  const mask=await (await fetch('/assets/masks/uniform-pilot.json')).json(),{decodeMask}=await import('/tools/uniform-pilot.mjs'),labels=decodeMask(mask,mask.sha256,384,320);let protectedPixels=0,changed=0,alphaErrors=0,protectedErrors=0;
  for(const f of mask.pilotFrames){const a=document.querySelector(`canvas[aria-label="${f.name} original large"]`).getContext('2d').getImageData(0,0,64,64).data,b=document.querySelector(`canvas[aria-label="${f.name} custom large"]`).getContext('2d').getImageData(0,0,64,64).data;for(let i=0;i<4096;i++){const id=labels[(f.row*64+Math.floor(i/64))*384+f.col*64+i%64];if(a[i*4+3]!==b[i*4+3])alphaErrors++;if(![1,2,3,4].includes(id)){protectedPixels++;for(let k=0;k<4;k++)if(a[i*4+k]!==b[i*4+k])protectedErrors++;}else if(a[i*4]!==b[i*4]||a[i*4+1]!==b[i*4+1]||a[i*4+2]!==b[i*4+2])changed++;}}
  return {protectedPixels,changed,alphaErrors,protectedErrors};
 });expect(check.alphaErrors).toBe(0);expect(check.protectedErrors).toBe(0);expect(check.changed).toBeGreaterThan(700);expect(check.protectedPixels).toBeGreaterThan(1000);
 await page.locator('#contrast').click();await page.screenshot({path:'test-results/uniform-pilot-contrast.png',fullPage:true});await page.locator('#classic').click();await page.screenshot({path:'test-results/uniform-pilot-classic.png',fullPage:true});await page.locator('#swap').click();expect(errors).toEqual([]);
});
