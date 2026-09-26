import assert from 'node:assert/strict';
import {makeAccountStorage,OWNER_KEY,CACHE_PREFIX,SAVE_KEYS,encodeDeviceSave,decodeDeviceSave,storageErrorMessage} from '../src/cloud/storage.js';
import {mergePayload} from '../src/cloud/sync.js';
import {createCareer} from '../src/career/career.js';
import {handle,validatePayload} from '../server/worker.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};};
const disk=memory();disk.setItem(SAVE_KEYS[0],'guest original');const guest=makeAccountStorage(disk);assert.equal(guest.getItem(SAVE_KEYS[0]),'guest original');
disk.setItem(OWNER_KEY,'alice');assert.throws(()=>guest.setItem(SAVE_KEYS[0],'stale'),/Account changed/);
const a=makeAccountStorage(disk);assert.equal(a.getItem(SAVE_KEYS[0]),null);a.setItem(SAVE_KEYS[0],'alice save');const sent=a.snapshot();a.setItem(SAVE_KEYS[0],'newer save');a.acknowledge(sent,1);assert.equal(a.snapshot().dirty,true);assert.equal(a.getItem(SAVE_KEYS[0]),'newer save');
assert.equal(a.install({revision:2,payload:{}},sent),false);const second=makeAccountStorage(disk);second.setItem(SAVE_KEYS[0],'other tab');assert.throws(()=>a.setItem(SAVE_KEYS[0],'stale'),/another tab/);
disk.setItem(OWNER_KEY,'bob');const b=makeAccountStorage(disk);assert.equal(b.getItem(SAVE_KEYS[0]),null);assert.equal(disk.getItem(SAVE_KEYS[0]),'guest original');
const c=createCareer({name:'Saved QB'});const payload={[SAVE_KEYS[0]]:JSON.stringify({version:1,lastId:c.careerId,careers:{[c.careerId]:c},recovery:[]}),[SAVE_KEYS[1]]:JSON.stringify(c)};
const modified=structuredClone(c);modified.xp=9;const other={[SAVE_KEYS[0]]:JSON.stringify({version:1,lastId:c.careerId,careers:{[c.careerId]:modified},recovery:[]})};
const merged=mergePayload(payload,other);assert.equal(Object.keys(JSON.parse(merged[SAVE_KEYS[0]]).careers).length,2);validatePayload(merged);assert.equal(Object.keys(JSON.parse(mergePayload(payload,payload)[SAVE_KEYS[0]]).careers).length,1);
const host='https://feat-cloud-career-saves-gridiron-legends.jacobchapman3.workers.dev';
let calls=0;
const backend=async(url,opts)=>{calls++;if(url.endsWith('/get-session'))return Response.json({user:{id:'alice',emailVerified:true},session:{token:'secret'}});if(url.endsWith('/token'))return Response.json({token:'jwt'});if(url.endsWith('/career_cloud_write')){assert.equal(opts.headers.Authorization,'Bearer jwt');return Response.json({revision:1});}return Response.json({revision:0,payload:null});};
assert.equal((await handle(new Request(host+'/api/cloud',{method:'PUT',body:'{}',headers:{Origin:'https://evil.example'}}),{},backend)).status,403);assert.equal(calls,0);
assert.equal((await handle(new Request(host+'/api/cloud',{headers:{'X-Career-Owner':'bob'}}),{},backend)).status,409);
const request=new Request(host+'/api/cloud',{method:'PUT',headers:{Origin:host,'X-Career-Owner':'alice'},body:JSON.stringify({revision:0,mutation:'save-123456',payload})});assert.equal((await handle(request,{},backend)).status,200);
const result=await handle(new Request(host+'/api/auth/get-session'),{},backend);const json=await result.json();assert.equal(json.session.token,undefined);
assert.equal((await handle(new Request(host+'/api/auth/admin/create-user',{method:'POST',headers:{Origin:host},body:'{}'}),{},backend)).status,404);
const unauthorized=async()=>Response.json(null);assert.equal((await handle(new Request(host+'/api/cloud'),{},unauthorized)).status,401);
console.log('Cloud checks passed: guest preservation, account isolation, stale tabs, pending writes, conflict copies, payload validation, origin checks, session isolation and token redaction.');

