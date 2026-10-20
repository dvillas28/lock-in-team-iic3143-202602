import test from 'node:test';
import assert from 'node:assert/strict';
import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,selection,coursePath,queued,waitForLock} from './gradebook-fixtures.mjs';
for(const other of ['start','submit','cancel','weights','item'])for(const first of ['publication','other'])test(`HTTP publication vs ${other}, ${first} first, DB lock barrier`,async()=>{
 const pool=await database();let app;try{
  const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),body=selection(f),path=coursePath(f);
  const active=['submit','cancel'].includes(other)?await f.create({number:2}):null;
  const publish=()=>request(app,t.owner,path+'/gradebook/publications','POST',body,'race');
  const operations={
   start:()=>request(app,t.student,f.startPath,'POST',{},'new-start'),
   submit:()=>request(app,t.student,`uc/quiz-attempts/${active}/submit`,'POST',{},'new-submit'),
   cancel:()=>request(app,t.student,`uc/quiz-attempts/${active}/cancel`,'POST'),
   weights:()=>request(app,t.owner,path+'/gradebook/weights','PUT',{items:[{gradeItemId:f.items.section,weightPercent:100},{gradeItemId:f.items.global,weightPercent:0},{gradeItemId:f.items.second,weightPercent:0}]}),
   item:()=>request(app,t.owner,`uc/quizzes/${f.quizzes.draft}/publish`,'POST'),
  };
  const r=await queued(pool,f.own,first==='publication'?publish:operations[other],first==='publication'?operations[other]:publish);
  const expected=first==='publication'?(['submit','cancel'].includes(other)?[409,other==='submit'?200:204]:[200,409]):
   other==='start'?[201,409]:other==='submit'?[200,200]:other==='cancel'?[204,200]:[200,200];
  assert.deepEqual(r.map(v=>v.status),expected);
  assert.equal((await pool.query("SELECT 1 FROM grades g JOIN quiz_attempts a ON a.quiz_id=g.quiz_id AND a.student_id=g.student_id WHERE g.published_at IS NOT NULL AND a.status='in_progress'")).rowCount,0);
 }finally{if(app)await app.close();await pool.end();}
});
for(const same of [true,false])test(`two publication requests ${same?'same':'different'} key serialize atomically`,async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f)+'/gradebook/publications';
 const r=await queued(pool,f.own,()=>request(app,t.owner,path,'POST',selection(f),'A'),()=>request(app,t.owner,path,'POST',selection(f),same?'A':'B'));
 assert.deepEqual(r.map(v=>v.status),same?[200,200]:[200,409]);if(same)assert.deepEqual(r[0].body,r[1].body);
 assert.equal((await pool.query('SELECT * FROM grade_publications')).rowCount,1);assert.equal((await pool.query("SELECT * FROM audit_events WHERE action='grade.published'")).rowCount,1);
 }finally{if(app)await app.close();await pool.end();}
});
test('revoked teacher while waiting Course is rejected after the lock, no publication',async()=>{
 const pool=await database(),blocker=await pool.connect();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f);
 await blocker.query('BEGIN');await blocker.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[f.own]);
 await blocker.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.other]);
 const pending=request(app,t.teacher,coursePath(f)+'/gradebook/publications','POST',selection(f),'revoked');await waitForLock(pool,'SELECT * FROM public.courses%');
 await blocker.query('COMMIT');assert.equal((await pending).status,403);assert.equal((await pool.query('SELECT * FROM grade_publications')).rowCount,0);
 }finally{await blocker.query('ROLLBACK');blocker.release();if(app)await app.close();await pool.end();}
});
for(const ownFirst of [true,false])test(`same actor key across courses, ${ownFirst?'own':'other'} first, receipt barrier`,async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);
 const quiz=await f.make({course:f.other,section:f.s3,published:true});await pool.query('UPDATE grade_items SET weight_percent=100 WHERE quiz_id=$1',[quiz]);
 const g=await f.graded({quiz,section:f.s3});app=await http();const t=await tokens(app,f),second={gradeItemIds:[g.item],sectionIds:[f.s3],studentIds:[users.revoked]};
 await pool.query(`CREATE FUNCTION receipt_barrier() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(902147); RETURN NEW; END $$;
 CREATE TRIGGER receipt_barrier BEFORE INSERT ON grade_publications FOR EACH ROW EXECUTE FUNCTION receipt_barrier()`);
 const blocker=await pool.connect();let a,b,results;
 try{
  await blocker.query('SELECT pg_advisory_lock(902147)');
  const own=()=>request(app,t.owner,coursePath(f)+'/gradebook/publications','POST',selection(f),'cross-course');
  const other=()=>request(app,t.owner,`uc/courses/${f.other}/gradebook/publications`,'POST',second,'cross-course');
  a=(ownFirst?own:other)();await waitForLock(pool,'INSERT INTO public.grade_publications%');
  b=(ownFirst?other:own)();await waitForLock(pool,'INSERT INTO public.grade_publications%',2);
  await blocker.query('SELECT pg_advisory_unlock(902147)');results=await Promise.all([a,b]);
 }finally{await blocker.query('SELECT pg_advisory_unlock_all()');blocker.release();await Promise.allSettled([a,b]);}
 assert.deepEqual(results.map(r=>r.status),[200,409]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await pool.query('SELECT * FROM grade_publications')).rowCount,1);assert.equal((await pool.query('SELECT * FROM grades WHERE published_at IS NOT NULL')).rowCount,1);
 }finally{if(app)await app.close();await pool.end();}
});
