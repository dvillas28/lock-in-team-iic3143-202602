import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash,randomUUID} from "node:crypto";
import {database,http,login} from "./helpers.mjs";
import {failAudit,restoreAudit} from "./course-fixtures.mjs";
import {accountFixture,accountServices,accountRequest,inviteCode,newPassword,status,users} from "./account-fixtures.mjs";

const address=()=>`invite-${randomUUID()}@example.test`;
const activation=(code)=>{const password=newPassword();return {token:code,password,confirmPassword:password};};
const isStatus=(expected)=>error=>status(error)===expected;
const importsFor=async(s)=>{const {ImportsService}=await import("../../dist/accounts/imports.service.js");return new ImportsService(s.runtime,s.audit);};
const upload=(text)=>({buffer:Buffer.from(text)});

test("institutional invitation permissions, normalized idempotency, disabled delivery and no premature identity",async()=>{
 const pool=await database();let s;
 try {
  const f=await accountFixture(pool);s=await accountServices();
  const initialUsers=(await pool.query("SELECT count(*)::int AS count FROM users")).rows[0].count;
  await pool.query("UPDATE institution_memberships SET is_admin=false,is_super_admin=true WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,users.owner]);
  const email=address(),key=randomUUID();
  const first=await s.invitations.create(users.owner,"uc",{name:"Cuenta invitada",email:email.toUpperCase()},key);
  assert.equal(first.email,email);assert.equal(first.status,"pending");assert.equal(first.deliveryStatus,"pending");
  const replay=await s.invitations.create(users.owner,"uc",{name:"Cuenta invitada",email},key);assert.equal(replay.id,first.id);
  await assert.rejects(()=>s.invitations.create(users.owner,"uc",{name:"Otro nombre",email},key),isStatus(409));
  await assert.rejects(()=>s.invitations.create(users.owner,"utfsm",{name:"Cruce",email:address()},randomUUID()),isStatus(403));
  await assert.rejects(()=>s.invitations.create(users.foreign,"utfsm",{name:"Sin permiso",email:address()},randomUUID()),isStatus(403));
  const admin=await s.invitations.create(users.other,"uc",{name:"Alta de admin",email:address()},randomUUID());assert.equal(admin.status,"pending");
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM users")).rows[0].count,initialUsers);
  const before=(await pool.query("SELECT * FROM account_invitations WHERE id=$1",[first.id])).rows[0];assert.equal(before.token_hash,null);assert.equal(before.delivery_version,0);
  s.integrations.mailer={available:false,async send(){throw new Error("disabled provider must not run");}};
  await assert.rejects(()=>s.invitations.send(users.foreign,"utfsm",first.id,randomUUID()),isStatus(403));
  await assert.rejects(()=>s.invitations.send(users.owner,"utfsm",first.id,randomUUID()),isStatus(403));
  await assert.rejects(()=>s.invitations.send(users.owner,"uc",first.id,randomUUID()),isStatus(503));
  const after=(await pool.query("SELECT token_hash,delivery_version,delivery_status FROM account_invitations WHERE id=$1",[first.id])).rows[0];
  assert.deepEqual(after,{token_hash:null,delivery_version:0,delivery_status:"pending"});
  assert.equal(s.mailer.messages.length,0);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE action='invitation.created'")).rows[0].count,2);
 }finally{if(s)await s.close();await pool.end();}
});

test("send replay, explicit reissue, one-use activation and no implicit roles or secret audit",async()=>{
 const pool=await database();let s;
 try {
  const f=await accountFixture(pool);s=await accountServices();const email=address();
  const invitation=await s.invitations.create(users.owner,"uc",{name:"Nueva persona",email},randomUUID()),key=randomUUID();
  const [one,two]=await Promise.all([s.invitations.send(users.owner,"uc",invitation.id,key),s.invitations.send(users.owner,"uc",invitation.id,key)]);
  assert.ok([one,two].every(r=>["sending","accepted"].includes(r.deliveryStatus)));assert.equal(s.mailer.messages.length,1);
  const original=inviteCode(s.mailer),row=(await pool.query("SELECT token_hash,expires_at,delivery_version FROM account_invitations WHERE id=$1",[invitation.id])).rows[0];
  assert.equal(row.token_hash,createHash("sha256").update(original).digest("hex"));assert.equal(row.delivery_version,1);
  assert.ok(new Date(row.expires_at).getTime()-Date.now()>23*60*60*1000);
  assert.ok(!JSON.stringify(one).includes(original));assert.ok(!JSON.stringify(one).includes(row.token_hash));
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM users WHERE email=$1",[email])).rows[0].count,0);
  assert.equal((await s.invitations.send(users.owner,"uc",invitation.id,key)).deliveryStatus,"accepted");assert.equal(s.mailer.messages.length,1);
  await assert.rejects(()=>s.invitations.send(users.owner,"uc",invitation.id,randomUUID(),true),isStatus(429));
  await pool.query("UPDATE account_invitations SET delivery_started_at=clock_timestamp()-interval '61 seconds' WHERE id=$1",[invitation.id]);
  await s.invitations.send(users.owner,"uc",invitation.id,randomUUID(),true);assert.equal(s.mailer.messages.length,2);
  const current=inviteCode(s.mailer);assert.notEqual(current,original);
  await assert.rejects(()=>s.invitations.activate(activation(original)),isStatus(400));
  const payload=activation(current),results=await Promise.allSettled([s.invitations.activate(payload),s.invitations.activate(payload)]);
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1,JSON.stringify(results.map(r=>r.status==="fulfilled"?{status:r.status}:{status:r.status,httpStatus:status(r.reason),code:r.reason?.code,constraint:r.reason?.constraint,name:r.reason?.name,message:r.reason?.code==="42501"?r.reason.message:undefined})));
  const account=(await pool.query("SELECT id,name,email FROM users WHERE email=$1",[email])).rows[0];assert.equal(account.name,"Nueva persona");
  const members=(await pool.query("SELECT institution_id,is_admin,is_super_admin,active FROM institution_memberships WHERE user_id=$1",[account.id])).rows;
  assert.deepEqual(members,[{institution_id:f.tenants.uc,is_admin:false,is_super_admin:false,active:true}]);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM enrollments WHERE user_id=$1",[account.id])).rows[0].count,0);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE action='invitation.accepted' AND resource_id=$1",[invitation.id])).rows[0].count,1);
  const audits=JSON.stringify((await pool.query("SELECT changes FROM audit_events WHERE resource_id=$1",[invitation.id])).rows);
  assert.ok(!audits.includes(original)&&!audits.includes(current)&&!audits.includes(email)&&!audits.includes(row.token_hash));
 }finally{if(s)await s.close();await pool.end();}
});

