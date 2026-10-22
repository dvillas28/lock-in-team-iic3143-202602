import assert from "node:assert/strict";
import {test} from "node:test";
import {moduleDto, materialDto, moduleList, markdown, jsonBody, nextPosition, title} from "../src/lib/content/validation.ts";
import {unit,material,course,id} from "./fixtures/content.ts";
test("DTO boundary rejects wrong parents, identities, dates, positions and duplicates",()=>{
 assert.deepEqual(moduleDto(unit,course.id,unit.id),unit);
 assert.deepEqual(materialDto(material,unit.id,material.id),material);
 for(const bad of [{...unit,id:"bad"},{...unit,courseId:id(11)},{...unit,position:0},{...unit,position:2147483648},{...unit,publishedAt:"bad"},{...unit,title:" x "}]) assert.throws(()=>moduleDto(bad,course.id));
 for(const bad of [{...material,moduleId:id(41)},{...material,kind:"html"},{...material,markdownBody:" "},{...material,createdBy:"bad"}])assert.throws(()=>materialDto(bad,unit.id));
 assert.throws(()=>moduleList({items:[unit,unit]},course.id));
 assert.throws(()=>moduleList({items:[unit,{...unit,id:id(42)}]},course.id));
 assert.throws(()=>moduleList({},course.id));
});
test("Unicode, NUL and exact serialized UTF-8 budget including escapes/metadata",()=>{
 assert.equal(title("  😀  "),"😀");assert.equal(title("😀".repeat(200)),"😀".repeat(200));
 for(const v of ["", " ", "x\0","😀".repeat(201)]) assert.throws(()=>title(v));
 assert.equal(markdown("  a\n "),"  a\n "); assert.equal(markdown("😀".repeat(10000)).length,20000);
 for(const v of [" ","x\0","😀".repeat(10001)]) assert.throws(()=>markdown(v));
 for(const prefix of ["é","\n","\"","\\"]) {
 const body={title:"😀",markdownBody:prefix};const n=4096-Buffer.byteLength(JSON.stringify(body));
 const exact={...body,markdownBody:prefix+"x".repeat(n)};
 assert.equal(Buffer.byteLength(JSON.stringify(exact)),4096);assert.deepEqual(jsonBody(exact),exact);
 assert.throws(()=>jsonBody({...exact,markdownBody:exact.markdownBody+"x"}));
 }
 assert.equal(nextPosition([]),1); assert.equal(nextPosition([unit,{...unit,position:9}]),10);
 assert.throws(()=>nextPosition([{...unit,position:2147483647}]));
});
