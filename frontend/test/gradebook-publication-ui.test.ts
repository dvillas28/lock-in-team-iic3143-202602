import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';
import {CourseGradebook} from '../src/components/gradebook/course-gradebook.tsx';import {mount,reply,book,row,item,course,receipt,frozen} from './fixtures/gradebook.ts';
import {deferred} from './fixtures/gradebook.ts';
test('weights 409 blocks even identical retry; incomplete rectangle never posts',async()=>{
 let puts=0,posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{if(r.method==='PUT'){puts++;return Response.json({code:'GRADE_WEIGHTS_LOCKED'},{status:409});}if(r.method==='POST')posts++;return reply(r);},'ownerTeacher');
 try{await ui.submit('form');assert.equal(puts,1);assert.match(ui.doc.body.textContent!,/Pesos bloqueados/);assert.doesNotMatch(ui.doc.body.textContent!,/Guardar pesos/);await ui.click('Revisar publicación');assert.equal(posts,0);assert.equal(ui.doc.querySelector('dialog[open]'),null);}finally{await ui.close();}
});
test('late publication after revocation cannot restore receipt or selection',async()=>{
 const slow=deferred<Response>();let posts=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>{if(r.method==='POST'){posts++;return slow.promise;}return reply(r);},'ownerTeacher');
 try{for(const value of [item.id,row.sectionId,row.student.id])await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click());await ui.click('Revisar publicación');await ui.click('Confirmar publicación');assert.equal(posts,1);await ui.actor('assistant');await ui.settle(()=>slow.resolve(Response.json(receipt)));assert.doesNotMatch(ui.doc.body.textContent!,/Recibo confirmado|Repetir operación exacta|Publicar notas/);assert.equal(posts,1);}finally{await ui.close();}
});
test('explicit rectangle, dialog quantity, stable replay and confirmed freeze',async()=>{
 let posts=0;const keys:string[]=[],bodies:string[]=[];
 const ui=await mount(h(CourseGradebook,{courseId:course.id}),async r=>{if(r.method==='POST'){posts++;keys.push(r.headers.get('Idempotency-Key')!);bodies.push(await r.text());if(posts===1)throw new Error('lost response');return Response.json(receipt);}if(posts===1&&new URL(r.url).pathname.endsWith('/gradebook'))return Response.json({},{status:503});return reply(r);},'ownerTeacher');
 try{assert.match(ui.doc.body.textContent!,/Sin clave original/);assert.equal(posts,0);
 const check=async(value:string)=>{const el=ui.doc.querySelector<HTMLInputElement>(`input[type=checkbox][value="${value}"]`)!;assert.ok(el);await ui.settle(()=>el.click());};
 await check(item.id);await check(row.sectionId);await check(row.student.id);await ui.click('Revisar publicación');assert.ok(ui.doc.querySelector('dialog[open]'));assert.match(ui.doc.querySelector('dialog')!.textContent!,/1 notas/);
 await ui.click('Confirmar publicación');assert.match(ui.doc.body.textContent!,/incierto/);assert.equal(posts,1);const unload=new ui.dom.window.Event('beforeunload',{cancelable:true});await ui.settle(()=>ui.dom.window.dispatchEvent(unload));assert.equal(unload.defaultPrevented,true);await ui.click('Consultar estado actual');assert.match(ui.doc.body.textContent!,/conserva su clave/);await ui.click('Repetir operación exacta');assert.equal(posts,2);assert.deepEqual(keys,[keys[0],keys[0]]);assert.deepEqual(bodies,[bodies[0],bodies[0]]);assert.match(ui.doc.body.textContent!,/Recibo confirmado/);assert.match(ui.doc.body.textContent!,/Pesos bloqueados/);
 }finally{await ui.close();}
});
test('published later page blocks weights and even no-op save is absent',async()=>{
 let scans=0;const ui=await mount(h(CourseGradebook,{courseId:course.id}),r=>r.url.includes('/gradebook?')?Response.json(++scans>1?frozen:{...book,hasMore:true,nextCursor:'next'}):reply(r),'ownerTeacher');
 try{assert.match(ui.doc.body.textContent!,/Pesos bloqueados/);assert.equal(ui.doc.querySelector('button[type=submit][data-weights]'),null);}finally{await ui.close();}
});
