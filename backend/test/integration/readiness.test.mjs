import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import pg from "pg";
import { database, migrated, cli, sanitized, testUrl } from "./helpers.mjs";
import service from "../../dist/database/database.service.js";

async function failedStartup(extra) {
  const app = cli("main", {...extra,PORT:"13981"});
  let exited=false, listened=false;
  const result=app.result.finally(()=>{exited=true;});
  while(!exited) {
    try { await fetch("http://localhost:13981/health",{signal:AbortSignal.timeout(100)});listened=true; }
    catch { /* Unavailable is required until the process exits. */ }
    await delay(10);
  }
  assert.equal(listened,false,"HTTP listened before persistence validation");
  return result;
}

async function waitReady(port, app) {
  for (let i=0; i<100; i++) {
    if (app.child.exitCode !== null) throw new Error("HTTP exited before ready");
    try { if ((await fetch(`http://localhost:${port}/ready`)).ok) return; } catch { /* Wait for listen. */ }
    await delay(50);
  }
  throw new Error("HTTP did not become ready");
}

test("startup rejects invalid config/TLS and absent DB/schema without listening", async () => {
  const pool = await database();
  try {
    for (const DATABASE_URL of ["", "bad", "http://localhost/db", "postgres://localhost/db?sslmode=no-verify", "postgres://localhost/db?sslmode=require", "postgres://localhost/db?sslmode=verify-full&sslrootcert=/nonexistent-ca", "postgres://localhost:1/db", "postgres://10.attacker.example/db", "postgres://public.example/db?sslmode=disable"]) {
      const start = performance.now();
      const result = await failedStartup({DATABASE_URL});
      assert.equal(result.code, 1);
      assert.ok(performance.now()-start < 30000);
      sanitized(result.output);
    }
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
    assert.equal((await failedStartup({})).code, 1);
  } finally { await pool.end(); }
});

test("HTTP readiness, health, schema/DB loss, recovery and graceful shutdown", async () => {
  const pool = await database();
  let app;
  try {
    await migrated(pool);
    app = cli("main", {PORT:"13982"});
    await waitReady(13982, app);
    assert.deepEqual((await Promise.all(["institutions","users","institution_memberships"].map(table => pool.query(`SELECT count(*)::int AS n FROM ${table}`)))).map(result=>result.rows[0].n),[0,0,0],"HTTP startup loaded demo data");
    assert.deepEqual(await (await fetch("http://localhost:13982/ready")).json(), {status:"ok"});
    const health = await (await fetch("http://localhost:13982/health")).json();
    assert.deepEqual(Object.keys(health).sort(), ["commit","deployedAt","status","timestamp","version"]);
    for (const path of ["/seed","/db/seed","/bootstrap","/db/bootstrap"]) assert.equal((await fetch(`http://localhost:13982${path}`)).status,404);
    await pool.query("ALTER TABLE users ADD COLUMN future_field text");
    await waitReady(13982,app);
    await pool.query("ALTER TABLE users RENAME COLUMN email TO missing_email");
    const start = performance.now();
    const unavailable = await fetch("http://localhost:13982/ready");
    assert.equal(unavailable.status,503);
    assert.deepEqual(await unavailable.json(), {status:"unavailable"});
    assert.ok(performance.now()-start < 5000);
    assert.equal((await fetch("http://localhost:13982/health")).status,200);
    await pool.query("ALTER TABLE users RENAME COLUMN missing_email TO email");
    await waitReady(13982,app);
    await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='academix-http'");
    await waitReady(13982,app);
    const maintenanceUrl = new URL(testUrl());
    const dbName = maintenanceUrl.pathname.slice(1);
    // PostgreSQL requires another database for toggling connections to this test DB.
    maintenanceUrl.pathname = "/postgres";
    const maintenance = new pg.Client({connectionString:maintenanceUrl.href});
    await maintenance.connect();
    try {
      await maintenance.query(`ALTER DATABASE "${dbName}" ALLOW_CONNECTIONS false`);
      await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='academix-http'");
      const lostAt = performance.now();
      const lost = await fetch("http://localhost:13982/ready");
      assert.equal(lost.status,503);
      assert.deepEqual(await lost.json(),{status:"unavailable"});
      assert.ok(performance.now()-lostAt < 5000);
      assert.equal((await fetch("http://localhost:13982/health")).status,200);
    } finally {
      try { await maintenance.query(`ALTER DATABASE "${dbName}" ALLOW_CONNECTIONS true`); }
      finally { await maintenance.end(); }
    }
    await waitReady(13982,app);
    app.child.kill("SIGTERM");
    const result = await app.result;
    sanitized(result.output);
    assert.equal((await pool.query("SELECT * FROM pg_stat_activity WHERE application_name='academix-http'")).rowCount,0);
    const before = (await pool.query("SELECT count(*) FROM pgmigrations")).rows;
    app = cli("main", {PORT:"13982"});
    await waitReady(13982,app);
    assert.deepEqual((await pool.query("SELECT count(*) FROM pgmigrations")).rows,before);
  } finally {
    if (app?.child.exitCode === null && app.child.signalCode === null) { app.child.kill("SIGTERM"); await app.result; }
    await pool.end();
  }
});

test("shared pool bounds saturation/query time and closes connections", async () => {
  const admin = await database();
  await migrated(admin);
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = testUrl();
  let databaseService;
  try { databaseService = new service.DatabaseService(); }
  finally {
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  }
  const pool = databaseService.pool;
  const clients = [];
  try {
    for(let i=0;i<5;i++) clients.push(await pool.connect());
    const start = performance.now();
    await assert.rejects(databaseService.check());
    assert.ok(performance.now()-start < 5000);
    assert.equal(pool.totalCount,5);
    for(const client of clients.splice(0)) client.release();
    const startQuery = performance.now();
    await assert.rejects(pool.query("SELECT pg_sleep(10)"));
    assert.ok(performance.now()-startQuery < 5000);
    await databaseService.check();
  } finally {
    for(const client of clients) client.release();
    await databaseService.onApplicationShutdown(); await admin.end();
  }
  assert.equal(pool.totalCount,0);
});
