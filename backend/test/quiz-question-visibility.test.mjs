import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import quizzes from '../dist/quizzes/quizzes.service.js';
import attempts from '../dist/attempts/attempts.service.js';
const actor=randomUUID(),tenant=randomUUID(),course=randomUUID(),quiz=randomUUID(),section=randomUUID(),attempt=randomUUID();
const question={id:randomUUID(),position:1,prompt:'Pregunta privada',points:1,alternatives:[{id:'a',text:'Privada',isCorrect:true},{id:'b',text:'Otra',isCorrect:false}]};
function fixture({roles=['student'],student=actor,status='in_progress',active=true}={}){
 const row={id:quiz,course_id:course,section_id:section,title:'Control',instructions:'Instrucciones públicas',opens_at:null,closes_at:null,max_attempts:3,published_at:'2026-11-01T10:00:00Z',questions:[question]};
 const record={id:attempt,quiz_id:quiz,section_id:section,student_id:student,status};
 const queries=[];
 const client={query:async(sql)=>{
  queries.push(sql);let rows=[];
  if(sql.startsWith('SELECT active FROM'))rows=[{active}];
  else if(sql.startsWith('SELECT m.*'))rows=[{institution_id:tenant,user_id:actor,is_admin:false}];
  else if(sql.startsWith('SELECT course_id'))rows=[{course_id:course,quiz_id:quiz}];
  else if(sql.startsWith('SELECT * FROM public.courses'))rows=[{id:course,created_by:randomUUID()}];
  else if(sql.startsWith('SELECT e.*'))rows=roles.map(role=>({role,section_id:section}));
  else if(sql.startsWith('SELECT q.section_id'))rows=[{section_id:section}];
  else if(sql.startsWith('SELECT student_id,section_id'))rows=[record];
  else if(sql.startsWith('SELECT * FROM public.quiz_attempts'))rows=[record];
  else if(sql.startsWith('SELECT * FROM public.quizzes')||sql.startsWith('SELECT q.*'))rows=[row];
  else assert.match(sql,/^SELECT (id|m.id)/);
  return {rows};
 }};
 const db={withInstitution:async(a,slug,fn)=>{assert.equal(a,actor);assert.equal(slug,'uc');return fn(client);}};
 return {queries,quiz:new quizzes.QuizzesService(db,{}),attempt:new attempts.AttemptsService(db,{})};
}

test('ordinary student and assistant+student requests expose metadata but no questions',async()=>{
 for(const roles of [['student'],['student','assistant']]){
  const f=fixture({roles}),result=await f.quiz.get(actor,'uc',quiz);
  assert.deepEqual(result.questions,[]);assert.equal(result.instructions,'Instrucciones públicas');
  assert.ok(!JSON.stringify(result).includes(question.prompt));
 }
 const f=fixture({roles:['teacher']});
 assert.equal((await f.quiz.get(actor,'uc',quiz)).questions.length,1);
});

test('only own active student attempts return questions, with no correction or writes',async()=>{
 const f=fixture(),result=await f.attempt.questions(actor,'uc',attempt);
 assert.equal(result.questions[0].prompt,question.prompt);
 assert.deepEqual(Object.keys(result.questions[0].alternatives[0]).sort(),['id','text']);
 assert.ok(f.queries.every(sql=>sql.startsWith('SELECT')));
 for(const [options,status] of [[{student:randomUUID()},404],[{roles:['teacher']},403],[{roles:['assistant']},403],[{status:'graded'},409],[{status:'cancelled'},409],[{active:false},401]]){
  await assert.rejects(fixture(options).attempt.questions(actor,'uc',attempt),e=>e.getStatus()===status);
 }
});
