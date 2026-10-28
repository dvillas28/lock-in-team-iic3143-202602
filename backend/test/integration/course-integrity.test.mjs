import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {database,cli} from "./helpers.mjs";
import {coursesFixture,users} from "./course-fixtures.mjs";
test("foundation: defaults, cross-tenant FKs, history, actor evidence, uniqueness and repeat",async()=>{
 const pool=await database();try {
  const f=await coursesFixture(pool);
  assert.deepEqual((await pool.query("SELECT is_admin,is_super_admin FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.utfsm,users.owner])).rows,[{is_admin:false,is_super_admin:false}]);
  for(const [sql,args] of [
   ["UPDATE courses SET created_by=$1 WHERE id=$2",[users.other,f.own]],
   ["UPDATE sections SET course_id=$1 WHERE id=$2",[f.other,f.s1]],
   ["UPDATE enrollments SET role=\u0027assistant\u0027 WHERE id=$1",[f.teacher]],
   ["DELETE FROM enrollments WHERE id=$1",[f.teacher]],
   ["INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,\u0027x\u0027)",[randomUUID(),f.tenants.utfsm,f.own]],
   ["INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,\u0027student\u0027)",[randomUUID(),f.tenants.uc,f.s1,users.foreign]],
   ["INSERT INTO sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,\u0027x\u0027,-1)",[randomUUID(),f.tenants.uc,f.own]],
  ]) await assert.rejects(pool.query(sql,args));
  for(const after of [{},{source:null,operationId:null,operatorRef:null},{source:"operatorMigration",operationId:"op",operatorRef:null}])
   await assert.rejects(pool.query("INSERT INTO audit_events(id,institution_id,action,resource_type,resource_id,changes) VALUES($1,$2,\u0027membership.onboarded\u0027,\u0027institutionMembership\u0027,$3,$4)",[randomUUID(),f.tenants.uc,(await pool.query("SELECT id FROM institution_memberships WHERE institution_id=$1 LIMIT 1",[f.tenants.uc])).rows[0].id,{after}]));
  const results=await Promise.allSettled([f.add(f.s2,users.owner,"teacher"),f.add(f.s2,users.owner,"teacher")]);assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
  const before=(await pool.query("SELECT * FROM courses ORDER BY id")).rows;assert.equal((await cli("commands/migrate").result).code,0);assert.deepEqual((await pool.query("SELECT * FROM courses ORDER BY id")).rows,before);
 }finally{await pool.end();}
});

test("populated identity schema upgrades without changing identities or memberships",async()=>{
 const {mkdtemp,copyFile,rm}=await import("node:fs/promises");
 const {tmpdir}=await import("node:os");const {join}=await import("node:path");
 const {reset,testUrl,secrets,snapshot}=await import("./helpers.mjs");
 const migration=await import("../../dist/commands/migrate.js");
 const pool=await database(),dir=await mkdtemp(join(tmpdir(),"academic-upgrade-"));const saved=process.env.MIGRATION_DATABASE_URL;
 try{
  await reset(pool);process.env.MIGRATION_DATABASE_URL=testUrl();
  for(const file of ["20261015000100_institutional-foundation.sql","20261015000400_unique_login_email.sql"])await copyFile(new URL("../../migrations/"+file,import.meta.url),join(dir,file));
  await migration.default.migrate(dir);assert.equal((await cli("seeds/demo",secrets()).result).code,0);
  const before=await snapshot(pool);assert.equal((await cli("commands/migrate").result).code,0);
  const after=await snapshot(pool);assert.deepEqual(after.slice(0,2),before.slice(0,2));
  assert.deepEqual(after[2].map(({is_admin,is_super_admin,...m})=>{assert.equal(is_admin,false);assert.equal(is_super_admin,false);return m;}),before[2]);
 }finally{if(saved===undefined)delete process.env.MIGRATION_DATABASE_URL;else process.env.MIGRATION_DATABASE_URL=saved;await rm(dir,{recursive:true,force:true});await pool.end();}
});

async function waitForLock(pool,pattern,count=1) {
 const {setTimeout:delay}=await import("node:timers/promises");
 for(let i=0;i<200;i++){
  if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE $1",[pattern])).rowCount>=count)return;
  await delay(10);
 }
 assert.fail("Expected PostgreSQL lock wait was not observed");
}
test("concurrent section patches preserve both fields and the committed audit before",async()=>{
 const {http,login}=await import("./helpers.mjs");const {request}=await import("./course-fixtures.mjs");
 const pool=await database();let app;const blocker=await pool.connect();
 try{
  const f=await coursesFixture(pool);app=await http();const token=await login(app,f.env);
  await blocker.query("BEGIN");await blocker.query("SELECT id FROM courses WHERE id=$1 FOR UPDATE",[f.own]);
  const path=`uc/sections/${f.s1}`;
  const rename=request(app,token,path,"PATCH",{code:"RENAMED"});
  await waitForLock(pool,"SELECT * FROM public.courses%");
  const resize=request(app,token,path,"PATCH",{capacity:42});
  await waitForLock(pool,"SELECT * FROM public.courses%",2);
  await blocker.query("COMMIT");
  const results=await Promise.all([rename,resize]);assert.deepEqual(results.map(r=>r.status),[200,200]);
  assert.deepEqual((await pool.query("SELECT code,capacity FROM sections WHERE id=$1",[f.s1])).rows,[{code:"RENAMED",capacity:42}]);
  const events=(await pool.query("SELECT changes FROM audit_events WHERE resource_id=$1 ORDER BY occurred_at,id",[f.s1])).rows;
  assert.deepEqual(events.map(e=>e.changes),[
   {before:{code:"1",capacity:null},after:{code:"RENAMED",capacity:null}},
   {before:{code:"RENAMED",capacity:null},after:{code:"RENAMED",capacity:42}},
  ]);
 }finally{await blocker.query("ROLLBACK");blocker.release();if(app)await app.close();await pool.end();}
});
test("real committed revocation blocks then denies admin/superadmin/membership/User/Institution/teacher writes",async()=>{
 const {http,login}=await import("./helpers.mjs");const {request}=await import("./course-fixtures.mjs");
 const pool=await database();
 try{
  for(const kind of ["admin","superadmin","membership","user","institution","teacher"]){
   const f=await coursesFixture(pool);const app=await http(),token=await login(app,f.env);const blocker=await pool.connect();
   try{
    const member=(await pool.query("SELECT id FROM institution_memberships WHERE user_id=$1 AND institution_id=$2",[users.other,f.tenants.uc])).rows[0].id;
    const operations={
     admin:["UPDATE institution_memberships SET is_admin=false WHERE user_id=$1",[users.owner],`uc/courses/${f.own}`,"PATCH",{name:"blocked"},403],
     superadmin:["UPDATE institution_memberships SET is_super_admin=false WHERE user_id=$1",[users.owner],`uc/memberships/${member}/course-admin`,"PUT",{isAdmin:false},403],
     membership:["UPDATE institution_memberships SET active=false WHERE user_id=$1",[users.owner],`uc/courses/${f.own}`,"PATCH",{name:"blocked"},404],
     user:["UPDATE users SET active=false WHERE id=$1",[users.owner],`uc/courses/${f.own}`,"PATCH",{name:"blocked"},401],
     institution:["UPDATE institutions SET active=false WHERE id=$1",[f.tenants.uc],`uc/courses/${f.own}`,"PATCH",{name:"blocked"},404],
     teacher:["UPDATE enrollments SET active=false WHERE section_id=$1 AND user_id=$2 AND role='teacher'",[f.s3,users.owner],`uc/sections/${f.s3}/enrollments`,"POST",{userId:users.other,role:"student"},404],
    };
    const [sql,args,path,method,body,status]=operations[kind];
    await blocker.query("BEGIN");await blocker.query(sql,args);
    const pending=request(app,token,path,method,body);
    if(kind==="teacher")await waitForLock(pool,"%public.enrollments%");
    else await waitForLock(pool,kind==="user"?"%public.users%":kind==="institution"?"%public.institutions%":"%public.institution_memberships%");
    await blocker.query("COMMIT");assert.equal((await pending).status,status,kind);
    assert.equal((await request(app,token,path,method,body)).status,status,kind+" after COMMIT");
    assert.equal((await pool.query("SELECT * FROM audit_events")).rowCount,0);
   }finally{await blocker.query("ROLLBACK");blocker.release();await app.close();}
  }
 }finally{await pool.end();}
});
test("in-flight authorized write finishes before a waiting revocation; next request fails",async()=>{
 const {http,login}=await import("./helpers.mjs");const {request}=await import("./course-fixtures.mjs");
 const pool=await database();let app;const blocker=await pool.connect();
 try{
  const f=await coursesFixture(pool);app=await http();const token=await login(app,f.env);
  await blocker.query("BEGIN");await blocker.query("SELECT id FROM courses WHERE id=$1 FOR UPDATE",[f.own]);
  const pending=request(app,token,`uc/courses/${f.own}`,"PATCH",{name:"committed-before-revocation"});
  await waitForLock(pool,"%public.courses%");
  const revoke=pool.query("UPDATE institution_memberships SET is_admin=false WHERE user_id=$1",[users.owner]);
  await waitForLock(pool,"UPDATE institution_memberships%");
  await blocker.query("COMMIT");assert.equal((await pending).status,200);await revoke;
  assert.equal((await request(app,token,`uc/courses/${f.own}`,"PATCH",{name:"denied"})).status,403);
  assert.equal((await pool.query("SELECT * FROM audit_events")).rowCount,1);
 }finally{await blocker.query("ROLLBACK");blocker.release();if(app)await app.close();await pool.end();}
});
