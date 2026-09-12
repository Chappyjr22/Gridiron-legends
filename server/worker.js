import {parseCareer} from '../src/career/career.js';
import {SAVE_KEYS} from '../src/cloud/storage.js';
const production='gridiron-legends.jacobchapman3.workers.dev';
const preview='feat-cloud-career-saves-gridiron-legends.jacobchapman3.workers.dev';
const services={
 [production]:{auth:'https://ep-misty-thunder-aybsw4h8.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth',data:'https://ep-misty-thunder-aybsw4h8.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1'},
 [preview]:{auth:'https://ep-solitary-wave-ay4oih88.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth',data:'https://ep-solitary-wave-ay4oih88.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1'}
};
const authRoutes=new Map([['/get-session','GET'],['/email-otp/send-verification-otp','POST'],['/sign-in/email-otp','POST'],['/sign-out','POST']]);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export function validatePayload(values){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid save');
 const bank=JSON.parse(values[SAVE_KEYS[0]]||'null');
 if(bank?.version!==1||!bank.careers||Array.isArray(bank.careers)||typeof bank.careers!=='object')throw Error('Invalid career bank');
 if(Object.keys(bank.careers).length>50)throw Error('Maximum 50 careers per account.');
 for(const [id,c] of Object.entries(bank.careers))if(!id||id!==c.careerId||!parseCareer(JSON.stringify(c)))throw Error('An unreadable career needs recovery before syncing.');
 for(const key of Object.keys(values))if(!SAVE_KEYS.includes(key)&&key!==SAVE_KEYS[1]+'.legacyBackup')throw Error('Invalid save key');
 for(const value of Object.values(values))if(typeof value!=='string')throw Error('Invalid save data');
 if(values[SAVE_KEYS[1]]&&!parseCareer(values[SAVE_KEYS[1]]))throw Error('Invalid active career');
 return values;
}
function authHeaders(request){
 const headers=new Headers({'Content-Type':'application/json','Origin':new URL(request.url).origin});
 const cookies=(request.headers.get('Cookie')||'').split(';').filter(c=>/^(?:__Secure-|__Host-)?(?:neon-auth|better-auth)[._-]/.test(c.trim()));
 if(cookies.length)headers.set('Cookie',cookies.join(';'));
 return headers;
}
function copyCookies(from,to){
 for(const cookie of from.getSetCookie())to.append('Set-Cookie',cookie.replace(/;\s*Domain=[^;]*/ig,'').replace(/;\s*Path=[^;]*/ig,'; Path=/'));
}
async function limitedBody(request,limit){
 if(Number(request.headers.get('Content-Length'))>limit)throw Error('Request too large');
 const reader=request.body?.getReader();if(!reader)return '{}';let size=0;const parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Request too large');}parts.push(value);}
 const all=new Uint8Array(size);let pos=0;for(const p of parts){all.set(p,pos);pos+=p.length;}return new TextDecoder().decode(all);
}
export async function handle(request,env,fetcher=fetch){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 const service=services[url.hostname];if(!service)return json({message:'Cloud saves are only enabled on the named preview and production sites.'},503);
 if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({message:'Invalid request origin'},403);
 const headers=authHeaders(request),opts={headers,redirect:'manual',signal:AbortSignal.timeout(15000)};
 try{
  if(url.pathname.startsWith('/api/auth/')){
   const path=url.pathname.slice('/api/auth'.length);
   if(authRoutes.get(path)!==request.method)return json({message:'Not found'},404);
   let body;if(request.method==='POST'){
    const input=JSON.parse(await limitedBody(request,4096));
    if(path==='/email-otp/send-verification-otp')body=JSON.stringify({email:input.email,type:'sign-in'});
    else if(path==='/sign-in/email-otp')body=JSON.stringify({email:input.email,otp:input.otp});
    else body='{}';
   }
   const upstream=await fetcher(service.auth+path,{...opts,method:request.method,body});
   const result=await upstream.json();
   // Session tokens stay in HttpOnly cookies, never in browser storage or JSON responses.
   if(result&&typeof result==='object'){delete result.token;if(result.session)delete result.session.token;}
   const response=json(result,upstream.status);copyCookies(upstream.headers,response.headers);return response;
  }
  if(!['/api/cloud','/api/cloud/history'].includes(url.pathname))return json({message:'Not found'},404);
  if(!['GET','PUT'].includes(request.method)||url.pathname.endsWith('history')&&request.method!=='GET')return json({message:'Method not allowed'},405);
  const sessionResponse=await fetcher(service.auth+'/get-session',opts),session=await sessionResponse.json();
  if(!sessionResponse.ok||!session?.user?.id)return json({message:'Sign in to sync your careers.'},401);
  if(session.user.id!==request.headers.get('X-Career-Owner'))return json({message:'Account changed. Reload before syncing.'},409);
  // Email OTP verifies ownership; reject unverified sessions created outside our UI.
  if(!session.user.emailVerified)return json({message:'Verify your email before syncing.'},403);
  const jwtResponse=await fetcher(service.auth+'/token',opts),jwt=await jwtResponse.json();
  if(!jwtResponse.ok||!jwt.token)return json({message:'Sign in again to sync.'},401);
  let fn='career_cloud_read',args={};
  if(url.pathname.endsWith('history')){
   const rev=url.searchParams.get('revision');fn=rev?'career_cloud_history_read':'career_cloud_history_list';
   if(rev){const n=Number(rev);if(!Number.isSafeInteger(n)||n<1)return json({message:'Invalid revision'},400);args={save_revision:n};}
  }else if(request.method==='PUT'){
   const body=JSON.parse(await limitedBody(request,5000000));
   if(!Number.isSafeInteger(body.revision)||body.revision<0||typeof body.mutation!=='string'||body.mutation.length<8||body.mutation.length>100)return json({message:'Invalid revision'},400);
   args={expected_revision:body.revision,mutation:body.mutation,save_payload:validatePayload(body.payload)};fn='career_cloud_write';
  }
  const result=await fetcher(service.data+'/rpc/'+fn,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.token},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});
  const value=await result.json();if(!result.ok)return json({message:'Cloud save unavailable. Your device save is retained.'},503);
  const response=json(value,value?.conflict?409:200);copyCookies(sessionResponse.headers,response.headers);return response;
 }catch(error){return json({message:error.name==='SyntaxError'?'Invalid request.':error.message==='Request too large'?'Save is too large. Export a backup.':'Cloud save unavailable. Your device save is retained.'},error.name==='SyntaxError'?400:503);}
}
export default {fetch(request,env){return handle(request,env);}};
