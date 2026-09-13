const el=id=>document.getElementById(id);

const STYLE=`
@font-face{font-family:GLPixel;src:url('assets/ui/Jersey10-Regular.ttf') format('truetype');font-display:swap}
#career-screen.gl-mobile-career{
 --gl-bg:#041b43;--gl-panel:#06275f;--gl-panel2:#082f70;--gl-line:#087cf0;--gl-line2:#1e92ff;--gl-yellow:#ffe000;--gl-white:#f4f8ff;--gl-muted:#9dc3f5;
 font-family:GLPixel,"Courier New",monospace!important;background:#031635!important;color:var(--gl-white)!important
}
#career-screen.gl-mobile-career .career-panel{background:linear-gradient(180deg,#05245a 0,#041a42 100%)!important}
#career-screen.gl-mobile-career .career-header{
 min-height:58px!important;display:grid!important;grid-template-columns:minmax(205px,.8fr) 1.4fr 62px!important;gap:10px!important;
 padding:6px max(14px,env(safe-area-inset-right)) 6px max(14px,env(safe-area-inset-left))!important;
 background:linear-gradient(180deg,#0758bd 0,#06499e 100%)!important;border-top:2px solid #0c85f9!important;border-bottom:3px solid #1189f5!important;box-shadow:0 3px 0 #02102b!important
}
#career-screen.gl-mobile-career .career-header-profile{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:9px;min-width:0}
#career-screen.gl-mobile-career .career-header-portrait{width:48px;height:48px;image-rendering:pixelated;background:#063d83;border:2px solid #168cff;box-shadow:inset 0 0 0 2px #042d68}
#career-screen.gl-mobile-career .career-header-identity h2{font-family:GLPixel,"Courier New",monospace!important;font-size:27px!important;line-height:.9!important;letter-spacing:.04em!important;text-shadow:2px 2px 0 #032355}
#career-screen.gl-mobile-career .career-header-identity span{font-family:GLPixel,"Courier New",monospace!important;font-size:12px!important;color:#d9eaff!important;letter-spacing:.06em!important}
#career-screen.gl-mobile-career .career-header-identity span::first-letter{color:var(--gl-yellow)}
#career-screen.gl-mobile-career .mobile-page-context{text-align:center!important;align-self:center!important}
#career-screen.gl-mobile-career .mobile-page-context strong{font-family:GLPixel,"Courier New",monospace!important;font-size:30px!important;line-height:.86!important;letter-spacing:.05em!important;text-shadow:2px 2px 0 #032355;white-space:nowrap}
#career-screen.gl-mobile-career .mobile-page-context strong:before,#career-screen.gl-mobile-career .mobile-page-context strong:after{content:"★";color:var(--gl-yellow);font-size:18px;vertical-align:4px;margin:0 14px}
#career-screen.gl-mobile-career .mobile-page-context #career-season{font-family:GLPixel,"Courier New",monospace!important;font-size:12px!important;color:#c3dcff!important;letter-spacing:.07em!important;margin-top:5px!important;max-width:60vw!important}
#career-screen.gl-mobile-career #career-menu-open{width:50px!important;height:48px!important;min-height:48px!important;background:#073a80!important;border:3px solid #fff!important;box-shadow:inset 0 0 0 2px #0c63c9!important;font-size:24px!important;color:#fff7d0!important}

#career-screen.gl-mobile-career #career-hub{background:linear-gradient(180deg,#041b43 0,#03183a 100%)!important}
#career-screen.gl-mobile-career .locker-layout{padding:8px 14px 6px!important;overflow:hidden!important}
#career-screen.gl-mobile-career .career-page{font-family:Arial,sans-serif!important}
#career-screen.gl-mobile-career .career-page h1,#career-screen.gl-mobile-career .career-page h2,#career-screen.gl-mobile-career .career-page h3,#career-screen.gl-mobile-career .career-page strong,#career-screen.gl-mobile-career button{font-family:GLPixel,"Courier New",monospace!important}

/* HOME */
#career-screen.gl-mobile-career .mobile-career-home{gap:8px!important;padding:0!important}
#career-screen.gl-mobile-career .mobile-career-timeline{
 min-height:56px!important;grid-template-columns:1fr 1.35fr 1fr!important;background:linear-gradient(180deg,#062a64,#052354)!important;
 border:2px solid var(--gl-line)!important;border-radius:2px!important;box-shadow:inset 0 0 0 1px #021633!important;color:#fff!important
}
#career-screen.gl-mobile-career .mobile-week{padding:7px 13px!important;border-right:1px solid #0d69ce!important;align-items:flex-start!important;text-align:left!important}
#career-screen.gl-mobile-career .mobile-week.current{align-items:center!important;text-align:center!important;border-bottom:0!important;background:transparent!important}
#career-screen.gl-mobile-career .mobile-week:last-child{border-right:0!important}
#career-screen.gl-mobile-career .mobile-week small{font-family:GLPixel,"Courier New",monospace!important;font-size:12px!important;color:#98bce9!important;letter-spacing:.08em!important}
#career-screen.gl-mobile-career .mobile-week strong{font-family:GLPixel,"Courier New",monospace!important;font-size:15px!important;color:#fff!important;line-height:1!important}
#career-screen.gl-mobile-career .mobile-week.current strong{color:var(--gl-yellow)!important;font-size:16px!important}
#career-screen.gl-mobile-career .mobile-week.current:before{content:"";position:absolute;left:16%;right:16%;bottom:7px;height:6px;background:#03183d;border:1px solid #087cf0}
#career-screen.gl-mobile-career .mobile-week.current:after{display:block!important;content:""!important;position:absolute;left:16%;bottom:7px;width:28%;height:6px;border:0!important;border-radius:0!important;background:var(--gl-yellow)!important;transform:none!important}
#career-screen.gl-mobile-career .mobile-career-grid{display:grid!important;grid-template-columns:minmax(0,1.42fr) minmax(225px,.78fr) minmax(235px,.82fr)!important;gap:8px!important;min-height:0!important;flex:1!important}
#career-screen.gl-mobile-career .match-board,#career-screen.gl-mobile-career .stat-board,#career-screen.gl-mobile-career .mobile-standings-card{
 min-height:0!important;border:2px solid var(--gl-line)!important;border-radius:2px!important;background:linear-gradient(180deg,#06275e,#041f4b)!important;box-shadow:inset 0 0 0 1px #021637!important;overflow:hidden!important
}
#career-screen.gl-mobile-career .match-board{
 padding:8px 11px!important;border-right:2px solid var(--gl-line)!important;
 background:
 linear-gradient(180deg,rgba(2,22,57,.18),rgba(2,20,49,.38)),
 repeating-linear-gradient(90deg,rgba(13,93,69,.44) 0 30px,rgba(7,72,59,.44) 30px 60px),
 linear-gradient(180deg,#07315f 0 42%,#084d52 42% 100%)!important;
 position:relative
}
#career-screen.gl-mobile-career .match-board:before,#career-screen.gl-mobile-career .match-board:after{content:"✦✦✦";position:absolute;top:15px;color:#cbe7ff;text-shadow:0 0 8px #8bd1ff;font-size:20px;letter-spacing:-5px;opacity:.9}
#career-screen.gl-mobile-career .match-board:before{left:18px}#career-screen.gl-mobile-career .match-board:after{right:18px}
#career-screen.gl-mobile-career .match-board>.board-kicker{font-size:13px!important;color:#a9caf4!important;letter-spacing:.12em!important;margin:0 0 2px!important;position:relative;z-index:1}
#career-screen.gl-mobile-career .match-board>.board-kicker:before,#career-screen.gl-mobile-career .match-board>.board-kicker:after{content:"";display:inline-block;width:70px;height:2px;background:#a9caf4;vertical-align:4px;margin:0 10px;opacity:.8}
#career-screen.gl-mobile-career .match-board .helmet-matchup{min-height:104px!important;margin:0!important;transform:none!important;position:relative;z-index:1}
#career-screen.gl-mobile-career .helmet-matchup .helmet{width:66px!important;height:58px!important;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.45))}
#career-screen.gl-mobile-career .helmet-matchup strong{font-size:26px!important;color:#fff!important;text-shadow:2px 2px 0 #03152f}
#career-screen.gl-mobile-career .helmet-matchup small{font-size:11px!important;color:#fff!important}
#career-screen.gl-mobile-career .helmet-matchup>b{font-size:25px!important;color:#fff!important}
#career-screen.gl-mobile-career .match-board h3{font-size:11px!important;color:#b8d8ff!important;margin:-4px 0 2px!important;position:relative;z-index:1}
#career-screen.gl-mobile-career .match-board #career-matchup{font-size:8px!important;color:#b9d1ed!important;margin:0 auto 4px!important;position:relative;z-index:1}
#career-screen.gl-mobile-career .match-board #career-play,#career-screen.gl-mobile-career .match-board #career-draft,#career-screen.gl-mobile-career .match-board #career-next-season{
 width:96%!important;min-height:46px!important;margin:auto auto 1px!important;background:linear-gradient(180deg,#ffe92f,#ffd600)!important;color:#071836!important;border:3px solid #fff!important;box-shadow:0 4px 0 #031630!important;font-size:15px!important;letter-spacing:.03em!important;position:relative;z-index:1
}
#career-screen.gl-mobile-career .match-board #career-play:before{content:"▶";margin-right:12px;font-size:17px}
#career-screen.gl-mobile-career .stat-board{padding:10px!important;display:flex!important;flex-direction:column!important;gap:7px!important;background:linear-gradient(180deg,#06275f,#041d47)!important}
#career-screen.gl-mobile-career .stat-board .challenge-heading{display:flex!important;align-items:center!important;justify-content:space-between!important;border-bottom:1px solid #0a6ed9;padding-bottom:6px}
#career-screen.gl-mobile-career .stat-board .board-kicker{font-size:16px!important;color:#fff!important;margin:0!important}
#career-screen.gl-mobile-career .stat-board .reward-chip{background:#08285d!important;border:2px solid #0a78e7!important;color:var(--gl-yellow)!important;padding:5px 8px!important;font-size:13px!important}
#career-screen.gl-mobile-career .stat-board #career-weekly-goal{display:block!important;white-space:normal!important;overflow:visible!important;font-size:13px!important;line-height:1.2!important;color:#fff!important;margin:6px 0!important}
#career-screen.gl-mobile-career .stat-board #career-weekly-goal:before{content:"☑";font-size:28px;color:var(--gl-yellow);float:left;margin:0 9px 10px 0}
#career-screen.gl-mobile-career .mobile-standings-card{padding:9px 10px!important}
#career-screen.gl-mobile-career .mobile-card-title{font-family:GLPixel,"Courier New",monospace!important;color:#fff!important;font-size:16px!important;margin:0 0 5px!important;padding-bottom:6px;border-bottom:1px solid #0b70dd}
#career-screen.gl-mobile-career .mobile-card-title:after{content:"VIEW FULL  ›";float:right;color:#a8c8ee;font-size:9px;margin-top:3px}
#career-screen.gl-mobile-career .mobile-standings-list .career-list-row{padding:8px 5px!important;font-size:11px!important;border-bottom:1px solid #0b62bf!important;color:#fff!important}
#career-screen.gl-mobile-career .mobile-standings-list .career-selected{color:var(--gl-yellow)!important;background:#06347e;border:1px solid #0b7cf2;padding:7px 5px!important}
#career-screen.gl-mobile-career .mobile-standings-note{display:none!important}

/* PLAYER */
#career-screen.gl-mobile-career #career-player-panel{gap:8px!important;padding:0!important}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar,#career-screen.gl-mobile-career .league-jumps{
 min-height:42px!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important;background:linear-gradient(180deg,#06285e,#051f4b)!important;border:2px solid var(--gl-line)!important;border-radius:2px!important;overflow:hidden!important
}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar button,#career-screen.gl-mobile-career .league-jumps button{
 min-width:0!important;min-height:42px!important;border:0!important;border-right:1px solid #0b6cd3!important;border-bottom:5px solid transparent!important;background:transparent!important;color:#aac8ef!important;font-size:15px!important;box-shadow:none!important
}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar button:last-child,#career-screen.gl-mobile-career .league-jumps button:last-child{border-right:0!important}
#career-screen.gl-mobile-career #career-player-panel .player-toolbar button.gold,#career-screen.gl-mobile-career .league-jumps button.active{color:var(--gl-yellow)!important;border-bottom-color:var(--gl-yellow)!important}
#career-screen.gl-mobile-career #player-upgrades-view{grid-template-columns:230px minmax(0,1fr)!important;gap:8px!important;padding:0!important}
#career-screen.gl-mobile-career .qb-passport,#career-screen.gl-mobile-career .qb-attributes{border:2px solid var(--gl-line)!important;background:linear-gradient(180deg,#06275f,#041d47)!important;box-shadow:inset 0 0 0 1px #021637!important}
#career-screen.gl-mobile-career .qb-passport{padding:10px!important;border-right:2px solid var(--gl-line)!important;justify-content:flex-start!important}
#career-screen.gl-mobile-career .profile-face-button{width:130px!important;height:130px!important;min-height:130px!important;border:2px solid #87bdff!important;background:#06356f!important}
#career-screen.gl-mobile-career .profile-face-button canvas{width:112px!important;height:112px!important;max-width:112px!important;max-height:112px!important}
#career-screen.gl-mobile-career .profile-face-button span{display:none!important}
#career-screen.gl-mobile-career .qb-passport>strong{font-size:25px!important;margin-top:2px}
#career-screen.gl-mobile-career .qb-passport>span{font-size:12px!important;color:#c3d9f7!important}
#career-screen.gl-mobile-career .qb-passport progress{width:90%!important;height:8px!important;margin-top:5px}
#career-screen.gl-mobile-career .qb-attributes{padding:9px 11px!important;overflow:auto!important}
#career-screen.gl-mobile-career .player-section-heading{padding-bottom:6px;border-bottom:1px solid #0b68ce;margin-bottom:2px!important}
#career-screen.gl-mobile-career .player-section-heading h3{font-size:21px!important}
#career-screen.gl-mobile-career .points-badge{font-family:GLPixel,"Courier New",monospace!important;background:var(--gl-yellow)!important;color:#061634!important;font-size:12px!important;padding:7px 12px!important;border-radius:2px}
#career-screen.gl-mobile-career #career-upgrades button{grid-template-columns:56px minmax(135px,.8fr) 56px minmax(150px,1fr) 130px!important;min-height:62px!important;padding:6px!important;border:1px solid #0b73df!important;margin-top:5px!important;background:#05265a!important;border-radius:2px!important}
#career-screen.gl-mobile-career #career-upgrades .mobile-attr-icon{display:grid;place-items:center;width:42px;height:42px;border:2px solid #087ef4;background:#073b85;color:#fff;font-size:23px}
#career-screen.gl-mobile-career #career-upgrades .mobile-attr-copy{min-width:0}
#career-screen.gl-mobile-career #career-upgrades .mobile-attr-name{font-family:GLPixel,"Courier New",monospace!important;display:block;color:#fff;font-size:19px!important;line-height:.9}
#career-screen.gl-mobile-career #career-upgrades .mobile-attr-desc{display:block;color:#73a7e8;font-size:10px!important;margin-top:4px;text-transform:uppercase}
#career-screen.gl-mobile-career #career-upgrades strong{font-size:28px!important;color:var(--gl-yellow)!important;text-align:center!important}
#career-screen.gl-mobile-career #career-upgrades .rating-track{height:9px!important;background:#021b45!important;border:1px solid #0a6fdb}
#career-screen.gl-mobile-career #career-upgrades .rating-track>span{background:linear-gradient(90deg,#ffe62b,#ffd900)!important}
#career-screen.gl-mobile-career #career-upgrades .upgrade-cost{min-width:120px!important;padding:8px!important;border:2px solid #5789b5!important;background:#315f80!important;font-size:14px!important;color:#fff!important}

/* TEAM */
#career-screen.gl-mobile-career #career-team-panel{gap:8px!important;padding:0!important}
#career-screen.gl-mobile-career .mobile-team-heading{min-height:54px!important;padding:8px 12px!important;border:2px solid var(--gl-line)!important;background:linear-gradient(180deg,#06275f,#041d47)!important}
#career-screen.gl-mobile-career #my-team-name{font-size:28px!important;color:#fff!important}
#career-screen.gl-mobile-career #career-team-editor{min-height:36px!important;border:2px solid #0c7cf0!important;background:#06265a!important;color:#fff!important;font-size:12px!important;padding:6px 13px!important}
#career-screen.gl-mobile-career #career-team-editor:before{content:"✎";margin-right:7px;font-size:16px}
#career-screen.gl-mobile-career #my-team-roster{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important;padding:0 2px 2px!important}
#career-screen.gl-mobile-career #my-team-roster .roster-card{min-height:142px!important;padding:7px 5px!important;background:linear-gradient(180deg,#06275f,#041d47)!important;border:2px solid #0b78e8!important;box-shadow:inset 0 0 0 1px #021637!important}
#career-screen.gl-mobile-career #my-team-roster .roster-card canvas{width:72px!important;height:72px!important;max-width:72px!important;max-height:72px!important;background:#06366d!important}
#career-screen.gl-mobile-career #my-team-roster .roster-card strong{font-size:15px!important;color:#fff!important}
#career-screen.gl-mobile-career #my-team-roster .roster-card span{font-size:10px!important;color:#fff!important}
#career-screen.gl-mobile-career #my-team-roster .roster-card>span:first-child{font-family:GLPixel,"Courier New",monospace!important;font-size:13px!important}
#career-screen.gl-mobile-career #my-team-roster .roster-rating{width:92%!important;height:7px!important;background:#021b45!important;border:1px solid #075ab4}
#career-screen.gl-mobile-career #my-team-roster .roster-rating i{background:var(--gl-yellow)!important}

/* LEAGUE */
#career-screen.gl-mobile-career #career-league-panel{gap:8px!important;padding:0!important}
#career-screen.gl-mobile-career .mobile-league-view{padding:9px 11px!important;border:2px solid var(--gl-line)!important;background:linear-gradient(180deg,#06275f,#041d47)!important;box-shadow:inset 0 0 0 1px #021637!important}
#career-screen.gl-mobile-career .mobile-league-view h3{font-size:26px!important;color:#fff!important;margin:0 0 3px!important}
#career-screen.gl-mobile-career .mobile-league-standings{position:relative;background:linear-gradient(180deg,#06275f,#041d47)!important}
#career-screen.gl-mobile-career .mobile-league-standings:after{content:"COLLEGE\AFOOTBALL";white-space:pre;position:absolute;right:26px;top:20px;color:#0a69cd;font-family:GLPixel,"Courier New",monospace;font-size:19px;line-height:.9;text-align:center;opacity:.78}
#career-screen.gl-mobile-career .mobile-league-standings #career-standings-note{font-size:12px!important;color:#b6d1f2!important;margin-bottom:8px!important;max-width:78%}
#career-screen.gl-mobile-career #career-standings{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0 10px!important}
#career-screen.gl-mobile-career #career-standings .career-list-row{font-size:14px!important;padding:8px 10px!important;border-bottom:1px solid #0a65c8!important;color:#fff!important}
#career-screen.gl-mobile-career #career-standings .career-selected{color:var(--gl-yellow)!important;background:#07347b!important;border:1px solid #0d7df0!important}

/* BOTTOM NAV */
#career-screen.gl-mobile-career .career-nav{min-height:52px!important;background:linear-gradient(180deg,#06245a,#041b43)!important;border-top:2px solid #087cf0!important;padding:0 max(14px,env(safe-area-inset-right)) max(2px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))!important}
#career-screen.gl-mobile-career .career-nav button{min-height:50px!important;color:#b6d1f1!important;font-size:15px!important;border-right:1px solid #0a66c8!important}
#career-screen.gl-mobile-career .career-nav button:last-child{border-right:0!important}
#career-screen.gl-mobile-career .career-nav button.gold{color:var(--gl-yellow)!important}
#career-screen.gl-mobile-career .career-nav button.gold:after{left:12%!important;right:12%!important;top:auto!important;bottom:0!important;height:4px!important;background:var(--gl-yellow)!important}
#career-screen.gl-mobile-career .career-nav button:before{font-size:20px!important;margin-right:12px!important;vertical-align:-3px!important}

@media (orientation:landscape) and (max-height:500px){
 #career-screen.gl-mobile-career .career-header{min-height:52px!important}
 #career-screen.gl-mobile-career .career-header-portrait{width:42px;height:42px}
 #career-screen.gl-mobile-career .career-header-profile{grid-template-columns:42px minmax(0,1fr)}
 #career-screen.gl-mobile-career .career-header-identity h2{font-size:23px!important}
 #career-screen.gl-mobile-career .mobile-page-context strong{font-size:25px!important}
 #career-screen.gl-mobile-career .mobile-career-timeline{min-height:48px!important}
 #career-screen.gl-mobile-career .mobile-career-grid{grid-template-columns:minmax(0,1.4fr) minmax(200px,.78fr) minmax(210px,.8fr)!important}
 #career-screen.gl-mobile-career .helmet-matchup .helmet{width:56px!important;height:50px!important}
 #career-screen.gl-mobile-career .helmet-matchup strong{font-size:22px!important}
 #career-screen.gl-mobile-career .match-board .helmet-matchup{min-height:84px!important}
 #career-screen.gl-mobile-career #player-upgrades-view{grid-template-columns:205px minmax(0,1fr)!important}
 #career-screen.gl-mobile-career .profile-face-button{width:104px!important;height:104px!important;min-height:104px!important}
 #career-screen.gl-mobile-career .profile-face-button canvas{width:92px!important;height:92px!important;max-width:92px!important;max-height:92px!important}
 #career-screen.gl-mobile-career #career-upgrades button{min-height:52px!important;grid-template-columns:48px minmax(120px,.8fr) 48px minmax(130px,1fr) 112px!important}
 #career-screen.gl-mobile-career #career-upgrades .mobile-attr-icon{width:36px;height:36px;font-size:19px}
 #career-screen.gl-mobile-career #career-upgrades .mobile-attr-name{font-size:16px!important}
 #career-screen.gl-mobile-career #my-team-roster .roster-card{min-height:122px!important}
 #career-screen.gl-mobile-career #my-team-roster .roster-card canvas{width:58px!important;height:58px!important;max-width:58px!important;max-height:58px!important}
 #career-screen.gl-mobile-career .career-nav{min-height:46px!important}
 #career-screen.gl-mobile-career .career-nav button{min-height:44px!important;font-size:12px!important}
}
`;

