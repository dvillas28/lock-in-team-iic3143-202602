import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';
import {CourseAudit} from '../src/components/audit/course-audit.tsx';import {mount,reply,course} from './fixtures/gradebook.ts';import {auditPage,event,globalEvent} from './fixtures/audit.ts';
import {deferred} from './fixtures/gradebook.ts';
test('audit page/filter resets cursor and late actor response is discarded',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json({...auditPage,hasMore:true,nextCursor:'next'}):reply(r),'owner');
 try{await ui.click('Siguiente');assert.ok(ui.requests.some(r=>new URL(r.url).searchParams.get('cursor')==='next'));await ui.submit('form',{action:'grade.published'});const u=new URL(ui.requests.filter(r=>r.url.includes('audit-events')).at(-1)!.url);assert.equal(u.searchParams.has('cursor'),false);assert.equal(u.searchParams.get('action'),'grade.published');}finally{await ui.close();}
 const slow=deferred<Response>(),delayed=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?slow.promise:reply(r),'owner');try{await delayed.actor('student');await delayed.settle(()=>slow.resolve(Response.json(auditPage)));assert.doesNotMatch(delayed.doc.body.textContent!,/grade.published/);}finally{await delayed.close();}
});
test('owner without teacher sees escaped audit only; assistant/student/super denied',async()=>{
 for(const profile of ['owner','teacher','assistant','student','super']){
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json(profile==='owner'?{...auditPage,items:[event,globalEvent]}:auditPage):reply(r),profile);
 try{if(['owner','teacher'].includes(profile)){assert.match(ui.doc.body.textContent!,/grade.published/);assert.match(ui.doc.body.textContent!,/<img/);assert.equal(ui.doc.querySelector('img'),null);assert.ok(ui.doc.querySelector('caption'));}else{assert.match(ui.doc.body.textContent!,/permisos/);assert.equal(ui.requests.filter(r=>r.url.includes('audit-events')).length,0);}assert.equal(ui.requests.filter(r=>/gradebook|grade-items|authoring/.test(r.url)).length,0);await ui.actor('student');assert.doesNotMatch(ui.doc.body.textContent!,/grade.published/);}finally{await ui.close();}
 }
});
