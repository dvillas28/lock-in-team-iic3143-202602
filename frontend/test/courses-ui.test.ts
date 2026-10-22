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
 const u=await mount(h(CourseDetail,{courseId:course.id}),r=>Response.json(r.url.endsWith('/sections')?{items:[section]}:course),"multi");try{assert.match(u.doc.body.textContent!,/teacher/);assert.match(u.doc.body.textContent!,/assistant/);assert.match(u.doc.body.textContent!,/student/);}finally{await u.close();}
});

test("late forbidden response from abandoned course cannot clear the current view",async()=>{
 const old=deferred<Response>();const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.endsWith(course.id)?old.promise:Response.json(r.url.endsWith('/sections')?{items:[]}:{...course,id:id(11),name:'Curso vigente'}),'teacher');try{
 await ui.render(h(CourseDetail,{courseId:id(11)}));assert.match(ui.doc.body.textContent!,/Curso vigente/);
 await ui.settle(()=>old.resolve(Response.json({},{status:403})));assert.match(ui.doc.body.textContent!,/Curso vigente/);assert.equal(ui.requests.filter(r=>r.url.endsWith('/me')).length,1);
 }finally{await ui.close();}
});
