import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {mkdtemp,readdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import sharp from "sharp";
import {database,http,login,runtimeDatabase} from "./helpers.mjs";
import {accountFixture,accountRequest,loginStandalone,newPassword,failAccountAudit,restoreAccountAudit,users} from "./account-fixtures.mjs";

const profile=async(app,token)=>{
 const response=await accountRequest(app,token,"/me");assert.equal(response.status,200);
 assert.equal(response.headers.get("cache-control"),"no-store");return response.json();
};
test("profile global without memberships, exact timestamps, conflicts, no-op and audit rollback",async()=>{
 const pool=await database();let app;
 try {
  const f=await accountFixture(pool);app=await http({MAIL_DELIVERY_MODE:"disabled",AVATAR_STORAGE_DRIVER:"disabled"});
  const token=await loginStandalone(app,f.standalone);
  const otherName=(await pool.query("SELECT name FROM public.users WHERE id=$1",[users.other])).rows[0].name;
  assert.deepEqual((await (await accountRequest(app,token,"/institutions")).json()).items,[]);
  await pool.query("UPDATE public.users SET updated_at='2026-11-07T13:14:15.123456Z' WHERE id=$1",[f.standalone.id]);
  const initial=await profile(app,token);assert.equal(initial.updatedAt,"2026-11-07T13:14:15.123456Z");
  assert.deepEqual(initial.capabilities,{avatar:false,invitationEmail:false});
  for(const body of [
   {name:"",bio:null,expectedUpdatedAt:initial.updatedAt},
   {name:"Cuenta",bio:"x".repeat(501),expectedUpdatedAt:initial.updatedAt},
   {name:"Cuenta",bio:null,expectedUpdatedAt:initial.updatedAt,userId:users.other},
   {name:"Cuenta",bio:null,expectedUpdatedAt:initial.updatedAt,email:"other@example.test"},
  ])assert.equal((await accountRequest(app,token,"/me","PATCH",body)).status,400);
  const results=await Promise.all(["Primera edición","Segunda edición"].map(name=>accountRequest(app,token,"/me","PATCH",{name,bio:"Descripción propia",expectedUpdatedAt:initial.updatedAt})));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const current=await profile(app,token);assert.notEqual(current.updatedAt,initial.updatedAt);assert.match(current.updatedAt,/\.\d{6}Z$/);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_security_events WHERE user_id=$1",[f.standalone.id])).rows[0].count,1);
  const unchanged=await accountRequest(app,token,"/me","PATCH",{name:current.name,bio:current.bio,expectedUpdatedAt:current.updatedAt});assert.equal(unchanged.status,200);
  assert.equal((await unchanged.json()).updatedAt,current.updatedAt);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_security_events WHERE user_id=$1",[f.standalone.id])).rows[0].count,1);
  await failAccountAudit(pool);
  assert.equal((await accountRequest(app,token,"/me","PATCH",{name:"No debe guardarse",bio:null,expectedUpdatedAt:current.updatedAt})).status,500);
  await restoreAccountAudit(pool);assert.deepEqual(await profile(app,token),current);
  assert.equal((await pool.query("SELECT name FROM public.users WHERE id=$1",[users.other])).rows[0].name,otherName);
 }finally{if(app)await app.close();await pool.end();}
});

test("password change preserves identity, rejects wrong current and revokes all previous tenant sessions",async()=>{
 const pool=await database();let app;
 try {
  const f=await accountFixture(pool);app=await http({MAIL_DELIVERY_MODE:"disabled",AVATAR_STORAGE_DRIVER:"disabled"});
  const token=await login(app,f.env),second=await login(app,f.env);
  for(const slug of ["uc","utfsm"])assert.equal((await accountRequest(app,token,`/institution/${slug}/me`)).status,200);
  const changed=newPassword(),body={currentPassword:f.env.DEMO_MULTI_PASSWORD,newPassword:changed,confirmPassword:changed};
  assert.equal((await accountRequest(app,token,"/me/password","POST",{...body,currentPassword:"incorrecta"})).status,400);
  assert.equal((await accountRequest(app,token,"/me")).status,200,"field error invalidated session");
  const [change,race]=await Promise.all([
   accountRequest(app,token,"/me/password","POST",body),
   accountRequest(app,null,"/auth/login","POST",{email:"demo-multi@academix.example",password:f.env.DEMO_MULTI_PASSWORD}),
  ]);
  assert.equal(change.status,204);assert.ok([200,401].includes(race.status));
  if(race.status===200)assert.equal((await accountRequest(app,(await race.json()).accessToken,"/me")).status,401);
  for(const old of [token,second])for(const path of ["/me","/institution/uc/me","/institution/utfsm/me"])
   assert.equal((await accountRequest(app,old,path)).status,401);
  assert.equal((await accountRequest(app,null,"/auth/login","POST",{email:"demo-multi@academix.example",password:f.env.DEMO_MULTI_PASSWORD})).status,401);
  const fresh=await accountRequest(app,null,"/auth/login","POST",{email:"demo-multi@academix.example",password:changed});
  const authenticated=fresh;
  assert.equal(authenticated.status,200);assert.equal((await profile(app,(await authenticated.json()).accessToken)).id,users.owner);
  const stored=(await pool.query("SELECT credential_version FROM public.users WHERE id=$1",[users.owner])).rows[0];assert.equal(stored.credential_version,1);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_security_events WHERE user_id=$1 AND action='credential.changed'",[users.owner])).rows[0].count,1);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM institution_memberships WHERE user_id=$1",[users.owner])).rows[0].count,2);
 }finally{if(app)await app.close();await pool.end();}
});

