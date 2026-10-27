import assert from "node:assert/strict";
import { test } from "node:test";
import { Session, StaleSessionError } from "../src/lib/auth/session.ts";
import { credentials, currentUser, institutionList, loginToken } from "../src/lib/auth/validation.ts";
import { ApiResponseError, toApiHttpError } from "../src/lib/api/errors.ts";
import { hostInstitution, institutionHref, loginDestination, matchesHost, safeReturnPath } from "../src/lib/auth/navigation.ts";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const id = "10000000-0000-4000-8000-000000000003";
const other = "10000000-0000-4000-8000-000000000004";
const instant = 1_800_000_000_000;
const institution = (slug = "uc") => ({ id, slug, name: slug.toUpperCase(), active: true });
const user = (slug = "uc", subject = id) => ({ id: subject, name: "Persona", email: "persona@example.test",
  institutionMembership: { id, active: true, isAdmin: false, isSuperAdmin: false, institution: institution(slug) }, sectionMemberships: [] });
function jwt(subject = id, iat = instant / 1000) {
  return `e30.${Buffer.from(JSON.stringify({ sub: subject, iat, exp: iat + 900, iss: "academix-api", aud: "academix-clients" })).toString("base64url")}.signature`;
}
const login = (subject = id) => ({ accessToken: jwt(subject), tokenType: "Bearer", expiresIn: 900 });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function harness(reply?: (request: Request) => Response | Promise<Response>) {
  let clock = instant;
  let scheduled: (() => void) | undefined;
  const requests: Request[] = [];
  const session = new Session({ baseUrl: "https://api.example.test", now: () => clock,
    schedule: callback => { scheduled = callback; return 1 as unknown as ReturnType<typeof setTimeout>; }, cancel: () => { scheduled = undefined; },
    fetch: async input => {
      const request = input as Request; requests.push(request);
      if (reply) return reply(request);
      if (request.method === "POST") return Response.json(login());
      const match = new URL(request.url).pathname.match(/institution\/([^/]+)\/me$/);
      return Response.json(match ? user(match[1]) : { items: [institution(), institution("utfsm")] });
    } });
  return { session, requests, advance: (ms: number) => { clock += ms; }, fire: () => scheduled?.() };
}
const signIn = (session: Session) => session.login(" PERSONA@example.test ", " exact password ");

