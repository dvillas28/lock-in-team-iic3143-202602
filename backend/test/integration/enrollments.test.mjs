import assert from "node:assert/strict";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,users,request,failAudit,restoreAudit} from "./course-fixtures.mjs";
test("US2 enrollment scopes, successor history, single-role idempotency/concurrency and last teacher",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env),other=await login(app,f.env,"UC");
  const path=`uc/sections/${f.s3}/enrollments`, own=`uc/sections/${f.s1}/enrollments`;
  await pool.query("UPDATE institution_memberships SET is_admin=false WHERE user_id=$1",[users.owner]);
  const post=(p,role="student",userId=users.other)=>request(app,owner,p,"POST",{userId,role});
  assert.equal((await request(app,other,own)).status,200);
  assert.equal((await request(app,other,own,"POST",{userId:users.other,role:"student"})).status,403);
  const unchanged=(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows;
  assert.equal((await post(path,"superadmin")).status,400);
  await assert.rejects(pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES(gen_random_uuid(),$1,$2,$3,'superadmin')",[f.tenants.uc,f.s3,users.other]),/Integration SQL failure \(23514\)/);
  assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,unchanged);
  await f.add(f.s4,users.foreign,"teacher",f.tenants.utfsm);const utfsm=await login(app,f.env,"UTFSM");
  const utfsmBefore=(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows;
  assert.equal((await request(app,utfsm,`utfsm/sections/${f.s4}/enrollments`,"POST",{userId:users.foreign,role:"superadmin"})).status,400);
  await assert.rejects(pool.query("INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES(gen_random_uuid(),$1,$2,$3,'superadmin')",[f.tenants.utfsm,f.s4,users.foreign]),/Integration SQL failure \(23514\)/);
  assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,utfsmBefore);
  const races=await Promise.all([post(path),post(path)]);assert.deepEqual(races.map(r=>r.status).sort(),[200,201]);assert.equal(races[0].body.id,races[1].body.id);
  const student=races[0].body.id;
  const extraRole=await post(path,"assistant");
  assert.equal(extraRole.status,409);
  assert.equal(extraRole.body.code,"SECTION_ROLE_ALREADY_ACTIVE");
  const assistant=await request(app,owner,path+"/"+student,"PATCH",{role:"assistant"});
  assert.equal(assistant.status,200);
  assert.notEqual(assistant.body.id,student);
  assert.deepEqual((await pool.query("SELECT changes FROM audit_events WHERE resource_id=$1 AND action='enrollment.roleChanged'",[student])).rows[0].changes,{
   before:{id:student,userId:users.other,sectionId:f.s3,role:"student",active:true},
   after:{id:assistant.body.id,userId:users.other,sectionId:f.s3,role:"assistant",active:true},
  });
  assert.equal((await pool.query("SELECT active FROM enrollments WHERE id=$1",[student])).rows[0].active,false);
  const reactivation=await request(app,owner,path+"/"+student,"PATCH",{active:true});
  assert.equal(reactivation.status,409);
  assert.equal(reactivation.body.code,"SECTION_ROLE_ALREADY_ACTIVE");
  assert.equal((await request(app,owner,path+"/"+assistant.body.id,"PATCH",{active:false})).status,200);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{active:true})).status,200);
  const promotion=(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows;
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{role:"teacher"})).status,403,"teacher cannot promote to teacher");
  assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,promotion);
  const successor=await request(app,other,path+"/"+student,"PATCH",{role:"teacher"});assert.equal(successor.status,200,"course owner promotes");assert.notEqual(successor.body.id,student);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{active:true})).status,409);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{role:"teacher",active:false})).status,400);
  assert.equal((await request(app,other,path+"/"+successor.body.id,"PATCH",{active:false})).status,403,"owner cannot revoke their own teacher role");
  const [created,otherRole]=await Promise.all([post(own,"assistant",users.other),post(own,"student",users.other)]);
  assert.deepEqual([created.status,otherRole.status].sort(),[200,409]);
  const fresh=await request(app,other,path+"/"+successor.body.id,"PATCH",{role:"student"});
  assert.equal(fresh.status,403,"owner cannot change their own teacher role");
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{active:true})).status,409);
  assert.equal((await post(path,"student",users.foreign)).status,404);assert.equal((await post(path,"student",users.revoked)).status,404);assert.equal((await post(path,"student",users.inactive)).status,404);
  await failAudit(pool);const before=(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows;
  assert.equal((await post(own,"student",users.owner)).status,409);assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,before);
  assert.equal((await request(app,owner,own+"/"+created.body.id,"PATCH",{role:"student"})).status,500);
  assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,before);await restoreAudit(pool);
  const page=await request(app,owner,path+"?limit=1");assert.equal(page.body.items.length,1);assert.equal(page.body.hasMore,true);
  assert.equal((await request(app,owner,path+"?limit=1&cursor="+page.body.nextCursor)).status,200);
  assert.equal((await request(app,owner,own+"?cursor="+page.body.nextCursor)).status,400);
  const self=(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows;
  assert.equal((await request(app,owner,own+"/"+f.teacher,"PATCH",{active:false})).status,403,"teacher cannot revoke self");
  assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,self);
  assert.equal((await pool.query("SELECT created_by FROM courses WHERE id=$1",[f.own])).rows[0].created_by,users.owner);
  assert.equal((await request(app,owner,own)).status,200,"teacher keeps access");
  await pool.query("UPDATE institution_memberships SET is_admin=true WHERE user_id=$1",[users.owner]);
  const otherSection=`uc/sections/${f.s2}/enrollments`;
  const concurrent=await Promise.all([post(otherSection,"student"),post(otherSection,"assistant")]);
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);
  assert.equal(concurrent.find(r=>r.status===409).body.code,"SECTION_ROLE_ALREADY_ACTIVE");
  const active=(await request(app,owner,otherSection+"?status=active")).body.items;
  assert.equal(active.filter(e=>e.user.id===users.other).length,1);
 }finally{if(app)await app.close();await pool.end();}
});