const ATTR_META={
 accuracy:{icon:'⌖',desc:'Hit your target'},
 arm:{icon:'💪',desc:'Throw it further'},
 release:{icon:'◒',desc:'Get it off quick'},
 speed:{icon:'➜',desc:'Extend the play'},
 mobility:{icon:'➜',desc:'Extend the play'},
 stamina:{icon:'◆',desc:'Stay strong late'}
};

function titleCase(v){return String(v||'').replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()).trim();}
function attrKey(label){const s=String(label||'').toLowerCase();if(s.includes('accuracy'))return'accuracy';if(s.includes('arm'))return'arm';if(s.includes('release'))return'release';if(s.includes('speed'))return'speed';if(s.includes('mobility'))return'mobility';if(s.includes('stamina'))return'stamina';return s.replace(/\s+/g,'');}

function ensureHeader(){
 const header=document.querySelector('#career-screen .career-header'),identity=header?.querySelector('.career-header-identity');
 if(!header||!identity)return;
 let wrap=header.querySelector('.career-header-profile');
 if(!wrap){wrap=document.createElement('div');wrap.className='career-header-profile';identity.before(wrap);wrap.appendChild(identity);const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;canvas.className='career-header-portrait';canvas.setAttribute('aria-hidden','true');wrap.prepend(canvas);}
 let context=header.querySelector('.mobile-page-context');
 if(!context){const season=el('career-season');context=document.createElement('div');context.className='mobile-page-context';const title=document.createElement('strong');title.textContent='Career';season?.before(context);context.append(title);if(season)context.append(season);}
}

