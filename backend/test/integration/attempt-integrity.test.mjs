import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {database,cli,http} from './helpers.mjs';
import {attemptFixture,users} from './attempt-fixtures.mjs';
test('attempt SQL integrity: tenant FKs, serial uniqueness, state consistency and terminal immutability',async()=>{
 const pool=await database();try{
  const f=await attemptFixture(pool),id=await f.create();
  for(const [sql,args] of [
   ['UPDATE quiz_attempts SET section_id=$1 WHERE id=$2',[f.s4,id]],
   ['UPDATE quiz_attempts SET quiz_id=$1 WHERE id=$2',[f.quizzes.foreign,id]],
   ['UPDATE quiz_attempts SET student_id=$1 WHERE id=$2',[users.foreign,id]],
   ["UPDATE quiz_attempts SET status='graded' WHERE id=$1",[id]],
   ['UPDATE quiz_attempts SET attempt_number=0 WHERE id=$1',[id]],
   ["UPDATE quiz_attempts SET answers='{}' WHERE id=$1",[id]],
   ['DELETE FROM quiz_attempts WHERE id=$1',[id]],
   ["UPDATE quizzes SET questions='[]' WHERE id=$1",[f.quizzes.section]],
  ])await assert.rejects(pool.query(sql,args));
  await assert.rejects(f.create({number:2}));await assert.rejects(f.create());
  const c=await pool.connect();try{
   await c.query('BEGIN');await c.query("UPDATE quiz_attempts SET status='submitted',submitted_at=now(),submit_key='pending' WHERE id=$1",[id]);
   await assert.rejects(c.query('COMMIT'));assert.equal((await pool.query('SELECT status FROM quiz_attempts WHERE id=$1',[id])).rows[0].status,'in_progress');
  }finally{await c.query('ROLLBACK');c.release();}
  await pool.query("UPDATE quiz_attempts SET status='cancelled',cancelled_at=now() WHERE id=$1",[id]);
  await assert.rejects(pool.query("UPDATE quiz_attempts SET answers='[]' WHERE id=$1",[id]));
  const next=await f.create({number:2});assert.ok(next);
  const terminal=await f.create({number:3,status:'graded'});
  const item=(await pool.query('SELECT id FROM grade_items WHERE quiz_id=$1',[f.quizzes.section])).rows[0].id;
  const insert=async(gradeItem,quiz,student,section,attempt)=>pool.query(`INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value)
   VALUES($1,$2,$3,$4,$5,$6,$7,0,1)`,[randomUUID(),f.tenants.uc,gradeItem,quiz,student,section,attempt]);
  for(const args of [[item,f.quizzes.foreign,users.revoked,f.s1,terminal],[item,f.quizzes.section,users.foreign,f.s1,terminal],
   [item,f.quizzes.section,users.revoked,f.s2,terminal],[randomUUID(),f.quizzes.section,users.revoked,f.s1,terminal]])await assert.rejects(insert(...args));
  await insert(item,f.quizzes.section,users.revoked,f.s1,terminal);
  await assert.rejects(insert(item,f.quizzes.section,users.revoked,f.s1,terminal));
  await assert.rejects(pool.query('DELETE FROM grades'));
  await pool.query('UPDATE grades SET published_at=now()');
  for(const sql of ['UPDATE grades SET grade_value=7','UPDATE grades SET published_at=NULL','DELETE FROM grades'])await assert.rejects(pool.query(sql));
  assert.equal((await cli('commands/migrate').result).code,0);
  assert.equal((await pool.query('SELECT * FROM quiz_attempts')).rowCount,3);
 }finally{await pool.end();}
});
test('attempt migration upgrades populated authoring data, repeats, restarts and fails readiness without a required column',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);
  const {runner}=await import('node-pg-migrate'),c=await pool.connect();
  const parentTables=['users','institutions','institution_memberships','courses','sections','enrollments','quizzes','grade_items','audit_events'];
  const snapshot=()=>Promise.all(parentTables.map(async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows));
  const parent=await snapshot();
  try{await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir:new URL('../../migrations/',import.meta.url).pathname,direction:'down',count:1,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});}finally{c.release();}
  assert.equal((await pool.query("SELECT to_regclass('public.quiz_attempts') AS table")).rows[0].table,null);
  assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await snapshot(),parent);
  const id=await f.create();
  const before=(await pool.query('SELECT * FROM quiz_attempts')).rows;
  assert.equal((await cli('commands/migrate').result).code,0);
  app=await http();assert.equal((await fetch(app.base+'/ready')).status,200);await app.close();app=await http();
  assert.deepEqual((await pool.query('SELECT * FROM quiz_attempts')).rows,before);
  assert.equal((await pool.query('SELECT * FROM quizzes WHERE id=$1',[f.quizzes.section])).rowCount,1);
  await pool.query('ALTER TABLE quiz_attempts RENAME COLUMN start_key TO unavailable_key');
  assert.equal((await fetch(app.base+'/ready')).status,503);
  await pool.query('ALTER TABLE quiz_attempts RENAME COLUMN unavailable_key TO start_key');
  assert.equal((await fetch(app.base+'/ready')).status,200);assert.ok(id);
 }finally{if(app)await app.close();await pool.end();}
});
