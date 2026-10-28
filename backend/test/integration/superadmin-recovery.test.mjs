import assert from "node:assert/strict";
import {test} from "node:test";
import {database,cli,http,login,sanitized} from "./helpers.mjs";
import {membersFixture,coursesFixture,users,failAudit,request} from "./course-fixtures.mjs";
export const recoveryEnv=(user,enabled,operation,replacement)=>({SUPERADMIN_INSTITUTION_SLUG:"uc",SUPERADMIN_USER_ID:user,SUPERADMIN_ENABLED:String(enabled),SUPERADMIN_OPERATION_ID:operation,SUPERADMIN_OPERATOR_REF:"PM-recovery",SUPERADMIN_REPLACEMENT_USER_ID:replacement});
test("US3 superadmin recovery, last replacement, replay, isolation and rollback",async()=>{
 const pool=await database();let app;try{
  const f=await membersFixture(pool);assert.equal((await pool.query("SELECT * FROM courses")).rowCount,0);
  const run=async env=>{const result=await cli("data-migrations/set-superadmin",env).result;sanitized(result.output);return result;};
  const admins=()=>pool.query("SELECT id,is_admin FROM institution_memberships ORDER BY id").then(r=>r.rows);
  const initialAdmins=await admins(),enrollments=(await pool.query("SELECT * FROM enrollments")).rows;
  const noChange=await run(recoveryEnv(users.owner,true,"no-change"));
  assert.equal(noChange.code,0);assert.equal(JSON.parse(noChange.output).changed,0);
  assert.equal((await pool.query("SELECT * FROM audit_events")).rowCount,0);
  assert.equal((await run(recoveryEnv(users.owner,false,"last"))).code,1);
  for(const target of [users.owner,users.foreign,users.inactive])assert.equal((await run(recoveryEnv(users.owner,false,"bad",target))).code,1);
  const op=recoveryEnv(users.owner,false,"replace",users.other);assert.equal((await run(op)).code,0);
  app=await http();const owner=await login(app,f.env),other=await login(app,f.env,"UC");
  assert.equal((await request(app,owner,"uc/memberships")).status,403);assert.equal((await request(app,other,"uc/memberships")).status,200);
  assert.deepEqual(await admins(),initialAdmins);
  const target=(await pool.query("SELECT id FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,users.owner])).rows[0].id;
  const path=`uc/memberships/${target}/course-admin`;
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:false})).status,403);
  assert.equal((await request(app,other,path,"PUT",{isAdmin:false})).status,200);
  assert.equal((await request(app,other,path,"PUT",{isAdmin:true})).status,200);
  assert.deepEqual(await admins(),initialAdmins);
  await pool.query("UPDATE institution_memberships SET is_super_admin=false");
  assert.equal(JSON.parse((await run(op)).output).outcome,"alreadyApplied");
  assert.equal((await pool.query("SELECT * FROM institution_memberships WHERE is_super_admin")).rowCount,0);
  assert.equal((await run({...op,SUPERADMIN_ENABLED:"true"})).code,1);
  assert.equal((await run(recoveryEnv(users.owner,true,"recover"))).code,0);
  assert.equal((await run(recoveryEnv(users.other,true,"grant-second"))).code,0);
  const races=await Promise.all([run(recoveryEnv(users.owner,false,"race-a")),run(recoveryEnv(users.other,false,"race-b"))]);assert.deepEqual(races.map(r=>r.code).sort(),[0,1]);
  assert.equal((await pool.query("SELECT * FROM institution_memberships WHERE is_super_admin")).rowCount,1);
  const last=(await pool.query("SELECT user_id FROM institution_memberships WHERE is_super_admin")).rows[0].user_id;
  const replacement=last===users.owner?users.other:users.owner;
  const lastMembership=(await pool.query("SELECT id FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,last])).rows[0].id;
  await failAudit(pool,"*",lastMembership);assert.equal((await run(recoveryEnv(last,false,"failure",replacement))).code,1);
  assert.deepEqual((await pool.query("SELECT user_id FROM institution_memberships WHERE is_super_admin")).rows,[{user_id:last}]);
  assert.equal((await pool.query("SELECT * FROM institution_memberships WHERE institution_id=$1 AND is_super_admin",[f.tenants.utfsm])).rowCount,0);
  assert.deepEqual(await admins(),initialAdmins);assert.deepEqual((await pool.query("SELECT * FROM enrollments")).rows,enrollments);
 }finally{if(app)await app.close();await pool.end();}
});
test("superadmin replacement preserves existing ownership, enrollments and admin flags",async()=>{
 const pool=await database();
 try{
  await coursesFixture(pool);
  const state=async()=>{
   const rows=[];
   for(const sql of ["SELECT * FROM courses ORDER BY id","SELECT * FROM enrollments ORDER BY id","SELECT id,is_admin FROM institution_memberships ORDER BY id"])rows.push((await pool.query(sql)).rows);
   return rows;
  };
  const before=await state();
  const result=await cli("data-migrations/set-superadmin",recoveryEnv(users.owner,false,"preserve-academic",users.other)).result;
  assert.equal(result.code,0);sanitized(result.output);assert.equal(JSON.parse(result.output).changed,2);
  assert.deepEqual(await state(),before);
  const events=(await pool.query("SELECT * FROM audit_events ORDER BY resource_id")).rows;assert.equal(events.length,2);
  for(const event of events){
   assert.equal(event.actor_user_id,null);assert.equal(event.course_id,null);assert.equal(event.section_id,null);
   assert.equal(event.action,"membership.superAdminChanged");assert.equal(event.changes.before.isAdmin,event.changes.after.isAdmin);
   assert.equal(event.changes.after.source,"operatorMigration");assert.equal(event.changes.after.operationId,"preserve-academic");
   assert.match(event.changes.after.inputFingerprint,/^[0-9a-f]{64}$/);
  }
 }finally{await pool.end();}
});
