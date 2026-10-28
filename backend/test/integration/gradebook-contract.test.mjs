import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {database,http} from './helpers.mjs';
import {failAudit,restoreAudit} from './course-fixtures.mjs';
import {gradebookFixture,request,tokens,selection,coursePath} from './gradebook-fixtures.mjs';
import {createApiClient} from '../../../frontend/src/lib/api/client.ts';
const require=createRequire(import.meta.url),front=createRequire(require.resolve('../../../frontend/node_modules/openapi-typescript')),core=createRequire(front.resolve('@redocly/openapi-core'));
const yaml=core('js-yaml'),Ajv=core('ajv'),root=new URL('../../../docs/reference/openapi/',import.meta.url);
function validators(){
 const ajv=new Ajv({allErrors:true,strictKeywords:false,multipleOfPrecision:8});
 for(const file of readdirSync(new URL('components/schemas/',root)))if(file.endsWith('.yaml')){const url=new URL('components/schemas/'+file,root);ajv.addSchema({...yaml.load(readFileSync(url,'utf8')),$id:url.href},url.href);}
 return {schema:(name)=>ajv.compile({$ref:new URL('components/schemas/grades.yaml#/'+name,root).href}),problem:ajv.compile({$ref:new URL('components/schemas/common.yaml#/Problem',root).href})};
}
test('US1/US2 actual HTTP and generated consumer match OpenAPI success/error contracts',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool);app=await http();const t=await tokens(app,f),path=coursePath(f),v=validators();assert.equal(v.schema('GradeValue')(6.15),false);assert.equal(v.schema('GradeWeightInput')({gradeItemId:f.items.section,weightPercent:33.333}),false);
 for(const [endpoint,name,who] of [['/grade-items','GradeItemListResponse','teacher'],['/gradebook','GradebookResponse','owner'],['/my-grades','StudentGradesResponse','student']]){
  const result=await request(app,t[who],path+endpoint);assert.equal(result.status,200);const validate=v.schema(name);assert.ok(validate(result.body),JSON.stringify(validate.errors));
 }
 const input={items:(await request(app,t.owner,path+'/grade-items')).body.items.map(i=>({gradeItemId:i.id,weightPercent:i.weightPercent}))};
 for(const [token,endpoint,method,body,key,status] of [
  [t.assistant,path+'/gradebook/publications','POST',selection(f),'forbidden',403],
  [t.owner,`utfsm/courses/${f.own}/gradebook/publications`,'POST',selection(f),'hidden',404],
  [t.owner,path+'/gradebook/weights','PUT',{items:input.items.slice(1)},undefined,422],
 ]){const r=await request(app,token,endpoint,method,body,key);assert.equal(r.status,status);assert.ok(v.problem(r.body),JSON.stringify(v.problem.errors));}
 const unauth=await fetch(app.base+'/api/v1/institution/'+path+'/grade-items');assert.equal(unauth.status,401);assert.ok(v.problem(await unauth.json()));
 await failAudit(pool,'gradebook.weightsUpdated');
 try{const r=await request(app,t.owner,path+'/gradebook/weights','PUT',{items:input.items.map((i,n)=>({...i,weightPercent:n===0?100:0}))});assert.equal(r.status,500);assert.ok(v.problem(r.body));}finally{await restoreAudit(pool);}
 await pool.query('ALTER TABLE users RENAME COLUMN active TO unavailable_active');
 try{const r=await request(app,t.owner,path+'/grade-items');assert.equal(r.status,503);assert.ok(v.problem(r.body));}finally{await pool.query('ALTER TABLE users RENAME COLUMN unavailable_active TO active');}
 const weights=await request(app,t.owner,path+'/gradebook/weights','PUT',input);assert.ok(v.schema('GradebookWeightsResponse')(weights.body));
 const client=createApiClient({baseUrl:app.base,getToken:()=>t.owner}),params={path:{institutionSlug:'uc',courseId:f.own},header:{'Idempotency-Key':'contract'}};
 const receipt=await client.POST('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/publications',{params,body:selection(f)});assert.ok(v.schema('PublishGradesResponse')(receipt.data));
 assert.deepEqual((await client.POST('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/publications',{params,body:selection(f)})).data,receipt.data);
 const own=await request(app,t.student,path+'/my-grades');assert.ok(v.schema('StudentGradesResponse')(own.body));
 for(const [body,key,status] of [[selection(f),undefined,400],[{...selection(f),studentIds:[]},'bad',400],[{...selection(f),gradeItemIds:['invalid']},'bad',400],[selection(f),'different',409]]){
  const r=await request(app,t.owner,path+'/gradebook/publications','POST',body,key);assert.equal(r.status,status);assert.match(r.headers.get('content-type'),/application\/problem\+json/);assert.ok(v.problem(r.body),JSON.stringify(v.problem.errors));
 }
 const raw=await fetch(app.base+'/api/v1/institution/'+path+'/gradebook/weights',{method:'PUT',headers:{Authorization:'Bearer '+t.owner,'Content-Type':'text/plain'},body:'x'});assert.equal(raw.status,415);
 assert.equal((await request(app,t.owner,path+'/gradebook?unknown=true')).status,400);
 }finally{if(app)await app.close();await pool.end();}
});
