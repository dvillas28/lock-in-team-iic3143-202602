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
for(const status of [403,404,503]){
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
test("safe destinations reject open redirects, encoding, queries, fragments and extra routes",()=>{
  for(const path of [null,"//evil.test","https://evil.test","/institutions/uc?admin=true","/institutions/uc#x","/institutions/%75c","/institutions/../uc","/institutions/uc/course","/login","/\\evil.test"]){assert.equal(safeReturnPath(path),"/institutions");}
  for(const path of ["/institutions","/institutions/uc","/institutions/utfsm","/institutions/a--b"])assert.equal(safeReturnPath(path),path);
});
test("hostname only selects visual context; unexpected domains and path mismatch are rejected",()=>{
  for(const host of ["localhost","127.0.0.1","[::1]"])assert.deepEqual(hostInstitution(host),{valid:true});
  for(const host of ["evil.test","uc.academix.dvillasc.me.evil.test","uc.evil.test","api.dvillasc.me","academix.dvillasc.me"])assert.equal(hostInstitution(host).valid,false);
  assert.equal(loginDestination("uc.academix.dvillasc.me","/institutions/utfsm"),"/institutions/uc");
  assert.equal(loginDestination("localhost","/institutions/utfsm"),"/institutions/utfsm");
  assert.equal(loginDestination("evil.test",null),undefined);
  assert.equal(matchesHost("uc.academix.dvillasc.me","utfsm"),false);assert.equal(matchesHost("localhost","utfsm"),true);
  assert.equal(institutionHref("localhost","uc"),"/institutions/uc");
  assert.equal(institutionHref("uc.academix.dvillasc.me","uc"),"/institutions/uc");
  assert.equal(institutionHref("uc.academix.dvillasc.me","utfsm"),"https://utfsm.academix.dvillasc.me/institutions/utfsm");
  assert.throws(()=>institutionHref("evil.test","uc"));assert.throws(()=>institutionHref("localhost","../uc"));
});

test("JWT issuance in the next second during login is accepted without extending the deadline",async()=>{
  const pending=deferred<Response>();const h=harness(r=>r.method==="POST"?pending.promise:Response.json({items:[]}));
  const result=signIn(h.session);await flush();h.advance(1000);
  pending.resolve(Response.json({...login(),accessToken:jwt(id,instant/1000+1)}));assert.equal(await result,true);
  h.advance(899_000);h.fire();assert.equal(h.session.getSnapshot().status,"anonymous");
});
