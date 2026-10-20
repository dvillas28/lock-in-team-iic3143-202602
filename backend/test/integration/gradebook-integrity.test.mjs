import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http,cli} from './helpers.mjs';
import {gradebookFixture,users,snapshot} from './gradebook-fixtures.mjs';
test('SQL enforces item identity, freeze, published-grade and receipt immutability and tenant FKs',async()=>{
 const pool=await database();let app;try{
  const f=await gradebookFixture(pool),g=f.grades[0],item=f.items.section;
  const emptyQuiz=await f.make({published:true}),emptyItem=(await pool.query('SELECT id FROM grade_items WHERE quiz_id=$1',[emptyQuiz])).rows[0].id;
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
   ['UPDATE grade_items SET weight_percent=0 WHERE id=$1',[item]],
   ['DELETE FROM grade_items WHERE id=$1',[f.items.global]],
   ["INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,'new')",[randomUUID(),f.tenants.uc,f.own,f.quizzes.draft]],
   ['UPDATE grades SET grade_value=7 WHERE id=$1',[g.id]],['UPDATE grades SET published_at=NULL WHERE id=$1',[g.id]],['DELETE FROM grades WHERE id=$1',[g.id]],
  ])await assert.rejects(pool.query(sql,args));
  await assert.rejects(pool.query('DELETE FROM grade_items WHERE id=$1',[emptyItem]),/23514/);
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
 const pool=await database();try{
  const f=await gradebookFixture(pool),{runner}=await import('node-pg-migrate'),c=await pool.connect();
  const state=()=>Promise.all(['users','institution_memberships','courses','quiz_attempts','grades','grade_items','audit_events'].map(async table=>(await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows));
  const before=await state();
  try{await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir:new URL('../../migrations/',import.meta.url).pathname,direction:'down',count:2,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});}finally{c.release();}
  assert.equal((await pool.query("SELECT to_regclass('grade_publications') AS t")).rows[0].t,null);
  assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await state(),before);
  assert.equal((await cli('commands/migrate').result).code,0);assert.deepEqual(await state(),before);assert.ok(f.own);
 }finally{await pool.end();}
});
test('upgrade rejects invalid legacy publications atomically without silently repairing history',async()=>{
 const pool=await database();try{
  const f=await gradebookFixture(pool),{runner}=await import('node-pg-migrate'),c=await pool.connect();
  try{await runner({dbClient:c,schema:'public',migrationsSchema:'public',migrationsTable:'pgmigrations',dir:new URL('../../migrations/',import.meta.url).pathname,direction:'down',count:2,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});}finally{c.release();}
  await pool.query('UPDATE grades SET score_percent=99 WHERE id=$1',[f.grades[0].id]);
  await pool.query('UPDATE grades SET published_at=now() WHERE id=$1',[f.grades[0].id]);
  const before=(await pool.query('SELECT * FROM grades ORDER BY id')).rows;
  assert.equal((await cli('commands/migrate').result).code,1);
  assert.deepEqual((await pool.query('SELECT * FROM grades ORDER BY id')).rows,before);
  assert.equal((await pool.query("SELECT to_regclass('grade_publications') AS t")).rows[0].t,null);
  assert.equal((await pool.query('SELECT grade_items_locked_at FROM courses WHERE id=$1',[f.own])).rows[0].grade_items_locked_at,null);
 }finally{await pool.end();}
});
