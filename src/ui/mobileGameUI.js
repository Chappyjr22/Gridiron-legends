const el=id=>document.getElementById(id);

const STYLE=`
#career-screen.gl-mobile-career{padding:0;align-items:stretch;justify-content:stretch;background:#08172e;overflow:hidden}
#career-screen.gl-mobile-career .career-panel{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;box-shadow:none;background:linear-gradient(180deg,#245ecb 0,#183d82 60%,#10264d 100%);display:flex;flex-direction:column;overflow:hidden;color:#fff}
#career-screen.gl-mobile-career .career-header{min-height:58px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:7px max(12px,env(safe-area-inset-right)) 7px max(12px,env(safe-area-inset-left));border-bottom:3px solid rgba(255,255,255,.92);background:#2f6df0;box-shadow:0 4px 0 rgba(5,16,40,.46);position:relative;z-index:3}
#career-screen.gl-mobile-career .career-header-identity{min-width:0}
#career-screen.gl-mobile-career .career-header h2{margin:0;color:#fff;font:900 20px/1 "Courier New",monospace;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#career-screen.gl-mobile-career .career-header-identity span{display:block;margin-top:3px;color:#dbe8ff;font:900 8px/1.2 "Courier New",monospace;text-transform:uppercase}
#career-screen.gl-mobile-career #career-season{justify-self:center;color:#fff;font:900 13px/1 "Courier New",monospace;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
#career-screen.gl-mobile-career #career-menu-open{justify-self:end;width:48px;height:42px;min-height:42px;padding:0;border:3px solid #fff;background:#2457c5;color:#fff;box-shadow:4px 4px 0 #173360;font-size:19px}
#career-screen.gl-mobile-career #career-hub{display:flex;flex:1;min-height:0;flex-direction:column;overflow:hidden}
#career-screen.gl-mobile-career .locker-layout{flex:1;min-height:0;display:grid;grid-template-columns:minmax(160px,.42fr) minmax(0,1.58fr);gap:10px;padding:10px 12px 8px;overflow:hidden}
#career-screen.gl-mobile-career .career-player-card{height:100%;min-height:0;margin:0;padding:11px 9px;border:3px solid #fff;background:rgba(9,31,78,.38);box-shadow:none;display:flex;flex-direction:column;align-items:center;text-align:center;overflow:hidden}
#career-screen.gl-mobile-career .career-player-card h3{margin:1px 0 4px;color:#fff;font:900 15px/1.1 "Courier New",monospace;text-transform:uppercase}
#career-screen.gl-mobile-career .career-player-card p{margin:2px 0;color:#d8e6ff;font-size:8px;text-transform:uppercase}
#career-screen.gl-mobile-career .career-player-card progress{width:90%;height:8px;margin:5px 0 4px;accent-color:#f2d900}
#career-screen.gl-mobile-career .locker-jersey{transform:scale(.82);transform-origin:center;margin:-4px 0 -6px}
#career-screen.gl-mobile-career #career-player-sprite{width:88px;height:88px;max-width:88px;max-height:88px;margin-top:auto;background:transparent;image-rendering:pixelated}
#career-screen.gl-mobile-career .career-page{min-height:0;overflow:auto;touch-action:pan-y;padding:0 2px 3px}
#career-screen.gl-mobile-career .mobile-career-home{display:flex;flex-direction:column;gap:8px}
#career-screen.gl-mobile-career .mobile-career-timeline{display:grid;grid-template-columns:1fr 1.14fr 1fr;min-height:74px;border:3px solid #fff;background:#e3db00;color:#0b1325;box-shadow:4px 4px 0 #173360}
#career-screen.gl-mobile-career .mobile-week{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;padding:7px 8px;text-align:center;border-right:3px solid rgba(11,19,37,.16);min-width:0}
#career-screen.gl-mobile-career .mobile-week:last-child{border-right:0}
#career-screen.gl-mobile-career .mobile-week.current{background:#f4e800}
#career-screen.gl-mobile-career .mobile-week small{font:900 8px/1 "Courier New",monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
#career-screen.gl-mobile-career .mobile-week strong{font:900 11px/1.15 "Courier New",monospace;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#career-screen.gl-mobile-career .mobile-week.current:after{content:"";position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #27355e}
#career-screen.gl-mobile-career .mobile-career-grid{display:grid;grid-template-columns:1.15fr .9fr .78fr;gap:8px;min-height:0;flex:1}
#career-screen.gl-mobile-career .paper-board,#career-screen.gl-mobile-career .mobile-standings-card{min-width:0;margin:0;padding:10px;border:3px solid #fff;background:rgba(18,54,126,.28);box-shadow:none;color:#fff;overflow:hidden}
#career-screen.gl-mobile-career .board-kicker,#career-screen.gl-mobile-career .mobile-card-title{display:block;color:#fff;font:900 9px/1 "Courier New",monospace;letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}
#career-screen.gl-mobile-career .helmet-matchup{margin:2px 0 4px}
#career-screen.gl-mobile-career .helmet-matchup strong{color:#fff}
#career-screen.gl-mobile-career .match-board h3{margin:5px 0 3px;color:#fff;font:900 14px/1.05 "Courier New",monospace;text-transform:uppercase}
#career-screen.gl-mobile-career .match-board p,#career-screen.gl-mobile-career .stat-board p{font-size:8px;line-height:1.25;color:#dbe8ff;margin:4px 0}
#career-screen.gl-mobile-career .sports-button,#career-screen.gl-mobile-career .flat-action,#career-screen.gl-mobile-career .recap-link{border:3px solid #fff;background:#2f6df0;color:#fff;box-shadow:3px 3px 0 #173360;text-transform:uppercase}
#career-screen.gl-mobile-career .sports-button.gold,#career-screen.gl-mobile-career .match-board .field-green{background:#dfdc00;color:#111;border-color:#fff}
#career-screen.gl-mobile-career .match-board #career-play{width:100%;margin-top:7px;min-height:42px;font-size:10px}
#career-screen.gl-mobile-career .stat-board #career-open-player{width:100%;min-height:38px;margin:5px 0;font-size:9px}
#career-screen.gl-mobile-career #career-season-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:5px}
#career-screen.gl-mobile-career #career-season-summary span{display:grid;gap:2px;text-align:center;padding:5px 2px;border:2px solid rgba(255,255,255,.5);font-size:7px;text-transform:uppercase}
#career-screen.gl-mobile-career #career-season-summary b{font-size:13px;color:#fff}
#career-screen.gl-mobile-career .mobile-standings-card{display:flex;flex-direction:column}
#career-screen.gl-mobile-career .mobile-standings-list{display:grid;gap:1px;margin-top:1px}
#career-screen.gl-mobile-career .mobile-standings-list .career-list-row{display:grid;grid-template-columns:1fr auto;gap:7px;padding:6px 3px;border-bottom:1px solid rgba(255,255,255,.18);font-size:8px;color:#dbe8ff}
#career-screen.gl-mobile-career .mobile-standings-list .career-selected{color:#f4e800;font-weight:900}
#career-screen.gl-mobile-career .mobile-standings-note{margin-top:auto;padding-top:7px;color:#bcd1ff;font-size:7px;line-height:1.35;text-transform:uppercase}
#career-screen.gl-mobile-career .career-nav{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px max(12px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));border-top:3px solid #fff;background:#214fa7;flex:0 0 auto}
#career-screen.gl-mobile-career .career-nav button{min-height:48px;padding:6px;border:3px solid #fff;background:#2f6df0;color:#fff;box-shadow:3px 3px 0 #173360;font-size:10px}
#career-screen.gl-mobile-career .career-nav button.gold{background:#dfdc00;color:#111}
#career-screen.gl-mobile-career .career-nav button:before{display:block;font-size:13px;line-height:1;margin-bottom:2px}
#career-screen.gl-mobile-career #career-home-tab:before{content:"⌂"}
#career-screen.gl-mobile-career #career-player-tab:before{content:"★"}
#career-screen.gl-mobile-career #career-team-tab:before{content:"▦"}
#career-screen.gl-mobile-career #career-league-tab:before{content:"◆"}
#career-screen.gl-mobile-career .career-page:not(.mobile-career-home){border:3px solid #fff;background:rgba(8,31,77,.3);padding:10px}
@media (orientation:landscape) and (max-height:500px){
 #career-screen.gl-mobile-career .career-header{min-height:50px;padding-top:5px;padding-bottom:5px}
 #career-screen.gl-mobile-career .career-header h2{font-size:16px}
 #career-screen.gl-mobile-career #career-season{font-size:10px}
 #career-screen.gl-mobile-career .locker-layout{grid-template-columns:145px minmax(0,1fr);gap:7px;padding:7px 9px 5px}
 #career-screen.gl-mobile-career .career-player-card{padding:7px 5px}
 #career-screen.gl-mobile-career .career-player-card h3{font-size:12px}
 #career-screen.gl-mobile-career .locker-jersey{display:none}
 #career-screen.gl-mobile-career #career-player-sprite{width:70px;height:70px;max-width:70px;max-height:70px}
 #career-screen.gl-mobile-career .mobile-career-timeline{min-height:58px}
 #career-screen.gl-mobile-career .mobile-week{padding:5px 6px;gap:2px}
 #career-screen.gl-mobile-career .mobile-week strong{font-size:9px}
 #career-screen.gl-mobile-career .mobile-career-grid{gap:6px}
 #career-screen.gl-mobile-career .paper-board,#career-screen.gl-mobile-career .mobile-standings-card{padding:7px}
 #career-screen.gl-mobile-career .match-board h3{font-size:11px}
 #career-screen.gl-mobile-career .career-nav{padding-top:5px;gap:6px}
 #career-screen.gl-mobile-career .career-nav button{min-height:39px;font-size:8px}
}
@media (orientation:portrait){
 #career-screen.gl-mobile-career .locker-layout{grid-template-columns:1fr;overflow:auto}
 #career-screen.gl-mobile-career .career-player-card{height:auto;min-height:180px}
 #career-screen.gl-mobile-career .mobile-career-grid{grid-template-columns:1fr}
 #career-screen.gl-mobile-career .career-nav{grid-template-columns:repeat(4,1fr)}
}
`;

