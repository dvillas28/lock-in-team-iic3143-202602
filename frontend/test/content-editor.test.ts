import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h} from "react";
import {ModulesPanel} from "../src/components/content/modules-panel.tsx";
import {mount} from "./fixtures/course-ui.ts";
import {unit,material,course,id,resources} from "./fixtures/content.ts";
import {deferred} from "./fixtures/courses.ts";
import {openCreatePage,openEditPage,createForm,editForm,writeBody,savedBody} from "./fixtures/page-editor.ts";
import {published as publishedQuiz} from "./fixtures/quizzes.ts";
const view=()=>h(ModulesPanel,{courseId:course.id});
test("teacher without admin creates at max+1; edits material minimally and retains draft on authorized refresh",async()=>{
 let parent={...unit};let item={...material};const ui=await mount(view(),async r=>{
 if(r.method==="PATCH"){const b=await r.clone().json();if(r.url.includes("/materials/")){item={...item,...b};return Response.json(item);}parent={...parent,...b};return Response.json(parent);}
 if(r.method==="POST"&&!r.url.endsWith("/login"))return Response.json({...unit,id:id(42),...await r.clone().json()},{status:201});
 return Response.json(r.url.endsWith("/resources")?resources(item):r.url.endsWith("/modules")?{items:[parent]}:course);
 },"teacher");
 try{
 assert.ok(ui.doc.querySelector('form[aria-label="Crear módulo"]'));
 await ui.submit('form[aria-label="Crear módulo"]',{title:"Segundo"});assert.deepEqual(await ui.requests.find(r=>r.method==="POST"&&!r.url.endsWith("/login"))!.clone().json(),{title:"Segundo",position:4});
 await ui.click("Unidad 1");await openEditPage(ui);const form=editForm();
 await ui.submit(form,{title:"Lectura",markdownBody:"  nuevo texto  "});
 assert.deepEqual(await ui.requests.find(r=>r.method==="PATCH")!.clone().json(),{markdownBody:"  nuevo texto  "});
 assert.equal(ui.doc.querySelector(form),null,"editor closes after a confirmed save");
 await ui.submit('form[aria-label="Editar módulo Unidad 1"]',{title:"Unidad revisada"});
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
test("page create ambiguity keeps the draft and blocks repeats; confirmed create closes; rejected edit keeps original whitespace",async()=>{
 for(const mode of ["lost","confirmed"]){
 let posted=false;
 const ui=await mount(view(),async r=>{
 if(r.method==="POST"){posted=true;if(mode==="lost")throw new Error("lost");return Response.json({...material,id:id(51),...await r.clone().json()},{status:201});}
 const items=posted&&mode==="lost"?[material,{...material,id:id(51)}]:[material];
 return Response.json(r.url.endsWith("/resources")?resources(...items):r.url.endsWith("/materials")?{items}:r.url.endsWith("/modules")?{items:[unit]}:course);
 },"teacher");
 try{
 await ui.click("Unidad 1");await openCreatePage(ui);await writeBody(ui,createForm,"<p>fuente local</p>");await ui.submit(createForm,{title:"Lectura"});
 if(mode==="confirmed")assert.equal(ui.doc.querySelector(createForm),null);
 else{
  assert.equal(savedBody(ui,createForm),"fuente local");
  assert.match(ui.doc.body.textContent!,/coincidencias no prueban/);
  await ui.submit(createForm,{title:"Lectura"});
  assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);
 }
 }finally{await ui.close();}
 }
 const ui=await mount(view(),r=>r.method==="PATCH"?Response.json({},{status:422}):Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
  await ui.click("Unidad 1");await openEditPage(ui);await ui.submit(editForm(),{title:"Lectura",markdownBody:"  editar  "});
  assert.equal(ui.doc.querySelector<HTMLTextAreaElement>(editForm()+" textarea")!.value,"  editar  ");
  assert.equal(ui.requests.filter(r=>r.method==="PATCH").length,1);
 }finally{await ui.close();}
});
test("pending reorder, material update and create are discarded on context changes",async()=>{
 for(const operation of ["order","update","create"]){
 const pending=deferred<Response>();
 const ui=await mount(view(),r=>r.method!=="GET"?pending.promise:Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit,{...unit,id:id(42),title:"Segundo",position:9}]}:course),"teacher");
 try{
 if(operation==="order")await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Bajar Unidad 1"]')!.click());
 else{await ui.click("Unidad 1");if(operation==="update")await openEditPage(ui);else await openCreatePage(ui);await ui.submit(operation==="update"?editForm():createForm,{title:"Lectura",markdownBody:"Privado"});}
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
 assert.match(ui.doc.body.textContent!,/Aún no hay módulos disponibles/);await ui.submit('form[aria-label="Crear módulo"]',{title:"Unidad 1"});
 assert.match(ui.doc.body.textContent!,/Módulo creado.*No se pudo actualizar/);assert.doesNotMatch(ui.doc.body.textContent!,/Resultado incierto|Aún no hay módulos disponibles/);
 }finally{await ui.close();}
});

