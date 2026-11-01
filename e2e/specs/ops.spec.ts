import {test, expect} from '../fixtures/test.ts';
import {Environment} from '../fixtures/environment.ts';
import {Api, status} from '../helpers/api.ts';
import {apiBase, preflight} from '../runner/settings.ts';
import {command, launch, stop, ready} from '../runner/process.ts';
import {prepareProfile} from '../data/profiles.ts';
import {seed} from '../data/seed.ts';
import {course, go} from '../helpers/browser.ts';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import pg from 'pg';

const snapshot = async (e: Environment) => {
  const result: Record<string, unknown> = {};
  for (const table of ['courses','materials','enrollments','quiz_attempts','grades','grade_publications','audit_events']) {
    result[table] = (await e.pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
  }
  return result;
};

test('E2E-OPS-001 migrated runtime readiness / readiness @extended', async ({e}) => {
  const health = status(await new Api().request('/health'), 200);
  expect(health.body).toMatchObject({status:'ok', version:expect.any(String), deployedAt:expect.any(String), timestamp:expect.any(String)});
  expect(status(await new Api().request('/ready'),200).body).toEqual({status:'ok'});
  const db = new pg.Pool({connectionString:e.url('academix_runtime')});
  try {
    expect((await db.query('SELECT current_user AS role')).rows[0].role).toBe('academix_runtime');
    expect((await db.query('SELECT count(*)::int AS n FROM courses')).rows[0].n).toBe(0);
  } finally {await db.end();}
  const migrations = (await e.pool.query('SELECT * FROM pgmigrations ORDER BY id')).rows;
  expect(migrations.length).toBeGreaterThan(0);
  await command(process.execPath, ['backend/dist/commands/predeploy.js'],e.backendEnv());
  expect((await e.pool.query('SELECT * FROM pgmigrations ORDER BY id')).rows).toEqual(migrations);
  expect(JSON.stringify(health.body)).not.toContain(e.password);
});

test('E2E-OPS-002 database unavailable and recovery / database-outage @regression', async ({e, actorPage}) => {
  const page = await actorPage('T1');
  await course(page,e.data.courses.C1);
  const before = await snapshot(e);
  try {
    await e.suspendDatabase();
    expect((await new Api().request('/health')).status).toBe(200);
    expect((await new Api().request('/ready')).status).toBe(503);
    const response = page.waitForResponse(r=>r.url().endsWith(`/courses/${e.data.courses.C1}`));
    await page.getByRole('link',{name:'Módulos y material',exact:true}).first().click();
    expect((await response).status()).toBe(503);
    await expect(page.locator('main').getByRole('alert')).toBeVisible();
  } finally {await e.resumeDatabase();}
  await ready(apiBase+'/ready',e.app?.child);
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.getByRole('button',{name:'Unidad E2E M1',exact:true})).toBeVisible();
  expect(await snapshot(e)).toEqual(before);
});

