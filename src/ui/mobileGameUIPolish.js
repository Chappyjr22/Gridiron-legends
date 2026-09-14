const el=id=>document.getElementById(id);

const STYLE=`
/* Mobile-game architecture pass. The Career shell is a game screen first, not
   a desktop panel squeezed into landscape. */
#career-screen.gl-mobile-career .career-header{
  min-height:52px;grid-template-columns:minmax(150px,.72fr) 1fr minmax(54px,.72fr);
  padding:5px max(11px,env(safe-area-inset-right)) 5px max(11px,env(safe-area-inset-left));
  border-bottom:2px solid rgba(255,255,255,.82);box-shadow:none;
}
#career-screen.gl-mobile-career .career-header h2{font-size:17px;letter-spacing:.06em}
#career-screen.gl-mobile-career .career-header-identity span{font-size:7px;opacity:.86}
#career-screen.gl-mobile-career .mobile-page-context{justify-self:center;text-align:center;min-width:0}
#career-screen.gl-mobile-career .mobile-page-context strong{display:block;color:#fff;font:900 18px/1 "Courier New",monospace;letter-spacing:.14em;text-transform:uppercase}
#career-screen.gl-mobile-career .mobile-page-context #career-season{display:block;margin-top:3px;color:#d7e5ff;font:900 7px/1 "Courier New",monospace;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50vw}
#career-screen.gl-mobile-career #career-menu-open{width:43px;height:38px;min-height:38px;border:2px solid rgba(255,255,255,.85);box-shadow:none;background:rgba(19,58,132,.68)}

#career-screen.gl-mobile-career #career-hub{background:#173d82}
#career-screen.gl-mobile-career .locker-layout{grid-template-columns:minmax(0,1fr)!important;gap:0;padding:8px 11px 5px;overflow:hidden}
#career-screen.gl-mobile-career .career-player-card{display:none!important}
#career-screen.gl-mobile-career .career-page{width:100%;max-width:none;min-height:0;overflow:auto;touch-action:pan-y}
#career-screen.gl-mobile-career .career-page:not(.mobile-career-home){border:0!important;background:transparent!important;padding:0!important}

/* HOME: matchup is the hero, standings are secondary, challenge becomes a strip. */
#career-screen.gl-mobile-career .mobile-career-home{display:flex;flex-direction:column;gap:7px;padding:0 3px 2px}
#career-screen.gl-mobile-career .mobile-career-timeline{
  min-height:45px;display:grid;grid-template-columns:.9fr 1.15fr .9fr;
  border:0;border-bottom:1px solid rgba(255,255,255,.24);background:rgba(8,31,77,.18);box-shadow:none;color:#fff;
}
#career-screen.gl-mobile-career .mobile-week{gap:2px;padding:5px 8px;border:0;min-width:0}
#career-screen.gl-mobile-career .mobile-week.current{background:transparent;border-bottom:4px solid #f1df00}
#career-screen.gl-mobile-career .mobile-week.current:after{display:none}
#career-screen.gl-mobile-career .mobile-week small{font-size:7px;color:#aecdff;opacity:1}
#career-screen.gl-mobile-career .mobile-week strong{font-size:9px;color:#fff}
#career-screen.gl-mobile-career .mobile-week.current strong{color:#f4e800}
#career-screen.gl-mobile-career .mobile-career-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(220px,.75fr);gap:12px;min-height:0;flex:1}
#career-screen.gl-mobile-career .paper-board,#career-screen.gl-mobile-career .mobile-standings-card{border:0;background:transparent;box-shadow:none;color:#fff}
#career-screen.gl-mobile-career .match-board{position:relative;display:flex;flex-direction:column;min-height:0;padding:5px 12px 7px!important;border-right:1px solid rgba(255,255,255,.2)!important;overflow:hidden}
#career-screen.gl-mobile-career .match-board>.board-kicker{font-size:8px;color:#aecdff;text-align:center;margin:0 0 1px}
#career-screen.gl-mobile-career .match-board .helmet-matchup{transform:scale(.98);transform-origin:center top;margin:-2px 0 -3px;min-height:76px}
#career-screen.gl-mobile-career .match-board h3{margin:0;color:#fff;font-size:13px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#career-screen.gl-mobile-career .match-board #career-matchup{margin:2px auto 4px;max-width:92%;min-height:0;max-height:2.4em;overflow:hidden;text-align:center;color:#bfd2fa;font-size:7px}
#career-screen.gl-mobile-career .match-board #career-play,
#career-screen.gl-mobile-career .match-board #career-draft,
#career-screen.gl-mobile-career .match-board #career-next-season{width:min(440px,92%);align-self:center;min-height:38px;margin:2px auto 5px;border:2px solid #fff;box-shadow:2px 2px 0 #102a5b;font-size:9px}
#career-screen.gl-mobile-career .match-board .stat-board{order:9;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;width:min(560px,96%);margin:auto 0 0!important;padding:5px 7px!important;border-top:1px solid rgba(255,255,255,.24)!important;background:transparent!important;overflow:visible}
#career-screen.gl-mobile-career .stat-board .challenge-heading{display:contents}
#career-screen.gl-mobile-career .stat-board .board-kicker{margin:0;color:#aecdff;font-size:7px;white-space:nowrap}
#career-screen.gl-mobile-career .stat-board #career-weekly-goal{grid-column:2;margin:0;color:#fff!important;font-size:8px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#career-screen.gl-mobile-career .stat-board #career-weekly-goal *{color:#fff!important}
#career-screen.gl-mobile-career .stat-board .reward-chip{grid-column:3;grid-row:1;padding:4px 6px;background:#f1df00;color:#111;font-size:8px;white-space:nowrap}
#career-screen.gl-mobile-career .stat-board #career-open-player,
#career-screen.gl-mobile-career .stat-board #career-last-result,
#career-screen.gl-mobile-career .stat-board #career-season-snapshot,
#career-screen.gl-mobile-career .stat-board #career-home-motto{display:none!important}
#career-screen.gl-mobile-career .mobile-standings-card{display:flex;flex-direction:column;padding:5px 7px!important;min-width:0}
#career-screen.gl-mobile-career .mobile-card-title{color:#aecdff;font-size:8px;margin:0 0 4px}
#career-screen.gl-mobile-career .mobile-standings-list{display:grid;gap:0}
#career-screen.gl-mobile-career .mobile-standings-list .career-list-row{padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.15);font-size:8px;color:#dbe8ff}
#career-screen.gl-mobile-career .mobile-standings-list .career-selected{color:#f4e800}
#career-screen.gl-mobile-career .mobile-standings-note{margin-top:auto;padding-top:5px;color:#88a9e6;font-size:6px;line-height:1.25}

/* Bottom navigation is navigation, not four giant cards. */
#career-screen.gl-mobile-career .career-nav{display:grid;grid-template-columns:repeat(4,1fr);gap:0;padding:0 max(10px,env(safe-area-inset-right)) max(2px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));border-top:1px solid rgba(255,255,255,.28);background:#214fa7}
#career-screen.gl-mobile-career .career-nav button{position:relative;min-height:38px;padding:5px 4px;border:0;background:transparent;color:#d8e6ff;box-shadow:none;font-size:8px}
#career-screen.gl-mobile-career .career-nav button.gold{background:transparent;color:#f4e800}
#career-screen.gl-mobile-career .career-nav button.gold:after{content:"";position:absolute;left:22%;right:22%;top:0;height:3px;background:#f4e800}
#career-screen.gl-mobile-career .career-nav button:before{display:inline-block;margin:0 6px 0 0;font-size:10px;vertical-align:-1px}

/* PLAYER */
#career-screen.gl-mobile-career #career-player-panel{display:flex;flex-direction:column;gap:6px;overflow:hidden}
#career-screen.gl-mobile-career #career-player-panel[hidden]{display:none!important}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar{display:flex;justify-content:center;gap:0;flex:0 0 auto;border-bottom:1px solid rgba(255,255,255,.2)}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar button{min-height:30px;min-width:130px;padding:4px 12px;border:0;border-bottom:3px solid transparent;background:transparent;box-shadow:none;color:#aecdff;font-size:8px}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar button.gold{color:#f4e800;border-bottom-color:#f4e800}
#career-screen.gl-mobile-career #player-upgrades-view{min-height:0;flex:1;display:grid;grid-template-columns:175px minmax(0,1fr);gap:12px;overflow:hidden;padding:4px 4px 2px}
#career-screen.gl-mobile-career #player-upgrades-view[hidden]{display:none!important}
#career-screen.gl-mobile-career .qb-passport{height:100%;padding:8px 8px;border:0;border-right:1px solid rgba(255,255,255,.2);background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}
#career-screen.gl-mobile-career .profile-face-button{width:86px;height:86px;min-height:86px;padding:2px;border:1px solid rgba(255,255,255,.45);background:#17376f;box-shadow:none;display:grid;place-items:center;overflow:hidden}
#career-screen.gl-mobile-career .profile-face-button canvas{width:64px;height:64px;max-width:64px;max-height:64px;background:transparent}
#career-screen.gl-mobile-career .profile-face-button span{font-size:6px}
#career-screen.gl-mobile-career .qb-passport>strong{font-size:16px;color:#fff}
#career-screen.gl-mobile-career .qb-passport>span{font-size:7px;color:#bfd2fa}
#career-screen.gl-mobile-career .qb-passport progress{width:82%;height:6px;accent-color:#f2d900}
#career-screen.gl-mobile-career .qb-attributes{height:100%;padding:5px 8px 2px;border:0;background:transparent;overflow:auto;touch-action:pan-y}
#career-screen.gl-mobile-career .player-section-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 4px}
#career-screen.gl-mobile-career .player-section-heading h3{margin:0;color:#fff;font-size:12px}
#career-screen.gl-mobile-career .points-badge{padding:4px 6px;background:#f0df42;color:#111;font-size:7px}
#career-screen.gl-mobile-career #career-upgrades{display:grid;grid-template-columns:1fr;gap:0;margin:0}
#career-screen.gl-mobile-career #career-upgrades button{display:grid;grid-template-columns:minmax(105px,.72fr) 42px minmax(120px,1fr) 96px;align-items:center;gap:8px;min-height:44px;padding:5px 6px;text-align:left;background:transparent;border:0;border-bottom:1px solid rgba(255,255,255,.14);box-shadow:none;color:#fff}
#career-screen.gl-mobile-career #career-upgrades button>span:first-child{font-size:8px;color:#dbe8ff}
#career-screen.gl-mobile-career #career-upgrades strong{font-size:16px;margin:0;color:#f4e800;text-align:center}
#career-screen.gl-mobile-career #career-upgrades .rating-track{height:7px;background:#0e2a61;margin:0}
#career-screen.gl-mobile-career #career-upgrades .upgrade-cost{justify-self:end;min-width:84px;padding:5px 6px;border:1px solid rgba(255,255,255,.36);font-size:7px;line-height:1.1;text-align:center;color:#fff}
#career-screen.gl-mobile-career #career-upgrades .upgrade-cost small{font-size:6px}
#career-screen.gl-mobile-career #player-stats-view{min-height:0;flex:1;overflow:auto;padding:6px 10px;border:0;background:transparent;touch-action:pan-y}

/* TEAM */
#career-screen.gl-mobile-career #career-team-panel{display:flex;flex-direction:column;gap:5px;overflow:hidden;padding:1px 5px!important;position:relative}
#career-screen.gl-mobile-career #career-team-panel[hidden]{display:none!important}
#career-screen.gl-mobile-career .mobile-team-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;flex:0 0 auto;padding:2px 3px 5px;border-bottom:1px solid rgba(255,255,255,.2)}
#career-screen.gl-mobile-career #my-team-name{margin:0;color:#fff;font-size:17px;letter-spacing:.08em}
#career-screen.gl-mobile-career #career-team-editor{position:static!important;min-height:30px;padding:4px 10px;border:1px solid rgba(255,255,255,.5);background:transparent;box-shadow:none;font-size:7px}
#career-screen.gl-mobile-career #my-team-roster{flex:1;min-height:0;overflow:auto;touch-action:pan-y;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:3px 1px 4px}
#career-screen.gl-mobile-career #my-team-roster .roster-card{min-width:0;min-height:108px;padding:5px 4px;display:grid;grid-template-rows:auto 1fr auto auto auto;place-items:center;gap:1px;background:rgba(18,54,126,.22);border:1px solid rgba(255,255,255,.28);box-shadow:none;color:#fff;text-align:center}
#career-screen.gl-mobile-career #my-team-roster .roster-card canvas{width:50px;height:50px;max-width:50px;max-height:50px;background:transparent}
#career-screen.gl-mobile-career #my-team-roster .roster-card strong{max-width:100%;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#career-screen.gl-mobile-career #my-team-roster .roster-card span{font-size:6px;color:#bfd2fa;max-width:100%}
#career-screen.gl-mobile-career #my-team-roster .roster-rating{width:88%;height:4px;background:#0d275b;overflow:hidden}
#career-screen.gl-mobile-career #my-team-roster .roster-rating i{display:block;height:100%;background:#f4e800}

/* LEAGUE: one destination at a time. */
#career-screen.gl-mobile-career #career-league-panel{display:flex;flex-direction:column;gap:5px;overflow:hidden;padding:0 5px!important}
#career-screen.gl-mobile-career #career-league-panel[hidden]{display:none!important}
#career-screen.gl-mobile-career .league-jumps{display:flex;justify-content:center;gap:0;flex:0 0 auto;border-bottom:1px solid rgba(255,255,255,.2)}
#career-screen.gl-mobile-career .league-jumps button{min-width:150px;min-height:30px;padding:4px 12px;border:0;border-bottom:3px solid transparent;background:transparent;color:#aecdff;box-shadow:none;font-size:8px;text-transform:uppercase}
#career-screen.gl-mobile-career .league-jumps button.active{color:#f4e800;border-bottom-color:#f4e800}
#career-screen.gl-mobile-career .mobile-league-view{flex:1;min-height:0;overflow:auto;touch-action:pan-y;padding:6px 12px 4px}
#career-screen.gl-mobile-career .mobile-league-view[hidden]{display:none!important}
#career-screen.gl-mobile-career .mobile-league-view h3{margin:0 0 5px;color:#fff;font:900 13px/1 "Courier New",monospace;text-transform:uppercase}
#career-screen.gl-mobile-career .mobile-league-standings #career-standings-note{margin:0 0 5px;color:#88a9e6;font-size:7px}
#career-screen.gl-mobile-career #career-standings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px;padding:0;border:0;background:transparent}
#career-screen.gl-mobile-career #career-standings .career-list-row{padding:7px 3px;border-bottom:1px solid rgba(255,255,255,.13);font-size:8px}
#career-screen.gl-mobile-career #career-standings .career-selected{color:#f4e800}
#career-screen.gl-mobile-career .mobile-league-leaders #league-toolbar{display:flex;align-items:center;gap:8px;margin:0 0 6px;padding:0;border:0;background:transparent}
#career-screen.gl-mobile-career .mobile-league-leaders #league-toolbar h3{margin:0 auto 0 0;color:#fff;font-size:13px}
#career-screen.gl-mobile-career .mobile-league-leaders #league-toolbar select{min-height:30px;max-width:130px;padding:4px;background:#f8f0d2;color:#17304e;border:0;font-size:8px;font-weight:900}
#career-screen.gl-mobile-career .mobile-league-leaders #league-toolbar button{min-height:30px;padding:4px 8px;border:1px solid rgba(255,255,255,.5);background:transparent;box-shadow:none;font-size:7px}
#career-screen.gl-mobile-career #league-player-stats{border:0;background:transparent;padding:0}
#career-screen.gl-mobile-career .mobile-league-schedule #career-schedule-section{margin:0;border:0;background:transparent;padding:0}
#career-screen.gl-mobile-career .mobile-league-schedule #career-schedule-section>summary{display:none}
#career-screen.gl-mobile-career .mobile-league-schedule #career-schedule-section h3{margin-top:7px}

@media (orientation:landscape) and (max-height:500px){
 #career-screen.gl-mobile-career .career-header{min-height:47px}
 #career-screen.gl-mobile-career .mobile-page-context strong{font-size:15px}
 #career-screen.gl-mobile-career .locker-layout{padding-top:6px;padding-bottom:3px}
 #career-screen.gl-mobile-career .mobile-career-timeline{min-height:38px}
 #career-screen.gl-mobile-career .mobile-week{padding:3px 6px}
 #career-screen.gl-mobile-career .mobile-career-grid{gap:9px}
 #career-screen.gl-mobile-career .match-board .helmet-matchup{transform:scale(.86);margin:-8px 0 -11px}
 #career-screen.gl-mobile-career .match-board #career-play{min-height:34px}
 #career-screen.gl-mobile-career .career-nav button{min-height:33px;font-size:7px}
 #career-screen.gl-mobile-career #player-upgrades-view{grid-template-columns:155px minmax(0,1fr);gap:8px}
 #career-screen.gl-mobile-career .profile-face-button{width:72px;height:72px;min-height:72px}
 #career-screen.gl-mobile-career #career-upgrades button{min-height:36px;grid-template-columns:minmax(90px,.7fr) 36px minmax(110px,1fr) 82px}
 #career-screen.gl-mobile-career #my-team-roster{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
 #career-screen.gl-mobile-career #my-team-roster .roster-card{min-height:91px}
 #career-screen.gl-mobile-career #my-team-roster .roster-card canvas{width:43px;height:43px;max-width:43px;max-height:43px}
}
`;

