import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentSubmissions } from "../src/components/assignments/student-submissions.tsx";
import { TeacherSubmissions } from "../src/components/assignments/teacher-submissions.tsx";
import { WrittenEditor } from "../src/components/assignments/written-editor.tsx";
import { WrittenResponse } from "../src/components/assignments/submission-evidence.tsx";
import { ContentNotices } from "../src/components/content/content-notices.tsx";
import type { Assignment } from "../src/lib/api/assignments.ts";
import type { RosterEntry, Submission, SubmissionGrade } from "../src/lib/api/submissions.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, id, otherSection, person, section } from "./fixtures/courses.ts";

const stamp=course.createdAt;
const scope={slug:"uc",courseId:course.id,assignmentId:id(60)};
const assignment:Assignment={id:scope.assignmentId,courseId:course.id,title:"Informe",description:null,
 instructions:null,sectionId:null,maxPoints:10,groupId:id(61),groupTitle:"Tareas",weightPercent:100,
 status:"published",publishedAt:stamp,version:0,canManage:false,allowedExtensions:["pdf"],
 allowWrittenResponse:true,maxAttempts:2,availableFrom:null,dueAt:null,availableUntil:null};
const file={id:id(62),name:"evidencia.pdf",mediaType:"application/pdf",byteSize:3,sha256:"a".repeat(64)};
const attempt:Submission={id:id(63),attemptNumber:1,sectionId:section.id,isLate:true,
 submittedAt:stamp,writtenResponse:"<p><strong>Resultado</strong></p>",files:[file]};
const nextAttempt:Submission={...attempt,id:id(64),attemptNumber:2,isLate:false,writtenResponse:"Segunda entrega",files:[]};
const student:RosterEntry={studentId:person.id,sectionId:section.id,sectionCode:section.code,name:person.name,
 latestAttempt:2,isLate:false,gradeStatus:"none",draft:null};
const gradeItemId=id(65);
const draft:SubmissionGrade={id:id(66),assignmentId:scope.assignmentId,gradeItemId,studentId:student.studentId,
 sectionId:section.id,attemptId:attempt.id,pointsEarned:8,scorePercent:80,grade:5.5,publishedAt:null,
 revisionId:null,revisedAt:null,updatedAt:stamp,feedback:"Buena evidencia."};

function mockProperty(t:TestContext,object:object,key:string,value:unknown) {
 const previous=Object.getOwnPropertyDescriptor(object,key);
 Object.defineProperty(object,key,{configurable:true,writable:true,value});
 t.after(()=>{
  if (previous) Object.defineProperty(object,key,previous);
  else Reflect.deleteProperty(object,key);
 });
}

type Ui=Awaited<ReturnType<typeof mount>>;
async function writeField(ui:Ui,selector:string,value:string) {
 const field=ui.doc.querySelector<HTMLInputElement|HTMLTextAreaElement>(selector)!;
 await ui.settle(()=>{
  field.focus();
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field),"value")!.set!.call(field,value);
  field.dispatchEvent(new ui.dom.window.Event("input",{bubbles:true}));
  field.dispatchEvent(new ui.dom.window.KeyboardEvent("keyup",{bubbles:true}));
 });
}

