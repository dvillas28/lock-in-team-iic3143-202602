import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';
import {CourseGradebook} from '../src/components/gradebook/course-gradebook.tsx';
import {mount,course,reply,book,historical,row} from './fixtures/gradebook.ts';
import {deferred} from './fixtures/gradebook.ts';
test('book pagination resets selection and cursor on section change; late tenant rows discarded',async()=>{
 const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{const u=new URL(r.url);if(u.pathname.endsWith('/gradebook'))return Response.json(u.searchParams.get('cursor')?{...book,items:[historical]}:{...book,hasMore:true,nextCursor:'page-2'});return reply(r);},'ownerTeacher');
 try{await ui.click('Siguiente');assert.ok(ui.requests.some(r=>new URL(r.url).searchParams.get('cursor')==='page-2'));const filter=ui.doc.querySelector<HTMLSelectElement>('select')!;await ui.settle(()=>{filter.value=row.sectionId;filter.dispatchEvent(new ui.dom.window.Event('change',{bubbles:true}));});const latest=ui.requests.filter(r=>new URL(r.url).pathname.endsWith('/gradebook')&&new URL(r.url).searchParams.get('limit')==='20').at(-1)!;assert.equal(new URL(latest.url).searchParams.has('cursor'),false);assert.equal(new URL(latest.url).searchParams.get('sectionId'),row.sectionId);}finally{await ui.close();}
 const slow=deferred<Response>();const delayed=await mount(h(CourseGradebook,{courseId:course.id}),r=>r.url.includes('/uc/')&&new URL(r.url).pathname.endsWith('/gradebook')?slow.promise:reply(r),'assistant');
 try{await delayed.actor('assistant','utfsm');await delayed.settle(()=>slow.resolve(Response.json({...book,items:[{...row,student:{...row.student,name:'OLD UC PRIVATE'}}]})));assert.doesNotMatch(delayed.doc.body.textContent!,/OLD UC PRIVATE/);}finally{await delayed.close();}
});
test('assistant reads historical rows without write controls; owner without teacher denied',async()=>{
 for(const profile of ['assistant','owner']){const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>r.url.includes('/gradebook')?Response.json({...book,items:[{...row,student:{...row.student,active:false}}]}):reply(r),profile);try{
 if(profile==='assistant'){assert.match(ui.doc.body.textContent!,/Histórica|histórica/);assert.ok(ui.doc.querySelector('caption'));assert.doesNotMatch(ui.doc.body.textContent!,/Guardar pesos|Confirmar publicación/);}else {assert.match(ui.doc.body.textContent!,/permisos/);assert.equal(ui.requests.filter(r=>/gradebook|grade-items/.test(r.url)).length,0);}
 await ui.actor('student');assert.doesNotMatch(ui.doc.body.textContent!,new RegExp(historical.student.name));
 }finally{await ui.close();}}
});

test('temporary refresh keeps authorized rows; denied read clears rows without blocking the institution',async()=>{
 let status=200;
 const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>new URL(r.url).pathname.endsWith('/gradebook')?Response.json(status===200?book:{},{status}):reply(r),'assistant');
 try{
  status=503;await ui.click('Consultar estado actual');assert.match(ui.doc.body.textContent!,new RegExp(row.student.name));
  status=404;await ui.click('Consultar estado actual');assert.doesNotMatch(ui.doc.body.textContent!,new RegExp(row.student.name));assert.ok(ui.session.getSnapshot().context?.user);assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));
 }finally{await ui.close();}
});
