import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h} from "react";
import {ModulesPanel} from "../src/components/content/modules-panel.tsx";
import {mount} from "./fixtures/course-ui.ts";
import {unit,material,course,id} from "./fixtures/content.ts";
import {deferred} from "./fixtures/courses.ts";
const view=()=>h(ModulesPanel,{courseId:course.id});
test("teacher without admin creates at max+1; edits material minimally and retains draft on authorized refresh",async()=>{
 let parent={...unit};let item={...material};const ui=await mount(view(),async r=>{
 if(r.method==="PATCH"){const b=await r.clone().json();if(r.url.includes("/materials/")){item={...item,...b};return Response.json(item);}parent={...parent,...b};return Response.json(parent);}
 if(r.method==="POST"&&!r.url.endsWith("/login"))return Response.json({...unit,id:id(42),...await r.clone().json()},{status:201});
 return Response.json(r.url.endsWith("/materials")?{items:[item]}:r.url.endsWith("/modules")?{items:[parent]}:course);
 },"teacher");
 try{
 assert.ok(ui.doc.querySelector('form[aria-label="Crear módulo"]'));
 await ui.submit('form[aria-label="Crear módulo"]',{title:"Segundo"});assert.deepEqual(await ui.requests.find(r=>r.method==="POST"&&!r.url.endsWith("/login"))!.clone().json(),{title:"Segundo",position:4});
 await ui.click("Unidad 1");const form='form[aria-label="Editar material Lectura"]';
 await ui.submit(form,{title:"Lectura",markdownBody:"  nuevo texto  "});
 assert.deepEqual(await ui.requests.find(r=>r.method==="PATCH")!.clone().json(),{markdownBody:"  nuevo texto  "});
 const textarea=ui.doc.querySelector<HTMLTextAreaElement>(form+' textarea')!;textarea.value="Borrador local";
 await ui.submit('form[aria-label="Editar módulo Unidad 1"]',{title:"Unidad revisada"});
 assert.equal(ui.doc.querySelector<HTMLTextAreaElement>(form+' textarea')?.value,"Borrador local");
 }finally{await ui.close();}
});
test("non teachers never mount editors; forced API writes rejected",async()=>{
 for(const profile of ["student","assistant","owner","super"]){
 const ui=await mount(view(),r=>r.method!=="GET"?Response.json({},{status:403}):Response.json(r.url.endsWith("/modules")?{items:[unit]}:course),profile);
 try{assert.equal(ui.doc.querySelector("form"),null);await ui.settle(()=>{void assert.rejects(ui.session.request(c=>c.POST("/api/v1/institution/{institutionSlug}/modules/{moduleId}/materials",{params:{path:{institutionSlug:"uc",moduleId:unit.id}},body:{title:"x",markdownBody:"x"}})));});assert.equal(ui.doc.querySelector("form"),null);}finally{await ui.close();}
 }
});
test("validation rejection preserves authorized text; ambiguous/failing creation reconciliation locks resubmit",async()=>{
 for(const status of [400,409,413,415,422,503]){
 let posted=false;const ui=await mount(view(),r=>{
 if(r.method==="POST"&&!r.url.endsWith("/login")){posted=true;return status===503?Promise.reject(new Error("lost")):Response.json({},{status});}
 if(posted&&status===503&&r.url.endsWith("/modules"))return Response.json({},{status:503});
 return Response.json(r.url.endsWith("/modules")?{items:[unit]}:course);
 },"teacher");
 try{await ui.submit('form[aria-label="Crear módulo"]',{title:"Mi borrador"});
 assert.equal(ui.doc.querySelector<HTMLInputElement>('form[aria-label="Crear módulo"] input')?.value,"Mi borrador");
 assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);assert.match(ui.doc.body.textContent!,status===503?/incierto/:status===409?/Conflicto/:/Revisa|solicitud/);
 if(status===503){await ui.submit('form[aria-label="Crear módulo"]',{title:"Otra"});assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);}
 }finally{await ui.close();}
 }
});
test("late write cannot restore draft after logout or resource change",async()=>{
 for(const action of ["logout","resource","revocation"]){
 const pending=deferred<Response>();const ui=await mount(view(),r=>r.method==="POST"?pending.promise:Response.json(r.url.endsWith("/modules")?{items:[]}:r.url.endsWith(id(11))?{...course,id:id(11)}:course),"teacher");
 try{await ui.submit('form[aria-label="Crear módulo"]',{title:"Privado"});
 if(action==="logout")await ui.settle(()=>ui.session.logout());else if(action==="resource")await ui.render(h(ModulesPanel,{courseId:id(11)}));else await ui.actor("student");
 await ui.settle(()=>pending.resolve(Response.json({...unit,title:"Privado"},{status:201})));
 assert.doesNotMatch(ui.doc.body.textContent!,/Privado|creado|actualizado/);
 }finally{await ui.close();}
 }
});

