import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,request,path,state,question} from './attempt-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
test('US2 independent SQL attempts: exact decimal endpoints, percentage and grade HALF_UP boundaries',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  // Expected constants specified independently from PostgreSQL implementation.
  for(const [score,total,percent,grade,wrong] of [[0,10,'0.00','1.0'],[0,10,'0.00','1.0',true],[6,10,'60.00','4.0'],[10,10,'100.00','7.0'],
   [59.99,100,'59.99','4.0'],[60.01,100,'60.01','4.0'],[1,3,'33.33','2.7'],[1,32,'3.13','1.2'],
   [1,100,'1.00','1.1'],[60.6,100,'60.60','4.0'],[60.67,100,'60.67','4.1'],[59,100,'59.00','4.0'],[58.99,100,'58.99','3.9'],
   // Raw percentage would give 3.9; grading from the rounded 59.00 must give 4.0.
   [58999.99,100000,'59.00','4.0']]){
   const q1={...question,id:randomUUID(),points:score||total},q2={...question,id:randomUUID(),position:2,points:total-score};
   const questions=score===0||score===total?[q1]:[q1,q2],quiz=await f.make({published:true,questions});
   const answers=wrong?[{questionId:q1.id,alternativeId:'b'}]:score===0?[]:[{questionId:q1.id,alternativeId:'a'}],id=await f.create({quiz,answers}),r=await request(app,t.student,path(id)+'/submit','POST',{},randomUUID());
   assert.equal(r.status,200);assert.deepEqual(Object.keys(r.body).sort(),['id','status','submittedAt']);
   const row=(await pool.query('SELECT * FROM quiz_attempts WHERE id=$1',[id])).rows[0];
   assert.equal(row.score_percent,percent,`percentage ${score}/${total}`);assert.equal(row.grade_value,grade,`grade ${score}/${total}`);
   assert.equal(row.status,'graded');assert.equal((await pool.query('SELECT * FROM grades WHERE attempt_id=$1',[id])).rowCount,1);
   assert.ok(!('grade' in (await request(app,t.student,path(id))).body));
  }
 }finally{if(app)await app.close();await pool.end();}
});
test('US2 replay keys A/B, last worse grade, immutable history, replay after publication and closure',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f),quiz=f.quizzes.section;
  const q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[quiz])).rows[0].questions[0];
  const first=await f.create({answers:[{questionId:q.id,alternativeId:'a'}]}),p=path(first)+'/submit';
  const a=await request(app,t.student,p,'POST',undefined,'A');assert.equal(a.status,200);
  const before=await state(pool);assert.equal((await request(app,t.student,p,'POST',undefined,'B')).status,409);assert.deepEqual(await state(pool),before);
  const second=await f.create({number:2}),p2=path(second)+'/submit';
  assert.equal((await request(app,t.student,p2,'POST',undefined,'A')).status,409);
  assert.equal((await request(app,t.student,p2,'POST',undefined,'B')).status,200);
  const noAlias=await state(pool);assert.equal((await request(app,t.student,p,'POST',undefined,'B')).status,409);assert.deepEqual(await state(pool),noAlias);
  const g=(await pool.query('SELECT * FROM grades')).rows[0];assert.equal(g.attempt_id,second);assert.equal(g.grade_value,'1.0');
  const historical=(await pool.query('SELECT * FROM quiz_attempts WHERE id=$1',[first])).rows[0];assert.equal(historical.grade_value,'7.0');assert.equal(historical.answers[0].isCorrect,true);
  for(const sql of ["UPDATE quiz_attempts SET answers='[]' WHERE id=$1","DELETE FROM quiz_attempts WHERE id=$1"])
   await assert.rejects(pool.query(sql,[first]));
  await pool.query("UPDATE quizzes SET closes_at=clock_timestamp()-interval '1 second' WHERE id=$1",[quiz]);
  await pool.query('BEGIN;');await pool.query('UPDATE grades SET published_at=clock_timestamp() WHERE id=$1',[g.id]);await pool.query('COMMIT');
  const published=await state(pool);assert.deepEqual((await request(app,t.student,p,'POST',undefined,'A')).body,a.body);assert.deepEqual(await state(pool),published);
  assert.equal((await request(app,t.student,f.startPath,'POST',undefined,'new')).status,409);
  await assert.rejects(pool.query('UPDATE grades SET grade_value=7 WHERE id=$1',[g.id]));
  const active=await f.create({number:3});
  for(const [suffix,method,body] of [['/submit','POST'],['/answers','PUT',{answers:[]}]])
   assert.equal((await request(app,t.student,path(active)+suffix,method,body,'published')).status,409);
  assert.equal((await request(app,t.student,path(active)+'/cancel','POST')).status,204);
  assert.deepEqual((await pool.query('SELECT * FROM grades')).rows,published[1]);
  await pool.query('UPDATE institution_memberships SET active=false WHERE user_id=$1',[historical.student_id]);
  assert.equal((await request(app,t.student,p,'POST',undefined,'A')).status,404);
 }finally{if(app)await app.close();await pool.end();}
});
test('US2 every grading/grade event failure and calculation failure rolls back result, grade and key',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  for(const action of ['attempt.graded','grade.created','grade.updated','calculation']){
   const quiz=await f.make({published:true}),id=await f.create({quiz}),p=path(id)+'/submit';
   if(action==='grade.updated'){
    await request(app,t.student,p,'POST',undefined,'previous');
    const next=await f.create({quiz,number:2});await verify(next,action);continue;
   }
   await verify(id,action);
  }
  async function verify(id,action){
   const before=await state(pool);
   if(action==='calculation')await pool.query(`CREATE FUNCTION fail_calculation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.status='graded' THEN RAISE EXCEPTION 'calculation fault'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER fail_calculation BEFORE UPDATE ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION fail_calculation()`);
   else await failAudit(pool,action);
   try{assert.equal((await request(app,t.student,path(id)+'/submit','POST',undefined,'rollback-'+action)).status,500);}finally{
    if(action==='calculation')await pool.query('DROP TRIGGER fail_calculation ON quiz_attempts; DROP FUNCTION fail_calculation()');else await restoreAudit(pool);
   }
   assert.deepEqual(await state(pool),before);
   assert.equal((await request(app,t.student,path(id)+'/submit','POST',undefined,'rollback-'+action)).status,200);
  }
 }finally{if(app)await app.close();await pool.end();}
});