for (const email of ["", " ", "a", "a@b", "a@@b.c", "a @b.c", "a@b..c", "a@b.c\nx", "á@b.c", "a".repeat(250)+"@b.co"]) {
  test(`reject invalid email ${JSON.stringify(email.slice(0,20))}`, () => assert.throws(() => credentials(email,"x")));
}
test("normalize only email, preserve password and enforce UTF-8 length", () => {
  assert.deepEqual(credentials(" A@B.C ", " pass "), {email:"a@b.c",password:" pass "});
  for (const password of ["", "a".repeat(129), "ñ".repeat(65), "😀".repeat(33)]) assert.throws(()=>credentials("a@b.c",password));
  for (const password of [" ", "a".repeat(128), "ñ".repeat(64), "😀".repeat(32)]) assert.equal(credentials("a@b.c",password).password,password);
});
test("login sends normalized credentials with no bearer and validates via directory", async () => {
  const h = harness(); let notices = 0; const unsubscribe = h.session.subscribe(()=>notices++);
  assert.equal(await signIn(h.session),true);
  assert.equal(h.session.getSnapshot().status,"authenticated");
  assert.deepEqual(await h.requests[0].json(),{email:"persona@example.test",password:" exact password "});
  assert.equal(h.requests[0].headers.has("Authorization"),false);
  assert.equal(h.requests[1].headers.get("Authorization"),`Bearer ${jwt()}`);
  assert.ok(h.requests.every(r=>r.cache==="no-store" && r.credentials==="omit" && r.redirect==="error"));
  assert.ok(notices>0); unsubscribe(); h.session.logout();
  assert.doesNotMatch(JSON.stringify(h.session.getSnapshot()),/signature|accessToken|Bearer|password/);
});
test("validation never sends an HTTP request", async () => {
  const h=harness(); assert.equal(await h.session.login("bad",""),false); assert.equal(h.requests.length,0);
  assert.match(h.session.getSnapshot().message!,/correo/);
});
for (const status of [400,401,413,415,429,503,500]) {
  test(`safe login error HTTP ${status} with no server metadata or secrets`,async()=>{
    const h=harness(()=>Response.json({detail:"PRIVATE_DATA",title:"PRIVATE_TITLE"},{status,headers:{"Retry-After":"3"}}));
    assert.equal(await signIn(h.session),false);
    const state=h.session.getSnapshot(); assert.equal(state.status,"anonymous");
    assert.doesNotMatch(JSON.stringify(state),/PRIVATE|signature/);
    if(status===429){ assert.equal(state.retryAt,instant+3000); assert.equal(await signIn(h.session),false); assert.equal(h.requests.length,1); }
  });
}
test("retry deadline clears after elapsed time and handles fallback Retry-After",async()=>{
  let blocked=true;
  const h=harness(r=>r.method==="POST"?(blocked?Response.json({}, {status:429}):Response.json(login())):Response.json({items:[]}));
  await signIn(h.session); assert.equal(h.session.getSnapshot().retryAt,instant+60_000);
  blocked=false; h.advance(60_001); assert.equal(await signIn(h.session),true); h.session.logout();
});
test("Retry-After accepts delta/date and ignores invalid/negative metadata",async()=>{
  for(const [header,expected] of [["2",2000],["-1",undefined],["invalid",undefined],["0",undefined],["999999999",86_400_000]] as const){
    assert.equal((await toApiHttpError(new Response(null,{status:429,headers:{"Retry-After":header}}))).retryAfterMs,expected);
  }
  const date=new Date(Date.now()+20_000).toUTCString();
  const error=await toApiHttpError(new Response(null,{status:429,headers:{"Retry-After":date}}));
  assert.ok(error.retryAfterMs!>18_000 && error.retryAfterMs!<=20_000);
});
test("network exceptions and malformed success always return to anonymous",async()=>{
  for(const response of [null,{},[],{...login(),tokenType:"Cookie"},{...login(),expiresIn:3600},{...login(),accessToken:"corrupt"}]){
    const h=harness(()=>Response.json(response)); assert.equal(await signIn(h.session),false); assert.equal(h.session.getSnapshot().status,"anonymous");
  }
  const h=harness(()=>{throw new Error("PRIVATE_NETWORK");}); assert.equal(await signIn(h.session),false);
  assert.doesNotMatch(h.session.getSnapshot().message!,/PRIVATE/);
  const broken=harness(()=>new Response("not json",{headers:{"Content-Type":"application/json"}}));
  assert.equal(await signIn(broken.session),false);
});
test("malformed JWT claims cannot produce a session",()=>{
  for(const token of ["",jwt(id,instant/1000-901),jwt(id,instant/1000+1),jwt("not-uuid"),"e30.e30.sig","a.!.x","a."+Buffer.from("not json").toString("base64url")+".x"]){
    assert.throws(()=>loginToken({...login(),accessToken:token},instant),ApiResponseError);
  }
  assert.equal(loginToken(login(),instant).expiresAt,instant+900_000);
  assert.throws(()=>loginToken({...login(),accessToken:"a".repeat(4097)},instant));
});
test("duplicate login is single flight; logout cancels and ignores a late login success",async()=>{
  const pending=deferred<Response>(); const h=harness(()=>pending.promise);
  const first=signIn(h.session); assert.equal(h.session.getSnapshot().status,"authenticating");
  assert.equal(await signIn(h.session),false); assert.equal(h.requests.length,1);
  h.session.logout(); assert.equal(h.requests[0].signal.aborted,true);
  pending.resolve(Response.json(login())); assert.equal(await first,false); assert.equal(h.session.getSnapshot().status,"anonymous");
});
test("late old login cannot restore or clear a new identity",async()=>{
  const pending=deferred<Response>(); let first=true;
  const h=harness(r=>r.method==="POST"?(first?(first=false,pending.promise):Response.json(login(other))):Response.json({items:[]}));
  const old=signIn(h.session); await flush(); h.session.logout(); assert.equal(await signIn(h.session),true);
  pending.resolve(Response.json(login())); assert.equal(await old,false); assert.equal(h.session.getSnapshot().status,"authenticated"); h.session.logout();
});
test("expiry removes context, directory and credentials; requests and reload fail closed",async()=>{
  const h=harness(); await signIn(h.session); await h.session.loadContext("uc"); assert.ok(h.session.getSnapshot().context?.user);
  h.advance(900_000); h.fire(); assert.equal(h.session.getSnapshot().status,"anonymous");
  assert.equal(h.session.getSnapshot().context,undefined); assert.equal(h.session.getSnapshot().institutions,undefined);
  await assert.rejects(h.session.request(c=>c.GET("/api/v1/institutions")),StaleSessionError);
  assert.equal(harness().session.getSnapshot().status,"anonymous");
});
test("suspended timers cannot send expired credentials; slow login never extends validity",async()=>{
  const h=harness(); await signIn(h.session); h.advance(900_001);
  await assert.rejects(h.session.request(c=>c.GET("/api/v1/institutions"))); assert.equal(h.requests.length,2);
  const pending=deferred<Response>(); const slow=harness(()=>pending.promise); const result=signIn(slow.session);
  slow.advance(900_001); pending.resolve(Response.json(login())); assert.equal(await result,false);
  assert.equal(slow.session.getSnapshot().status,"anonymous");
});
test("current concurrent 401 responses log out once, old 401 cannot clear a new login",async()=>{
  const pending=deferred<Response>(); let privateCalls=0;
  const h=harness(r=>r.method==="POST"?Response.json(login()):++privateCalls===1?Response.json({items:[]}):pending.promise);
  await signIn(h.session); const generation=h.session.getSnapshot().generation;
  const a=h.session.request(c=>c.GET("/api/v1/institutions"));const b=h.session.request(c=>c.GET("/api/v1/institutions"));
  pending.resolve(Response.json({}, {status:401})); await Promise.allSettled([a,b]);
  assert.equal(h.session.getSnapshot().generation,generation+1); assert.equal(h.session.getSnapshot().status,"anonymous");
  const old=deferred<Response>(); let requests=0;
  const h2=harness(r=>r.method==="POST"?Response.json(login()):++requests===2?old.promise:Response.json({items:[]}));
  await signIn(h2.session); const work=h2.session.request(c=>c.GET("/api/v1/institutions")); await flush(); h2.session.logout(); await signIn(h2.session);
  old.resolve(Response.json({}, {status:401})); await assert.rejects(work); assert.equal(h2.session.getSnapshot().status,"authenticated"); h2.session.logout();
});
test("responses with delayed body cannot leak after logout",async()=>{
  const body=deferred<Uint8Array>(); let calls=0;
  const h=harness(r=>r.method==="POST"?Response.json(login()):++calls===1?Response.json({items:[]}):new Response(new ReadableStream({async start(controller){controller.enqueue(await body.promise);controller.close();}})));
  await signIn(h.session);const work=h.session.request(c=>c.GET("/api/v1/institutions")); await flush();
  h.session.logout(); body.resolve(new TextEncoder().encode('{"items":[]}')); await assert.rejects(work);
});
test("UC/UTFSM switching ignores out-of-order identity and old 404 responses",async()=>{
  for(const oldStatus of [200,404]){
    const uc=deferred<Response>();
    const h=harness(r=>r.method==="POST"?Response.json(login()):r.url.endsWith("/uc/me")?uc.promise:r.url.endsWith("/utfsm/me")?Response.json(user("utfsm")):Response.json({items:[institution(),institution("utfsm")]}));
    await signIn(h.session); const first=h.session.loadContext("uc"); await h.session.loadContext("utfsm");
    uc.resolve(Response.json(oldStatus===200?user():{}, {status:oldStatus})); await first;
    assert.equal(h.session.getSnapshot().context?.user?.institutionMembership.institution.slug,"utfsm");h.session.logout();
  }
});
for(const status of [403,404]){
  test(`context HTTP ${status} removes private identity and offers safe feedback`,async()=>{
    let fail=false;const h=harness(r=>r.method==="POST"?Response.json(login()):r.url.endsWith("/me")?(fail?Response.json({detail:"PRIVATE"},{status}):Response.json(user())):Response.json({items:[institution()]}));
    await signIn(h.session);await h.session.loadContext("uc");fail=true;await h.session.loadContext("uc");
    assert.equal(h.session.getSnapshot().context?.user,undefined);assert.ok(h.session.getSnapshot().context?.error);h.session.logout();
  });
}
test("identity/tenant mismatches, inactive flags and malformed roles fail closed",()=>{
  for(const value of [null,{},user("utfsm"),user("uc",other),{...user(),sectionMemberships:[{courseId:id,sectionId:id,role:"admin"}]},
    {...user(),institutionMembership:{...user().institutionMembership,active:false}},
    {...user(),institutionMembership:{...user().institutionMembership,isAdmin:"true"}},
    {...user(),institutionMembership:{...user().institutionMembership,institution:{...institution(),active:false}}}]) assert.throws(()=>currentUser(value,"uc",id),ApiResponseError);
  assert.equal(currentUser({...user(),sectionMemberships:[{courseId:id,sectionId:id,role:"teacher"}]},"uc",id).sectionMemberships.length,1);
  assert.deepEqual(institutionList({items:[]}),[]);
  for(const value of [null,{},[],{items:[institution(),institution()]},{items:[{...institution(),active:false}]},{items:[{...institution(),slug:"../uc"}]}]) assert.throws(()=>institutionList(value),ApiResponseError);
});
test("malformed directory during login and identity response cannot expose private UI",async()=>{
  let invalid=false;
  const h=harness(r=>r.method==="POST"?Response.json(login()):r.url.endsWith("/me")?Response.json(user("uc",other)):Response.json(invalid?{}:{items:[]}));
  await signIn(h.session);await h.session.loadContext("uc");assert.equal(h.session.getSnapshot().context?.user,undefined);
  await h.session.loadContext("../utfsm");assert.ok(h.session.getSnapshot().context?.error);
  h.session.clearContext(); assert.equal(h.session.getSnapshot().context,undefined);
  invalid=true;await h.session.loadInstitutions();assert.equal(h.session.getSnapshot().institutions,undefined);assert.ok(h.session.getSnapshot().directoryError);
  h.session.logout();assert.equal(await signIn(h.session),false);
});
test("directory races, logout and reauthentication never restore stale lists or context",async()=>{
  const a=deferred<Response>(),b=deferred<Response>();let lists=0;
  const h=harness(r=>r.method==="POST"?Response.json(login()):++lists===1?Response.json({items:[]}):lists===2?a.promise:b.promise);
  await signIn(h.session);const first=h.session.loadInstitutions();const second=h.session.loadInstitutions();
  b.resolve(Response.json({items:[institution("utfsm")]}));await second;
  a.resolve(Response.json({items:[institution()]}));await first;
  assert.deepEqual(h.session.getSnapshot().institutions?.map(i=>i.slug),["utfsm"]);h.session.logout();
});
test("session instances do not share credentials or authenticated state",async()=>{
  const a=harness(),b=harness();await signIn(a.session);assert.equal(b.session.getSnapshot().status,"anonymous");
  await assert.rejects(b.session.request(c=>c.GET("/api/v1/institutions")));assert.equal(b.requests.length,0);a.session.logout();
});
test("safe destinations accept only exact implemented paths",()=>{
  for(const path of [null,"//evil.test","https://evil.test","/institutions/uc","/courses?admin=true","/courses#x","%2Finstitutions","/login","/\\evil.test"])
    assert.equal(safeReturnPath(path),"/courses");
  for(const path of ["/courses","/institutions"]) assert.equal(safeReturnPath(path),path);
});
test("origins match scheme, port and configured destination exactly",()=>{
  const uc="https://uc.academix.dvillasc.me";
  assert.deepEqual(hostInstitution(uc),{valid:true,slug:"uc"});
  for(const host of ["localhost","http://localhost:3000","http://127.0.0.1:3000","http://[::1]:3000",uc+":444",uc+".evil.test",uc+"/","http://uc.academix.dvillasc.me","https://unknown.academix.dvillasc.me"])
    assert.equal(hostInstitution(host).valid,false,host);
  assert.equal(loginDestination(uc,"/institutions/utfsm"),"/courses");
  assert.equal(loginDestination(uc,"/institutions"),"/institutions");
  assert.equal(loginDestination("https://evil.test",null),undefined);
  assert.equal(matchesHost(uc,"utfsm"),false);
  assert.equal(matchesHost(uc,"uc"),true);
  assert.equal(institutionHref(uc,"uc"),"/courses");
  assert.equal(institutionHref(uc,"utfsm"),"https://utfsm.academix.dvillasc.me/courses");
  assert.equal(institutionHref(uc,"unknown"),undefined);
  assert.equal(institutionHref("https://evil.test","uc"),undefined);
});
test("public origin configuration fails closed and supports explicit local hosts",()=>{
  const old=process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;
  try {
    for(const value of ["", "null", "[]", "{}", "bad", '{"https://a.test":"UC"}', '{"https://a.test":"uc","https://b.test":"uc"}',
      ...["http://remote.test","https://a.test/","https://A.test","https://a.test:443","https://u:p@a.test","https://a.test?q=x","https://a.test#x","ftp://a.test"].map(origin=>JSON.stringify({[origin]:"uc"}))]) {
      process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=value;
      assert.equal(hostInstitution("https://uc.academix.dvillasc.me").valid,false,value);
    }
    process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=JSON.stringify({"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"});
    assert.deepEqual(hostInstitution("http://uc.localhost:3000"),{valid:true,slug:"uc"});
    assert.equal(hostInstitution("http://uc.localhost:3001").valid,false);
    assert.equal(institutionHref("http://uc.localhost:3000","utfsm"),"http://utfsm.localhost:3000/courses");
  } finally { if(old===undefined) delete process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS; else process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=old; }
});

