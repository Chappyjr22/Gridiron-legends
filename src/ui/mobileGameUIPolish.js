const STYLE=`
/* Second-pass mobile game UI polish. Keeps the experimental shell, but gives
   every Career tab a purpose-built landscape layout instead of wrapping the
   legacy narrow panels. */
#career-screen.gl-mobile-career #career-hub[data-view="player"] .locker-layout,
#career-screen.gl-mobile-career #career-hub[data-view="team"] .locker-layout,
#career-screen.gl-mobile-career #career-hub[data-view="league"] .locker-layout{
  grid-template-columns:minmax(0,1fr);
}
#career-screen.gl-mobile-career #career-hub[data-view="player"] .career-player-card,
#career-screen.gl-mobile-career #career-hub[data-view="team"] .career-player-card,
#career-screen.gl-mobile-career #career-hub[data-view="league"] .career-player-card{
  display:none;
}
#career-screen.gl-mobile-career #career-hub[data-view="player"] #career-player-panel,
#career-screen.gl-mobile-career #career-hub[data-view="team"] #career-team-panel,
#career-screen.gl-mobile-career #career-hub[data-view="league"] #career-league-panel{
  width:100%;max-width:none;justify-self:stretch;align-self:stretch;
}

/* Home dashboard */
#career-screen.gl-mobile-career #career-hub[data-view="home"] .locker-layout{
  grid-template-columns:minmax(170px,.34fr) minmax(0,1.66fr);
}
#career-screen.gl-mobile-career #career-hub[data-view="home"] .career-player-card{
  padding:10px 9px;
}
#career-screen.gl-mobile-career #career-hub[data-view="home"] .career-player-card p{
  max-width:100%;line-height:1.25;
}
#career-screen.gl-mobile-career .mobile-career-grid{
  grid-template-columns:1.14fr .9fr .76fr;
}
#career-screen.gl-mobile-career .match-board,
#career-screen.gl-mobile-career .stat-board{
  display:flex;flex-direction:column;min-height:0;
}
#career-screen.gl-mobile-career .match-board .helmet-matchup{
  flex:0 0 auto;transform:scale(.9);transform-origin:top center;margin:-3px 0 -5px;
}
#career-screen.gl-mobile-career .match-board h3{
  margin:2px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
#career-screen.gl-mobile-career .match-board #career-matchup{
  min-height:0;max-height:2.5em;overflow:hidden;
}
#career-screen.gl-mobile-career .match-board #career-play,
#career-screen.gl-mobile-career .match-board #career-draft,
#career-screen.gl-mobile-career .match-board #career-next-season{
  margin-top:auto;
}
#career-screen.gl-mobile-career .stat-board #career-weekly-goal,
#career-screen.gl-mobile-career .stat-board #career-weekly-goal *{
  color:#fff!important;
}
#career-screen.gl-mobile-career .stat-board #career-weekly-goal{
  font-size:9px;line-height:1.25;
}
#career-screen.gl-mobile-career .stat-board .challenge-heading{
  display:flex;align-items:center;justify-content:space-between;gap:6px;
}
#career-screen.gl-mobile-career .stat-board .reward-chip{
  flex:0 0 auto;
}

/* Slimmer persistent bottom navigation */
#career-screen.gl-mobile-career .career-nav{
  gap:6px;padding:5px max(10px,env(safe-area-inset-right)) max(5px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));
}
#career-screen.gl-mobile-career .career-nav button{
  min-height:40px;padding:4px 6px;font-size:9px;box-shadow:2px 2px 0 #173360;
}
#career-screen.gl-mobile-career .career-nav button:before{
  display:inline-block;margin:0 7px 0 0;vertical-align:-1px;font-size:11px;
}

/* PLAYER */
#career-screen.gl-mobile-career #career-player-panel{
  display:flex;flex-direction:column;gap:8px;overflow:hidden;padding:8px 10px;
}
#career-screen.gl-mobile-career #career-player-panel[hidden]{display:none!important}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;flex:0 0 auto;
}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar button{
  min-height:38px;padding:4px 8px;font-size:9px;
}
#career-screen.gl-mobile-career #player-upgrades-view{
  min-height:0;flex:1;display:grid;grid-template-columns:minmax(210px,.7fr) minmax(0,1.3fr);gap:10px;overflow:hidden;
}
#career-screen.gl-mobile-career #player-upgrades-view[hidden]{display:none!important}
#career-screen.gl-mobile-career .qb-passport{
  min-width:0;height:100%;padding:10px;border:3px solid #fff;background:rgba(9,31,78,.32);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;overflow:hidden;
}
#career-screen.gl-mobile-career .profile-face-button{
  width:92px;height:92px;min-height:92px;padding:3px;background:#17376f;border:2px solid #fff;box-shadow:none;display:grid;place-items:center;overflow:hidden;
}
#career-screen.gl-mobile-career .profile-face-button canvas{
  width:64px;height:64px;max-width:64px;max-height:64px;background:transparent;
}
#career-screen.gl-mobile-career .profile-face-button span{
  font-size:7px;line-height:1;text-transform:uppercase;
}
#career-screen.gl-mobile-career .qb-passport>strong{
  color:#fff;font:900 17px/1 "Courier New",monospace;text-transform:uppercase;
}
#career-screen.gl-mobile-career .qb-passport>span{
  color:#dbe8ff;font-size:8px;text-transform:uppercase;
}
#career-screen.gl-mobile-career .qb-passport progress{width:86%;height:9px;accent-color:#f2d900}
#career-screen.gl-mobile-career .qb-attributes{
  min-width:0;height:100%;padding:10px 12px;border:3px solid #fff;background:rgba(9,31,78,.25);overflow:auto;touch-action:pan-y;
}
#career-screen.gl-mobile-career .player-section-heading{
  display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;
}
#career-screen.gl-mobile-career .player-section-heading h3{
  margin:0;color:#fff;font:900 13px/1 "Courier New",monospace;text-transform:uppercase;
}
#career-screen.gl-mobile-career .points-badge{color:#111;background:#f0df42;padding:5px 7px;font-size:8px;font-weight:900;text-transform:uppercase}
#career-screen.gl-mobile-career #career-upgrades{
  grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:0;
}
#career-screen.gl-mobile-career #career-upgrades button{
  min-height:70px;padding:7px 8px;text-align:left;background:#173d86;border:2px solid rgba(255,255,255,.72);box-shadow:none;color:#fff;
}
#career-screen.gl-mobile-career #career-upgrades button>span:first-child{font-size:9px}
#career-screen.gl-mobile-career #career-upgrades strong{font-size:18px;margin:3px 0;color:#f4e800}
#career-screen.gl-mobile-career #career-upgrades .upgrade-cost{font-size:7px;line-height:1.2}
#career-screen.gl-mobile-career #player-stats-view{
  min-height:0;flex:1;overflow:auto;padding:10px;border:3px solid #fff;background:rgba(9,31,78,.25);touch-action:pan-y;
}

/* TEAM */
#career-screen.gl-mobile-career #career-team-panel{
  overflow:hidden;padding:9px 10px;display:flex;flex-direction:column;gap:8px;
}
#career-screen.gl-mobile-career #career-team-panel[hidden]{display:none!important}
#career-screen.gl-mobile-career #my-team-name{
  margin:0;flex:0 0 auto;color:#fff;font:900 20px/1 "Courier New",monospace;letter-spacing:.08em;text-transform:uppercase;
}
#career-screen.gl-mobile-career #career-team-editor{
  position:absolute;top:9px;right:10px;min-height:38px;padding:5px 12px;font-size:9px;
}
#career-screen.gl-mobile-career #career-team-panel{position:relative}
#career-screen.gl-mobile-career #my-team-roster{
  flex:1;min-height:0;overflow:auto;touch-action:pan-y;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding-right:2px;
}
#career-screen.gl-mobile-career #my-team-roster .roster-card{
  min-width:0;min-height:138px;padding:8px 6px;display:grid;grid-template-rows:auto 1fr auto auto auto;place-items:center;gap:2px;background:#173d86;border:3px solid #fff;box-shadow:none;color:#fff;text-align:center;
}
#career-screen.gl-mobile-career #my-team-roster .roster-card canvas{
  width:58px;height:58px;max-width:58px;max-height:58px;background:transparent;
}
#career-screen.gl-mobile-career #my-team-roster .roster-card strong{
  max-width:100%;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
#career-screen.gl-mobile-career #my-team-roster .roster-card span{font-size:7px;max-width:100%}
#career-screen.gl-mobile-career #my-team-roster .roster-rating{width:90%;height:5px;background:#0d275b;overflow:hidden}
#career-screen.gl-mobile-career #my-team-roster .roster-rating i{display:block;height:100%;background:#f4e800}

/* LEAGUE */
#career-screen.gl-mobile-career #career-league-panel{
  overflow:auto;touch-action:pan-y;padding:8px 10px;display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);grid-template-rows:auto auto minmax(0,1fr) auto;gap:7px 10px;align-content:start;
}
#career-screen.gl-mobile-career #career-league-panel[hidden]{display:none!important}
#career-screen.gl-mobile-career .league-jumps{
  grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;
}
#career-screen.gl-mobile-career .league-jumps button{
  min-height:36px;background:#173d86;border:2px solid #fff;color:#fff;box-shadow:none;font-size:8px;text-transform:uppercase;
}
#career-screen.gl-mobile-career #league-toolbar{
  grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:6px;margin:0;padding:7px;border:2px solid rgba(255,255,255,.55);background:rgba(9,31,78,.22);
}
#career-screen.gl-mobile-career #league-toolbar h3{margin:0;color:#fff;font:900 12px/1 "Courier New",monospace;text-transform:uppercase}
#career-screen.gl-mobile-career #league-toolbar select{min-height:34px;max-width:125px;padding:4px;background:#f8f0d2;color:#17304e;border:0;font-size:9px;font-weight:900}
#career-screen.gl-mobile-career #league-toolbar button{min-height:34px;padding:4px 8px;font-size:8px}
#career-screen.gl-mobile-career #league-player-stats{
  grid-column:1;grid-row:3;min-height:0;overflow:auto;border:2px solid rgba(255,255,255,.55);background:rgba(9,31,78,.22);padding:6px;
}
#career-screen.gl-mobile-career #standings-heading{
  grid-column:2;grid-row:2;margin:0;padding:9px 9px 0;border:2px solid rgba(255,255,255,.55);border-bottom:0;background:rgba(9,31,78,.22);color:#fff;font:900 12px/1 "Courier New",monospace;text-transform:uppercase;
}
#career-screen.gl-mobile-career #career-standings-note{
  grid-column:2;grid-row:2;align-self:end;margin:0;padding:0 9px 7px;color:#bcd1ff;font-size:7px;pointer-events:none;
}
#career-screen.gl-mobile-career #career-standings{
  grid-column:2;grid-row:3;min-height:0;overflow:auto;border:2px solid rgba(255,255,255,.55);background:rgba(9,31,78,.22);padding:4px 8px;
}
#career-screen.gl-mobile-career #career-standings .career-list-row{
  padding:6px 3px;font-size:8px;border-bottom:1px solid rgba(255,255,255,.15);
}
#career-screen.gl-mobile-career #career-schedule-section{
  grid-column:1/-1;grid-row:4;margin:0;border:2px solid rgba(255,255,255,.55);background:rgba(9,31,78,.22);padding:7px 9px;
}
#career-screen.gl-mobile-career #career-schedule-section summary{color:#fff;font-size:9px;text-transform:uppercase;font-weight:900;cursor:pointer}

@media (orientation:landscape) and (max-height:500px){
 #career-screen.gl-mobile-career #career-hub[data-view="home"] .locker-layout{grid-template-columns:155px minmax(0,1fr)}
 #career-screen.gl-mobile-career .mobile-career-grid{grid-template-columns:1.12fr .92fr .76fr}
 #career-screen.gl-mobile-career .career-nav button{min-height:34px;font-size:7px}
 #career-screen.gl-mobile-career .career-nav button:before{font-size:9px;margin-right:5px}
 #career-screen.gl-mobile-career #career-player-panel,
 #career-screen.gl-mobile-career #career-team-panel,
 #career-screen.gl-mobile-career #career-league-panel{padding-top:6px;padding-bottom:6px}
 #career-screen.gl-mobile-career #player-upgrades-view{grid-template-columns:190px minmax(0,1fr);gap:7px}
 #career-screen.gl-mobile-career .profile-face-button{width:78px;height:78px;min-height:78px}
 #career-screen.gl-mobile-career #career-upgrades button{min-height:58px}
 #career-screen.gl-mobile-career #my-team-roster{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
 #career-screen.gl-mobile-career #my-team-roster .roster-card{min-height:112px;padding:5px 4px}
 #career-screen.gl-mobile-career #my-team-roster .roster-card canvas{width:48px;height:48px;max-width:48px;max-height:48px}
}
`;

export function initMobileGameUIPolish(){
  if(document.getElementById('mobile-game-ui-polish'))return;
  const style=document.createElement('style');
  style.id='mobile-game-ui-polish';
  style.textContent=STYLE;
  document.head.appendChild(style);
}
