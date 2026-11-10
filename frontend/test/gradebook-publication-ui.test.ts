import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {CourseGradebook} from '../src/components/gradebook/course-gradebook.tsx';
import {mount,reply,row,item,course,receipt,deferred,items} from './fixtures/gradebook.ts';
import {watchContextAccess} from '../src/lib/auth/context-events.ts';
const configuration={...items,calculation:'legacy',version:0,hasPublishedGrades:true,
 groups:[{id:item.id,title:item.title,weightPercent:100,position:1}],
 items:[{...item,groupId:item.id,maxPoints:10}]};
async function choose(ui: Awaited<ReturnType<typeof mount>>) {
 await ui.click('Publicar notas');
 for(const value of [item.id,row.sectionId,row.student.id])await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click());
 await ui.click('Revisar publicación');
}
test('group editor requires recalculation confirmation and a version conflict stops writes',async()=>{
 let puts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{
  if(r.method==='PUT'){puts++;return Response.json({code:'GRADEBOOK_CHANGED'},{status:409});}
  return r.url.endsWith('/grade-items')?Response.json(configuration):reply(r);
 },'ownerTeacher');
 try{
  await ui.click('Ponderaciones');
  assert.equal(ui.doc.querySelector<HTMLButtonElement>('dialog[open] button[type=submit]')!.disabled,true);
  await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>('.grade-plan-confirm input')!.click());
  await ui.submit('form');assert.equal(puts,1);
  const toast=ui.doc.querySelector('dialog[open] .content-notices[role="alert"]')!;
  assert.match(toast.textContent!,/versión vigente/);
  await ui.settle(()=>toast.querySelector<HTMLButtonElement>('button[aria-label="Cerrar notificación"]')!.click());
  assert.equal(ui.doc.querySelector('dialog[open] .content-notice'),null);
  assert.equal(ui.doc.querySelector('dialog[open] button[type=submit]'),null);
 }finally{await ui.close();}
});
test('late publication after revocation cannot restore receipt or selection',async()=>{
 const slow=deferred<Response>();let posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{if(r.method==='POST'){posts++;return slow.promise;}return reply(r);},'ownerTeacher');
 try{await choose(ui);await ui.click('Confirmar publicación');assert.equal(posts,1);await ui.actor('assistant');await ui.settle(()=>slow.resolve(Response.json(receipt)));assert.doesNotMatch(ui.doc.body.textContent!,/Recibo confirmado|Repetir operación exacta|Publicar notas/);assert.equal(posts,1);}finally{await ui.close();}
});
test('explicit rectangle, stable replay across focus/refresh and confirmed receipt',async()=>{
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
  await ui.click('Repetir operación exacta');assert.equal(posts,2);assert.deepEqual(keys,[keys[0],keys[0]]);assert.deepEqual(bodies,[bodies[0],bodies[0]]);assert.match(ui.doc.querySelector(".content-notices")!.textContent!,/Notas publicadas correctamente/);
  await ui.click('Ponderaciones');assert.match(ui.doc.body.textContent!,/Grupos de evaluación/);
 }finally{stop();await ui.close();}
});
test('definitive rejection releases filters and permits corrected selection with a new operation',async()=>{
 let posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>r.method==='POST'?(posts++,Response.json({code:'GRADE_ALREADY_PUBLISHED'}, {status:409})):reply(r),'ownerTeacher');
 try{await choose(ui);await ui.click('Confirmar publicación');assert.equal(posts,1);assert.equal(ui.doc.querySelector<HTMLSelectElement>('select')!.disabled,false);assert.ok(ui.doc.querySelector('button')!);await ui.click('Publicar notas');assert.ok(ui.doc.querySelector('dialog[open]'));assert.equal(ui.doc.querySelector<HTMLInputElement>(`input[value="${item.id}"]`)!.checked,false);}finally{await ui.close();}
});
