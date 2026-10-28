import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {CourseGradebook} from '../src/components/gradebook/course-gradebook.tsx';
import {mount,reply,book,row,item,course,receipt,frozen,deferred} from './fixtures/gradebook.ts';
import {watchContextAccess} from '../src/lib/auth/context-events.ts';
async function choose(ui: Awaited<ReturnType<typeof mount>>) {
 await ui.click('Publicar notas');
 for(const value of [item.id,row.sectionId,row.student.id])await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click());
 await ui.click('Revisar publicación');
}
test('weights load lazily, 409 blocks even identical retry; incomplete rectangle never posts',async()=>{
 let puts=0,posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{if(r.method==='PUT'){puts++;return Response.json({code:'GRADE_WEIGHTS_LOCKED'},{status:409});}if(r.method==='POST')posts++;return reply(r);},'ownerTeacher');
 try{
  assert.equal(ui.requests.filter(r=>new URL(r.url).searchParams.get('limit')==='100').length,0);
  await ui.click('Ponderaciones');await ui.submit('form');assert.equal(puts,1);assert.match(ui.doc.body.textContent!,/Pesos bloqueados/);assert.equal(ui.doc.querySelector('button[data-weights]'),null);
  await ui.settle(()=>ui.doc.querySelector<HTMLDialogElement>('dialog[aria-label="Ponderaciones del curso"]')!.close());
  await ui.click('Publicar notas');assert.equal(ui.doc.querySelector<HTMLButtonElement>('dialog[open] .dialog-actions .btn-primary')?.disabled,true);assert.equal(posts,0);
 }finally{await ui.close();}
});
test('late publication after revocation cannot restore receipt or selection',async()=>{
 const slow=deferred<Response>();let posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{if(r.method==='POST'){posts++;return slow.promise;}return reply(r);},'ownerTeacher');
 try{await choose(ui);await ui.click('Confirmar publicación');assert.equal(posts,1);await ui.actor('assistant');await ui.settle(()=>slow.resolve(Response.json(receipt)));assert.doesNotMatch(ui.doc.body.textContent!,/Recibo confirmado|Repetir operación exacta|Publicar notas/);assert.equal(posts,1);}finally{await ui.close();}
});
test('explicit rectangle, stable replay across focus/refresh and confirmed freeze',async()=>{
 let posts=0;const keys:string[]=[],bodies:string[]=[];
 const ui=await mount(h(CourseGradebook,{courseId:course.id}),async r=>{if(r.method==='POST'){posts++;keys.push(r.headers.get('Idempotency-Key')!);bodies.push(await r.text());if(posts===1)throw new Error('lost response');return Response.json(receipt);}if(posts===1&&new URL(r.url).pathname.endsWith('/gradebook'))return Response.json({}, {status:503});return reply(r);},'ownerTeacher');
 const stop=watchContextAccess(ui.session,'uc',ui.dom.window as unknown as Window,ui.doc);
 try{
  await choose(ui);assert.match(ui.doc.querySelector('dialog[open]')!.textContent!,/1 notas/);
  await ui.click('Confirmar publicación');assert.match(ui.doc.body.textContent!,/incierto/);assert.equal(posts,1);
  const context=ui.session.getSnapshot().context;
  await ui.settle(()=>ui.dom.window.dispatchEvent(new ui.dom.window.Event('focus')));await new Promise(r=>setTimeout(r,10));await ui.settle(()=>{});
  assert.equal(ui.session.getSnapshot().context,context);assert.equal(posts,1);assert.match(ui.doc.body.textContent!,/Repetir operación exacta/);
  const unload=new ui.dom.window.Event('beforeunload',{cancelable:true});await ui.settle(()=>ui.dom.window.dispatchEvent(unload));assert.equal(unload.defaultPrevented,true);
  await ui.click('Consultar estado actual');assert.match(ui.doc.body.textContent!,/Repetir operación exacta/);
  await ui.click('Repetir operación exacta');assert.equal(posts,2);assert.deepEqual(keys,[keys[0],keys[0]]);assert.deepEqual(bodies,[bodies[0],bodies[0]]);assert.match(ui.doc.body.textContent!,/Recibo confirmado/);
  await ui.click('Ponderaciones');assert.match(ui.doc.body.textContent!,/Pesos bloqueados/);
 }finally{stop();await ui.close();}
});
test('published later page blocks weights and no-op save is absent',async()=>{
 const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>new URL(r.url).pathname.endsWith('/gradebook')?Response.json(new URL(r.url).searchParams.get('cursor')?frozen:{...book,hasMore:true,nextCursor:'next'}):reply(r),'ownerTeacher');
 try{await ui.click('Ponderaciones');assert.match(ui.doc.body.textContent!,/Pesos bloqueados/);assert.equal(ui.doc.querySelector('button[type=submit][data-weights]'),null);}finally{await ui.close();}
});
test('definitive rejection releases filters and permits corrected selection with a new operation',async()=>{
 let posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>r.method==='POST'?(posts++,Response.json({code:'GRADE_ALREADY_PUBLISHED'}, {status:409})):reply(r),'ownerTeacher');
 try{await choose(ui);await ui.click('Confirmar publicación');assert.equal(posts,1);assert.equal(ui.doc.querySelector<HTMLSelectElement>('select')!.disabled,false);assert.ok(ui.doc.querySelector('button')!);await ui.click('Corregir selección');assert.ok(ui.doc.querySelector('dialog[open]'));assert.equal(ui.doc.querySelector<HTMLInputElement>(`input[value="${item.id}"]`)!.checked,false);}finally{await ui.close();}
});
