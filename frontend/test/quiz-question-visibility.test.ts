import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement as h} from 'react';
import {QuizDetail} from '../src/components/quizzes/quiz-detail.tsx';
import {AttemptDetail} from '../src/components/attempts/attempt-detail.tsx';
import {mount,reply,quiz,course,attempt} from './fixtures/attempts.ts';

test('student detail hides prompts and alternatives even if an older backend includes them',async()=>{
 const ui=await mount(h(QuizDetail,{courseId:course.id,quizId:quiz.id}),r=>reply(r),'student');
 try{
  assert.doesNotMatch(ui.doc.body.textContent!,/Preguntas ocultas|Preguntas del quiz/);
  assert.match(ui.doc.body.textContent!,/Las preguntas se muestran al iniciar el intento/);
  for(const question of quiz.questions){
   assert.ok(!ui.doc.body.textContent!.includes(question.prompt));
   for(const option of question.alternatives)assert.ok(!ui.doc.body.textContent!.includes(option.text));
  }
  assert.equal(ui.requests.some(r=>r.url.endsWith('/questions')),false);
 }finally{await ui.close();}
});

test('active student attempt requests its own question endpoint after ordinary quiz metadata',async()=>{
 const ui=await mount(h(AttemptDetail,{attemptId:attempt.id}),r=>r.url.includes('/quizzes/')?Response.json({...quiz,questions:[]}):reply(r),'student');
 try{
  assert.ok(ui.requests.some(r=>r.url.endsWith(`/quiz-attempts/${attempt.id}/questions`)));
  assert.match(ui.doc.body.textContent!,new RegExp(quiz.questions[0].prompt.replace(/[?]/g,'\\?')));
  assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,2);
 }finally{await ui.close();}
});

test('teacher preview remains available outside the student attempt',async()=>{
 const ui=await mount(h(QuizDetail,{courseId:course.id,quizId:quiz.id}),r=>reply(r),'teacher');
 try{
  assert.match(ui.doc.body.textContent!,/Preguntas del quiz/);
  assert.ok(ui.doc.body.textContent!.includes(quiz.questions[0].prompt));
  assert.doesNotMatch(ui.doc.body.textContent!,/Preguntas ocultas/);
 }finally{await ui.close();}
});
