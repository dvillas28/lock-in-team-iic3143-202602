import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import pg from "pg";
import {database,runtimeUrl,http,login,authorized,testUrl} from "./helpers.mjs";
import {coursesFixture,users} from "./course-fixtures.mjs";
import {DatabaseService} from "../../dist/database/database.service.js";
import {tenantTables} from "../../dist/database/runtime-check.js";
function service(){const old=process.env.DATABASE_URL;process.env.DATABASE_URL=runtimeUrl();try{return new DatabaseService();}finally{if(old===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=old;}}
test("real runtime fails closed across 12 tables, unfiltered queries, writes and operational events",async()=>{
 const admin=await database(),runtime=new pg.Pool({connectionString:runtimeUrl(),max:1});let db;
 try {
  const f=await coursesFixture(admin);db=service();await db.check();
  for(const table of tenantTables)assert.equal((await runtime.query(`SELECT * FROM public.${table}`)).rowCount,0,table);
  await db.withIdentity(users.owner,async c=>{
   const rows=(await c.query("SELECT * FROM institution_memberships")).rows;assert.equal(rows.length,2);assert.ok(rows.every(r=>r.user_id===users.owner));
   assert.equal((await c.query("SELECT * FROM courses")).rowCount,0);
  });
  await db.withInstitution(users.owner,"uc",async c=>{
   const rows=(await c.query("SELECT * FROM courses")).rows;assert.equal(rows.length,2);assert.ok(rows.every(r=>r.institution_id===f.tenants.uc));
   assert.ok((await c.query("SELECT * FROM institution_memberships")).rows.every(r=>r.institution_id===f.tenants.uc));
   assert.equal((await c.query("UPDATE courses SET name='denied' WHERE id=$1",[f.foreign])).rowCount,0);
  });
  await assert.rejects(db.withInstitution(users.owner,"uc",c=>c.query("DELETE FROM courses WHERE id=$1",[f.foreign])));
  await assert.rejects(db.withInstitution(users.owner,"uc",c=>c.query("INSERT INTO courses(id,institution_id,created_by,code,name,term) VALUES($1,$2,$3,'X','X','X')",[randomUUID(),f.tenants.utfsm,users.foreign])));
  await assert.rejects(db.withInstitution(users.owner,"uc",c=>c.query("UPDATE courses SET institution_id=$1 WHERE id=$2",[f.tenants.utfsm,f.own])));
  for(const actor of [null,users.owner])for(const action of ["membership.onboarded","membership.superAdminChanged","membership.demoProvisioned"])await assert.rejects(db.withInstitution(users.owner,"uc",(c,m)=>c.query(`INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,changes)
   VALUES($1,$2,$3,$4,'institutionMembership',$5,$6)`,[randomUUID(),m.institution_id,actor,action,m.id,{before:null,after:{source:"operatorMigration",operationId:"fake",operatorRef:"fake"}}])));
  for(const sql of ["UPDATE users SET name='changed'","UPDATE institutions SET name='changed'","UPDATE institution_memberships SET is_super_admin=true","SELECT * FROM demo_data_runs","TRUNCATE courses","CREATE TABLE public.bypass(id int)","SET ROLE postgres"])await assert.rejects(runtime.query(sql));
  await assert.rejects(runtime.query("UPDATE users SET id=$1 WHERE id=$2",[randomUUID(),users.owner]));
 }finally{await db?.onApplicationShutdown();await runtime.end();await admin.end();}
});
test("100 concurrent alternating contexts and 20 error reuses never leak; representative EXPLAIN",async()=>{
 const admin=await database();let db;
 try {
  const f=await coursesFixture(admin);db=service();
  await Promise.all(Array.from({length:100},(_,i)=>db.withInstitution(users.owner,i%2?"uc":"utfsm",async(c,m)=>{
   const rows=(await c.query("SELECT * FROM courses")).rows;assert.ok(rows.length);assert.ok(rows.every(r=>r.institution_id===m.institution_id));
  })));
  for(let i=0;i<20;i++) {
   await assert.rejects(db.withInstitution(users.owner,"uc",c=>c.query("SELECT 1/0")));
   await db.withIdentity(null,async c=>{for(const table of tenantTables)assert.equal((await c.query(`SELECT * FROM ${table}`)).rowCount,0);});
   await db.withInstitution(users.owner,"utfsm",async c=>assert.deepEqual((await c.query("SELECT id FROM courses")).rows.map(r=>r.id),[f.foreign]));
  }
  for(const sql of ["SELECT * FROM courses WHERE institution_id=$1","SELECT * FROM enrollments WHERE institution_id=$1 AND user_id=$2","SELECT * FROM grades WHERE institution_id=$1 AND student_id=$2"]) {
   const args=sql.includes('$2')?[f.tenants.uc,users.owner]:[f.tenants.uc];
   const before=(await admin.query('EXPLAIN (FORMAT JSON) '+sql,args)).rows[0]['QUERY PLAN'][0].Plan;
   await db.withInstitution(users.owner,"uc",async c=>{
    const after=(await c.query('EXPLAIN (ANALYZE, FORMAT JSON) '+sql,args)).rows[0]['QUERY PLAN'][0].Plan;
    assert.ok(before['Total Cost']>=0 && after['Actual Loops']>0);
    console.log(`EXPLAIN ${sql.split('FROM ')[1].split(' ')[0]} owner=${before['Node Type']} runtime=${after['Node Type']}`);
   });
  }
 }finally{await db?.onApplicationShutdown();await admin.end();}
});
test("routing rejects old and contextless paths; spoofing headers does not change tenant",async()=>{
 const admin=await database();let app;try{
  const f=await coursesFixture(admin);app=await http();const token=await login(app,f.env,"UC");
  for(const path of ['/api/v1/institutions/uc/courses','/api/v1/courses','/api/v1/institution/courses'])assert.equal((await fetch(app.base+path,authorized(token))).status,404);
  const headers={...authorized(token).headers,Host:'utfsm.academix.dvillasc.me',Origin:'https://utfsm.academix.dvillasc.me','X-Forwarded-Host':'utfsm.academix.dvillasc.me','X-Institution-Id':f.tenants.utfsm};
  assert.equal((await fetch(app.base+'/api/v1/institution/uc/me?institutionSlug=utfsm',{headers})).status,200);
  assert.equal((await fetch(app.base+'/api/v1/institution/utfsm/me?institutionSlug=uc',{headers})).status,404);
  assert.equal((await fetch(app.base+'/api/v1/institution/BAD/me',authorized(token))).status,400);
  assert.equal((await fetch(app.base+'/api/v1/institution/uc/me')).status,401);
  assert.equal((await fetch(app.base+'/ready')).status,200);
  assert.notEqual(runtimeUrl(),testUrl());
 }finally{await app?.close();await admin.end();}
});