// Password, recovery, and Google routes expose only the intended managed APIs.
const post=(path,body)=>new Request(host+'/api/auth'+path,{method:'POST',headers:{Origin:host},body:JSON.stringify(body)});
for(const [path,input,expected] of [
 ['/sign-in/email',{email:' player@example.invalid ',password:'test-password',rememberMe:false,role:'admin'},{email:'player@example.invalid',password:'test-password',rememberMe:false}],
 ['/sign-up/email',{email:'player@example.invalid',password:'test-password',emailVerified:true},{email:'player@example.invalid',password:'test-password',name:'Player'}],
 ['/email-otp/reset-password',{email:'player@example.invalid',otp:'123456',password:'new-password',userId:'other'},{email:'player@example.invalid',otp:'123456',password:'new-password'}],
 ['/email-otp/request-password-reset',{email:'player@example.invalid'},{email:'player@example.invalid'}],
 ['/email-otp/verify-email',{email:'player@example.invalid',otp:'123456'},{email:'player@example.invalid',otp:'123456'}],
 ['/sign-in/social',{provider:'github',callbackURL:'https://evil.example'},{provider:'google',callbackURL:host+'/api/auth/callback',errorCallbackURL:host+'/?account=error',disableRedirect:true}]
]){
 const response=await handle(post(path,input),{},async(url,opts)=>{
  assert.ok(url.endsWith(path));assert.deepEqual(JSON.parse(opts.body),expected);assert.equal(opts.headers.get('x-neon-auth-middleware'),'true');
  return Response.json({token:'secret',session:{token:'secret'},user:{id:'alice'}},{headers:{'Set-Cookie':'__Secure-neon-auth.session_token=opaque; Domain=neon.tech; Path=/neondb/auth; Secure; HttpOnly; SameSite=None; Max-Age=604800'}});
 });
 assert.equal(response.status,200);const value=await response.json();assert.equal(value.token,undefined);assert.equal(value.session.token,undefined);
 const cookie=response.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Max-Age=604800/);assert.doesNotMatch(cookie,/Domain=/);assert.match(cookie,/Path=\/;/);
}
let fetched=false;
for(const body of [{email:'wrong',password:'test-password'},{email:'a@b.test',password:'short'}])assert.equal((await handle(post('/sign-in/email',body),{},async()=>{fetched=true;})).status,400);
assert.equal(fetched,false);
const callback=host+'/api/auth/callback?neon_auth_session_verifier=one-use-verifier&redirect=https://evil.example';
const rejected=await handle(new Request(callback),{},async()=>{throw Error('Must not exchange without challenge');});assert.equal(rejected.headers.get('Location'),host+'/?account=error');
const exchanged=await handle(new Request(callback,{headers:{Cookie:'__Secure-neon-auth.session_challenge=challenge; unrelated=private'}}),{},async(url,opts)=>{
 assert.ok(url.endsWith('/get-session?neon_auth_session_verifier=one-use-verifier'));assert.doesNotMatch(opts.headers.get('Cookie'),/unrelated/);
 return Response.json({user:{id:'alice'},session:{token:'secret'}},{headers:{'Set-Cookie':'__Secure-neon-auth.session_token=session; Secure; HttpOnly; Path=/; SameSite=None'}});
});
assert.equal(exchanged.status,303);assert.equal(exchanged.headers.get('Location'),host+'/?account=signed-in');assert.equal(exchanged.headers.get('Referrer-Policy'),'no-referrer');assert.match(exchanged.headers.get('Set-Cookie'),/HttpOnly/);assert.equal(await exchanged.text(),'');
assert.equal((await handle(new Request(host+'/api/cloud',{headers:{'X-Career-Owner':'alice'}}),{},async()=>Response.json({user:{id:'alice',emailVerified:false}}))).status,403);
console.log('Account checks passed: password/recovery validation, fixed Google redirects, challenge-bound callback, persistent HttpOnly cookies and verified cloud ownership.');

