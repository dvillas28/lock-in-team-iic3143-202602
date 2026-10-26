import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h} from "react";
import {ModulesPanel} from "../src/components/content/modules-panel.tsx";
import {MaterialReader} from "../src/components/content/material-reader.tsx";
import {mount} from "./fixtures/course-ui.ts";
import {unit,material,course,matrix,id} from "./fixtures/content.ts";
import {deferred} from "./fixtures/courses.ts";
const route={courseId:course.id,moduleId:unit.id,materialId:material.id};
test("reader renders adversarial source inert and preserves whitespace; validates both parents",async()=>{
 const ui=await mount(h(MaterialReader,route),r=>Response.json(r.url.includes("/materials/")?material:unit),"teacher");
 try {assert.match(ui.doc.querySelector(".academic-markdown")?.textContent ?? "", /globalThis.pwned=1/);assert.equal(ui.doc.querySelector(".academic-markdown a[href]"),null);assert.equal(ui.doc.querySelectorAll("script,img,iframe").length,0);assert.equal(ui.requests.some(r=>r.url.includes("evil.test")),false);assert.ok(ui.doc.querySelector('a[href*="/modules#"]'));}
 finally {await ui.close();}
 for(const wrong of ["course","material"]) {
 const u=await mount(h(MaterialReader,route),r=>Response.json(r.url.includes("/materials/")?{...material,moduleId:wrong==="material"?id(99):unit.id}:{...unit,courseId:wrong==="course"?id(11):course.id}),"teacher");
 try{assert.equal(u.doc.querySelector(".academic-markdown"),null);}finally{await u.close();}
 }
});
test("student/assistant direct route publication matrix is enforced by rejected API",async()=>{
 for(const profile of ["student","assistant"])for(const m of matrix) {
 const ui=await mount(h(MaterialReader,route),r=>!m.visible?Response.json({},{status:404}):Response.json(r.url.includes("/materials/")?m.material:m.unit),profile);
 try{assert.equal(!!ui.doc.querySelector(".academic-markdown"),m.visible);}finally{await ui.close();}
 }
});
test("modules lazy-load material; loading, empty and errors differ; links navigate real routes",async()=>{
 const ui=await mount(h(ModulesPanel,{courseId:course.id}),r=>Response.json(r.url.endsWith("/materials")?{items:[material]}:r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try {assert.equal(ui.requests.some(r=>r.url.endsWith("/materials")),false);await ui.click("Unidad 1");assert.ok(ui.doc.querySelector('a[href$="/materials/'+material.id+'"]'));await ui.click("Unidad 1");}
 finally{await ui.close();}
 for(const [status,body,expected] of [[200,{items:[]},/Sin contenido/],[503,{},/No se pudo/]] as const){
 const u=await mount(h(ModulesPanel,{courseId:course.id}),r=>Response.json(r.url.endsWith("/modules")?body:course,{status:r.url.endsWith("/modules")?status:200}),"student");
 try{assert.match(u.doc.body.textContent!,expected);}finally{await u.close();}
 }
});
test("resource navigation and logout discard delayed content including old forbidden responses",async()=>{
 for(const status of [200,403]){
 const pending=deferred<Response>();const ui=await mount(h(MaterialReader,route),r=>r.url.endsWith(unit.id)?pending.promise:Response.json(r.url.includes("/materials/")?{...material,id:id(51),moduleId:id(41),markdownBody:"Actual"}:{...unit,id:id(41)}),"teacher");
 try{assert.match(ui.doc.body.textContent!,/Cargando/);await ui.render(h(MaterialReader,{...route,moduleId:id(41),materialId:id(51)}));await ui.settle(()=>pending.resolve(Response.json(unit,{status})));assert.match(ui.doc.body.textContent!,/Actual/);await ui.settle(()=>ui.session.logout());assert.equal(ui.doc.body.textContent,"");}finally{await ui.close();}
 }
});

test("identity/tenant changes and current 401/403/404 clear private reads; metadata stays inert",async()=>{
 for(const status of [401,403,404]){
 const ui=await mount(h(MaterialReader,route),r=>r.url.includes("/materials/")?Response.json({},{status}):Response.json(unit),"teacher");
 try{assert.equal(ui.doc.querySelector(".academic-markdown"),null);assert.doesNotMatch(ui.doc.body.textContent!,/globalThis.pwned/);}finally{await ui.close();}
 }
 for(const tenant of ["uc","utfsm"]){
 const old=deferred<Response>();const ui=await mount(h(MaterialReader,route),r=>r.url.includes("/institution/uc/")?old.promise:Response.json(r.url.includes("/materials/")?{...material,markdownBody:"UTFSM actual"}:unit),"teacher");
 try{
 await ui.actor("teacher",tenant);
 if(tenant==="uc")await ui.settle(()=>ui.session.logout());
 await ui.settle(()=>old.resolve(Response.json(unit)));
 assert.doesNotMatch(ui.doc.body.textContent!,/globalThis.pwned/);
 if(tenant==="utfsm")assert.match(ui.doc.body.textContent!,/UTFSM actual/);
 }finally{await ui.close();}
 }
 const ui=await mount(h(MaterialReader,route),r=>Response.json(r.url.includes("/materials/")?{...material,title:'<img src="https://evil.test/title">'}:unit),"teacher");
 try{assert.equal(ui.doc.querySelectorAll("img,script").length,0);assert.match(ui.doc.querySelector("h1")!.textContent!,/<img/);}finally{await ui.close();}
});

test("publication matrix in course navigation exposes only jointly published materials; admin without enrollment denied",async()=>{
 for(const profile of ["student","assistant"])for(const entry of matrix){
 const ui=await mount(h(ModulesPanel,{courseId:course.id}),r=>{
 if(r.url.endsWith("/modules"))return Response.json({items:entry.unit.publishedAt?[entry.unit]:[]});
 if(r.url.endsWith("/materials"))return Response.json({items:entry.visible?[entry.material]:[]});
 return Response.json(course);
 },profile);
 try{
 if(entry.unit.publishedAt)await ui.click("Unidad 1");
 assert.equal(!!ui.doc.querySelector('a[href$="/materials/'+material.id+'"]'),entry.visible);
 }finally{await ui.close();}
 }
 for(const profile of ["owner","super"]){
 const ui=await mount(h(ModulesPanel,{courseId:course.id}),r=>r.url.endsWith("/modules")?Response.json({},{status:404}):Response.json(course),profile);
 try{assert.doesNotMatch(ui.doc.body.textContent!,/Unidad 1|Lectura|Desarrollo de software/);assert.equal(ui.doc.querySelector("form"),null);}finally{await ui.close();}
 }
});
