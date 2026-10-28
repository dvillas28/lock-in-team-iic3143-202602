import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { mount, reply, course, draft, published, grade } from "./fixtures/quizzes.ts";
const view=()=>h(QuizEditor,{courseId:course.id,quizId:draft.id});
test("publish confirmation cancel/focus; confirmed quiz survives failed grade read and retries read alone",async()=>{
 let quiz=draft, fail=true;
 const ui=await mount(view(),r=>{
 if(r.url.endsWith('/publish')){quiz=published;return Response.json(quiz);}
 if(r.url.endsWith('/grade-items'))return fail?Response.json({},{status:503}):Response.json({items:[{...grade,weightPercent:17.5}],totalWeightPercent:17.5});
 return reply(r,quiz);
 },'teacher');
 try{
 await ui.click('Publicar quiz');assert.equal(ui.doc.activeElement?.textContent,'Volver');await ui.click('Volver');assert.equal(ui.requests.some(r=>r.url.endsWith('/publish')),false);assert.equal(ui.doc.activeElement?.textContent,'Publicar quiz');
 await ui.click('Publicar quiz');await ui.click('Confirmar publicación');
 assert.match(ui.doc.body.textContent!,/Publicado/);assert.match(ui.doc.body.textContent!,/lectura.*pendiente/i);assert.doesNotMatch(ui.doc.body.textContent!,/Resultado incierto/);
 fail=false;await ui.click('Reintentar lectura del ítem');assert.match(ui.doc.body.textContent!,/17.5/);assert.equal(ui.requests.filter(r=>r.url.endsWith('/publish')).length,1);
 }finally{await ui.close();}
});
test("freeze 409 no fake item; lost publish reconciles without second mutation",async()=>{
 for(const mode of ['freeze','lost','unreadable']) {
 let sent=false;const ui=await mount(view(),r=>{
 if(r.url.endsWith('/publish')){sent=true;return mode==='freeze'?Response.json({},{status:409}):Promise.reject(new Error('lost'));}
 if(sent&&mode==='unreadable'&&r.url.endsWith('/authoring'))return Response.json({},{status:503});
 return reply(r,sent&&mode==='lost'?published:draft);
 },'teacher');
 try{
 await ui.click('Publicar quiz');await ui.click('Confirmar publicación');
 assert.match(ui.doc.body.textContent!,mode==='freeze'?/Conflicto/:mode==='lost'?/Publicado/:/incierto/);
 if(mode==='freeze'){assert.match(ui.doc.body.textContent!,/congelad/);assert.equal(ui.requests.some(r=>r.url.endsWith('/grade-items')),false);assert.equal(ui.doc.querySelector<HTMLFieldSetElement>('form fieldset')?.disabled,false);}
 if(mode==='unreadable'){await ui.click('Consultar estado de publicación');assert.match(ui.doc.body.textContent!,/incierto/);}
 assert.equal(ui.requests.filter(r=>r.url.endsWith('/publish')).length,1);
 }finally{await ui.close();}
 }
});
test("dirty local state blocks publishing saved older version",async()=>{
 const ui=await mount(view(),r=>reply(r),'teacher');try{
 const input=ui.doc.querySelector<HTMLInputElement>('[name="title"]')!;
 await ui.settle(()=>{input.value='Local';input.dispatchEvent(new ui.dom.window.Event('input',{bubbles:true}));});
 assert.equal(Array.from(ui.doc.querySelectorAll('button')).find(b=>b.textContent==='Publicar quiz')?.disabled,true);
 assert.match(ui.doc.body.textContent!,/Guarda los cambios/);
 }finally{await ui.close();}
});
