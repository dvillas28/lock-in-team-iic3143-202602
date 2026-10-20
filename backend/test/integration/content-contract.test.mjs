import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http,sanitized} from './helpers.mjs';
import {contentFixture,tokens,request,hostile} from './content-fixtures.mjs';
import {createApiClient} from '../../../frontend/src/lib/api/client.ts';
test('US2 real generated consumer: lists/details, 401/404, inert JSON, no-store/nosniff and no binary routes',async()=>{
 const pool=await database();let app;const credentials=[];try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f);credentials.push(...Object.values(t));
  let calls=0;
  const client=createApiClient({baseUrl:app.base,getToken:()=>t.student,fetch:async input=>{
   calls++;assert.equal(input.cache,'no-store');assert.equal(input.redirect,'error');
   const response=await fetch(input);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   assert.match(response.headers.get('content-type'),/^application\/(json|problem\+json)/);return response;
  }});
  const modules=await client.GET('/api/v1/institutions/{institutionSlug}/courses/{courseId}/modules',{params:{path:{institutionSlug:'uc',courseId:f.own}}});assert.deepEqual(modules.data.items.map(m=>m.id),f.modules.slice(2));
  const module=await client.GET('/api/v1/institutions/{institutionSlug}/modules/{moduleId}',{params:{path:{institutionSlug:'uc',moduleId:f.modules[3]}}});assert.equal(module.data.id,f.modules[3]);
  const list=await client.GET('/api/v1/institutions/{institutionSlug}/modules/{moduleId}/materials',{params:{path:{institutionSlug:'uc',moduleId:f.modules[3]}}});assert.deepEqual(list.data.items.map(m=>m.id),[f.materials[3]]);
  const item=await client.GET('/api/v1/institutions/{institutionSlug}/materials/{materialId}',{params:{path:{institutionSlug:'uc',materialId:f.materials[3]}}});assert.equal(item.data.markdownBody,hostile);assert.equal(item.data.kind,'markdown');assert.equal(calls,4,'consumer only requests explicit JSON endpoints');
  for(const [token,id,status] of [[undefined,f.materials[3],401],[t.student,f.materials[0],404]]) {
   const consumer=createApiClient({baseUrl:app.base,getToken:()=>token});
   await assert.rejects(consumer.GET('/api/v1/institutions/{institutionSlug}/materials/{materialId}',{params:{path:{institutionSlug:'uc',materialId:id}}}),error=>{assert.equal(error.status,status);assert.equal(error.problem.status,status);assert.ok(!JSON.stringify(error.problem).includes(hostile));return true;});
  }
  for(const path of [`uc/materials/${f.materials[3]}/content`,`uc/modules/${f.modules[3]}/materials/files`])assert.equal((await request(app,t.teacher,path)).status,404);
  const path=`/api/v1/institutions/uc/materials/${f.materials[3]}`;
  for(const [body,type,status] of [[JSON.stringify({markdownBody:'x'.repeat(4096)}),'application/json',413],['{bad','application/json',400],['bad','text/plain',415]]) {
   const response=await fetch(app.base+path,{method:'PATCH',headers:{Authorization:`Bearer ${t.teacher}`,'Content-Type':type},body});
   assert.equal(response.status,status);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('content-type'),/^application\/problem\+json/);
  }
  assert.equal((await request(app,t.student,'uc/modules/bad')).status,400);
 }finally{if(app)sanitized((await app.close()).output,credentials);await pool.end();}
});