test("collapsing an uncertain material editor cannot unlock the same creation",async()=>{
 const ui=await mount(view(),r=>r.method==="POST"?Promise.reject(new Error("lost")):Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
 await ui.click("Unidad 1");await openCreatePage(ui);await ui.submit(createForm,{title:"Lectura",markdownBody:"borrador"});
 await ui.click("Unidad 1");await ui.click("Unidad 1");
 assert.match(ui.doc.body.textContent!,/Resultado incierto/);
 await ui.submit(createForm,{title:"Lectura",markdownBody:"borrador"});
 assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,1);
 }finally{await ui.close();}
});

test('material publication stays blocked after an uncertain edit even when reconciliation reads the applied body',async()=>{
 for(const mode of ['uncertain','confirmed','rejected']){
  let item={...material,publishedAt:'2026-10-31T00:00:00Z' as string|null},publications=0;
  const ui=await mount(view(),async r=>{
   if(r.method==='PATCH'){
    if(mode==='rejected')return Response.json({},{status:422});
    item={...item,...await r.clone().json()};
    if(mode==='uncertain')throw new Error('response lost after commit');
    return Response.json(item);
   }
   if(r.method==='POST'){publications++;item={...item,publishedAt:null};return Response.json(item);}
   return Response.json(r.url.endsWith('/resources')?resources(item):r.url.endsWith('/modules')?{items:[unit]}:r.url.endsWith(item.id)?item:course);
  },'teacher');
  try{
   await ui.click('Unidad 1');await openEditPage(ui);await ui.submit(editForm(),{title:'Lectura',markdownBody:'Texto persistido'});
   const button=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Ocultar material Lectura"]')!;
   assert.equal(button.getAttribute('aria-disabled'),mode==='uncertain'?'true':'false');
   if(mode==='uncertain'){
    assert.equal(item.markdownBody,'Texto persistido');assert.match(ui.doc.body.textContent!,/este envío sigue bloqueado/);
    assert.equal(ui.doc.querySelector<HTMLTextAreaElement>(editForm()+' textarea')!.value,'Texto persistido');
   }
   await ui.settle(()=>button.click());assert.equal(publications,mode==='uncertain'?0:1);
   assert.equal(ui.requests.filter(r=>r.method==='PATCH').length,1);
  }finally{await ui.close();}
 }
});
test("module dialog: 'Nuevo módulo' opens empty, 'Renombrar' is preloaded, cancel closes and discards",async()=>{
 const ui=await mount(view(),r=>Response.json(r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
 const dialogs=()=>Array.from(ui.doc.querySelectorAll("dialog"));
 assert.equal(dialogs().filter(d=>d.hasAttribute("open")).length,0);
 await ui.click("Nuevo módulo");
 const created=ui.doc.querySelector<HTMLDialogElement>("dialog:not([aria-labelledby*='"+unit.id+"'])")!;
 assert.ok(created.hasAttribute("open"));assert.equal(created.querySelector<HTMLInputElement>("input")!.value,"");
 await ui.click("Cancelar");assert.equal(created.hasAttribute("open"),false);
 const rename=ui.doc.querySelector<HTMLButtonElement>(`button[aria-label="Renombrar ${unit.title}"]`)!;
 await ui.settle(()=>rename.click());
 const edit=ui.doc.querySelector<HTMLInputElement>(`form[aria-label="Editar módulo ${unit.title}"] input`)!;
 assert.equal(edit.value,unit.title);assert.ok(edit.closest("dialog")!.hasAttribute("open"));
 }finally{await ui.close();}
});
test("add-content menu offers three actions, closes on Escape and opens the chosen editor",async()=>{
 const ui=await mount(view(),r=>Response.json(r.url.endsWith("/modules")?{items:[unit]}:r.url.endsWith("/resources")?resources(material):course),"teacher");
 try{
  await ui.click("Unidad 1");
  assert.equal(ui.doc.querySelectorAll('button[aria-haspopup="menu"]').length,1);
  assert.equal(ui.doc.querySelector('[role="menu"]'),null);
  await ui.click("Añadir contenido");
  const labels=Array.from(ui.doc.querySelectorAll('[role="menuitem"] strong')).map(e=>e.textContent);
  assert.deepEqual(labels,["Subir archivo","Crear página","Enlazar cuestionario"]);
  await ui.settle(()=>{ui.doc.querySelector('[role="menu"]')!.dispatchEvent(new ui.doc.defaultView!.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));});
  assert.equal(ui.doc.querySelector('[role="menu"]'),null);
  await ui.click("Añadir contenido");
  await ui.settle(()=>ui.doc.querySelectorAll<HTMLElement>('[role="menuitem"]')[1].click());
  assert.ok(ui.doc.querySelector(createForm)!.closest("dialog")!.hasAttribute("open"));
  assert.equal(ui.doc.querySelector('[data-panel="file"]')!.hasAttribute("hidden"),true);
 }finally{await ui.close();}
});
test("students never see the add-content menu",async()=>{
 const ui=await mount(view(),r=>Response.json(r.url.endsWith("/modules")?{items:[unit]}:r.url.endsWith("/resources")?resources(material):course),"student");
 try{assert.equal(ui.doc.querySelector('button[aria-haspopup="menu"]'),null);assert.equal(ui.doc.querySelector("[data-panel]"),null);}finally{await ui.close();}
});
test("page editor closes only after a confirmed creation and keeps the draft otherwise",async()=>{
 for(const mode of ["ok","rejected"]){
  const ui=await mount(view(),async r=>{
   if(r.method==="POST")return mode==="ok"?Response.json({...material,id:id(51),...await r.clone().json()},{status:201}):Response.json({},{status:422});
   return Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit]}:course);
  },"teacher");
  try{
   await ui.click("Unidad 1");await openCreatePage(ui);
   await writeBody(ui,createForm,"<p>contenido</p>");await ui.submit(createForm,{title:"Nueva"});
   if(mode==="ok"){assert.equal(ui.doc.querySelector(createForm),null);assert.equal(ui.doc.querySelector(".content-notice")?.textContent,"Página creada.");}
   else{assert.equal(savedBody(ui,createForm),"contenido");assert.equal(ui.doc.querySelector(".content-notice"),null);}
  }finally{await ui.close();}
 }
});
test("expanding a module does not flash a loading state for fast loads but explains slow ones",async()=>{
 const pending=deferred<Response>();
 const ui=await mount(view(),r=>r.url.endsWith("/resources")?pending.promise:Response.json(r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
  await ui.click("Unidad 1");
  assert.doesNotMatch(ui.doc.body.textContent!,/Cargando contenido/);
  await ui.settle(()=>{pending.resolve(Response.json(resources(material)));});
  assert.doesNotMatch(ui.doc.body.textContent!,/Cargando contenido/);
  assert.ok(ui.doc.querySelector('a[href$="/materials/'+material.id+'"]'));
 }finally{await ui.close();}
 const slow=deferred<Response>();
 const ui2=await mount(view(),r=>r.url.endsWith("/resources")?slow.promise:Response.json(r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
  await ui2.click("Unidad 1");
  await ui2.settle(()=>{});
  await new Promise(done=>setTimeout(done,450));
  await ui2.settle(()=>{});
  assert.match(ui2.doc.body.textContent!,/Cargando contenido/);
 }finally{await ui2.close();}
});
const linkedQuiz=(quizId:string)=>({kind:"quiz" as const,id:id(77),moduleId:unit.id,title:"Ya enlazado",position:2,publishedAt:null,quizId,canUnlink:true});
const quizzes=(n:number)=>Array.from({length:n},(_,i)=>({...publishedQuiz,id:id(200+i),title:`Cuestionario ${i+1}`}));
async function openQuizDialog(ui:{doc:Document;click:(t:string)=>Promise<void>;settle:(a:()=>void)=>Promise<void>}) {
 await ui.click("Unidad 1");await ui.click("Añadir contenido");
 await ui.settle(()=>ui.doc.querySelectorAll<HTMLElement>('[role="menuitem"]')[2].click());
 await ui.settle(()=>{});
 return ui.doc.querySelector<HTMLDialogElement>('dialog[aria-labelledby^="quiz-link-"]')!;
}
const quizServer=(items:unknown[],options:{linked?:string;failResources?:boolean;failQuizzes?:boolean}={})=>{let posted=false;return async(r:Request)=>{
 if(r.method==="POST"&&r.url.endsWith("/quizzes")){posted=true;return Response.json({},{status:201});}
 if(r.url.endsWith("/resources")){
  if(options.failResources&&posted)return Response.json({},{status:503});
  return Response.json({...resources(material),items:[...resources(material).items,...(options.linked?[linkedQuiz(options.linked)]:[])]});
 }
 if(r.url.endsWith("/quizzes"))return options.failQuizzes?Response.json({},{status:503}):Response.json({items});
 return Response.json(r.url.endsWith("/modules")?{items:[unit]}:course);
};};
test("quiz dialog links the selected quiz, notifies once and closes",async()=>{
 const ui=await mount(view(),quizServer(quizzes(2)),"teacher");
 try{
  const dialog=await openQuizDialog(ui);
  assert.ok(dialog.hasAttribute("open"));
  const submit=Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find(b=>b.textContent==="Enlazar cuestionario")!;
  assert.equal(submit.disabled,true);
  assert.equal(dialog.querySelector("input[type=search]"),null);
  await ui.settle(()=>dialog.querySelectorAll<HTMLInputElement>("input[type=radio]")[1].click());
  assert.equal(submit.disabled,false);
  await ui.settle(()=>submit.click());
  await ui.settle(()=>{});
  const post=ui.requests.find(r=>r.method==="POST"&&r.url.endsWith("/quizzes"))!;
  assert.deepEqual(await post.clone().json(),{quizId:id(201)});
  assert.equal(dialog.hasAttribute("open"),false);
  assert.equal(ui.doc.querySelectorAll(".content-notice").length,1);
  assert.equal(ui.doc.querySelector(".content-notice")!.textContent,"Cuestionario enlazado.");
 }finally{await ui.close();}
});
test("quiz dialog hides linked quizzes, searches long lists and explains an empty list",async()=>{
 const ui=await mount(view(),quizServer(quizzes(9),{linked:id(200)}),"teacher");
 try{
  const dialog=await openQuizDialog(ui);
  const titles=()=>Array.from(dialog.querySelectorAll(".option span")).map(e=>e.textContent);
  assert.equal(titles().length,8);assert.ok(!titles().includes("Cuestionario 1"));
  assert.ok(dialog.querySelector("input[type=search]"),"search appears from 8 quizzes");
 }finally{await ui.close();}
 const empty=await mount(view(),quizServer([]),"teacher");
 try{
  const dialog=await openQuizDialog(empty);
  assert.match(dialog.textContent!,/No hay cuestionarios para enlazar/);
  assert.equal(dialog.querySelector<HTMLAnchorElement>("a")!.getAttribute("href"),`/courses/${course.id}/quizzes`);
  await empty.settle(()=>Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find(b=>b.textContent==="Cerrar")!.click());
  assert.equal(dialog.hasAttribute("open"),false);
 }finally{await empty.close();}
});
test("quiz dialog shows list errors and keeps a stale-list warning open after linking",async()=>{
 const failing=await mount(view(),quizServer([],{failQuizzes:true}),"teacher");
 try{const dialog=await openQuizDialog(failing);assert.ok(dialog.hasAttribute("open"));assert.equal(dialog.querySelector("input[type=radio]"),null);}finally{await failing.close();}
 const ui=await mount(view(),quizServer(quizzes(2),{failResources:true}),"teacher");
 try{
  const dialog=await openQuizDialog(ui);
  await ui.settle(()=>dialog.querySelectorAll<HTMLInputElement>("input[type=radio]")[0].click());
  await ui.settle(()=>Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find(b=>b.textContent==="Enlazar cuestionario")!.click());
  await ui.settle(()=>{});
  assert.ok(dialog.hasAttribute("open"));
  assert.match(dialog.textContent!,/Enlace guardado/);
  assert.equal(ui.doc.querySelector(".content-notice"),null);
 }finally{await ui.close();}
});
type Dom={doc:Document};
const fire=(ui:Dom,el:Element,type:string)=>el.dispatchEvent(new (ui.doc.defaultView as unknown as {Event:typeof Event}).Event(type,{bubbles:true}));
const typeInto=(ui:Dom&{settle:(a:()=>void)=>Promise<void>},el:HTMLInputElement|HTMLTextAreaElement,value:string)=>ui.settle(()=>{el.value=value;fire(ui,el,"input");});
const saveButton=(ui:{doc:Document},form:string)=>Array.from(ui.doc.querySelectorAll<HTMLButtonElement>(form+' button[type="submit"]'))[0];
test("page editor validates on interaction, not on opening, and enables saving only for valid input",async()=>{
 const ui=await mount(view(),async r=>r.method==="POST"?Response.json({...material,id:id(51)},{status:201}):Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
  await ui.click("Unidad 1");await openCreatePage(ui);
  const dialog=ui.doc.querySelector(createForm)!.closest("dialog")!;
  assert.equal(dialog.querySelector(".field-error"),null,"no errors when just opened");
  assert.equal(saveButton(ui,createForm).disabled,true);
  assert.doesNotMatch(dialog.textContent!,/JSON|UTF-8|NUL|Markdown:/);
  const title=dialog.querySelector<HTMLInputElement>('input[name="title"]')!;
  await ui.settle(()=>fire(ui,title,"focusout"));
  assert.equal(dialog.querySelector(".field-error"),null,"leaving a field nobody typed in is not interaction");
  await writeBody(ui,createForm,"<p>contenido escrito antes del título</p>");
  await ui.settle(()=>fire(ui,dialog.querySelector("[contenteditable]")!,"focusout"));
  assert.equal(dialog.querySelector(".field-error"),null,"writing content never validates the title");
  await typeInto(ui,title,"x");await typeInto(ui,title,"");
  assert.equal(dialog.querySelector(".field-error"),null,"still no error until the field is left");
  await ui.settle(()=>fire(ui,title,"focusout"));
  assert.match(dialog.querySelector(".field-error")!.textContent!,/Ingresa un título/);
  await typeInto(ui,title,"Unidad 1");
  assert.equal(dialog.querySelector(".field-error"),null,"error clears as soon as it is fixed");
  assert.equal(saveButton(ui,createForm).disabled,false);
  await writeBody(ui,createForm,"<p> </p>");
  assert.equal(saveButton(ui,createForm).disabled,true,"blank content blocks saving");
  await writeBody(ui,createForm,"<h2>Tema</h2>");
  assert.equal(saveButton(ui,createForm).disabled,false);
  await writeBody(ui,createForm,`<p>${"x".repeat(5000)}</p>`);
  assert.match(dialog.querySelector(".field-error")!.textContent!,/demasiado larga/);
  assert.equal(saveButton(ui,createForm).disabled,true);
  await ui.submit(createForm,{title:"Unidad 1"});
  assert.equal(ui.requests.filter(r=>r.method==="POST"&&!r.url.endsWith("/login")).length,0,"invalid content is never sent");
  await writeBody(ui,createForm,`<p>${"x".repeat(3800)}</p>`);
  assert.match(dialog.textContent!,/Quedan unos \d+ caracteres/);
  assert.equal(saveButton(ui,createForm).disabled,false);
 }finally{await ui.close();}
});
test("editing enables saving only while there are changes and warns only for visible published pages",async()=>{
 for(const published of [false,true]){
  const ui=await mount(view(),r=>Response.json(r.url.endsWith("/resources")?resources({...material,publishedAt:published?"2026-10-31T00:00:00Z":null}):r.url.endsWith("/modules")?{items:[{...unit,publishedAt:"2026-10-31T00:00:00Z"}]}:course),"teacher");
  try{
   await ui.click("Unidad 1");await openEditPage(ui);
   const dialog=ui.doc.querySelector(editForm())!.closest("dialog")!;
   const title=dialog.querySelector<HTMLInputElement>('input[name="title"]')!;
   assert.equal(title.value,material.title);
   assert.equal(/los estudiantes verán los cambios/.test(dialog.textContent!),published);
   assert.equal(saveButton(ui,editForm()).disabled,true);
   await typeInto(ui,title,"Otro título");assert.equal(saveButton(ui,editForm()).disabled,false);
   await typeInto(ui,title,material.title);assert.equal(saveButton(ui,editForm()).disabled,true);
   await typeInto(ui,title,"   ");assert.equal(saveButton(ui,editForm()).disabled,true);
  }finally{await ui.close();}
 }
});
test("pages with advanced formatting open in the text editor, whose toolbar formats the selection and previews it",async()=>{
 const ui=await mount(view(),r=>Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
  await ui.click("Unidad 1");await openEditPage(ui);
  const dialog=ui.doc.querySelector(editForm())!.closest("dialog")! as HTMLDialogElement;
  assert.match(dialog.textContent!,/se edita como texto/);
  assert.equal(dialog.querySelector("[contenteditable]"),null);
  const body=dialog.querySelector<HTMLTextAreaElement>("textarea")!;
  await typeInto(ui,body,"hola mundo");body.setSelectionRange(5,10);
  await ui.settle(()=>dialog.querySelector<HTMLButtonElement>('button[aria-label="Negrita"]')!.click());
  assert.equal(body.value,"hola **mundo**");
  await ui.settle(()=>dialog.querySelector<HTMLButtonElement>('button[aria-label="Título"]')!.click());
  assert.equal(body.value,"# hola **mundo**");
  await ui.settle(()=>Array.from(dialog.querySelectorAll<HTMLButtonElement>(".tab-btn")).find(b=>b.textContent==="Vista previa")!.click());
  assert.ok(dialog.querySelector(".page-editor-preview strong"));
  assert.equal(dialog.querySelector<HTMLButtonElement>('button[aria-label="Negrita"]')!.disabled,true);
 }finally{await ui.close();}
});
const richPage={...material,markdownBody:"# Tema\n\nTexto con **fuerza** y [enlace](https://uc.cl/a).\n\n1. uno\n2. dos\n\n- a\n- b"};
test("simple pages are edited visually: formatting is shown while writing and unchanged pages keep their exact Markdown",async()=>{
 const ui=await mount(view(),r=>Response.json(r.url.endsWith("/resources")?resources(richPage):r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 try{
  await ui.click("Unidad 1");await openEditPage(ui);
  const area=ui.doc.querySelector<HTMLElement>(editForm()+" [contenteditable]")!;
  assert.ok(area.querySelector("h2"));assert.ok(area.querySelector("strong"));assert.ok(area.querySelector("a[href='https://uc.cl/a']"));
  assert.equal(area.querySelectorAll("ol > li").length,2);assert.equal(area.querySelectorAll("ul > li").length,2);
  assert.equal(ui.doc.querySelector(".tab-btn"),null,"no separate preview to switch to");
  assert.equal(savedBody(ui,editForm()),richPage.markdownBody);
  assert.equal(saveButton(ui,editForm()).disabled,true);
  const original=area.innerHTML;
  await writeBody(ui,editForm(),original.replace("<li>uno</li>","<li>uno</li><li>uno y medio</li>"));
  assert.match(savedBody(ui,editForm()),/1\. uno\n2\. uno y medio\n3\. dos/);
  assert.equal(saveButton(ui,editForm()).disabled,false);
  await writeBody(ui,editForm(),original);
  assert.equal(savedBody(ui,editForm()),richPage.markdownBody,"back to the original: stored text untouched");
  assert.equal(saveButton(ui,editForm()).disabled,true);
 }finally{await ui.close();}
});
test("visual editor toolbar sends block, inline and list commands and keeps formatting out of Markdown syntax",async t=>{
 const ui=await mount(view(),r=>Response.json(r.url.endsWith("/resources")?resources(material):r.url.endsWith("/modules")?{items:[unit]}:course),"teacher");
 const commands:unknown[][]=[];
 try{
  Object.defineProperty(ui.doc,"execCommand",{configurable:true,value:(...args:unknown[])=>{commands.push(args);return true;}});
  t.after(()=>{delete (ui.doc as unknown as {execCommand?:unknown}).execCommand;});
  await ui.click("Unidad 1");await openCreatePage(ui);
  const dialog=ui.doc.querySelector(createForm)!.closest("dialog")!;
  const press=(label:string)=>ui.settle(()=>dialog.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click());
  for(const label of ["Título","Subtítulo","Negrita","Cursiva","Lista con viñetas","Lista numerada"])await press(label);
  assert.deepEqual(commands.filter(c=>c[0]!=="defaultParagraphSeparator").map(c=>c.slice(0,3)),[["formatBlock",false,"<h2>"],["formatBlock",false,"<h3>"],["bold"],["italic"],["insertUnorderedList"],["insertOrderedList"]]);
  assert.equal(dialog.querySelector(".tab-btn"),null);
  await writeBody(ui,createForm,'<h2>Título</h2><p>Hola <b>mundo</b>&nbsp;<i>tú</i></p><ul><li>a</li></ul>');
  assert.equal(savedBody(ui,createForm),"# Título\n\nHola **mundo** *tú*\n\n- a");
  await press("Enlace");
  const address=dialog.querySelector<HTMLInputElement>('input[type="url"]')!;
  assert.equal(address.value,"https://");
  await ui.settle(()=>Array.from(dialog.querySelectorAll<HTMLButtonElement>(".rich-link-row button")).find(b=>b.textContent==="Aplicar")!.click());
  assert.ok(true);
 }finally{await ui.close();}
});

