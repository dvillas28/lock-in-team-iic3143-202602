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

import {http} from './helpers.mjs';
import {tokens,request,waitForLock} from './content-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
const state=async pool=>Promise.all(['course_modules','materials','audit_events'].map(async t=>(await pool.query(`SELECT * FROM ${t} ORDER BY id`)).rows));
test('US1 every mutation rolls back with audit failure; exact reorder snapshots and append-only history',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),module=`uc/modules/${f.modules[0]}`,material=`uc/materials/${f.materials[0]}`,course=`uc/courses/${f.own}/modules`;
  const mutations=[
   [course,'POST',{title:'new',position:10}], [module,'PATCH',{title:'new'}],
   [module+'/publish','POST'],[`uc/modules/${f.modules[2]}/unpublish`,'POST'],
   [course+'/order','PUT',{moduleIds:[...f.modules].reverse()}],
   [module+'/materials','POST',{title:'new',markdownBody:'source'}],
   [material,'PATCH',{markdownBody:'changed'}],[material+'/publish','POST'],
   [`uc/materials/${f.materials[1]}/unpublish`,'POST'],
  ];
  for(const [path,method,body] of mutations) {
   const before=await state(pool);await failAudit(pool);
   try{assert.equal((await request(app,t.teacher,path,method,body)).status,500,path);}finally{await restoreAudit(pool);}
   assert.deepEqual(await state(pool),before,path+' rollback');
  }
  const ids=[...f.modules].reverse();assert.equal((await request(app,t.teacher,course+'/order','PUT',{moduleIds:ids})).status,200);
  const event=(await pool.query("SELECT * FROM audit_events WHERE action='module.reordered'")).rows[0];
  assert.equal(event.resource_type,'course');assert.equal(event.resource_id,f.own);assert.equal(event.course_id,f.own);assert.equal(event.section_id,null);
  assert.deepEqual(event.changes,{before:{modules:f.modules.map((id,i)=>({id,position:i+1}))},after:{modules:ids.map((id,i)=>({id,position:i+1}))}});
  // AuditChanges requires object/null roots; check the canonical schema rather than accepting arrays.
  const {readFile}=await import('node:fs/promises');
  const schema=await readFile(new URL('../../../docs/reference/openapi/components/schemas/audit.yaml',import.meta.url),'utf8');assert.match(schema,/before:\s+type:\s+- object\s+- 'null'/);
  for(const key of ['before','after'])assert.equal(Array.isArray(event.changes[key]),false);
  const edit=await request(app,t.teacher,material,'PATCH',{markdownBody:'historical source'});assert.equal(edit.status,200);
  const history=(await pool.query("SELECT * FROM audit_events WHERE resource_id=$1 AND action='material.updated'",[f.materials[0]])).rows[0];
  assert.equal(history.changes.after.markdownBody,'historical source');assert.equal(history.actor_user_id,users.other);assert.equal(history.section_id,null);
  for(const sql of ["UPDATE audit_events SET action='changed'","DELETE FROM audit_events"])await assert.rejects(pool.query(sql));
  assert.deepEqual((await request(app,t.teacher,`uc/courses/${f.own}/audit-events`)).body.items,[]);
  assert.equal((await request(app,t.student,`uc/courses/${f.own}/audit-events`)).status,403);
  assert.equal((await request(app,t.owner,`uc/courses/${f.own}/audit-events`)).body.items.length,2);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND application_name='academix-http' AND state='idle in transaction'")).rows[0].n,0);
 }finally{if(app)await app.close();await pool.end();}
});
async function queued(pool,course,first,second) {
 const blocker=await pool.connect();let a,b;
 try {
  await blocker.query('BEGIN');await blocker.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[course]);
  a=first();await waitForLock(pool,'SELECT * FROM public.courses%');
  b=second();await waitForLock(pool,'SELECT * FROM public.courses%',2);
  await blocker.query('COMMIT');return await Promise.all([a,b]);
 }finally{await blocker.query('ROLLBACK');blocker.release();await Promise.allSettled([a,b]);}
}
test('US1 publish/unpublish module/material serialize in both lock orders, including audit rollback',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f);
  for(const kind of ['module','material'])for(const first of ['publish','unpublish'])for(const fail of [false,true]) {
   const id=kind==='module'?f.modules[0]:f.materials[0],table=kind==='module'?'course_modules':'materials',path=`uc/${kind}s/${id}`,second=first==='publish'?'unpublish':'publish';
   await pool.query(`UPDATE ${table} SET published_at=${first==='publish'?'NULL':'now()'} WHERE id=$1`,[id]);
   const before=(await pool.query('SELECT * FROM audit_events')).rowCount;
   if(fail)await failAudit(pool,`${kind}.${first==='publish'?'published':'unpublished'}`);
   let results;try {results=await queued(pool,f.own,()=>request(app,t.teacher,path+'/'+first,'POST'),()=>request(app,t.teacher,path+'/'+second,'POST'));}
   finally{if(fail)await restoreAudit(pool);}
   assert.deepEqual(results.map(r=>r.status),[fail?500:200,200]);
   const row=(await pool.query(`SELECT published_at FROM ${table} WHERE id=$1`,[id])).rows[0];assert.equal(row.published_at!==null,second==='publish');
   const events=(await pool.query('SELECT action,changes FROM audit_events ORDER BY occurred_at,id')).rows.slice(before);
   assert.equal(events.length,fail?0:2);
   if(!fail){assert.deepEqual(events.map(e=>e.action),[`${kind}.${first==='publish'?'published':'unpublished'}`,`${kind}.${second==='publish'?'published':'unpublished'}`]);assert.deepEqual(events[1].changes.before,events[0].changes.after);}
  }
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 concurrent creates, complete orders, create/order and edits preserve serial history',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),path=`uc/courses/${f.own}/modules`;
  const creates=await queued(pool,f.own,()=>request(app,t.teacher,path,'POST',{title:'A',position:5}),()=>request(app,t.owner,path,'POST',{title:'B',position:5}));assert.deepEqual(creates.map(r=>r.status),[201,409]);
  let ids=[...f.modules,creates[0].body.id];
  const reverse=[...ids].reverse();
  const orders=await queued(pool,f.own,()=>request(app,t.teacher,path+'/order','PUT',{moduleIds:reverse}),()=>request(app,t.owner,path+'/order','PUT',{moduleIds:ids}));assert.deepEqual(orders.map(r=>r.status),[200,200]);
  const race=await queued(pool,f.own,()=>request(app,t.teacher,path,'POST',{title:'C',position:6}),()=>request(app,t.owner,path+'/order','PUT',{moduleIds:ids}));assert.deepEqual(race.map(r=>r.status),[201,409]);ids.push(race[0].body.id);
  const race2=await queued(pool,f.own,()=>request(app,t.teacher,path+'/order','PUT',{moduleIds:[...ids].reverse()}),()=>request(app,t.owner,path,'POST',{title:'D',position:7}));assert.deepEqual(race2.map(r=>r.status),[200,201]);
  const material=`uc/materials/${f.materials[0]}`;
  const edits=await queued(pool,f.own,()=>request(app,t.teacher,material,'PATCH',{title:'First'}),()=>request(app,t.owner,material,'PATCH',{markdownBody:'Second'}));assert.deepEqual(edits.map(r=>r.status),[200,200]);
  assert.equal(edits[1].body.title,'First');assert.equal(edits[1].body.markdownBody,'Second');
  const events=(await pool.query("SELECT changes FROM audit_events WHERE action='material.updated' ORDER BY occurred_at,id")).rows;
  assert.deepEqual(events[1].changes.before,events[0].changes.after);
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 revocation before write denies; waiting revocation commits after authorized write',async()=>{
 const pool=await database();let app;const blocker=await pool.connect();try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),path=`uc/modules/${f.modules[0]}`;
  await blocker.query('BEGIN');await blocker.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.other]);
  let pending=request(app,t.teacher,path,'PATCH',{title:'denied'});await waitForLock(pool,'%public.enrollments%');await blocker.query('COMMIT');assert.equal((await pending).status,404);
  await pool.query("UPDATE enrollments SET active=true WHERE user_id=$1 AND role='teacher'",[users.other]);
  await blocker.query('BEGIN');await blocker.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[f.own]);
  pending=request(app,t.teacher,path,'PATCH',{title:'commits'});await waitForLock(pool,'SELECT * FROM public.courses%');
  const revoke=pool.query('UPDATE institution_memberships SET active=false WHERE user_id=$1 AND institution_id=$2',[users.other,f.tenants.uc]);await waitForLock(pool,'UPDATE institution_memberships%');
  await blocker.query('COMMIT');assert.equal((await pending).status,200);await revoke;
  assert.equal((await request(app,t.teacher,path,'PATCH',{title:'denied'})).status,404);
  assert.equal((await pool.query('SELECT * FROM audit_events')).rowCount,1);
 }finally{await blocker.query('ROLLBACK');blocker.release();if(app)await app.close();await pool.end();}
});

