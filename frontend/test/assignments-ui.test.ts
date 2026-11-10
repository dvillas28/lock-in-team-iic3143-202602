import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { Assignments } from "../src/components/assignments/assignments.tsx";
import type { Assignment } from "../src/lib/api/assignments.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, id, section } from "./fixtures/courses.ts";

const task: Assignment = {
  id:id(65),courseId:course.id,sectionId:section.id,groupId:id(66),groupTitle:"Tareas",
  status:"draft",publishedAt:null,canManage:true,title:"Análisis",description:"Descripción",
  instructions:"Lee el enunciado.",maxPoints:10,weightPercent:0,allowedExtensions:["pdf"],
  allowWrittenResponse:false,maxAttempts:2,availableFrom:null,dueAt:null,availableUntil:null,version:0,
};
const view = (assignmentId?: string) => h(Assignments,{courseId:course.id,assignmentId});
const isWrite = (r: Request) => ["POST","PATCH"].includes(r.method) && r.url.includes("/assignments");

function fixture(reply: (r: Request) => Response | Promise<Response>) {
  return (r: Request) => {
    if (r.url.endsWith("/my-submissions")) return Response.json({attempts:[],grade:null,usedAttempts:0,sections:[section.id],serverNow:new Date().toISOString()});
    if (r.url.endsWith("/submissions")) return Response.json({gradeItemId:id(68),students:[]});
    if (r.url.endsWith("/sections")) return Response.json({items:[section]});
    if (r.url.endsWith("/evaluation-groups")) return Response.json({items:[{id:task.groupId,title:task.groupTitle,weightPercent:0,position:1}]});
    if (r.url.endsWith("/courses/"+course.id)) return Response.json(course);
    return reply(r);
  };
}

test("teacher validates the form and retries direct publication with the original key",async()=>{
  let calls=0;
  const bodies: unknown[]=[];
  const ui=await mount(view(),fixture(async r=>{
    if (r.method==="GET") return Response.json({items:calls<2 ? [] : [{...task,status:"published",publishedAt:course.createdAt}]});
    bodies.push(await r.json());
    if (++calls===1) throw Error("lost connection");
    return Response.json({...task,status:"published",publishedAt:course.createdAt},{status:201});
  }),"teacher");
  try {
    assert.match(ui.doc.body.textContent!,/Aún no hay tareas|0 tareas/);
    await ui.click("Nueva tarea");
    await ui.submit("form",{title:"Análisis"});
    assert.match(ui.doc.body.textContent!,/Selecciona un formato de archivo o habilita la respuesta escrita/);
    await ui.click("Selecciona formatos");
    const pdf=ui.doc.querySelector<HTMLInputElement>('.assignment-format-options input[type="checkbox"]')!;
    await ui.settle(()=>pdf.click());
    await ui.submit("form",{title:"Análisis",dueAtDate:"01-01-2000",dueAtTime:"12:00"});
    assert.match(ui.doc.body.textContent!,/no puede ser anterior/);
    assert.equal(ui.requests.filter(isWrite).length,0);
    const form=ui.doc.querySelector("form")!;
    (form.elements.namedItem("dueAtDate") as HTMLInputElement).value="";
    (form.elements.namedItem("dueAtTime") as HTMLInputElement).value="";
    const publish=form.querySelector<HTMLButtonElement>('[value="publish"]')!;
    await ui.settle(()=>form.dispatchEvent(new ui.dom.window.SubmitEvent("submit",{bubbles:true,cancelable:true,submitter:publish})));
    assert.match(ui.doc.body.textContent!,/quedó sin confirmar/);
    await ui.click("Reintentar guardado");
    assert.deepEqual(bodies[0],bodies[1]);
    assert.equal((bodies[1] as {publish:boolean}).publish,true);
    assert.match(ui.doc.body.textContent!,/Tarea publicada\./);
    assert.match(ui.doc.body.textContent!,/Ponderación: 0 %/);
  } finally {await ui.close();}
});

