function ensureMeta(name,content,attribute='name'){
  let tag=document.head.querySelector(`meta[${attribute}="${name}"]`);
  if(!tag){
    tag=document.createElement('meta');
    tag.setAttribute(attribute,name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content',content);
}

function ensureLink(rel,href){
  let link=document.head.querySelector(`link[rel="${rel}"]`);
  if(!link){
    link=document.createElement('link');
    link.rel=rel;
    document.head.appendChild(link);
  }
  link.href=href;
}

function ensureStylesheet(href){
  let link=[...document.head.querySelectorAll('link[rel="stylesheet"]')].find(node=>node.getAttribute('href')===href);
  if(!link){
    link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }
}

export function initPWA(){
  ensureLink('manifest','/manifest.webmanifest');
  ensureLink('apple-touch-icon','/assets/brand/shield-v1.webp');
  ensureStylesheet('/app-mobile.css');
  ensureMeta('theme-color','#080b0c');
  ensureMeta('mobile-web-app-capable','yes');
  ensureMeta('apple-mobile-web-app-capable','yes');
  ensureMeta('apple-mobile-web-app-status-bar-style','black-translucent');
  ensureMeta('apple-mobile-web-app-title','Gridiron Legends');

  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  document.documentElement.dataset.installedApp=standalone?'true':'false';

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('/sw.js').catch(error=>{
        console.warn('Gridiron Legends service worker registration failed:',error);
      });
    },{once:true});
  }
}
