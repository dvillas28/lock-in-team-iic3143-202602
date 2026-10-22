import {test} from 'node:test';import assert from 'node:assert/strict';
import {reviewDto} from '../src/lib/attempts/review.ts';
import {attemptCapabilities} from '../src/lib/attempts/capabilities.ts';
import {graded,attempt,answers,user,course,quiz,otherSection} from './fixtures/attempts.ts';
import {createApiClient} from '../src/lib/api/client.ts';import {listQuizAttempts,getAttemptReview} from '../src/lib/api/attempts.ts';
import {createElement as h} from 'react';import {AttemptReview} from '../src/components/attempts/attempt-review.tsx';import {mount,reply,staffReview,teacherReview} from './fixtures/attempts.ts';
test('academic review uses safe question/alternative text, correction only for teacher, existing cancellation link',async()=>{
 for(const role of ['teacher','assistant'])for(const active of [true,false]){
 const a=active?{...attempt,scorePercent:null,grade:null}:role==='teacher'?teacherReview:staffReview;
 const ui=await mount(h(AttemptReview,{courseId:course.id,quizId:quiz.id,attemptId:attempt.id}),r=>reply(r,a),role);
 try{if(!active){assert.match(ui.doc.body.textContent!,/¿Cuál es el aislamiento correcto\?/);assert.match(ui.doc.body.textContent!,/Por institución/);}assert.equal(!!ui.doc.querySelector(`a[href="/attempts/${attempt.id}"]`),role==='teacher'&&active);assert.equal(ui.requests.some(r=>r.url.includes('/authoring')),false);if(role==='assistant')assert.doesNotMatch(ui.doc.body.textContent!,/Corrección entregada|puntos/);await ui.actor('student');assert.doesNotMatch(ui.doc.body.textContent!,/Por institución/);}finally{await ui.close();}
 }
});
const staff={...graded,scorePercent:80,grade:5.5};
test('review accepts limited teacher projection and preserves staff answers without correction',()=>{
 assert.equal(reviewDto(staff,{quizId:quiz.id,view:'teacher'}).answers.length,1);
 assert.deepEqual(reviewDto(staff,{quizId:quiz.id,view:'assistant'}).answers,answers);
 const teacher={...staff,answers:[{...answers[0],isCorrect:true,pointsAwarded:2}]};
 assert.equal(reviewDto(teacher,{view:'teacher'}).answers[0].isCorrect,true);
 assert.throws(()=>reviewDto(teacher,{view:'assistant'}));assert.throws(()=>reviewDto(teacher,{view:'student'}));
 assert.equal(reviewDto(graded,{view:'student'}).grade,undefined);
 assert.throws(()=>reviewDto(staff,{quizId:otherSection.id,view:'teacher'}));
 assert.equal(attemptCapabilities(user('assistant'),course,quiz,attempt).cancel,false);
 assert.equal(attemptCapabilities(user('teacher'),course,quiz,attempt).cancel,true);
 const multi={...user('assistant'),sectionMemberships:[...user('assistant').sectionMemberships,{courseId:course.id,sectionId:otherSection.id,role:'student' as const}]};
 assert.equal(attemptCapabilities(multi,course,quiz,attempt).student,true);
});
test('review API uses staff list for own multirol but limited student detail; filters scoped',async()=>{
 const actor={...user('assistant'),sectionMemberships:[...user('assistant').sectionMemberships,{courseId:course.id,sectionId:otherSection.id,role:'student' as const}]};
 const c=createApiClient({baseUrl:'https://api.test',fetch:async r=>Response.json(new URL((r as Request).url).pathname.endsWith('/attempts')?{items:[staff],hasMore:false,nextCursor:null}:graded)});
 assert.equal((await listQuizAttempts(c,'uc',actor,course,quiz)).items[0].grade,5.5);assert.equal((await getAttemptReview(c,'uc',attempt.id,actor,course,quiz)).grade,undefined);
 await assert.rejects(()=>listQuizAttempts(c,'uc',actor,course,quiz,{sectionId:otherSection.id}));await assert.rejects(()=>listQuizAttempts(c,'uc',actor,course,quiz,{limit:0}));
});
