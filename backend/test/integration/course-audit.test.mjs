import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,request,users} from "./course-fixtures.mjs";
test("US2 audit owner precedence, teacher sections, filters, cursor and immutability",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const token=await login(app,f.env),other=await login(app,f.env,"UC");
  await request(app,token,`uc/courses/${f.own}`,"PATCH",{name:"renamed"});
  await request(app,token,`uc/sections/${f.s1}`,"PATCH",{capacity:2});
  await request(app,token,`uc/sections/${f.s2}`,"PATCH",{capacity:3});
  const path=`uc/courses/${f.own}/audit-events`;
  const all=await request(app,token,path);assert.equal(all.status,200);assert.equal(all.body.items.length,3);assert.ok(all.body.items.some(e=>e.sectionId===null));assert.ok(all.body.items.some(e=>e.sectionId===f.s2));
  assert.deepEqual(all.body.items.find(e=>e.resourceId===f.own).changes,{
   before:{code:"A",name:"A",term:"2026-2",createdBy:users.owner},
   after:{code:"A",name:"renamed",term:"2026-2",createdBy:users.owner},
  });
  for(const [sectionId,capacity] of [[f.s1,2],[f.s2,3]])assert.deepEqual(all.body.items.find(e=>e.resourceId===sectionId).changes,{
   before:{code:sectionId===f.s1?"1":"2",capacity:null},after:{code:sectionId===f.s1?"1":"2",capacity},
  });
  assert.equal((await request(app,other,path)).status,403);
  const first=(await request(app,token,path+"?limit=1")).body;assert.equal(first.hasMore,true);
  const invalidCursor=JSON.parse(Buffer.from(first.nextCursor,"base64url"));
  invalidCursor.date="2026-02-30T00:00:00Z";
  assert.equal((await request(app,token,path+"?cursor="+Buffer.from(JSON.stringify(invalidCursor)).toString("base64url"))).status,400);
  const next=await request(app,token,path+"?limit=1&cursor="+first.nextCursor);assert.equal(next.status,200);assert.notEqual(first.items[0].id,next.body.items[0].id);
  assert.equal((await request(app,token,path+"?action=course.updated&cursor="+first.nextCursor)).status,400);
  for(const query of ["limit=0","cursor=!!!","from=2026-02-30T00:00:00Z","from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z","resourceId=bad","from=no","from=2026-10-01T00:00:00.000999Z&to=2026-10-01T00:00:00.000001Z"])assert.equal((await request(app,token,path+"?"+query)).status,400);
  assert.equal((await request(app,token,path+"?sectionId="+f.s3)).status,404);
  assert.equal((await request(app,token,path+"?action=course.updated")).body.items.length,1);
  assert.equal((await request(app,token,path+"?resourceType=section")).body.items.length,2);
  for(const sql of ["UPDATE audit_events SET action='hijack'","DELETE FROM audit_events"])await assert.rejects(pool.query(sql));
  await pool.query("UPDATE institution_memberships SET is_admin=false WHERE user_id=$1",[users.owner]);
  const scoped=await request(app,token,path);assert.equal(scoped.status,200);assert.equal(scoped.body.items.length,1);assert.equal(scoped.body.items[0].sectionId,f.s1);
  assert.equal((await request(app,token,path+"?sectionId="+f.s2)).status,404);
  assert.equal((await request(app,token,`uc/courses/${f.foreign}/audit-events`)).status,404);
  assert.equal((await request(app,token,path+"?actorUserId="+randomUUID())).body.items.length,0);
 }finally{if(app)await app.close();await pool.end();}
});
