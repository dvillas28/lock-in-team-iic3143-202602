import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {quizFixture,tokens,request,question,users,snapshot} from './quiz-fixtures.mjs';
test('US1 create, edit stable questions, reassign FK, publish and protect IDs/scopes',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool);app=await http();const t=await tokens(app,f),path=`uc/courses/${f.own}/quizzes`;
  const made=await request(app,t.teacher,path,'POST',{title:'Control',sectionId:f.s1,questions:[question]});
  assert.equal(made.status,201);const id=made.body.id,q=made.body.questions[0];
  assert.ok(made.headers.get('location').endsWith('/quizzes/'+id));
  assert.equal(q.alternatives[0].isCorrect,true);const endpoint='uc/quizzes/'+id;
  const changed=await request(app,t.teacher,endpoint,'PATCH',{sectionId:f.s2,questions:[{...q,prompt:'Editada'}]});
  assert.equal(changed.status,200);assert.equal(changed.body.id,id);assert.equal(changed.body.questions[0].id,q.id);
  assert.equal(changed.body.sectionId,f.s2);
  const event=(await pool.query("SELECT * FROM audit_events WHERE action='quiz.updated'")).rows[0];
  assert.equal(event.section_id,null);assert.equal(event.changes.before.sectionId,f.s1);assert.equal(event.changes.after.sectionId,f.s2);
  assert.ok(!JSON.stringify(event).includes(question.prompt));assert.ok(!JSON.stringify(event).includes('isCorrect'));
  const before=await snapshot(pool);
  assert.equal((await request(app,t.teacher,endpoint,'PATCH',{sectionId:f.s2,questions:changed.body.questions})).status,200);
  assert.deepEqual(await snapshot(pool),before);
  assert.equal((await request(app,t.teacher,endpoint,'PATCH',{sectionId:null})).status,403);
  for(const sectionId of [f.s3,f.s4])assert.equal((await request(app,t.teacher,endpoint,'PATCH',{sectionId})).status,404);
  assert.equal((await request(app,t.owner,endpoint,'PATCH',{sectionId:null})).status,200);
  assert.equal((await request(app,t.teacher,endpoint+'/authoring')).status,404);
  assert.equal((await request(app,t.owner,endpoint+'/authoring')).status,200);
  assert.equal((await request(app,t.owner,endpoint+'/publish','POST')).status,200);
  for(const body of [{title:'No'},{sectionId:f.s1},{maxAttempts:3},{questions:[]},{}])
   assert.equal((await request(app,t.owner,endpoint,'PATCH',body)).status,409);
  for(const token of [t.student,t.assistant,t.admin])assert.ok([403,404].includes((await request(app,token,path,'POST',{title:'No',sectionId:f.s1})).status));
  assert.equal((await request(app,t.teacher,path,'POST',{title:'Global'})).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
test('US1 invalid payloads, local question identities and nested keys never create partial records',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool);app=await http();const t=await tokens(app,f),path=`uc/courses/${f.own}/quizzes`;
  for(const body of [
   {title:' '},{title:'x',maxAttempts:0},{title:'x',questions:[{...question,points:0}]},
   {title:'x',questions:[{...question,alternatives:question.alternatives.map(a=>({...a,isCorrect:false}))}]},
   {title:'x',questions:[{...question,alternatives:question.alternatives.map(a=>({...a,isCorrect:true}))}]},
   {title:'x',questions:[question,question]},
  ])assert.equal((await request(app,t.owner,path,'POST',body)).status,422);
  for(const body of [{title:1},{title:'x',institutionId:f.tenants.uc},{title:'x',questions:[{...question,secret:true}]},
   {title:'x',questions:[{...question,id:f.own}]},{title:'x',questions:[{...question,alternatives:[{...question.alternatives[0],extra:1},question.alternatives[1]]}]}])
   assert.equal((await request(app,t.owner,path,'POST',body)).status,400);
  assert.deepEqual(await snapshot(pool),[[],[],[]]);
  const draft=await request(app,t.owner,path,'POST',{title:'Vacío'});
  assert.equal((await request(app,t.owner,'uc/quizzes/'+draft.body.id+'/publish','POST')).status,422);
  assert.equal((await pool.query('SELECT * FROM grade_items')).rowCount,0);
  assert.equal((await request(app,t.owner,'uc/quizzes/'+draft.body.id,'PATCH',{questions:[{...question,id:f.s1}]})).status,422);
  assert.equal((await request(app,t.owner,'uc/quizzes/'+draft.body.id,'PATCH',{questions:[question]})).status,200);
  assert.equal((await request(app,t.owner,'uc/quizzes/'+draft.body.id+'/publish','POST',{})).status,400);
  assert.equal((await request(app,t.owner,`uc/courses/${f.foreign}/quizzes`,'POST',{title:'No'})).status,404);
  assert.equal((await request(app,t.owner,`utfsm/courses/${f.own}/quizzes`,'POST',{title:'No'})).status,404);
  // Losing source teacher cannot be bypassed by naming a destination still taught.
  const id=await f.make();await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='teacher'",[users.other,f.s1]);
  assert.equal((await request(app,t.teacher,'uc/quizzes/'+id,'PATCH',{sectionId:f.s2})).status,404);
 }finally{if(app)await app.close();await pool.end();}
});
