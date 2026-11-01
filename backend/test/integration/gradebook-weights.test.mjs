import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,selection,coursePath,snapshot} from './gradebook-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
test('weights require complete exact collection, atomic audit, no-op and freeze',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f),items=(await request(app,t.owner,path+'/grade-items')).body.items;
 const input={items:items.map(i=>({gradeItemId:i.id,weightPercent:i.weightPercent}))};
 const before=await snapshot(pool);assert.equal((await request(app,t.owner,path+'/gradebook/weights','PUT',input)).status,200);assert.deepEqual(await snapshot(pool),before);
 for(const body of [{items:input.items.map((v,i)=>({...v,weightPercent:i===0?40.01:30}))},{items:input.items.slice(1)},{items:input.items.map((v,i)=>({...v,weightPercent:i===0?39.99:30}))},{items:input.items.map((v,i)=>({...v,gradeItemId:i===0?randomUUID():v.gradeItemId}))}]) {
  assert.equal((await request(app,t.owner,path+'/gradebook/weights','PUT',body)).status,422);assert.deepEqual(await snapshot(pool),before);
 }
 const changed={items:input.items.map((v,i)=>({...v,weightPercent:i===0?100:0}))};
 await failAudit(pool,'gradebook.weightsUpdated');assert.equal((await request(app,t.owner,path+'/gradebook/weights','PUT',changed)).status,500);assert.deepEqual(await snapshot(pool),before);await restoreAudit(pool);
 assert.equal((await request(app,t.owner,path+'/gradebook/weights','PUT',changed)).status,200);
 const event=(await pool.query("SELECT changes FROM audit_events WHERE action='gradebook.weightsUpdated'")).rows[0].changes;
 assert.deepEqual(event.before,input);assert.deepEqual(event.after,changed);
 assert.equal((await request(app,t.owner,path+'/gradebook/publications','POST',selection(f),'freeze')).status,200);
 const frozen=await request(app,t.owner,path+'/gradebook/weights','PUT',changed);assert.equal(frozen.status,409);assert.equal(frozen.body.code,'GRADE_WEIGHTS_LOCKED');
 }finally{if(app)await app.close();await pool.end();}
});


test('ordinary teacher can change course weights without admin or ownership; revocation still rejects writes',async()=>{
 const pool=await database();let app;
 try{
  const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f);
  const listed=await request(app,t.teacher,path+'/grade-items');
  assert.equal(listed.body.weightsLocked,false);
  const input={items:listed.body.items.map((item,i)=>({gradeItemId:item.id,weightPercent:i===0?100:0}))};
  const result=await request(app,t.teacher,path+'/gradebook/weights','PUT',input);
  assert.equal(result.status,200);assert.equal(result.body.totalWeightPercent,100);
  const event=(await pool.query("SELECT actor_user_id,changes FROM audit_events WHERE action='gradebook.weightsUpdated'")).rows[0];
  assert.equal(event.actor_user_id,users.other);assert.deepEqual(event.changes.after,input);
  const before=await snapshot(pool);
  assert.ok([403,404].includes((await request(app,t.assistant,path+'/gradebook/weights','PUT',input)).status));
  assert.ok([403,404].includes((await request(app,t.student,path+'/gradebook/weights','PUT',input)).status));
  assert.equal((await request(app,t.teacher,`utfsm/courses/${f.own}/gradebook/weights`,'PUT',input)).status,404);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.other]);
  assert.equal((await request(app,t.teacher,path+'/gradebook/weights','PUT',input)).status,403);
  assert.deepEqual(await snapshot(pool),before);
 }finally{if(app)await app.close();await pool.end();}
});
