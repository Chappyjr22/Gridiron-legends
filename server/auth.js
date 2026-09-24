// Narrow, same-origin facade over managed Neon Auth. No tokens enter browser JS.
export const authRoutes=new Map([
 ['/get-session','GET'],['/sign-in/email','POST'],['/sign-up/email','POST'],
 ['/sign-in/social','POST'],['/sign-in/email-otp','POST'],['/sign-out','POST'],
 ['/email-otp/send-verification-otp','POST'],['/email-otp/verify-email','POST'],
 ['/email-otp/request-password-reset','POST'],['/email-otp/reset-password','POST']
]);
export function authHeaders(request){
 const headers=new Headers({'Content-Type':'application/json',Origin:new URL(request.url).origin,'x-neon-auth-middleware':'true'});
 const cookies=(request.headers.get('Cookie')||'').split(';').filter(c=>/^(?:__Secure-|__Host-)?(?:neon-?auth|better-auth)[._-]/.test(c.trim()));
 if(cookies.length)headers.set('Cookie',cookies.join(';'));
 return headers;
}
export function copyCookies(from,to){
 for(const cookie of from.getSetCookie())to.append('Set-Cookie',cookie.replace(/;\s*Domain=[^;]*/ig,'').replace(/;\s*Path=[^;]*/ig,'; Path=/').replace(/;\s*SameSite=[^;]*/ig,'; SameSite=Lax'));
}
export function authBody(path,input,origin){
 const email=typeof input.email==='string'?input.email.trim():'';
 if(path==='/sign-in/social')return {provider:'google',callbackURL:origin+'/api/auth/callback',errorCallbackURL:origin+'/?account=error',disableRedirect:true};
 if(path==='/sign-out')return {};
 if(!email||email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw Error('Enter a valid email address.');
 const password=input.password,otp=input.otp;
 if(['/sign-in/email','/sign-up/email','/email-otp/reset-password'].includes(path)&&
   (typeof password!=='string'||password.length<8||password.length>128))throw Error('Use a password with 8–128 characters.');
 if(['/sign-in/email-otp','/email-otp/verify-email','/email-otp/reset-password'].includes(path)&&!/^\d{6}$/.test(otp))throw Error('Enter the six-digit email code.');
 if(path==='/sign-in/email')return {email,password,rememberMe:input.rememberMe!==false};
 if(path==='/sign-up/email')return {email,password,name:'Player'};
 if(path==='/email-otp/send-verification-otp')return {email,type:input.type==='email-verification'?'email-verification':'sign-in'};
 if(path==='/email-otp/reset-password')return {email,otp,password};
 if(path==='/email-otp/request-password-reset')return {email};
 return {email,otp};
}
export async function oauthCallback(request,service,fetcher){
 const url=new URL(request.url),verifier=url.searchParams.get('neon_auth_session_verifier');
 const headers=authHeaders(request),cookies=headers.get('Cookie')||'';
 const response=new Response(null,{status:303,headers:{Location:url.origin+'/?account=error','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 if(!verifier||verifier.length>4096||!/(?:^|;\s*)__Secure-neon-auth\.session_(?:challenge|challange)=/.test(cookies))return response;
 const upstream=await fetcher(service.auth+'/get-session?'+new URLSearchParams({neon_auth_session_verifier:verifier}),{headers,redirect:'manual',signal:AbortSignal.timeout(15000)});
 const result=await upstream.json();
 if(upstream.ok&&result?.user?.id){copyCookies(upstream.headers,response.headers);response.headers.set('Location',url.origin+'/?account=signed-in');}
 return response;
}