test("JWT issuance in the next second during login is accepted without extending the deadline",async()=>{
  const pending=deferred<Response>();const h=harness(r=>r.method==="POST"?pending.promise:Response.json({items:[]}));
  const result=signIn(h.session);await flush();h.advance(1000);
  pending.resolve(Response.json({...login(),accessToken:jwt(id,instant/1000+1)}));assert.equal(await result,true);
  h.advance(899_000);h.fire();assert.equal(h.session.getSnapshot().status,"anonymous");
});

for (const operation of ["login", "directory", "context"] as const) {
  for (const replacement of [false, true]) {
    test(`${operation} delayed body cannot restore data after ${replacement ? "new identity" : "logout"}`, async () => {
      const body = deferred<Uint8Array>(); let hold = false;
      const h = harness(r => {
        const selected = operation === "login" ? r.method === "POST" : operation === "context" ? r.url.endsWith("/me") : r.url.endsWith("/institutions");
        const value = r.method === "POST" ? login(hold ? id : other) : r.url.endsWith("/me") ? user("uc", other) : {items:[institution()]};
        return hold && selected ? new Response(new ReadableStream({async start(c) {c.enqueue(await body.promise);c.close();}})) : Response.json(value);
      });
      if(operation !== "login") await signIn(h.session);
      hold = true;
      const pending = operation === "login" ? signIn(h.session) : operation === "context" ? h.session.loadContext("uc") : h.session.loadInstitutions();
      await flush(); h.session.logout(); hold = false;
      if(replacement) await signIn(h.session);
      const expected = h.session.getSnapshot();
      body.resolve(new TextEncoder().encode(JSON.stringify(operation === "login" ? login() : operation === "context" ? user() : {items:[institution("utfsm")]})));
      await pending;
      assert.deepEqual(h.session.getSnapshot(),expected);
      assert.equal(h.session.getSnapshot().context,undefined);h.session.logout();
    });
  }
}
test("a deferred operation cannot borrow credentials from a later generation",async()=>{
  const gate=deferred<void>(); const h=harness(); await signIn(h.session);
  const pending=h.session.request(async client=>{await gate.promise;return client.GET("/api/v1/institutions");});
  h.session.logout();await signIn(h.session);const count=h.requests.length;gate.resolve();
  await assert.rejects(pending,StaleSessionError);assert.equal(h.requests.length,count);h.session.logout();
});

