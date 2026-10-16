import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { database, migrated, cli, snapshot, testUrl } from "./helpers.mjs";
import migration from "../../dist/commands/migrate.js";

test("migration repeat, constraints, tenant identity and restricted deletion", async () => {
  const pool = await database();
  try {
    await migrated(pool);
    const repeat = await cli("commands/migrate").result;
    assert.equal(repeat.code, 0);
    let summary;
    try { summary = JSON.parse(repeat.output); }
    catch { throw new Error("invalid migration summary"); }
    assert.equal(summary.created, 0);
    assert.equal(summary.existing, 3);
    assert.equal((await pool.query("SELECT * FROM pgmigrations")).rowCount, 3);
    const schema = await pool.query(`SELECT c.relname AS table_name,a.attname AS column_name,
      format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS required,
      pg_get_expr(d.adbin,d.adrelid) AS default_value
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
      LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
      WHERE n.nspname='public' AND c.relname IN ('institutions','users','institution_memberships')`);
    const expected = {
      institutions: {id:"uuid",slug:"character varying(63)",name:"character varying(200)",active:"boolean",created_at:"timestamp(6) with time zone",updated_at:"timestamp(6) with time zone"},
      users: {id:"uuid",email:"character varying(254)",password_hash:"character varying(255)",name:"character varying(200)",active:"boolean",created_at:"timestamp(6) with time zone",updated_at:"timestamp(6) with time zone"},
      institution_memberships: {is_admin:"boolean",is_super_admin:"boolean",id:"uuid",institution_id:"uuid",user_id:"uuid",active:"boolean",created_at:"timestamp(6) with time zone",updated_at:"timestamp(6) with time zone"},
    };
    assert.equal(schema.rowCount,21);
    for (const [table,columns] of Object.entries(expected)) {
      for (const [column,type] of Object.entries(columns)) {
        const actual=schema.rows.find(row=>row.table_name===table && row.column_name===column);
        assert.equal(actual?.type,type,`${table}.${column} type`);
        assert.equal(actual.required,true,`${table}.${column} NOT NULL`);
        const defaultValue=column.startsWith("is_")?"false":column==="active"?"true":["created_at","updated_at"].includes(column)?"now()":null;
        assert.equal(actual.default_value,defaultValue,`${table}.${column} default`);
      }
    }
    const ids = Array.from({length: 6}, randomUUID);
    await pool.query("INSERT INTO institutions(id,slug,name) VALUES($1,'uc','UC'),($2,'utfsm','UTFSM')", ids.slice(0,2));
    await pool.query("INSERT INTO users(id,email,name,password_hash) VALUES($1,'same@example.test','A','$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture'),($2,'other@example.test','B','$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture')", ids.slice(2,4));
    await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3),($4,$5,$3)", [ids[4], ids[0], ids[2], ids[5], ids[1]]);
    const before = await snapshot(pool);
    const invalid = [
      ["INSERT INTO institutions(id,slug,name) VALUES($1,'uc','X')", [randomUUID()]],
      ["INSERT INTO institutions(id,slug,name) VALUES($1,'Bad-','X')", [randomUUID()]],
      ["INSERT INTO institutions(id,slug,name) VALUES($1,'valid','   ')", [randomUUID()]],
      ["INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)", [randomUUID(),ids[0],ids[2]]],
      ["INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)", [randomUUID(),randomUUID(),ids[2]]],
      ["INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)", [randomUUID(),ids[0],randomUUID()]],
      ["INSERT INTO institutions(id,slug,name) VALUES($1,$2,'X')", [randomUUID(),"a".repeat(64)]],
      ["UPDATE institutions SET active=NULL WHERE id=$1", [ids[0]]],
      ["UPDATE institutions SET name=$1 WHERE id=$2", ["x".repeat(201),ids[0]]],
      ["UPDATE users SET email=$1 WHERE id=$2", ["x".repeat(255),ids[2]]],
      ["UPDATE users SET name='' WHERE id=$1", [ids[2]]],
      ["UPDATE users SET email='   ' WHERE id=$1", [ids[2]]],
      ["UPDATE users SET password_hash='plaintext' WHERE id=$1", [ids[2]]],
      ["UPDATE users SET active=NULL WHERE id=$1", [ids[2]]],
      ["UPDATE institution_memberships SET institution_id=NULL WHERE id=$1", [ids[4]]],
      ["DELETE FROM institutions WHERE id=$1", [ids[0]]],
      ["DELETE FROM users WHERE id=$1", [ids[2]]],
      ["UPDATE users SET id=$1 WHERE id=$2", [randomUUID(),ids[2]]],
    ];
    for (const [sql, args] of invalid) await assert.rejects(pool.query(sql,args));
    assert.ok(JSON.stringify(await snapshot(pool)) === JSON.stringify(before), "persisted rows changed");
    const constraints = (await pool.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='institution_memberships'::regclass")).rows.map(row=>row.definition);
    assert.ok(constraints.includes("UNIQUE (institution_id, id)"));
    const indexes = (await pool.query("SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='institution_memberships'")).rows;
    assert.ok(indexes.some(row=>row.indexdef.endsWith(" USING btree (user_id, active, institution_id)")));
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    assert.deepEqual(tables.rows.map(row=>row.tablename).sort(),["audit_events","courses","enrollments","institution_memberships","institutions","pgmigrations","sections","users"]);
    const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='institution_memberships'");
    assert.equal(columns.rowCount, 8);
  } finally { await pool.end(); }
});

test("failed pending batch rolls back DDL/history and migrator refuses competing lock", async () => {
  const pool = await database();
  const dir = await mkdtemp(join(tmpdir(), "academix-migrations-"));
  try {
    await migrated(pool);
    await writeFile(join(dir,"20261015000100_institutional-foundation.sql"), "-- Up Migration\nSELECT 1;");
    await writeFile(join(dir,"20261015000400_unique_login_email.sql"), "-- Up Migration\nSELECT 1;");
    await writeFile(join(dir,"20261015000500_pending.sql"), "-- Up Migration\nCREATE TABLE public.pending_fixture(id int);");
    await writeFile(join(dir,"20261015000600_failed.sql"), "-- Up Migration\nSELECT * FROM public.nonexistent_fixture;");
    const previous = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = testUrl();
      await assert.rejects(migration.migrate(dir));
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
    assert.equal((await pool.query("SELECT to_regclass('public.pending_fixture') AS t")).rows[0].t, null);
    assert.equal((await pool.query("SELECT * FROM pgmigrations")).rowCount, 3);
    const client = await pool.connect();
    try {
      await client.query("SELECT pg_advisory_lock(7241865325823964)");
      const result = await cli("commands/migrate").result;
      assert.equal(result.code, 1);
    } finally { await client.query("SELECT pg_advisory_unlock_all()"); client.release(); }
  } finally { await pool.end(); await rm(dir,{recursive:true,force:true}); }
});
