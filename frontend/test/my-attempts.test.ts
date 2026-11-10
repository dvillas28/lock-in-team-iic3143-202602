import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement as h} from 'react';
import {QuizDetail} from '../src/components/quizzes/quiz-detail.tsx';
import {createApiClient} from '../src/lib/api/client.ts';
import {listMyQuizAttempts} from '../src/lib/api/attempts.ts';
import {mount,reply,attempt,graded,quiz,course,id,deferred} from './fixtures/attempts.ts';
const available={canStart:true,reason:null,remainingAttempts:2,activeAttemptId:null};
const page=(items:unknown[]=[],availability:unknown=available,extra={})=>({items,hasMore:false,nextCursor:null,availability,...extra});
const view=()=>h(QuizDetail,{courseId:course.id,quizId:quiz.id});
const button=(doc:Document,label:string)=>Array.from(doc.querySelectorAll('button')).find(b=>b.textContent===label);

test('own history resumes without codes; pagination preserves the active attempt outside the page',async()=>{
 const active={...available,canStart:false,reason:'activeAttempt',activeAttemptId:attempt.id};
 const ui=await mount(view(),r=>r.url.includes('/my-attempts')?Response.json(new URL(r.url).searchParams.has('cursor')?page([attempt],active):page([graded],active,{hasMore:true,nextCursor:'next-page'})):reply(r),'student');
 try{
  assert.match(ui.doc.body.textContent!,/Mis intentos/);
  assert.equal(ui.doc.querySelector('input'),null);
  assert.equal(ui.doc.querySelector('a.btn-primary')?.getAttribute('href'),`/attempts/${attempt.id}`);
  assert.equal(button(ui.doc,'Iniciar nuevo intento'),undefined);
  assert.ok(ui.doc.querySelector('a[aria-label="Ver intento 1"]'));
  await ui.click('Siguiente');
  assert.ok(ui.requests.some(r=>r.url.includes('cursor=next-page')));
  assert.ok(ui.doc.querySelector('a[aria-label="Continuar intento 1"]'));
  await ui.click('Anterior');
  assert.match(ui.doc.body.textContent!,/Página 1/);
  assert.equal(ui.requests.some(r=>r.url.endsWith('/attempts')&&r.method==='POST'),false);
  assert.equal(ui.requests.some(r=>r.url.includes('/authoring')),false);
 }finally{await ui.close();}
});

test('new attempt is unavailable while history is loading or failed, and recovers on retry',async()=>{
 const wait=deferred<Response>();let reads=0;
 const ui=await mount(view(),r=>r.url.includes('/my-attempts')?(++reads===1?wait.promise:Response.json(page())):reply(r),'student');
 try{
  assert.equal(button(ui.doc,'Iniciar nuevo intento'),undefined);
  await ui.settle(()=>wait.resolve(Response.json({},{status:503})));
  assert.equal(button(ui.doc,'Iniciar nuevo intento'),undefined);
  await ui.click('Reintentar');
  assert.match(ui.doc.body.textContent!,/Aún no has rendido este quiz/);
  assert.equal(button(ui.doc,'Iniciar nuevo intento')?.disabled,false);
 }finally{await ui.close();}
});

test('server availability explains closed windows, limits and published grades without offering new starts',async()=>{
 for(const [reason,message] of [['closed',/plazo.*terminó/],['notOpen',/todavía no abre/],['limitReached',/todos los intentos/],['gradesPublished',/nota.*publicada/]] as const){
  const ui=await mount(view(),r=>r.url.includes('/my-attempts')?Response.json(page([graded],{...available,canStart:false,reason})):reply(r),'student');
  try{assert.match(ui.doc.body.textContent!,message);assert.equal(button(ui.doc,'Iniciar nuevo intento'),undefined);assert.doesNotMatch(ui.doc.body.textContent!,/7\.0|puntaje|isCorrect/);}
  finally{await ui.close();}
 }
});

test('history is discarded when changing actor and never requested for a teacher',async()=>{
 const ui=await mount(view(),r=>r.url.includes('/my-attempts')?Response.json(page([graded])):reply(r),'student');
 try{
  assert.match(ui.doc.body.textContent!,/Mis intentos/);
  const requests=ui.requests.filter(r=>r.url.includes('/my-attempts')).length;
  await ui.actor('teacher');
  assert.doesNotMatch(ui.doc.body.textContent!,/Mis intentos|Intento 1/);
  assert.equal(ui.requests.filter(r=>r.url.includes('/my-attempts')).length,requests);
 }finally{await ui.close();}
});

test('own-history API never sends an identity filter and rejects foreign or leaked academic data',async()=>{
 const requests:Request[]=[];
 const client=(data:unknown)=>createApiClient({baseUrl:'https://api.test',fetch:async r=>{requests.push(r as Request);return Response.json(data);}});
 const result=await listMyQuizAttempts(client(page([graded])),'uc',quiz.id,attempt.studentId,{limit:1});
 assert.equal(result.items[0].studentId,attempt.studentId);
 assert.equal(new URL(requests[0].url).pathname,`/api/v1/institution/uc/quizzes/${quiz.id}/my-attempts`);
 assert.equal(new URL(requests[0].url).searchParams.has('studentId'),false);
 for(const data of [page([{...graded,studentId:id(99)}]),page([{...graded,quizId:id(99)}]),page([{...graded,grade:7}]),page([{...graded,answers:[{questionId:id(4),alternativeId:'a',isCorrect:true}]}]),page([graded,graded]),page([],{...available,canStart:false}),page([],{...available,activeAttemptId:id(99)}),page([],{}),page([],{...available,remainingAttempts:-1})]){
  await assert.rejects(listMyQuizAttempts(client(data),'uc',quiz.id,attempt.studentId));
 }
});