test("teacher edits a draft, publishes it, hides it and gets a conflict on a stale edit",async()=>{
  let stored=task;
  let conflict=false;
  const ui=await mount(view(task.id),fixture(async r=>{
    if (r.method==="GET") return Response.json(stored);
    const body=await r.json();
    if (conflict) return Response.json({code:"ASSIGNMENT_CHANGED"},{status:409});
    stored=r.url.endsWith("/visibility")
      ? {...stored,status:body.published ? "published" : "hidden",publishedAt:course.createdAt,version:stored.version+1}
      : {...stored,title:body.title,version:stored.version+1};
    return Response.json(stored);
  }),"ownerTeacher");
  try {
    assert.match(ui.doc.body.textContent!,/Este grupo tiene 0 %/);
    assert.match(ui.doc.body.textContent!,/\.pdf/);
    await ui.click("Editar tarea");
    await ui.submit("form",{title:"Análisis revisado"});
    assert.match(ui.doc.body.textContent!,/Tarea actualizada\./);
    await ui.click("Publicar tarea");
    assert.match(ui.doc.body.textContent!,/Tarea publicada\./);
    await ui.click("Ocultar tarea");
    assert.match(ui.doc.body.textContent!,/Tarea oculta\./);
    conflict=true;
    await ui.click("Editar tarea");
    await ui.submit("form",{title:"Cambio desactualizado"});
    assert.match(ui.doc.body.textContent!,/La tarea cambió/);
    assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled,true);
  } finally {await ui.close();}
});

test("student sees published timing and detail but cannot load a draft payload",async()=>{
  const active={...task,canManage:false,status:"published",publishedAt:course.createdAt,sectionId:null,availableFrom:"2000-01-01T00:00:00Z",dueAt:"2000-01-02T00:00:00Z",availableUntil:"2999-01-01T00:00:00Z",description:null,allowedExtensions:[],maxAttempts:null};
  let payload: unknown=active;
  const ui=await mount(view(),fixture(r=>Response.json(r.url.endsWith("/assignments") ? {items:[active]} : payload)),"student");
  try {
    assert.match(ui.doc.body.textContent!,/Atrasada/);
    assert.doesNotMatch(ui.doc.body.textContent!,/Nueva tarea/);
    await ui.click("Por grupo");
    assert.match(ui.doc.body.textContent!,/Ponderación: 0 %/);
    await ui.click("Por fecha");
    await ui.render(view(task.id));
    assert.match(ui.doc.body.textContent!,/Todo el curso/);
    assert.match(ui.doc.body.textContent!,/Ilimitados|ilimitados/);
    assert.match(ui.doc.body.textContent!,/Tu entrega/);
    assert.doesNotMatch(ui.doc.body.textContent!,/Editar tarea/);
    assert.equal(ui.requests.some(r=>r.url.endsWith("/evaluation-groups")),false);
    payload={...task,id:id(67),canManage:false};
    await ui.render(view(id(67)));
    assert.doesNotMatch(ui.doc.body.textContent!,/Lee el enunciado/);
  } finally {await ui.close();}
});

test("written evidence renders basic markup without executable HTML or external resources",async()=>{
  const {renderToStaticMarkup}=await import("react-dom/server");
  const {WrittenResponse}=await import("../src/components/assignments/submission-evidence.tsx");
  const html=renderToStaticMarkup(h(WrittenResponse,{text:"**Informe**\n\n- _Hipótesis_\n\n<script>alert(1)</script>\n\n![dato](https://example.test/x.png) [link](javascript:alert%281%29)"}));
  assert.match(html,/<strong>Informe<\/strong>/);
  assert.match(html,/<em>Hipótesis<\/em>/);
  assert.match(html,/<ul>/);
  assert.doesNotMatch(html,/<script|<img|<a\s|href=|src=/);
});
