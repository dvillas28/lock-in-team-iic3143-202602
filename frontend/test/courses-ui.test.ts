import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { CourseNavigation } from "../src/components/courses/course-navigation.tsx";
import { CourseDirectory } from "../src/components/courses/course-directory.tsx";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, deferred, id, user, otherCourse } from "./fixtures/courses.ts";
test("directory separates empty, loading, error and real summaries without N+1",async()=>{
 const d=deferred<Response>();const ui=await mount(h(CourseDirectory),()=>d.promise,"student");try{
 assert.equal(ui.doc.querySelector('[role="status"]')?.textContent,"Cargando cursos…");assert.equal(ui.doc.querySelectorAll('h1').length,1);
 assert.ok(ui.doc.querySelector('.skeleton-content .course-grid .course-card'));assert.doesNotMatch(ui.doc.body.textContent!,/Espera un momento/);
 await ui.settle(()=>d.resolve(Response.json({items:[course]})));
 assert.equal(ui.doc.querySelector('.skeleton-region'),null);assert.equal(ui.doc.querySelectorAll('h1').length,1);
 assert.match(ui.doc.body.textContent!,/Desarrollo de software/);assert.equal(ui.doc.querySelector('a')?.getAttribute('href'),`/courses/${course.id}/modules`);assert.equal(ui.requests.filter(r=>r.url.includes('/courses')).length,1);
 }finally{await ui.close();}
 for(const [status,body,expected]of [[200,{items:[]},/Todavía no tienes cursos/],[503,{},/No se pudo/],[404,{},/no disponible/]]as const){const u=await mount(h(CourseDirectory),()=>Response.json(body,{status}),"student");try{assert.match(u.doc.body.textContent!,expected);}finally{await u.close();}}
});
test("section management discards stale resources on navigation and logout",async()=>{
 const d=deferred<Response>();const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.endsWith('/sections')?Response.json({items:[section]}):r.url.endsWith(course.id)?d.promise:Response.json({...course,id:id(11),name:"Nuevo"}),"multi");try{
 await ui.render(h(CourseDetail,{courseId:id(11)}));await ui.settle(()=>d.resolve(Response.json(course)));
 assert.doesNotMatch(ui.doc.body.textContent!,/Desarrollo de software/);await ui.settle(()=>ui.session.logout());assert.equal(ui.doc.body.textContent,"");
 }finally{await ui.close();}

});

test("late forbidden response from abandoned course cannot clear the current view",async()=>{
 const old=deferred<Response>();const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>r.url.endsWith(course.id)?old.promise:Response.json(r.url.endsWith('/sections')?{items:[]}:{...course,id:id(11),name:'Curso vigente'}),'teacher');try{
 await ui.render(h(CourseDetail,{courseId:id(11)}));assert.match(ui.doc.body.textContent!,/Curso vigente/);
 await ui.settle(()=>old.resolve(Response.json({},{status:403})));assert.match(ui.doc.body.textContent!,/Curso vigente/);assert.equal(ui.requests.filter(r=>r.url.endsWith('/me')).length,1);
 }finally{await ui.close();}
});

