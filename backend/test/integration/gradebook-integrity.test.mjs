import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http,cli,login} from './helpers.mjs';
import {gradebookFixture,users,snapshot} from './gradebook-fixtures.mjs';
test('SQL enforces item identity, published-grade and receipt immutability and tenant FKs',async()=>{
 const pool=await database();let app;try{
  const f=await gradebookFixture(pool),g=f.grades[0],item=f.items.section;
  for(const [sql,args] of [
   ['UPDATE grade_items SET id=$1 WHERE id=$2',[randomUUID(),item]],
   ['UPDATE grade_items SET course_id=$1 WHERE id=$2',[f.other,item]],
   ['UPDATE grade_items SET quiz_id=$1 WHERE id=$2',[f.quizzes.draft,item]],
   ['UPDATE grades SET section_id=$1 WHERE id=$2',[f.s4,g.id]],
   ["UPDATE grades SET score_percent=99,published_at=now() WHERE id=$1",[g.id]],
  ])await assert.rejects(pool.query(sql,args));
  await pool.query('UPDATE grades SET published_at=now(),updated_at=now() WHERE id=$1',[g.id]);
  const before=await snapshot(pool);
  for(const [sql,args] of [
   ['DELETE FROM grade_items WHERE id=$1',[f.items.global]],
   ['UPDATE grades SET grade_value=7 WHERE id=$1',[g.id]],['UPDATE grades SET published_at=NULL WHERE id=$1',[g.id]],['DELETE FROM grades WHERE id=$1',[g.id]],
  ])await assert.rejects(pool.query(sql,args));
  assert.deepEqual(await snapshot(pool),before);
  const insert=(tenant=f.tenants.uc,course=f.own)=>pool.query(`INSERT INTO grade_publications(id,institution_id,course_id,actor_user_id,idempotency_key,request,published_count,published_at)
   VALUES($1,$2,$3,$4,'key',$5,1,now())`,[randomUUID(),tenant,course,users.owner,{gradeItemIds:[item],sectionIds:[f.s1],studentIds:[users.revoked]}]);
  await assert.rejects(insert(f.tenants.uc,f.foreign));await insert();await assert.rejects(insert());
  for(const sql of ["UPDATE grade_publications SET idempotency_key='new'",'DELETE FROM grade_publications'])await assert.rejects(pool.query(sql));
  const persisted=await snapshot(pool);assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await snapshot(pool),persisted);
  app=await http();assert.equal((await fetch(app.base+'/ready')).status,200);await app.close();app=await http();assert.deepEqual(await snapshot(pool),persisted);
  const health=await (await fetch(app.base+'/health')).json();for(const key of ['status','version','commit','deployedAt','timestamp'])assert.ok(key in health);
  await pool.query('ALTER TABLE grade_publications RENAME COLUMN request TO unavailable_request');assert.equal((await fetch(app.base+'/ready')).status,503);
  await pool.query('ALTER TABLE grade_publications RENAME COLUMN unavailable_request TO request');assert.equal((await fetch(app.base+'/ready')).status,200);
 }finally{if(app)await app.close();await pool.end();}
});
test('publication migration upgrades populated attempts and grades without rewriting academic history',async()=>{
 const pool=await database();let f;
 try{
  f=await historicalPublicationFixture(pool);const {runner}=await import('node-pg-migrate'),c=await pool.connect();
  const state=()=>Promise.all(['users','institution_memberships','courses','quiz_attempts','grades','grade_items','audit_events'].map(async table=>(await pool.query(`SELECT to_jsonb(t)-ARRAY['bio','avatar_key','credential_version','gradebook_grouped','gradebook_version','group_id','max_points','assignment_id'] AS row FROM ${table} t ORDER BY id`)).rows));
  const before=await state();
  try{const down=await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir:f.dir,direction:'down',count:5,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});assert.equal(down.length,5);}finally{c.release();}
  assert.equal((await pool.query("SELECT to_regclass('grade_publications') AS t")).rows[0].t,null);
  assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await state(),before);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM pgmigrations')).rows[0].count,19);
  assert.ok((await pool.query('SELECT bio,avatar_key,credential_version FROM users')).rows.every(row=>row.bio===null&&row.avatar_key===null&&row.credential_version===0));
  assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await state(),before);
 }finally{if(f)await f.close();await pool.end();}
});
test('upgrade rejects invalid legacy publications atomically without silently repairing history',async()=>{
 const pool=await database();let f;
 try{
  f=await historicalPublicationFixture(pool);const {runner}=await import('node-pg-migrate'),c=await pool.connect();
  try{const down=await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir:f.dir,direction:'down',count:5,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});assert.equal(down.length,5);}finally{c.release();}
  await pool.query('UPDATE grades SET score_percent=99 WHERE id=$1',[f.grade]);
  await pool.query('UPDATE grades SET published_at=now() WHERE id=$1',[f.grade]);
  const before=(await pool.query('SELECT * FROM grades ORDER BY id')).rows;
  assert.equal((await cli('commands/migrate').result).code,1);
  assert.deepEqual((await pool.query('SELECT * FROM grades ORDER BY id')).rows,before);
  assert.equal((await pool.query("SELECT to_regclass('grade_publications') AS t")).rows[0].t,null);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM pgmigrations')).rows[0].count,6);
  assert.equal((await pool.query('SELECT grade_items_locked_at FROM courses WHERE id=$1',[f.own])).rows[0].grade_items_locked_at,null);
 }finally{if(f)await f.close();await pool.end();}
});

