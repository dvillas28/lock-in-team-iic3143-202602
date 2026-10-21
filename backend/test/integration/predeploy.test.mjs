import assert from "node:assert/strict";
import {test} from "node:test";
import {database,reset,cli} from "./helpers.mjs";
test("predeploy disabled requires no demo secrets, rejects invalid flags before migration",async()=>{
 const pool=await database();try{
  await reset(pool);
  assert.equal((await cli("commands/predeploy",{DEMO_DATA_ENABLED:"yes"}).result).code,1);
  assert.equal((await pool.query("SELECT to_regclass('public.pgmigrations') AS table")).rows[0].table,null);
  assert.equal((await cli("commands/predeploy",{DEMO_DATA_ENABLED:"false"}).result).code,0);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM users")).rows[0].n,0);
 }finally{await pool.end();}
});
