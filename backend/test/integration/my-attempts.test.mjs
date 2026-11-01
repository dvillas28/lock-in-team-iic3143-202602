import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,users,request,state} from './attempt-fixtures.mjs';
const path=quiz=>`uc/quizzes/${quiz}/my-attempts`;
test('student history returns only own tenant records; pagination, availability and revocation remain private',async()=>{
 const pool=await database();let app;
 try{
  const f=await attemptFixture(pool);
  // max_attempts freezes once a quiz has attempts, so configure it first.
  await pool.query('UPDATE quizzes SET max_attempts=3 WHERE id=$1',[f.quizzes.section]);
  // Explicit timestamps make ordering independent of clock precision.
  const first=await f.create({status:'graded',started:new Date(Date.now()-86400000)}),active=await f.create({number:2});
  await f.create({student:users.owner,status:'graded'});
  await f.create({quiz:f.quizzes.foreign,student:users.foreign,section:f.s4});
  app=await http();const t=await tokens(app,f),url=path(f.quizzes.section),before=await state(pool);
  const page=await request(app,t.student,url+'?limit=1');
  assert.equal(page.status,200);assert.equal(page.body.items[0].id,active);assert.equal(page.body.hasMore,true);
  assert.deepEqual(page.body.availability,{canStart:false,reason:'activeAttempt',remainingAttempts:1,activeAttemptId:active});
  const next=await request(app,t.student,url+'?limit=1&cursor='+page.body.nextCursor);
  assert.equal(next.status,200);assert.equal(next.body.items[0].id,first);assert.equal(next.body.hasMore,false);
  assert.equal(next.body.availability.activeAttemptId,active);
  for(const a of [...page.body.items,...next.body.items]){
   assert.equal(a.studentId,users.revoked);assert.ok(!('grade'in a)&&!('scorePercent'in a));
   assert.ok(a.answers.every(x=>!('isCorrect'in x)&&!('pointsAwarded'in x)));
  }
  for(const query of ['?studentId='+users.owner,'?sectionId='+f.s2,'?limit=101'])assert.equal((await request(app,t.student,url+query)).status,400);
  assert.equal((await request(app,t.student,path(f.quizzes.foreign))).status,404);
  assert.equal((await request(app,t.teacher,url)).status,403);
  await f.add(f.s1,users.inactive,'student');
  assert.equal((await request(app,t.assistant,url+'?limit=1&cursor='+page.body.nextCursor)).status,400);
  await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1',[users.revoked]);
  assert.equal((await request(app,t.student,url)).status,404);
  // History consultation creates no attempts, grades or audit events.
  assert.deepEqual(await state(pool),before);
 }finally{if(app)await app.close();await pool.end();}
});
test('remaining attempts and windows use all history, including cancelled attempts',async()=>{
 const pool=await database();let app;
 try{
  const f=await attemptFixture(pool),url=path(f.quizzes.section);
  // max_attempts freezes once a quiz has attempts; window columns stay editable.
  await pool.query('UPDATE quizzes SET max_attempts=1 WHERE id=$1',[f.quizzes.section]);
  app=await http();const t=await tokens(app,f);
  assert.deepEqual((await request(app,t.student,url)).body.availability,{canStart:true,reason:null,remainingAttempts:1,activeAttemptId:null});
  await f.create({status:'cancelled'});
  assert.equal((await request(app,t.student,url)).body.availability.reason,'limitReached');
  // Window reasons take precedence over the exhausted attempt limit.
  await pool.query("UPDATE quizzes SET opens_at=now()+interval '1 day' WHERE id=$1",[f.quizzes.section]);
  assert.equal((await request(app,t.student,url)).body.availability.reason,'notOpen');
  await pool.query("UPDATE quizzes SET opens_at=null,closes_at=now()-interval '1 day' WHERE id=$1",[f.quizzes.section]);
  assert.equal((await request(app,t.student,url)).body.availability.reason,'closed');
 }finally{if(app)await app.close();await pool.end();}
});

test('questions stay hidden in quiz detail and are available only through an own active attempt',async()=>{
 const pool=await database();let app;
 try{
  const f=await attemptFixture(pool),done=await f.create({status:'graded'}),active=await f.create({number:2});
  const other=await f.create({student:users.owner});
  app=await http();const t=await tokens(app,f),before=await state(pool);
  assert.deepEqual((await request(app,t.student,`uc/quizzes/${f.quizzes.section}`)).body.questions,[]);
  const questions=await request(app,t.student,`uc/quiz-attempts/${active}/questions`);
  assert.equal(questions.status,200);assert.ok(questions.body.questions.length>0);
  assert.ok(questions.body.questions.every(q=>q.alternatives.every(a=>!('isCorrect'in a))));
  assert.equal((await request(app,t.student,`uc/quiz-attempts/${done}/questions`)).status,409);
  assert.equal((await request(app,t.student,`uc/quiz-attempts/${other}/questions`)).status,404);
  assert.equal((await request(app,t.teacher,`uc/quiz-attempts/${active}/questions`)).status,403);
  assert.equal((await request(app,t.student,`utfsm/quiz-attempts/${active}/questions`)).status,404);
  await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1',[users.revoked]);
  assert.equal((await request(app,t.student,`uc/quiz-attempts/${active}/questions`)).status,404);
  assert.deepEqual(await state(pool),before);
 }finally{if(app)await app.close();await pool.end();}
});
