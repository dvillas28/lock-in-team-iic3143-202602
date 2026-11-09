import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement as h} from "react";
import {AcademicFileReader} from "../src/components/content/academic-file-reader.tsx";
import {PdfPreview} from "../src/components/content/pdf-preview.tsx";
import {ModulesPanel} from "../src/components/content/modules-panel.tsx";
import {checkSelectedFile, fileDto, moduleResources, type AcademicFile} from "../src/lib/content/academic-files.ts";
import {mount} from "./fixtures/course-ui.ts";
import {course,id,material,resources,timestamp,unit} from "./fixtures/content.ts";

const source="<img src=x onerror=alert(1)>";
const file:AcademicFile={
 id:id(52),moduleId:unit.id,kind:"file",title:"Apuntes",fileName:"Apuntes.txt",mediaType:"text/plain",
 preview:"text",byteSize:Buffer.byteLength(source),position:2,createdBy:id(1),publishedAt:timestamp,
};
const route={courseId:course.id,moduleId:unit.id,fileId:file.id};
const limits=resources().limits;

test("academic resource responses reject foreign identifiers and malformed metadata",()=>{
 assert.deepEqual(fileDto(file,unit.id,file.id),file);
 for(const changes of [
  {id:id(99)},{id:""},{moduleId:id(99)},{kind:"markdown"},{createdBy:""},{title:5},{title:" "},
  {title:"a".repeat(201)},{position:"1"},{position:1.5},{position:0},{publishedAt:1},
  {publishedAt:"yesterday"},{byteSize:0},{byteSize:1.5},{byteSize:"2"},{byteSize:limits.zip+1},
  {fileName:null},{fileName:""},{fileName:"a".repeat(241)},{mediaType:5},{preview:"iframe"},
 ]) assert.throws(()=>fileDto({...file,...changes},unit.id,file.id));
 for(const value of [null,{}, {limits:{}},{limits,items:[file,file]},{limits,items:[{...file,kind:"quiz"}]}]){
  assert.throws(()=>moduleResources(value,unit.id));
 }
 assert.deepEqual(moduleResources({limits,items:[file,...resources(material).items]},unit.id).items.map(x=>x.id),[material.id,file.id]);
});

test("upload selection checks category limits, empty files and unsupported extensions",()=>{
 const small={document:2,image:3,zip:4};
 for(const [name,size] of [["FILE.PDF",2],["photo.PNG",3],["archive.zip",4]] as const){
  assert.equal(checkSelectedFile(new File([new Uint8Array(size)],name),small),undefined);
  assert.match(checkSelectedFile(new File([new Uint8Array(size+1)],name),small)!,/admite hasta/);
 }
 assert.match(checkSelectedFile(new File([],"empty.txt"),small)!,/vacío/);
 assert.match(checkSelectedFile(new File(["x"],"no-extension"),small)!,/formato admitido/);
});

test("file reader retries preview, shows text inert and uses a separate authorized download",async()=>{
 let previews=0,downloads=0;
 const ui=await mount(h(AcademicFileReader,route),r=>{
  if(r.url.endsWith("/preview")){
   previews++;
   return previews===1?Response.json({},{status:503}):new Response(source);
  }
  if(r.url.endsWith("/download")){
   downloads++;
   return Response.json({},{status:503});
  }
  return Response.json(r.url.endsWith("/file")?file:unit);
 },"student");
 try{
  await ui.click("Reintentar");
  assert.equal(ui.doc.querySelector("pre")?.textContent,source);
  assert.equal(ui.doc.querySelector("img"),null);
  assert.ok(ui.doc.querySelector(`a[href$="/modules#module-${unit.id}"]`));
  await ui.click("Descargar archivo");
  assert.equal(downloads,1);
  assert.ok(ui.doc.querySelector('[role="alert"]'));
  assert.equal(previews,2);
 }finally{await ui.close();}
});

