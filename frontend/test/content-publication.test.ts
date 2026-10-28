import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h} from "react";
import {ModulesPanel} from "../src/components/content/modules-panel.tsx";
import {mount} from "./fixtures/course-ui.ts";
import {unit,material,course,timestamp,matrix} from "./fixtures/content.ts";
import {deferred} from "./fixtures/courses.ts";
const view=()=>h(ModulesPanel,{courseId:course.id});
test("independent publication controls retain focus and aria state; hidden parent preserves child publication",async()=>{
 let parent={...unit};let child={...material,publishedAt:timestamp as string|null};
 const ui=await mount(view(),r=>{
 if(r.method==="POST"){if(r.url.includes("/materials/")){child={...child,publishedAt:r.url.endsWith("/unpublish")?null:timestamp};return Response.json(child);}parent={...parent,publishedAt:r.url.endsWith("/unpublish")?null:timestamp};return Response.json(parent);}
 return Response.json(r.url.endsWith("/materials")?{items:[child]}:r.url.endsWith("/modules")?{items:[parent]}:course);
 },"teacher");
 try{
 await ui.click("Unidad 1");assert.match(ui.doc.body.textContent!,/No visible: módulo sin publicar/);
 const button=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar módulo Unidad 1"]')!;assert.ok(button);button.focus();
 await ui.settle(()=>button.click());assert.equal(ui.doc.activeElement,button);assert.equal(button.getAttribute("aria-pressed"),"true");
 assert.match(ui.doc.body.textContent!,/Visible para estudiantes/);
 await ui.settle(()=>button.click());assert.equal(child.publishedAt,timestamp);assert.match(ui.doc.body.textContent!,/No visible: módulo sin publicar/);
 }finally{await ui.close();}
 for(const entry of matrix){const u=await mount(view(),r=>Response.json(r.url.endsWith("/materials")?{items:[entry.material]}:r.url.endsWith("/modules")?{items:[entry.unit]}:course),"teacher");try{await u.click("Unidad 1");assert.match(u.doc.body.textContent!,entry.visible?/Visible para estudiantes/:/No visible/);}finally{await u.close();}}
});
test("publication distinguishes rejected, uncertain and confirmed with failed refresh; never retries",async()=>{
 for(const mode of ["rejected","uncertain","refresh"]){
 let posted=false;const ui=await mount(view(),r=>{
 if(r.method==="POST"){posted=true;return mode==="uncertain"?Promise.reject(new Error("lost")):mode==="rejected"?Response.json({},{status:422}):Response.json({...unit,publishedAt:timestamp});}
 if(posted&&mode==="refresh"&&r.url.endsWith("/modules"))return Response.json({},{status:503});
 return Response.json(r.url.endsWith("/modules")?{items:[unit]}:r.url.endsWith(unit.id)?unit:course);
 },"teacher");
 try{const b=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar módulo Unidad 1"]')!;await ui.settle(()=>b.click());
 assert.match(ui.doc.body.textContent!,mode==="uncertain"?/Resultado incierto/:mode==="refresh"?/Módulo publicado.*No se pudo actualizar/:/Revisa/);
 assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);
 if(mode==="uncertain"){await ui.settle(()=>b.click());assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);}
 }finally{await ui.close();}
 }
});
test("publication revoked or completed after logout never announces success",async()=>{
 for(const status of [403,404,200]){
 const pending=deferred<Response>();const ui=await mount(view(),r=>r.method==="POST"?pending.promise:Response.json(r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{const b=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar módulo Unidad 1"]')!;await ui.settle(()=>b.click());if(status===200)await ui.settle(()=>ui.session.logout());
 await ui.settle(()=>pending.resolve(Response.json({...unit,publishedAt:timestamp},{status})));
 assert.doesNotMatch(ui.doc.body.textContent!,/Módulo publicado/);if(status===200)assert.doesNotMatch(ui.doc.body.textContent!,/Unidad 1/);else assert.match(ui.doc.body.textContent!,/Unidad 1/);
 }finally{await ui.close();}
 }
});

test("uncertain item publication refreshes observed state without claiming write success or unlocking",async()=>{
 let item={...material};
 const ui=await mount(view(),r=>{
 if(r.method==="POST"){item={...item,publishedAt:timestamp};throw new Error("response lost");}
 return Response.json(r.url.endsWith("/materials")?{items:[item]}:r.url.includes("/materials/")?item:r.url.endsWith("/modules")?{items:[unit]}:course);
 },"teacher");
 try{
 await ui.click("Unidad 1");const button=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar material Lectura"]')!;
 await ui.settle(()=>button.click());assert.match(ui.doc.body.textContent!,/Resultado incierto/);assert.doesNotMatch(ui.doc.body.textContent!,/Material publicado/);
 assert.equal(button.getAttribute("aria-pressed"),"true");assert.equal(button.getAttribute("aria-disabled"),"true");
 }finally{await ui.close();}
});
