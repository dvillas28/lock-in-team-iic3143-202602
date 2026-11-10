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
  await pool.query("UPDATE quiz_attempts SET status='cancelled',cancelled_at=now() WHERE id=$1",[next]);
  await pool.query('UPDATE grade_items SET weight_percent=CASE WHEN id=$1 THEN 100 ELSE 0 END WHERE course_id=$2',[item,f.own]);
  await pool.query('UPDATE grades SET published_at=now()');
  for(const sql of ['UPDATE grades SET grade_value=7','UPDATE grades SET published_at=NULL','DELETE FROM grades'])await assert.rejects(pool.query(sql));
  assert.equal((await cli('commands/migrate').result).code,0);
  assert.equal((await pool.query('SELECT * FROM quiz_attempts')).rowCount,3);
 }finally{await pool.end();}
});
test('attempt migration upgrades populated authoring data, repeats, restarts and fails readiness without a required column',async()=>{
 const {mkdtemp,copyFile,readdir,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {reset,testUrl,secrets}=await import('./helpers.mjs');
 const {question}=await import('./quiz-fixtures.mjs');
 const migration=await import('../../dist/commands/migrate.js'),{runner}=await import('node-pg-migrate');
 const pool=await database(),dir=await mkdtemp(join(tmpdir(),'authoring-upgrade-')),saved=process.env.MIGRATION_DATABASE_URL;let app;
 try{
  // Build the historical eleven-migration revision first. Never down credential/account migrations.
  const historic=(await readdir(new URL('../../migrations/',import.meta.url))).filter(file=>/^\d+.*\.sql$/.test(file)&&file<'20261107000100').sort();
  assert.equal(historic.length,11);
  for(const file of historic)await copyFile(new URL('../../migrations/'+file,import.meta.url),join(dir,file));
  await reset(pool);process.env.MIGRATION_DATABASE_URL=testUrl();
  assert.deepEqual(await migration.default.migrate(dir),{created:11,existing:0});
  assert.equal((await cli('seeds/demo',secrets()).result).code,0);
  const tenant=(await pool.query("SELECT id FROM institutions WHERE slug='uc'")).rows[0].id;
  const course=randomUUID(),section=randomUUID(),quiz=randomUUID(),item=randomUUID();
  await pool.query("INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,'M','Populated authoring','2026-2',$3)",[course,tenant,users.owner]);
  await pool.query("INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,'1')",[section,tenant,course]);
  await pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,'student')",[randomUUID(),tenant,section,users.revoked]);
  await pool.query("INSERT INTO quizzes(id,institution_id,course_id,section_id,title,questions,created_by,published_at) VALUES($1,$2,$3,$4,'Populated quiz',$5,$6,now())",[quiz,tenant,course,section,JSON.stringify([{...question,id:randomUUID()}]),users.owner]);
  await pool.query("INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,'Populated quiz')",[item,tenant,course,quiz]);
  const parentTables=['users','institutions','institution_memberships','courses','sections','enrollments','quizzes','grade_items','audit_events'];
  const snapshot=()=>Promise.all(parentTables.map(async table=>(await pool.query(`SELECT to_jsonb(t)-ARRAY['bio','avatar_key','credential_version','gradebook_grouped','gradebook_version','group_id','max_points','assignment_id'] AS row FROM ${table} t ORDER BY id`)).rows));
  const parent=await snapshot(),c=await pool.connect();
  try{const down=await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir,direction:'down',count:6,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});assert.equal(down.length,6);}finally{c.release();}
  assert.equal((await pool.query("SELECT to_regclass('public.quiz_attempts') AS table")).rows[0].table,null);
  assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await snapshot(),parent);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM pgmigrations')).rows[0].count,20);
  const profileDefaults=(await pool.query('SELECT bio,avatar_key,credential_version FROM users')).rows;
  assert.ok(profileDefaults.every(row=>row.bio===null&&row.avatar_key===null&&row.credential_version===0));
  const id=randomUUID();
  await pool.query("INSERT INTO quiz_attempts(id,institution_id,course_id,quiz_id,section_id,student_id,attempt_number,status,answers,start_key) VALUES($1,$2,$3,$4,$5,$6,1,'in_progress','[]',$7)",[id,tenant,course,quiz,section,users.revoked,randomUUID()]);
  const before=(await pool.query('SELECT * FROM quiz_attempts')).rows;
  assert.equal((await cli('commands/migrate').result).code,0);
  app=await http();assert.equal((await fetch(app.base+'/ready')).status,200);await app.close();app=await http();
  assert.deepEqual((await pool.query('SELECT * FROM quiz_attempts')).rows,before);
  assert.equal((await pool.query('SELECT * FROM quizzes WHERE id=$1',[quiz])).rowCount,1);
  await pool.query('ALTER TABLE quiz_attempts RENAME COLUMN start_key TO unavailable_key');
  assert.equal((await fetch(app.base+'/ready')).status,503);
  await pool.query('ALTER TABLE quiz_attempts RENAME COLUMN unavailable_key TO start_key');
  assert.equal((await fetch(app.base+'/ready')).status,200);
 }finally{if(app)await app.close();if(saved===undefined)delete process.env.MIGRATION_DATABASE_URL;else process.env.MIGRATION_DATABASE_URL=saved;await rm(dir,{recursive:true,force:true});await pool.end();}
});