async function historicalPublicationFixture(pool) {
 const {mkdtemp,copyFile,readdir,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {reset,testUrl,secrets}=await import('./helpers.mjs'),migration=await import('../../dist/commands/migrate.js');
 const {question}=await import('./quiz-fixtures.mjs');
 const dir=await mkdtemp(join(tmpdir(),'publication-upgrade-')),saved=process.env.MIGRATION_DATABASE_URL;
 const close=async()=>{if(saved===undefined)delete process.env.MIGRATION_DATABASE_URL;else process.env.MIGRATION_DATABASE_URL=saved;await rm(dir,{recursive:true,force:true});};
 try{
  // Pin only the eleven reversible historical migrations; account data is never rolled back.
  const files=(await readdir(new URL('../../migrations/',import.meta.url))).filter(file=>/^\d+.*\.sql$/.test(file)&&file<'20261107000100').sort();
  assert.equal(files.length,11);
  for(const file of files)await copyFile(new URL('../../migrations/'+file,import.meta.url),join(dir,file));
  await reset(pool);process.env.MIGRATION_DATABASE_URL=testUrl();
  assert.deepEqual(await migration.default.migrate(dir),{created:11,existing:0});
  const env=secrets();assert.equal((await cli('seeds/demo',env).result).code,0);
  const tenant=(await pool.query("SELECT id FROM institutions WHERE slug='uc'")).rows[0].id;
  const own=randomUUID(),section=randomUUID(),quiz=randomUUID(),item=randomUUID(),attempt=randomUUID(),grade=randomUUID(),questionId=randomUUID();
  await pool.query("INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,'M','Populated gradebook','2026-2',$3)",[own,tenant,users.owner]);
  await pool.query("INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,'1')",[section,tenant,own]);
  await pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,'student')",[randomUUID(),tenant,section,users.revoked]);
  await pool.query("INSERT INTO quizzes(id,institution_id,course_id,section_id,title,questions,created_by,published_at) VALUES($1,$2,$3,$4,'Populated quiz',$5,$6,now())",[quiz,tenant,own,section,JSON.stringify([{...question,id:questionId}]),users.owner]);
  await pool.query("INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title,weight_percent) VALUES($1,$2,$3,$4,'Populated quiz',100)",[item,tenant,own,quiz]);
  await pool.query("INSERT INTO quiz_attempts(id,institution_id,course_id,quiz_id,section_id,student_id,attempt_number,status,answers,start_key,submit_key,submitted_at,score_points,score_percent,grade_value) VALUES($1,$2,$3,$4,$5,$6,1,'graded',$7,$8,$9,now(),2.5,100,7)",[attempt,tenant,own,quiz,section,users.revoked,JSON.stringify([{questionId,alternativeId:'a'}]),randomUUID(),randomUUID()]);
  await pool.query("INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value) VALUES($1,$2,$3,$4,$5,$6,$7,100,7)",[grade,tenant,item,quiz,users.revoked,section,attempt]);
  return {own,grade,dir,close,env,section,tenant,quiz,item};
 }catch(error){await close();throw error;}
}


