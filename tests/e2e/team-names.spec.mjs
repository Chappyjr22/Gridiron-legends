import {test,expect} from '@playwright/test';

async function editName(page,city,name,abbr){
 const details=page.locator('.team-editor-brand');if(!await details.evaluate(e=>e.open))await details.locator('summary').click();
 await page.getByLabel('City / school',{exact:true}).fill(city);await page.getByLabel('Team name',{exact:true}).fill(name);await page.getByLabel('Abbreviation',{exact:true}).fill(abbr);
}
test('mobile team names validate, save, refresh selectors, and survive reload',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:304},hasTouch:true}),page=await context.newPage();await page.goto('/');await page.locator('#btn-team-editor').tap();
 const id=await page.locator('#team-editor-select').inputValue();
 await editName(page,'River City','','rc');await page.locator('#team-editor-save').tap();await expect(page.locator('#team-editor-status')).toContainText('Enter a city');
 await page.getByLabel('Team name',{exact:true}).fill('Hawks');await page.getByLabel('Abbreviation',{exact:true}).fill('r');await page.locator('#team-editor-save').tap();await expect(page.locator('#team-editor-status')).toContainText('2–4');
 await page.getByLabel('Abbreviation',{exact:true}).fill('rch');await page.locator('#team-editor-save').tap();await expect(page.locator('#team-editor-status')).toContainText('Team saved');
 await page.getByLabel('Team name',{exact:true}).scrollIntoViewIfNeeded();await expect(page.getByLabel('Team name',{exact:true})).toBeInViewport({ratio:1});await expect(page.locator('#team-editor-save')).toBeInViewport({ratio:1});
 expect(await page.locator('.team-editor-panel').last().evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:'test-results/team-name-editor-mobile.png'});
 await page.locator('#team-editor-close').tap();await expect(page.locator(`#team-select option[value="${id}"]`)).toHaveText('River City Hawks');
 await page.reload();await page.locator('#btn-team-editor').tap();await expect(page.getByLabel('Team name',{exact:true})).toHaveValue('Hawks');await expect(page.getByLabel('Abbreviation',{exact:true})).toHaveValue('RCH');
 await editName(page,'Cancelled','Change','XX');await page.locator('#team-editor-cancel').tap();await page.locator('#btn-team-editor').tap();await expect(page.getByLabel('Team name',{exact:true})).toHaveValue('Hawks');await context.close();
});

test('college rename preserves the team ID and updates career and scoreboard after reload',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true}),page=await context.newPage();await page.goto('/');
 await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Start new career',exact:true}).tap();await page.getByLabel('Player name',{exact:true}).fill('Team Rename');await page.getByRole('button',{name:'Next',exact:true}).tap();await page.getByRole('button',{name:'Begin senior season',exact:true}).tap();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')));
 await page.getByRole('tab',{name:'My Team',exact:true}).tap();await page.locator('#career-team-editor').tap();await editName(page,'Lake State','Otters','lso');await page.locator('#team-editor-save').tap();await expect(page.locator('#team-editor-status')).toContainText('Team saved');await page.locator('#team-editor-close').tap();await expect(page.locator('#my-team-name')).toContainText('Lake State Otters');
 await page.reload();await page.getByRole('button',{name:'Career Mode',exact:true}).tap();await page.getByRole('button',{name:'Continue last career',exact:true}).tap();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('gridironLegendsCareerV1')));expect(after.teamId).toBe(before.teamId);expect(after.league.schedule).toEqual(before.league.schedule);
 expect(after.league.teams.find(t=>t.id===after.teamId)).toMatchObject({city:'Lake State',name:'Otters',abbr:'LSO'});
 await page.getByRole('button',{name:'Play next game',exact:true}).tap();await expect(page.locator('#hud-user-team')).toContainText('LSO');await context.close();
});