test("file reader offers download-only for unsupported formats and hides rejected metadata",async()=>{
 for(const visible of [true,false]){
  const ui=await mount(h(AcademicFileReader,route),r=>r.url.endsWith("/file")
   ?Response.json({...file,preview:null},{status:visible?200:404}):Response.json(unit),"assistant");
  try{
   assert.equal(!!ui.doc.querySelector(".file-reader-heading"),visible);
   assert.equal(ui.doc.body.textContent!.includes("después de descargar"),visible);
   assert.equal(ui.requests.some(r=>r.url.endsWith("/preview")),false);
  }finally{await ui.close();}
 }
});

test("PDF viewer offers a download fallback when opening fails",async(t)=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,"ResizeObserver");
 Object.defineProperty(globalThis,"ResizeObserver",{configurable:true,value:class {
  observe(){}
  disconnect(){}
 }});
 try{
  const blob=new Blob();
  t.mock.method(blob,"arrayBuffer",async()=>{throw new Error("unreadable");});
  const ui=await mount(h(PdfPreview,{file:blob}),()=>Response.json({}),"student");
  try{assert.match(ui.doc.querySelector('[role="alert"]')?.textContent??"",/No se pudo abrir este PDF/);}
  finally{await ui.close();}
 }finally{
  if(old)Object.defineProperty(globalThis,"ResizeObserver",old);
  else Reflect.deleteProperty(globalThis,"ResizeObserver");
 }
});

test("teacher can reorder, rename and remove an independent module file",async()=>{
 let current:AcademicFile|undefined=file;
 const quiz={id:id(53),moduleId:unit.id,kind:"quiz",title:"Quiz",position:3,publishedAt:timestamp,quizId:id(54),canUnlink:true};
 const ui=await mount(h(ModulesPanel,{courseId:course.id}),async r=>{
  if(r.method==="PATCH" && r.url.endsWith("/file")){
   const body=await r.json() as {title:string};
   current={...file,title:body.title};
   return Response.json(current);
  }
  if(r.method==="DELETE" && r.url.endsWith("/file")){current=undefined;return new Response(null,{status:204});}
  if(r.method==="PUT" && r.url.endsWith("/resources/order"))return new Response(null,{status:204});
  if(r.url.endsWith("/resources"))return Response.json({limits,items:[...resources(material).items,...(current?[current]:[]),quiz]});
  if(r.url.endsWith("/modules"))return Response.json({items:[unit]});
  return Response.json(course);
 },"teacher");
 try{
  await ui.click(unit.title);
  assert.ok(ui.doc.querySelector(`a[href$="/files/${file.id}"]`));
  assert.ok(ui.doc.querySelector(`a[href$="/quizzes/${quiz.quizId}"]`));
  await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>('[aria-label="Subir recurso Apuntes"]')!.click());
  assert.ok(ui.requests.some(r=>r.method==="PUT"&&r.url.endsWith("/resources/order")));
  await ui.submit(".file-rename",{title:"Apuntes corregidos"});
  assert.equal(ui.doc.querySelector(`a[href$="/files/${file.id}"]`)?.textContent,"Apuntes corregidos");
  await ui.click("Eliminar archivo");
  assert.ok(ui.doc.querySelector("dialog[open]"));
  await ui.settle(()=>ui.doc.querySelector<HTMLButtonElement>("dialog .btn-danger")!.click());
  assert.equal(ui.doc.querySelector(`a[href$="/files/${file.id}"]`),null);
 }finally{await ui.close();}
});

