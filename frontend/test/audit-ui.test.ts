import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';
import {CourseAudit} from '../src/components/audit/course-audit.tsx';import {mount,reply,course} from './fixtures/gradebook.ts';import {auditPage,event,globalEvent} from './fixtures/audit.ts';
import {deferred,id} from './fixtures/gradebook.ts';
const last=(ui:{requests:Request[]})=>new URL(ui.requests.filter(r=>r.url.includes('audit-events')).at(-1)!.url).searchParams;
const open=async(ui:Awaited<ReturnType<typeof mount>>,index=0)=>{const row=ui.doc.querySelectorAll<HTMLButtonElement>('button.audit-row')[index];assert.ok(row,'audit row');await ui.settle(()=>row.click());return ui.doc.querySelector<HTMLDialogElement>('dialog.audit-dialog')!;};

test('audit page/filter resets cursor and late actor response is discarded',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json({...auditPage,hasMore:true,nextCursor:'next'}):reply(r),'owner');
 try{await ui.click('Siguiente');assert.equal(last(ui).get('cursor'),'next');await ui.submit('form',{action:'grade.published'});assert.equal(last(ui).has('cursor'),false);assert.equal(last(ui).get('action'),'grade.published');}finally{await ui.close();}
 const slow=deferred<Response>(),delayed=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?slow.promise:reply(r),'owner');try{await delayed.actor('student');await delayed.settle(()=>slow.resolve(Response.json(auditPage)));assert.equal(delayed.doc.querySelector('.audit-row'),null);}finally{await delayed.close();}
});

test('owner without teacher sees escaped audit only; assistant/student/super denied',async()=>{
 for(const profile of ['owner','teacher','assistant','student','super']){
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json(profile==='owner'?{...auditPage,items:[event,globalEvent]}:auditPage):reply(r),profile);
 try{
  if(['owner','teacher'].includes(profile)){
   assert.ok(ui.doc.querySelector('section[aria-label="Actividad del curso"] .audit-day'));assert.ok(ui.doc.querySelector('form button[type="submit"]'));
   assert.match(ui.doc.querySelector('.audit-row')!.textContent!,/Nota publicada/);if(profile==='owner')assert.match(ui.doc.body.textContent!,/Todo el curso/);
   const dialog=await open(ui);assert.match(dialog.textContent!,/grade\.published/);assert.match(dialog.textContent!,/<img/);assert.equal(ui.doc.querySelector('img'),null);assert.ok(dialog.querySelector('caption'));
  }else{assert.match(ui.doc.body.textContent!,/permisos/);assert.equal(ui.requests.filter(r=>r.url.includes('audit-events')).length,0);}
  assert.equal(ui.requests.filter(r=>/gradebook|grade-items|authoring/.test(r.url)).length,0);await ui.actor('student');assert.equal(ui.doc.querySelector('.audit-row'),null);assert.doesNotMatch(ui.doc.body.textContent!,/grade\.published/);
 }finally{await ui.close();}
 }
});

test('audit invalid dates and UUID stay inline; clearing resets controlled inputs and pagination',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json(auditPage):reply(r),'owner');
 try{
  const initial=ui.requests.filter(r=>r.url.includes('audit-events')).length;
  await ui.submit('form',{resourceId:'invalid'});assert.ok(ui.doc.querySelector('input[name="resourceId"][aria-invalid="true"]'));assert.equal(ui.requests.filter(r=>r.url.includes('audit-events')).length,initial);
  await ui.click('Limpiar campos');assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="resourceId"]')!.value,'');
  await ui.submit('form',{from:'2026-10-26T12:00',to:'2026-10-25T12:00'});assert.match(ui.doc.body.textContent!,/Desde debe ser anterior/);
  assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));await ui.click('Limpiar campos');assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="from"]')!.value,'');
  await ui.submit('form',{resourceId:id(90)});assert.equal(last(ui).get('resourceId'),id(90));
  await ui.click('Limpiar filtros');assert.equal(last(ui).has('resourceId'),false);assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="resourceId"]')!.value,'');
 }finally{await ui.close();}
});

test('quick periods, selects and removable chips drive the same contractual query',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json(auditPage):reply(r),'owner');
 try{
  await ui.click('7 días');const from=last(ui).get('from');assert.ok(from&&Date.parse(from)<Date.now());assert.equal(last(ui).has('to'),false);
  assert.equal(Array.from(ui.doc.querySelectorAll('.tab-btn')).find(b=>b.textContent==='7 días')?.getAttribute('aria-pressed'),'true');
  await ui.select('select[name="action"]','grade.published');assert.equal(last(ui).get('action'),'grade.published');assert.equal(last(ui).get('from'),from);
  assert.ok(ui.doc.querySelector('button[aria-label="Quitar filtro Acción"]'));
  await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Quitar filtro Acción"]')!.click());assert.equal(last(ui).has('action'),false);assert.equal(last(ui).get('from'),from);
  await ui.click('Todo');assert.equal(last(ui).has('from'),false);assert.equal(ui.doc.querySelector('.audit-active'),null);
 }finally{await ui.close();}
});

test('change detail highlights modified fields and reveals the rest on demand',async()=>{
 const edited={...event,action:'material.updated',resourceType:'material',changes:{before:{title:'Antes',position:1},after:{title:'Después',position:1}}};
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?Response.json({...auditPage,items:[edited]}):reply(r),'owner');
 try{
  const dialog=await open(ui);const rows=()=>Array.from(dialog.querySelectorAll('tbody tr'));
  assert.equal(rows().length,1);assert.ok(rows()[0].classList.contains('audit-changed'));assert.match(rows()[0].textContent!,/TítuloAntesDespués/);
  await ui.settle(()=>dialog.querySelector<HTMLInputElement>('.audit-toggle input')!.click());assert.equal(rows().length,2);
 }finally{await ui.close();}
});

test('failed next page retains the authorized page; changed filters never reuse its rows',async()=>{
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?(new URL(r.url).searchParams.has('cursor')||new URL(r.url).searchParams.has('action')?Response.json({}, {status:503}):Response.json({...auditPage,hasMore:true,nextCursor:'next'})):reply(r),'owner');
 try{
  await ui.click('Siguiente');assert.match(ui.doc.body.textContent!,/Se conserva la última página/);assert.ok(ui.doc.querySelector('.audit-row'));
  await ui.submit('form',{action:'grade.published'});assert.equal(ui.doc.querySelector('.audit-row'),null);assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));
 }finally{await ui.close();}
});

test('denied next page clears audit rows instead of retaining a formerly readable snapshot',async()=>{
 let status=403;
 const ui=await mount(h(CourseAudit,{courseId:course.id}),r=>r.url.includes('audit-events')?(new URL(r.url).searchParams.has('cursor')?Response.json({}, {status}):Response.json({...auditPage,hasMore:true,nextCursor:'next'})):reply(r),'owner');
 try{await ui.click('Siguiente');assert.equal(ui.doc.querySelector('.audit-row'),null);assert.ok(ui.session.getSnapshot().context?.user);assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'));status=503;await ui.click('Reintentar');assert.equal(ui.doc.querySelector('.audit-row'),null);}finally{await ui.close();}
});
