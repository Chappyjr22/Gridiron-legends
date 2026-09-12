// Keep keyboard focus in the visible overlay; native dialogs handle their own trap.
export function initOverlayFocus(){
 const overlays=[...document.querySelectorAll('.overlay')];
 const focusable=root=>[...root.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
 let active=null,previous=null;
 const sync=()=>{
  const next=overlays.filter(el=>el.classList.contains('show')).at(-1)||null;
  if(next===active)return;
  if(active){active.removeAttribute('aria-modal');if(!active.classList.contains('show'))active.removeAttribute('role');}
  if(next){if(!active)previous=document.activeElement;next.setAttribute('role','dialog');next.setAttribute('aria-modal','true');next.setAttribute('aria-label',next.id==='pause-overlay'?'Game paused':next.id==='callsheet-overlay'?'Choose a play':next.id==='fourth-down-overlay'?'Fourth down':'Play result');focusable(next)[0]?.focus({preventScroll:true});}
  else if(previous?.isConnected&&previous.getClientRects().length)previous.focus({preventScroll:true});
  active=next;
 };
 const observer=new MutationObserver(sync);for(const overlay of overlays)observer.observe(overlay,{attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!active||document.querySelector('dialog[open]'))return;
  const nodes=focusable(active),index=nodes.indexOf(document.activeElement);
  if(nodes.length&&(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===nodes.length-1)){event.preventDefault();nodes[event.shiftKey?nodes.length-1:0].focus();}
 });
 sync();
}
