import {renderDraftNight} from './draftNight.js';
import {weeklyGoal,DEVELOPMENT,RECOMMENDED_DEVELOPMENT,proProjection} from '../career/development.js';
import {COLLEGE_TEAMS,COLLEGE_CONFERENCES,SCHOOL_TIERS,SCHEMES} from '../career/collegeData.js';
import * as Career from '../career/career.js';
import * as League from '../state/league.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById(id);
const helmet=t=>`<svg class="school-helmet" style="--career-color:${t.colors.primary};--team-primary:${t.colors.primary};--helmet-stripe:${t.colors.accent}" viewBox="0 0 32 28" aria-hidden="true"><use href="#helmet-icon"/></svg>`;
let selected=COLLEGE_TEAMS[0].id,conference=COLLEGE_TEAMS[0].conference;
export function enrollmentDevelopment(){
 const chosen=el('career-development').value;
 if(chosen!=='recommended')return chosen;
 const school=COLLEGE_TEAMS.find(t=>t.id===el('career-school').value);
 return el('career-path').value==='college'?RECOMMENDED_DEVELOPMENT[school.tier]:'standard';
}
function ratingPreview(attrs){
 const p={attributes:attrs,rating:Math.round(Object.values(attrs).reduce((n,v)=>n+v,0)/4)};
 return `College overall ${p.rating} · Projected pro overall ${proProjection(p,{progressionVersion:2}).overall}`;
}
function preview(school){
 const tier=SCHOOL_TIERS[school.tier],attrs=Career.ARCHETYPES[el('career-archetype').value].attributes;
 return `${helmet(school)}<h3>${school.city} ${school.name}</h3><p>${tier.name} · ${SCHEMES[school.scheme]}</p><p><b>Your starting attributes</b><br>${Object.entries(attrs).map(([k,v])=>`${k==='arm'?'Arm':k[0].toUpperCase()+k.slice(1)} ${v+tier.attributeBonus}`).join(' · ')}</p><p>${ratingPreview(Object.fromEntries(Object.entries(attrs).map(([k,v])=>[k,v+tier.attributeBonus])))}</p><p>Recommended development: ${DEVELOPMENT[RECOMMENDED_DEVELOPMENT[school.tier]].name}. You can choose any speed.</p><p>Supporting cast: ${school.tier==='powerhouse'?'Strong':school.tier==='competitive'?'Balanced':'Developing'}</p><p>Expectation: ${tier.expectation}</p><p class="experience-note">Rotating weekly objectives reward efficient passing, ball security, scoring and scrambling. Base reward: 20 XP before development speed.</p>`;
}
function renderPicker(){
 el('school-conferences').innerHTML=Object.values(COLLEGE_CONFERENCES).map(c=>`<button type="button" class="sports-button ${conference===c.id?'gold':'blue'}" data-conference="${c.id}" aria-pressed="${conference===c.id}">${c.name.replace(' Conference','')}</button>`).join('');
 el('school-grid').innerHTML=COLLEGE_TEAMS.filter(t=>t.conference===conference).map(t=>`<button type="button" class="school-card" data-school="${t.id}" aria-pressed="${selected===t.id}">${helmet(t)}<span class="school-copy"><b>${t.city}</b><small>${t.name}</small><small class="school-tier">${SCHOOL_TIERS[t.tier].name}</small></span></button>`).join('');
 el('school-preview').innerHTML=preview(COLLEGE_TEAMS.find(t=>t.id===selected));
 for(const b of el('school-conferences').querySelectorAll('button'))b.onclick=()=>{conference=b.dataset.conference;selected=COLLEGE_TEAMS.find(t=>t.conference===conference).id;renderPicker();};
 for(const b of el('school-grid').querySelectorAll('button'))b.onclick=()=>{selected=b.dataset.school;renderPicker();};
}
export function syncCollegeEnrollment(){
 const college=el('career-path').value==='college';
 el('career-pro-choice').hidden=college;el('career-college-choice').hidden=!college;
 el('career-begin').textContent=college?'Begin senior season':'Begin rookie season';
 const school=COLLEGE_TEAMS.find(t=>t.id===el('career-school').value)||COLLEGE_TEAMS[0];
 const attrs=Career.ARCHETYPES[el('career-archetype').value].attributes,tier=SCHOOL_TIERS[school.tier];
 el('chosen-school').textContent=`${school.city} ${school.name} · ${tier.name}`;
 el('chosen-school-attributes').textContent=ratingPreview(Object.fromEntries(Object.entries(attrs).map(([k,v])=>[k,v+tier.attributeBonus])));
 const dev=DEVELOPMENT[enrollmentDevelopment()];
 el('career-development-note').textContent=`${dev.name} development · ${dev.multiplier}× XP. ${dev.description} Stays with you in the pros.`+(college?' College ratings can reach 99, which converts to 85 in the pros. Three college upgrade points convert to one pro point; leftover value becomes XP.':'');
}
export function renderCollegeCareer(c){
 const college=c.stage==='college',ready=college&&!!c.postseason?.champion;
 el('career-draft').hidden=!ready;
 el('college-progress').hidden=!college&&!c.collegeArchive;
 if(college){
  const projection=Career.draftProjection(c),school=COLLEGE_TEAMS.find(t=>t.id===c.teamId),tier=SCHOOL_TIERS[school.tier];
  const rating=proProjection(Career.careerPlayer(c),c);
  const objective=weeklyGoal(c);const target=`<p>${esc(objective.label)}</p>`;
  el('college-progress').innerHTML=`<section class="story-card draft-projection"><span class="board-kicker">Road to the draft</span><h3>${projection.label}</h3><p>${tier.expectation}</p><p>College overall <b>${rating.collegeOverall}</b> · Projected pro overall <b>${rating.overall}</b></p><p class="experience-note">${c.progressionVersion===2?'Ratings reflect your competition. Your abilities convert at the draft; your development speed stays with you.':'Existing career: original progression and attribute carryover preserved.'}</p></section><section class="story-card"><div class="challenge-heading"><h3>Weekly objective</h3><span class="reward-chip">${objective.kind==='teammate'?'+1 CATCHING':`+${objective.xp} XP`}</span></div>${target}</section>`;
  el('career-weekly-goal').innerHTML=ready?'<p>Senior season complete. Your draft awaits.</p>':target;
  el('career-goal-reward').textContent=ready?'DRAFT READY':`+${objective.xp} XP`;
  el('career-season').textContent=`College senior · ${c.postseason?'Postseason':'Week '+c.league.week+' / 12'} · ${League.findTeamState(c.league,c.teamId).record.wins}–${League.findTeamState(c.league,c.teamId).record.losses}`;
  el('career-next-season').hidden=true;

  if(ready){el('career-matchup').textContent='Senior season complete. Your next chapter awaits.';el('career-draft').textContent=c.draft?'View draft selection':'Enter the draft';}
 }else if(c.collegeArchive){
  const a=c.collegeArchive,team=League.findTeam(a.draft.teamId);
  el('college-progress').innerHTML=`<h3>Your college story</h3><p>${esc(a.school.city)} ${esc(a.school.name)}</p>${a.finalOverall!=null?`<p>Final college overall <b>${a.finalOverall}</b> · Rookie overall <b>${c.proEntry.rookieOverall}</b></p>`:''}<p>${a.stats.passingYards} YDS · ${a.stats.passingTD} TD · ${a.stats.interceptions} INT</p><p>Drafted by ${esc(team.city)} ${esc(team.name)}: round ${a.draft.round}, pick ${a.draft.pick}.</p>${a.draftReport?.projection?.boosts?.map(b=>`<p>${esc(b.title)}: projection ${b.before} → ${b.after}</p>`).join('')||''}`;
 }
 const select=el('league-stat-team'),valid=select.value;
 if(select.dataset.kind!==(college?'college':'pro')){
  select.innerHTML='<option value="">All teams</option>'+c.league.teams.map(t=>`<option value="${t.id}">${esc(t.city)} ${esc(t.name)}</option>`).join('');
  select.value=c.league.teams.some(t=>t.id===valid)?valid:'';select.dataset.kind=college?'college':'pro';
 }
 el('career-standings-note').textContent=college?'Top two in each conference reach its title game. Four conference champions advance to the national playoff.':'Top four teams in each conference reach the playoffs.';
 el('college-schedule').hidden=!college;
 if(college)el('college-schedule').innerHTML='<h3>Senior season schedule</h3>'+[...c.league.schedule,...(c.postseason?.games||[])].filter(g=>g.homeTeamId===c.teamId||g.awayTeamId===c.teamId).map(g=>{
  const other=League.findTeamState(c.league,g.homeTeamId===c.teamId?g.awayTeamId:g.homeTeamId);
  return `<div class="career-list-row"><span>W${g.week} · ${g.homeTeamId===c.teamId?'vs':'at'} ${esc(other.abbr)}</span><b>${g.status==='completed'?(g.homeTeamId===c.teamId?g.homeScore:g.awayScore)+'–'+(g.homeTeamId===c.teamId?g.awayScore:g.homeScore):'Upcoming'}</b></div>`;
 }).join('');
}
export function initCollegeUI(getCareer,persist,render){
 el('career-development').onchange=syncCollegeEnrollment;
 el('career-path').onchange=syncCollegeEnrollment;el('career-archetype').addEventListener('change',syncCollegeEnrollment);
 el('choose-school').onclick=()=>{selected=el('career-school').value;conference=COLLEGE_TEAMS.find(t=>t.id===selected).conference;renderPicker();el('school-dialog').showModal();};
 el('school-confirm').onclick=()=>{el('career-school').value=selected;syncCollegeEnrollment();el('school-dialog').close();};
 el('school-back').onclick=()=>el('school-dialog').close();
 el('career-draft').onclick=()=>{
  const c=getCareer(),draft=Career.enterDraft(c);if(!draft)return;persist();
  const team=League.findTeamState(draft.league,draft.teamId);
  renderDraftNight(c,draft,team,helmet);
  el('draft-dialog').showModal();
 };
 el('draft-back').onclick=()=>el('draft-dialog').close();
 el('draft-continue').onclick=()=>{if(Career.beginProCareer(getCareer())){persist();el('draft-dialog').close();render();}};
 syncCollegeEnrollment();
}
