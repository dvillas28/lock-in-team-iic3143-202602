import assert from "node:assert/strict";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,request,users,failAudit,restoreAudit} from "./course-fixtures.mjs";
export const newCourse=()=>({code:"NEW",name:"New course",term:"2026-2",initialSection:{code:"1",capacity:0}});
test("US2 course/section creation, immutable server owner, exact validation and atomic last event",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env),other=await login(app,f.env,"UC");
  const post=(body,path="uc/courses")=>request(app,owner,path,"POST",body);
  for(const body of [{...newCourse(),createdBy:users.other},{...newCourse(),isAdmin:true},{...newCourse(),initialSection:{code:"1",capacity:-1}},{...newCourse(),name:" "},{...newCourse(),initialSection:{code:"1",capacity:2147483648}}])assert.equal((await post(body)).status,400);
  assert.equal((await post(newCourse(),"utfsm/courses")).status,403);
  const result=await post(newCourse());assert.equal(result.status,201);assert.equal(result.body.createdBy,users.owner);assert.ok(result.headers.get("location").endsWith(result.body.id));
  assert.equal((await pool.query("SELECT * FROM audit_events WHERE course_id=$1",[result.body.id])).rowCount,3);
  assert.equal((await pool.query("SELECT e.* FROM enrollments e JOIN sections s ON s.id=e.section_id WHERE s.course_id=$1 AND e.role='teacher'",[result.body.id])).rowCount,1);
  assert.equal((await post(newCourse())).status,409);
  assert.equal((await request(app,owner,`uc/courses/${f.other}`,"PATCH",{name:"hijack"})).status,403);
  assert.equal((await request(app,other,`uc/courses/${result.body.id}`,"PATCH",{name:"hijack"})).status,404);
  assert.equal((await request(app,owner,`uc/courses/${f.own}`,"PATCH",{})).status,400);
  assert.equal((await request(app,owner,`uc/courses/${f.own}/sections`,"POST",{code:"3",capacity:null})).status,201);
  assert.equal((await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{capacity:4})).body.capacity,4);
  assert.equal((await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{code:"2"})).status,409);
  const before=(await pool.query("SELECT count(*) FROM courses")).rows;
  await failAudit(pool,"enrollment.created");assert.equal((await post({...newCourse(),code:"FAIL"})).status,500);
  assert.deepEqual((await pool.query("SELECT count(*) FROM courses")).rows,before);await restoreAudit(pool);
  await pool.query("UPDATE institution_memberships SET is_admin=false WHERE user_id=$1",[users.owner]);
  assert.equal((await post({...newCourse(),code:"REVOKED"})).status,403);
  assert.equal((await request(app,owner,`uc/courses/${f.own}`,"PATCH",{name:"revoked"})).status,403);
 }finally{if(app)await app.close();await pool.end();}
});
