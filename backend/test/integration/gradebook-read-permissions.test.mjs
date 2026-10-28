import test from 'node:test';
import assert from 'node:assert/strict';

import {database,http} from './helpers.mjs';
import {gradebookFixture,request,tokens,users,coursePath} from './gradebook-fixtures.mjs';

test('each page and own query revalidates identity, tenant, membership and roles',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool,{published:true});app=await http();const t=await tokens(app,f),path=coursePath(f);
 const first=await request(app,t.owner,path+'/gradebook?limit=1');assert.equal(first.status,200);
 assert.equal((await request(app,t.teacher,path+'/gradebook?cursor='+first.body.nextCursor)).status,400);
 assert.equal((await request(app,t.owner,path+'/gradebook?sectionId='+f.s4)).status,404);
 assert.equal((await request(app,t.owner,`utfsm/courses/${f.own}/gradebook`)).status,404);
 await pool.query('UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.owner]);assert.equal((await request(app,t.owner,path+'/gradebook?cursor='+first.body.nextCursor)).status,404);
 await pool.query('UPDATE institution_memberships SET active=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.revoked]);assert.equal((await request(app,t.student,path+'/my-grades')).status,404);
 await pool.query('UPDATE users SET active=false WHERE id=$1',[users.other]);assert.equal((await request(app,t.teacher,path+'/gradebook')).status,401);
 await pool.query('UPDATE institutions SET active=false WHERE id=$1',[f.tenants.uc]);assert.equal((await request(app,t.assistant,path+'/gradebook')).status,404);
 }finally{if(app)await app.close();await pool.end();}
});

test('role/flag revocation on a later page reduces scope; own view never shows another student',async()=>{
 const pool=await database();let app;try{
 const f=await gradebookFixture(pool,{published:true});await f.add(f.s1,users.inactive,'student');app=await http();const t=await tokens(app,f),path=coursePath(f);
 assert.deepEqual((await request(app,t.assistant,path+'/my-grades')).body.items,[]);
 const first=await request(app,t.owner,path+'/gradebook?limit=1');assert.equal(first.body.hasMore,true);
 await pool.query('UPDATE institution_memberships SET is_admin=false WHERE institution_id=$1 AND user_id=$2',[f.tenants.uc,users.owner]);
 const second=await request(app,t.owner,path+'/gradebook?cursor='+first.body.nextCursor);assert.equal(second.status,200);assert.deepEqual(second.body.items,[]);
 await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1 AND role='teacher'",[users.owner]);assert.equal((await request(app,t.owner,path+'/gradebook')).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
