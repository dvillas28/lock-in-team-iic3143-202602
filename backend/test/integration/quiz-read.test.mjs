import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {quizFixture,tokens,request,users} from './quiz-fixtures.mjs';
test('US2 standalone SQL fixtures enforce published recipients and explicit answer-free nested DTOs',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool,true);app=await http();const t=await tokens(app,f),list=`uc/courses/${f.own}/quizzes`;
  const student=await request(app,t.student,list);assert.equal(student.status,200);
  assert.deepEqual(student.body.items.map(q=>q.id).sort(),[f.quizzes.global,f.quizzes.section].sort());
  for(const quiz of student.body.items)assert.equal('questions' in quiz,false);
  for(const token of [t.student,t.assistant,t.teacher,t.owner]){
   const id=token===t.assistant?f.quizzes.second:f.quizzes.section;
   const got=await request(app,token,'uc/quizzes/'+id);assert.equal(got.status,200);
   assert.deepEqual(Object.keys(got.body.questions[0].alternatives[0]).sort(),['id','text']);
   assert.equal(JSON.stringify(got.body).includes('isCorrect'),false);
   assert.equal('createdBy' in got.body,false);
  }
  assert.equal((await request(app,t.student,'uc/quizzes/'+f.quizzes.draft)).status,404);
  assert.equal((await request(app,t.student,'uc/quizzes/'+f.quizzes.second)).status,404);
  assert.equal((await request(app,t.student,'uc/quizzes/'+f.quizzes.section+'/authoring')).status,403);
  assert.equal((await request(app,t.teacher,'uc/quizzes/'+f.quizzes.global+'/authoring')).status,403);
  assert.equal((await request(app,t.teacher,'uc/quizzes/'+f.quizzes.globalDraft)).status,404);
  assert.equal((await request(app,t.admin,list)).status,404);
  assert.equal((await request(app,t.owner,'uc/quizzes/'+f.quizzes.foreign)).status,404);
  assert.equal((await request(app,t.owner,'utfsm/quizzes/'+f.quizzes.section)).status,404);
  assert.equal((await request(app,t.student,list+'?sectionId='+f.s2)).status,404);
  assert.equal((await request(app,t.owner,list+'?unexpected=true')).status,400);
  const filtered=await request(app,t.owner,list+'?sectionId='+f.s2);
  assert.deepEqual(filtered.body.items.map(q=>q.id).sort(),[f.quizzes.global,f.quizzes.globalDraft,f.quizzes.second].sort());
  await pool.query('UPDATE quizzes SET section_id=$1 WHERE id=$2',[f.s2,f.quizzes.draft]);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='teacher'",[users.other,f.s2]);
  assert.equal((await request(app,t.teacher,'uc/quizzes/'+f.quizzes.draft)).status,404);
 }finally{if(app)await app.close();await pool.end();}
});