test("enrollment list filters active and historical rows with independent cursors; without status it lists both",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env);
  const path=`uc/sections/${f.s1}/enrollments`;
  const assistant=(await request(app,owner,path,"POST",{userId:users.other,role:"assistant"})).body;
  assert.equal((await request(app,owner,`${path}/${assistant.id}`,"PATCH",{active:false})).status,200);
  assert.equal((await request(app,owner,path,"POST",{userId:users.other,role:"student"})).status,201);
  const all=(await request(app,owner,path)).body.items,active=(await request(app,owner,`${path}?status=active`)).body.items,historical=(await request(app,owner,`${path}?status=historical`)).body.items;
  assert.ok(active.length>0 && active.every(e=>e.active));
  assert.deepEqual(historical.map(e=>e.id),[assistant.id]);
  assert.deepEqual(all.map(e=>e.id).sort(),[...active,...historical].map(e=>e.id).sort(),"no status keeps the full roster");
  // Each filter pages on its own: a cursor never crosses views.
  const first=(await request(app,owner,`${path}?status=active&limit=1`)).body;
  assert.equal(first.items.length,1);assert.ok(first.nextCursor,"two or more active rows page");
  const cursor=encodeURIComponent(first.nextCursor);
  const scoped=await request(app,owner,`${path}?status=active&userId=${users.other}`);
  assert.deepEqual(scoped.body.items.map(e=>e.user.id),[users.other]);
  assert.equal((await request(app,owner,`${path}?status=active&userId=${users.other}&limit=1&cursor=${cursor}`)).status,400);
  assert.equal((await request(app,owner,`${path}?userId=invalid`)).status,400);
  const second=(await request(app,owner,`${path}?status=active&limit=1&cursor=${cursor}`)).body;
  assert.ok(second.items.every(e=>e.active) && second.items[0].id!==first.items[0].id);
  assert.equal((await request(app,owner,`${path}?status=historical&limit=1&cursor=${cursor}`)).status,400);
  assert.equal((await request(app,owner,`${path}?limit=1&cursor=${cursor}`)).status,400);
  for(const bad of ["invalid","ACTIVE",""])assert.equal((await request(app,owner,`${path}?status=${bad}`)).status,400);
  assert.equal((await request(app,owner,`${path}?status=active&status=historical`)).status,400);
  // The filter never widens access: other tenants and outsiders still get nothing.
  assert.equal((await request(app,owner,`uc/sections/${f.s4}/enrollments?status=historical`)).status,404);
 }finally{if(app)await app.close();await pool.end();}
});
