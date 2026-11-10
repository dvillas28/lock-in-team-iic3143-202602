import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { QuizCreate } from "../src/components/quizzes/quiz-create.tsx";
import { QuizDetail } from "../src/components/quizzes/quiz-detail.tsx";
import { mount, draft, emptyDraft, reply, course, id, deferred } from "./fixtures/quizzes.ts";
test("safe list/detail never request authoring; create only for teacher",async()=>{
 for(const role of ["teacher","ownerTeacher","owner","super","assistant","student"]) {
 const ui=await mount(h(QuizList,{courseId:course.id}),r=>reply(r),role);
 try {
 assert.match(ui.doc.body.textContent!,/Quiz de aislamiento/);
 assert.equal(!!ui.doc.querySelector('a[href$="/new"]'),["teacher","ownerTeacher"].includes(role));
 assert.equal(ui.requests.some(r=>r.url.endsWith('/authoring')),false);
 await ui.render(h(QuizDetail,{courseId:course.id,quizId:draft.id}));
 assert.equal(ui.requests.some(r=>r.url.endsWith('/authoring')),false);
 assert.equal(!!ui.doc.querySelector('a[href$="/authoring"]'),["teacher","ownerTeacher"].includes(role));
 assert.doesNotMatch(ui.doc.body.innerHTML,/isCorrect/);
 }finally {await ui.close();}
 }
});
test("create confirms draft; lost response stays blocked despite same-title candidates",async()=>{
 for(const lost of [false,true]) {
 const ui=await mount(h(QuizCreate,{courseId:course.id}),async r=>r.method==='POST'?(lost?Promise.reject(new Error('lost')):Response.json({...emptyDraft,title:"Nuevo"},{status:201})):reply(r),"teacher");
 try {
 await ui.submit('form',{title:"Nuevo"});assert.match(ui.doc.body.textContent!,lost?/incierto/:/Borrador creado/);
 assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="title"]')!.value,lost?'Nuevo':'');
 if(lost){await ui.submit('form',{title:"Nuevo"});assert.match(ui.doc.body.textContent!,/no confirma si se creó/);}
 assert.equal(ui.requests.filter(r=>r.method==='POST'&&!r.url.endsWith('/login')).length,1);
 }finally {await ui.close();}
 }
});
test("empty/error states and cross-course direct detail fail safely",async()=>{
 for(const mode of ['empty','error','cross']) {
 const ui=await mount(mode==='cross'?h(QuizDetail,{courseId:course.id,quizId:draft.id}):h(QuizList,{courseId:course.id}),r=>r.url.endsWith('/quizzes')?Response.json(mode==='error'?{}:{items:[]},{status:mode==='error'?503:200}):reply(r,{...draft,courseId:id(11)}),'student');
 try {assert.match(ui.doc.body.textContent!,mode==='empty'?/Aún no hay quizzes/:/No se pudo|inválida/);assert.equal(ui.requests.some(r=>r.url.endsWith('/authoring')),false);}finally{await ui.close();}
 }
});

test("creation rejects validation/size responses safely and keeps authorized form",async()=>{
 for(const status of [400,413,422,503]){
 const ui=await mount(h(QuizCreate,{courseId:course.id}),r=>r.method==='POST'?Response.json({detail:'PRIVATE KEY'},{status}):reply(r),'teacher');
 try{await ui.submit('form',{title:'Local'});assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value,'Local');assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE KEY/);if(status===413)assert.match(ui.doc.body.textContent!,/supera el tamaño permitido/);assert.equal(ui.requests.filter(r=>r.method==='POST'&&!r.url.endsWith('/login')).length,1);}finally{await ui.close();}
 }
});

test("quiz empty states preserve teacher creation and differ from loading and filtered results",async()=>{
 for(const profile of ["student","assistant","teacher","owner"]){
  const pending=deferred<Response>();
  const ui=await mount(h(QuizList,{courseId:course.id}),r=>r.url.endsWith('/quizzes')?pending.promise:reply(r),profile);
  try{
   assert.match(ui.doc.body.textContent!,/Cargando/);assert.doesNotMatch(ui.doc.body.textContent!,/Aún no hay quizzes/);
   await ui.settle(()=>pending.resolve(Response.json({items:[]})));
   assert.equal(ui.doc.querySelectorAll('.empty-zone').length,1);
   assert.match(ui.doc.body.textContent!,/Aún no hay quizzes/);
   assert.doesNotMatch(ui.doc.body.textContent!,/Sin contenido para mostrar|Abre un quiz|Consulta las evaluaciones/);
   assert.equal(!!ui.doc.querySelector('a[href$="/new"]'),profile==='teacher');
   assert.match(ui.doc.body.textContent!,profile==='teacher'?/Crea el primer quiz/:/Los quizzes publicados para tu sección aparecerán aquí/);
  }finally{await ui.close();}
 }
 const ui=await mount(h(QuizList,{courseId:course.id}),r=>reply(r),'student');
 try{
  await ui.select('select[id$="-status"]','closed');
  assert.match(ui.doc.body.textContent!,/No hay quizzes que coincidan/);
  assert.doesNotMatch(ui.doc.body.textContent!,/Aún no hay quizzes/);
  await ui.click('Mostrar todos los quizzes');assert.match(ui.doc.body.textContent!,/Quiz de aislamiento/);
 }finally{await ui.close();}
});

test("a filtered recent draft stays editable without replaying the creation toast", async () => {
  const ui = await mount(h(QuizList, {
    courseId: course.id, createdId: draft.id, filters: { query: "", status: "closed", section: "" },
  }), r => reply(r), "teacher");
  try {
    const edit = ui.doc.querySelector('a[href*="/authoring"]');
    assert.equal(edit?.textContent, "Editar borrador");
    assert.match(edit?.getAttribute("href") ?? "", new RegExp(draft.id));
    assert.match(ui.doc.body.textContent!, /no coincide con los filtros/);
    assert.equal(ui.doc.querySelector(".content-notice"), null);
    await ui.click("Mostrar todos los quizzes");
    const row = ui.doc.querySelector(".quiz-row");
    assert.match(row?.textContent ?? "", /Quiz de aislamiento/);
    assert.ok(row?.querySelector('button[aria-label="Publicar Quiz de aislamiento"]'));
    assert.match(ui.doc.body.textContent!, /Borradores/);
  } finally { await ui.close(); }
});
