import {standings} from '../state/league.js';
import {collegeStandings} from '../career/college.js';
const el=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shortMetric={passingYards:'YDS',receivingYards:'YDS',rushingYards:'YDS',passingTD:'TD',receivingTD:'TD',rushingTD:'TD',completionPct:'CMP %',completions:'CMP',attempts:'ATT',interceptions:'INT',sacks:'SACK',receptions:'REC',targets:'TGT',carries:'CAR'};
export function setLeagueView(view){
 el('career-league-panel').dataset.leagueView=view;
 for(const b of document.querySelectorAll('[data-league-view]')){
  const active=b.dataset.leagueView===view;b.setAttribute('aria-pressed',String(active));
  el(`league-${b.dataset.leagueView}-view`).hidden=!active;
 }
}
export function renderLeagueScreens(c,metrics,refresh){
 const panel=el('career-league-panel'),own=c.league.teams.find(t=>t.id===c.teamId),category=el('league-stat-category').value;
 for(const b of panel.querySelectorAll('[data-league-view]'))b.onclick=()=>setLeagueView(b.dataset.leagueView);
 setLeagueView(panel.dataset.leagueView||'leaders');
 el('league-categories').innerHTML=Object.keys(metrics).map(key=>`<button type="button" data-league-category="${key}" aria-pressed="${key===category}">${key[0].toUpperCase()+key.slice(1)}</button>`).join('');
 el('league-categories').querySelectorAll('button').forEach(b=>b.onclick=()=>{el('league-stat-category').value=b.dataset.leagueCategory;refresh();});
 el('league-metrics').innerHTML=metrics[category].map(([key,label])=>`<button type="button" data-league-metric="${key}" aria-label="${label}" aria-pressed="${key===el('league-stat-metric').value}">${shortMetric[key]}</button>`).join('');
 el('league-metrics').querySelectorAll('button').forEach(b=>b.onclick=()=>{el('league-stat-metric').value=b.dataset.leagueMetric;refresh();});
 const playoffs=el('league-season-scope').value==='playoffs';
 el('league-phase').textContent=playoffs?'Playoffs':'Regular';el('league-phase').setAttribute('aria-label',`Season phase: ${playoffs?'Playoffs':'Regular season'}`);
 el('league-phase').onclick=()=>{el('league-season-scope').value=playoffs?'regular':'playoffs';refresh();};
 el('league-team-open').textContent=`${c.league.teams.find(t=>t.id===el('league-stat-team').value)?.abbr||'All teams'} ▾`;
 el('league-team-open').setAttribute('aria-label',`Filter leaders by team: ${c.league.teams.find(t=>t.id===el('league-stat-team').value)?.name||'All teams'}`);
 const conferences=[...new Set(c.league.teams.map(t=>t.conference))];
 // Reset browsing state when loading another career or entering the pros.
 const identity=`${c.careerId}:${c.stage}:${c.teamId}:${c.league.season}`;
 if(panel.dataset.career!==identity){panel.dataset.career=identity;panel.dataset.conference=own.conference;panel.dataset.scheduleTeam=c.teamId;}
 const conf=conferences.includes(panel.dataset.conference)?panel.dataset.conference:own.conference;
 el('league-conferences').innerHTML=conferences.map(name=>`<button type="button" data-conference="${esc(name)}" aria-pressed="${name===conf}">${esc(name[0].toUpperCase()+name.slice(1))}</button>`).join('');
 el('league-conferences').querySelectorAll('button').forEach(b=>b.onclick=()=>{panel.dataset.conference=b.dataset.conference;renderLeagueScreens(c,metrics,refresh);});
 const ranked=c.stage==='college'?collegeStandings(c,conf):standings(c.league,conf);
 el('career-standings').innerHTML=`<table class="league-table"><thead><tr><th scope="col">Team</th><th scope="col">W</th><th scope="col">L</th><th scope="col">T</th><th scope="col">PF</th><th scope="col">PA</th></tr></thead><tbody>${ranked.map((t,i)=>`<tr class="${t.id===c.teamId?'league-own-team':''}"><th scope="row"><span class="league-rank">${i+1}</span><b>${esc(t.abbr)}</b> <span class="league-team-name">${esc(t.city)} ${esc(t.name)}</span>${t.id===c.teamId?'<small>YOU</small>':''}</th>${['wins','losses','ties','pointsFor','pointsAgainst'].map(k=>`<td>${t.record[k]??0}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 const scheduled=c.league.teams.find(t=>t.id===panel.dataset.scheduleTeam)||own;
 el('league-schedule-team').textContent=`${scheduled.abbr} ▾`;el('league-schedule-team').setAttribute('aria-label',`Schedule team: ${scheduled.name}`);
 el('career-schedule-section').querySelector('h3').textContent=scheduled.id===c.teamId?'Your season':`${scheduled.city} ${scheduled.name}`;
 const games=[...c.league.schedule,...(c.postseason?.games||[])].filter(g=>g.homeTeamId===scheduled.id||g.awayTeamId===scheduled.id);
 const next=games.find(g=>g.status!=='completed');
 el('college-schedule').hidden=false;
 el('college-schedule').innerHTML=games.map(g=>{
  const home=g.homeTeamId===scheduled.id,opponent=c.league.teams.find(t=>t.id===(home?g.awayTeamId:g.homeTeamId)),done=g.status==='completed',us=home?g.homeScore:g.awayScore,them=home?g.awayScore:g.homeScore;
  return `<div class="league-game ${g===next?'league-next-game':''}"><span>${esc(g.round?`Playoff ${g.round}`:`Week ${g.week}`)}</span><span>${home?'vs':'at'} <b>${esc(opponent?.abbr)}</b> <span class="league-team-name">${esc(opponent?.name)}</span></span><strong>${done?`${us===them?'T':us>them?'W':'L'} ${us}–${them}`:g===next?'NEXT':'Upcoming'}</strong></div>`;
 }).join('')||'<p>No games scheduled yet.</p>';
 const picker=el('league-team-dialog');let pickingSchedule=false;
 function choose(id){
  if(pickingSchedule)panel.dataset.scheduleTeam=id;else el('league-stat-team').value=id;
  picker.close();refresh();
 }
 function drawTeams(){
  const query=el('league-team-search').value.trim().toLowerCase(),selected=pickingSchedule?scheduled.id:el('league-stat-team').value;
  const teams=c.league.teams.filter(t=>`${t.city} ${t.name} ${t.abbr}`.toLowerCase().includes(query));
  el('league-team-options').innerHTML=teams.map(t=>`<button type="button" data-team="${esc(t.id)}" aria-pressed="${t.id===selected}"><b>${esc(t.abbr)}</b><span>${esc(t.city)} ${esc(t.name)}</span>${t.id===c.teamId?'<small>YOU</small>':''}</button>`).join('')||'<p>No matching teams.</p>';
  el('league-team-options').querySelectorAll('button').forEach(b=>b.onclick=()=>choose(b.dataset.team));
 }
 function openTeams(schedule){
  pickingSchedule=schedule;el('league-team-title').textContent=schedule?'Schedule team':'Filter leaders';el('league-team-search').value='';
  el('league-team-reset').textContent=schedule?'My team':'All teams';drawTeams();picker.showModal();el('league-team-close').focus();
 }
 el('league-team-search').oninput=drawTeams;el('league-team-reset').onclick=()=>choose(pickingSchedule?c.teamId:'');
 el('league-team-close').onclick=()=>picker.close();
 el('league-team-open').onclick=()=>openTeams(false);el('league-schedule-team').onclick=()=>openTeams(true);
}
