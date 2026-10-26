import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDirectory } from "../src/components/courses/course-directory.tsx";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course,section,deferred } from "./fixtures/courses.ts";
const values={code:"IIC3143",name:"Desarrollo",term:"2026-2",sectionCode:"1",capacity:"0"};
test("admin creates exact payload once, reads sections and refreshes me after Course response",async()=>{
 const d=deferred<Response>();const ui=await mount(h(CourseDirectory),r=>r.method==='POST'?d.promise:Response.json(r.url.endsWith('/sections')?{items:[section]}:{items:[course]}));try{
 await ui.submit('form',values);await ui.submit('form',values);assert.equal(ui.requests.filter(r=>r.method==='POST'&&r.url.endsWith('/courses')).length,1);
 const post=ui.requests.find(r=>r.method==='POST'&&r.url.endsWith('/courses'))!;
 assert.deepEqual(await post.json(),{code:values.code,name:values.name,term:values.term,initialSection:{code:"1",capacity:0}});
 await ui.settle(()=>d.resolve(Response.json(course,{status:201})));
 assert.ok(ui.requests.some(r=>r.url.endsWith(`/${course.id}/sections`)));assert.ok(ui.requests.filter(r=>r.url.endsWith('/me')).length>=2);
 }finally{await ui.close();}
});
test("lost course response consults state, retains uncertainty and never repeats automatically",async()=>{
 const ui=await mount(h(CourseDirectory),r=>{if(r.method==='POST')throw new Error('lost');return Response.json({items:[course]});});try{
 await ui.submit('form',values);assert.match(ui.doc.body.textContent!,/incierto/i);assert.ok(ui.requests.filter(r=>r.url.endsWith('/courses')&&r.method==='GET').length>=2);
 await ui.submit('form',values);assert.equal(ui.requests.filter(r=>r.method==='POST'&&r.url.endsWith('/courses')).length,1);
 }finally{await ui.close();}
});
test("course and section controls require confirmed owner and isAdmin",async()=>{
 for(const profile of ['owner','ownerTeacher','foreign','teacher','super','student']){
 const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>Response.json(r.url.endsWith('/sections')?{items:[section]}:course),profile);try{
 assert.equal(!!ui.doc.querySelector('form[aria-label="Configurar curso"]'),profile==='owner'||profile==='ownerTeacher');
 assert.equal(!!ui.doc.querySelector('form[aria-label="Crear sección"]'),profile==='owner'||profile==='ownerTeacher');
 }finally{await ui.close();}}
});
for(const mode of ['match','failed','absent']as const)test(`lost section response reconciles ${mode} without claiming authorship or retry`,async()=>{
 let posts=0;const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),r=>{if(r.method==='POST'){posts++;throw new Error('lost');}if(r.url.endsWith('/sections'))return posts&&mode==='failed'?Response.json({},{status:503}):Response.json({items:mode==='absent'&&posts?[]:[section]});return Response.json(course);});try{
 await ui.submit('form[aria-label="Crear sección"]',{code:'1',capacity:''});
 assert.match(ui.doc.body.textContent!,/incierto/i);assert.equal(posts,1);await ui.submit('form[aria-label="Crear sección"]',{code:'1',capacity:''});assert.equal(posts,1);
 assert.ok(ui.requests.filter(r=>r.url.endsWith('/sections')&&r.method==='GET').length>=2);
 }finally{await ui.close();}
});
for(const status of [409,422,503])test(`mutation ${status} never invents success`,async()=>{
 const ui=await mount(h(CourseDirectory),r=>Response.json(r.method==='POST'?{}:{items:[]},{status:r.method==='POST'?status:200}));try{
 await ui.submit('form',values);assert.doesNotMatch(ui.doc.body.textContent!,/Curso creado|Operación completada/);assert.ok(ui.doc.querySelector('[role="alert"]'));
 }finally{await ui.close();}
});

test("configuration PATCH sends only changed fields and immutable ownership never leaves UI",async()=>{
 let current={...course},s={...section};const ui=await mount(h(CourseDetail,{courseId:course.id,sections:true}),async r=>{
  if(r.method==='PATCH'){const body=await r.clone().json();if(r.url.includes('/sections/')){s={...s,...body};return Response.json(s);}current={...current,...body};return Response.json(current);}
  return Response.json(r.url.endsWith('/sections')?{items:[s]}:r.url.includes('/sections/')?s:current);
 });try{
 await ui.submit('form[aria-label="Configurar curso"]',{name:'Nuevo nombre'});assert.deepEqual(await ui.requests.find(r=>r.method==='PATCH')!.json(),{name:'Nuevo nombre'});
 await ui.submit('form[aria-label="Configurar curso"]');assert.match(ui.doc.body.textContent!,/No hay cambios/);assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,1);
 await ui.select('select[name="managedSection"]',section.id);await ui.submit('form[aria-label="Configurar sección"]',{capacity:'0'});assert.deepEqual(await ui.requests.filter(r=>r.method==='PATCH')[1].json(),{capacity:0});
 assert.match(ui.doc.body.textContent!,/Capacidad: 0/);
 }finally{await ui.close();}
});
test("invalid inputs announce associated errors and never send a mutation",async()=>{
 const ui=await mount(h(CourseDirectory),()=>Response.json({items:[]}));try{
 await ui.submit('form',{...values,name:''});assert.ok(ui.doc.querySelector('input[name="name"][aria-invalid="true"][aria-describedby]'));
 await ui.submit('form',{...values,capacity:'-1'});assert.ok(ui.doc.querySelector('input[name="capacity"][aria-invalid="true"]'));
 assert.equal(ui.requests.filter(r=>r.method==='POST'&&r.url.endsWith('/courses')).length,0);
 }finally{await ui.close();}
});
test("permission rejection during a mutation removes forms and revalidates once without loop",async()=>{
 const ui=await mount(h(CourseDirectory),r=>Response.json(r.method==='POST'?{}:{items:[]},{status:r.method==='POST'?403:200}));try{
 await ui.submit('form',values);assert.equal(ui.doc.querySelector('form'),null);assert.match(ui.doc.body.textContent!,/permisos/i);assert.equal(ui.requests.filter(r=>r.url.endsWith('/me')).length,2);
 }finally{await ui.close();}
});
test("late course creation cannot refresh a different resource or session",async()=>{
 const pending=deferred<Response>();const ui=await mount(h(CourseDirectory),r=>r.method==='POST'?pending.promise:Response.json({items:[]}));try{
 await ui.submit('form',values);const count=ui.requests.length;await ui.render(h('p',null,'Otra vista'));
 await ui.settle(()=>pending.resolve(Response.json(course)));assert.equal(ui.requests.length,count);assert.equal(ui.doc.body.textContent,'Otra vista');
 }finally{await ui.close();}
});