const PAGE_TITLES={home:'CAREER',player:'PLAYER',team:'MY TEAM',league:'LEAGUE'};
let leagueView='standings';

function buildHeader(){
  const header=document.querySelector('#career-screen .career-header');
  const season=el('career-season');
  if(!header||!season||header.querySelector('.mobile-page-context'))return;
  const context=document.createElement('div');context.className='mobile-page-context';
  const title=document.createElement('strong');title.id='mobile-page-title';title.textContent='CAREER';
  season.before(context);context.append(title,season);
}

function rebuildHome(){
  const home=el('career-home-panel');if(!home)return;
  const match=home.querySelector('.match-board'),stats=home.querySelector('.stat-board');
  if(match&&stats&&stats.parentElement!==match)match.appendChild(stats);
}

function rebuildPlayer(){
  const first=document.querySelector('#career-player-panel [data-player-view="upgrades"]');
  if(first)first.textContent='Attributes';
}

function rebuildTeam(){
  const panel=el('career-team-panel'),name=el('my-team-name'),editor=el('career-team-editor');
  if(!panel||!name||panel.querySelector('.mobile-team-heading'))return;
  const heading=document.createElement('div');heading.className='mobile-team-heading';
  name.before(heading);heading.appendChild(name);if(editor)heading.appendChild(editor);
}

