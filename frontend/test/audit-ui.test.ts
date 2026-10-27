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
 try{if(['owner','teacher'].includes(profile)){assert.match(ui.doc.body.textContent!,/grade.published/);assert.match(ui.doc.body.textContent!,/<img/);assert.equal(ui.doc.querySelector('img'),null);assert.ok(ui.doc.querySelector('caption'));assert.equal(ui.doc.querySelector('form button')?.getAttribute('type'),'submit');}else{assert.match(ui.doc.body.textContent!,/permisos/);assert.equal(ui.requests.filter(r=>r.url.includes('audit-events')).length,0);}assert.equal(ui.requests.filter(r=>/gradebook|grade-items|authoring/.test(r.url)).length,0);await ui.actor('student');assert.doesNotMatch(ui.doc.body.textContent!,/grade.published/);}finally{await ui.close();}
 }
});

test('audit invalid dates and UUID stay inline; clear resets controlled inputs and pagination',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json(auditPage):reply(r),'owner');
 try{
  const initial=ui.requests.filter(r=>r.url.includes('audit-events')).length;
  await ui.submit('form',{resourceId:'invalid'});assert.ok(ui.doc.querySelector('input[name="resourceId"][aria-invalid="true"]'));assert.equal(ui.requests.filter(r=>r.url.includes('audit-events')).length,initial);
  await ui.click('Limpiar filtros');assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="resourceId"]')!.value,'');
  await ui.submit('form',{from:'2026-10-26T12:00',to:'2026-10-25T12:00'});assert.match(ui.doc.body.textContent!,/Desde debe ser anterior/);
  assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));await ui.click('Limpiar filtros');assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="from"]')!.value,'');
 }finally{await ui.close();}
});

test('failed next page retains the authorized page; changed filters never reuse its rows',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?(new URL(r.url).searchParams.has('cursor')||new URL(r.url).searchParams.has('action')?Response.json({}, {status:503}):Response.json({...auditPage,hasMore:true,nextCursor:'next'})):reply(r),'owner');
 try{
  await ui.click('Siguiente');assert.match(ui.doc.body.textContent!,/Se conserva la última página/);assert.ok(ui.doc.querySelector('table'));
  await ui.submit('form',{action:'grade.published'});assert.equal(ui.doc.querySelector('table'),null);assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));
 }finally{await ui.close();}
});

test('denied next page clears audit rows instead of retaining a formerly readable snapshot',async()=>{
 let status=403;
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?(new URL(r.url).searchParams.has('cursor')?Response.json({}, {status}):Response.json({...auditPage,hasMore:true,nextCursor:'next'})):reply(r),'owner');
 try{await ui.click('Siguiente');assert.equal(ui.doc.querySelector('table'),null);assert.ok(ui.session.getSnapshot().context?.user);assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));status=503;await ui.click('Reintentar');assert.equal(ui.doc.querySelector('table'),null);}finally{await ui.close();}
});
