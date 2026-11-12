import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { listSectionEnrollments, createSectionEnrollment, updateSectionEnrollment, searchInstitutionUsers } from "../src/lib/api/enrollments.ts";
import { createApiClient } from "../src/lib/api/client.ts";
import { mount } from "./fixtures/course-ui.ts";
import { assign, modalRuntime, open, roleSelect, assignForm, isOpen, confirm, toast } from "./fixtures/assignment.ts";
import { openManage, chooseRole, save, press, manageDialog, manageSelect, manageTitle, patches } from "./fixtures/management.ts";
import { course, section, otherSection, enrollment, history, person, id, page, deferred } from "./fixtures/courses.ts";
const reply=(r:Request)=>Response.json(r.url.includes('/users')?page([person]):r.url.endsWith('/sections')?{items:[section,otherSection]}:r.url.includes('/enrollments')?page([enrollment,history]):r.url.includes('/sections/')?section:course);
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
test("only authorized sections mount participant management; nobody searches people before typing",async()=>{
 for(const profile of ['owner','teacher','assistant','student','super','foreign']){
 const ui=await mount(h(CourseDetail,{courseId:course.id}),reply,profile);try{
 const allowed=['owner','teacher','foreign'].includes(profile);
 // Owner manages two sections and gets the picker; a single authorized section is named by the bar alone.
 assert.equal(!!ui.doc.querySelector('select[name="managedSection"]'),profile==='owner');
 // The active section is named once: as the picker's value with several sections, as plain text with one.
 const context=ui.doc.querySelector('.section-name')?.textContent??ui.doc.querySelector<HTMLSelectElement>('select[name="managedSection"]')?.selectedOptions[0]?.textContent??null;
 assert.equal(context,allowed?'Sección 1':null);
 if(profile==='owner'){assert.equal(ui.doc.querySelector('.section-toolbar input[type="search"]'),null,'two sections need no code filter');await ui.select('select[name="managedSection"]',section.id);}
 assert.equal(ui.requests.some(r=>r.url.includes('/enrollments')),allowed);
 assert.equal(!!ui.doc.querySelector('.participants-heading > button'),allowed);assert.equal(ui.doc.querySelector('input[name="userId"]'),null);assert.ok(ui.requests.every(r=>!r.url.includes('/users')&&!r.url.includes('/memberships')));
 if(profile==='teacher'||profile==='foreign'){assert.equal(ui.doc.querySelector('select[name="managedSection"] option[value="'+otherSection.id+'"]'),null);assert.equal(ui.requests.some(r=>r.url.includes(`${otherSection.id}/enrollments`)),false);}
 }finally{await ui.close();}}
});
test("history and sibling roles survive role successor, POST 200 and pagination reset",async()=>{
 let rows: import("../src/lib/courses/validation.ts").Enrollment[]=[enrollment,history];const ui=await mount(h(CourseDetail,{courseId:course.id}),async r=>{
 if(!r.url.includes('/enrollments'))return reply(r);
 if(r.method==='POST')return Response.json(enrollment);
 if(r.method==='PATCH'){rows=[{...enrollment,active:false},history,{...enrollment,id:id(99),role:'teacher'}];return Response.json(rows[2]);}
 return Response.json(page(rows));
 });try{
 modalRuntime(ui);await ui.select('select[name="managedSection"]',section.id);assert.match(ui.doc.body.textContent!,/Histórica/);await assign(ui,'maría','María Pérez','assistant');
 await openManage(ui,enrollment.id);await chooseRole(ui,'teacher');await save(ui);
 assert.match(ui.doc.body.textContent!,/Docente/);assert.equal(ui.doc.querySelectorAll('[data-enrollment-id]').length,3);
 assert.ok(ui.doc.querySelector(`[data-enrollment-id="${id(99)}"]`));
 }finally{await ui.close();}
});
test("revoke last teacher requires confirmation; cancel sends nothing",async()=>{
 const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.includes('/enrollments')?Response.json(r.method==='PATCH'?{...enrollment,role:'teacher',active:false}:page([{...enrollment,role:'teacher'}])):reply(r));try{
 modalRuntime(ui);await ui.select('select[name="managedSection"]',section.id);const dialog=manageDialog(ui);
 await ui.click('Gestionar');await press(ui,'Revocar matrícula');assert.ok(dialog.hasAttribute('open'));assert.equal(manageTitle(ui),'Revocar matrícula');
 assert.equal(ui.doc.activeElement?.textContent,'Cancelar','the safe choice is focused first');await press(ui,'Cancelar');assert.equal(patches(ui).length,0);assert.equal(manageTitle(ui),'Gestionar participante');
 assert.equal(ui.doc.activeElement?.textContent,'Revocar matrícula','cancel returns to the revoke action');
 await press(ui,'Revocar matrícula');await press(ui,'Confirmar revocación');assert.equal(patches(ui).length,1);assert.deepEqual(await patches(ui)[0].json(),{active:false});
 }finally{await ui.close();}
});
test("search 404 is unavailable, not empty; stale searches and section completions discarded",async()=>{
 const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.includes('/users')?Response.json({},{status:404}):reply(r),'teacher');try{
 modalRuntime(ui);await open(ui);const input=ui.doc.querySelector<HTMLInputElement>(`${assignForm} input[name="search"]`)!;await ui.settle(()=>{Object.getOwnPropertyDescriptor(ui.dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,'María');input.dispatchEvent(new ui.dom.window.Event('input',{bubbles:true}));input.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});assert.doesNotMatch(ui.doc.body.textContent!,/No hay personas/);assert.match(ui.doc.body.textContent!,/no está disponible/);
 }finally{await ui.close();}
 const pending=deferred<Response>();const u=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.includes('/enrollments')?pending.promise:reply(r),'owner');try{
 await u.select('select[name="managedSection"]',section.id);await u.select('select[name="managedSection"]',otherSection.id);await u.settle(()=>pending.resolve(Response.json(page([enrollment]))));assert.doesNotMatch(u.doc.body.textContent!,/María/);
 await u.settle(()=>u.session.logout());assert.equal(u.doc.body.textContent,'');
 }finally{await u.close();}
});
test("self revocation refreshes me and removes management; lost mutation is never retried",async()=>{
 let lost=true;const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>{if(r.url.includes('/enrollments')&&r.method==='POST'){if(lost)throw new Error('lost');return Response.json(enrollment);}return reply(r);});try{
 modalRuntime(ui);await ui.select('select[name="managedSection"]',section.id);await assign(ui,'maría','María Pérez','assistant');assert.match(ui.doc.body.textContent!,/incierto/i);assert.ok(isOpen(ui));lost=false;
 await confirm(ui);assert.equal(ui.requests.filter(r=>r.url.includes('/enrollments')&&r.method==='POST').length,1);
 await ui.actor('student');assert.equal(ui.doc.querySelector(assignForm),null);
 }finally{await ui.close();}
});