test("resource rejection revalidates me once and preserves valid membership",async()=>{
 const h=harness(r=>Response.json(r.method==='POST'?login():r.url.endsWith('/me')?user():r.url.endsWith('/courses')?{}:{items:[institution()]},{status:r.url.endsWith('/courses')?403:200}));
 await signIn(h.session);await h.session.loadContext('uc');
 await assert.rejects(h.session.request(c=>c.GET('/api/v1/institution/{institutionSlug}/courses',{params:{path:{institutionSlug:'uc'}}})));
 await flush();assert.ok(h.session.getSnapshot().context?.user);assert.equal(h.session.getSnapshot().context?.error,undefined);
 assert.equal(h.requests.filter(r=>r.url.endsWith('/me')).length,2);h.session.logout();
});

test("only exact attempt UUID survives login return allowlist",()=>{
 const path="/attempts/10000000-0000-4000-8000-000000000080";
 assert.equal(safeReturnPath(path),path);
 for(const suffix of ["\n","\r","\r\n"," ","%0A"])assert.equal(safeReturnPath(path+suffix),"/courses");
 for(const v of [path+"?x=1",path+"#x",path+"/",path.replace("/attempts/","/attempts\\"),path.replace("/attempts/","%2Fattempts%2F"),"%252Fattempts%252F", "https://evil.test"+path,"//evil.test"+path,"/attempts/bad"])assert.equal(safeReturnPath(v),"/courses");
});

 test('tracking return routes require exact UUID segments',()=>{
 const c='10000000-0000-4000-8000-000000000010',q='10000000-0000-4000-8000-000000000060',a='10000000-0000-4000-8000-000000000080';
 for(const path of [`/courses/${c}/grades`,`/courses/${c}/gradebook`,`/courses/${c}/audit`,`/courses/${c}/quizzes/${q}/attempts`,`/courses/${c}/quizzes/${q}/attempts/${a}`]){assert.equal(safeReturnPath(path),path);for(const suffix of [String.fromCharCode(10),String.fromCharCode(13),'?studentId=x','#x','/','\\','\n','%0A'])assert.equal(safeReturnPath(path+suffix),'/courses');}
 });