let syncing=false;
function text(id,fallback=''){return el(id)?.textContent?.trim()||fallback;}
function visible(id){const node=el(id);return !!node&&!node.hidden;}
function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}

function syncHome(){
 if(syncing)return;
 const home=el('career-home-panel');if(!home||!home.classList.contains('mobile-career-home'))return;
 syncing=true;
 const last=visible('career-last-result')?text('career-result-title','Last game complete'):'Season start';
 const current=text('career-season','Current week');
 const next=text('career-next-opponent','Next opponent');
 setText(el('mobile-career-last'),last);
 setText(el('mobile-career-current'),current);
 setText(el('mobile-career-next'),next);
 const source=el('career-standings'),target=el('mobile-career-standings');
 if(source&&target){
  const rows=[...source.children].slice(0,4).map(node=>node.outerHTML).join('');
  if(rows&&target.innerHTML!==rows)target.innerHTML=rows;
 }
 syncing=false;
}

function enhanceCareerHome(){
 const screen=el('career-screen'),home=el('career-home-panel');
 if(!screen||!home||home.classList.contains('mobile-career-home'))return;
 screen.classList.add('gl-mobile-career');
 home.classList.add('mobile-career-home');
 const match=home.querySelector('.match-board'),stats=home.querySelector('.stat-board');
 const timeline=document.createElement('section');timeline.className='mobile-career-timeline';timeline.setAttribute('aria-label','Season timeline');
 timeline.innerHTML='<div class="mobile-week"><small>Last</small><strong id="mobile-career-last">Season start</strong></div><div class="mobile-week current"><small>Now</small><strong id="mobile-career-current">Current week</strong></div><div class="mobile-week"><small>Next</small><strong id="mobile-career-next">Next opponent</strong></div>';
 const grid=document.createElement('div');grid.className='mobile-career-grid';
 const standings=document.createElement('section');standings.className='mobile-standings-card';
 standings.innerHTML='<span class="mobile-card-title">Standings</span><div id="mobile-career-standings" class="mobile-standings-list"></div><div class="mobile-standings-note">Top teams stay in the playoff race. Open League for the full table.</div>';
 home.prepend(timeline);
 if(match)grid.appendChild(match);
 if(stats)grid.appendChild(stats);
 grid.appendChild(standings);home.appendChild(grid);
 const labels={"career-home-tab":"Home","career-player-tab":"Player","career-team-tab":"Team","career-league-tab":"League"};
 for(const [id,label] of Object.entries(labels))if(el(id))el(id).textContent=label;
 const observer=new MutationObserver(()=>queueMicrotask(syncHome));
 observer.observe(screen,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
 syncHome();
}

export function initMobileGameUI(){
 if(!document.getElementById('mobile-game-ui-style')){
  const style=document.createElement('style');style.id='mobile-game-ui-style';style.textContent=STYLE;document.head.appendChild(style);
 }
 enhanceCareerHome();
}
