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
export function renderCareerStats(c){
 el('career-qb-stats').innerHTML='<div class="stat-comparison">'+[['Game',c.lastResult?.stats],['Season',c.seasonStats],['Career',c.totals]].map(([title,s])=>`<section><h3>${title}</h3>${s?tiles([['YDS',s.passingYards],['TD',s.passingTD],['CMP',rate(s.completions*100,s.attempts,'%')],['ATT',s.attempts],['INT',s.interceptions],['SACK',s.sacks],['RUSH',s.rushingYards]]):'<p>No completed game yet.</p>'}</section>`).join('')+'</div>';
 const teamId=el('league-stat-team').value,category=el('league-stat-category').value,select=el('league-stat-metric');
 if(select.dataset.category!==category){select.innerHTML=metrics[category].map(([key,label])=>`<option value="${key}">${label}</option>`).join('');select.dataset.category=category;}
 const key=select.value,data=seasonPlayerRows(c);
 const rows=data.rows.filter(r=>(!teamId||r.team.id===teamId)&&(category==='passing'?r.player.slot==='QB':category==='receiving'?/^(WR|TE|RB)/.test(r.player.slot):/^(RB|QB)/.test(r.player.slot))).sort((a,b)=>(score(b.stats,key)??-1)-(score(a.stats,key)??-1)||a.player.lastName.localeCompare(b.player.lastName));
 const label=metrics[category].find(m=>m[0]===key)[1];
 el('league-player-stats').innerHTML=`<p class="leaderboard-caption">${esc(label)} · highest first${key==='completionPct'?' · all players with a pass attempt':''}</p><ol class="leaderboard">${rows.map(({team,player,stats:s})=>{
  const value=score(s,key),display=value==null?'—':key==='completionPct'?value.toFixed(1)+'%':value;
  return `<li><span class="leader-name">${esc(player.firstName+' '+player.lastName)}<small>${esc(team.abbr)} · ${esc(player.slot)} · ${s?s.games+' tracked games':'Not tracked yet'}</small></span><strong>${esc(display)}</strong></li>`;
 }).join('')}</ol>`;
 el('league-stat-coverage').textContent=`Current season including playoffs. ${data.covered}/${data.games} completed games have box scores. Your team uses recorded plays. Opponents and other teams use simulated production. Earlier untracked games show —, not zero. GP counts tracked appearances.`;
}
