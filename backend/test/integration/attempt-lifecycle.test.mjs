import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID,randomBytes} from 'node:crypto';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,request,path,state} from './attempt-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
test('US1 independent: start, original replay, complete save, resume, cancel consumption and history',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool),secret=randomBytes(32).toString('base64');app=await http({AUTH_JWT_SECRET:secret});const t=await tokens(app,f);
  await pool.query('UPDATE quizzes SET max_attempts=2 WHERE id=$1',[f.quizzes.section]);
  const a=await request(app,t.student,f.startPath,'POST',{},'A');assert.equal(a.status,201);
  const id=a.body.id,p=path(id);assert.equal(a.body.attemptNumber,1);assert.equal(a.headers.get('location'),'/api/v1/institution/'+p);
  assert.equal((await request(app,t.student,f.startPath,'POST',undefined,'B')).status,409);
  const q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[f.quizzes.section])).rows[0].questions[0],answers=[{questionId:q.id,alternativeId:'a'}];
  assert.equal((await request(app,t.student,p+'/answers','PUT',{answers})).status,200);
  assert.deepEqual((await request(app,t.student,p)).body.answers,answers);
  const before=await state(pool);await request(app,t.student,p+'/answers','PUT',{answers});assert.deepEqual(await state(pool),before);
  for(const bad of [{answers:[{questionId:randomUUID(),alternativeId:'a'}]},{answers:[{questionId:q.id,alternativeId:'unknown'}]}])
   assert.equal((await request(app,t.student,p+'/answers','PUT',bad)).status,422);
  assert.equal((await request(app,t.student,p+'/answers','PUT',{answers,grade:7})).status,400);
  await request(app,t.student,p+'/answers','PUT',{answers:[]});assert.deepEqual((await request(app,t.student,p)).body.answers,[]);
  assert.equal((await request(app,t.student,p+'/cancel','POST',{})).status,204);
  const cancelled=await state(pool);assert.equal((await request(app,t.student,p+'/cancel','POST')).status,204);assert.deepEqual(await state(pool),cancelled);
  assert.deepEqual((await request(app,t.student,f.startPath,'POST',undefined,'A')).body,a.body);
  await app.close();app=await http({AUTH_JWT_SECRET:secret});
  assert.deepEqual((await request(app,t.student,f.startPath,'POST',undefined,'A')).body,a.body);
  const otherQuiz=await f.make({published:true});
  assert.equal((await request(app,t.student,`uc/sections/${f.s1}/quizzes/${otherQuiz}/attempts`,'POST',undefined,'A')).status,409);
  assert.equal((await request(app,t.student,p+'/answers','PUT',{answers})).status,409);
  const second=await request(app,t.student,f.startPath,'POST',undefined,'B');assert.equal(second.body.attemptNumber,2);
  await request(app,t.teacher,path(second.body.id)+'/cancel','POST');
  assert.equal((await request(app,t.student,f.startPath,'POST',undefined,'C')).status,409);
  assert.equal((await pool.query('SELECT * FROM grades')).rowCount,0);
  assert.equal((await request(app,t.student,f.startPath,'POST')).status,400);
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 audit failures rollback start/save/cancel, including key reservation',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f);
  for(const action of ['attempt.started','attempt.answersSaved','attempt.cancelled']){
   const id=action==='attempt.started'?null:await f.create({quiz:await f.make({published:true})});
   const p=id?path(id):f.startPath,method=action==='attempt.answersSaved'?'PUT':'POST';
   let body;if(method==='PUT') {
    const q=(await pool.query('SELECT questions FROM quizzes WHERE id=(SELECT quiz_id FROM quiz_attempts WHERE id=$1)',[id])).rows[0].questions[0];body={answers:[{questionId:q.id,alternativeId:'b'}]};
   }
   const endpoint=action==='attempt.started'?p:p+(method==='PUT'?'/answers':'/cancel'),before=await state(pool);
   await failAudit(pool,action);try{assert.equal((await request(app,t.student,endpoint,method,body,'failure')).status,500);}finally{await restoreAudit(pool);}
   assert.deepEqual(await state(pool),before);
   assert.ok([200,201,204].includes((await request(app,t.student,endpoint,method,body,'failure')).status));
  }
 }finally{if(app)await app.close();await pool.end();}
});

test('US1 standalone cancellation retains prior SQL Grade; US1 to US2 integrated HTTP flow',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);app=await http();const t=await tokens(app,f),quiz=f.quizzes.section;
  const old=await f.create({status:'graded',percent:60,grade:4});
  await pool.query(`INSERT INTO grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value)
   SELECT gen_random_uuid(),$1,id,$2,$3,$4,$5,60,4 FROM grade_items WHERE quiz_id=$2`,[f.tenants.uc,quiz,(await pool.query('SELECT student_id FROM quiz_attempts WHERE id=$1',[old])).rows[0].student_id,f.s1,old]);
  const before=(await pool.query('SELECT * FROM grades')).rows;
  const started=await request(app,t.student,f.startPath,'POST',undefined,'cancel-prior');assert.equal(started.status,201);
  assert.equal((await request(app,t.student,path(started.body.id)+'/cancel','POST')).status,204);
  assert.deepEqual((await pool.query('SELECT * FROM grades')).rows,before);
  const next=await request(app,t.student,f.startPath,'POST',undefined,'integrated');
  const q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[quiz])).rows[0].questions[0];
  assert.equal((await request(app,t.student,path(next.body.id)+'/answers','PUT',{answers:[{questionId:q.id,alternativeId:'a'}]})).status,200);
  const result=await request(app,t.student,path(next.body.id)+'/submit','POST',undefined,'integrated');assert.equal(result.status,200);
  assert.equal((await request(app,t.teacher,path(next.body.id))).body.grade,7);
  assert.ok(!('grade' in (await request(app,t.student,path(next.body.id))).body));
  assert.equal((await pool.query('SELECT * FROM grades')).rows[0].attempt_id,next.body.id);
 }finally{if(app)await app.close();await pool.end();}
});
