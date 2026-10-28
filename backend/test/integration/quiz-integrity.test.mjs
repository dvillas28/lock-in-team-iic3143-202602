import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {quizFixture,tokens,request,question,queued,snapshot} from './quiz-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
async function freeze(pool,course) {
 const c=await pool.connect();try{
  await c.query('BEGIN');await c.query('SELECT * FROM public.courses WHERE id=$1 FOR UPDATE',[course]);
  await c.query('UPDATE courses SET grade_items_locked_at=clock_timestamp() WHERE id=$1',[course]);await c.query('COMMIT');
  return {status:200};
 }finally{await c.query('ROLLBACK');c.release();}
}
test('US1 all writes roll back with audit failure, and published state remains immutable',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool,true);app=await http();const t=await tokens(app,f),path='uc/quizzes/'+f.quizzes.draft;
  for(const [p,method,body] of [[`uc/courses/${f.own}/quizzes`,'POST',{title:'new',sectionId:f.s1,questions:[question]}],
   [path,'PATCH',{title:'new'}],[path,'PATCH',{sectionId:f.s2}],[path+'/publish','POST']]){
   const before=await snapshot(pool);await failAudit(pool);
   try{assert.equal((await request(app,t.teacher,p,method,body)).status,500);}finally{await restoreAudit(pool);}
   assert.deepEqual(await snapshot(pool),before);
  }
  assert.equal((await request(app,t.teacher,path+'/publish','POST')).status,200);
  const before=await snapshot(pool);
  for(const body of [{questions:[]},{maxAttempts:2},{sectionId:f.s2},{title:'Control'}])
   assert.equal((await request(app,t.teacher,path,'PATCH',body)).status,409);
  assert.deepEqual(await snapshot(pool),before);
  assert.equal((await pool.query("SELECT * FROM pg_stat_activity WHERE datname=current_database() AND application_name='academix-http' AND state='idle in transaction'")).rowCount,0);
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 concurrent publications and both PATCH/publication orders have serial outcomes',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool);app=await http();const t=await tokens(app,f);
  let id=await f.make(),path='uc/quizzes/'+id;
  const published=await queued(pool,f.own,()=>request(app,t.teacher,path+'/publish','POST'),()=>request(app,t.owner,path+'/publish','POST'));
  assert.deepEqual(published.map(r=>r.status),[200,200]);assert.deepEqual(published[0].body,published[1].body);
  assert.equal((await pool.query('SELECT * FROM grade_items WHERE quiz_id=$1',[id])).rowCount,1);
  assert.equal((await pool.query("SELECT * FROM audit_events WHERE action='quiz.published'")).rowCount,1);
  for(const first of ['patch','publish']){
   id=await f.make();path='uc/quizzes/'+id;
   const patch=()=>request(app,t.teacher,path,'PATCH',{sectionId:f.s2,title:'Edited'});
   const publish=()=>request(app,t.teacher,path+'/publish','POST');
   const result=await queued(pool,f.own,first==='patch'?patch:publish,first==='patch'?publish:patch);
   assert.deepEqual(result.map(r=>r.status),first==='patch'?[200,200]:[200,409]);
   assert.equal((await pool.query('SELECT title FROM quizzes WHERE id=$1',[id])).rows[0].title,first==='patch'?'Edited':'Control');
  }
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 first-grade freeze protocol vs quiz publication works in both lock orders and rollback',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool);app=await http();const t=await tokens(app,f);
  // Different courses keep the monotonic marker intact between scenarios.
  for(const first of ['publish','freeze']){
   const course=first==='publish'?f.own:f.other,section=first==='publish'?f.s1:f.s3;
   const id=await f.make({course,section}),publish=()=>request(app,t.owner,'uc/quizzes/'+id+'/publish','POST');
   const result=await queued(pool,course,first==='publish'?publish:()=>freeze(pool,course),first==='publish'?()=>freeze(pool,course):publish);
   assert.deepEqual(result.map(r=>r.status),first==='publish'?[200,200]:[200,409]);
   assert.equal((await pool.query('SELECT * FROM grade_items WHERE quiz_id=$1',[id])).rowCount,first==='publish'?1:0);
   if(first==='publish')assert.equal((await publish()).status,200);
  }
  const c=await pool.connect();try{
   await c.query('BEGIN');await c.query('SELECT * FROM courses WHERE id=$1 FOR UPDATE',[f.foreign]);
   await c.query('UPDATE courses SET grade_items_locked_at=now() WHERE id=$1',[f.foreign]);await c.query('ROLLBACK');
   assert.equal((await pool.query('SELECT grade_items_locked_at FROM courses WHERE id=$1',[f.foreign])).rows[0].grade_items_locked_at,null);
  }finally{c.release();}
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 database freeze constraint maps only its own error to conflict and preserves atomic state',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool);app=await http();const t=await tokens(app,f),id=await f.make();
  for(const [code,constraint,status] of [['23514','grade_items_course_frozen',409],['23514','other_check',422],['XX000','unexpected',500]]){
   await pool.query(`CREATE FUNCTION quiz_insert_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    RAISE EXCEPTION 'private sentinel correct answer' USING ERRCODE='${code}',CONSTRAINT='${constraint}'; END $$;
    CREATE TRIGGER aaa_quiz_insert_fault BEFORE INSERT ON grade_items FOR EACH ROW EXECUTE FUNCTION quiz_insert_fault()`);
   const before=await snapshot(pool);
   try{
    const result=await request(app,t.owner,'uc/quizzes/'+id+'/publish','POST');
    assert.equal(result.status,status);assert.equal(JSON.stringify(result.body).includes('private sentinel'),false);
    assert.deepEqual(await snapshot(pool),before);
   }finally{await pool.query('DROP TRIGGER aaa_quiz_insert_fault ON grade_items; DROP FUNCTION quiz_insert_fault()');}
  }
 }finally{if(app)await app.close();await pool.end();}
});