test("teacher reviews specific evidence, downloads it, saves a draft and retries publication and correction safely",async t=>{
 mockProperty(t,globalThis,"requestAnimationFrame",(callback:FrameRequestCallback)=>{callback(0);return 1;});
 const objectUrls:Blob[]=[];
 mockProperty(t,URL,"createObjectURL",(bytes:Blob)=>{objectUrls.push(bytes);return "blob:https://api.test/evidence";});
 mockProperty(t,URL,"revokeObjectURL",()=>{});
 let grade:SubmissionGrade|null=null;
 const publications:{key:string|null;body:unknown}[]=[], corrections:unknown[]=[];
 const ui=await mount(h(ContentNotices,null,h(TeacherSubmissions,{scope,maxPoints:10})),async request=>{
  const url=new URL(request.url);
  if (url.pathname.endsWith("/submissions")) {
   const roster=grade ? {...student,gradeStatus:grade.publishedAt ? "published" : "draft",
    draft:grade.publishedAt ? null : {id:grade.id,expectedUpdatedAt:grade.updatedAt}} : student;
   return Response.json({gradeItemId,students:[roster,{...student,studentId:id(67),name:"Estudiante pendiente",
    sectionId:otherSection.id,sectionCode:otherSection.code,latestAttempt:null,isLate:null}]});
  }
  if (url.pathname.endsWith("/submission-review")) {
   const other=url.searchParams.get("sectionId")===otherSection.id;
   return Response.json(other ? {attempts:[],grade:null} : {attempts:[nextAttempt,attempt],grade});
  }
  if (url.pathname.endsWith("/submission-files/"+file.id)) {
   return new Response(new Uint8Array([1,2,3]),{headers:{"Content-Type":file.mediaType}});
  }
  if (request.method==="PUT") {
   assert.ok(url.pathname.endsWith(`/submissions/${attempt.id}/grade`));
   assert.deepEqual(await request.json(),{points:8,feedback:draft.feedback,expectedUpdatedAt:null});
   grade=draft;
   return Response.json(grade);
  }
  if (url.pathname.endsWith("/gradebook/publications")) {
   publications.push({key:request.headers.get("Idempotency-Key"),body:await request.json()});
   if (publications.length===1) return Response.json({code:"SERVICE_UNAVAILABLE"},{status:503});
   grade={...draft,publishedAt:stamp};
   return Response.json({publishedCount:1,publishedAt:stamp});
  }
  if (request.method==="PATCH") {
   const body=await request.json();
   corrections.push(body);
   if (corrections.length===1) throw new Error("response lost");
   grade={...draft,publishedAt:stamp,attemptId:nextAttempt.id,pointsEarned:9,scorePercent:90,grade:6.3,
    revisionId:body.revisionId,revisedAt:stamp};
   return Response.json(grade);
  }
  throw new Error(`Unexpected request: ${request.method} ${url.pathname}`);
 },"teacher");
 try {
  mockProperty(t,ui.dom.window.HTMLAnchorElement.prototype,"click",()=>{});
  await ui.select(".submission-heading select",otherSection.id);
  await ui.click("Estudiante pendienteSección 2");
  assert.match(ui.doc.body.textContent!,/todavía no tiene intentos/);
  await ui.click("Cerrar");
  await ui.select(".submission-heading select",section.id);
  await ui.click("María PérezSección 1");
  await ui.select(".assignment-review select",attempt.id);
  assert.equal(ui.doc.querySelector(".assignment-written strong")?.textContent,"Resultado");
  await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>("button.submission-file")!.click());
  assert.equal(objectUrls[0].size,3);
  await ui.submit(".assignment-grading");
  assert.match(ui.doc.body.textContent!,/Ingresa un puntaje/);
  await writeField(ui,".submission-score","8");
  await writeField(ui,".assignment-grading textarea",draft.feedback!);
  await ui.submit(".assignment-grading");
  assert.match(ui.doc.body.textContent!,/Borrador actual/);
  await ui.click("Cerrar");
  await ui.settle(()=>ui.doc.querySelector<HTMLInputElement>("input.submission-checkbox")!.click());
  await ui.click("Publicar selección (1)");
  await ui.click("Confirmar publicación");
  await ui.click("Reintentar publicación");
  assert.deepEqual(publications[0],publications[1]);
  assert.deepEqual(publications[0].body,{scope:"assignment",gradeItemId,grades:[{id:draft.id,expectedUpdatedAt:stamp}]});
  assert.match(ui.doc.querySelector("tbody")!.textContent!,/Publicada/);

  await ui.click("María PérezSección 1");
  await ui.select(".assignment-review select",nextAttempt.id);
  assert.match(ui.doc.body.textContent!,/quedará asociada al intento 2/);
  await ui.submit(".assignment-grading");
  assert.match(ui.doc.body.textContent!,/Indica el motivo/);
  await writeField(ui,".submission-score","9");
  await writeField(ui,".assignment-grading textarea[required]","Se revisó el segundo intento.");
  await ui.submit(".assignment-grading");
  await ui.submit(".assignment-grading");
  assert.deepEqual(corrections[0],corrections[1]);
  assert.match(ui.doc.querySelector(".content-notices")!.textContent!,/Calificación corregida/);
 } finally {await ui.close();}
});

class SubmissionUpload {
 static current:SubmissionUpload;
 upload:{onprogress?:(event:{lengthComputable:boolean;loaded:number;total:number})=>void}={};
 onloadend?:()=>void;
 responseURL="";
 status=0;
 response?:ArrayBuffer;
 form?:FormData;
 constructor(){SubmissionUpload.current=this;}
 open(_method:string,url:string){this.responseURL=url;}
 setRequestHeader(){}
 getAllResponseHeaders(){return "Content-Type: application/json";}
 send(form:FormData){this.form=form;}
 abort(){this.status=0;this.onloadend?.();}
 finish(receipt:Submission){
  this.status=201;
  this.response=new TextEncoder().encode(JSON.stringify(receipt)).buffer;
  this.onloadend?.();
 }
}

