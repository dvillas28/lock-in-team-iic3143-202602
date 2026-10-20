import test from 'node:test';
import assert from 'node:assert/strict';
import {database,http,login,sanitized} from './helpers.mjs';
import {membersFixture,users} from './course-fixtures.mjs';
import {request} from './attempt-fixtures.mjs';
import {question} from './quiz-fixtures.mjs';
test('complete HTTP academic workflow in UC and UTFSM, publication and own read with tenant rejection',async()=>{
 const pool=await database();let app;try{
 const f=await membersFixture(pool);await pool.query('UPDATE institution_memberships SET is_admin=true WHERE institution_id=$1 AND user_id=$2',[f.tenants.utfsm,users.foreign]);
 app=await http();const multi=await login(app,f.env),uc=await login(app,f.env,'UC'),utfsm=await login(app,f.env,'UTFSM');
 for(const [slug,teacher,student,studentId,foreignSlug] of [['uc',multi,uc,users.other,'utfsm'],['utfsm',utfsm,multi,users.owner,'uc']]){
  assert.equal((await request(app,teacher,slug+'/me')).status,200);
  const course=await request(app,teacher,slug+'/courses','POST',{code:'HTTP',name:'Academic flow',term:'2026-2',initialSection:{code:'1',capacity:20}});assert.equal(course.status,201);const courseId=course.body.id;
  const sections=await request(app,teacher,`${slug}/courses/${courseId}/sections`);assert.equal(sections.status,200);const section=sections.body.items[0].id;
  assert.equal((await request(app,teacher,`${slug}/sections/${section}/enrollments`,'POST',{userId:studentId,role:'student'})).status,201);
  const module=await request(app,teacher,`${slug}/courses/${courseId}/modules`,'POST',{title:'Module',position:1});assert.equal(module.status,201);
  const material=await request(app,teacher,`${slug}/modules/${module.body.id}/materials`,'POST',{title:'Notes',markdownBody:'# Learning'});assert.equal(material.status,201);
  assert.equal((await request(app,teacher,`${slug}/modules/${module.body.id}/publish`,'POST')).status,200);
  assert.equal((await request(app,teacher,`${slug}/materials/${material.body.id}/publish`,'POST')).status,200);
  assert.equal((await request(app,student,`${slug}/materials/${material.body.id}`)).body.markdownBody,'# Learning');
  const quiz=await request(app,teacher,`${slug}/courses/${courseId}/quizzes`,'POST',{title:'Control',sectionId:section,questions:[question]});assert.equal(quiz.status,201);
  assert.equal((await request(app,teacher,`${slug}/quizzes/${quiz.body.id}/publish`,'POST')).status,200);
  const items=await request(app,teacher,`${slug}/courses/${courseId}/grade-items`),item=items.body.items[0].id;
  assert.equal((await request(app,teacher,`${slug}/courses/${courseId}/gradebook/weights`,'PUT',{items:[{gradeItemId:item,weightPercent:100}]})).status,200);
  const safe=await request(app,student,`${slug}/quizzes/${quiz.body.id}`);assert.equal(safe.status,200);assert.ok(!('isCorrect'in safe.body.questions[0].alternatives[0]));
  const startPath=`${slug}/sections/${section}/quizzes/${quiz.body.id}/attempts`;
  const abandoned=await request(app,student,startPath,'POST',{},'abandoned');assert.equal(abandoned.status,201);
  assert.equal((await request(app,student,`${slug}/quiz-attempts/${abandoned.body.id}/cancel`,'POST')).status,204);
  const attempt=await request(app,student,startPath,'POST',{},'attempt');assert.equal(attempt.status,201);
  const path=`${slug}/quiz-attempts/${attempt.body.id}`;
  assert.equal((await request(app,student,path+'/answers','PUT',{answers:[{questionId:safe.body.questions[0].id,alternativeId:'a'}]})).status,200);
  assert.equal((await request(app,student,path+'/submit','POST',{},'submission')).status,200);
  const own=`${slug}/courses/${courseId}/my-grades`;assert.deepEqual((await request(app,student,own)).body.items,[]);
  const pub=`${slug}/courses/${courseId}/gradebook/publications`,body={gradeItemIds:[item],sectionIds:[section],studentIds:[studentId]};
  assert.equal((await request(app,teacher,pub,'POST',body,'publication')).status,200);
  const result=await request(app,student,own);assert.equal(result.body.partialAverage,7);assert.equal(result.body.publishedWeightPercent,100);assert.equal(result.body.isPartial,false);
  assert.equal((await request(app,teacher,`${foreignSlug}/courses/${courseId}/gradebook`)).status,404);
  assert.equal((await request(app,student,`${slug}/courses/${courseId}/audit-events`)).status,403);
  const history=await request(app,teacher,`${slug}/courses/${courseId}/audit-events?action=grade.published`);assert.equal(history.status,200);assert.equal(history.body.items.length,1);
 }
 sanitized((await app.close()).output,[multi,uc,utfsm,question.prompt]);
 }finally{if(app)await app.close();await pool.end();}
});
