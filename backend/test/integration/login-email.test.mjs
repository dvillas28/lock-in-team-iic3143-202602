import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp,copyFile,rm,readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { database,reset,cli,snapshot,secrets,sanitized } from "./helpers.mjs";
test("email migration populated/empty/repeat, collision rollback and concurrent uniqueness",async()=>{
 const pool=await database();const dir=await mkdtemp(join(tmpdir(),"academix-email-"));
 try {
  const files=(await readdir("migrations")).sort();await copyFile(join("migrations",files[0]),join(dir,files[0]));
  for(const collision of [true,false]) {
   await reset(pool);
   // Invoke the existing migrator with a temporary directory, using its standard exported entrypoint.
   const {default:migration}=await import("../../dist/commands/migrate.js");
   const prev=process.env.DATABASE_URL;process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
   try {await migration.migrate(dir);} finally {if(prev===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=prev;}
   const insert=email=>pool.query("INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,'Fixture','$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture')",[randomUUID(),email]);
   await insert("Case@Example.test");if(collision)await insert(" case@example.test ");
   const before=await snapshot(pool);const result=await cli("commands/migrate").result;sanitized(result.output);
   assert.equal(result.code,collision?1:0);assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(before),"migration mutated users");
   assert.equal((await pool.query("SELECT * FROM pgmigrations")).rowCount,collision?1:2);
   if(!collision){
    const results=await Promise.allSettled([insert("RACE@example.test"),insert(" race@EXAMPLE.test ")]);
    assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
    assert.equal((await cli("commands/migrate").result).code,0);
    const env=secrets();assert.equal((await cli("seeds/demo",env).result).code,0);
    const seeded=await snapshot(pool);assert.equal((await cli("seeds/demo",env).result).code,0);
    assert.ok(JSON.stringify(await snapshot(pool))===JSON.stringify(seeded),"repeat seed mutated users");
   }
  }
 } finally {await pool.end();await rm(dir,{recursive:true,force:true});}
});
