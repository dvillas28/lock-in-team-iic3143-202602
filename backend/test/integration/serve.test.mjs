import assert from "node:assert/strict";
import {test} from "node:test";
import {database,reset,cli,http,sanitized} from "./helpers.mjs";
test("serve stops before HTTP when predeploy fails",async()=>{
 const pool=await database();try{
  await reset(pool);
  const result=await cli("commands/serve",{DEMO_DATA_ENABLED:"yes",PORT:"13982"}).result;
  assert.equal(result.code,1);
  assert.doesNotMatch(result.output,/listening/i);
  assert.equal((await pool.query("SELECT to_regclass('public.pgmigrations') AS table")).rows[0].table,null);
  sanitized(result.output);
 }finally{await pool.end();}
});
test("serve applies predeploy on an empty base and then becomes ready",async()=>{
 const pool=await database();let app;try{
  await reset(pool);
  app=await http({DEMO_DATA_ENABLED:"false"},"commands/serve");
  assert.equal((await fetch(`${app.base}/health`)).status,200);
  assert.notEqual((await pool.query("SELECT to_regclass('public.pgmigrations') AS table")).rows[0].table,null);
 }finally{await app?.close();await pool.end();}
});