test("upload transport reports progress, forwards auth and rejects aborted or redirected requests",async(t)=>{
 const {uploadTransport}=await import("../src/lib/api/academic-files.ts");
 class FakeUpload {
  static last:FakeUpload;
  upload:{onprogress?:(event:{lengthComputable:boolean;loaded:number;total:number})=>void}={};
  onloadend?:()=>void;
  responseURL="";
  status=200;
  response=new TextEncoder().encode("saved").buffer;
  responseType="";
  headers=new Headers();
  sent?:FormData;
  constructor(){FakeUpload.last=this;}
  open(_method:string,url:string){this.responseURL=url;}
  setRequestHeader(name:string,value:string){this.headers.set(name,value);}
  getAllResponseHeaders(){return "X-Upload: saved\r\ninvalid";}
  send(form:FormData){this.sent=form;}
  abort(){this.status=0;this.onloadend?.();}
 }
 const old=Object.getOwnPropertyDescriptor(globalThis,"XMLHttpRequest");
 Object.defineProperty(globalThis,"XMLHttpRequest",{configurable:true,value:FakeUpload});
 t.after(()=>{
  if(old)Object.defineProperty(globalThis,"XMLHttpRequest",old);
  else Reflect.deleteProperty(globalThis,"XMLHttpRequest");
 });
 const form=new FormData();
 const progress:number[]=[];
 const transport=uploadTransport(form,value=>progress.push(value));
 const url="https://api.test/upload";
 const request=new Request(url,{method:"POST",headers:{Authorization:"Bearer synthetic","Content-Type":"ignored"}});
 const response=transport.fetch(request);
 const xhr=FakeUpload.last;
 assert.equal(xhr.headers.get("Authorization"),"Bearer synthetic");
 assert.equal(xhr.headers.get("Content-Type"),null);
 assert.equal(xhr.sent,form);
 xhr.upload.onprogress?.({lengthComputable:false,loaded:1,total:0});
 xhr.upload.onprogress?.({lengthComputable:true,loaded:1,total:4});
 xhr.onloadend?.();
 assert.deepEqual(progress,[25]);
 const result=await response;
 assert.equal(result.headers.get("X-Upload"),"saved");
 assert.equal(await result.text(),"saved");
 const controller=new AbortController();
 const cancelled=new Request(url,{signal:controller.signal});
 const inFlight=transport.fetch(cancelled);
 controller.abort();
 await assert.rejects(inFlight,{name:"AbortError"});
 await assert.rejects(transport.fetch(cancelled),{name:"AbortError"});
 const redirected=transport.fetch(request);
 FakeUpload.last.responseURL="https://api.test/other";
 FakeUpload.last.onloadend?.();
 await assert.rejects(redirected,/Upload transport failed/);
});

test("authorized image preview and download use separate responses and revoke object URLs",async(t)=>{
 const objectURL=t.mock.method(URL,"createObjectURL",()=>"blob:academic-test");
 const revoke=t.mock.method(URL,"revokeObjectURL",()=>{});
 const previous=Object.getOwnPropertyDescriptor(globalThis,"Image");
 const image={...file,fileName:"Diagrama.png",mediaType:"image/png",preview:"image" as const,byteSize:3};
 Object.defineProperty(globalThis,"Image",{configurable:true,value:class {
  naturalWidth=80;
  naturalHeight=60;
  async decode(){}
 }});
 let ui:Awaited<ReturnType<typeof mount>>|undefined;
 try{
  ui=await mount(h(AcademicFileReader,route),r=>{
   if(/\/(?:preview|download)$/.test(r.url))return new Response("png",{headers:{"Content-Type":image.mediaType}});
   return Response.json(r.url.endsWith("/file")?image:unit);
  },"assistant");
  assert.equal(ui.doc.querySelector("img")?.getAttribute("alt"),image.title);
  assert.equal(ui.doc.querySelector("img")?.getAttribute("width"),"80");
  const click=t.mock.method(ui.dom.window.HTMLAnchorElement.prototype,"click",function(this:HTMLAnchorElement){
   assert.equal(this.download,image.fileName);
  });
  t.mock.method(ui.dom.window,"setTimeout",(callback:()=>void,delay:number)=>{
   assert.equal(delay,30_000);
   callback();
   return 0;
  });
  await ui.click("Descargar archivo");
  assert.equal(click.mock.callCount(),1);
  assert.equal(objectURL.mock.callCount(),2);
 }finally{
  await ui?.close();
  if(previous)Object.defineProperty(globalThis,"Image",previous);
  else Reflect.deleteProperty(globalThis,"Image");
 }
 assert.equal(revoke.mock.callCount(),2);
});