test("student confirms an attachment and written response, retries the same request and opens the receipt",async t=>{
 mockProperty(t,globalThis,"XMLHttpRequest",SubmissionUpload);
 let attempts:Submission[]=[];
 const ui=await mount(h(ContentNotices,null,h(StudentSubmissions,{scope,item:assignment,sections:[section,otherSection],now:Date.now()})),
  ()=>Response.json({attempts,sections:[section.id,otherSection.id],usedAttempts:attempts.length,
   serverNow:new Date().toISOString(),grade:null}),"student");
 try {
  mockProperty(t,ui.doc,"queryCommandState",()=>false);
  const editor=ui.doc.querySelector<HTMLElement>("[contenteditable]")!;
  await ui.settle(()=>{
   editor.innerHTML=attempt.writtenResponse!;
   editor.dispatchEvent(new ui.dom.window.Event("input",{bubbles:true}));
  });
  assert.match(ui.doc.body.textContent!,/1 palabra/);
  const input=ui.doc.querySelector<HTMLInputElement>('input[type="file"]')!;
  async function pick(name:string) {
   await ui.settle(()=>{
    Object.defineProperty(input,"files",{configurable:true,value:[new ui.dom.window.File(["pdf"],name,{type:file.mediaType})]});
    input.dispatchEvent(new ui.dom.window.Event("change",{bubbles:true}));
   });
  }
  await pick("informe.zip");
  assert.match(ui.doc.body.textContent!,/formatos permitidos/);
  await pick(file.name);
  await ui.click("Entregar tarea");
  await ui.click("Confirmar entrega");
  const first=SubmissionUpload.current;
  assert.equal(first.form?.get("expectedAttempts"),"0");
  assert.equal(first.form?.get("sectionId"),section.id);
  assert.equal(first.form?.get("writtenResponse"),attempt.writtenResponse);
  assert.equal((first.form?.get("files") as File).name,file.name);
  await ui.settle(()=>first.upload.onprogress?.({lengthComputable:true,loaded:1,total:2}));
  assert.equal(ui.doc.querySelector("progress")?.value,50);
  await ui.settle(()=>first.abort());
  await ui.click("Reintentar el mismo envío");
  const replay=SubmissionUpload.current;
  assert.equal(replay.form?.get("idempotencyKey"),first.form?.get("idempotencyKey"));
  attempts=[attempt];
  await ui.settle(()=>replay.finish(attempt));
  assert.match(ui.doc.body.textContent!,/Intento 1 entregado con atraso/);
  await ui.click("Ver historial de intentos");
  assert.ok(ui.doc.querySelector(".submission-history-dialog[open]"));
  assert.match(ui.doc.querySelector(".submission-history-dialog")!.textContent!,/Intento 1.*Atrasado/);
  await ui.click("Cerrar");
 } finally {await ui.close();}
});

test("rich evidence and editor strip attributes and unknown tags before inserting HTML",async t=>{
 const unsafe='<p onmouseover="run()">Datos <b>válidos</b></p><b:unsafe onclick="run()">extra</b:unsafe><img src=x onerror=run()> < suelto';
 const html=renderToStaticMarkup(h(WrittenResponse,{text:unsafe}));
 assert.match(html,/<p>Datos <b>válidos<\/b><\/p>extra &lt; suelto/);
 assert.doesNotMatch(html,/onmouseover|onclick|onerror|<img|<b:unsafe/);
 const changes:string[]=[], commands:unknown[][]=[];
 const ui=await mount(h(WrittenEditor,{value:unsafe,onChange:value=>changes.push(value)}),()=>Response.json({}),"student");
 try {
  mockProperty(t,ui.doc,"queryCommandState",(command:string)=>command==="bold");
  mockProperty(t,ui.doc,"execCommand",(...args:unknown[])=>{commands.push(args);return true;});
  const editor=ui.doc.querySelector<HTMLElement>("[contenteditable]")!;
  assert.equal(editor.tabIndex,0);
  assert.equal(editor.querySelector("p")?.attributes.length,0);
  await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('[aria-label="Negrita"]')!.click());
  assert.deepEqual(commands[0],["bold"]);
  assert.equal(ui.doc.querySelector('[aria-label="Negrita"]')?.getAttribute("aria-pressed"),"true");
  await ui.settle(()=>{
   const event=new ui.dom.window.Event("paste",{bubbles:true,cancelable:true});
   Object.defineProperty(event,"clipboardData",{value:{getData:(mime:string)=>mime==="text/plain"?"Texto pegado":"<img>"}});
   editor.dispatchEvent(event);
   assert.equal(event.defaultPrevented,true);
  });
  assert.deepEqual(commands[1],["insertText",false,"Texto pegado"]);
  await ui.settle(()=>{
   editor.textContent="a".repeat(10_001);
   editor.dispatchEvent(new ui.dom.window.Event("input",{bubbles:true}));
  });
  assert.match(editor.innerHTML,/<b>válidos<\/b>/);
  assert.equal(changes.length,2);
 } finally {await ui.close();}
});
