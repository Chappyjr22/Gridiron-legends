import {test,expect} from '@playwright/test';

test('all 33 uniform poses preserve protected pixels and alpha through palettes and mirroring',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/tools/uniform-lab.html');await expect(page.locator('#status')).toContainText('33 poses');
 await page.locator('#play').click();
 for(const name of ['sprites','presnap-offense','presnap-defense']){
  await page.locator('#sheet').selectOption(name);
  const result=await page.evaluate(async name=>{
   const {decodeMask,recolorPixels}=await import('/tools/uniform-pilot.mjs');
   const bytes=await(await fetch(`/assets/${name}.png`)).arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   const bitmap=await createImageBitmap(new Blob([bytes])),mask=await(await fetch(`/assets/masks/${name}-uniform.json`)).json();const labels=decodeMask(mask,hash,bitmap.width,bitmap.height),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);const src=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   let unclassified=0,alphaErrors=0,protectedErrors=0,changed=0;const counts=[];
   for(const palette of [{1:[240,240,240],2:[210,0,0],3:[10,50,100],4:[230,230,230]},{1:[0,0,0],2:[255,255,0],3:[0,240,220],4:[160,0,255]}]){
    const out=recolorPixels(src,labels,palette);
    for(let i=0;i<labels.length;i++){if(src[i*4+3]&&!labels[i])unclassified++;if(out[i*4+3]!==src[i*4+3])alphaErrors++;if(![1,2,3,4].includes(labels[i])){for(let k=0;k<4;k++)if(src[i*4+k]!==out[i*4+k])protectedErrors++;}else if(src[i*4]!==out[i*4]||src[i*4+1]!==out[i*4+1]||src[i*4+2]!==out[i*4+2])changed++;}
   }
   for(const f of mask.frames){const parts=new Set();for(let y=0;y<64;y++)for(let x=0;x<64;x++)parts.add(labels[(f.row*64+y)*mask.width+f.col*64+x]);counts.push([1,2,3,4].every(id=>parts.has(id)));}
   return {unclassified,alphaErrors,protectedErrors,changed,counts};
  },name);
  expect(result.unclassified).toBe(0);expect(result.alphaErrors).toBe(0);expect(result.protectedErrors).toBe(0);expect(result.changed).toBeGreaterThan(500);expect(result.counts.every(Boolean)).toBe(true);
  for(const palette of ['contrast','classic','dark']){await page.locator('#'+palette).click();await page.screenshot({path:`test-results/uniform-${name}-${palette}.png`,fullPage:true});}
  const mirror=await page.evaluate(()=>{const c=document.querySelector('#gallery canvas'),ctx=c.getContext('2d');return [...ctx.getImageData(0,0,64,64).data];});
  await page.locator('#mirror').check();const mirrored=await page.evaluate(()=>[...document.querySelector('#gallery canvas').getContext('2d').getImageData(0,0,64,64).data]);
  const expectedMirror=new Array(mirror.length);for(let y=0;y<64;y++)for(let x=0;x<64;x++)for(let k=0;k<4;k++)expectedMirror[(y*64+x)*4+k]=mirror[(y*64+63-x)*4+k];expect(mirrored).toEqual(expectedMirror);
  await page.locator('#mirror').uncheck();
 }
 await page.locator('#sheet').selectOption('sprites');
 for(const name of ['Idle','Aim','Run','Carry run','Throw','Catch / drop','Tackle']){await page.locator('#track').selectOption(name);const seen=new Set();for(let i=0;i<6;i++){seen.add(await page.locator('#frame-label').textContent());await page.locator('#next').click();}expect(seen.size).toBeGreaterThanOrEqual(2);}
 expect(errors).toEqual([]);
});

