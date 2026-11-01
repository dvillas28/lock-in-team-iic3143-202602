import assert from "node:assert/strict";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,users,request,failAudit,restoreAudit} from "./course-fixtures.mjs";
test("US2 enrollment scopes, successor history, multi-role idempotency/concurrency and last teacher",async()=>{
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
  const assistant=await post(path,"assistant");assert.equal(assistant.status,201);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{role:"assistant"})).body.id,assistant.body.id);
  assert.deepEqual((await pool.query("SELECT changes FROM audit_events WHERE resource_id=$1 AND action='enrollment.roleChanged'",[student])).rows[0].changes,{
   before:{id:student,userId:users.other,sectionId:f.s3,role:"student",active:true},
   after:{id:assistant.body.id,userId:users.other,sectionId:f.s3,role:"assistant",active:true},
  });
  assert.equal((await pool.query("SELECT active FROM enrollments WHERE id=$1",[student])).rows[0].active,false);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{active:true})).status,200);
  const successor=await request(app,owner,path+"/"+student,"PATCH",{role:"teacher"});assert.equal(successor.status,200);assert.notEqual(successor.body.id,student);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{active:true})).status,200);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{role:"teacher",active:false})).status,400);
  await request(app,owner,path+"/"+student,"PATCH",{active:false});
  const fresh=await post(path);assert.equal(fresh.status,201);
  assert.equal((await request(app,owner,path+"/"+student,"PATCH",{active:true})).status,409);
  assert.equal((await post(path,"student",users.foreign)).status,404);assert.equal((await post(path,"student",users.revoked)).status,404);assert.equal((await post(path,"student",users.inactive)).status,404);
  await failAudit(pool);const before=(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows;
  assert.equal((await post(own,"student")).status,500);assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,before);
  assert.equal((await request(app,owner,path+"/"+assistant.body.id,"PATCH",{role:"student"})).status,500);
  assert.deepEqual((await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,before);await restoreAudit(pool);
  const page=await request(app,owner,path+"?limit=1");assert.equal(page.body.items.length,1);assert.equal(page.body.hasMore,true);
  assert.equal((await request(app,owner,path+"?limit=1&cursor="+page.body.nextCursor)).status,200);
  assert.equal((await request(app,owner,own+"?cursor="+page.body.nextCursor)).status,400);
  assert.equal((await request(app,owner,own+"/"+f.teacher,"PATCH",{active:false})).status,200);
  assert.equal((await pool.query("SELECT created_by FROM courses WHERE id=$1",[f.own])).rows[0].created_by,users.owner);
  assert.equal((await request(app,owner,own)).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