test("runtime identity grants and bounded SQL reject null preconditions while account audit stays immutable",async()=>{
 const pool=await database();let runtime;
 try {
  const f=await accountFixture(pool);runtime=await runtimeDatabase();
  const date=(await pool.query(`SELECT to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS date FROM public.users WHERE id=$1`,[f.standalone.id])).rows[0].date;
  for(const query of [
   ["UPDATE public.users SET name='forbidden' WHERE id=$1",[f.standalone.id]],
   ["INSERT INTO public.users(id,email,name,password_hash) VALUES($1,'forbidden@example.test','forbidden','forbidden')",[randomUUID()]],
   ["SELECT public.account_update_profile('forbidden',NULL,NULL,0)",[]],
   ["SELECT public.account_update_profile('forbidden',NULL,$1::timestamptz,NULL)",[date]],
   ["SELECT public.account_change_password('invalid',NULL)",[]],
   ["SELECT public.account_set_avatar(NULL,NULL,0)",[]],
   ["SELECT public.account_set_avatar($1,$2::timestamptz,0)",[`avatars/${users.other}/${randomUUID()}.webp`,date]],
   ["SET ROLE academix_account_writer",[]],
  ])await assert.rejects(()=>runtime.withIdentity(f.standalone.id,db=>db.query(query[0],query[1])));
  assert.equal((await pool.query("SELECT name FROM public.users WHERE id=$1",[f.standalone.id])).rows[0].name,"Cuenta sin institución");
  const writer=(await pool.query("SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,rolinherit FROM pg_roles WHERE rolname='academix_account_writer'")).rows[0];
  assert.ok(writer);assert.ok(Object.values(writer).every(value=>value===false));
  const tables=(await pool.query("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])",[["account_security_events","account_invitations","user_imports","user_import_rows"]])).rows;
  assert.equal(tables.length,4);assert.ok(tables.every(t=>t.relrowsecurity&&t.relforcerowsecurity));
  await pool.query("INSERT INTO account_security_events(user_id,actor_user_id,action,metadata) VALUES($1,$1,'profile.updated','{}')",[f.standalone.id]);
  await assert.rejects(()=>pool.query("UPDATE account_security_events SET metadata='{}'"));
  assert.equal((await runtime.withIdentity(users.other,db=>db.query("SELECT * FROM account_security_events WHERE user_id=$1",[f.standalone.id]))).rowCount,0);
 }finally{if(runtime)await runtime.onApplicationShutdown();await pool.end();}
});

