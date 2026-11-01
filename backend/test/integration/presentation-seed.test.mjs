import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { database, sanitized } from './helpers.mjs';
import { cli, testUrl, migrated } from './helpers.mjs';
import pg from 'pg';
import { presentationFixture, seed, snapshot, unchanged, id } from './presentation-fixtures.mjs';
import { presentationVersion } from '../../dist/seeds/presentation-manifest.js';
import { presentationConfig } from '../../dist/seeds/presentation.js';
import { waitForLock } from './content-fixtures.mjs';

test('presentation configuration rejects wrong targets, unknown modes and production writes before connection', async () => {
  const env = { MIGRATION_DATABASE_URL: 'postgres://127.0.0.1/example_test', DEMO_SEED_EXPECTED_HOST: '127.0.0.1', DEMO_SEED_EXPECTED_DATABASE: 'example_test', DEMO_OPERATOR_REF: 'test' };
  for (const [extra, args] of [[{}, []], [{}, ['apply', 'extra']], [{}, ['reset']], [{ DEMO_SEED_EXPECTED_HOST: 'other' }, ['check']],
    [{ DEMO_SEED_EXPECTED_DATABASE: '' }, ['preview']], [{ NODE_ENV: 'production' }, ['apply']], [{ RENDER: 'true' }, ['apply']],
    [{ DEMO_SEED_ALLOW_PRODUCTION: presentationVersion, DEMO_OPERATOR_REF: '' }, ['apply']],
    [{ DEMO_SEED_ALLOW_PRODUCTION: presentationVersion, DEMO_OPERATOR_REF: 'bad\nref' }, ['apply']]]) {
    assert.throws(() => presentationConfig({ ...env, ...extra }, args));
  }
  assert.equal(presentationConfig({ ...env, NODE_ENV: 'production', DEMO_SEED_ALLOW_PRODUCTION: presentationVersion }, ['apply']).mode, 'apply');
  const server = createServer(socket => { socket.destroy(); assert.fail('unexpected database connection'); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const r = await seed({ env }, 'apply', { MIGRATION_DATABASE_URL: `postgres://127.0.0.1:${server.address().port}/example_test`, NODE_ENV: 'production', DEMO_SEED_ALLOW_PRODUCTION: '' });
    assert.equal(r.code, 1); assert.match(r.output, /explicit_production_opt_in_required/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('presentation preflight diagnoses missing identities, permissions, schema and unowned collisions without writes', async () => {
  const pool = await database();
  try {
    const f = await presentationFixture(pool);
    const before = await snapshot(pool);
    for (const mode of ['check', 'preview']) {
      const r = await seed(f, mode); assert.equal(r.code, 0, r.output); assert.equal(JSON.parse(r.output).outcome, 'ready');
      unchanged(before, await snapshot(pool)); sanitized(r.output, [f.password]);
    }
    assert.equal((await seed(f, 'verify')).code, 1);
    await pool.query('UPDATE users SET active=false WHERE id=$1', [f.tenants.utfsm.accounts.student.id]);
    let initial = await snapshot(pool), r = await seed(f, 'apply');
    assert.equal(r.code, 1); assert.match(r.output, /utfsm:student:account_missing_or_inactive/); unchanged(initial, await snapshot(pool));
    await pool.query('UPDATE users SET active=true WHERE id=$1', [f.tenants.utfsm.accounts.student.id]);
    await pool.query('UPDATE institution_memberships SET is_admin=false WHERE id=$1', [f.tenants.uc.accounts.admin.membershipId]);
    initial = await snapshot(pool); r = await seed(f, 'apply'); assert.equal(r.code, 1); assert.match(r.output, /required_permission_missing/); unchanged(initial, await snapshot(pool));
    await pool.query('UPDATE institution_memberships SET is_admin=true WHERE id=$1', [f.tenants.uc.accounts.admin.membershipId]);
    await pool.query("INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,'DEMO-UTFSM-101','Manual','DEMO-2026-2',$3)",
      [randomUUID(), f.tenants.utfsm.id, f.tenants.utfsm.accounts.admin.id]);
    initial = await snapshot(pool); r = await seed(f, 'apply'); assert.equal(r.code, 1); assert.match(r.output, /unowned_course_code/); unchanged(initial, await snapshot(pool));
    const g = await presentationFixture(pool);
    await pool.query("DELETE FROM pgmigrations WHERE name='20261026000100_operator_maintenance'");
    r = await seed(g, 'check'); assert.equal(r.code, 1); assert.match(r.output, /pending_migrations/);
  } finally { await pool.end(); }
});

test('presentation applies atomically in both tenants, concurrent replay is a no-op and all initial data is coherent', async () => {
  const pool = await database();
  try {
    const f = await presentationFixture(pool);
    const identities = (await pool.query('SELECT * FROM users ORDER BY id')).rows;
    const memberships = (await pool.query('SELECT * FROM institution_memberships ORDER BY id')).rows;
    const manualId = randomUUID();
    await pool.query("INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,'MANUAL','Curso del equipo','2026-2',$3)",
      [manualId, f.tenants.uc.id, f.tenants.uc.accounts.admin.id]);
    const manual = (await pool.query('SELECT * FROM courses WHERE id=$1', [manualId])).rows;
    const results = await Promise.all([seed(f, 'apply'), seed(f, 'apply')]);
    for (const r of results) { assert.equal(r.code, 0, r.output); sanitized(r.output, [f.password]); }
    assert.deepEqual(results.map(r => JSON.parse(r.output).outcome).sort(), ['alreadyApplied', 'applied']);
    const result = JSON.parse(results[0].output);
    for (const t of result.summary) {
      assert.equal(t.courses, 3); assert.equal(t.sections, 4); assert.equal(t.course_modules, 9); assert.equal(t.materials, 18);
      assert.equal(t.quizzes, 7); assert.equal(t.grade_items, 6); assert.equal(t.users, t.slug === 'uc' ? 8 : 6);
      assert.equal(t.enrollments, t.slug === 'uc' ? 25 : 23); assert.equal(t.grades, t.slug === 'uc' ? 14 : 10);
      assert.equal(t.quiz_attempts, t.slug === 'uc' ? 16 : 12); assert.equal(t.grade_publications, 1);
    }
    unchanged(identities, (await pool.query('SELECT * FROM users WHERE id=ANY($1::uuid[]) ORDER BY id', [identities.map(u => u.id)])).rows);
    unchanged(memberships, (await pool.query('SELECT * FROM institution_memberships WHERE id=ANY($1::uuid[]) ORDER BY id', [memberships.map(m => m.id)])).rows);
    unchanged(manual, (await pool.query('SELECT * FROM courses WHERE id=$1', [manualId])).rows);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM grades WHERE grade_value NOT BETWEEN 1 AND 7')).rows[0].n, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM quiz_attempts WHERE status=\'submitted\'')).rows[0].n, 0);
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM grades g JOIN quiz_attempts a ON a.id=g.attempt_id
      WHERE (g.score_percent,g.grade_value) IS DISTINCT FROM (a.score_percent,a.grade_value)`)).rows[0].n, 0);
    assert.deepEqual((await pool.query('SELECT DISTINCT grade_value::float FROM grades ORDER BY 1')).rows.map(r => r.grade_value), [3, 4, 7]);
    assert.ok((await pool.query('SELECT sum(weight_percent) AS n FROM grade_items GROUP BY course_id')).rows.every(r => Number(r.n) === 100));
    const baseline = await snapshot(pool);
    for (const mode of ['check', 'preview', 'apply', 'verify']) { assert.equal((await seed(f, mode)).code, 0); unchanged(baseline, await snapshot(pool)); }
    await pool.query("UPDATE courses SET name='Edición manual' WHERE id=$1", [id('uc/course/0')]);
    await pool.query('UPDATE enrollments SET active=false WHERE institution_id=$1 AND user_id=$2', [f.tenants.uc.id, f.tenants.uc.accounts.assistant.id]);
    const edited = await snapshot(pool); const replay = await seed(f, 'apply'); assert.equal(replay.code, 0, replay.output);
    assert.ok(JSON.parse(replay.output).verification.changedRecords.enrollments > 0); unchanged(edited, await snapshot(pool));
    // A cross-tenant enrollment fails the schema, even using the operator connection.
    await assert.rejects(pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,'student')",
      [randomUUID(), f.tenants.uc.id, id('utfsm/course/0/section/0'), f.tenants.uc.accounts.student.id]));
  } finally { await pool.end(); }
});

test('presentation late failures roll back both institutions and ledger corruption is never silently adopted', async () => {
  const pool = await database();
  try {
    const f = await presentationFixture(pool);
    await pool.query(`CREATE FUNCTION public.fail_presentation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private failure'; END $$;
      CREATE TRIGGER fail_presentation BEFORE INSERT ON demo_data_runs FOR EACH ROW EXECUTE FUNCTION public.fail_presentation()`);
    const before = await snapshot(pool); let r = await seed(f, 'apply'); assert.equal(r.code, 1); sanitized(r.output, [f.password, 'private failure']); unchanged(before, await snapshot(pool));
    await pool.query('DROP TRIGGER fail_presentation ON demo_data_runs');
    r = await seed(f, 'apply'); assert.equal(r.code, 0, r.output);
    await pool.query("UPDATE demo_data_runs SET input_fingerprint='corrupt' WHERE version=$1", [presentationVersion]);
    const corrupt = await snapshot(pool); r = await seed(f, 'apply'); assert.equal(r.code, 1); assert.match(r.output, /ledger_or_account_identity_mismatch/); unchanged(corrupt, await snapshot(pool));
  } finally { await pool.end(); }
});

test('presentation runs as a managed non-superuser owner under FORCE RLS and rejects runtime execution', async () => {
  const pool = await database(), owner = 'academix_presentation_owner_test';
  const target = new URL(testUrl());
  const name = `${decodeURIComponent(target.pathname.slice(1))}_presentation_owner_test`;
  // The helper validates the _test suffix before this isolated database is ever created.
  assert.match(name, /^[a-zA-Z0-9_]+_test$/);
  let db;
  try {
    await migrated(pool);
    await pool.query(`CREATE ROLE ${owner} LOGIN NOSUPERUSER NOBYPASSRLS CREATEROLE`);
    await pool.query(`CREATE DATABASE ${name} OWNER ${owner}`);
    target.pathname = `/${name}`; target.username = owner; target.password = '';
    const env = { MIGRATION_DATABASE_URL: target.href };
    assert.equal((await cli('commands/migrate', env).result).code, 0, 'owner migration failed');
    db = new pg.Pool({ connectionString: target.href });
    const f = await presentationFixture(db, { prepare: false });
    const extra = { ...env, DEMO_SEED_EXPECTED_DATABASE: name };
    let r = await seed(f, 'apply', extra); assert.equal(r.code, 0, r.output);
    r = await seed(f, 'verify', extra); assert.equal(r.code, 0, r.output);
    const memberships = (await db.query('SELECT count(*)::int AS n FROM institution_memberships')).rows[0].n;
    assert.equal(memberships, 24);
    const runtime = await seed(f, 'check', { MIGRATION_DATABASE_URL: process.env.TEST_RUNTIME_DATABASE_URL });
    assert.equal(runtime.code, 1); assert.match(runtime.output, /migration_operator_required/);
  } finally {
    await db?.end();
    await pool.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await pool.query(`DROP ROLE IF EXISTS ${owner}`);
    await pool.end();
  }
});

test('a preview queued behind apply observes its committed ledger and complete dataset', async () => {
  const pool = await database(); let blocker, apply, preview;
  try {
    const f = await presentationFixture(pool);
    blocker = await pool.connect();
    await blocker.query('BEGIN'); await blocker.query('SELECT pg_advisory_xact_lock(202610290001)');
    apply = seed(f, 'apply'); await waitForLock(pool, 'SELECT pg_advisory_xact_lock(202610290001)');
    preview = seed(f, 'preview'); await waitForLock(pool, 'SELECT pg_advisory_xact_lock_shared(202610290001)');
    await blocker.query('COMMIT');
    const applied = await apply, inspected = await preview;
    assert.equal(applied.code, 0, applied.output); assert.equal(inspected.code, 0, inspected.output);
    assert.equal(JSON.parse(inspected.output).outcome, 'alreadyApplied');
    assert.equal(JSON.parse(inspected.output).summary.length, 2);
  } finally {
    await blocker?.query('ROLLBACK'); blocker?.release();
    await Promise.allSettled([apply, preview]); await pool.end();
  }
});