test('section management preserves staff controls after removing summary',async()=>{
 for(const profile of ['teacher','owner','ownerTeacher']){
  const ui=await mount(h(CourseDetail,{courseId:course.id}),r=>Response.json(r.url.endsWith('/enrollments')?{items:[],hasMore:false,nextCursor:null}:r.url.endsWith('/sections')?{items:[section]}:r.url.includes('/sections/')?section:course),profile);
  try{
   assert.equal(ui.doc.querySelector('h1')?.textContent,'Secciones y participantes');
   assert.equal(ui.doc.querySelector('#course-overview-title'),null);
   assert.doesNotMatch(ui.doc.body.textContent!,/Organiza las secciones del curso/);
   assert.equal(ui.doc.querySelector('.page-heading .section-label')?.textContent,`${course.code} · ${course.term}`);
   assert.equal(ui.doc.querySelector('.page-heading .hint')?.textContent,course.name);
   // One section: the bar names it and shows its capacity; no picker, counter or search is drawn.
   assert.equal(ui.doc.querySelector('.section-toolbar .section-name')?.textContent,'Sección 1');
   assert.match(ui.doc.querySelector('.section-toolbar .chip')!.textContent!,/^Cupos de estudiantes: /);
   // The section is named once; the roster below is titled «Participantes», never repeating it.
   assert.deepEqual([...ui.doc.querySelectorAll('h2')].filter(h=>!h.closest('dialog')).map(h=>h.textContent),['Participantes']);
   // Owner actions open modals (Crear sección is the primary one); their forms carry no duplicate heading.
   const triggers=[...ui.doc.querySelectorAll<HTMLButtonElement>('.section-toolbar button[aria-haspopup="dialog"]')].map(b=>b.textContent);
   assert.deepEqual(triggers,profile==='teacher'?[]:['Configurar sección','Configurar curso','Crear sección']);
   if(profile!=='teacher'){
    assert.equal(ui.doc.querySelector('.section-actions > .btn-primary')?.textContent,'Crear sección');
    for(const name of ['Configurar curso','Crear sección','Configurar sección']){const form=ui.doc.querySelector(`dialog form[aria-label="${name}"]`)!;assert.ok(form,name);assert.equal(form.querySelector('h2,h3'),null,name);assert.ok([...form.querySelectorAll('button')].some(b=>b.textContent==='Cancelar'),name);}
   }
   // The section bar draws no picker or code filter; the assignment dialog keeps its own person search.
   assert.equal(ui.doc.querySelector('select[name="managedSection"], .section-toolbar input[type="search"]'),null);
   assert.doesNotMatch(ui.doc.body.textContent!,/secciones? disponibles?/);
   assert.equal(!!ui.doc.querySelector('form[aria-label="Crear sección"]'),profile!=='teacher');
   assert.equal(!!ui.doc.querySelector('form[aria-label="Configurar curso"]'),profile!=='teacher');
   assert.equal(ui.requests.filter(r=>r.url.includes('/enrollments')).length,1);
  }finally{await ui.close();}
 }
});

 test("cards show only own course memberships without extra requests for every role",async()=>{
  for(const profile of ["student","assistant","teacher","ownerTeacher","owner","super"]){
   const actor=user(profile);
   if(actor.sectionMemberships.length) actor.sectionMemberships.push({courseId:course.id,sectionId:id(21),sectionCode:"2",role:"assistant"},{courseId:otherCourse.id,sectionId:id(22),sectionCode:"PRIVATE",role:"student"});
   const ui=await mount(h(CourseDirectory),()=>Response.json({items:[course]}),actor);
   try {
    const card=ui.doc.querySelector(".course-card")!;
    assert.equal(card.querySelectorAll(".course-memberships").length,actor.sectionMemberships.length?1:0);
    if(actor.sectionMemberships.length){assert.match(card.textContent!,/Sección 1 · (Estudiante|Ayudante|Docente); Sección 2 · Ayudante/);}
    assert.doesNotMatch(card.textContent!,/PRIVATE/);
    assert.equal(ui.requests.filter(r=>r.url.includes('/courses')).length,1);
    assert.equal(ui.requests.some(r=>r.url.includes('/sections')),false);
    await ui.actor('owner','utfsm');
    assert.equal(ui.doc.querySelector('.course-memberships'),null);
   }finally{await ui.close();}
  }
 });
 test("old course URLs redirect to modules",async()=>{
  const {default:CoursePage}=await import('../src/app/courses/[courseId]/page.tsx');
  await assert.rejects(CoursePage({params:Promise.resolve({courseId:course.id})}),error=>{
   assert.equal((error as Error & {digest:string}).digest,`NEXT_REDIRECT;replace;/courses/${course.id}/modules;307;`);return true;
  });
 });

test("course navigation retains each role's destinations with modules active and no summary",()=>{
 // Enrolled students and assistants read their section roster; without an enrollment nobody gets it.
 const destinations:Record<string,string[]>={
  student:['modules','quizzes','assignments','sections','grades'],
  assistant:['modules','quizzes','sections','gradebook'],
  super:['modules','quizzes'],
  teacher:['modules','quizzes','assignments','sections','gradebook','audit'],
  owner:['modules','quizzes','sections','audit'],
  multi:['modules','quizzes','assignments','sections','grades','gradebook','audit'],
 };
 for(const [profile,paths] of Object.entries(destinations)){
  const dom=new JSDOM(renderToStaticMarkup(h(CourseNavigation,{course,user:user(profile),active:'/modules'})));
  try{
   assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a=>a.getAttribute('href')),paths.map(path=>`/courses/${course.id}/${path}`));
   assert.equal(dom.window.document.querySelector('[aria-current="page"]')?.textContent,'Módulos y material');
   assert.doesNotMatch(dom.window.document.body.textContent!,/Resumen/);
  }finally{dom.window.close();}
 }
});
