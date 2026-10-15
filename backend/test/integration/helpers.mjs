import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import pg from "pg";

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
    env: { ...process.env, DATABASE_URL: testUrl(), ...extra },
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
export async function migrated(pool) {
  await reset(pool);
  const result = await cli("platform/database/migrate").result;
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
