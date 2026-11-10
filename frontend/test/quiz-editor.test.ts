import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { mount, draft, reply, course, section, otherSection, published, id } from "./fixtures/quizzes.ts";
const view=()=>h(QuizEditor,{courseId:course.id,quizId:draft.id});
test("authoring is explicit, authorized source required, admin alone cannot load key",async()=>{
 for(const role of ["teacher","multi","ownerTeacher","owner","super","student","assistant"]) {
 const ui=await mount(view(),r=>reply(r),role);
 try {const allowed=["teacher","multi","ownerTeacher"].includes(role);assert.equal(ui.requests.some(r=>r.url.endsWith('/authoring')),allowed);assert.equal(!!ui.doc.querySelector('form'),allowed);if(allowed)assert.match(ui.doc.body.textContent!,/impide rendir/);}finally{await ui.close();}
 }
 const ui=await mount(view(),r=>r.url.endsWith('/sections')?Response.json({items:[section,otherSection]}):reply(r,{...draft,sectionId:otherSection.id}),'teacher');
 try{assert.equal(ui.requests.some(r=>r.url.endsWith('/authoring')),false);}finally{await ui.close();}
});
test("PATCH saved minimal config; validation/red/conflict preserve inputs and lock uncertainty",async()=>{
 for(const mode of ['ok','validation','lost','conflict']) {
 let quiz={...draft};const ui=await mount(view(),async r=>{
 if(r.method==='PATCH'){if(mode==='lost')throw new Error('lost');if(mode!=='ok')return Response.json({},{status:mode==='conflict'?409:422});quiz={...quiz,...await r.clone().json()};return Response.json(quiz);}
 return reply(r,quiz);
 },'teacher');
 try{await ui.submit('form',{title:'Título local'});assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value,'Título local');
 const body=await ui.requests.find(r=>r.method==='PATCH')!.clone().json();assert.deepEqual(body,{title:'Título local'});
 assert.match(ui.doc.body.textContent!,mode==='ok'?/Quiz actualizado/:mode==='lost'?/incierto/:mode==='conflict'?/Conflicto/:/Revisa/);
 if(mode==='lost'){await ui.submit('form',{title:'Otra'});assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,1);}
 }finally{await ui.close();}
 }
});
test("published immutable; keyboard question actions preserve identity and predictable focus",async()=>{
 const read=await mount(view(),r=>reply(r,published),'teacher');try{assert.equal(read.doc.querySelector('button[type="submit"]'),null);assert.ok(read.doc.querySelector('form [name="title"]:disabled'));}finally{await read.close();}
 const ui=await mount(view(),r=>reply(r),'teacher');try{
 await ui.click('Agregar pregunta');assert.equal(ui.doc.activeElement?.getAttribute('name'),'questions.1.prompt');
 await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('[aria-label="Subir pregunta 2"]')!.click());assert.equal(ui.doc.activeElement?.getAttribute('aria-label'),'Bajar pregunta 1');
 await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('[aria-label="Eliminar pregunta 1"]')!.click());
 assert.match(ui.doc.body.textContent!,/Pregunta 1 eliminada/);
 }finally{await ui.close();}
});

test("ordinary teacher cannot tamper destination; owner teacher can send explicit null",async()=>{
 for(const role of ["teacher","ownerTeacher"]) {
 let next={...draft};const ui=await mount(view(),async r=>{if(r.method==='PATCH'){next={...next,...await r.clone().json()};return Response.json(next);}return r.url.endsWith('/sections')?Response.json({items:[section,otherSection]}):reply(r,next);},role);
 try{
 const select=ui.doc.querySelector<HTMLSelectElement>('[name="sectionId"]')!;
 if(role==='teacher'){const option=ui.doc.createElement('option');option.value=otherSection.id;option.textContent='Ajena';select.append(option);}
 await ui.submit('form',{sectionId:role==='teacher'?otherSection.id:''});
 assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,role==='teacher'?0:1);
 if(role==='ownerTeacher')assert.deepEqual(await ui.requests.find(r=>r.method==='PATCH')!.clone().json(),{sectionId:null});
 else assert.match(ui.doc.body.textContent!,/Selecciona un destinatario de tu alcance docente/);
 }finally{await ui.close();}
 }
});
test("edited question UUID retained; new question omits id; invalid correct count stays local",async()=>{
 let next={...draft};const ui=await mount(view(),async r=>{if(r.method==='PATCH'){const b=await r.clone().json();next={...next,...b,questions:b.questions.map((q:typeof draft.questions[number])=>({...q,id:q.id??'10000000-0000-4000-8000-000000000062'}))};return Response.json(next);}return reply(r,next);},'teacher');
 try{
 await ui.click('Agregar pregunta');await ui.submit('form',{'questions.1.prompt':'Nueva','questions.1.alternatives.0.text':'Sí','questions.1.alternatives.1.text':'No'});
 assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,0);assert.match(ui.doc.body.textContent!,/Selecciona una respuesta correcta/);
 const radio=ui.doc.querySelectorAll<HTMLInputElement>('input[type="radio"]')[2];await ui.settle(()=>radio.click());
 await ui.submit('form');const b=await ui.requests.find(r=>r.method==='PATCH')!.clone().json();assert.equal(b.questions[0].id,draft.questions[0].id);assert.equal('id' in b.questions[1],false);
 await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('[aria-label="Agregar alternativa a pregunta 1"]')!.click());assert.equal(ui.doc.activeElement?.getAttribute('name'),'questions.0.alternatives.2.text');await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('[aria-label="Eliminar alternativa C de pregunta 1"]')!.click());
 }finally{await ui.close();}
});

