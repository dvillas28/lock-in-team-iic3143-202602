import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import {test} from "node:test";
import {database,migrated,cli,sanitized} from "./helpers.mjs";
import {failAudit} from "./course-fixtures.mjs";
export function onboardingEnv() {return {ONBOARD_INSTITUTION_SLUG:"new-campus",ONBOARD_INSTITUTION_NAME:"Campus",ONBOARD_USER_ID:randomUUID(),ONBOARD_USER_EMAIL:"initial@example.test",ONBOARD_USER_NAME:"Initial",ONBOARD_OPERATION_ID:"bootstrap-v1",ONBOARD_OPERATOR_REF:"PM-ticket-1",ONBOARD_INITIAL_PASSWORD:randomBytes(12).toString("hex")};}
test("US3 onboarding new/reused identity, replay, collision, concurrency and atomic failure",async()=>{
 const pool=await database();try {
  await migrated(pool);const env=onboardingEnv();
  const invalidConfig=await cli("data-migrations/onboard-institution",{...env,MIGRATION_DATABASE_URL:""}).result;
  assert.equal(invalidConfig.code,1);assert.deepEqual(JSON.parse(invalidConfig.output),{operation:"onboard-institution",outcome:"error",category:"config"});
  const results=await Promise.all([cli("data-migrations/onboard-institution",env).result,cli("data-migrations/onboard-institution",env).result]);
  assert.deepEqual(results.map(r=>r.code),[0,0]);assert.ok(results.some(r=>JSON.parse(r.output).outcome==="alreadyApplied"));
  for(const r of results)sanitized(r.output,[env.ONBOARD_INITIAL_PASSWORD,env.ONBOARD_USER_EMAIL]);
  const user=(await pool.query("SELECT * FROM users")).rows[0];const member=(await pool.query("SELECT * FROM institution_memberships")).rows[0];
  assert.equal(member.is_admin,true);assert.equal(member.is_super_admin,true);
  await pool.query("UPDATE institution_memberships SET is_admin=false,is_super_admin=false");
  const revoked=(await pool.query("SELECT * FROM institution_memberships")).rows;
  assert.equal(JSON.parse((await cli("data-migrations/onboard-institution",{...env,ONBOARD_INITIAL_PASSWORD:"different-secret"}).result).output).outcome,"alreadyApplied");
  assert.deepEqual((await pool.query("SELECT * FROM institution_memberships")).rows,revoked);
  assert.deepEqual((await pool.query("SELECT * FROM users")).rows[0],user);
  assert.equal((await cli("data-migrations/onboard-institution",{...env,ONBOARD_INSTITUTION_NAME:"changed"}).result).code,1);
  assert.equal((await cli("data-migrations/onboard-institution",{...env,ONBOARD_INSTITUTION_SLUG:"changed-slug"}).result).code,1);
  assert.equal((await cli("data-migrations/onboard-institution",{...env,ONBOARD_INSTITUTION_SLUG:"second",ONBOARD_OPERATION_ID:"second",ONBOARD_INITIAL_PASSWORD:undefined}).result).code,0);
  assert.equal((await pool.query("SELECT * FROM users")).rowCount,1);
  assert.deepEqual((await pool.query("SELECT * FROM users")).rows[0],user);
  assert.equal((await cli("data-migrations/onboard-institution",{...env,ONBOARD_INSTITUTION_SLUG:"collision",ONBOARD_OPERATION_ID:"collision",ONBOARD_USER_ID:randomUUID()}).result).code,1);
  const events=(await pool.query("SELECT * FROM audit_events")).rows;assert.equal(events.length,2);assert.equal(events[0].actor_user_id,null);assert.ok(events.every(e=>e.changes.after.inputFingerprint.length===64));
  assert.ok(!JSON.stringify(events).includes(user.password_hash));assert.ok(!JSON.stringify(events).includes(env.ONBOARD_INITIAL_PASSWORD));
  await pool.query("INSERT INTO institutions(id,slug,name) VALUES($1,'preexisting','Existing')",[randomUUID()]);
  assert.equal((await cli("data-migrations/onboard-institution",{...env,ONBOARD_OPERATION_ID:"preexisting",ONBOARD_INSTITUTION_SLUG:"preexisting"}).result).code,1);
  await migrated(pool);await failAudit(pool);
  assert.equal((await cli("data-migrations/onboard-institution",env).result).code,1);
  for(const table of ["institutions","users","institution_memberships","audit_events"])assert.equal((await pool.query(`SELECT * FROM ${table}`)).rowCount,0);
 }finally{await pool.end();}
});
