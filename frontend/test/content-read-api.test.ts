import assert from "node:assert/strict";
import {test} from "node:test";
import {createApiClient} from "../src/lib/api/client.ts";
import {listCourseModules,getCourseModule} from "../src/lib/api/modules.ts";
import {listModuleMaterials,getMaterial} from "../src/lib/api/materials.ts";
import {unit,material,course,id} from "./fixtures/content.ts";
test("reads scope every path and validate DTO parents/identities",async()=>{
 for(const slug of ["uc","utfsm"]) {
 const requests:Request[]=[];const client=createApiClient({baseUrl:"https://api.test",getToken:()=>"token",fetch:async input=>{const r=input as Request;requests.push(r);return Response.json(r.url.endsWith("/modules")?{items:[unit]}:r.url.endsWith("/materials")?{items:[material]}:r.url.includes("/materials/")?material:unit);}});
 await listCourseModules(client,slug,course.id);await getCourseModule(client,slug,unit.id,course.id);
 await listModuleMaterials(client,slug,unit.id);await getMaterial(client,slug,material.id,unit.id);
 assert.equal(requests.length,4);assert.ok(requests.every(r=>r.url.includes("/institution/"+slug+"/")&&r.cache==="no-store"&&r.headers.get("Authorization")==="Bearer token"));
 await assert.rejects(getCourseModule(client,slug,unit.id,id(11)));await assert.rejects(getMaterial(client,slug,material.id,id(41)));
 await assert.rejects(getMaterial(client,slug,"bad",unit.id));
 }
});
test("401/403/404/503 are failures, malformed list never becomes empty",async()=>{
 for(const status of [401,403,404,503]) {
 const client=createApiClient({baseUrl:"https://api.test",fetch:async()=>Response.json({},{status})});
 for(const read of [()=>listCourseModules(client,"uc",course.id),()=>getCourseModule(client,"uc",unit.id,course.id),()=>listModuleMaterials(client,"uc",unit.id),()=>getMaterial(client,"uc",material.id,unit.id)]) await assert.rejects(read);
 }
 const client=createApiClient({baseUrl:"https://api.test",fetch:async()=>Response.json({items:[{...unit,courseId:id(11)}]})});
 await assert.rejects(listCourseModules(client,"uc",course.id));
});
