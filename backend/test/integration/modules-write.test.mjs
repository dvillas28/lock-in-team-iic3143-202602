import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {contentFixture,tokens,request} from './content-fixtures.mjs';
test('US1 modules: teacher in either section, complete order, role/tenant negatives and no-op',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool);app=await http();const t=await tokens(app,f),path=`uc/courses/${f.own}/modules`;
  assert.deepEqual((await request(app,t.teacher,path+'/order','PUT',{moduleIds:[]})).body,{items:[]});
  const one=await request(app,t.teacher,path,'POST',{title:' One ',position:4});assert.equal(one.status,201);assert.equal(one.body.title,'One');assert.equal(one.body.publishedAt,null);
  assert.equal(one.headers.get('location'),`/api/v1/institution/uc/modules/${one.body.id}`);
  const two=await request(app,t.owner,path,'POST',{title:'Two',position:2});assert.equal(two.status,201);
  const id=one.body.id,detail=`uc/modules/${id}`;
  assert.equal((await request(app,t.owner,detail)).body.id,id);
  assert.equal((await request(app,t.teacher,detail,'PATCH',{title:'Renamed'})).status,200);
  const ordered=await request(app,t.teacher,path+'/order','PUT',{moduleIds:[id,two.body.id]});assert.equal(ordered.status,200);assert.deepEqual(ordered.body.items.map(x=>[x.id,x.position]),[[id,1],[two.body.id,2]]);
  const published=await request(app,t.teacher,detail+'/publish','POST');assert.equal(published.status,200);assert.ok(published.body.publishedAt);
  let count=(await pool.query('SELECT * FROM audit_events')).rowCount;
  assert.deepEqual((await request(app,t.teacher,detail+'/publish','POST')).body,published.body);
  await request(app,t.teacher,detail,'PATCH',{title:'Renamed'});await request(app,t.teacher,path+'/order','PUT',{moduleIds:[id,two.body.id]});
  assert.equal((await pool.query('SELECT * FROM audit_events')).rowCount,count);
  assert.equal((await request(app,t.teacher,detail+'/unpublish','POST')).body.publishedAt,null);count++;
  await request(app,t.teacher,detail+'/unpublish','POST');assert.equal((await pool.query('SELECT * FROM audit_events')).rowCount,count);
  for(const [body,status] of [[{},400],[{title:'X',position:'1'},400],[{title:'X',position:0},422],[{title:' ',position:1},422],[{title:'X',position:1},409],[{title:'X',position:3,courseId:f.other},400]])assert.equal((await request(app,t.teacher,path,'POST',body)).status,status);
  for(const [ids,status] of [[[id,id],422],[[id],409],[[],409],[[randomUUID(),two.body.id],404]])assert.equal((await request(app,t.teacher,path+'/order','PUT',{moduleIds:ids})).status,status);
  assert.equal((await request(app,t.teacher,detail+'/publish','POST',{})).status,400);
  assert.equal((await request(app,t.teacher,`uc/courses/${f.foreign}/modules`,'POST',{title:'x',position:1})).status,404);
  assert.equal((await request(app,t.teacher,`utfsm/modules/${id}`,'PATCH',{title:' '})).status,404);
  assert.equal((await request(app,t.student,path,'POST',{title:' ',position:0})).status,403);
  for(const role of ['student','assistant']) {
   assert.equal((await request(app,t[role],path,'POST',{title:'x',position:10})).status,403);
   assert.equal((await request(app,t[role],detail,'PATCH',{title:'x'})).status,404);
   await request(app,t.teacher,detail+'/publish','POST');
   assert.equal((await request(app,t[role],detail,'PATCH',{title:'x'})).status,403);
   await request(app,t.teacher,detail+'/unpublish','POST');
  }
  assert.equal((await request(app,t.admin,path,'POST',{title:'x',position:10})).status,404);
  assert.equal((await request(app,t.teacher,'uc/modules/bad')).status,400);
 }finally{if(app)await app.close();await pool.end();}
});
