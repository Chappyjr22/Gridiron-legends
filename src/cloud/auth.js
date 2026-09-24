export function initAuthControls({api,message,onSignedIn}){
 const el=id=>document.getElementById(id);
 let mode='signin',pending=false;
 function setMode(next){
  mode=next;el('cloud-code').value='';
  const hasPassword=['signin','signup','reset'].includes(mode),hasCode=['code','verify','reset'].includes(mode);
  el('cloud-password-row').hidden=!hasPassword;el('cloud-password').disabled=!hasPassword;
  el('cloud-password').autocomplete=mode==='signin'?'current-password':'new-password';
  el('cloud-password-label').textContent=mode==='reset'?'New password':'Password';
  el('cloud-code-row').hidden=!hasCode;el('cloud-code').disabled=!hasCode;
  el('cloud-remember-row').hidden=mode!=='signin';
  el('cloud-send').hidden=!['code','verify','reset'].includes(mode);
  el('cloud-submit').textContent=({signin:'Sign in',signup:'Create account',code:'Sign in',verify:'Verify email',forgot:'Send recovery code',reset:'Save new password'})[mode];
  el('cloud-auth-help').textContent=({signin:'Sign in to save your careers across devices.',signup:'Create your account. Verify your email once, then use your password.',code:'Prefer a code? Request one, then enter it here.',verify:'Enter your email verification code. You only need to do this once.',forgot:'We’ll email a recovery code so you can choose a new password.',reset:'Enter the recovery code and choose your new password.'})[mode];
  for(const b of document.querySelectorAll('[data-auth-mode]'))b.setAttribute('aria-pressed',String(b.dataset.authMode===mode));
 }
 async function run(task){
  if(pending)return;pending=true;
  for(const b of el('cloud-login').querySelectorAll('button'))b.disabled=true;
  try{await task();}catch(error){message(error.message);}finally{pending=false;for(const b of el('cloud-login').querySelectorAll('button'))b.disabled=false;}
 }
 async function finish(){el('cloud-password').value='';el('cloud-code').value='';await onSignedIn();}
 async function sendCode(){
  if(!el('cloud-email').reportValidity())return;
  const email=el('cloud-email').value.trim();
  if(mode==='reset')await api('/api/auth/email-otp/request-password-reset',{email});
  else await api('/api/auth/email-otp/send-verification-otp',{email,type:mode==='verify'?'email-verification':'sign-in'});
  message('Check your email for the code.');el('cloud-code').focus();
 }
 for(const b of document.querySelectorAll('[data-auth-mode]'))b.onclick=()=>{setMode(b.dataset.authMode);message('');};
 el('cloud-send').onclick=()=>void run(sendCode);
 el('cloud-google').onclick=()=>void run(async()=>{
  message('Opening Google sign-in…');
  const result=await api('/api/auth/sign-in/social',{provider:'google'});
  const destination=new URL(result.url);
  if(destination.protocol!=='https:')throw Error('Google sign-in did not start. Please try again.');
  location.assign(destination.href);
 });
 el('cloud-login').onsubmit=event=>{
  event.preventDefault();void run(async()=>{
   const email=el('cloud-email').value.trim(),password=el('cloud-password').value,otp=el('cloud-code').value.trim();
   if(mode==='forgot'){
    await api('/api/auth/email-otp/request-password-reset',{email});setMode('reset');message('If that email has an account, a recovery code is on its way.');return;
   }
   if(mode==='reset'){
    await api('/api/auth/email-otp/reset-password',{email,otp,password});el('cloud-password').value='';setMode('signin');message('Password saved. Sign in with your new password.');return;
   }
   if(mode==='verify'){
    await api('/api/auth/email-otp/verify-email',{email,otp});
    const session=await api('/api/auth/get-session');
    if(session?.user?.emailVerified){await finish();return;}
    setMode('signin');message('Email verified. Sign in with your password.');return;
   }
   if(mode==='signup'){
    const result=await api('/api/auth/sign-up/email',{email,password});el('cloud-password').value='';
    if(!result?.user?.emailVerified){setMode('verify');await sendCode();return;}
    await finish();return;
   }
   if(mode==='code')await api('/api/auth/sign-in/email-otp',{email,otp});
   else {
    const result=await api('/api/auth/sign-in/email',{email,password,rememberMe:el('cloud-remember').checked});
    if(result?.user&&!result.user.emailVerified){setMode('verify');el('cloud-password').value='';await sendCode();return;}
   }
   await finish();
  });
 };
 el('cloud-account').addEventListener('close',()=>{el('cloud-password').value='';el('cloud-code').value='';});
 setMode('signin');
}
