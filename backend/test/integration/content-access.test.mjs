import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {database,http} from './helpers.mjs';
import {contentFixture,users,hostile} from './content-fixtures.mjs';
import access from '../../dist/content/content-access.js';
import {runtimeDatabase} from './helpers.mjs';

test('content access enforces academic roles, publication, course and tenant boundaries',async()=>{
 const pool=await database(),runtime=await runtimeDatabase();
 try {
  const f=await contentFixture(pool,true);
  const scope=(actor,id,kind)=>runtime.withInstitution(actor,'uc',db=>access.contentScope(db,actor,'uc',id,kind));
  const missing=error=>error.getStatus()===404;
  for(const [actor,teacher] of [[users.owner,true],[users.other,true],[users.revoked,false],[users.inactive,false]]) {
   for(const [kind,id] of [['course',f.own],['module',f.modules[0]],['material',f.materials[0]]]) {
    const s=await scope(actor,id,kind);
    assert.equal(s.courseId,f.own);assert.equal(s.member.institution_id,f.tenants.uc);assert.equal(s.teacher,teacher);
   }
   await runtime.withInstitution(actor,'uc',async db=>{
    const s=await access.contentScope(db,actor,'uc',f.own,'course');
    for(let i=0;i<f.modules.length;i++) {
     if(teacher || i>=2) {
      const row=await access.visibleModule(db,s,f.modules[i]);
      assert.deepEqual(access.moduleDto(row),{id:f.modules[i],courseId:f.own,title:'Module',position:i+1,publishedAt:row.published_at});
     } else await assert.rejects(access.visibleModule(db,s,f.modules[i]),missing);
     if(teacher || i===3) {
      const row=await access.visibleMaterial(db,s,f.materials[i]);
      assert.deepEqual(access.materialDto(row),{id:f.materials[i],moduleId:f.modules[i],title:'Material',kind:'markdown',markdownBody:hostile,publishedAt:row.published_at,createdBy:users.other});
     } else await assert.rejects(access.visibleMaterial(db,s,f.materials[i]),missing);
    }
    for(const id of [f.foreignModule,randomUUID()])await assert.rejects(access.visibleModule(db,s,id),missing);
    for(const id of [f.foreignMaterial,randomUUID()])await assert.rejects(access.visibleMaterial(db,s,id),missing);
    const otherCourse=await access.contentScope(db,users.owner,'uc',f.other,'course');
    await assert.rejects(access.visibleModule(db,otherCourse,f.modules[3]),missing);
    await assert.rejects(access.visibleMaterial(db,otherCourse,f.materials[3]),missing);
   });
  }
  for(const [kind,id] of [['course',f.foreign],['module',f.foreignModule],['material',f.foreignMaterial],['module',randomUUID()],['material',randomUUID()]])
   await assert.rejects(scope(users.owner,id,kind),missing);
  await assert.rejects(scope(f.admin,f.own,'course'),missing);
  await pool.query('UPDATE enrollments SET active=false WHERE user_id=$1',[users.owner]);
  await assert.rejects(scope(users.owner,f.own,'course'),missing);
  await pool.query('UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.other]);
  await assert.rejects(scope(users.other,f.own,'course'),missing);
  await pool.query('UPDATE users SET active=false WHERE id=$1',[users.revoked]);
  await assert.rejects(scope(users.revoked,f.own,'course'),error=>error.getStatus()===401);
 }finally{await runtime.onApplicationShutdown();await pool.end();}
});

test('content paths set inert headers, require authentication and reject non-JSON bodies',async()=>{
 const pool=await database(),runtime=await runtimeDatabase();let app;
 try {
  const f=await contentFixture(pool);app=await http();
  for(const path of [`courses/${f.own}/modules`,`modules/${randomUUID()}`,`materials/${randomUUID()}`]) {
   for(const [method,type,body,status] of [['GET',undefined,undefined,401],['POST','text/plain','source',415],[path.startsWith('courses/')?'POST':'PATCH','application/json; charset=utf-8','{}',401]]) {
    const response=await fetch(`${app.base}/api/v1/institution/uc/${path}`,{method,headers:type?{'Content-Type':type}:{},body});
    assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    assert.equal((await response.json()).status,status);
   }
  }
 }finally{if(app)await app.close();await runtime.onApplicationShutdown();await pool.end();}
});
