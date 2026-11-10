import assert from 'node:assert/strict';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {contentFixture,tokens,request,users} from './content-fixtures.mjs';

test('US1 markdown deletion: teacher-only, tenant-isolated, audited and atomic',async()=>{
 const pool=await database();let app;try {
  const f=await contentFixture(pool,true);app=await http();const t=await tokens(app,f);
  const create=async(title,publish=false)=>{
   const made=await request(app,t.teacher,`uc/modules/${f.modules[0]}/materials`,'POST',{title,markdownBody:'# '+title});assert.equal(made.status,201);
   if(publish)assert.equal((await request(app,t.teacher,`uc/materials/${made.body.id}/publish`,'POST')).status,200);
   return made.body;
  };
  const draft=await create('Borrador a eliminar'),visible=await create('Página publicada',true),keep=await create('Se conserva');
  const del=async(token,path)=>{const response=await fetch(`${app.base}/api/v1/institution/${path}`,{method:'DELETE',headers:token?{Authorization:`Bearer ${token}`}:{}});return {status:response.status,text:await response.text()};};
  assert.equal((await request(app,t.teacher,`uc/modules/${f.modules[0]}/publish`,'POST')).status,200);
  const rows=async id=>(await pool.query('SELECT 1 FROM materials WHERE id=$1',[id])).rowCount;
  const events=async()=>(await pool.query("SELECT action FROM audit_events WHERE action='material.deleted'")).rowCount;

  // Nobody but a teacher of the course can delete; nothing changes and nothing is audited.
  for(const role of ['student','assistant','admin'])assert.equal((await del(t[role],`uc/materials/${draft.id}`)).status,404,`${role} cannot even see a draft`);
  for(const role of ['student','assistant'])assert.equal((await del(t[role],`uc/materials/${visible.id}`)).status,403,`${role} sees it published but cannot delete`);
  assert.equal((await del(t.admin,`uc/materials/${visible.id}`)).status,404);
  assert.equal((await del('','uc/materials/'+draft.id)).status,401);
  assert.equal((await del(t.teacher,`utfsm/materials/${draft.id}`)).status,404,'other institution');
  assert.equal((await del(t.teacher,'uc/materials/not-a-uuid')).status,400);
  assert.equal(await rows(draft.id),1);assert.equal(await rows(visible.id),1);assert.equal(await events(),0);

  // A teacher deletes drafts and published pages alike; the response has no body and the page disappears.
  const removed=await del(t.teacher,`uc/materials/${draft.id}`);
  assert.equal(removed.status,204);assert.equal(removed.text,'');
  assert.equal(await rows(draft.id),0);
  assert.equal((await request(app,t.teacher,`uc/materials/${draft.id}`)).status,404);
  assert.equal((await del(t.teacher,`uc/materials/${draft.id}`)).status,404,'deleting twice is a clean 404');
  assert.equal((await del(t.owner,`uc/materials/${visible.id}`)).status,204,'a teacher in another section of the same course');
  assert.equal(await rows(visible.id),0);

  // Audit keeps who, what and the content as it was; other pages and the list are untouched.
  const audit=(await pool.query("SELECT actor_user_id,resource_type,resource_id,course_id,changes FROM audit_events WHERE action='material.deleted' ORDER BY (resource_id=$1) DESC",[draft.id])).rows;
  assert.equal(audit.length,2);assert.equal(audit[0].resource_type,'material');assert.equal(audit[0].resource_id,draft.id);assert.equal(audit[0].actor_user_id,users.other);
  assert.equal(JSON.stringify(audit[0].changes).includes('Borrador a eliminar'),true);
  const list=await request(app,t.teacher,`uc/modules/${f.modules[0]}/materials`);
  assert.deepEqual(list.body.items.map(m=>m.id).filter(id=>[draft.id,visible.id,keep.id].includes(id)),[keep.id]);
 }finally{if(app)await app.close();await pool.end();}
});
