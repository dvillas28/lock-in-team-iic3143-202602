import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {contentFixture,tokens,request,users,hostile} from './content-fixtures.mjs';
test('US1 markdown: server actor, shared editing, independent publication, validation and no-op',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),path=`uc/modules/${f.modules[0]}/materials`;
  const created=await request(app,t.teacher,path,'POST',{title:' Source ',markdownBody:hostile});assert.equal(created.status,201);const id=created.body.id,detail=`uc/materials/${id}`;
  assert.equal(created.body.createdBy,users.other);assert.equal(created.body.kind,'markdown');assert.equal(created.body.publishedAt,null);
  assert.equal(created.headers.get('location'),`/api/v1/institution/uc/materials/${id}`);
  assert.equal((await request(app,t.owner,detail,'PATCH',{title:'Edited',markdownBody:'new '+hostile})).status,200);
  const published=await request(app,t.teacher,detail+'/publish','POST');assert.equal(published.status,200);assert.ok(published.body.publishedAt);
  const count=(await pool.query('SELECT * FROM audit_events')).rowCount;
  assert.deepEqual((await request(app,t.teacher,detail+'/publish','POST')).body,published.body);
  await request(app,t.teacher,detail,'PATCH',{title:'Edited'});assert.equal((await pool.query('SELECT * FROM audit_events')).rowCount,count);
  const edited=await request(app,t.teacher,detail,'PATCH',{markdownBody:hostile});assert.equal(edited.body.publishedAt,published.body.publishedAt);assert.equal(edited.body.createdBy,users.other);
  await request(app,t.teacher,`uc/modules/${f.modules[0]}/publish`,'POST');await request(app,t.teacher,`uc/modules/${f.modules[0]}/unpublish`,'POST');
  assert.equal((await request(app,t.teacher,detail)).body.publishedAt,published.body.publishedAt);
  assert.equal((await request(app,t.student,detail)).status,404);
  assert.equal((await request(app,t.teacher,detail+'/unpublish','POST')).body.publishedAt,null);
  for(const extra of ['kind','createdBy','moduleId','institutionId','publishedAt','role','experience'])assert.equal((await request(app,t.teacher,path,'POST',{title:'x',markdownBody:'x',[extra]:'bad'})).status,400);
  for(const [body,status] of [[{},400],[{title:null},400],[{markdownBody:42},400],[{markdownBody:' \u2003'},422],[{markdownBody:'a\0b'},422],[{title:'x'.repeat(201)},422]])assert.equal((await request(app,t.teacher,detail,'PATCH',body)).status,status);
  for(const role of ['student','assistant','admin'])assert.equal((await request(app,t[role],detail,'PATCH',{title:'x'})).status,404);
  assert.equal((await request(app,t.teacher,`utfsm/materials/${id}`)).status,404);
  const hidden=(await request(app,t.teacher,detail)).body;
  await request(app,t.teacher,detail+'/unpublish','POST');assert.deepEqual((await request(app,t.teacher,detail)).body,hidden);
  assert.equal((await request(app,t.teacher,detail+'/publish','POST',null)).status,400);
 }finally{if(app)await app.close();await pool.end();}
});
