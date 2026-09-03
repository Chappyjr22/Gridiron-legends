import * as League from '../state/league.js';
import { game, teamState } from '../state/gameState.js';

let leagueViewWeek=teamState.franchise.week||1;
function leagueRecordText(team){
  const record=team.record||{};
  return (record.wins||0)+'-'+(record.losses||0)+(record.ties?'-'+record.ties:'');
}
export function renderLeagueSchedule(){
  const games=League.getWeekGames(teamState.franchise,leagueViewWeek);
  document.getElementById('league-week-title').textContent='Week '+leagueViewWeek;
  document.getElementById('btn-week-prev').disabled=leagueViewWeek<=1;
  document.getElementById('btn-week-next').disabled=leagueViewWeek>=League.REGULAR_SEASON_WEEKS;
  document.getElementById('league-schedule-list').innerHTML=games.map(game=>{
    const away=League.findTeamState(teamState.franchise,game.awayTeamId),home=League.findTeamState(teamState.franchise,game.homeTeamId);
    const userGame=game.awayTeamId===game.userTeamId||game.homeTeamId===game.userTeamId;
    const score=game.status==='completed'?game.awayScore+' - '+game.homeScore:'AT';
    return '<div class="matchup-row'+(userGame?' user-game':'')+'"><div class="matchup-team" title="'+League.fullName(away)+'">'+away.abbr+' '+away.name+'</div><div class="matchup-score">'+score+'</div><div class="matchup-team" title="'+League.fullName(home)+'">'+home.abbr+' '+home.name+'</div></div>';
  }).join('');
}
function renderConferenceStandings(conference){
  const ranked=League.standings(teamState.franchise,conference);
  const divisions=['east','north','south','west'];
  return '<div class="conference-table"><h3>'+League.CONFERENCES[conference].name+'</h3>'+divisions.map(division=>{
    const teams=ranked.filter(team=>team.division===division);
    return '<div class="standing-row header"><span></span><span>'+division+'</span><span>Record</span><span>Diff</span></div>'+teams.map((team,index)=>{
      const pointDiff=(team.record?.pointsFor||0)-(team.record?.pointsAgainst||0);
      return '<div class="standing-row'+(team.id===game.userTeamId?' user-team':'')+'"><span class="standing-rank">'+(index+1)+'</span><span>'+team.abbr+' '+team.name+'</span><span class="standing-record">'+leagueRecordText(team)+'</span><span class="standing-diff">'+(pointDiff>0?'+':'')+pointDiff+'</span></div>';
    }).join('');
  }).join('')+'</div>';
}
export function renderLeagueHub(){
  teamState.franchise=League.ensureLeagueState(teamState.franchise);
  document.getElementById('league-season').textContent=teamState.franchise.season;
  document.getElementById('league-current-week').textContent=teamState.franchise.week;
  document.getElementById('league-games-played').textContent=teamState.franchise.completedGames.length;
  renderLeagueSchedule();
  document.getElementById('league-standings').innerHTML=renderConferenceStandings('legacy')+renderConferenceStandings('frontier');
}
export function openLeagueHub(){
  leagueViewWeek=teamState.franchise.week;
  document.getElementById('start-screen').classList.remove('show');
  document.getElementById('league-screen').classList.add('show');
  renderLeagueHub();
  League.saveFranchise(teamState.franchise);
}
export function closeLeagueHub(){
  document.getElementById('league-screen').classList.remove('show');
  document.getElementById('start-screen').classList.add('show');
}
document.getElementById('btn-league-close').addEventListener('click',closeLeagueHub);
document.getElementById('btn-league-back').addEventListener('click',closeLeagueHub);
document.getElementById('btn-week-prev').addEventListener('click',()=>{leagueViewWeek=Math.max(1,leagueViewWeek-1);renderLeagueSchedule();});
document.getElementById('btn-week-next').addEventListener('click',()=>{leagueViewWeek=Math.min(League.REGULAR_SEASON_WEEKS,leagueViewWeek+1);renderLeagueSchedule();});