// Storage pressure: migrate old saves losslessly, including recovery and Unicode.
const quotaDisk=memory();
const cacheKey=CACHE_PREFIX+'quota-player';
const original={values:payload,revision:7,dirty:true,mutation:'pending-before-migration'};
const originalRaw=JSON.stringify(original);
quotaDisk.setItem(OWNER_KEY,'quota-player');quotaDisk.setItem(cacheKey,originalRaw);
quotaDisk.setItem(cacheKey+':recovery',originalRaw);
quotaDisk.setItem('unrelated','keep me');
let rejectWrites=false;
const limited={getItem:quotaDisk.getItem,setItem(k,v){
 if(rejectWrites||String(v).length>originalRaw.length/2)throw new DOMException('The quota has been exceeded.','QuotaExceededError');
 quotaDisk.setItem(k,v);
}};
const compact=makeAccountStorage(limited);
assert.deepEqual(compact.snapshot(),original);
assert.ok(quotaDisk.getItem(cacheKey).length<originalRaw.length/2);
assert.equal(decodeDeviceSave(quotaDisk.getItem(cacheKey+':recovery')),originalRaw);
assert.equal(quotaDisk.getItem('unrelated'),'keep me');
assert.equal(compact.getItem(SAVE_KEYS[0]),payload[SAVE_KEYS[0]]);
compact.backup(compact.snapshot());
compact.setItem(SAVE_KEYS[1],JSON.stringify({...c,name:'José 🏈 王'}));
assert.equal(JSON.parse(makeAccountStorage(limited).getItem(SAVE_KEYS[1])).name,'José 🏈 王');
const beforeFailure=quotaDisk.getItem(cacheKey),snapshot=compact.snapshot();
rejectWrites=true;
assert.throws(()=>compact.setItem(SAVE_KEYS[0],'cannot save'),{name:'QuotaExceededError'});
assert.throws(()=>compact.install({payload:{},revision:8},snapshot),{name:'QuotaExceededError'});
assert.throws(()=>compact.backup(snapshot),{name:'QuotaExceededError'});
assert.equal(quotaDisk.getItem(cacheKey),beforeFailure);
assert.deepEqual(compact.snapshot(),snapshot);
assert.match(storageErrorMessage(new DOMException('The quota has been exceeded.','QuotaExceededError')),/did not finish/);
// A blocked migration retains the original raw data and remains readable.
quotaDisk.setItem(cacheKey,originalRaw);
assert.deepEqual(makeAccountStorage(limited).snapshot(),original);
assert.equal(quotaDisk.getItem(cacheKey),originalRaw);
for(const raw of ['', 'short', '🏈é漢字'.repeat(1000), originalRaw])assert.equal(decodeDeviceSave(encodeDeviceSave(raw)),raw);
const recovered=structuredClone(payload),bank=JSON.parse(recovered[SAVE_KEYS[0]]);
bank.recovery=[{id:'broken',raw:'unreadable original',reason:'Keep for recovery'}];
recovered[SAVE_KEYS[0]]=JSON.stringify(bank);
let repeated=recovered;for(let i=0;i<3;i++)repeated=mergePayload(repeated,recovered);
assert.equal(JSON.parse(repeated[SAVE_KEYS[0]]).recovery.length,1);
console.log(`Storage checks passed: lossless migration, backups, Unicode, atomic quota failures, repeat imports. Account fixture reduced ${Math.round(100*(1-encodeDeviceSave(originalRaw).length/originalRaw.length))}%.`);
