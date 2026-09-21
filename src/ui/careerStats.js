import {seasonPlayerRows} from '../career/leagueStats.js';
const el=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rate=(n,d,suffix='')=>d?`${(n/d).toFixed(1)}${suffix}`:'—';
function tiles(values){return `<dl class="stat-tiles">${values.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;}
const metrics={
 passing:[['passingYards','Passing yards'],['passingTD','Touchdowns'],['completionPct','Completion %'],['completions','Completions'],['attempts','Attempts'],['interceptions','Interceptions'],['sacks','Sacks']],
 receiving:[['receivingYards','Receiving yards'],['receivingTD','Touchdowns'],['receptions','Receptions'],['targets','Targets']],
 rushing:[['rushingYards','Rushing yards'],['rushingTD','Touchdowns'],['carries','Carries']]
};
const score=(s,key)=>!s?null:key==='completionPct'?(s.attempts?s.completions*100/s.attempts:null):s[key];
export function renderPlayerStats(c){
 const root=el('career-qb-stats'),category=root.dataset.category||'passing';
 const draw=()=>{
  const rushing=root.dataset.category==='rushing';
  root.querySelector('.stat-comparison').innerHTML=[['Game',c.lastResult?.stats],['Season',c.seasonStats],['Career',c.totals]].map(([title,s])=>`<section aria-label="${title} ${rushing?'rushing':'passing'}"><h3>${title}</h3>${s?tiles(rushing?[['CAR',s.carries??0],['YDS',s.rushingYards??0],['AVG',rate(s.rushingYards??0,s.carries)],['TD',s.rushingTD??0]]:[['YDS',s.passingYards],['TD',s.passingTD],['CMP',rate(s.completions*100,s.attempts,'%')],['ATT',s.attempts],['INT',s.interceptions],['SACK',s.sacks]]):'<p>No completed game yet.</p>'}</section>`).join('');
  root.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===root.dataset.category)));
 };
 root.dataset.category=category;
 root.innerHTML='<div class="player-stat-categories" role="group" aria-label="Player stat category"><button type="button" data-category="passing">Passing</button><button type="button" data-category="rushing">Rushing</button></div><div class="stat-comparison"></div>';
 root.querySelectorAll('button').forEach(b=>b.onclick=()=>{root.dataset.category=b.dataset.category;draw();});
 draw();
}
export function renderCareerStats(c){
 renderPlayerStats(c);
 const teamId=el('league-stat-team').value,category=el('league-stat-category').value,select=el('league-stat-metric');
 if(select.dataset.category!==category){select.innerHTML=metrics[category].map(([key,label])=>`<option value="${key}">${label}</option>`).join('');select.dataset.category=category;}
 let scope=document.getElementById('league-season-scope');if(!scope){scope=document.createElement('select');scope.id='league-season-scope';scope.setAttribute('aria-label','Season phase');scope.innerHTML='<option value="regular">Regular season</option><option value="playoffs">Playoffs</option>';el('league-stat-category').after(scope);}scope.onchange=()=>renderCareerStats(c);
 const key=select.value,data=seasonPlayerRows(c,scope.value);
 const minimum=Math.max(6,(scope.value==='playoffs'?1:Math.min(17,c.league.week-1))*6);
 const rows=data.rows.filter(r=>(key!=='completionPct'||r.stats?.attempts>=minimum)&&(!teamId||r.team.id===teamId)&&(category==='passing'?r.player.slot==='QB':category==='receiving'?/^(WR|TE|RB)/.test(r.player.slot):/^(RB|QB)/.test(r.player.slot))).sort((a,b)=>(score(b.stats,key)??-1)-(score(a.stats,key)??-1)||a.player.lastName.localeCompare(b.player.lastName));
 const label=metrics[category].find(m=>m[0]===key)[1];
 el('league-player-stats').innerHTML=`<p class="leaderboard-caption">${esc(label)} · highest first${key==='completionPct'?` · minimum ${minimum} attempts`:''}</p><ol class="leaderboard">${rows.map(({team,player,stats:s})=>{
  const value=score(s,key),display=value==null?'—':key==='completionPct'?value.toFixed(1)+'%':value;
  return `<li><span class="leader-name">${esc(player.firstName+' '+player.lastName)}<small>${esc(team.abbr)} · ${esc(player.slot)} · ${s?s.games+' tracked games':'Not tracked yet'}</small></span><strong>${esc(display)}</strong></li>`;
 }).join('')||'<li>No qualified players yet.</li>'}</ol>`;
 el('league-stat-coverage').textContent=`${scope.value==='playoffs'?'Playoffs only.':'Regular season only.'} ${data.covered}/${data.games} completed games have box scores. Your team uses recorded plays. Opponents and other teams use simulated production; league possessions scale with your quarter length. Earlier untracked games show —, not zero. GP counts tracked appearances.`;
}
