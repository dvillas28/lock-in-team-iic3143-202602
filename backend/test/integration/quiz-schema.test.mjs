import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {database,cli} from './helpers.mjs';
import {quizFixture} from './quiz-fixtures.mjs';
test('quiz schema enforces tenant/course FKs, ranges, unique item and irreversible course freeze',async()=>{
 const pool=await database();try{
  const f=await quizFixture(pool,true),id=f.quizzes.draft;
  for(const [sql,args] of [
   ["UPDATE quizzes SET section_id=$1 WHERE id=$2",[f.s3,id]],["UPDATE quizzes SET institution_id=$1 WHERE id=$2",[f.tenants.utfsm,id]],
   ["UPDATE quizzes SET max_attempts=0 WHERE id=$1",[id]],["UPDATE quizzes SET title=' ' WHERE id=$1",[id]],
   ["UPDATE quizzes SET opens_at=now(),closes_at=now() WHERE id=$1",[id]],
   ["UPDATE quizzes SET questions='{}' WHERE id=$1",[id]],
   ["INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,'x')",[randomUUID(),f.tenants.uc,f.other,id]],
   ["INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,'x')",[randomUUID(),f.tenants.uc,f.own,f.quizzes.section]],
   ["UPDATE grade_items SET weight_percent=101 WHERE quiz_id=$1",[f.quizzes.section]],
  ])await assert.rejects(pool.query(sql,args));
  await pool.query("UPDATE courses SET grade_items_locked_at=clock_timestamp() WHERE id=$1",[f.own]);
  for(const value of [null,'2020-01-01T00:00:00Z'])await assert.rejects(pool.query('UPDATE courses SET grade_items_locked_at=$1 WHERE id=$2',[value,f.own]));
  await assert.rejects(pool.query("INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,'x')",[randomUUID(),f.tenants.uc,f.own,id]));
  assert.equal((await cli('commands/migrate').result).code,0);
  assert.equal((await pool.query('SELECT * FROM quizzes')).rowCount,6);
 }finally{await pool.end();}
});
test('quiz migration upgrades populated #90 unchanged, repeats safely and down only touches exclusive empty DB',async()=>{
 const {mkdtemp,copyFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {reset,testUrl,secrets}=await import('./helpers.mjs'),migration=(await import('../../dist/commands/migrate.js')).default;
 const {runner}=await import('node-pg-migrate');
 const pool=await database(),dir=await mkdtemp(join(tmpdir(),'quiz-upgrade-')),saved=process.env.DATABASE_URL;
 try{
  await reset(pool);process.env.DATABASE_URL=testUrl();
  for(const file of ['20261015000100_institutional-foundation.sql','20261015000400_unique_login_email.sql','20261016000100_courses_roles.sql','20261016000200_modules_material.sql'])
   await copyFile(new URL('../../migrations/'+file,import.meta.url),join(dir,file));
  assert.deepEqual(await migration.migrate(dir),{created:4,existing:0});
  assert.equal((await cli('seeds/demo',secrets()).result).code,0);
  const tenant=(await pool.query("SELECT id FROM institutions WHERE slug='uc'")).rows[0].id;
  const owner='10000000-0000-4000-8000-000000000003',course=randomUUID(),section=randomUUID(),module=randomUUID();
  await pool.query("INSERT INTO courses(id,institution_id,created_by,code,name,term) VALUES($1,$2,$3,'Q','Existing','2026-2')",[course,tenant,owner]);
  await pool.query("INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,'1')",[section,tenant,course]);
  await pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,'teacher')",[randomUUID(),tenant,section,owner]);
  await pool.query("INSERT INTO course_modules(id,institution_id,course_id,title,position) VALUES($1,$2,$3,'Existing',1)",[module,tenant,course]);
  await pool.query("INSERT INTO materials(id,institution_id,module_id,title,markdown_body,created_by) VALUES($1,$2,$3,'Existing','Unchanged',$4)",[randomUUID(),tenant,module,owner]);
  await pool.query("INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,changes) VALUES($1,$2,$3,'course.created','course',$4,$4,$5)",[randomUUID(),tenant,owner,course,{before:null,after:{name:'Existing'}}]);
  const tables=['users','institutions','institution_memberships','courses','sections','enrollments','course_modules','materials','audit_events'];
  const state=()=>Promise.all(tables.map(async table=>(await pool.query(`SELECT to_jsonb(t)-'grade_items_locked_at' AS row FROM ${table} t ORDER BY id`)).rows));
  await copyFile(new URL('../../migrations/20261019000100_quiz_authoring.sql',import.meta.url),join(dir,'20261019000100_quiz_authoring.sql'));
  const before=await state();assert.deepEqual(await migration.migrate(dir),{created:1,existing:4});assert.deepEqual(await state(),before);
  assert.deepEqual(await migration.migrate(dir),{created:0,existing:5});assert.deepEqual(await state(),before);
  assert.equal((await pool.query('SELECT grade_items_locked_at FROM courses WHERE id=$1',[course])).rows[0].grade_items_locked_at,null);
  await reset(pool);await migration.migrate(dir);
  const c=await pool.connect();try{
   const down=await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir,direction:'down',count:1,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});
   assert.equal(down.length,1);
  }finally{c.release();}
  assert.deepEqual((await pool.query("SELECT to_regclass('public.quizzes') AS q,to_regclass('public.grade_items') AS g")).rows,[{q:null,g:null}]);
  assert.deepEqual(await migration.migrate(dir),{created:1,existing:4});
 }finally{if(saved===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=saved;await rm(dir,{recursive:true,force:true});await pool.end();}
});
