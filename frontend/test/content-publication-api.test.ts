import assert from "node:assert/strict";
import {test} from "node:test";
import {createApiClient} from "../src/lib/api/client.ts";
import {setModulePublication} from "../src/lib/api/modules.ts";
import {setMaterialPublication} from "../src/lib/api/materials.ts";
import {unit,material,course,timestamp} from "./fixtures/content.ts";
test("publication POST carries no body, validates actual desired state, repeated no-op coherent",async()=>{
 let parent={...unit};let child={...material};const requests:Request[]=[];
 const client=createApiClient({baseUrl:"https://api.test",fetch:async input=>{
 const r=input as Request;requests.push(r.clone());const publishedAt=r.url.endsWith("/unpublish")?null:timestamp;
 if(r.url.includes("/materials/")){child={...child,publishedAt};return Response.json(child);}
 parent={...parent,publishedAt};return Response.json(parent);
 }});
 for(const state of [true,true,false,false]){
 await setMaterialPublication(client,"uc",material.id,unit.id,state);
 await setModulePublication(client,"uc",unit.id,course.id,state);
 }
 await setMaterialPublication(client,"uc",material.id,unit.id,true);await setModulePublication(client,"uc",unit.id,course.id,false);
 assert.equal(parent.publishedAt,null);assert.equal(child.publishedAt,timestamp);assert.equal(child.markdownBody,material.markdownBody);
 for(const r of requests){assert.equal(r.method,"POST");assert.equal(await r.text(),"");assert.equal(r.headers.get("Content-Type"),null);}
 const invalid=createApiClient({baseUrl:"https://api.test",fetch:async()=>Response.json(unit)});
 await assert.rejects(setModulePublication(invalid,"uc",unit.id,course.id,true));
});