function rebuildLeague(){
  const panel=el('career-league-panel'),nav=panel?.querySelector('.league-jumps');
  if(!panel||!nav||panel.dataset.mobileLeague==='true')return;
  panel.dataset.mobileLeague='true';

  const oldButtons=[...nav.querySelectorAll('button')];
  const specs=[['leaders','Leaders'],['standings','Standings'],['schedule','Schedule']];
  nav.innerHTML='';
  for(const [view,label] of specs){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.mobileLeagueView=view;
    b.onclick=()=>showLeagueView(view);nav.appendChild(b);
  }

  const leaders=document.createElement('section');leaders.className='mobile-league-view mobile-league-leaders';leaders.dataset.leagueView='leaders';
  const standings=document.createElement('section');standings.className='mobile-league-view mobile-league-standings';standings.dataset.leagueView='standings';
  const schedule=document.createElement('section');schedule.className='mobile-league-view mobile-league-schedule';schedule.dataset.leagueView='schedule';

  const toolbar=el('league-toolbar'),stats=el('league-player-stats'),heading=el('standings-heading'),note=el('career-standings-note'),table=el('career-standings'),details=el('career-schedule-section');
  if(toolbar)leaders.appendChild(toolbar);if(stats)leaders.appendChild(stats);
  if(heading)standings.appendChild(heading);if(note)standings.appendChild(note);if(table)standings.appendChild(table);
  if(details){details.open=true;schedule.appendChild(details);}
  panel.append(leaders,standings,schedule);
  showLeagueView(leagueView);
}