test("pagination shows history by enrollment ID and returns to initial cursor after mutation",async()=>{
 const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>{
 if(!r.url.includes('/enrollments'))return reply(r);
 if(r.method==='POST')return Response.json(enrollment);
 return Response.json(new URL(r.url).searchParams.has('cursor')?page([history]):page([enrollment],'next'));
 });try{
 modalRuntime(ui);await ui.select('select[name="managedSection"]',section.id);await ui.click('Más matrículas');assert.ok(ui.doc.querySelector(`[data-enrollment-id="${history.id}"]`));
 await assign(ui,'maría','María Pérez','assistant');assert.ok(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`));assert.equal(ui.doc.querySelector('button')?.textContent?.includes('Primera página'),false);
 }finally{await ui.close();}
});
test("teachers cannot manage teacher rows or offer the teacher role; nobody manages their own teacher row",async()=>{
 const self={...enrollment,id:id(40),user:{...person,id:id(1)},role:'teacher' as const},peer={...enrollment,id:id(41),role:'teacher' as const};
 for(const profile of ['teacher','ownerTeacher']){
  const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.includes('/enrollments')?Response.json(page([self,peer,enrollment])):reply(r),profile);try{
  if(profile==='ownerTeacher')await ui.select('select[name="managedSection"]',section.id);
  else assert.equal(ui.doc.querySelector('select[name="managedSection"]'),null);
  const row=(e:{id:string})=>ui.doc.querySelector(`[data-enrollment-id="${e.id}"]`)!;
  assert.equal(row(self).querySelector('button'),null);assert.match(row(self).textContent!,/Sin acciones/);
  assert.equal(!!row(peer).querySelector('button'),profile==='ownerTeacher');assert.ok(row(enrollment).querySelector('button'));
  const options=Array.from(roleSelect(ui).options).map(o=>o.value);
  assert.deepEqual(options,profile==='teacher'?['student','assistant']:['student','assistant','teacher']);
  await ui.settle(()=>row(enrollment).querySelector<HTMLButtonElement>('button')!.click());
  const roles=Array.from(manageSelect(ui).options).map(o=>o.value);
  assert.equal(roles.includes('teacher'),profile==='ownerTeacher');assert.equal(ui.requests.filter(r=>r.url.includes('/enrollments')&&r.method!=='GET').length,0);
  }finally{await ui.close();}
 }
});
test("owner sees a safe explanation when the last teacher cannot be revoked",async()=>{
 const teacher={...enrollment,role:'teacher' as const};
 const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.includes('/enrollments')?(r.method==='PATCH'?Response.json({code:'LAST_SECTION_TEACHER',detail:'PRIVATE'},{status:409}):Response.json(page([teacher]))):reply(r));try{
 modalRuntime(ui);await ui.select('select[name="managedSection"]',section.id);const dialog=manageDialog(ui);
 await ui.click('Gestionar');await press(ui,'Revocar matrícula');await press(ui,'Confirmar revocación');assert.ok(dialog.hasAttribute('open'),'a rejected revocation keeps the dialog open');
 assert.match(dialog.textContent!,/al menos un docente activo/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE/);assert.match(ui.doc.querySelector(`[data-enrollment-id="${teacher.id}"]`)!.textContent!,/Activa/);
 }finally{await ui.close();}
});

test("a change returning an existing target enrollment retains sibling roles and history",async()=>{
 const sibling={...enrollment,id:id(32),role:'assistant'};let changed=false;
 const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>{
 if(!r.url.includes('/enrollments'))return reply(r);
 if(r.method==='PATCH'){changed=true;return Response.json(sibling);}
 return Response.json(page([{...enrollment,active:!changed},sibling,history]));
 });try{
 modalRuntime(ui);await ui.select('select[name="managedSection"]',section.id);await openManage(ui,enrollment.id);
 assert.match(manageDialog(ui).textContent!,/También es Ayudante en esta sección/);await chooseRole(ui,'assistant');assert.match(manageDialog(ui).textContent!,/se mantendrá la existente/);await save(ui);
 assert.equal(ui.doc.querySelectorAll('[data-enrollment-id]').length,3);assert.equal(ui.doc.querySelectorAll(`[data-enrollment-id="${sibling.id}"]`).length,1);
 assert.match(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`)!.textContent!,/Histórica/);
 assert.equal(toast(ui),'María Pérez ya era Ayudante: la matrícula como Estudiante pasó al Historial.');assert.doesNotMatch(ui.doc.body.textContent!,new RegExp(sibling.id),'no internal IDs in feedback');
 }finally{await ui.close();}
});

