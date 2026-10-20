import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import pg from "pg";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

export function testUrl(env = process.env) {
  try {
    const url = new URL(env.TEST_DATABASE_URL);
    assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
    assert.match(decodeURIComponent(url.pathname.slice(1)), /^[a-zA-Z0-9_]+_test$/);
    assert.ok(url.hostname && !url.hash);
    for (const key of url.searchParams.keys()) assert.ok(["sslmode","sslrootcert"].includes(key));
    return url.href;
  } catch { throw new Error("Exclusive TEST_DATABASE_URL ending in _test required"); }
}
export function secrets() {
  return Object.fromEntries(["UC", "UTFSM", "MULTI", "REVOKED", "INACTIVE"].map(
    name => [`DEMO_${name}_PASSWORD`, randomBytes(12).toString("hex")],
  ));
}
export function cli(file, extra = {}) {
  const child = spawn(process.execPath, [`dist/${file}.js`], {
    cwd: new URL("../../", import.meta.url),
    env: { ...process.env, DATABASE_URL: testUrl(), AUTH_JWT_SECRET: randomBytes(32).toString("base64"), ...extra },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 35000, killSignal: "SIGKILL",
  });
  let output = "";
  child.stdout.on("data", data => { output += data; });
  child.stderr.on("data", data => { output += data; });
  return { child, result: once(child, "exit").then(([code, signal]) => ({ code, signal, output })) };
}
export async function database() {
  const pool = new pg.Pool({ connectionString: testUrl(), connectionTimeoutMillis: 2000 });
  const query = pool.query.bind(pool);
  pool.query = async (...args) => {
    try { return await query(...args); }
    catch (error) { throw new Error(`Integration SQL failure (${error.code ?? "connection"})`); }
  };
  const version = await pool.query("SHOW server_version_num");
  assert.equal(Math.floor(Number(version.rows[0].server_version_num) / 10000), 17);
  return pool;
}
export async function reset(pool) {
  testUrl();
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
}
export async function terminateHttpConnections(pool) {
  await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='academix-http' AND datname=current_database()");
}
export async function migrated(pool) {
  await reset(pool);
  const result = await cli("commands/migrate").result;
  assert.equal(result.code, 0, "migration failed");
}
export async function snapshot(pool) {
  return Promise.all(["institutions", "users", "institution_memberships"].map(async table =>
    (await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows,
  ));
}
export function sanitized(output, values = []) {
  for (const value of [testUrl(), ...values]) assert.ok(!output.includes(value), "secret in output");
  assert.ok(!/\$argon2|@academix\.example|password_hash|INSERT INTO/i.test(output), "sensitive output");
}

export async function http(extra = {}) {
  const server = createServer(); server.listen(0, "127.0.0.1"); await once(server,"listening");
  const port = server.address().port; await new Promise(resolve=>server.close(resolve));
  const app = cli("main", {PORT:String(port), ...extra});
  const base = `http://127.0.0.1:${port}`;
  const close = async () => {
    if (app.child.exitCode === null && app.child.signalCode === null) app.child.kill("SIGTERM");
    return app.result;
  };
  try {
    for (let i=0;i<150;i++) {
      if(app.child.exitCode !== null) throw new Error("HTTP startup failed");
      try { if((await fetch(`${base}/ready`)).ok) return {...app, base, close}; } catch { /* Startup only. */ }
      await delay(20);
    }
    throw new Error("HTTP readiness deadline");
  } catch(error) { await close(); throw error; }
}
export async function fixture(pool) {
  await migrated(pool); const env=secrets();
  assert.equal((await cli("seeds/demo",env).result).code,0,"seed failed"); return env;
}
export async function login(app, env, account="MULTI") {
  const response=await fetch(`${app.base}/api/v1/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:`demo-${account.toLowerCase().replace("revoked","revocado").replace("inactive","inactivo")}@academix.example`,password:env[`DEMO_${account}_PASSWORD`]})});
  assert.equal(response.status,200,"fixture login failed");
  assert.equal(response.headers.get("cache-control"),"no-store");
  const body=await response.json(); assert.equal(body.tokenType,"Bearer"); assert.equal(body.expiresIn,900);
  assert.deepEqual(Object.keys(body).sort(),["accessToken","expiresIn","tokenType"]); assert.ok(typeof body.accessToken==="string","login token missing");
  return body.accessToken;
}
export function authorized(token) {return {headers:{Authorization:`Bearer ${token}`}};}
