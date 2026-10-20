import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {contentFixture,tokens,request,users} from './content-fixtures.mjs';
test('US2 SQL fixtures: all four parent/item states on every GET, both sections and no hidden IDs/counts',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f),list=`uc/courses/${f.own}/modules`;
  for(const role of ['teacher','owner','student','assistant']) {
   const teacher=['teacher','owner'].includes(role),modules=await request(app,t[role],list);
   assert.equal(modules.status,200);assert.deepEqual(Object.keys(modules.body),['items']);
   assert.deepEqual(modules.body.items.map(m=>m.id),teacher?f.modules:f.modules.slice(2));
   for(let i=0;i<4;i++) {
    const parent=i>=2,item=i%2===1,module=`uc/modules/${f.modules[i]}`,material=`uc/materials/${f.materials[i]}`;
    const detail=await request(app,t[role],module),items=await request(app,t[role],module+'/materials'),source=await request(app,t[role],material);
    assert.equal(detail.status,teacher||parent?200:404);assert.equal(items.status,teacher||parent?200:404);assert.equal(source.status,teacher||(parent&&item)?200:404);
    if(items.status===200)assert.deepEqual(items.body.items.map(m=>m.id),teacher||item?[f.materials[i]]:[]);
    if(source.status===200)assert.deepEqual(Object.keys(source.body).sort(),['id','moduleId','title','kind','markdownBody','publishedAt','createdBy'].sort());
   }
  }
  assert.deepEqual((await request(app,t.student,`uc/materials/${f.materials[3]}`)).body,(await request(app,t.assistant,`uc/materials/${f.materials[3]}`)).body);
  for(const role of ['admin'])for(const path of [list,`uc/modules/${f.modules[3]}`,`uc/modules/${f.modules[3]}/materials`,`uc/materials/${f.materials[3]}`])assert.equal((await request(app,t[role],path)).status,404);
  for(const token of [t.teacher,t.student])for(const path of [
   `uc/courses/${f.foreign}/modules`,`uc/courses/${f.other}/modules`,`uc/modules/${f.foreignModule}`,`uc/modules/${f.foreignModule}/materials`,`uc/materials/${f.foreignMaterial}`,`utfsm/courses/${f.own}/modules`,`utfsm/modules/${f.modules[3]}`,`utfsm/modules/${f.modules[3]}/materials`,`utfsm/materials/${f.materials[3]}`,
   `uc/modules/${randomUUID()}`,`uc/materials/${randomUUID()}`,`uc/modules/${randomUUID()}/materials`,
  ])assert.equal((await request(app,token,path)).status,404);
  assert.deepEqual((await request(app,t.owner,`uc/courses/${f.other}/modules`)).body,{items:[]});
  await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1 AND section_id=ANY($2::uuid[])',[users.owner,[f.s1,f.s2]]);
  assert.equal((await request(app,t.owner,`uc/courses/${f.own}`)).status,200,'owner retains administrative course access');
  for(const path of [list,`uc/modules/${f.modules[3]}`,`uc/modules/${f.modules[3]}/materials`,`uc/materials/${f.materials[3]}`])assert.equal((await request(app,t.owner,path)).status,404,'owner without enrollment has no content access');
 }finally{if(app)await app.close();await pool.end();}
});