for (const variant of ['unsafe-role','missing-rls']) {
  test(`E2E-OPS-003 unsafe runtime refuses traffic / ${variant} @extended`, async ({e}) => {
    await stop(e.app!.child);
    if (variant === 'missing-rls') await e.pool.query('ALTER TABLE courses DISABLE ROW LEVEL SECURITY');
    const app = launch(process.execPath,['backend/dist/commands/start.js'],{
      ...e.backendEnv(), ...(variant === 'unsafe-role' ? {DATABASE_URL:e.url()} : {}),
    });
    try {
      await expect(Promise.race([app.finished,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Unsafe startup did not exit')),15000))])).resolves.not.toBe(0);
      await expect(fetch(apiBase+'/ready',{signal:AbortSignal.timeout(1000)})).rejects.toThrow();
    } finally {await stop(app.child);}
  });
}

test('E2E-OPS-004 ensure preserves revocation and content / ensure-preserves-edits @extended', async ({e}) => {
  const identity = await e.ensureSeed();
  expect((await e.ensureSeed()).actors).toEqual(identity.actors);
  const teacher = await e.api('T1');
  status(await teacher.patch(`materials/${e.data.materials.R1}`,{title:'Edición conservada'}),200);
  const owner = await e.api('AO');
  const enrollment = e.id('enrollment/S1/T1/teacher');
  status(await owner.patch(`sections/${e.data.sections.S1}/enrollments/${enrollment}`,{active:false}),200);
  const before = await snapshot(e);
  await e.ensureSeed();
  expect(await snapshot(e)).toEqual(before);
  status(await teacher.patch(`materials/${e.data.materials.R1}`,{title:'No autorizado'}),404);
  await expect(seed(e.pool,'foreign-namespace','unused')).rejects.toThrow(/collision/);
});

test('E2E-OPS-005 academic data survives API restart / restart-persistence @regression', async ({e, actorPage}) => {
  const teacher = await e.api('T1');
  const material = status(await teacher.post(`modules/${e.data.modules.M1}/materials`,{title:'Material persistente',markdownBody:'# Evidencia persistente'}),201).body;
  status(await teacher.post(`materials/${material.id}/publish`),200);
  await prepareProfile(e,'HISTORY');
  const before = await snapshot(e);
  const first = await actorPage('ST1');
  await go(first,e.data.courses.C1,'/grades');
  await expect(first.getByRole('table')).toBeVisible();
  await first.close();
  await e.restartApi();
  const second = await actorPage('ST1');
  await go(second,e.data.courses.C1,'/grades');
  await expect(second.getByRole('row').filter({hasText:'Quiz E2E Q1'})).toBeVisible();
  const own = status(await (await e.api('ST1')).get(`courses/${e.data.courses.C1}/my-grades`),200).body;
  expect(own.items).toEqual(expect.arrayContaining([expect.objectContaining({gradeItemId:e.id('item/Q1'),scorePercent:60,grade:4})]));
  status(await (await e.api('ST1')).get(`materials/${material.id}`),200);
  expect(await snapshot(e)).toEqual(before);
});

test('E2E-OPS-006 runtime enforces FK RLS and immutable history / runtime-integrity @extended', async ({e}) => {
  await prepareProfile(e,'HISTORY');
  const before = await snapshot(e);
  const runtime = new pg.Pool({connectionString:e.url('academix_runtime')});
  const client = await runtime.connect();
  const denied = async (sql: string, values: unknown[] = []) => {
    await client.query('BEGIN');
    try {
      await client.query("SELECT set_config('academix.institution_id',$1,true),set_config('academix.actor_id',$2,true)",[e.data.tenants.uc,e.data.actors.AO.id]);
      await expect(client.query(sql,values)).rejects.toMatchObject({code:expect.stringMatching(/^(23503|23514|42501)$/)});
    } finally {await client.query('ROLLBACK');}
  };
  try {
    await denied('INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,$4)',[e.id('bad-fk'),e.data.tenants.uc,e.data.courses.F1,'cross']);
    await denied('INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,$4)',[e.id('bad-rls'),e.data.tenants.utfsm,e.data.courses.F1,'cross']);
    await denied("UPDATE grades SET grade_value=7 WHERE student_id=$1",[e.data.actors.ST1.id]);
    await denied('DELETE FROM grades WHERE student_id=$1',[e.data.actors.ST1.id]);
    await denied("UPDATE quiz_attempts SET answers='[]' WHERE student_id=$1",[e.data.actors.ST1.id]);
    await denied('DELETE FROM quiz_attempts WHERE student_id=$1',[e.data.actors.ST1.id]);
    await denied("UPDATE audit_events SET action='tampered'");
    await denied('DELETE FROM audit_events');
  } finally {client.release();await runtime.end();}
  expect(await snapshot(e)).toEqual(before);
});

test('E2E-OPS-007 submit rollback and same key recovery / transaction-rollback @extended', async ({e}) => {
  const {attempt} = await prepareProfile(e,'ACTIVE');
  const api = await e.api('ST1');
  status(await api.put(`quiz-attempts/${attempt.id}/answers`,{answers:e.answers()}),200);
  const before = await snapshot(e), key = e.key();
  const lock = await e.pool.connect();
  try {
    await lock.query('BEGIN');
    await lock.query('LOCK TABLE public.audit_events IN ACCESS EXCLUSIVE MODE');
    status(await api.post(`quiz-attempts/${attempt.id}/submit`,undefined,key),500);
  } finally {await lock.query('ROLLBACK');lock.release();}
  expect(await snapshot(e)).toEqual(before);
  const receipt = status(await api.post(`quiz-attempts/${attempt.id}/submit`,undefined,key),200).body;
  expect(receipt).toMatchObject({id:attempt.id,status:'graded'});
  expect(status(await api.post(`quiz-attempts/${attempt.id}/submit`,undefined,key),200).body).toEqual(receipt);
  expect(await e.count('grades')).toBe(1);
  expect(await e.count('quiz_attempts',"status='submitted'")).toBe(0);
  expect(await e.count('audit_events',"action='attempt.graded'")).toBe(1);
});

test('E2E-OPS-008 rejects external targets before IO / rejected-targets @extended', async ({}) => {
  for (const key of ['E2E_BASE_URL','E2E_API_URL','E2E_DATABASE_URL','E2E_RUNTIME_DATABASE_URL']) {
    for (const value of ['https://production.invalid','postgresql://synthetic@production.invalid/live']) {
      expect(()=>preflight({[key]:value})).toThrow(/forbidden/);
      await expect(command(process.execPath,['--import','tsx','runner/run.ts'],{[key]:value},join(import.meta.dirname,'..'))).rejects.toThrow(/forbidden/);
    }
  }
});

test('E2E-OPS-008 allowed DB requires ownership and preserves foreign resource / owned-target @extended', async ({e}) => {
  await e.assertOwned();
  await stop(e.app!.child);
  const sibling = new Environment(e.namespace+'a');
  await sibling.start();
  await writeFile(join(e.pgFolder,'owner'),'wrong-owner');
  try {await expect(sibling.assertOwned()).rejects.toThrow(/ownership/);
    await expect(sibling.close()).rejects.toThrow(/ownership/);}
  finally {await writeFile(join(e.pgFolder,'owner'),e.runId);await sibling.close();}
  await ready(apiBase+'/ready',e.app?.child).catch(async()=>{await e.restartApi();});
  expect((await e.pool.query('SELECT current_database() AS name')).rows[0].name).toBe(e.dbName);
});

test('E2E-OPS-009 fresh baseline after owned teardown / fresh-baseline @extended', async ({e}) => {
  await prepareProfile(e,'HISTORY');
  await e.close();
  const control = new pg.Pool({connectionString:e.url('postgres','postgres')});
  try {expect((await control.query('SELECT datname FROM pg_database WHERE datname=$1',[e.dbName])).rowCount).toBe(0);}
  finally {await control.end();}
  const fresh = new Environment(e.namespace+'b');
  try {
    await fresh.start();
    expect(await fresh.count('quiz_attempts')).toBe(0);
    expect(await fresh.count('grades')).toBe(0);
    expect(await fresh.count('grade_publications')).toBe(0);
    expect(await fresh.count('courses')).toBe(7);
  } finally {await fresh.close();}
});