test("reorder preserves typed values and correct radio associated with original question",async()=>{
 const second={...draft.questions[0],id:'10000000-0000-4000-8000-000000000062',position:2,prompt:'Segunda',alternatives:[{id:'a',text:'Uno',isCorrect:false},{id:'b',text:'Dos',isCorrect:true}]};
 const initial={...draft,questions:[draft.questions[0],second]};
 const ui=await mount(view(),async r=>r.method==='PATCH'?Response.json({...initial,...await r.clone().json()}):reply(r,initial),'teacher');
 try{
 const input=ui.doc.querySelector<HTMLInputElement>('[name="questions.1.prompt"]')!;await ui.settle(()=>{input.value='Texto conservado';input.dispatchEvent(new ui.dom.window.Event('input',{bubbles:true}));});
 await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('[aria-label="Subir pregunta 2"]')!.click());await ui.submit('form');
 const body=await ui.requests.find(r=>r.method==='PATCH')!.clone().json();assert.equal(body.questions[0].id,second.id);assert.equal(body.questions[0].prompt,'Texto conservado');assert.equal(body.questions[0].alternatives.find((a:{isCorrect:boolean})=>a.isCorrect).id,'b');assert.equal(body.questions[1].alternatives.find((a:{isCorrect:boolean})=>a.isCorrect).id,'a');
 }finally{await ui.close();}
});

test("native datetime normalization does not add unchanged timestamps to a title PATCH",async()=>{
 const initial={...draft,opensAt:"2026-10-28T12:00:00.123456Z",closesAt:"2026-10-29T12:00:00.654321Z"};
 const ui=await mount(view(),async r=>r.method==='PATCH'?Response.json({...initial,...await r.clone().json()}):reply(r,initial),'teacher');
 try{
  const input=ui.doc.querySelector<HTMLInputElement>('[name="opensAt"]')!;
  assert.equal(input.value.length,16);
  await ui.submit('form',{title:'Solo cambia el título'});
  const request=ui.requests.find(r=>r.method==='PATCH')!;
  assert.ok(request);
  assert.deepEqual(await request.clone().json(),{title:'Solo cambia el título'});
 }finally{await ui.close();}
});

test("save tracks reversible changes in fields, questions and alternatives", async () => {
  const second = { ...draft.questions[0], id: id(89), position: 4, prompt: "Segunda" };
  const initial = { ...draft, questions: [draft.questions[0], second] };
  const ui = await mount(view(), r => r.url.endsWith("/sections") ? Response.json({ items: [section, otherSection] }) : reply(r, initial), "ownerTeacher");
  try {
    const save = () => ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const change = async (name: string, value: string) => ui.settle(() => {
      const field = ui.doc.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
      field.value = value;
      field.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(save().disabled, true);
    for (const [name, value] of Object.entries({
      title: "Otra evaluación", instructions: "Instrucción nueva", sectionId: otherSection.id,
      groupId: id(71), maxAttempts: "3", opensAt: "2099-05-01T09:00:01", closesAt: "2099-05-02T15:00",
      "questions.0.prompt": "Pregunta distinta", "questions.0.points": "4", "questions.0.alternatives.0.text": "Otro texto",
    })) {
      const original = ui.doc.querySelector<HTMLInputElement>(`[name="${name}"]`)!.value;
      await change(name, value);
      assert.equal(save().disabled, false, name);
      await change(name, original);
      assert.equal(save().disabled, true, name);
    }
    await change("title", `  ${draft.title}  `);
    assert.equal(save().disabled, true);
    const radio = ui.doc.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    await ui.settle(() => radio[1].click());
    assert.equal(save().disabled, false);
    await ui.settle(() => radio[0].click());
    assert.equal(save().disabled, true);

    const action = (label: string) => ui.settle(() => ui.doc.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.click());
    await action("Subir pregunta 2");
    assert.equal(save().disabled, false);
    await action("Bajar pregunta 1");
    assert.equal(save().disabled, true);
    await action("Agregar alternativa a pregunta 1");
    assert.equal(save().disabled, false);
    await action("Eliminar alternativa C de pregunta 1");
    assert.equal(save().disabled, true);
    await ui.click("Agregar pregunta");
    assert.equal(save().disabled, false);
    await action("Eliminar pregunta 3");
    assert.equal(save().disabled, true);
    await ui.submit("form");
    assert.equal(ui.requests.filter(r => r.method === "PATCH").length, 0);
    assert.doesNotMatch(ui.doc.body.textContent!, /No hay cambios para guardar|Publica cuando hayas revisado/);
  } finally { await ui.close(); }
});

test("a rejected save keeps changes available for retry and success disables save again", async () => {
  let saved = draft, writes = 0;
  const ui = await mount(view(), async request => {
    if (request.method !== "PATCH") return reply(request, saved);
    if (++writes === 1) return Response.json({}, { status: 422 });
    saved = { ...saved, ...await request.clone().json() };
    return Response.json(saved);
  }, "teacher");
  try {
    const save = () => ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    assert.equal(save().disabled, true);
    await ui.settle(() => {
      const title = ui.doc.querySelector<HTMLInputElement>('[name="title"]')!;
      title.value = "Borrador corregido";
      title.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(save().disabled, false);
    await ui.click("Guardar borrador");
    assert.equal(writes, 1);
    assert.match(ui.doc.querySelector("form")!.textContent!, /servidor rechazó/);
    assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value, "Borrador corregido");
    assert.equal(save().disabled, false);
    await ui.click("Guardar borrador");
    assert.equal(writes, 2);
    assert.equal(saved.title, "Borrador corregido");
    assert.equal(save().disabled, true);
  } finally { await ui.close(); }
});