test("background context failure preserves identity, blocks writes and recovers without replacing context", async () => {
 let fail = false;
 const h = harness(r => r.method === 'POST' ? Response.json(login()) : r.url.endsWith('/me')
   ? fail ? Response.json({}, {status:503}) : Response.json(user()) : Response.json({items:[institution()]}));
 await signIn(h.session); await h.session.loadContext('uc');
 const context = h.session.getSnapshot().context;
 fail = true; await h.session.loadContext('uc');
 assert.equal(h.session.getSnapshot().context, context); assert.ok(h.session.getSnapshot().contextWarning);
 const before = h.requests.length;
 await assert.rejects(h.session.request(c => c.POST('/api/v1/institution/{institutionSlug}/courses', {
   params:{path:{institutionSlug:'uc'}}, body:{code:'A', name:'A', term:'2026', initialSection:{code:'1'}}
 })), error => error instanceof Error && 'status' in error && error.status === 409);
 assert.equal(h.requests.length, before);
 fail = false; await h.session.loadContext('uc');
 assert.equal(h.session.getSnapshot().context, context); assert.equal(h.session.getSnapshot().contextWarning, undefined);
 h.session.logout();
});

test("concurrent revalidation deduplicates and unchanged identity keeps operation boundary", async () => {
 let wait = false; const gate = deferred<Response>();
 const h = harness(r => r.method === 'POST' ? Response.json(login()) : r.url.endsWith('/me')
   ? wait ? gate.promise : Response.json(user()) : Response.json({items:[institution()]}));
 await signIn(h.session); await h.session.loadContext('uc'); const context = h.session.getSnapshot().context;
 wait = true; const a = h.session.loadContext('uc'), b = h.session.loadContext('uc');
 assert.equal(a,b); assert.equal(h.session.getSnapshot().context, context);
 gate.resolve(Response.json(user())); await a;
 assert.equal(h.session.getSnapshot().context, context);
 assert.equal(h.requests.filter(r=>r.url.endsWith('/me')).length, 2); h.session.logout();
});
