const isInstalled=()=>document.documentElement.dataset.installedApp==='true';
const labelFor=select=>select.getAttribute('aria-label')||document.querySelector(`label[for="${select.id}"]`)?.textContent?.trim()||'Choose option';

function optionItems(select){
  const out=[];
  for(const node of select.children){
    if(node.tagName==='OPTGROUP'){
      out.push({group:node.label});
      for(const option of node.children)out.push({option});
    }else if(node.tagName==='OPTION')out.push({option:node});
  }
  return out;
}

function syncButton(select,button){
  const option=select.options[select.selectedIndex];
  button.textContent=option?.textContent||labelFor(select);
  button.disabled=select.disabled;
}

function buildSheet(){
  let dialog=document.getElementById('app-select-sheet');
  if(dialog)return dialog;
  dialog=document.createElement('dialog');
  dialog.id='app-select-sheet';
  dialog.className='app-select-sheet';
  dialog.innerHTML='<div class="app-select-card"><header><div><span class="app-select-kicker">SELECT</span><h2 id="app-select-title">Choose option</h2></div><button type="button" class="app-select-close" aria-label="Close">✕</button></header><input id="app-select-search" class="app-select-search" type="search" inputmode="search" placeholder="Search" autocomplete="off"><div id="app-select-options" class="app-select-options" role="listbox"></div></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('.app-select-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  return dialog;
}

function openSheet(select,button){
  const dialog=buildSheet();
  const title=dialog.querySelector('#app-select-title');
  const search=dialog.querySelector('#app-select-search');
  const list=dialog.querySelector('#app-select-options');
  title.textContent=labelFor(select);
  const items=optionItems(select);
  const options=items.filter(item=>item.option&&!item.option.disabled);
  search.hidden=options.length<9;
  search.value='';
  list.innerHTML='';
  for(const item of items){
    if(item.group){
      const heading=document.createElement('div');
      heading.className='app-select-group';
      heading.textContent=item.group;
      list.appendChild(heading);
      continue;
    }
    const option=item.option;
    if(option.disabled)continue;
    const choice=document.createElement('button');
    choice.type='button';
    choice.className='app-select-option';
    choice.dataset.value=option.value;
    choice.dataset.search=option.textContent.toLowerCase();
    choice.setAttribute('role','option');
    choice.setAttribute('aria-selected',String(option.value===select.value));
    choice.innerHTML=`<span>${option.textContent}</span>${option.value===select.value?'<b aria-hidden="true">✓</b>':''}`;
    choice.onclick=()=>{
      if(select.value!==option.value){
        select.value=option.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
      syncButton(select,button);
      dialog.close();
    };
    list.appendChild(choice);
  }
  search.oninput=()=>{
    const term=search.value.trim().toLowerCase();
    for(const choice of list.querySelectorAll('.app-select-option'))choice.hidden=!!term&&!choice.dataset.search.includes(term);
    for(const group of list.querySelectorAll('.app-select-group'))group.hidden=!!term;
  };
  dialog.showModal();
  if(!search.hidden)setTimeout(()=>search.focus(),50);
}

function enhanceSegmented(select){
  if(select.dataset.appEnhanced)return;
  const wrap=document.createElement('div');
  wrap.className='app-segmented';
  wrap.setAttribute('role','radiogroup');
  wrap.setAttribute('aria-label',labelFor(select));
  const sync=()=>{
    for(const button of wrap.querySelectorAll('button')){
      const active=button.dataset.value===select.value;
      button.classList.toggle('active',active);
      button.setAttribute('aria-checked',String(active));
    }
  };
  for(const option of select.options){
    const button=document.createElement('button');
    button.type='button';
    button.dataset.value=option.value;
    button.textContent=option.textContent;
    button.setAttribute('role','radio');
    button.onclick=()=>{
      if(select.value!==option.value){select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));}
      sync();
    };
    wrap.appendChild(button);
  }
  select.insertAdjacentElement('afterend',wrap);
  select.classList.add('app-select-native-hidden');
  select.dataset.appEnhanced='segmented';
  select.addEventListener('change',sync);
  new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true});
  sync();
}

function enhanceSheet(select){
  if(select.dataset.appEnhanced||select.hidden||select.multiple)return;
  const button=document.createElement('button');
  button.type='button';
  button.className='app-select-trigger';
  button.setAttribute('aria-haspopup','dialog');
  button.setAttribute('aria-label',labelFor(select));
  button.onclick=()=>openSheet(select,button);
  select.insertAdjacentElement('afterend',button);
  select.classList.add('app-select-native-hidden');
  select.dataset.appEnhanced='sheet';
  select.addEventListener('change',()=>syncButton(select,button));
  new MutationObserver(()=>syncButton(select,button)).observe(select,{childList:true,subtree:true,attributes:true});
  syncButton(select,button);
}

function enhanceAll(){
  if(!isInstalled())return;
  for(const select of document.querySelectorAll('select')){
    if(select.id==='league-stat-category')enhanceSegmented(select);
    else enhanceSheet(select);
  }
}

export function initMobileSelects(){
  if(!isInstalled())return;
  enhanceAll();
  new MutationObserver(enhanceAll).observe(document.body,{childList:true,subtree:true});
}
