import assert from "node:assert/strict";
import {test} from "node:test";
import {database,migrated,cli,runtimeUrl,sanitized} from "./helpers.mjs";
test("runtime provisioning replays without rotating credentials; operational URL required",async()=>{
 const pool=await database();try {
  await migrated(pool);
  const before=(await pool.query("SELECT rolpassword FROM pg_authid WHERE rolname='academix_runtime'")).rows;
  for(let i=0;i<3;i++)assert.equal((await cli("commands/provision-runtime").result).code,0);
  assert.ok(JSON.stringify((await pool.query("SELECT rolpassword FROM pg_authid WHERE rolname='academix_runtime'")).rows)===JSON.stringify(before),"runtime password rotated");
  const bad=new URL(runtimeUrl());bad.pathname='/another_test';
  const mismatch=await cli("commands/provision-runtime",{DATABASE_URL:bad.href}).result;
  assert.equal(mismatch.code,1);sanitized(mismatch.output,[bad.href]);
  const result=await cli("commands/migrate",{MIGRATION_DATABASE_URL:""}).result;
  assert.equal(result.code,1);sanitized(result.output);
 }finally{await pool.end();}
});

test("provisioning refuses unsafe preexisting NOLOGIN role without enabling it",async()=>{
 const pool=await database();try{
  await migrated(pool);
  await pool.query("ALTER ROLE academix_runtime NOLOGIN BYPASSRLS");
  try {
   const result=await cli("commands/provision-runtime").result;assert.equal(result.code,1);sanitized(result.output);
   assert.equal((await pool.query("SELECT rolcanlogin FROM pg_roles WHERE rolname='academix_runtime'")).rows[0].rolcanlogin,false);
  }finally{await pool.query("ALTER ROLE academix_runtime LOGIN NOBYPASSRLS");}
 }finally{await pool.end();}
});
