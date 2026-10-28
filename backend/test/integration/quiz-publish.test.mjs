import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {quizFixture,tokens,request,snapshot} from './quiz-fixtures.mjs';
test('US1 publication is atomic, repeatable after freeze, and never creates another weighted item',async()=>{
 const pool=await database();let app;try{
  const f=await quizFixture(pool,true);app=await http();const t=await tokens(app,f),path='uc/quizzes/'+f.quizzes.draft+'/publish';
  const first=await request(app,t.teacher,path,'POST');assert.equal(first.status,200);
  assert.equal(first.body.status,'published');
  const item=(await pool.query('SELECT * FROM grade_items WHERE quiz_id=$1',[f.quizzes.draft])).rows[0];
  assert.equal(item.weight_percent,'0.00');
  const before=await snapshot(pool);
  assert.deepEqual((await request(app,t.teacher,path,'POST')).body,first.body);assert.deepEqual(await snapshot(pool),before);
  await pool.query('UPDATE courses SET grade_items_locked_at=clock_timestamp() WHERE id=$1',[f.own]);
  assert.deepEqual((await request(app,t.teacher,path,'POST')).body,first.body);assert.deepEqual(await snapshot(pool),before);
  assert.equal((await request(app,t.owner,'uc/quizzes/'+f.quizzes.globalDraft+'/publish','POST')).status,409);
  assert.deepEqual(await snapshot(pool),before);
  assert.equal((await pool.query("SELECT * FROM audit_events WHERE action='quiz.published'")).rowCount,1);
 }finally{if(app)await app.close();await pool.end();}
});
