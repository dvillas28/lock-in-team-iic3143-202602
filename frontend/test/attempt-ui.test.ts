import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h,StrictMode} from "react";
import {AttemptDetail} from "../src/components/attempts/attempt-detail.tsx";
import {QuizDetail} from "../src/components/quizzes/quiz-detail.tsx";
import {QuizList} from "../src/components/quizzes/quiz-list.tsx";
import {mount,reply,attempt,quiz,course,answers,receipt,cancelled,graded} from "./fixtures/attempts.ts";
const view=()=>h(AttemptDetail,{attemptId:attempt.id});
test("US1 start link GET current; known link only for UUID; no pauta",async()=>{
 const ui=await mount(h(QuizDetail,{courseId:course.id,quizId:quiz.id}),r=>r.method==="POST"?Response.json(attempt,{status:201}):reply(r),"student");
 try{await ui.click("Iniciar intento");assert.equal(ui.doc.querySelector('a[href^="/attempts/"]')?.getAttribute("href"),`/attempts/${attempt.id}`);assert.ok(ui.requests.some(r=>r.url.endsWith(`/quiz-attempts/${attempt.id}`)));
 await ui.render(h(QuizList,{courseId:course.id}));assert.match(ui.doc.body.textContent!,/Reanudar intento conocido/);
 }finally{await ui.close();}
});
test("US1 save, dirty announcement, explicit clearing and empty submission confirmation",async()=>{
 let saved=attempt;const ui=await mount(h(StrictMode,null,view()),async r=>{if(r.method==="PUT"){saved={...attempt,answers:(await r.json()).answers};return Response.json(saved);}if(r.url.endsWith("/submit"))return Response.json(receipt);return reply(r,saved);},"student");
 try{assert.match(ui.doc.body.textContent!,/Sección histórica/);assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,2);
 await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.click());assert.match(ui.doc.body.textContent!,/Borrador con cambios/);await ui.submit();assert.match(ui.doc.body.textContent!,/guardadas y confirmadas/);
 await ui.click("Quitar todas las selecciones");assert.equal(ui.requests.filter(r=>r.method==="PUT").length,1);await ui.click("Guardar sin respuestas");assert.equal(ui.doc.activeElement?.textContent,"Volver");await ui.click("Confirmar borrado de respuestas");assert.deepEqual(saved.answers,[]);
 await ui.click("Enviar intento");assert.match(ui.doc.querySelector('dialog[open]')!.textContent!,/enviar sin respuestas/);await ui.click("Volver");assert.equal(ui.requests.some(r=>r.url.endsWith("/submit")),false);
 await ui.click("Enviar intento");await ui.click("Confirmar envío");assert.match(ui.doc.body.textContent!,/Envío confirmado/);assert.doesNotMatch(ui.doc.body.textContent!,/7\.0|puntos|isCorrect/);assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);
 }finally{await ui.close();}
});
test("US2 lost POST shows explicit GET/replay controls without PUT",async()=>{
 let count=0;const ui=await mount(view(),r=>r.url.endsWith("/submit")?(++count===1?Promise.reject(new Error("lost")):Response.json(receipt)):reply(r,{...attempt,answers}),"student");
 try{await ui.click("Enviar intento");await ui.click("Confirmar envío");assert.match(ui.doc.body.textContent!,/incierto/);assert.equal(ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')?.matches(':disabled'),true);await ui.click("Consultar envío");assert.match(ui.doc.body.textContent!,/no demuestra/);await ui.click("Repetir envío original");assert.ok(ui.doc.querySelector('[aria-label="Recibo de envío"]'));assert.equal(ui.requests.some(r=>r.method==="PUT"),false);}finally{await ui.close();}
});
test("US1 uncertain save blocks writes; consult never unlocks",async()=>{
 const ui=await mount(view(),r=>r.method==="PUT"?Promise.reject(new Error("lost")):reply(r),"student");
 try{await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.click());await ui.submit();assert.match(ui.doc.body.textContent!,/Guardado incierto/);await ui.click("Consultar estado sin desbloquear");assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled,true);}finally{await ui.close();}
});
test("US3 accessible cancellation; 204 survives read error",async()=>{
 let readFails=false;const ui=await mount(view(),r=>r.url.endsWith("/cancel")?new Response(null,{status:204}):readFails?Response.json({},{status:503}):reply(r),"student");
 try{await ui.click("Cancelar intento");const dialog=ui.doc.querySelector<HTMLDialogElement>('dialog[open]')!;assert.match(dialog.textContent!,/cuenta entre los intentos/);assert.equal(ui.doc.activeElement?.textContent,"Volver");
 await ui.settle(()=>dialog.dispatchEvent(new ui.dom.window.Event("cancel",{cancelable:true})));assert.equal(dialog.hasAttribute("open"),false);assert.equal(ui.doc.activeElement?.textContent,"Cancelar intento");
 await ui.click("Cancelar intento");await ui.click("Confirmar cancelación");assert.match(ui.doc.body.textContent!,/Cancelación confirmada/);readFails=true;await ui.click("Consultar fecha de cancelación");assert.match(ui.doc.body.textContent!,/Cancelación confirmada/);
 }finally{await ui.close();}
});
test("terminal safe receipt; staff minimum and assistant no cancellation; historical section retained",async()=>{
 for(const [role,a]of [["student",graded],["student",cancelled],["assistant",{...attempt,studentId:course.id}],["teacher",{...attempt,studentId:course.id}]] as const){
 const ui=await mount(view(),r=>reply(r,a),role);
 try{assert.match(ui.doc.body.textContent!,new RegExp(a.sectionId));assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);assert.equal(Array.from(ui.doc.querySelectorAll('button')).some(b=>b.textContent==="Cancelar intento"),role==="teacher");assert.doesNotMatch(ui.doc.body.textContent!,/isCorrect|pointsAwarded/);}finally{await ui.close();}}
});

test("terminal/staff context never depends on question loading; terminal API outage keeps safe summary",async()=>{
 for(const mode of ['terminal','staff','outage']){
 const a=mode==='staff'?{...attempt,studentId:course.id}:graded;
 const ui=await mount(view(),r=>r.url.includes('/quizzes/')?(mode==='outage'?Response.json({},{status:503}):Response.json({...quiz,questions:null})):reply(r,a),mode==='staff'?'teacher':'student');
 try{assert.match(ui.doc.body.textContent!,new RegExp(a.id));assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);if(mode==='staff')assert.ok(Array.from(ui.doc.querySelectorAll('button')).some(b=>b.textContent==='Cancelar intento'));if(mode==='outage')assert.match(ui.doc.body.textContent!,/Resumen autorizado/);}finally{await ui.close();}
 }
});

test("concurrent terminal transition before strict student GET does not load questions",async()=>{
 let reads=0,quizReads=0;
 const ui=await mount(view(),r=>{
  if(r.url.includes('/quizzes/')){quizReads++;return Response.json({...quiz,questions:null});}
  if(r.url.includes('/quiz-attempts/'))return Response.json(++reads===1?attempt:graded);
  return reply(r);
 },'student');
 try{assert.ok(ui.doc.querySelector('[aria-label="Recibo de envío"]'));assert.equal(quizReads,1);assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);}finally{await ui.close();}
});
