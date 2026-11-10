import assert from "node:assert/strict";
import {test} from "node:test";
import {markdownEdit,requestBytes,REQUEST_LIMIT_BYTES,type EditAction} from "../src/lib/content/markdown-edit.ts";
import {pageChanged,pageErrors,pagePayload,pageRoom} from "../src/lib/content/page-validation.ts";

const apply=(value:string,start:number,end:number,action:EditAction)=>{const e=markdownEdit(value,start,end,action);return {text:value.slice(0,e.from)+e.insert+value.slice(e.to),selected:(value.slice(0,e.from)+e.insert+value.slice(e.to)).slice(e.start,e.end)};};

test("inline formatting wraps, unwraps and uses a placeholder without selection",()=>{
 assert.deepEqual(apply("hola mundo",5,10,"bold"),{text:"hola **mundo**",selected:"mundo"});
 assert.deepEqual(apply("hola **mundo**",7,12,"bold"),{text:"hola mundo",selected:"mundo"});
 assert.deepEqual(apply("",0,0,"italic"),{text:"*texto*",selected:"texto"});
 assert.deepEqual(apply("*uno*",1,4,"italic"),{text:"uno",selected:"uno"});
 assert.equal(apply("**uno**",2,5,"italic").text,"***uno***");
});
test("headings and lists work per line, toggle and replace each other",()=>{
 assert.equal(apply("Intro",0,0,"h2").text,"# Intro");
 assert.equal(apply("# Intro",0,0,"h2").text,"Intro");
 assert.equal(apply("# Intro",0,0,"h3").text,"## Intro");
 assert.equal(apply("",0,0,"h2").text,"# ");
 assert.equal(apply("uno\ndos",0,7,"ul").text,"- uno\n- dos");
 assert.equal(apply("- uno\n- dos",0,11,"ul").text,"uno\ndos");
 assert.equal(apply("- uno\n- dos",0,11,"ol").text,"1. uno\n2. dos");
 assert.equal(apply("a\nb\nc",2,3,"ul").text,"a\n- b\nc");
 assert.equal(apply("",0,0,"ol").text,"1. ");
});
test("links keep a selection or an address and point the caret at what is missing",()=>{
 assert.deepEqual(apply("ver guía",4,8,"link"),{text:"ver [guía](https://)",selected:"https://"});
 assert.deepEqual(apply("https://uc.cl",0,13,"link"),{text:"[texto](https://uc.cl)",selected:"texto"});
 assert.deepEqual(apply("",0,0,"link"),{text:"[texto](https://)",selected:"https://"});
});
test("request size counts the whole JSON in UTF-8 bytes, not characters",()=>{
 assert.equal(requestBytes({title:"a",markdownBody:"b"}),new TextEncoder().encode('{"title":"a","markdownBody":"b"}').length);
 assert.ok(requestBytes({markdownBody:"ñ".repeat(100)})>requestBytes({markdownBody:"n".repeat(100)}));
 assert.ok(requestBytes({markdownBody:"a\n".repeat(10)})>requestBytes({markdownBody:"a ".repeat(10)}));
});
test("page validation mirrors the stored contract and the effective write limit",()=>{
 const ok={title:"Unidad",markdownBody:"# Tema"};
 assert.deepEqual(pageErrors(ok),{});
 assert.match(pageErrors({title:" ",markdownBody:"x"}).title!,/título/);
 assert.match(pageErrors({title:"x".repeat(201),markdownBody:"x"}).title!,/200/);
 assert.match(pageErrors({title:"a\0",markdownBody:"x"}).title!,/no válido/);
 assert.match(pageErrors({title:"a",markdownBody:"  \n"}).markdownBody!,/contenido/);
 assert.match(pageErrors({title:"a",markdownBody:"a\0"}).markdownBody!,/no válido/);
 assert.match(pageErrors({title:"a",markdownBody:"x".repeat(10001)}).markdownBody!,/10 000/);
 const long={title:"a",markdownBody:"x".repeat(REQUEST_LIMIT_BYTES)};
 assert.match(pageErrors(long).markdownBody!,/demasiado larga/);
 assert.ok(pageRoom(long)<0);
 assert.doesNotMatch(JSON.stringify(pageErrors(long)),/JSON|UTF|bytes/i);
 assert.deepEqual(pageErrors({title:"a",markdownBody:"x".repeat(3900)}),{});
});
test("editing only counts and sends what changed",()=>{
 const saved={title:"Lectura",markdownBody:"x".repeat(5000)};
 assert.deepEqual(pagePayload({title:" Nuevo ",markdownBody:saved.markdownBody},saved),{title:"Nuevo"});
 assert.deepEqual(pageErrors({title:"Nuevo",markdownBody:saved.markdownBody},saved),{});
 assert.equal(pageChanged(saved,saved),false);
 assert.equal(pageChanged({...saved,title:"Lectura "},saved),false);
 assert.equal(pageChanged({...saved,markdownBody:"y"},saved),true);
 assert.equal(pageChanged({title:"",markdownBody:""}),true);
});