test("reorder includes drafts, keeps focused control, renders server order and never retries uncertain PUT",async()=>{
 for(const mode of ["confirmed","lost","conflict"]){
 let items=[{...unit},{...unit,id:id(42),title:"Segundo",position:9}];
 const ui=await mount(view(),async r=>{
 if(r.method==="PUT"){
 if(mode==="lost")throw new Error("lost");
 if(mode==="conflict")return Response.json({},{status:409});
 const body=await r.clone().json();items=body.moduleIds.map((key:string,i:number)=>({...items.find(m=>m.id===key)!,position:i+1}));
 return Response.json({items});
 }
 return Response.json(r.url.endsWith("/modules")?{items}:course);
 },"teacher");
 try{
 const b=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Bajar Unidad 1"]')!;b.focus();await ui.settle(()=>b.click());
 assert.deepEqual(await ui.requests.find(r=>r.method==="PUT")!.clone().json(),{moduleIds:[id(42),unit.id]});
 if(mode==="confirmed"){assert.equal(ui.doc.activeElement,b);assert.equal(ui.doc.querySelector("section[id]")?.id,"module-"+id(42));assert.match(ui.doc.body.textContent!,/Orden de módulos actualizado/);}
 else {assert.match(ui.doc.body.textContent!,mode==="lost"?/incierto/:/Conflicto/);if(mode==="lost")await ui.settle(()=>b.click());}
 assert.equal(ui.requests.filter(r=>r.method==="PUT").length,1);
 }finally{await ui.close();}
 }
});
test("material create ambiguity and rejected edit retain original whitespace; no automatic repeat",async()=>{
 for(const mode of ["lost","rejected","confirmed"]){
 let posted=false;
 const ui=await mount(view(),async r=>{
 if(r.method==="POST"){posted=true;if(mode==="lost")throw new Error("lost");return Response.json({...material,id:id(51),...await r.clone().json()},{status:201});}
 if(r.method==="PATCH")return Response.json({},{status:422});
 return Response.json(r.url.endsWith("/materials")?{items:posted&&mode==="lost"?[material,{...material,id:id(51)}]:[material]}:r.url.endsWith("/modules")?{items:[unit]}:course);
 },"teacher");
 try{
 await ui.click("Unidad 1");await ui.submit('form[aria-label="Crear material"]',{title:"Lectura",markdownBody:"  fuente local  "});
 const source=ui.doc.querySelector<HTMLTextAreaElement>('form[aria-label="Crear material"] textarea')!;
 assert.equal(source.value,mode==="lost"?"  fuente local  ":"");
 if(mode==="lost"){assert.match(ui.doc.body.textContent!,/coincidencias no prueban/);await ui.submit('form[aria-label="Crear material"]',{title:"Lectura",markdownBody:"otra"});assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);}
 await ui.submit('form[aria-label="Editar material Lectura"]',{title:"Lectura",markdownBody:"  editar  "});
 assert.equal(ui.doc.querySelector<HTMLTextAreaElement>('form[aria-label="Editar material Lectura"] textarea')!.value,"  editar  ");
 }finally{await ui.close();}
 }
});
test("pending reorder, material update and create are discarded on context changes",async()=>{
 for(const operation of ["order","update","create"]){
 const pending=deferred<Response>();
 const ui=await mount(view(),r=>r.method!=="GET"?pending.promise:Response.json(r.url.endsWith("/materials")?{items:[material]}:r.url.endsWith("/modules")?{items:[unit,{...unit,id:id(42),title:"Segundo",position:9}]}:course),"teacher");
 try{
 if(operation==="order")await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Bajar Unidad 1"]')!.click());
 else{await ui.click("Unidad 1");await ui.submit(operation==="update"?'form[aria-label="Editar material Lectura"]':'form[aria-label="Crear material"]',{title:"Lectura",markdownBody:"Privado"});}
 await ui.actor("student");
 await ui.settle(()=>pending.resolve(Response.json(operation==="order"?{items:[]}:{...material,markdownBody:"Privado"})));
 assert.equal(ui.doc.querySelector("form"),null);assert.doesNotMatch(ui.doc.body.textContent!,/Privado|creado|actualizado/);
 }finally{await ui.close();}
 }
});

test("confirmed create followed by failed empty refresh is not uncertain or a real empty list",async()=>{
 let posted=false;const ui=await mount(view(),r=>{
 if(r.method==="POST"){posted=true;return Response.json(unit,{status:201});}
 return r.url.endsWith("/modules")?Response.json(posted?{}:{items:[]},{status:posted?503:200}):Response.json(course);
 },"teacher");
 try{
 assert.match(ui.doc.body.textContent!,/Sin contenido/);await ui.submit('form[aria-label="Crear módulo"]',{title:"Unidad 1"});
 assert.match(ui.doc.body.textContent!,/Módulo creado.*No se pudo actualizar/);assert.doesNotMatch(ui.doc.body.textContent!,/Resultado incierto|Sin contenido para mostrar/);
 }finally{await ui.close();}
});

test("collapsing an uncertain material editor cannot unlock the same creation",async()=>{
 const ui=await mount(view(),r=>r.method==="POST"?Promise.reject(new Error("lost")):Response.json(r.url.endsWith("/materials")?{items:[material]}:r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
 await ui.click("Unidad 1");await ui.submit('form[aria-label="Crear material"]',{title:"Lectura",markdownBody:"borrador"});
 await ui.click("Unidad 1");await ui.click("Unidad 1");
 assert.match(ui.doc.body.textContent!,/Resultado incierto/);
 await ui.submit('form[aria-label="Crear material"]',{title:"Lectura",markdownBody:"borrador"});
 assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);
 }finally{await ui.close();}
});