async function upload(app,token,date,buffer,name="foto.png") {
 const form=new FormData();form.append("file",new Blob([buffer],{type:"image/png"}),name);form.append("expectedUpdatedAt",date);
 return fetch(app.base+"/api/v1/me/avatar",{method:"PUT",headers:{Authorization:`Bearer ${token}`},body:form});
}
test("local private avatar persists, rejects stale writes and compensates storage after audit failure",async()=>{
 const pool=await database(),directory=await mkdtemp(join(tmpdir(),"academix-avatar-integration-"));let app;
 try {
  const f=await accountFixture(pool),env={MAIL_DELIVERY_MODE:"disabled",AVATAR_STORAGE_DRIVER:"local",AVATAR_LOCAL_DIR:directory,NODE_ENV:"development"};
  app=await http(env);let token=await loginStandalone(app,f.standalone),current=await profile(app,token);
  const image=await sharp({create:{width:24,height:16,channels:3,background:"#123456"}}).png().toBuffer();
  const uploaded=await upload(app,token,current.updatedAt,image);assert.equal(uploaded.status,200);const first=await uploaded.json();assert.equal(first.hasAvatar,true);
  const photo=await accountRequest(app,token,"/me/avatar");assert.equal(photo.status,200);assert.match(photo.headers.get("content-type"),/^image\/webp/);
  const bytes=Buffer.from(await photo.arrayBuffer());assert.equal((await sharp(bytes).metadata()).format,"webp");
  assert.equal((await accountRequest(app,null,"/me/avatar")).status,401);
  assert.equal((await upload(app,token,current.updatedAt,image)).status,409);
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
  assert.equal((await upload(app,token,first.updatedAt,svg)).status,415);
  await failAccountAudit(pool);assert.equal((await upload(app,token,first.updatedAt,image)).status,500);await restoreAccountAudit(pool);
  assert.deepEqual(Buffer.from(await (await accountRequest(app,token,"/me/avatar")).arrayBuffer()),bytes);
  assert.equal((await readdir(join(directory,"avatars",f.standalone.id))).length,1);
  await app.close();app=await http(env);token=await loginStandalone(app,f.standalone);current=await profile(app,token);
  assert.equal(current.hasAvatar,true);assert.equal((await accountRequest(app,token,"/me/avatar")).status,200);
  const removed=await accountRequest(app,token,"/me/avatar","DELETE",{expectedUpdatedAt:current.updatedAt});assert.equal(removed.status,200);assert.equal((await removed.json()).hasAvatar,false);
  assert.equal((await accountRequest(app,token,"/me/avatar")).status,404);
  assert.equal((await readdir(join(directory,"avatars",f.standalone.id))).length,0);
 }finally{if(app)await app.close();await pool.end();await rm(directory,{recursive:true,force:true});}
});

test("production without provider credentials boots and preserves ordinary account functionality",async()=>{
 const pool=await database();let app;
 try {
  const f=await accountFixture(pool);app=await http({NODE_ENV:"production",AVATAR_STORAGE_DRIVER:"s3",AWS_REGION:"",S3_AVATAR_BUCKET:"",AWS_ACCESS_KEY_ID:"",AWS_SECRET_ACCESS_KEY:"",MAIL_DELIVERY_MODE:"resend",RESEND_API_KEY:"",MAIL_FROM:"",CORS_ALLOWED_ORIGINS:'["https://uc.academix.dvillasc.me","https://utfsm.academix.dvillasc.me"]'});
  assert.equal((await fetch(app.base+"/ready")).status,200);
  const token=await loginStandalone(app,f.standalone),current=await profile(app,token);assert.deepEqual(current.capabilities,{avatar:false,invitationEmail:false});
  const unavailable=await accountRequest(app,token,"/me/avatar");assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).code,"INTEGRATION_NOT_CONFIGURED");
  const changed=await accountRequest(app,token,"/me","PATCH",{name:"Cuenta operativa",bio:null,expectedUpdatedAt:current.updatedAt});assert.equal(changed.status,200);
  const previous=current.updatedAt;
  assert.equal((await accountRequest(app,token,"/me/avatar","DELETE",{expectedUpdatedAt:previous})).status,503);
 }finally{if(app)await app.close();await pool.end();}
});