test('group migration preserves published legacy averages until the teacher adopts points',async()=>{
 const pool=await database();let f,app;
 try {
  f=await historicalPublicationFixture(pool);
  const {tenant,own,section,quiz,item,grade}=f,secondQuiz=randomUUID(),secondItem=randomUUID(),attempt=randomUUID();
  await pool.query('UPDATE institution_memberships SET active=true WHERE institution_id=$1 AND user_id=$2',[tenant,users.revoked]);
  await pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,'teacher')",
   [randomUUID(),tenant,section,users.owner]);
  await pool.query('UPDATE grade_items SET weight_percent=70 WHERE id=$1',[item]);
  await pool.query(`INSERT INTO quizzes(id,institution_id,course_id,section_id,title,questions,created_by,published_at)
   SELECT $1,institution_id,course_id,section_id,'Legacy quiz',questions,created_by,published_at FROM quizzes WHERE id=$2`,[secondQuiz,quiz]);
  await pool.query(`INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title,weight_percent)
   VALUES($1,$2,$3,$4,'Legacy quiz',30)`,[secondItem,tenant,own,secondQuiz]);
  await pool.query(`INSERT INTO quiz_attempts(id,institution_id,course_id,quiz_id,section_id,student_id,
   attempt_number,status,start_key,submit_key,submitted_at,score_points,score_percent,grade_value)
   VALUES($1,$2,$3,$4,$5,$6,1,'graded',$7,$7,now(),0,0,1)`,[attempt,tenant,own,secondQuiz,section,users.revoked,randomUUID()]);
  await pool.query(`INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value)
   VALUES($1,$2,$3,$4,$5,$6,$7,0,1)`,[randomUUID(),tenant,secondItem,secondQuiz,users.revoked,section,attempt]);
  await pool.query('UPDATE grades SET published_at=now() WHERE grade_item_id=ANY($1::uuid[])',[[item,secondItem]]);
  assert.equal((await pool.query('SELECT published_at FROM grades WHERE id=$1',[grade])).rows[0].published_at instanceof Date,true);
  const read=async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
  const tables=['grades','quiz_attempts','grade_publications','audit_events'];
  const evidence=await Promise.all(tables.map(read));
  const marker=(await pool.query('SELECT grade_items_locked_at FROM courses WHERE id=$1',[own])).rows[0];
  assert.equal((await cli('commands/migrate').result).code,0);
  assert.equal((await cli('commands/provision-runtime').result).code,0);
  assert.deepEqual(await Promise.all(tables.map(read)),evidence);
  assert.deepEqual((await pool.query('SELECT grade_items_locked_at FROM courses WHERE id=$1',[own])).rows[0],marker);
  app=await http();
  const student=await login(app,f.env,'REVOKED'),teacher=await login(app,f.env,'MULTI'),path=`uc/courses/${own}`;
  const {request}=await import('./gradebook-fixtures.mjs');
  const legacy=await request(app,student,path+'/my-grades');
  assert.equal(legacy.status,200);assert.equal(legacy.body.partialAverage,5.2);assert.equal(legacy.body.calculation,'legacy');
  const cfg=(await request(app,teacher,path+'/grade-items')).body;
  const groups=cfg.groups.map(g=>({id:g.id,title:g.title,weightPercent:g.weightPercent,gradeItemIds:[g.id]}));
  assert.equal((await request(app,teacher,path+'/gradebook/groups','PUT',
   {expectedVersion:cfg.version,confirmRecalculation:true,groups})).status,200);
  const points=(await request(app,student,path+'/my-grades')).body;
  assert.equal(points.partialAverage,4.8);
  assert.deepEqual(points.items.map(g=>g.grade),legacy.body.items.map(g=>g.grade));
  assert.deepEqual(await Promise.all(tables.slice(0,3).map(read)),evidence.slice(0,3));
 }finally{if(app)await app.close();if(f)await f.close();await pool.end();}
});
