import assert from "node:assert/strict";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {membersFixture,users,request,failAudit} from "./course-fixtures.mjs";
test("US3 delegation active members only, exact body, no-op, foreign IDs and atomic audit",async()=>{
 const pool=await database();let app;try{
  const f=await membersFixture(pool);assert.equal((await pool.query("SELECT * FROM courses")).rowCount,0);app=await http();const owner=await login(app,f.env),other=await login(app,f.env,"UC");
  const members=(await request(app,owner,"uc/memberships?limit=1")).body;assert.equal(members.items.length,1);assert.equal(members.hasMore,true);
  const listed=[...members.items];let cursor=members.nextCursor;
  while(cursor){
   const next=await request(app,owner,"uc/memberships?limit=1&cursor="+cursor);assert.equal(next.status,200);
   assert.equal(next.body.hasMore,next.body.nextCursor!==null);listed.push(...next.body.items);cursor=next.body.nextCursor;
  }
  assert.deepEqual(listed.map(m=>m.user.id).sort(),[users.owner,users.other].sort());
  assert.equal(new Set(listed.map(m=>m.id)).size,listed.length);
  assert.ok(listed.every(m=>m.active && m.user.active));
  assert.equal((await request(app,owner,"utfsm/memberships?cursor="+members.nextCursor)).status,403);
  assert.equal((await request(app,other,"uc/memberships")).status,403);
  const target=(await pool.query("SELECT id FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.uc,users.other])).rows[0].id;
  const path=`uc/memberships/${target}/course-admin`;
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:false,isSuperAdmin:true})).status,400);
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:false})).status,200);
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:false})).status,200);
  assert.equal((await pool.query("SELECT * FROM audit_events")).rowCount,1);
  assert.deepEqual((await pool.query("SELECT changes FROM audit_events")).rows[0].changes,{
   before:{id:target,userId:users.other,isAdmin:true,isSuperAdmin:false},
   after:{id:target,userId:users.other,isAdmin:false,isSuperAdmin:false},
  });
  const foreign=(await pool.query("SELECT id FROM institution_memberships WHERE institution_id=$1 LIMIT 1",[f.tenants.utfsm])).rows[0].id;
  assert.equal((await request(app,owner,`uc/memberships/${foreign}/course-admin`,"PUT",{isAdmin:true})).status,404);
  await pool.query("UPDATE institution_memberships SET active=false WHERE id=$1",[target]);
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:true})).status,404);
  await pool.query("UPDATE institution_memberships SET active=true WHERE id=$1",[target]);
  await pool.query("UPDATE users SET active=false WHERE id=$1",[users.other]);
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:true})).status,404);
  await pool.query("UPDATE users SET active=true WHERE id=$1",[users.other]);
  await pool.query("UPDATE institution_memberships SET is_super_admin=true WHERE institution_id=$1 AND user_id=$2",[f.tenants.utfsm,users.foreign]);
  const utfsm=await login(app,f.env,"UTFSM"),utfsmTarget=(await pool.query("SELECT id FROM institution_memberships WHERE institution_id=$1 AND user_id=$2",[f.tenants.utfsm,users.owner])).rows[0].id;
  const utfsmPath=`utfsm/memberships/${utfsmTarget}/course-admin`,course={code:"UTFSM",name:"Delegated",term:"2026-2",initialSection:{code:"1"}};
  assert.equal((await request(app,owner,"utfsm/courses","POST",course)).status,403);
  assert.equal((await request(app,utfsm,"utfsm/courses","POST",course)).status,403,"superadmin alone cannot create courses");
  assert.equal((await request(app,utfsm,utfsmPath,"PUT",{isAdmin:true})).status,200);
  const created=await request(app,owner,"utfsm/courses","POST",course);assert.equal(created.status,201);assert.equal(created.body.createdBy,users.owner);
  assert.equal((await request(app,utfsm,`utfsm/memberships/${target}/course-admin`,"PUT",{isAdmin:true})).status,404);
  assert.equal((await request(app,utfsm,utfsmPath,"PUT",{isAdmin:false})).status,200);
  assert.equal((await request(app,owner,`utfsm/courses/${created.body.id}`,"PATCH",{name:"revoked"})).status,403);
  assert.equal((await pool.query("SELECT is_admin FROM institution_memberships WHERE id=$1",[target])).rows[0].is_admin,false);
  await failAudit(pool);assert.equal((await request(app,owner,path,"PUT",{isAdmin:true})).status,500);
  assert.equal((await pool.query("SELECT is_admin FROM institution_memberships WHERE id=$1",[target])).rows[0].is_admin,false);
  await pool.query("UPDATE institution_memberships SET is_super_admin=false WHERE user_id=$1",[users.owner]);
  assert.equal((await request(app,owner,path,"PUT",{isAdmin:true})).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
