import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDirectory } from "../src/components/courses/course-directory.tsx";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, deferred, id } from "./fixtures/courses.ts";
test("directory separates empty, loading, error and real summaries without N+1",async()=>{
 const d=deferred<Response>();const ui=await mount(h(CourseDirectory),()=>d.promise,"student");try{
 assert.match(ui.doc.body.textContent!,/Cargando/);await ui.settle(()=>d.resolve(Response.json({items:[course]})));
 assert.match(ui.doc.body.textContent!,/Desarrollo de software/);assert.equal(ui.doc.querySelector('a')?.getAttribute('href'),`/courses/${course.id}`);assert.equal(ui.requests.filter(r=>r.url.includes('/courses')).length,1);
 }finally{await ui.close();}
 for(const [status,body,expected]of [[200,{items:[]},/Sin contenido/],[503,{},/No se pudo/],[404,{},/no disponible/]]as const){const u=await mount(h(CourseDirectory),()=>Response.json(body,{status}),"student");try{assert.match(u.doc.body.textContent!,expected);}finally{await u.close();}}
});
test("detail shows all active roles; stale resource and logout cannot restore data",async()=>{
 const d=deferred<Response>();const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.endsWith('/sections')?Response.json({items:[section]}):r.url.endsWith(course.id)?d.promise:Response.json({...course,id:id(11),name:"Nuevo"}),"multi");try{
 await ui.render(h(CourseDetail,{courseId:id(11)}));await ui.settle(()=>d.resolve(Response.json(course)));
 assert.doesNotMatch(ui.doc.body.textContent!,/Desarrollo de software/);await ui.settle(()=>ui.session.logout());assert.equal(ui.doc.body.textContent,"");
 }finally{await ui.close();}
 const u=await mount(h(CourseDetail,{courseId:course.id}),r=>Response.json(r.url.endsWith('/sections')?{items:[section]}:course),"multi");try{assert.match(u.doc.body.textContent!,/Docente/);assert.match(u.doc.body.textContent!,/Ayudante/);assert.match(u.doc.body.textContent!,/Estudiante/);}finally{await u.close();}
});

test("late forbidden response from abandoned course cannot clear the current view",async()=>{
 const old=deferred<Response>();const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.endsWith(course.id)?old.promise:Response.json(r.url.endsWith('/sections')?{items:[]}:{...course,id:id(11),name:'Curso vigente'}),'teacher');try{
 await ui.render(h(CourseDetail,{courseId:id(11)}));assert.match(ui.doc.body.textContent!,/Curso vigente/);
 await ui.settle(()=>old.resolve(Response.json({},{status:403})));assert.match(ui.doc.body.textContent!,/Curso vigente/);assert.equal(ui.requests.filter(r=>r.url.endsWith('/me')).length,1);
 }finally{await ui.close();}
});

test('staff course summary and section management have distinct content and explain their purpose',async()=>{
 for(const profile of ['teacher','owner','ownerTeacher']){
  const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>Response.json(r.url.endsWith('/enrollments')?{items:[],hasMore:false,nextCursor:null}:r.url.endsWith('/sections')?{items:[section]}:r.url.includes('/sections/')?section:course),profile);
  try{
   assert.ok(ui.doc.querySelector('#course-overview-title'));
   assert.match(ui.doc.body.textContent!,/punto de entrada al curso/);
   assert.match(ui.doc.body.textContent!,/Para organizar las secciones y sus matrículas/);
   assert.equal(ui.doc.querySelector('form, .section-overview'),null);
   assert.equal([...ui.doc.querySelectorAll('button')].some(b=>b.textContent==='Abrir sección 1'),false);
   await ui.render(h(CourseDetail,{courseId:course.id,sections:true}));
   assert.equal(ui.doc.querySelector('h1')?.textContent,'Secciones y participantes');
   assert.equal(ui.doc.querySelector('#course-overview-title'),null);
   assert.match(ui.doc.body.textContent!,/Organiza las secciones del curso y sus participantes/);
   assert.ok(ui.doc.querySelector('select[name="managedSection"]'));
   assert.equal(!!ui.doc.querySelector('form[aria-label="Configurar curso"]'),profile!=='teacher');
   assert.equal(ui.requests.filter(r=>r.url.includes('/enrollments')).length,1);
  }finally{await ui.close();}
 }
});
