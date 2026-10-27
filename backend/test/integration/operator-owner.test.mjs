import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import pg from "pg";
import { database, migrated, cli, sanitized, testUrl, runtimeUrl } from "./helpers.mjs";

// Managed Postgres (Render) migrates as a non-superuser owner; FORCE RLS must not block operator data.
const owner = "academix_test_owner";
function at(href, name, user) {
  const url = new URL(href); url.pathname = `/${name}`;
  if (user) { url.username = user.name; url.password = user.password; }
  return url.href;
}
function demoSecrets() {
  return Object.fromEntries(["UC", "UTFSM"].flatMap(slug => ["SUPERADMIN", "ADMIN", "TEACHER", "ASSISTANT", "STUDENT"]
    .map(role => [`DEMO_${slug}_${role}_PASSWORD`, randomBytes(12).toString("hex")])));
}

test("non-superuser owner runs predeploy with demo under FORCE RLS; runtime check rejects widened operator policy", async () => {
  const pool = await database(), name = `${decodeURIComponent(new URL(testUrl()).pathname.slice(1))}_owner_test`;
  const password = randomBytes(12).toString("hex");
  let admin;
  try {
    await migrated(pool);
    await pool.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await pool.query(`DROP ROLE IF EXISTS ${owner}`);
    await pool.query(`CREATE ROLE ${owner} LOGIN NOSUPERUSER NOBYPASSRLS CREATEROLE PASSWORD '${password}'`);
    await pool.query(`CREATE DATABASE ${name} OWNER ${owner}`);
    const env = { MIGRATION_DATABASE_URL: at(testUrl(), name, { name: owner, password }), DATABASE_URL: at(runtimeUrl(), name) };
    const secrets = demoSecrets();
    const result = await cli("commands/predeploy", { ...env, ...secrets, DEMO_DATA_ENABLED: "true", DEMO_OPERATOR_REF: "owner-test" }).result;
    assert.equal(result.code, 0, "predeploy failed as non-superuser owner");
    sanitized(result.output, [password, ...Object.values(secrets)]);
    admin = new pg.Pool({ connectionString: at(testUrl(), name) });
    assert.equal((await admin.query("SELECT count(*)::int AS n FROM institution_memberships")).rows[0].n, 10);
    const policies = (await admin.query("SELECT roles::text[] AS roles FROM pg_policies WHERE policyname='operator_maintenance'")).rows;
    assert.equal(policies.length, 12);
    assert.ok(policies.every(p => JSON.stringify(p.roles) === JSON.stringify([owner])));
    await admin.query("DROP POLICY operator_maintenance ON courses");
    await admin.query("CREATE POLICY operator_maintenance ON courses TO PUBLIC USING (true) WITH CHECK (true)");
    assert.equal((await cli("commands/provision-runtime", env).result).code, 1, "runtime accepted a PUBLIC operator policy");
  } finally {
    await admin?.end();
    await pool.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await pool.query(`DROP ROLE IF EXISTS ${owner}`);
    await pool.end();
  }
});