function showLeagueView(view){
  leagueView=view;
  for(const section of document.querySelectorAll('#career-league-panel [data-league-view]'))section.hidden=section.dataset.leagueView!==view;
  for(const button of document.querySelectorAll('#career-league-panel [data-mobile-league-view]'))button.classList.toggle('active',button.dataset.mobileLeagueView===view);
}

function syncPage(){
  const hub=el('career-hub');if(!hub)return;
  const view=hub.dataset.view||'home';
  const title=el('mobile-page-title');if(title)title.textContent=PAGE_TITLES[view]||'CAREER';
  if(view==='league')showLeagueView(leagueView);
}

function rebuildArchitecture(){
  buildHeader();rebuildHome();rebuildPlayer();rebuildTeam();rebuildLeague();syncPage();
  const hub=el('career-hub');
  if(hub&&!hub.dataset.mobileWatch){
    hub.dataset.mobileWatch='true';
    new MutationObserver(syncPage).observe(hub,{attributes:true,attributeFilter:['data-view']});
  }
}

export function initMobileGameUIPolish(){
  if(!document.getElementById('mobile-game-ui-polish')){
    const style=document.createElement('style');style.id='mobile-game-ui-polish';style.textContent=STYLE;document.head.appendChild(style);
  }
  rebuildArchitecture();
  requestAnimationFrame(rebuildArchitecture);
}