test("existing identity requires its login, keeps credentials and rejects revoked recipients or emitters",async()=>{
 const pool=await database();let s;
 try {
  const f=await accountFixture(pool);s=await accountServices();
  const prior=(await pool.query("SELECT name,password_hash,credential_version FROM users WHERE id=$1",[f.standalone.id])).rows[0];
  const invitation=await s.invitations.create(users.owner,"uc",{name:"No sobrescribir",email:f.standalone.email},randomUUID());
  await s.invitations.send(users.owner,"uc",invitation.id,randomUUID());const code=inviteCode(s.mailer);
  await assert.rejects(()=>s.invitations.activate(activation(code)),error=>status(error)===409&&error.getResponse().code==="INVITATION_LOGIN_REQUIRED");
  await assert.rejects(()=>s.invitations.accept(users.other,0,{token:code}),isStatus(400));
  await s.invitations.accept(f.standalone.id,0,{token:code});
  assert.deepEqual((await pool.query("SELECT name,password_hash,credential_version FROM users WHERE id=$1",[f.standalone.id])).rows[0],prior);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM users WHERE lower(btrim(email))=$1",[f.standalone.email])).rows[0].count,1);
  const next=await s.invitations.create(users.owner,"uc",{name:"Emisor revocado",email:address()},randomUUID());
  await s.invitations.send(users.owner,"uc",next.id,randomUUID());const denied=inviteCode(s.mailer);
  await pool.query("UPDATE institution_memberships SET is_admin=false,is_super_admin=false WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,users.owner]);
  await assert.rejects(()=>s.invitations.activate(activation(denied)),isStatus(400));
  assert.equal((await pool.query("SELECT status FROM account_invitations WHERE id=$1",[next.id])).rows[0].status,"pending");
  await pool.query("UPDATE institution_memberships SET is_admin=true WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,users.owner]);
  const other=await s.invitations.create(users.owner,"utfsm",{name:"Otra institución",email:address()},randomUUID()).catch(error=>{assert.equal(status(error),403);return null;});
  assert.equal(other,null);
  // A global account invited before a membership revocation must not restore that membership.
  const dormant={id:randomUUID(),email:address()};
  await pool.query("INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,'Revocada',password_hash FROM users WHERE id=$3",[dormant.id,dormant.email,f.standalone.id]);
  const revoked=await s.invitations.create(users.owner,"uc",{name:"Revocada",email:dormant.email},randomUUID());
  await s.invitations.send(users.owner,"uc",revoked.id,randomUUID());const revokedCode=inviteCode(s.mailer);
  await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id,active) VALUES($1,$2,$3,false)",[randomUUID(),f.tenants.uc,dormant.id]);
  await assert.rejects(()=>s.invitations.accept(dormant.id,0,{token:revokedCode}),isStatus(400));
  assert.equal((await pool.query("SELECT active FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,dormant.id])).rows[0].active,false);
 }finally{if(s)await s.close();await pool.end();}
});

test("CSV preview and confirmation preserve atomicity, same receipt and cross-tenant boundary",async()=>{
 const pool=await database();let s;
 try {
  const f=await accountFixture(pool);s=await accountServices();const imports=await importsFor(s),email=address(),key=randomUUID();
  const file=upload(`\uFEFFname,email\r\n"Apellido, Nombre",${email}\r\nYa pertenece,demo-uc@academix.example\r\nCuenta global,${f.standalone.email}\r\n`);
  const preview=await imports.preview(users.owner,"uc",file,key);assert.equal(preview.status,"previewed");assert.equal(preview.totalRows,3);
  assert.deepEqual(preview.rows.map(r=>r.validationCode),["valid","already_member","valid"]);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_invitations")).rows[0].count,0);
  assert.equal((await imports.preview(users.owner,"uc",file,key)).id,preview.id);
  await assert.rejects(()=>imports.preview(users.owner,"uc",upload(`name,email\nOtra,${email}`),key),isStatus(409));
  const [first,second]=await Promise.all([imports.confirm(users.owner,"uc",preview.id,{}),imports.confirm(users.owner,"uc",preview.id,{})]);
  assert.equal(first.createdCount,2);assert.equal(first.skippedCount,1);assert.deepEqual(first,second);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_invitations")).rows[0].count,2);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM users WHERE email=$1",[email])).rows[0].count,0);
  assert.equal(s.mailer.messages.length,0,"CSV confirm called provider inside transaction");
  for(const row of first.rows.filter(r=>r.invitationId)){
   assert.equal(row.deliveryStatus,"pending");assert.equal(row.invitationStatus,"pending");assert.equal(row.deliveryVersion,0);
  }
  await assert.rejects(()=>imports.get(users.owner,"utfsm",preview.id),isStatus(403));
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE action='import.confirmed' AND resource_id=$1",[preview.id])).rows[0].count,1);
  // A context with admin privileges in UTFSM still cannot read a UC import by ID.
  await pool.query("UPDATE institution_memberships SET is_admin=true WHERE institution_id=$1 AND user_id=$2",[f.tenants.utfsm,users.owner]);
  await assert.rejects(()=>imports.get(users.owner,"utfsm",preview.id),isStatus(404));
  const leaked=await s.runtime.withInstitution(users.owner,"utfsm",db=>db.query("SELECT * FROM user_import_rows WHERE import_id=$1",[preview.id]));assert.equal(leaked.rowCount,0);
 }finally{if(s)await s.close();await pool.end();}
});

test("CSV invalid rows, state races and failing audit never partially apply invitations",async()=>{
 const pool=await database();let s;
 try {
  await accountFixture(pool);s=await accountServices();const imports=await importsFor(s),same=address();
  const bad=await imports.preview(users.owner,"uc",upload(`name,email\nUna,${same}\nDos,${same.toUpperCase()}\nSin correo,no-correo\n`),randomUUID());
  assert.deepEqual(bad.rows.map(r=>r.validationCode),["duplicate","duplicate","invalid_email"]);
  await assert.rejects(()=>imports.confirm(users.owner,"uc",bad.id,{}),isStatus(409));
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_invitations")).rows[0].count,0);
  for(const file of [upload("name,email\n"),upload("name,email,role\nUno,a@example.test,admin"),{buffer:Buffer.from([0xff,0xfe])},upload("name,email\n\"sin cierre,a@example.test")])
   await assert.rejects(()=>imports.preview(users.owner,"uc",file,randomUUID()),isStatus(400));
  const existing=address(),untouched=address(),race=await imports.preview(users.owner,"uc",upload(`name,email\nUna,${existing}\nDos,${untouched}\n`),randomUUID());
  await s.invitations.create(users.owner,"uc",{name:"Creada por otro flujo",email:existing},randomUUID());
  await assert.rejects(()=>imports.confirm(users.owner,"uc",race.id,{}),isStatus(409));
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_invitations WHERE normalized_email=$1",[untouched])).rows[0].count,0);
  const rollbackEmail=address(),rollback=await imports.preview(users.owner,"uc",upload(`name,email\nFalla atómica,${rollbackEmail}\n`),randomUUID());
  await failAudit(pool,"import.confirmed");await assert.rejects(()=>imports.confirm(users.owner,"uc",rollback.id,{}));await restoreAudit(pool);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_invitations WHERE normalized_email=$1",[rollbackEmail])).rows[0].count,0);
  assert.equal((await imports.get(users.owner,"uc",rollback.id)).status,"previewed");
  assert.equal((await imports.confirm(users.owner,"uc",rollback.id,{})).createdCount,1);
 }finally{if(s)await s.close();await pool.end();}
});

test("CSV upper bound creates 100 pending invitations without per-row provider work",async()=>{
 const pool=await database();let s;
 try {
  await accountFixture(pool);s=await accountServices();const imports=await importsFor(s);
  const rows=Array.from({length:100},(_,i)=>`Persona ${i},batch-${randomUUID()}@example.test`);
  const preview=await imports.preview(users.owner,"uc",upload("name,email\n"+rows.join("\n")),randomUUID());
  assert.equal(preview.totalRows,100);const confirmed=await imports.confirm(users.owner,"uc",preview.id,{});
  assert.equal(confirmed.createdCount,100);assert.equal(confirmed.rows.length,100);assert.equal(s.mailer.messages.length,0);
  await assert.rejects(()=>imports.preview(users.owner,"uc",upload("name,email\n"+[...rows,`Extra,${address()}`].join("\n")),randomUUID()),isStatus(400));
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM account_invitations")).rows[0].count,100);
 }finally{if(s)await s.close();await pool.end();}
});

test("HTTP unconfigured email reports safe503 and retains a usable pending invitation",async()=>{
 const pool=await database();let app;
 try {
  const fixture=await accountFixture(pool);app=await http({MAIL_DELIVERY_MODE:"disabled",AVATAR_STORAGE_DRIVER:"disabled"});const token=await login(app,fixture.env);
  const create=await accountRequest(app,token,"/institution/uc/invitations","POST",{name:"Pendiente",email:address()},{"Idempotency-Key":randomUUID()});assert.equal(create.status,201);
  const invitation=await create.json();const response=await accountRequest(app,token,`/institution/uc/invitations/${invitation.id}/send`,"POST",{},{"Idempotency-Key":randomUUID()});
  assert.equal(response.status,503);assert.equal((await response.json()).code,"INTEGRATION_NOT_CONFIGURED");
  const stored=(await pool.query("SELECT token_hash,delivery_version,status FROM account_invitations WHERE id=$1",[invitation.id])).rows[0];
  assert.deepEqual(stored,{token_hash:null,delivery_version:0,status:"pending"});assert.equal((await fetch(app.base+"/ready")).status,200);
 }finally{if(app)await app.close();await pool.end();}
});

test("provider quota, lost persistence and revocation preserve truthful delivery state without replay sends",async()=>{
 const pool=await database();let s;
 try {
  await accountFixture(pool);s=await accountServices();const {MailDeliveryError}=await import("../../dist/accounts/providers/mailer.js");
  const quota=await s.invitations.create(users.owner,"uc",{name:"Cuota",email:address()},randomUUID());
  s.integrations.mailer={available:true,async send(message,key){await s.mailer.send(message,key);throw new MailDeliveryError("quota_blocked","MAIL_QUOTA_EXCEEDED");}};
  const stopped=await s.invitations.send(users.owner,"uc",quota.id,randomUUID());assert.equal(stopped.status,"pending");assert.equal(stopped.deliveryStatus,"quota_blocked");
  const oldCode=inviteCode(s.mailer);
  await pool.query("UPDATE account_invitations SET delivery_started_at=clock_timestamp()-interval '61 seconds' WHERE id=$1",[quota.id]);
  s.integrations.mailer=s.mailer;const continued=await s.invitations.send(users.owner,"uc",quota.id,randomUUID(),true);assert.equal(continued.deliveryStatus,"accepted");
  await assert.rejects(()=>s.invitations.activate(activation(oldCode)),isStatus(400));
  const uncertain=await s.invitations.create(users.owner,"uc",{name:"Respuesta incierta",email:address()},randomUUID()),key=randomUUID();
  await failAudit(pool,"invitation.delivery");await assert.rejects(()=>s.invitations.send(users.owner,"uc",uncertain.id,key));await restoreAudit(pool);
  const sent=s.mailer.messages.length;
  assert.equal((await pool.query("SELECT delivery_status FROM account_invitations WHERE id=$1",[uncertain.id])).rows[0].delivery_status,"sending");
  await pool.query("UPDATE account_invitations SET delivery_started_at=clock_timestamp()-interval '31 seconds' WHERE id=$1",[uncertain.id]);
  const listing=await s.invitations.list(users.owner,"uc",{});assert.equal(listing.items.find(row=>row.id===uncertain.id).deliveryStatus,"unknown");
  assert.equal((await s.invitations.send(users.owner,"uc",uncertain.id,key)).deliveryStatus,"unknown");assert.equal(s.mailer.messages.length,sent);
  const revoked=await s.invitations.create(users.owner,"uc",{name:"Revocación concurrente",email:address()},randomUUID());
  s.integrations.mailer={available:true,async send(message,key){const result=await s.mailer.send(message,key);await s.invitations.revoke(users.owner,"uc",revoked.id,{});return result;}};
  const result=await s.invitations.send(users.owner,"uc",revoked.id,randomUUID());assert.equal(result.status,"revoked");assert.notEqual(result.deliveryStatus,"accepted");
  await assert.rejects(()=>s.invitations.activate(activation(inviteCode(s.mailer))),isStatus(400));
 }finally{if(s)await s.close();await pool.end();}
});

test("operator dry-run and 7/30-day cleanup preserve receipts, active requests and accepted accounts",async()=>{
 const pool=await database();let s;
 try {
  const f=await accountFixture(pool);s=await accountServices();const imports=await importsFor(s);
  const never=await s.invitations.create(users.owner,"uc",{name:"Nunca enviada",email:address()},randomUUID());
  await pool.query("UPDATE account_invitations SET created_at=clock_timestamp()-interval '31 days' WHERE id=$1",[never.id]);
  const expired=await s.invitations.create(users.owner,"uc",{name:"Vencida",email:address()},randomUUID());
  await s.invitations.send(users.owner,"uc",expired.id,randomUUID());
  await pool.query("UPDATE account_invitations SET expires_at=clock_timestamp()-interval '31 days' WHERE id=$1",[expired.id]);
  const accepted=await s.invitations.create(users.owner,"uc",{name:"Cuenta que permanece",email:f.standalone.email},randomUUID());
  await s.invitations.send(users.owner,"uc",accepted.id,randomUUID());await s.invitations.accept(f.standalone.id,0,{token:inviteCode(s.mailer)});
  await pool.query("UPDATE account_invitations SET accepted_at=clock_timestamp()-interval '31 days',closed_at=clock_timestamp()-interval '31 days' WHERE id=$1",[accepted.id]);
  const confirmed=await imports.preview(users.owner,"uc",upload(`name,email\nDatos temporales,${address()}\n`),randomUUID());
  await imports.confirm(users.owner,"uc",confirmed.id,{});
  await pool.query("UPDATE user_imports SET confirmed_at=clock_timestamp()-interval '8 days' WHERE id=$1",[confirmed.id]);
  const oldPreview=await imports.preview(users.owner,"uc",upload(`name,email\nPreview vencida,${address()}\n`),randomUUID());
  await pool.query("UPDATE user_imports SET expires_at=clock_timestamp()-interval '8 days' WHERE id=$1",[oldPreview.id]);
  const active=await imports.preview(users.owner,"uc",upload(`name,email\nConservar,${address()}\n`),randomUUID());
  const {cleanupAccounts}=await import("../../dist/commands/account-cleanup.js");
  const {testUrl,runtimeUrl}=await import("./helpers.mjs");
  const env={...process.env,MIGRATION_DATABASE_URL:testUrl(),DATABASE_URL:runtimeUrl(),NODE_ENV:"test",AVATAR_STORAGE_DRIVER:"disabled",MAIL_DELIVERY_MODE:"disabled"};
  const before=(await pool.query("SELECT count(*)::int AS count FROM users")).rows[0].count;
  const preview=await cleanupAccounts(env,{apply:false,batch:100,now:new Date(),operatorRef:"integration-account-maintenance"});assert.equal(typeof preview,"object");
  assert.equal((await pool.query("SELECT pii_purged_at FROM user_imports WHERE id=$1",[confirmed.id])).rows[0].pii_purged_at,null);
  assert.equal((await pool.query("SELECT status FROM account_invitations WHERE id=$1",[never.id])).rows[0].status,"pending");
  await cleanupAccounts(env,{apply:true,batch:100,now:new Date(),operatorRef:"integration-account-maintenance"});
  const rows=(await pool.query("SELECT * FROM account_invitations WHERE id=ANY($1::uuid[])",[[never.id,expired.id,accepted.id]])).rows;
  assert.equal(rows.length,3);
  for(const row of rows){
   assert.ok(row.pii_purged_at);assert.notEqual(row.status,"pending");
   for(const field of ["normalized_email","invited_name","token_hash","input_fingerprint"])assert.equal(row[field],null);
  }
  assert.equal(rows.find(row=>row.id===never.id).status,"revoked");
  assert.equal(rows.find(row=>row.id===accepted.id).accepted_user_id,f.standalone.id);
  for(const id of [confirmed.id,oldPreview.id]){
   const receipt=await imports.get(users.owner,"uc",id);assert.equal(receipt.id,id);assert.ok(receipt.totalRows>0);
   assert.ok(receipt.rows.every(row=>row.name===null&&row.email===null));
   await assert.rejects(()=>imports.confirm(users.owner,"uc",id,{}),isStatus(410));
  }
  assert.equal((await imports.get(users.owner,"uc",active.id)).rows[0].name,"Conservar");
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM users")).rows[0].count,before);
  assert.equal((await pool.query("SELECT active FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,f.standalone.id])).rows[0].active,true);
  const stable=JSON.stringify((await pool.query("SELECT id,name,normalized_email,outcome,invitation_id FROM user_import_rows ORDER BY id")).rows);
  await cleanupAccounts(env,{apply:true,batch:100,now:new Date(),operatorRef:"integration-account-maintenance"});
  assert.equal(JSON.stringify((await pool.query("SELECT id,name,normalized_email,outcome,invitation_id FROM user_import_rows ORDER BY id")).rows),stable);
 }finally{if(s)await s.close();await pool.end();}
});
