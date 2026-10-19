import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {database,http} from './helpers.mjs';
import {attemptFixture,tokens,request,path,users} from './attempt-fixtures.mjs';
import {createApiClient} from '../../../frontend/src/lib/api/client.ts';
const require=createRequire(import.meta.url),frontendRequire=createRequire(require.resolve('../../../frontend/node_modules/openapi-typescript'));
const coreRequire=createRequire(frontendRequire.resolve('@redocly/openapi-core'));
const yaml=coreRequire('js-yaml'),Ajv=coreRequire('ajv');
const root=new URL('../../../docs/reference/openapi/',import.meta.url);
function validator() {
 const ajv=new Ajv({allErrors:true,strictKeywords:false});
 for(const file of readdirSync(new URL('components/schemas/',root)))if(file.endsWith('.yaml')){
  const url=new URL('components/schemas/'+file,root);ajv.addSchema({...yaml.load(readFileSync(url,'utf8')),$id:url.href},url.href);
 }
 const url=new URL('paths/quizzes.yaml',root),doc=yaml.load(readFileSync(url,'utf8'));
 const schema=doc['/api/v1/institutions/{institutionSlug}/quiz-attempts/{attemptId}'].get.responses['200'].content['application/json'].schema;
 assert.equal(schema.anyOf.length,3);assert.equal(schema.oneOf,undefined);
 return {validate:ajv.compile({...schema,$id:url.href}),ajv,schema,url};
}
test('US1 actual OpenAPI GET anyOf validates all three authorized views, including overlapping empty academic views',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);await f.add(f.s1,users.inactive,'assistant');app=await http();const t=await tokens(app,f),v=validator();
  for(const status of ['in_progress','graded']){
   const quiz=await f.make({published:true}),id=await f.create({quiz,status});
   for(const who of ['student','teacher','assistant']){
    const r=await request(app,t[who],path(id));assert.equal(r.status,200);
    assert.ok(v.validate(r.body),JSON.stringify(v.validate.errors));
    assert.deepEqual(r.body.answers,[]);
    if(who==='student')assert.ok(!('grade' in r.body));
    else {
     assert.ok('grade' in r.body);
     for(const index of [1,2])assert.ok(v.ajv.compile({$id:v.url.href+'?'+index,$ref:new URL(v.schema.anyOf[index].$ref,v.url).href})(r.body));
    }
   }
  }
  const id=await f.create({quiz:await f.make({published:true})}),client=createApiClient({baseUrl:app.base,getToken:()=>t.student});
  const response=await client.GET('/api/v1/institutions/{institutionSlug}/quiz-attempts/{attemptId}',{params:{path:{institutionSlug:'uc',attemptId:id}}});
  assert.equal(response.data.id,id);assert.ok(!('grade' in response.data));
  for(const [body,type,status] of [['{bad','application/json',400],['x','text/plain',415],[JSON.stringify({answers:['x'.repeat(4096)]}),'application/json',413]]){
   const r=await fetch(app.base+'/api/v1/institutions/'+path(id)+'/answers',{method:'PUT',headers:{Authorization:'Bearer '+t.student,'Content-Type':type},body});
   assert.equal(r.status,status);assert.equal(r.headers.get('cache-control'),'no-store');
  }
 }finally{if(app)await app.close();await pool.end();}
});

test('US2 real receipt, corrected GET projections and strict transport/header/body trust boundaries',async()=>{
 const pool=await database();let app;try{
  const f=await attemptFixture(pool);await f.add(f.s1,users.inactive,'assistant');app=await http();const t=await tokens(app,f),v=validator();
  const q=(await pool.query('SELECT questions FROM quizzes WHERE id=$1',[f.quizzes.section])).rows[0].questions[0];
  const id=await f.create({answers:[{questionId:q.id,alternativeId:'a'}]});
  const client=createApiClient({baseUrl:app.base,getToken:()=>t.student});
  const response=await client.POST('/api/v1/institutions/{institutionSlug}/quiz-attempts/{attemptId}/submit',{
   params:{path:{institutionSlug:'uc',attemptId:id},header:{'Idempotency-Key':'receipt'}},
  });
  assert.deepEqual(Object.keys(response.data).sort(),['id','status','submittedAt']);
  assert.deepEqual((await client.POST('/api/v1/institutions/{institutionSlug}/quiz-attempts/{attemptId}/submit',{
   params:{path:{institutionSlug:'uc',attemptId:id},header:{'Idempotency-Key':'receipt'}},
  })).data,response.data);
  for(const who of ['student','teacher','assistant']){
   const r=await request(app,t[who],path(id));assert.ok(v.validate(r.body),JSON.stringify(v.validate.errors));
   assert.equal('isCorrect' in r.body.answers[0],who==='teacher');assert.equal('pointsAwarded' in r.body.answers[0],who==='teacher');
   assert.equal('grade' in r.body,who!=='student');
  }
  for(const [key,body] of [[undefined,undefined],['x'.repeat(201),undefined],['valid',{grade:7}],['valid',null],['valid',[]]])
   assert.equal((await request(app,t.student,path(id)+'/submit','POST',body,key)).status,400);
  const {request:rawRequest}=await import('node:http');
  const status=await new Promise((resolve,reject)=>{
   const r=rawRequest(app.base+'/api/v1/institutions/'+path(id)+'/submit',{method:'POST',headers:['Authorization','Bearer '+t.student,'Idempotency-Key','a','idempotency-key','b']},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});r.on('error',reject);r.end();
  });assert.equal(status,400);
 }finally{if(app)await app.close();await pool.end();}
});
