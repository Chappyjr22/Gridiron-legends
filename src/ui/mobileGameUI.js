const el=id=>document.getElementById(id);

const STYLE=`
#career-screen.gl-mobile-career{padding:0;align-items:stretch;justify-content:stretch;background:#08172e;overflow:hidden}
#career-screen.gl-mobile-career .career-panel{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;box-shadow:none;background:linear-gradient(180deg,#245ecb 0,#183d82 60%,#10264d 100%);display:flex;flex-direction:column;overflow:hidden;color:#fff}
#career-screen.gl-mobile-career .career-header{display:grid;align-items:center;position:relative;z-index:3;background:#2f6df0}
#career-screen.gl-mobile-career .career-header-identity{min-width:0}
#career-screen.gl-mobile-career .career-header h2{margin:0;color:#fff;font:900 20px/1 "Courier New",monospace;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#career-screen.gl-mobile-career .career-header-identity span{display:block;color:#dbe8ff;font:900 8px/1.2 "Courier New",monospace;text-transform:uppercase}
#career-screen.gl-mobile-career #career-hub{display:flex;flex:1;min-height:0;flex-direction:column;overflow:hidden}
#career-screen.gl-mobile-career .locker-layout{flex:1;min-height:0;overflow:hidden}
#career-screen.gl-mobile-career .career-page{min-height:0;touch-action:pan-y}
#career-screen.gl-mobile-career .sports-button,#career-screen.gl-mobile-career .flat-action,#career-screen.gl-mobile-career .recap-link{text-transform:uppercase}
#career-screen.gl-mobile-career .sports-button.gold,#career-screen.gl-mobile-career .match-board .field-green{background:#dfdc00;color:#111;border-color:#fff}
@media (orientation:portrait){#career-screen.gl-mobile-career .locker-layout{overflow:auto}}
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
 if(source&&target){const rows=[...source.children].slice(0,4).map(node=>node.outerHTML).join('');if(rows&&target.innerHTML!==rows)target.innerHTML=rows;}
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
 standings.innerHTML='<span class="mobile-card-title">Standings</span><div id="mobile-career-standings" class="mobile-standings-list"></div><div class="mobile-standings-note">Open League for the full table.</div>';
 home.prepend(timeline);
 if(match)grid.appendChild(match);if(stats)grid.appendChild(stats);grid.appendChild(standings);home.appendChild(grid);
 const labels={"career-home-tab":"Home","career-player-tab":"Player","career-team-tab":"Team","career-league-tab":"League"};
 for(const [id,label] of Object.entries(labels))if(el(id))el(id).textContent=label;
 const observer=new MutationObserver(()=>queueMicrotask(syncHome));
 observer.observe(screen,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
 syncHome();
}

export function initMobileGameUI(){
 if(!document.getElementById('mobile-game-ui-style')){const style=document.createElement('style');style.id='mobile-game-ui-style';style.textContent=STYLE;document.head.appendChild(style);}
 enhanceCareerHome();
}
