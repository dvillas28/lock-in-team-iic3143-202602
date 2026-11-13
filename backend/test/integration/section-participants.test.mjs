import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,users,request} from "./course-fixtures.mjs";
const state=async pool=>[(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,(await pool.query("SELECT count(*)::int AS n FROM audit_events")).rows[0].n];
// Fixture accounts reuse demo-uc's hash, so they log in with DEMO_UC_PASSWORD.
const member=async(pool,f,name,tenant=f.tenants.uc)=>{
 const id=randomUUID();
 await pool.query("INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,$3,password_hash FROM users WHERE id=$4",[id,`${id}@participants.test`,name,users.other]);
 await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)",[randomUUID(),tenant,id]);
 return id;
};
const signIn=async(app,f,id)=>{
 const r=await fetch(`${app.base}/api/v1/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:`${id}@participants.test`,password:f.env.DEMO_UC_PASSWORD})});
 assert.equal(r.status,200);return (await r.json()).accessToken;
};
test("section participants: minimal active roster for students and assistants, scoped, read-only",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();
  // s1 (course A, owner=MULTI): MULTI teacher+student, demo-uc assistant.
  const student=await member(pool,f,"Estudiante Activo"),peer=await member(pool,f,"ana Compañera"),former=await member(pool,f,"Ex Estudiante");
  await f.add(f.s1,student,"student");await f.add(f.s1,peer,"student");await f.add(f.s2,peer,"student");
  const history=await f.add(f.s1,former,"student");await pool.query("UPDATE enrollments SET active=false WHERE id=$1",[history]);
  await f.add(f.s1,users.revoked,"student");await f.add(f.s1,users.inactive,"student");// inactive membership / inactive user
  const s1=`uc/sections/${f.s1}/participants`,stu=await signIn(app,f,student),assistant=await login(app,f.env,"UC"),teacher=await login(app,f.env);
  await f.add(f.s4,users.foreign,"teacher",f.tenants.utfsm);
  const before=await state(pool);
  const expected=[
   {userId:users.owner,name:"demo-multi",roles:["teacher","student"]},
   {userId:users.other,name:"demo-uc",roles:["assistant"]},
   {userId:peer,name:"ana Compañera",roles:["student"]},
   {userId:student,name:"Estudiante Activo",roles:["student"]},
  ];
  // Student, assistant and teacher/owner all get the same minimal projection.
  for(const token of [stu,assistant,teacher]) {
   const r=await request(app,token,s1);assert.equal(r.status,200);
   assert.deepEqual(r.body,{items:expected});
   assert.ok(!/@|email|active|createdAt|isAdmin|enrollment/i.test(JSON.stringify(r.body)),"no private or administrative fields");
  }
  // Same-course sibling section, other course, unknown and cross-tenant sections never leak existence.
  for(const path of [`uc/sections/${f.s2}/participants`,`uc/sections/${f.s3}/participants`,`uc/sections/${randomUUID()}/participants`,`uc/sections/${f.s4}/participants`,`utfsm/sections/${f.s4}/participants`])
   assert.equal((await request(app,stu,path)).status,404,path);
  assert.equal((await request(app,stu,"uc/sections/not-a-uuid/participants")).status,400);
  assert.equal((await fetch(`${app.base}/api/v1/institution/${s1}`)).status,401);
  // UTFSM: MULTI holds a UTFSM membership but no enrollment in s4; demo-utfsm cannot read UC.
  const utfsm=await login(app,f.env,"UTFSM");
  assert.equal((await request(app,teacher,`utfsm/sections/${f.s4}/participants`)).status,404);
  for(const path of [s1,`utfsm/sections/${f.s1}/participants`])assert.equal((await request(app,utfsm,path)).status,404,path);
  assert.deepEqual((await request(app,utfsm,`utfsm/sections/${f.s4}/participants`)).body,{items:[{userId:users.foreign,name:"demo-utfsm",roles:["teacher"]}]});
  // Owner admin without enrollment keeps read access (demo-uc owns course B).
  assert.deepEqual((await request(app,assistant,`uc/sections/${f.s3}/participants`)).body,{items:[{userId:users.owner,name:"demo-multi",roles:["teacher"]}]});
  // Management API is unchanged: students still 403, assistants/teachers keep the administrative list.
  assert.equal((await request(app,stu,`uc/sections/${f.s1}/enrollments`)).status,403);
  assert.equal((await request(app,assistant,`uc/sections/${f.s1}/enrollments`)).status,200);
  assert.ok((await request(app,teacher,`uc/sections/${f.s1}/enrollments?limit=100`)).body.items.some(e=>e.user.email && !e.active),"history stays in the management list");
  // The roster is read-only: no write verbs exist on it, and student/assistant writes stay forbidden.
  for(const method of ["POST","PATCH","PUT","DELETE"]) {
   const r=await fetch(`${app.base}/api/v1/institution/${s1}`,{method,headers:{Authorization:`Bearer ${stu}`,"Content-Type":"application/json"},body:JSON.stringify({userId:student,role:"teacher"})});
   assert.equal(r.status,404,method);
  }
  for(const token of [stu,assistant])assert.equal((await request(app,token,`uc/sections/${f.s1}/enrollments`,"POST",{userId:peer,role:"assistant"})).status,403);
  assert.deepEqual(await state(pool),before,"reads and denied writes leave enrollments and audit untouched");
  // Revocation removes the participant from the roster and revokes the read access immediately.
  const own=(await pool.query("SELECT id FROM enrollments WHERE section_id=$1 AND user_id=$2 AND active",[f.s1,student])).rows[0].id;
  assert.equal((await request(app,teacher,`uc/sections/${f.s1}/enrollments/${own}`,"PATCH",{active:false})).status,200);
  assert.equal((await request(app,stu,s1)).status,404);
  assert.ok(!(await request(app,teacher,s1)).body.items.some(p=>p.userId===student));
  // Peer keeps s2 access but loses s1 once institution membership is deactivated.
  assert.equal((await request(app,await signIn(app,f,peer),`uc/sections/${f.s2}/participants`)).status,200);
  await pool.query("UPDATE institution_memberships SET active=false WHERE user_id=$1",[peer]);
  assert.deepEqual((await request(app,teacher,s1)).body.items.map(p=>p.userId),[users.owner,users.other]);
 }finally{if(app)await app.close();await pool.end();}
});
