import {COLLEGE_TEAMS,COLLEGE_CONFERENCES,SCHOOL_TIERS,SCHEMES} from '../career/collegeData.js';
import * as Career from '../career/career.js';
import * as League from '../state/league.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById(id);
const helmet=t=>`<svg class="school-helmet" style="--career-color:${t.colors.primary};--team-primary:${t.colors.primary}" viewBox="0 0 32 28" aria-hidden="true"><use href="#helmet-icon"/></svg>`;
let selected=COLLEGE_TEAMS[0].id,conference=COLLEGE_TEAMS[0].conference;
function preview(school){
 const tier=SCHOOL_TIERS[school.tier],attrs=Career.ARCHETYPES[el('career-archetype').value].attributes;
 return `${helmet(school)}<h3>${school.city} ${school.name}</h3><p>${tier.name} · ${SCHEMES[school.scheme]}</p><p><b>Your starting attributes</b><br>${Object.entries(attrs).map(([k,v])=>`${k==='arm'?'Arm':k[0].toUpperCase()+k.slice(1)} ${v+tier.attributeBonus}`).join(' · ')}</p><p>Supporting cast: ${school.tier==='powerhouse'?'Strong':school.tier==='competitive'?'Balanced':'Developing'}</p><p>Expectation: ${tier.expectation}</p><p class="experience-note">Weekly goal: ${Math.round(tier.goalCompletions*100)}% completions, at most ${tier.goalTurnovers} INT on 6+ attempts. +${tier.goalXP} XP.</p>`;
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
 el('chosen-school-attributes').textContent=Object.entries(attrs).map(([k,v])=>`${k}: ${v+tier.attributeBonus}`).join(' · ');
}
export function renderCollegeCareer(c){
 const college=c.stage==='college',ready=college&&!!c.postseason?.champion;
 el('career-draft').hidden=!ready;
 el('college-progress').hidden=!college&&!c.collegeArchive;
 if(college){
  const projection=Career.draftProjection(c),school=COLLEGE_TEAMS.find(t=>t.id===c.teamId),tier=SCHOOL_TIERS[school.tier];
  el('college-progress').innerHTML=`<h3>Road to the draft</h3><p>${projection.label}</p><p>${tier.expectation}. Weekly goal: complete ${Math.round(tier.goalCompletions*100)}% of passes with at most ${tier.goalTurnovers} INT (6+ attempts), +${tier.goalXP} XP.</p><details class="scouting-help"><summary>What scouts look for</summary><p>Scouts value efficiency, ball security, wins and opponent strength. Difficulty is considered; longer quarters do not directly boost draft stock.</p></details>`;
  el('career-season').textContent=`College senior · ${c.postseason?'Postseason':'Week '+c.league.week+' / 12'} · ${League.findTeamState(c.league,c.teamId).record.wins}–${League.findTeamState(c.league,c.teamId).record.losses}`;
  el('career-next-season').hidden=true;
  el('career-matchup').textContent+=' · '+projection.label;
  if(ready){el('career-matchup').textContent='Senior season complete. Your next chapter awaits.';el('career-draft').textContent=c.draft?'View draft selection':'Enter the draft';}
 }else if(c.collegeArchive){
  const a=c.collegeArchive,team=League.findTeam(a.draft.teamId);
  el('college-progress').innerHTML=`<h3>Your college story</h3><p>${esc(a.school.city)} ${esc(a.school.name)}</p><p>${a.stats.passingYards} YDS · ${a.stats.passingTD} TD · ${a.stats.interceptions} INT</p><p>Drafted by ${esc(team.city)} ${esc(team.name)}: round ${a.draft.round}, pick ${a.draft.pick}.</p>`;
 }
 const select=el('league-stat-team'),valid=select.value;
 if(select.dataset.kind!==(college?'college':'pro')){
  select.innerHTML='<option value="">All teams</option>'+c.league.teams.map(t=>`<option value="${t.id}">${esc(t.city)} ${esc(t.name)}</option>`).join('');
  select.value=c.league.teams.some(t=>t.id===valid)?valid:'';select.dataset.kind=college?'college':'pro';
 }
 el('career-standings-note').textContent=college?'Top two in each conference reach its title game. Four conference champions advance to the national playoff.':'Top four teams reach the playoffs.';
 el('college-schedule').hidden=!college;
 if(college)el('college-schedule').innerHTML='<h3>Senior season schedule</h3>'+[...c.league.schedule,...(c.postseason?.games||[])].filter(g=>g.homeTeamId===c.teamId||g.awayTeamId===c.teamId).map(g=>{
  const other=League.findTeamState(c.league,g.homeTeamId===c.teamId?g.awayTeamId:g.homeTeamId);
  return `<div class="career-list-row"><span>W${g.week} · ${g.homeTeamId===c.teamId?'vs':'at'} ${esc(other.abbr)}</span><b>${g.status==='completed'?g.homeScore+'–'+g.awayScore:'Upcoming'}</b></div>`;
 }).join('');
}
export function initCollegeUI(getCareer,persist,render){
 el('career-path').onchange=syncCollegeEnrollment;el('career-archetype').addEventListener('change',syncCollegeEnrollment);
 el('choose-school').onclick=()=>{selected=el('career-school').value;conference=COLLEGE_TEAMS.find(t=>t.id===selected).conference;renderPicker();el('school-dialog').showModal();};
 el('school-confirm').onclick=()=>{el('career-school').value=selected;syncCollegeEnrollment();el('school-dialog').close();};
 el('school-back').onclick=()=>el('school-dialog').close();
 el('career-draft').onclick=()=>{
  const c=getCareer(),draft=Career.enterDraft(c);if(!draft)return;persist();
  const team=League.findTeamState(draft.league,draft.teamId);
  el('draft-selection').innerHTML=`<p class="sports-kicker">ROUND ${draft.round} · PICK ${draft.pick}</p>${helmet(team)}<h3>${esc(team.city)} ${esc(team.name)}</h3><p>You're headed to the pros.</p><p>Your player, attributes and earned upgrades come with you. Your college record stays in your career story.</p>`;
  el('draft-dialog').showModal();
 };
 el('draft-back').onclick=()=>el('draft-dialog').close();
 el('draft-continue').onclick=()=>{if(Career.beginProCareer(getCareer())){persist();el('draft-dialog').close();render();}};
 syncCollegeEnrollment();
}
