// Reuse the existing controls and handlers in both settings entry points.
export function setSettingsPage(root,page='gameplay'){
 root.dataset.settingsPage=page;
 for(const button of root.querySelectorAll('[data-settings-page]'))button.setAttribute('aria-pressed',String(button.dataset.settingsPage===page));
 const scroller=root.querySelector('.setup-scroll,.pause-scroll');if(scroller)scroller.scrollTop=0;
}
export function initSettingsScreens(){
 for(const id of ['setup-screen','pause-overlay']){
  const root=document.getElementById(id),pause=id==='pause-overlay';
  const header=root.querySelector('.panel-heading,.card-header');
  const tabs=document.createElement('nav');tabs.className='settings-tabs';tabs.setAttribute('aria-label','Settings sections');
  for(const [page,label] of [['gameplay','Gameplay'],['sound','Sound'],['help','Help']]){
   const button=document.createElement('button');button.type='button';button.dataset.settingsPage=page;button.textContent=label;button.onclick=()=>setSettingsPage(root,page);tabs.append(button);
  }
  header.append(tabs);
  const body=root.querySelector('.setup-scroll,.pause-scroll');
  const help=document.createElement('section');help.className='settings-help';
  help.innerHTML='<article><h3>Passing & running</h3><p>Slingshot: pull back and release to throw. Aim backward and release to scramble. You cannot pass after tucking.</p></article><article><h3>Runner moves</h3><p>Drag to steer. Swipe up or down to juke. Swipe toward the opponent’s end zone to dive. Quarterbacks slide.</p></article>';
  help.append(body.querySelector('[data-open-guide]'));
  body.append(help);
  if(pause){
   root.classList.add('compact-settings');
   const grid=document.createElement('div');grid.className='settings-gameplay';
   for(const row of [...body.querySelectorAll('.settings-row')].slice(0,4))grid.append(row);
   body.prepend(grid);
   body.querySelector(':scope>.experience-note')?.remove();body.querySelector('.settings-section')?.remove();
   const session=body.querySelector(':scope>.settings-row');
   root.querySelector('.pause-actions').prepend(document.getElementById('btn-main-menu'));
   help.append(document.getElementById('checkpoint-help'));session?.remove();
  }
  setSettingsPage(root);
 }
}
