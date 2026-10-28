import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { listSectionEnrollments, createSectionEnrollment, updateSectionEnrollment, searchInstitutionUsers } from "../src/lib/api/enrollments.ts";
import { createApiClient } from "../src/lib/api/client.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, otherSection, enrollment, history, person, id, page, deferred } from "./fixtures/courses.ts";
const reply=(r:Request)=>Response.json(r.url.endsWith('/sections')?{items:[section,otherSection]}:r.url.includes('/enrollments')?page([enrollment,history]):r.url.includes('/sections/')?section:course);
test("enrollment API preserves returned successor, pagination and HTTP failures",async()=>{
 const requests:Request[]=[];const successor={...enrollment,id:id(99),role:'teacher'};
 const c=createApiClient({baseUrl:'https://api.test',fetch:async input=>{const r=input as Request;requests.push(r);return Response.json(r.method==='GET'?page([enrollment],'opaque+/='):successor,{status:r.method==='POST'?201:200});}});
 assert.equal((await listSectionEnrollments(c,'utfsm',section.id,'previous',1)).nextCursor,'opaque+/=');
 assert.equal((await createSectionEnrollment(c,'utfsm',section.id,{userId:person.id,role:'student'})).id,id(99));
 assert.equal((await updateSectionEnrollment(c,'utfsm',section.id,enrollment.id,{role:'teacher'})).id,id(99));
 assert.ok(requests.every(r=>r.url.includes('/institution/utfsm/')));assert.ok(requests[0].url.includes('cursor=previous'));
 await assert.rejects(updateSectionEnrollment(c,'uc',section.id,enrollment.id,{role:'teacher',active:false}));
 await assert.rejects(listSectionEnrollments(c,'uc',section.id,undefined,101));
 for(const status of [404,409,422,503]){const bad=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({},{status})});await assert.rejects(searchInstitutionUsers(bad,'uc','María'));}
});
test("only authorized sections mount participant management; owner without teacher never searches",async()=>{
 for(const profile of ['owner','teacher','assistant','student','super','foreign']){
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),reply,profile);try{
 const allowed=['owner','teacher','foreign'].includes(profile);
 assert.equal(!!ui.doc.querySelector('select[name="managedSection"]'),allowed);
 if(allowed)await ui.select('select[name="managedSection"]',section.id);
 assert.equal(ui.requests.some(r=>r.url.includes('/enrollments')),allowed);
 if(profile==='owner'){assert.ok(ui.doc.querySelector('input[name="userId"]'));assert.equal(ui.doc.querySelector('input[name="search"]'),null);assert.ok(ui.requests.every(r=>!r.url.includes('/users')&&!r.url.includes('/memberships')));}
 if(profile==='teacher'||profile==='foreign'){assert.equal(ui.doc.querySelector('select[name="managedSection"] option[value="'+otherSection.id+'"]'),null);assert.equal(ui.requests.some(r=>r.url.includes(`${otherSection.id}/enrollments`)),false);}
 }finally{await ui.close();}}
});
test("history and sibling roles survive role successor, POST 200 and pagination reset",async()=>{
 let rows: import("../src/lib/courses/validation.ts").Enrollment[]=[enrollment,history];const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),async r=>{
 if(!r.url.includes('/enrollments'))return reply(r);
 if(r.method==='POST')return Response.json(enrollment);
 if(r.method==='PATCH'){rows=[{...enrollment,active:false},history,{...enrollment,id:id(99),role:'teacher'}];return Response.json(rows[2]);}
 return Response.json(page(rows));
 });try{
 await ui.select('select[name="managedSection"]',section.id);assert.match(ui.doc.body.textContent!,/Histórica/);await ui.submit('form[aria-label="Asignar rol"]',{userId:person.id,role:'student'});
 await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>(`[data-enrollment-id="${enrollment.id}"] button`)!.click());
 await ui.submit(`form[aria-label="Cambiar rol ${enrollment.id}"]`,{role:'teacher'});
 assert.match(ui.doc.body.textContent!,/Docente/);assert.equal(ui.doc.querySelectorAll('[data-enrollment-id]').length,3);
 assert.ok(ui.doc.querySelector(`[data-enrollment-id="${id(99)}"]`));
 }finally{await ui.close();}
});
test("revoke last teacher requires confirmation; cancel sends nothing",async()=>{
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>r.url.includes('/enrollments')?Response.json(r.method==='PATCH'?{...enrollment,role:'teacher',active:false}:page([{...enrollment,role:'teacher'}])):reply(r));try{
 await ui.select('select[name="managedSection"]',section.id);const dialog=ui.doc.querySelector('dialog') as HTMLDialogElement;
 dialog.showModal=()=>{dialog.setAttribute('open','');};dialog.close=()=>{dialog.removeAttribute('open');};
 await ui.click('Gestionar');await ui.click('Revocar Docente');assert.ok(dialog.hasAttribute('open'));
 await ui.settle(()=>dialog.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));assert.equal(ui.doc.activeElement?.textContent,'Confirmar revocación');await ui.click('Cancelar');assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,0);
 await ui.click('Revocar Docente');await ui.click('Confirmar revocación');assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,1);assert.deepEqual(await ui.requests.find(r=>r.method==='PATCH')!.json(),{active:false});
 }finally{await ui.close();}
});
test("search 404 is unavailable, not empty; stale searches and section completions discarded",async()=>{
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>r.url.includes('/users')?Response.json({},{status:404}):reply(r),'teacher');try{
 await ui.select('select[name="managedSection"]',section.id);await ui.submit('form[aria-label="Buscar participantes"]',{search:'María'});assert.doesNotMatch(ui.doc.body.textContent!,/Sin coincidencias/);assert.match(ui.doc.body.textContent!,/no está disponible/);
 }finally{await ui.close();}
 const pending=deferred<Response>();const u=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>r.url.includes('/enrollments')?pending.promise:reply(r),'owner');try{
 await u.select('select[name="managedSection"]',section.id);await u.select('select[name="managedSection"]',otherSection.id);await u.settle(()=>pending.resolve(Response.json(page([enrollment]))));assert.doesNotMatch(u.doc.body.textContent!,/María/);
 await u.settle(()=>u.session.logout());assert.equal(u.doc.body.textContent,'');
 }finally{await u.close();}
});
test("self revocation refreshes me and removes management; lost mutation is never retried",async()=>{
 let lost=true;const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>{if(r.url.includes('/enrollments')&&r.method==='POST'){if(lost)throw new Error('lost');return Response.json(enrollment);}return reply(r);});try{
 await ui.select('select[name="managedSection"]',section.id);await ui.submit('form[aria-label="Asignar rol"]',{userId:person.id,role:'student'});assert.match(ui.doc.body.textContent!,/incierto/i);lost=false;
 await ui.submit('form[aria-label="Asignar rol"]',{userId:person.id,role:'student'});assert.equal(ui.requests.filter(r=>r.url.includes('/enrollments')&&r.method==='POST').length,1);
 await ui.actor('student');assert.equal(ui.doc.querySelector('form[aria-label="Asignar rol"]'),null);
 }finally{await ui.close();}
});

