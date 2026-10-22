import assert from "node:assert/strict";
import {test} from "node:test";
import {createApiClient} from "../src/lib/api/client.ts";
import {createCourseModule,updateCourseModule,reorderCourseModules} from "../src/lib/api/modules.ts";
import {createMarkdownMaterial,updateMaterial} from "../src/lib/api/materials.ts";
import {unit,material,course,id,timestamp} from "./fixtures/content.ts";
test("writes serialize only editable fields; create drafts, edit preserves publication, reorder all IDs",async()=>{
 const requests:Request[]=[];
 const client=createApiClient({baseUrl:"https://api.test",fetch:async input=>{const r=input as Request;requests.push(r.clone());const b=await r.json();return Response.json(r.method==="PUT"?{items:[{...unit,position:1}]}:r.url.includes("/materials")?{...material,...b,publishedAt:r.method==="PATCH"?timestamp:null}:{...unit,...b,publishedAt:r.method==="PATCH"?timestamp:null});}});
 await createCourseModule(client,"uc",course.id,{title:"  Nuevo  ",position:4});
 await updateCourseModule(client,"uc",unit.id,course.id,{title:" Editado "});
 await reorderCourseModules(client,"uc",course.id,[unit.id],[unit]);
 await createMarkdownMaterial(client,"uc",unit.id,{title:" Lectura ",markdownBody:"  texto  "});
 await updateMaterial(client,"uc",material.id,unit.id,{markdownBody:"  cambio  "});
 assert.deepEqual(await requests[0].json(),{title:"Nuevo",position:4});assert.deepEqual(await requests[1].json(),{title:"Editado"});assert.deepEqual(await requests[2].json(),{moduleIds:[unit.id]});assert.deepEqual(await requests[3].json(),{title:"Lectura",markdownBody:"  texto  "});assert.deepEqual(await requests[4].json(),{markdownBody:"  cambio  "});
 const count=requests.length;
 for(const ids of [[unit.id,unit.id],[],[id(99)]])await assert.rejects(reorderCourseModules(client,"uc",course.id,ids,[unit]));
 for(const pos of [0,2147483648])await assert.rejects(createCourseModule(client,"uc",course.id,{title:"x",position:pos}));
 await assert.rejects(updateMaterial(client,"uc",material.id,unit.id,{}));
 await assert.rejects(createMarkdownMaterial(client,"uc",unit.id,{title:"x",markdownBody:"é".repeat(3000)}));
 assert.equal(requests.length,count);
});
test("write rejection 400/409/413/415/422/403 never retries; server can reject concurrent ordering",async()=>{
 for(const status of [400,409,413,415,422,403]){
 let count=0;const client=createApiClient({baseUrl:"https://api.test",fetch:async()=>{count++;return Response.json({},{status});}});
 for(const op of [()=>createCourseModule(client,"uc",course.id,{title:"x",position:4}),()=>updateCourseModule(client,"uc",unit.id,course.id,{title:"x"}),()=>reorderCourseModules(client,"uc",course.id,[unit.id],[unit]),()=>createMarkdownMaterial(client,"uc",unit.id,{title:"x",markdownBody:"y"}),()=>updateMaterial(client,"uc",material.id,unit.id,{title:"x"})])await assert.rejects(op);
 assert.equal(count,5);
 }
});
