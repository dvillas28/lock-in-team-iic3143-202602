import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h,StrictMode} from "react";
import {AttemptDetail} from "../src/components/attempts/attempt-detail.tsx";
import {QuizDetail} from "../src/components/quizzes/quiz-detail.tsx";
import {QuizList} from "../src/components/quizzes/quiz-list.tsx";
import {mount,reply,attempt,quiz,course,answers,receipt,cancelled,graded} from "./fixtures/attempts.ts";
const view=()=>h(AttemptDetail,{attemptId:attempt.id});
test("US1 opens the confirmed attempt; history replaces manual attempt codes; no pauta",async()=>{
 const ui=await mount(h(QuizDetail,{courseId:course.id,quizId:quiz.id}),r=>r.method==="POST"?Response.json(attempt,{status:201}):reply(r),"student");
 try{await ui.click("Iniciar nuevo intento");assert.deepEqual(ui.destinations,[`/attempts/${attempt.id}`]);assert.ok(ui.requests.some(r=>r.url.endsWith(`/quiz-attempts/${attempt.id}`)));
 await ui.render(h(QuizList,{courseId:course.id}));assert.ok(ui.doc.querySelector(`a.quiz-row-link[href$="/quizzes/${quiz.id}"]`));assert.doesNotMatch(ui.doc.body.textContent!,/consultar tus intentos/);assert.equal(ui.doc.querySelector('input[autocomplete="off"]'),null);
 }finally{await ui.close();}
});
const confirmSend=(ui:{settle:(f:()=>void)=>Promise<void>;doc:Document})=>ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('dialog[open] .btn-primary')!.click());
test("US1 save, dirty state, clearing an answer and empty submission confirmation",async()=>{
 let saved=attempt;const ui=await mount(h(StrictMode,null,view()),async r=>{if(r.method==="PUT"){saved={...attempt,answers:(await r.json()).answers};return Response.json(saved);}if(r.url.endsWith("/submit"))return Response.json(receipt);return reply(r,saved);},"student");
 try{assert.doesNotMatch(ui.doc.body.textContent!,/Sección histórica/);assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,2);
 assert.match(ui.doc.querySelector('.attempt-option-letter')!.textContent!,/^A$/);
 await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.click());assert.match(ui.doc.body.textContent!,/Cambios sin guardar/);assert.match(ui.doc.body.textContent!,/1 de 1 respondidas/);await ui.submit();assert.match(ui.doc.body.textContent!,/Respuestas guardadas/);
 await ui.click("Quitar respuesta");assert.match(ui.doc.body.textContent!,/1 sin responder/);assert.equal(ui.requests.filter(r=>r.method==="PUT").length,1);await ui.submit();assert.deepEqual(saved.answers,[]);assert.equal(ui.requests.filter(r=>r.method==="PUT").length,2);
 await ui.click("Enviar intento");const dialog=ui.doc.querySelector('dialog[open]')!;assert.match(dialog.textContent!,/0 de 1/);assert.match(dialog.textContent!,/Pregunta 1/);assert.match(dialog.textContent!,/no podrás cambiar/);assert.equal(ui.doc.activeElement?.textContent,"Cancelar");
 await ui.click("Cancelar");assert.equal(ui.requests.some(r=>r.url.endsWith("/submit")),false);
 await ui.click("Enviar intento");await ui.settle(()=>{const send=ui.doc.querySelector<HTMLButtonElement>('dialog[open] .btn-primary')!;send.click();send.click();});assert.equal(ui.requests.filter(r=>r.url.endsWith("/submit")).length,1);
 assert.match(ui.doc.body.textContent!,/Intento enviado/);assert.ok(ui.doc.querySelector(`a[href="/courses/${course.id}/grades"]`));assert.doesNotMatch(ui.doc.body.textContent!,/7\.0|puntos|isCorrect|Calificado/);assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);
 }finally{await ui.close();}
});
test("US2 lost POST shows explicit GET/replay controls without PUT",async()=>{
 let count=0;const ui=await mount(view(),r=>r.url.endsWith("/submit")?(++count===1?Promise.reject(new Error("lost")):Response.json(receipt)):reply(r,{...attempt,answers}),"student");
 try{await ui.click("Enviar intento");await confirmSend(ui);assert.equal(ui.doc.querySelector('dialog[open]'),null);assert.match(ui.doc.body.textContent!,/No pudimos confirmar el envío/);assert.equal(ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')?.matches(':disabled'),true);await ui.click("Comprobar estado");assert.match(ui.doc.body.textContent!,/no demuestra/);await ui.click("Reintentar envío");assert.ok(ui.doc.querySelector('[aria-label="Recibo de envío"]'));assert.equal(ui.requests.some(r=>r.method==="PUT"),false);}finally{await ui.close();}
});
test("US1 uncertain save blocks writes; consult never unlocks",async()=>{
 const ui=await mount(view(),r=>r.method==="PUT"?Promise.reject(new Error("lost")):reply(r),"student");
 try{await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.click());await ui.submit();assert.match(ui.doc.body.textContent!,/No pudimos confirmar el guardado/);await ui.click("Comprobar estado");assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled,true);assert.equal(ui.doc.querySelector<HTMLButtonElement>('.attempt-actions-bar .btn-primary')!.disabled,true);}finally{await ui.close();}
});
test("leaving warns only while answers are not confirmed",async()=>{
 const ui=await mount(view(),r=>r.method==="PUT"?Response.json({...attempt,answers}):reply(r),"student");
 try{
  const leave=()=>{const link=ui.doc.querySelector<HTMLAnchorElement>('.attempt-back')!;const event=new ui.dom.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0});link.dispatchEvent(event);return event.defaultPrevented;};
  let prevented=false;await ui.settle(()=>{prevented=leave();});assert.equal(prevented,false);assert.equal(ui.doc.querySelector('dialog[open]'),null);
  await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.click());
  await ui.settle(()=>{prevented=leave();});assert.equal(prevented,true);assert.match(ui.doc.querySelector('dialog[open]')?.textContent??'',/¿Salir del intento\?/);
  await ui.click("Seguir respondiendo");await ui.submit();
  await ui.settle(()=>{prevented=leave();});assert.equal(prevented,false);
 }finally{await ui.close();}
});
test("closing time locks answering without fabricating availability",async()=>{
 const past={...quiz,closesAt:"2026-10-01T12:00:00Z"};
 const ui=await mount(view(),async r=>{const res=reply(r);if(!r.url.includes('/quizzes/')&&!r.url.endsWith('/questions'))return res;const body=await res.json();return Response.json(body&&typeof body==='object'&&'closesAt' in body?{...body,closesAt:past.closesAt}:body);},"student");
 try{assert.match(ui.doc.body.textContent!,/El plazo terminó/);assert.equal(ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')?.matches(':disabled'),true);assert.equal(ui.doc.querySelector<HTMLButtonElement>('.attempt-actions-bar .btn-primary')!.disabled,true);assert.equal(ui.requests.some(r=>r.method==="PUT"||r.url.endsWith('/submit')),false);}finally{await ui.close();}
});
test("US3 accessible cancellation; 204 survives read error",async()=>{
 let readFails=false;const ui=await mount(view(),r=>r.url.endsWith("/cancel")?new Response(null,{status:204}):readFails?Response.json({},{status:503}):reply(r),"student");
 try{await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('[aria-label="Más acciones del intento"]')!.click());assert.equal(ui.doc.querySelector('[role="menu"]')?.querySelector('[role="menuitem"]')?.textContent,"Cancelar intento");assert.equal(ui.doc.activeElement?.getAttribute("role"),"menuitem");await ui.click("Cancelar intento");const dialog=ui.doc.querySelector<HTMLDialogElement>('dialog[open]')!;assert.match(dialog.textContent!,/sin enviarse/);assert.match(dialog.textContent!,/contará entre los intentos permitidos/);assert.equal(ui.doc.activeElement?.textContent,"Volver");
 await ui.settle(()=>dialog.dispatchEvent(new ui.dom.window.Event("cancel",{cancelable:true})));assert.equal(dialog.hasAttribute("open"),false);assert.equal(ui.doc.activeElement?.getAttribute("aria-label"),"Más acciones del intento");
 await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('[aria-label="Más acciones del intento"]')!.click());await ui.click("Cancelar intento");await ui.click("Confirmar cancelación");assert.match(ui.doc.body.textContent!,/Cancelación confirmada/);readFails=true;await ui.click("Consultar fecha de cancelación");assert.match(ui.doc.body.textContent!,/Cancelación confirmada/);
 }finally{await ui.close();}
});
test("terminal safe receipt; staff minimum and assistant no cancellation; historical section retained",async()=>{
 for(const [role,a]of [["student",graded],["student",cancelled],["assistant",{...attempt,studentId:course.id}],["teacher",{...attempt,studentId:course.id}]] as const){
 const ui=await mount(view(),r=>reply(r,a),role);
 try{if(role==='student')assert.doesNotMatch(ui.doc.body.textContent!,new RegExp(a.sectionId));else assert.match(ui.doc.body.textContent!,new RegExp(a.sectionId));assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);assert.equal(!!ui.doc.querySelector('[aria-label="Más acciones del intento"]'),role==="teacher");assert.doesNotMatch(ui.doc.body.textContent!,/isCorrect|pointsAwarded/);}finally{await ui.close();}}
});

test("terminal/staff context never depends on question loading; terminal API outage keeps safe summary",async()=>{
 for(const mode of ['terminal','staff','outage']){
 const a=mode==='staff'?{...attempt,studentId:course.id}:graded;
 const ui=await mount(view(),r=>r.url.includes('/quizzes/')?(mode==='outage'?Response.json({},{status:503}):Response.json({...quiz,questions:null})):reply(r,a),mode==='staff'?'teacher':'student');
 try{if(mode==='terminal')assert.doesNotMatch(ui.doc.body.textContent!,new RegExp(a.id));else assert.match(ui.doc.body.textContent!,new RegExp(a.id));assert.equal(ui.doc.querySelectorAll('input[type="radio"]').length,0);if(mode==='staff')assert.ok(ui.doc.querySelector('[aria-label="Más acciones del intento"]'));if(mode==='outage')assert.match(ui.doc.body.textContent!,/Resumen autorizado/);}finally{await ui.close();}
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
