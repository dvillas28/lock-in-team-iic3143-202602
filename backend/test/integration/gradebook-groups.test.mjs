import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database,http,runtimeDatabase} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,coursePath,question,queued} from './gradebook-fixtures.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';

function plan(config,primary,extra) {
 const group=config.groups.find(g=>g.id===primary);
 return {expectedVersion:config.version,confirmRecalculation:true,groups:[
  {id:group.id,title:'Quizzes',weightPercent:60,gradeItemIds:[primary,extra]},
  {id:null,title:'Examen',weightPercent:0,gradeItemIds:config.items.filter(i=>i.id!==primary && i.id!==extra).map(i=>i.id)},
  {id:null,title:'Tareas',weightPercent:40,gradeItemIds:[]},
 ]};
}

test('groups, partial section publication and audited corrections preserve historical evidence',async()=>{
 const pool=await database();let app,runtime;
 try {
  const f=await gradebookFixture(pool);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=$2 AND role='teacher'",[users.other,f.s2]);
  const quiz=await f.make({published:true,questions:[{...question,id:randomUUID(),points:7.5}]}),
   extra=await f.graded({quiz,grade:1,percent:0});
  const first=f.grades[0], second=f.grades[1];
  app=await http();const t=await tokens(app,f),path=coursePath(f);
  const call=(token,suffix,method,body,key)=>request(app,token,path+suffix,method,body,key);
  const config=(await call(t.owner,'/grade-items')).body;
  const setup=plan(config,first.item,extra.item),save=(token,body=setup)=>call(token,'/gradebook/groups','PUT',body);
  assert.equal((await save(t.assistant)).status,403);
  assert.equal((await save(t.teacher,{...setup,confirmRecalculation:false})).status,409);
  assert.equal((await save(t.owner,{...setup,groups:setup.groups.map(g=>({...g,weightPercent:0}))})).status,422);
  const saved=await save(t.teacher);assert.equal(saved.status,200);assert.equal(saved.body.version,1);
  assert.deepEqual((await save(t.teacher)).body,saved.body);
  assert.equal((await request(app,t.teacher,path.replace(/^uc/,'utfsm')+'/gradebook/groups','PUT',setup)).status,404);
  assert.equal((await call(t.student,'/my-grades')).body.partialAverage,null);
  const published=await call(t.teacher,'/gradebook/publications','POST',{scope:'pending',sectionIds:[f.s1],gradeItemIds:[extra.item]},'section-1');
  assert.equal(published.status,200);
  assert.deepEqual(await call(t.teacher,'/gradebook/publications','POST',{scope:'pending',sectionIds:[f.s1],gradeItemIds:[extra.item]},'section-1').then(r=>r.body),published.body);
  const isolated=await call(t.teacher,'/gradebook/publications','POST',{scope:'pending',sectionIds:[f.s2]},'forbidden-section');
  assert.equal(isolated.status,404);
  let mine=(await call(t.student,'/my-grades')).body;
  assert.equal(mine.partialAverage,1);assert.equal(mine.publishedWeightPercent,60);
  assert.deepEqual(mine.items.map(i=>i.gradeItemId),[extra.item]);
  const sectionPending={scope:'pending',sectionIds:[f.s1],gradeItemIds:[first.item,extra.item]};
  assert.equal((await call(t.owner,'/gradebook/publications','POST',sectionPending,'remaining')).body.publishedCount,1);
  assert.equal((await pool.query('SELECT published_at FROM grades WHERE id=$1',[second.id])).rows[0].published_at,null);

  const attempts=await pool.query('SELECT * FROM quiz_attempts ORDER BY id');
  const original=await pool.query('SELECT * FROM grades ORDER BY id');
  const correct=(token,id,body)=>call(token,'/gradebook/grades/'+id,'PATCH',body);
  const correction={revisionId:randomUUID(),expectedRevisionId:null,points:7.5,reason:'Revisión del puntaje'};
  assert.equal((await correct(t.assistant,extra.id,correction)).status,403);
  assert.equal((await correct(t.student,extra.id,correction)).status,403);
  assert.equal((await request(app,t.teacher,path.replace(/^uc/,'utfsm')+'/gradebook/grades/'+extra.id,'PATCH',correction)).status,404);
  assert.equal((await correct(t.teacher,f.grades[2].id,correction)).status,404);
  assert.equal((await correct(t.owner,second.id,correction)).body.code,'GRADE_NOT_PUBLISHED');
  assert.equal((await correct(t.owner,extra.id,{...correction,points:7.51})).status,422);
  await failAudit(pool,'grade.corrected');
  try { assert.equal((await correct(t.teacher,extra.id,correction)).status,500); }
  finally { await restoreAudit(pool); }
  assert.equal((await pool.query('SELECT id FROM grade_revisions')).rowCount,0);
  const outcomes=await queued(pool,f.own,
   ()=>correct(t.teacher,extra.id,correction),
   ()=>correct(t.owner,extra.id,{...correction,revisionId:randomUUID(),points:0}));
  assert.deepEqual(outcomes.map(r=>r.status),[200,409]);
  assert.deepEqual((await correct(t.teacher,extra.id,correction)).body,outcomes[0].body);
  assert.equal(outcomes[0].body.grade,7);
  mine=(await call(t.student,'/my-grades')).body;
  assert.deepEqual(mine.groupResults.map(g=>[g.pointsEarned,g.pointsPossible,g.scorePercent]),[[7.5,10,75]]);
  assert.equal(mine.partialAverage,5.1);
  assert.deepEqual((await pool.query('SELECT * FROM quiz_attempts ORDER BY id')).rows,attempts.rows);
  assert.deepEqual((await pool.query('SELECT * FROM grades ORDER BY id')).rows,original.rows);
  const event=(await pool.query("SELECT * FROM audit_events WHERE action='grade.corrected'")).rows[0];
  assert.equal(event.actor_user_id,users.other);
  assert.equal(event.changes.before.grade,1);
  assert.equal(event.changes.after.grade,7);
  assert.equal(event.changes.after.reason,correction.reason);

  const latest=(await call(t.owner,'/grade-items')).body;
  const revised={expectedVersion:latest.version,confirmRecalculation:true,groups:latest.groups.map(g=>({
   id:g.id,title:g.title,weightPercent:g.title==='Examen'?40:g.title==='Tareas'?0:60,
   gradeItemIds:latest.items.filter(i=>i.groupId===g.id).map(i=>i.id),
  }))};
  const alternate={...revised,groups:revised.groups.toReversed()};
  const writes=await queued(pool,f.own,()=>save(t.owner,revised),()=>save(t.teacher,alternate));
  assert.deepEqual(writes.map(r=>r.status),[200,409]);
  assert.equal((await pool.query("SELECT id FROM audit_events WHERE action='gradebook.groupsUpdated'")).rowCount,2);
  await assert.rejects(pool.query('UPDATE grade_groups SET weight_percent=1 WHERE id=$1',[latest.groups[0].id]));
  await assert.rejects(pool.query('UPDATE grade_groups SET position=1 WHERE id=$1',[latest.groups[1].id]));
  await assert.rejects(pool.query('UPDATE grade_groups SET course_id=$1 WHERE id=$2',[f.other,latest.groups[2].id]));
  const newQuiz=await f.make();
  assert.equal((await request(app,t.teacher,'uc/quizzes/'+newQuiz+'/publish','POST')).status,200);
  const newConfig=(await call(t.owner,'/grade-items')).body;
  const newItem=newConfig.items.find(i=>i.quizId===newQuiz);
  assert.equal(newItem.maxPoints,2.5);assert.equal(newItem.weightPercent,0);
  assert.equal(newConfig.totalWeightPercent,100);
  runtime=await runtimeDatabase();
  await runtime.withInstitution(users.foreign,'utfsm',async c=>{
   assert.equal((await c.query('SELECT id FROM grade_groups WHERE course_id=$1',[f.own])).rowCount,0);
   assert.equal((await c.query('SELECT id FROM grade_revisions WHERE grade_id=$1',[extra.id])).rowCount,0);
  });
  await assert.rejects(pool.query('DELETE FROM grade_revisions WHERE grade_id=$1',[extra.id]));
 } finally {if(runtime)await runtime.onApplicationShutdown();if(app)await app.close();await pool.end();}
});