test("teacher search pagination preserves opaque cursor, excludes inactive destination and assigns chosen user",async()=>{
 const requests:Request[]=[];const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>{requests.push(r);if(r.url.includes('/users'))return Response.json(new URL(r.url).searchParams.has('cursor')?page([person]):page([{...person,active:false}], 'opaque+/='));if(r.url.includes('/enrollments')&&r.method==='POST')return Response.json(enrollment,{status:201});return reply(r);},'teacher');try{
 await ui.select('select[name="managedSection"]',section.id);await ui.submit('form[aria-label="Buscar participantes"]',{search:'María'});assert.equal(ui.doc.querySelector<HTMLButtonElement>('form[aria-label="Asignar rol"] button')?.disabled,true);
 const inactive=Array.from(ui.doc.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent?.includes('(inactiva)'));assert.equal(inactive?.disabled,true);
 await ui.click('Más personas');assert.equal(new URL(requests.find(r=>r.url.includes('cursor='))!.url).searchParams.get('cursor'),'opaque+/=');
 await ui.click('María Pérez · maria@example.test');await ui.submit('form[aria-label="Asignar rol"]',{role:'assistant'});
 assert.deepEqual(await requests.find(r=>r.method==='POST')!.json(),{userId:person.id,role:'assistant'});
 }finally{await ui.close();}
});
test("search responses from older query cannot restore users",async()=>{
 const pending=deferred<Response>();const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>r.url.includes('/users')?(new URL(r.url).searchParams.get('search')==='vieja'?pending.promise:Response.json(page([]))):reply(r),'teacher');try{
 await ui.select('select[name="managedSection"]',section.id);await ui.submit('form[aria-label="Buscar participantes"]',{search:'vieja'});await ui.submit('form[aria-label="Buscar participantes"]',{search:'nueva'});
 await ui.settle(()=>pending.resolve(Response.json(page([person]))));assert.equal(Array.from(ui.doc.querySelectorAll('button')).some(b=>b.textContent?.includes('María Pérez ·')),false);
 }finally{await ui.close();}
});
test("pagination shows history by enrollment ID and returns to initial cursor after mutation",async()=>{
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>{
 if(!r.url.includes('/enrollments'))return reply(r);
 if(r.method==='POST')return Response.json(enrollment);
 return Response.json(new URL(r.url).searchParams.has('cursor')?page([history]):page([enrollment],'next'));
 });try{
 await ui.select('select[name="managedSection"]',section.id);await ui.click('Más matrículas');assert.ok(ui.doc.querySelector(`[data-enrollment-id="${history.id}"]`));
 await ui.submit('form[aria-label="Asignar rol"]',{userId:person.id,role:'student'});assert.ok(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`));assert.equal(ui.doc.querySelector('button')?.textContent?.includes('Primera página'),false);
 }finally{await ui.close();}
});
test("actual self revocation refreshes me and teacher loses participant surface",async()=>{
 const self={...enrollment,user:{...person,id:id(1)},role:'teacher'};
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>{if(r.method==='PATCH'){ui.setActor('student');return Response.json({...self,active:false});}return r.url.includes('/enrollments')?Response.json(page([self])):reply(r);},'teacher');try{
 await ui.select('select[name="managedSection"]',section.id);const dialog=ui.doc.querySelector('dialog') as HTMLDialogElement;dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>dialog.removeAttribute('open');
 await ui.click('Gestionar');await ui.click('Revocar Docente');await ui.click('Confirmar revocación');assert.equal(ui.requests.filter(r=>r.url.endsWith('/me')).length,2);
 assert.equal(ui.doc.querySelector('section[aria-label="Participantes"]'),null);
 }finally{await ui.close();}
});

test("a change returning an existing target enrollment retains sibling roles and history",async()=>{
 const sibling={...enrollment,id:id(32),role:'assistant'};let changed=false;
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>{
 if(!r.url.includes('/enrollments'))return reply(r);
 if(r.method==='PATCH'){changed=true;return Response.json(sibling);}
 return Response.json(page([{...enrollment,active:!changed},sibling,history]));
 });try{
 await ui.select('select[name="managedSection"]',section.id);await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>(`[data-enrollment-id="${enrollment.id}"] button`)!.click());await ui.submit(`form[aria-label="Cambiar rol ${enrollment.id}"]`,{role:'assistant'});
 assert.equal(ui.doc.querySelectorAll('[data-enrollment-id]').length,3);assert.equal(ui.doc.querySelectorAll(`[data-enrollment-id="${sibling.id}"]`).length,1);
 assert.match(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`)!.textContent!,/Histórica/);
 assert.match(ui.doc.querySelector('section[aria-label="Participantes"] [role="status"]')!.textContent!,new RegExp(sibling.id));
 }finally{await ui.close();}
});

test('search can repeat identical input, empty stays local and selection survives pagination',async()=>{
 let calls=0;const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>r.url.includes('/users')?(calls++,Response.json(new URL(r.url).searchParams.has('cursor')?page([]):page([person],'next'))):reply(r),'teacher');
 try{
  await ui.submit('form[aria-label="Buscar participantes"]',{search:'   '});assert.equal(calls,0);assert.match(ui.doc.body.textContent!,/Escribe un nombre/);
  await ui.submit('form[aria-label="Buscar participantes"]',{search:'María'});await ui.click('María Pérez · maria@example.test');
  await ui.click('Más personas');assert.match(ui.doc.body.textContent!,/Persona seleccionada: María/);assert.match(ui.doc.body.textContent!,/Sin coincidencias/);
  await ui.submit('form[aria-label="Buscar participantes"]',{search:'María'});assert.equal(calls,3);assert.doesNotMatch(ui.doc.body.textContent!,/Persona seleccionada: María/);
  assert.equal(new URL(ui.requests.filter(r=>r.url.includes('/users')).at(-1)!.url).searchParams.has('cursor'),false);
 }finally{await ui.close();}
});