function copyHeaderPortrait(){
 const dst=document.querySelector('.career-header-portrait'),src=el('qb-profile-sprite');if(!dst||!src||!src.width||!src.height)return;
 const ctx=dst.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,dst.width,dst.height);try{ctx.drawImage(src,0,0,dst.width,dst.height);}catch(e){}
}

function ensureHomeColumns(){
 const grid=document.querySelector('#career-home-panel .mobile-career-grid'),match=document.querySelector('#career-home-panel .match-board'),stats=document.querySelector('#career-home-panel .stat-board'),standings=document.querySelector('#career-home-panel .mobile-standings-card');
 if(!grid||!match||!stats||!standings)return;
 if(stats.parentElement!==grid)grid.insertBefore(stats,standings);
}

function enhanceAttributes(){
 for(const button of document.querySelectorAll('#career-upgrades button')){
  if(button.dataset.renderSpec==='true')continue;button.dataset.renderSpec='true';
  const label=button.querySelector(':scope > span:first-child'),key=attrKey(label?.textContent),meta=ATTR_META[key]||{icon:'◆',desc:'Build your game'};
  if(label){const copy=document.createElement('span');copy.className='mobile-attr-copy';const name=document.createElement('span');name.className='mobile-attr-name';name.textContent=titleCase(label.textContent);const desc=document.createElement('span');desc.className='mobile-attr-desc';desc.textContent=meta.desc;copy.append(name,desc);label.replaceWith(copy);}
  const icon=document.createElement('span');icon.className='mobile-attr-icon';icon.textContent=meta.icon;button.prepend(icon);
 }
}

