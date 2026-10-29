import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { hash, argon2id } from 'argon2';
import { migrated } from './helpers.mjs';
import { demoRoles, presentationId, presentationTables, presentationVersion } from '../../dist/seeds/presentation-manifest.js';
export { presentationId as id, demoRoles };
export async function presentationFixture(pool, { prepare = true } = {}) {
  if (prepare) await migrated(pool);
  const password = randomBytes(16).toString('hex');
  const encoded = await hash(password, { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const tenants = {};
  for (const slug of ['uc', 'utfsm']) {
    const institution = randomUUID(), accounts = {};
    await pool.query('INSERT INTO institutions(id,slug,name) VALUES($1,$2,$3)', [institution, slug, `${slug.toUpperCase()} · Pruebas`]);
    for (const role of demoRoles) {
      const id = randomUUID(), membershipId = randomUUID();
      await pool.query('INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4)', [id, `${role}.${slug}@academix.example`, `${role} ${slug}`, encoded]);
      await pool.query('INSERT INTO institution_memberships(id,institution_id,user_id,is_admin,is_super_admin) VALUES($1,$2,$3,$4,$5)',
        [membershipId, institution, id, ['admin', 'superadmin'].includes(role), role === 'superadmin']);
      accounts[role] = { id, membershipId };
    }
    tenants[slug] = { id: institution, accounts };
  }
  const url = new URL(process.env.TEST_DATABASE_URL);
  return { tenants, password, env: { DEMO_OPERATOR_REF: 'isolated-presentation-test', DEMO_SEED_EXPECTED_HOST: url.hostname,
    DEMO_SEED_EXPECTED_DATABASE: decodeURIComponent(url.pathname.slice(1)) } };
}
// Keep credentials ephemeral and use the same target guards as the existing test helpers.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { testUrl, runtimeUrl } from './helpers.mjs';
export async function seed(f, mode, extra = {}) {
  const child = spawn(process.execPath, ['dist/seeds/presentation.js', mode], {
    cwd: new URL('../../', import.meta.url), env: { ...process.env, MIGRATION_DATABASE_URL: testUrl(), DATABASE_URL: runtimeUrl(),
      ...(mode === 'apply' ? { DEMO_SEED_ALLOW_PRODUCTION: presentationVersion } : {}), ...f.env, ...extra },
    stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000, killSignal: 'SIGKILL',
  });
  let output = ''; child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  const [code] = await once(child, 'exit'); return { code, output };
}
export const snapshot = pool => Promise.all([...presentationTables, 'institutions', 'demo_data_runs'].map(async t =>
  (await pool.query(`SELECT * FROM public.${t} ORDER BY ${t === 'demo_data_runs' ? 'version' : 'id'}`)).rows));
export const unchanged = (a, b) => assert.ok(JSON.stringify(a) === JSON.stringify(b), 'persisted records changed');
export async function loginPresentation(app, f, slug, role) {
  const r = await fetch(`${app.base}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${role}.${slug}@academix.example`, password: f.password }) });
  assert.equal(r.status, 200); return (await r.json()).accessToken;
}
