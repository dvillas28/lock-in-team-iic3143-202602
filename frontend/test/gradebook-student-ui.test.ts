import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {StudentGrades} from '../src/components/gradebook/student-grades.tsx';
import {mount,course,reply,zero,empty,deferred,mine} from './fixtures/gradebook.ts';
test('student sees published only, backend null and accessible table',async()=>{
 for(const data of [mine,zero,empty]){const ui=await mount(h(StudentGrades,{courseId:course.id}),r=>r.url.endsWith('/my-grades')?Response.json(data):reply(r),'student');try{
 assert.match(ui.doc.body.textContent!,data.partialAverage===null?/Pendiente/:/5.5/);assert.equal(ui.requests.filter(r=>/gradebook|grade-items|quiz-attempts/.test(r.url)).length,0);
 assert.equal(!!ui.doc.querySelector('caption'),data.items.length>0);assert.equal(!!ui.doc.querySelector('th[scope]'),data.items.length>0);assert.ok(ui.doc.querySelector('nav[aria-label="Curso"] a[aria-current="page"][href$="/grades"]')); 
 await ui.settle(()=>ui.session.logout());assert.doesNotMatch(ui.doc.body.textContent!,/5.5|Quiz de aislamiento/);
 }finally{await ui.close();}}
});
test('late UC response cannot enter UTFSM context',async()=>{
 const slow=deferred<Response>();const ui=await mount(h(StudentGrades,{courseId:course.id}),r=>r.url.includes('/uc/')&&r.url.endsWith('/my-grades')?slow.promise:r.url.endsWith('/my-grades')?Response.json(empty):reply(r),'student');
 try{await ui.actor('student','utfsm');await ui.settle(()=>slow.resolve(Response.json(mine)));assert.doesNotMatch(ui.doc.body.textContent!,/Quiz de aislamiento|5.5/);}finally{await ui.close();}
});