test('content migration upgrades populated courses/audit unchanged and down is checked only on empty exclusive DB',async()=>{
 const {mkdtemp,copyFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {reset,testUrl,secrets}=await import('./helpers.mjs');
 const migration=await import('../../dist/commands/migrate.js');
 const {runner}=await import('node-pg-migrate');
 const dir=await mkdtemp(join(tmpdir(),'content-upgrade-')),pool=await database(),saved=process.env.MIGRATION_DATABASE_URL;
 try {
  await reset(pool);process.env.MIGRATION_DATABASE_URL=testUrl();
  for(const file of ['20261015000100_institutional-foundation.sql','20261015000400_unique_login_email.sql','20261016000100_courses_roles.sql'])await copyFile(new URL('../../migrations/'+file,import.meta.url),join(dir,file));
  await migration.default.migrate(dir);assert.equal((await cli('seeds/demo',secrets()).result).code,0);
  const tenant=(await pool.query("SELECT id FROM institutions WHERE slug='uc'")).rows[0].id,course=randomUUID(),section=randomUUID(),enrollment=randomUUID();
  await pool.query('INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,\u0027M\u0027,\u0027Migration\u0027,\u00272026-2\u0027,$3)',[course,tenant,users.owner]);
  await pool.query('INSERT INTO sections(id,institution_id,course_id,code) VALUES($1,$2,$3,\u00271\u0027)',[section,tenant,course]);
  await pool.query('INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,\u0027teacher\u0027)',[enrollment,tenant,section,users.owner]);
  await pool.query('INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,changes) VALUES($1,$2,$3,\u0027course.created\u0027,\u0027course\u0027,$4,$4,$5)',[randomUUID(),tenant,users.owner,course,{before:null,after:{name:'Migration'}}]);
  const tables=['users','institutions','institution_memberships','courses','sections','enrollments','audit_events'];
  const snapshot=async()=>Promise.all(tables.map(async table=>(await pool.query(`SELECT to_jsonb(t)-'grade_items_locked_at' AS row FROM ${table} t ORDER BY id`)).rows));
  const before=await snapshot();assert.deepEqual(await migration.default.migrate(),{created:8,existing:3});assert.deepEqual(await snapshot(),before);
  assert.deepEqual(await migration.default.migrate(),{created:0,existing:11});assert.deepEqual(await snapshot(),before);
  // Destructive down is deliberately restricted to a freshly reset, data-free _test database.
  await reset(pool);await migration.default.migrate();
  for(const table of tables)assert.equal((await pool.query(`SELECT * FROM ${table}`)).rowCount,0);
  const c=await pool.connect();try{
   const down=await runner({dbClient:c,schema:"public",migrationsSchema:"public",migrationsTable:"pgmigrations",dir:new URL('../../migrations/',import.meta.url).pathname,direction:'down',count:8,singleTransaction:true,logger:{debug(){},info(){},warn(){},error(){}}});assert.equal(down.length,8);
  }finally{c.release();}
  assert.deepEqual((await pool.query("SELECT to_regclass('public.course_modules') AS modules,to_regclass('public.materials') AS materials")).rows,[{modules:null,materials:null}]);
  assert.deepEqual(await migration.default.migrate(),{created:8,existing:3});
 }finally{if(saved===undefined)delete process.env.MIGRATION_DATABASE_URL;else process.env.MIGRATION_DATABASE_URL=saved;await rm(dir,{recursive:true,force:true});await pool.end();}
});
