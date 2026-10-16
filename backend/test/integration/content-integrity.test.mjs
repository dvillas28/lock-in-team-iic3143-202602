import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {database,cli} from './helpers.mjs';
import {contentFixture,users} from './content-fixtures.mjs';
test('content foundation: tenant FKs, checks, deferred swap and migration repeat preserve prior tables',async()=>{
 const pool=await database();try {
  const f=await contentFixture(pool,true);
  const before=await Promise.all(['courses','sections','enrollments','audit_events'].map(async t=>(await pool.query(`SELECT * FROM ${t} ORDER BY id`)).rows));
  for(const [sql,args] of [
   ['INSERT INTO course_modules(id,institution_id,course_id,title,position) VALUES($1,$2,$3,\u0027x\u0027,1)',[randomUUID(),f.tenants.utfsm,f.own]],
   ['UPDATE course_modules SET position=0 WHERE id=$1',[f.modules[0]]],
   ['UPDATE course_modules SET title=\u0027 \u0027 WHERE id=$1',[f.modules[0]]],
   ['UPDATE course_modules SET position=2 WHERE id=$1',[f.modules[0]]],
   ['UPDATE materials SET institution_id=$1 WHERE id=$2',[f.tenants.utfsm,f.materials[0]]],
   ['UPDATE materials SET created_by=$1 WHERE id=$2',[users.foreign,f.materials[0]]],
   ['UPDATE materials SET kind=\u0027file\u0027 WHERE id=$1',[f.materials[0]]],
   ['UPDATE materials SET markdown_body=$1 WHERE id=$2',['a'.repeat(10001),f.materials[0]]],
   ['UPDATE materials SET markdown_body=\u0027 \u0027 WHERE id=$1',[f.materials[0]]],
  ])await assert.rejects(pool.query(sql,args));
  const c=await pool.connect();try{await c.query('BEGIN');await c.query('SET CONSTRAINTS course_modules_position_key DEFERRED');
   await c.query('UPDATE course_modules SET position=CASE position WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE position END WHERE institution_id=$1',[f.tenants.uc]);await c.query('COMMIT');
  }finally{await c.query('ROLLBACK');c.release();}
  assert.equal((await cli('commands/migrate').result).code,0);
  assert.deepEqual(await Promise.all(['courses','sections','enrollments','audit_events'].map(async t=>(await pool.query(`SELECT * FROM ${t} ORDER BY id`)).rows)),before);
 }finally{await pool.end();}
});

test('content migration upgrades populated courses/audit unchanged and down is checked only on empty exclusive DB',async()=>{
 const {mkdtemp,copyFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {reset,testUrl,secrets}=await import('./helpers.mjs');
 const migration=await import('../../dist/commands/migrate.js');
 const {runner}=await import('node-pg-migrate');
 const dir=await mkdtemp(join(tmpdir(),'content-upgrade-')),pool=await database(),saved=process.env.DATABASE_URL;
 try {
  await reset(pool);process.env.DATABASE_URL=testUrl();
  for(const file of ['20261015000100_institutional-foundation.sql','20261015000400_unique_login_email.sql','20261016000100_courses_roles.sql'])await copyFile(new URL('../../migrations/'+file,import.meta.url),join(dir,file));
  await migration.default.migrate(dir);assert.equal((await cli('seeds/demo',secrets()).result).code,0);
  const tenant=(await pool.query("SELECT id FROM institutions WHERE slug='uc'")).rows[0].id,course=randomUUID(),section=randomUUID(),enrollment=randomUUID();
  await pool.query('INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,\u0027M\u0027,\u0027Migration\u0027,\u00272026-2\u0027,$3)',[course,tenant,users.owner]);
  await pool.query('INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,\u00271\u0027)',[section,tenant,course]);
  await pool.query('INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,\u0027teacher\u0027)',[enrollment,tenant,section,users.owner]);
  await pool.query('INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,changes) VALUES($1,$2,$3,\u0027course.created\u0027,\u0027course\u0027,$4,$4,$5)',[randomUUID(),tenant,users.owner,course,{before:null,after:{name:'Migration'}}]);
  const tables=['users','institutions','institution_memberships','courses','sections','enrollments','audit_events'];
  const snapshot=async()=>Promise.all(tables.map(async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows));
  const before=await snapshot();assert.deepEqual(await migration.default.migrate(),{created:1,existing:3});assert.deepEqual(await snapshot(),before);
  assert.deepEqual(await migration.default.migrate(),{created:0,existing:4});assert.deepEqual(await snapshot(),before);
  // Destructive down is deliberately restricted to a freshly reset, data-free _test database.
  await reset(pool);await migration.default.migrate();
  for(const table of tables)assert.equal((await pool.query(`SELECT * FROM ${table}`)).rowCount,0);
  const c=await pool.connect();try{
   const down=await runner({dbClient:c,schema:"public",migrationsSchema:"public",migrationsTable:"pgmigrations",dir:new URL('../../migrations/',import.meta.url).pathname,direction:'down',count:1,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});assert.equal(down.length,1);
  }finally{c.release();}
  assert.deepEqual((await pool.query("SELECT to_regclass('public.course_modules') AS modules,to_regclass('public.materials') AS materials")).rows,[{modules:null,materials:null}]);
  assert.deepEqual(await migration.default.migrate(),{created:1,existing:3});
 }finally{if(saved===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=saved;await rm(dir,{recursive:true,force:true});await pool.end();}
});
