import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http,sanitized} from './helpers.mjs';
import {quizFixture,tokens,request,users,question} from './quiz-fixtures.mjs';
import {createApiClient} from '../../../frontend/src/lib/api/client.ts';
import access from '../../dist/quizzes/quiz-access.js';
import quizDto from '../../dist/quizzes/quiz-dto.js';
import {runtimeDatabase} from './helpers.mjs';
test('US2 generated client against real HTTP sees safe DTO, protected headers and sanitized transport errors',async()=>{
 const pool=await database();let app;const secrets=[];try{
  const f=await quizFixture(pool,true);app=await http();const t=await tokens(app,f);secrets.push(...Object.values(t),question.prompt,question.alternatives[0].text);
  const client=createApiClient({baseUrl:app.base,getToken:()=>t.student,fetch:async input=>{
   assert.equal(input.cache,'no-store');const response=await fetch(input);
   assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');return response;
  }});
  const list=await client.GET('/api/v1/institution/{institutionSlug}/courses/{courseId}/quizzes',{params:{path:{institutionSlug:'uc',courseId:f.own}}});
  assert.equal(list.data.items.length,2);
  const detail=await client.GET('/api/v1/institution/{institutionSlug}/quizzes/{quizId}',{params:{path:{institutionSlug:'uc',quizId:f.quizzes.section}}});
  assert.equal('isCorrect' in detail.data.questions[0].alternatives[0],false);
  const author=quizDto.authoringDto((await pool.query('SELECT * FROM quizzes WHERE id=$1',[f.quizzes.section])).rows[0]);
  assert.equal(author.questions[0].alternatives[0].isCorrect,true);
  assert.deepEqual(detail.data.questions.map(q=>q.alternatives.map(a=>Object.keys(a))),[[['id','text'],['id','text']]]);
  for(const [body,type,status] of [[JSON.stringify({instructions:'x'.repeat(4096)}),'application/json',413],['{bad','application/json',400],['bad','text/plain',415]]){
   const response=await fetch(app.base+'/api/v1/institution/uc/quizzes/'+f.quizzes.draft,{method:'PATCH',headers:{Authorization:'Bearer '+t.teacher,'Content-Type':type},body});
   assert.equal(response.status,status);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   const problem=await response.json();assert.equal(JSON.stringify(problem).includes('isCorrect'),false);assert.equal(JSON.stringify(problem).includes(question.prompt),false);
  }
  await assert.rejects(createApiClient({baseUrl:app.base}).GET('/api/v1/institution/{institutionSlug}/quizzes/{quizId}',{params:{path:{institutionSlug:'uc',quizId:f.quizzes.section}}}),e=>e.status===401);
  assert.equal((await request(app,t.owner,'uc/quizzes/bad')).status,400);
  assert.equal((await request(app,t.owner,'uc/quizzes/'+f.quizzes.foreign)).status,404);
  // Seed a reassignment event without US1; target-only teachers cannot read its old scope.
  await pool.query("INSERT INTO audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,changes) VALUES(gen_random_uuid(),$1,$2,'quiz.updated','quiz',$3,$4,$5)",
   [f.tenants.uc,users.owner,f.quizzes.draft,f.own,{before:{sectionId:f.s1},after:{sectionId:f.s2}}]);
  const events=(await request(app,t.teacher,`uc/courses/${f.own}/audit-events`)).body.items;
  assert.deepEqual(events,[]);
  assert.equal((await request(app,t.owner,`uc/courses/${f.own}/audit-events`)).body.items.length,1);
 }finally{if(app)sanitized((await app.close()).output,secrets);await pool.end();}
});
test('US2 reusable attempt eligibility uses live student scope and the exact authoring predicate',async()=>{
 const pool=await database();let runtime;try{
  const f=await quizFixture(pool,true);
  runtime=await runtimeDatabase();
  const eligible=(actor,id,section)=>runtime.withInstitution(actor,'uc',c=>access.requireStudentAttemptEligibility(c,actor,'uc',id,section));
  await eligible(users.revoked,f.quizzes.section,f.s1);
  await assert.rejects(eligible(users.owner,f.quizzes.section,f.s1),e=>e.getStatus()===403);
  await assert.rejects(eligible(users.owner,f.quizzes.global,f.s1),e=>e.getStatus()===403);
  await pool.query('UPDATE institution_memberships SET is_admin=false WHERE user_id=$1 AND institution_id=$2',[users.owner,f.tenants.uc]);
  await f.add(f.s2,users.owner,'student');
  await eligible(users.owner,f.quizzes.second,f.s2);
  await assert.rejects(eligible(users.revoked,f.quizzes.second,f.s1),e=>e.getStatus()===404);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='student'",[users.revoked]);
  await assert.rejects(eligible(users.revoked,f.quizzes.section,f.s1),e=>e.getStatus()===404);
  await pool.query('UPDATE institution_memberships SET is_admin=false WHERE user_id=$1 AND institution_id=$2',[users.owner,f.tenants.uc]);
  await eligible(users.owner,f.quizzes.global,f.s1);
 }finally{await runtime?.onApplicationShutdown();await pool.end();}
});
