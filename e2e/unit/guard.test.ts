import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {preflight, isolatedEnv} from '../runner/settings.ts';
import {Environment} from '../fixtures/environment.ts';
import {Api} from '../helpers/api.ts';

test('E2E-OPS-008 / harness: external targets fail before any service or database access', () => {
  for (const variable of ['E2E_BASE_URL','E2E_API_URL','E2E_DATABASE_URL','E2E_RUNTIME_DATABASE_URL']) {
    for (const value of ['https://uc.academix.dvillasc.me','https://academix-backend.onrender.com','postgresql://synthetic@production.invalid/live','http://127.0.0.1:5432/existing_test']) {
      assert.throws(()=>preflight({[variable]:value}), /forbidden/);
    }
  }
  assert.throws(()=>preflight({E2E_RUN_ID:'../../unowned'}),/ownership/);
  assert.doesNotThrow(()=>preflight({E2E_RUN_ID:'1234567890abcdef'}));
});

test('E2E-OPS-008 / harness: missing ownership and SQL identifiers cannot target another database', () => {
  const before = {...process.env};
  try {
    delete process.env.E2E_RUN_ID;
    assert.throws(()=>new Environment('abc'),/ownership/);
    process.env.E2E_RUN_ID='1234567890abcdef'; process.env.E2E_PG_PORT='55432';
    for (const namespace of ['x";DROP DATABASE postgres;--','../../existing','abc-test', 'a'.repeat(100)]) {
      assert.throws(()=>new Environment(namespace),/database name/);
    }
  } finally {process.env = before;}
});

test('E2E-OPS-008 / harness: owner mismatch fails before connecting even on a test-looking local port', async () => {
  const before = {...process.env};
  const folder = await mkdtemp(join(tmpdir(),'academix-guard-test-'));
  try {
    await writeFile(join(folder,'owner'),'different-run');
    Object.assign(process.env,{E2E_RUN_ID:'1234567890abcdef',E2E_PG_PORT:'55432',E2E_PG_FOLDER:folder});
    await assert.rejects(new Environment('abc').start(),/ownership mismatch/);
  } finally {process.env=before;await rm(folder,{recursive:true});}
});

test('E2E-OPS-008 / harness: inherited application and operational credentials are not reused', () => {
  const before = {...process.env};
  try {
    Object.assign(process.env,{DATABASE_URL:'sentinel',MIGRATION_DATABASE_URL:'sentinel',AUTH_JWT_SECRET:'sentinel',DEMO_UC_PASSWORD:'sentinel',ONBOARD_INITIAL_PASSWORD:'sentinel',SUPERADMIN_USER_ID:'sentinel',NEXT_PUBLIC_API_URL:'https://production.invalid',PGHOST:'production.invalid'});
    const clean = isolatedEnv({DATABASE_URL:'owned-local-sentinel'});
    assert.equal(clean.DATABASE_URL,'owned-local-sentinel');
    for (const key of ['MIGRATION_DATABASE_URL','AUTH_JWT_SECRET','DEMO_UC_PASSWORD','ONBOARD_INITIAL_PASSWORD','SUPERADMIN_USER_ID','NEXT_PUBLIC_API_URL','PGHOST']) assert.equal(clean[key],undefined);
  } finally {process.env=before;}
});

test('E2E-OPS-008 / harness: HTTP helpers reject absolute and protocol-relative destinations', async () => {
  const api = new Api();
  for (const path of ['https://production.invalid','//production.invalid','/https://production.invalid']) await assert.rejects(api.request(path),/local relative paths/);
});
