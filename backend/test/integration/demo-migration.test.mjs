import assert from "node:assert/strict";
import {test} from "node:test";
import {randomBytes} from "node:crypto";
import {database,migrated,cli,snapshot,sanitized,secrets} from "./helpers.mjs";
const passwords=()=>Object.fromEntries(["UC","UTFSM"].flatMap(t=>["SUPERADMIN","ADMIN","TEACHER","ASSISTANT","STUDENT"].map(r=>[`DEMO_${t}_${r}_PASSWORD`,randomBytes(12).toString("hex")])));
export const demoEnv=()=>({...passwords(),DEMO_DATA_ENABLED:"true",DEMO_OPERATOR_REF:"integration-demo-v1"});
test("demo atomic cardinality, three secretless replays, concurrency and revocations",async()=>{
 const pool=await database();try {
  await migrated(pool);const env=demoEnv();
  const first=await cli("commands/predeploy",env).result;assert.equal(first.code,0);sanitized(first.output,Object.values(env).filter(v=>v.length>20));
  assert.deepEqual(await Promise.all(["institutions","users","institution_memberships"].map(async t=>(await pool.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n)),[2,10,10]);
  await pool.query("UPDATE institution_memberships SET is_admin=false,is_super_admin=false,active=false");
  await pool.query("UPDATE users SET active=false WHERE email='student.uc@academix.example'");
  const before=await snapshot(pool);
  const replay={DEMO_DATA_ENABLED:"true",DEMO_OPERATOR_REF:"replay"};
  for(let i=0;i<3;i++)assert.equal((await cli("commands/predeploy",replay).result).code,0);
  const results=await Promise.all([cli("data-migrations/demo-institutions",replay).result,cli("data-migrations/demo-institutions",replay).result]);
  assert.ok(results.every(r=>r.code===0));assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(before),"demo changed preserved rows");
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM audit_events WHERE action='membership.demoProvisioned'")).rows[0].n,10);
  await pool.query("DELETE FROM demo_data_runs");
  assert.equal((await cli("data-migrations/demo-institutions",env).result).code,1);assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(before),"demo changed preserved rows");
 }finally{await pool.end();}
});
test("demo failure rolls back both tenants; legacy adoption must be explicit and recognized",async()=>{
 const pool=await database();try {
  await migrated(pool);const env=demoEnv();delete env.DEMO_UTFSM_STUDENT_PASSWORD;
  assert.equal((await cli("data-migrations/demo-institutions",env).result).code,1);
  assert.deepEqual(await snapshot(pool),[[],[],[]]);
  assert.equal((await cli("seeds/demo",secrets()).result).code,0);
  const before=await snapshot(pool);
  assert.equal((await cli("data-migrations/demo-institutions",demoEnv()).result).code,1);assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(before),"demo changed preserved rows");
  assert.equal((await cli("data-migrations/demo-institutions",{...demoEnv(),DEMO_ADOPT_LEGACY:"true"}).result).code,0);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM users")).rows[0].n,15);
 }finally{await pool.end();}
});
