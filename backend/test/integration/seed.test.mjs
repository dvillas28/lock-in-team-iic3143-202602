import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { once } from "node:events";
import { test } from "node:test";
import argon2 from "argon2";
import { database, migrated, cli, snapshot, secrets, sanitized, testUrl } from "./helpers.mjs";

const run = env => cli("platform/database/seed",env).result;
const demo = () => ({DEMO_SEED_ENABLED:"true", ...secrets()});
const same = (a,b) => assert.ok(JSON.stringify(a)===JSON.stringify(b), "persisted rows changed");

async function rejectInvalidInputs(DATABASE_URL) {
  for(const flag of ["TRUE","0","yes",""]) {
    const result=await run({...demo(),DEMO_SEED_ENABLED:flag,DATABASE_URL});
    sanitized(result.output);
    assert.equal(result.code,1); assert.ok(/config/.test(result.output),"configuration error missing");
  }
  for(const key of Object.keys(secrets())) {
    for(const password of [undefined, "", "x".repeat(7),"x".repeat(31),"😀".repeat(7),"😀".repeat(31)]) {
      const result=await run({...demo(),[key]:password,DATABASE_URL});
      sanitized(result.output,password ? [password] : []);
      assert.equal(result.code,1); assert.ok(/config/.test(result.output),"configuration error missing");
    }
  }
}

test("seed is opt-in and validates flag/all passwords before connecting", async () => {
  let connections=0;
  const server=createServer(socket=>{connections++;socket.destroy();});
  server.listen(0,"127.0.0.1");
  await once(server,"listening");
  const DATABASE_URL=`postgres://127.0.0.1:${server.address().port}/seed_validation_test`;
  try {
    for(const flag of [undefined,"false"]) {
      const result=await run({DEMO_SEED_ENABLED:flag,DATABASE_URL});
      sanitized(result.output);
      assert.equal(result.code,0); assert.ok(/skipped/.test(result.output),"seed was not skipped");
    }
    await rejectInvalidInputs(DATABASE_URL);
    assert.equal(connections,0,"invalid or skipped seed connected to DB");
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test("seed exact dataset/hash verification, repeat/concurrency and preservation", async () => {
  const pool=await database();
  const env=demo();
  env.DEMO_MULTI_PASSWORD="😀".repeat(8);
  env.DEMO_UC_PASSWORD="é".repeat(30);
  try {
    await migrated(pool);
    const results=await Promise.all([run(env),run(env)]);
    for(const result of results) { assert.equal(result.code,0);sanitized(result.output,Object.values(env)); }
    const before=await snapshot(pool);
    await rejectInvalidInputs(testUrl());
    same(await snapshot(pool),before);
    assert.deepEqual(before.map(rows=>rows.length),[2,5,6]);
    assert.deepEqual(before[0].map(row=>row.slug).sort(),["uc","utfsm"]);
    const keys=["UC","UTFSM","MULTI","REVOKED","INACTIVE"];
    for(let i=0;i<5;i++) {
      const row=before[1][i];
      assert.equal(row.id,`10000000-0000-4000-8000-00000000000${i+1}`);
      assert.ok(/^\$argon2id\$v=19\$m=19456,(?:t=2,p=1|p=1,t=2)\$/.test(row.password_hash),"unexpected Argon2id parameters");
      assert.equal(Buffer.from(row.password_hash.split("$")[4],"base64").length,16,"unexpected salt length");
      assert.ok(await argon2.verify(row.password_hash,env[`DEMO_${keys[i]}_PASSWORD`]).catch(()=>false),"hash verification failed");
      assert.equal(row.active,i!==4);
    }
    assert.equal(before[2].filter(row=>!row.active).length,1);
    assert.equal(before[2].filter(row=>row.user_id.endsWith("3")).length,2);
    await pool.query(`CREATE FUNCTION public.reject_existing_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'unexpected insert of existing record'; END $$;
      CREATE TRIGGER reject_existing_insert BEFORE INSERT ON institutions FOR EACH ROW EXECUTE FUNCTION reject_existing_insert();
      CREATE TRIGGER reject_existing_insert BEFORE INSERT ON institution_memberships FOR EACH ROW EXECUTE FUNCTION reject_existing_insert()`);
    assert.equal((await run(env)).code,0); same(await snapshot(pool),before);
    await pool.query("DROP TRIGGER reject_existing_insert ON institutions; DROP TRIGGER reject_existing_insert ON institution_memberships; DROP FUNCTION reject_existing_insert()");
    await pool.query("UPDATE institutions SET name='Edited', active=false, updated_at=now() WHERE slug='uc'");
    await pool.query("UPDATE users SET email=upper(email), name='Edited', active=false, updated_at=now() WHERE id='10000000-0000-4000-8000-000000000001'");
    await pool.query("UPDATE institution_memberships SET active=false, updated_at=now()");
    const edited=await snapshot(pool);
    const result=await run(demo());assert.equal(result.code,0);same(await snapshot(pool),edited);
    // Restore only test fixture gaps: fill missing records while preserving the rest.
    await pool.query("DELETE FROM institution_memberships WHERE user_id='10000000-0000-4000-8000-000000000005'");
    assert.equal((await run(demo())).code,0);
    assert.deepEqual((await snapshot(pool)).map(rows=>rows.length),[2,5,6]);
  } finally { await pool.end(); }
});

test("identity collisions and intermediate failure roll back all inserts", async () => {
  const pool=await database();
  try {
    for(const collision of ["uuid","email"]) {
      await migrated(pool);
      const id=collision==="uuid"?"10000000-0000-4000-8000-000000000001":randomUUID();
      const email=collision==="uuid"?"other@example.test":"  DEMO-UC@ACADEMIX.EXAMPLE ";
      const hash=await argon2.hash(secrets().DEMO_UC_PASSWORD);
      await pool.query("INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,'Existing',$3)",[id,email,hash]);
      const before=await snapshot(pool);
      const result=await run(demo());assert.equal(result.code,1);assert.ok(/conflict/.test(result.output),"identity conflict missing");
      sanitized(result.output,[hash,email]);same(await snapshot(pool),before);
    }
    await migrated(pool);
    await pool.query(`CREATE FUNCTION public.fail_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'sensitive injected failure'; END $$;
      CREATE TRIGGER fail_fixture BEFORE INSERT ON institution_memberships FOR EACH ROW EXECUTE FUNCTION fail_fixture()`);
    const before=await snapshot(pool);
    const result=await run(demo());assert.equal(result.code,1);sanitized(result.output,["sensitive injected failure"]);
    same(await snapshot(pool),before);
    await pool.query("DROP TRIGGER fail_fixture ON institution_memberships; DROP FUNCTION fail_fixture()");
    assert.equal((await run(demo())).code,0);
  } finally { await pool.end(); }
});

test("seed lock timeout is clean and retry succeeds", async () => {
  const pool=await database();
  try {
    await migrated(pool);
    const client=await pool.connect();
    try {
      await client.query("BEGIN; SELECT pg_advisory_xact_lock(202610150002)");
      const result=await run(demo());
      assert.equal(result.code,1);assert.ok(/lock/.test(result.output),"lock timeout missing");sanitized(result.output);
      assert.deepEqual((await snapshot(pool)).map(rows=>rows.length),[0,0,0]);
    } finally { await client.query("ROLLBACK");client.release(); }
    assert.equal((await run(demo())).code,0);
  } finally { await pool.end(); }
});