function addTeamMeta(){
 const heading=document.querySelector('#career-team-panel .mobile-team-heading'),name=el('my-team-name');if(!heading||!name||heading.querySelector('.mobile-team-title'))return;
 const wrap=document.createElement('div');wrap.className='mobile-team-title';name.before(wrap);wrap.appendChild(name);const meta=document.createElement('span');meta.className='mobile-team-meta';meta.textContent='ROSTER  ·  TEAM DEPTH  ·  SEASON';wrap.appendChild(meta);
}

function updateScreenTitle(){
 const hub=el('career-hub'),title=document.querySelector('.mobile-page-context strong');if(!hub||!title)return;
 const labels={home:'CAREER',player:'PLAYER',team:'MY TEAM',league:'LEAGUE'};title.textContent=labels[hub.dataset.view]||'CAREER';
}

function sync(){ensureHeader();ensureHomeColumns();enhanceAttributes();addTeamMeta();updateScreenTitle();copyHeaderPortrait();}

export function initMobileGameUIRenderSpec(){
 if(!document.getElementById('mobile-game-ui-render-spec')){const style=document.createElement('style');style.id='mobile-game-ui-render-spec';style.textContent=STYLE;document.head.appendChild(style);}
 sync();
 const screen=el('career-screen');if(screen&&!screen.dataset.renderSpecObserver){screen.dataset.renderSpecObserver='true';const observer=new MutationObserver(()=>queueMicrotask(sync));observer.observe(screen,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','data-view','class']});}
 for(const b of document.querySelectorAll('[data-career-tab]'))b.addEventListener('click',()=>setTimeout(sync,0));
 setTimeout(sync,80);setTimeout(sync,350);
}
