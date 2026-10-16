import assert from "node:assert/strict";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,request,users} from "./course-fixtures.mjs";
test("US1: owner, academic roles, hidden tenants, multiple roles and live revocation",async()=>{
 const pool=await database();let app;try {
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env),other=await login(app,f.env,"UC");
  const get=(token,path)=>request(app,token,path);
  assert.deepEqual((await get(owner,"uc/courses")).body.items.map(c=>c.code),["A","B"]);
  assert.equal((await get(owner,`uc/courses/${f.foreign}`)).status,404);
  assert.equal((await get(other,`uc/sections/${f.s2}`)).status,404);
  assert.equal((await get(owner,`uc/courses/${f.own}/sections`)).body.items.length,2);
  assert.equal((await get(other,`uc/courses/${f.own}/sections`)).body.items.length,1);
  const me=(await get(owner,"uc/me")).body;assert.equal(me.institutionMembership.isAdmin,true);assert.equal(me.institutionMembership.isSuperAdmin,true);assert.equal(me.sectionMemberships.length,3);
  assert.equal((await get(owner,"utfsm/me")).body.institutionMembership.isAdmin,false);
  assert.equal((await get(owner,"uc/courses/bad")).status,400);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1",[users.owner]);
  assert.equal((await get(owner,`uc/courses/${f.other}`)).status,404);
  assert.equal((await get(owner,`uc/courses/${f.own}`)).status,200);
  await pool.query("UPDATE institution_memberships SET is_admin=false WHERE user_id=$1",[users.owner]);
  assert.equal((await get(owner,`uc/courses/${f.own}`)).status,404);
  await pool.query("UPDATE institution_memberships SET active=false WHERE user_id=$1",[users.other]);
  assert.equal((await get(other,"uc/courses")).status,404);
 }finally{if(app)await app.close();await pool.end();}
});
test("US1 independent academic roles and institutional flags keep their own scopes",async()=>{
 const pool=await database();let app;
 try{
  const f=await coursesFixture(pool);app=await http();const token=await login(app,f.env);
  await request(app,token,`uc/sections/${f.s1}`,"PATCH",{capacity:5});
  await pool.query("UPDATE institution_memberships SET is_admin=false,is_super_admin=false WHERE user_id=$1",[users.owner]);
  await pool.query("UPDATE enrollments SET active=false WHERE user_id=$1",[users.owner]);
  const course=`uc/courses/${f.own}`,section=`uc/sections/${f.s1}`;
  for(const role of ["teacher","assistant","student"]){
   const enrollment=await f.add(f.s1,users.owner,role);
   assert.deepEqual((await request(app,token,"uc/me")).body.sectionMemberships,[{courseId:f.own,sectionId:f.s1,role}]);
   assert.deepEqual((await request(app,token,"uc/courses")).body.items.map(c=>c.id),[f.own]);
   assert.equal((await request(app,token,course)).status,200);
   assert.equal((await request(app,token,section)).status,200);
   assert.deepEqual((await request(app,token,course+"/sections")).body.items.map(s=>s.id),[f.s1]);
   assert.equal((await request(app,token,`uc/sections/${f.s2}`)).status,404);
   assert.equal((await request(app,token,`uc/courses/${f.foreign}`)).status,404);
   assert.equal((await request(app,token,course,"PATCH",{name:"denied"})).status,403);
   assert.equal((await request(app,token,section+"/enrollments")).status,role==="student"?403:200);
   assert.equal((await request(app,token,course+"/audit-events")).status,role==="teacher"?200:403);
   assert.equal((await request(app,token,section+"/enrollments","POST",{userId:users.other,role:"student"})).status,role==="teacher"?201:403);
   await pool.query("UPDATE enrollments SET active=false WHERE id=$1",[enrollment]);
   assert.equal((await request(app,token,course)).status,404);
  }
  await pool.query("UPDATE institution_memberships SET is_super_admin=true WHERE user_id=$1 AND institution_id=$2",[users.owner,f.tenants.uc]);
  const me=(await request(app,token,"uc/me")).body;
  assert.equal(me.institutionMembership.isAdmin,false);assert.equal(me.institutionMembership.isSuperAdmin,true);
  assert.deepEqual((await request(app,token,"uc/courses")).body.items,[]);
  assert.equal((await request(app,token,"uc/memberships")).status,200);
  assert.equal((await request(app,token,course)).status,404);
  assert.equal((await request(app,token,"uc/courses","POST",{code:"DENIED",name:"Denied",term:"2026-2",initialSection:{code:"1"}})).status,403);
  await pool.query("UPDATE institution_memberships SET is_admin=true,is_super_admin=false WHERE user_id=$1 AND institution_id=$2",[users.owner,f.tenants.uc]);
  assert.equal((await request(app,token,"uc/memberships")).status,403);
  assert.equal((await request(app,token,course+"/audit-events")).status,200);
  assert.equal((await request(app,token,`uc/sections/${f.s2}`)).status,200);
 }finally{if(app)await app.close();await pool.end();}
});