test('runtime uses independent materials on all sheets and preserves saved pants variants',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await expect.poll(()=>page.evaluate(async()=>{const s=await import('/src/rendering/spriteSheets.js');return Object.values(s.uniformMaskStatus).filter(v=>v==='verified').length;})).toBe(3);
 const check=await page.evaluate(async()=>{
  const s=await import('/src/rendering/spriteSheets.js'),{OFF,DEF}=await import('/src/state/constants.js'),{recolorPixels}=await import('/tools/uniform-pilot.mjs');
  const team={colors:{primary:'#ff0000',secondary:'#00ff00',accent:'#ffff00'},uniforms:{home:{jersey:'#00cccc',helmet:'#ff0044',stripe:'#dddd00',pants:'#aa00cc'}},uniformPreference:'home'};
  s.applyUniform(team,OFF);s.applyUniform(team,DEF);s.rebuildSpriteSheets();let errors=0,checked=0;
  for(const [name,image,sheets] of [['sprites',s.spriteImage,s.spriteSheets.off],['presnap-offense',s.presnapSpriteImage,s.presnapSpriteSheets.off],['presnap-defense',s.defensePresnapSpriteImage,s.defensePresnapSpriteSheets]]){
   const mask=await(await fetch(`/assets/masks/${name}-uniform.json`)).json(),labels=new Uint8Array(mask.width*mask.height);for(const [start,length,id]of mask.runs)labels.fill(id,start,start+length);
   const c=document.createElement('canvas');c.width=image.width;c.height=image.height;c.getContext('2d').drawImage(image,0,0);const original=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   const expected=recolorPixels(original,labels,{1:[255,0,68],2:[221,221,0],3:[0,204,204],4:[170,0,204]});
   for(const sheet of sheets){const pixels=sheet.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<labels.length;i++){if(pixels[i*4+3]!==original[i*4+3])errors++;if([1,2,3,4].includes(labels[i])){checked++;for(let k=0;k<4;k++)if(pixels[i*4+k]!==expected[i*4+k])errors++;}}}
  }
  return {errors,checked,pants:OFF.pants};
 });expect(check.errors).toBe(0);expect(check.checked).toBeGreaterThan(10000);expect(check.pants).toBe('#aa00cc');
 await page.locator('#btn-team-editor').click();await page.getByLabel('Pants color',{exact:true}).fill('#7030aa');await page.locator('[data-uniform-variant="away"]').click();await page.getByLabel('Pants color',{exact:true}).fill('#223344');await page.locator('[data-uniform-variant="home"]').click();await expect(page.getByLabel('Pants color',{exact:true})).toHaveValue('#7030aa');await page.locator('#team-editor-save').click();await expect(page.locator('#team-editor-status')).toContainText('Team saved');await expect(page.locator('#team-editor-sprite')).toBeInViewport({ratio:1});await page.screenshot({path:'test-results/uniform-team-editor-mobile.png'});
 await page.setViewportSize({width:844,height:304});await expect(page.locator('#team-editor-sprite')).toBeInViewport({ratio:1});await expect(page.getByLabel('Pants color',{exact:true})).toBeInViewport({ratio:1});await page.screenshot({path:'test-results/uniform-team-editor-short.png'});await page.setViewportSize({width:844,height:390});
 await page.locator('#team-editor-close').click();await page.reload();await page.locator('#btn-team-editor').click();await expect(page.getByLabel('Pants color',{exact:true})).toHaveValue('#7030aa');await page.locator('[data-uniform-variant="away"]').click();await expect(page.getByLabel('Pants color',{exact:true})).toHaveValue('#223344');
 await page.locator('#team-editor-close').click();await page.locator('#btn-new-game').click();await page.locator('#btn-start-play').click();for(let i=0;i<4&&!await page.locator('#callsheet-overlay').isVisible();i++){await page.waitForTimeout(450);await page.locator('#btn-continue').click();}await page.locator('.play-btn').first().click();await page.screenshot({path:'test-results/uniform-game-mobile.png'});
});

test('mismatched mask falls back safely without blocking sprite readiness',async({page})=>{
 await page.route('**/assets/masks/sprites-uniform.json',async route=>{const response=await route.fetch(),mask=await response.json();mask.sha256='wrong';await route.fulfill({json:mask});});await page.goto('/');
 await expect.poll(()=>page.evaluate(async()=>{const s=await import('/src/rendering/spriteSheets.js');return [s.uniformMaskStatus.sprites,s.spriteState.spritesReady];})).toEqual(['fallback',true]);
});

test('career away uniforms agree with scoreboard and survive a resume',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Start new career',exact:true}).click();await page.getByLabel('Player name',{exact:true}).fill('Uniform Audit');await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Begin senior season',exact:true}).click();await page.getByRole('button',{name:'Play next game',exact:true}).click();
 const check=()=>page.evaluate(async()=>{const {game,teamState}=await import('/src/state/gameState.js');const {OFF,DEF}=await import('/src/state/constants.js');const {resolvedUniform}=await import('/src/rendering/uniformVariants.js');const ours=resolvedUniform(teamState.userTeam,game.userIsHome);return {home:game.userIsHome,jersey:OFF.jersey,expected:ours.jersey,helmet:OFF.helmet,hud:document.getElementById('hud-user-team').style.getPropertyValue('--helmet-color'),opponentHelmet:DEF.helmet,opponentHud:document.getElementById('hud-cpu-team').style.getPropertyValue('--helmet-color')};});
 let s=await check();expect(s.home).toBe(false);expect(s.jersey).toBe(s.expected);expect(s.helmet).toBe(s.hud);expect(s.opponentHelmet).toBe(s.opponentHud);
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).click();await page.getByRole('button',{name:'Continue last career',exact:true}).click();await page.getByRole('button',{name:'Resume game',exact:true}).click();expect(await check()).toEqual(s);
});

test('real team home and away palettes across gameplay and presnap poses',async({page})=>{
 await page.goto('/');await expect.poll(()=>page.evaluate(async()=>{const s=await import('/src/rendering/spriteSheets.js');return s.spriteState.spritesReady&&s.spriteState.presnapSpritesReady&&s.spriteState.defensePresnapSpritesReady;})).toBe(true);
 await page.evaluate(async()=>{
  const s=await import('/src/rendering/spriteSheets.js'),{TEAMS}=await import('/src/state/league.js'),{resolvedUniform}=await import('/src/rendering/uniformVariants.js');
  document.body.innerHTML='';document.body.style='margin:0;background:#263c50;color:white;font:16px sans-serif;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px';
  for(const id of ['bos','cin','min'])for(const home of [true,false]){const team=structuredClone(TEAMS.find(t=>t.id===id)),uniform=resolvedUniform(team,home),card=document.createElement('section');card.innerHTML=`<b>${team.abbr} ${home?'Home':'Away'} · helmet ${uniform.helmet} · jersey ${uniform.jersey}</b>`;document.body.append(card);
   for(const [img,row,col] of [[s.spriteImage,0,3],[s.spriteImage,1,0],[s.spriteImage,4,4],[s.presnapSpriteImage,0,0],[s.presnapSpriteImage,0,3],[s.defensePresnapSpriteImage,0,1]]){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;canvas.style='width:96px;height:96px;image-rendering:pixelated';const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(s.makeTeamSpriteSheet(uniform,2,img,img!==s.spriteImage),col*64,row*64,64,64,0,0,128,128);card.append(canvas);}
  }
 });await page.screenshot({path:'test-results/uniform-real-team-palettes.png',fullPage:true});
});
