import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {database,http,login,cli,sanitized} from "./helpers.mjs";
import {coursesFixture,users,request} from "./course-fixtures.mjs";
import {createApiClient} from "../../../frontend/src/lib/api/client.ts";
test("onboarding -> delegated admin -> real generated consumer create -> revoke; other tenant unchanged",async()=>{
 const pool=await database();let app;const tokens=[];
 try{
  const f=await coursesFixture(pool),foreign=(await pool.query("SELECT * FROM institution_memberships WHERE institution_id=$1 ORDER BY id",[f.tenants.utfsm])).rows;
  const env={ONBOARD_INSTITUTION_SLUG:"workflow",ONBOARD_INSTITUTION_NAME:"Workflow",ONBOARD_USER_ID:users.owner,ONBOARD_USER_EMAIL:"demo-multi@academix.example",ONBOARD_USER_NAME:"Existing",ONBOARD_OPERATION_ID:"workflow-v1",ONBOARD_OPERATOR_REF:"PM-test"};
  const onboard=await cli("data-migrations/onboard-institution",env).result;assert.equal(onboard.code,0);
  const institution=(await pool.query("SELECT id FROM institutions WHERE slug='workflow'")).rows[0].id,target=randomUUID();
  // PM-provisioned member, explicit external precondition; no provisioning endpoint.
  await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)",[target,institution,users.other]);
  app=await http();const owner=await login(app,f.env),other=await login(app,f.env,"UC");tokens.push(owner,other);
  assert.equal((await request(app,owner,`workflow/memberships/${target}/course-admin`,"PUT",{isAdmin:true})).status,200);
  const client=createApiClient({baseUrl:app.base,getToken:()=>other});
  const result=await client.POST("/api/v1/institutions/{institutionSlug}/courses",{params:{path:{institutionSlug:"workflow"}},body:{code:"FLOW",name:"Workflow",term:"2026-2",initialSection:{code:"1"}}});
  assert.equal(result.response.status,201);const course=result.data;assert.equal(course.createdBy,users.other);
  assert.equal((await request(app,owner,`workflow/courses/${course.id}`)).status,404,"superadmin has no access to other owner");
  assert.equal((await request(app,owner,`workflow/memberships/${target}/course-admin`,"PUT",{isAdmin:false})).status,200);
  assert.equal((await request(app,other,`workflow/courses/${course.id}`,"PATCH",{name:"denied"})).status,403);
  const section=(await request(app,other,`workflow/courses/${course.id}/sections`)).body.items[0];
  assert.equal((await request(app,other,`workflow/sections/${section.id}/enrollments`,"POST",{userId:users.owner,role:"student"})).status,201,"teacher retains participant management");
  assert.equal((await request(app,owner,`workflow/sections/${section.id}/enrollments`)).status,403,"student cannot list participants");
  const me=(await request(app,other,"workflow/me")).body;assert.equal(me.institutionMembership.isAdmin,false);assert.equal(me.sectionMemberships[0].role,"teacher");
  const events=(await pool.query("SELECT * FROM audit_events WHERE institution_id=$1",[institution])).rows;assert.equal(events.length,7);assert.equal(events.filter(e=>e.course_id===course.id).length,4);
  assert.deepEqual((await pool.query("SELECT * FROM institution_memberships WHERE institution_id=$1 ORDER BY id",[f.tenants.utfsm])).rows,foreign);
  sanitized(onboard.output,[...tokens,env.ONBOARD_USER_EMAIL]);assert.ok(!JSON.stringify(events).includes(env.ONBOARD_USER_EMAIL));
 }finally{if(app)sanitized((await app.close()).output,tokens);await pool.end();}
});
test("generated consumer handles real createCourse 400/401/403/404 Problems",async()=>{
 const pool=await database();let app;
 try{
  const f=await coursesFixture(pool);app=await http();const token=await login(app,f.env);
  const body={code:"C",name:"Course",term:"2026-2",initialSection:{code:"1"}};
  for(const [status,slug,input,credential] of [[400,"uc",{},token],[401,"uc",body,undefined],[403,"utfsm",body,token],[404,"absent",body,token]]){
   const client=createApiClient({baseUrl:app.base,getToken:()=>credential});
   await assert.rejects(client.POST("/api/v1/institutions/{institutionSlug}/courses",{params:{path:{institutionSlug:slug}},body:input}),error=>{
    assert.equal(error.status,status);assert.equal(error.problem.status,status);
    assert.ok(error.problem.code);assert.ok(error.problem.traceId);
    assert.ok(!JSON.stringify(error.problem).includes(token));return true;
   });
  }
 }finally{if(app)await app.close();await pool.end();}
});
