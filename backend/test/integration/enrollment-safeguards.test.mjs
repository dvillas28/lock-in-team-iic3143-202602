import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,users,request} from "./course-fixtures.mjs";
const state=async pool=>[(await pool.query("SELECT * FROM enrollments ORDER BY id")).rows,(await pool.query("SELECT count(*)::int AS n FROM audit_events")).rows[0].n];
const one=async(pool,section,user,role)=>(await pool.query("SELECT id FROM enrollments WHERE section_id=$1 AND user_id=$2 AND role=$3 AND active",[section,user,role])).rows[0]?.id;
test("teacher enrollments are owner-only; self, last teacher and history are protected",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();
  // users.owner: admin owner of course A, teacher of s1/s3, super admin. users.other: admin (not owner of A), owner of course B.
  const owner=await login(app,f.env),teacher=await login(app,f.env,"UC"),member=randomUUID();
  await pool.query("INSERT INTO users(id,email,name,password_hash) SELECT $1,'safeguard@example.test','Participante',password_hash FROM users WHERE id=$2",[member,users.other]);
  await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)",[randomUUID(),f.tenants.uc,member]);
  const s1=`uc/sections/${f.s1}/enrollments`,s3=`uc/sections/${f.s3}/enrollments`;
  await pool.query("UPDATE enrollments SET active=false WHERE section_id=$1 AND user_id=$2 AND active",[f.s1,users.other]);
  const peer=await f.add(f.s1,users.other,"teacher");
  const denied=async(token,path,method,body,status=403)=>{const before=await state(pool),r=await request(app,token,path,method,body);assert.equal(r.status,status,`${method} ${path} ${JSON.stringify(body)}`);assert.deepEqual(await state(pool),before);return r;};
  // Rule A/C: a non-owner teacher (even with is_admin) cannot touch teacher enrollments, including self and no-ops.
  for(const body of [{active:false},{role:"assistant"},{role:"teacher"}])await denied(teacher,`${s1}/${peer}`,"PATCH",body);
  for(const body of [{active:false},{role:"student"},{role:"teacher"}])await denied(teacher,`${s1}/${f.teacher}`,"PATCH",body);
  await denied(teacher,s1,"POST",{userId:member,role:"teacher"});
  await denied(teacher,s1,"POST",{userId:users.owner,role:"teacher"});
  // Rule D: teachers keep managing students and assistants of their section.
  const student=await request(app,teacher,s1,"POST",{userId:member,role:"student"});
  assert.equal(student.status,201);
  const conflict=await denied(teacher,s1,"POST",{userId:member,role:"assistant"},409);
  assert.equal(conflict.body.code,"SECTION_ROLE_ALREADY_ACTIVE");
  await denied(teacher,`${s1}/${student.body.id}`,"PATCH",{role:"teacher"});
  const others=(await pool.query("SELECT id,active FROM enrollments WHERE user_id<>$1 ORDER BY id",[member])).rows;
  const assistant=await request(app,teacher,`${s1}/${student.body.id}`,"PATCH",{role:"assistant"});
  assert.equal(assistant.status,200);
  await denied(teacher,`${s1}/${assistant.body.id}`,"PATCH",{role:"teacher"});
  const demoted=await request(app,teacher,`${s1}/${assistant.body.id}`,"PATCH",{role:"student"});assert.equal(demoted.status,200);assert.notEqual(demoted.body.id,assistant.body.id);
  assert.equal((await request(app,teacher,`${s1}/${demoted.body.id}`,"PATCH",{active:false})).status,200);
  // Rule E: revocations keep every row as history and do not touch other people's active roles.
  assert.deepEqual((await pool.query("SELECT role,active FROM enrollments WHERE user_id=$1 ORDER BY created_at,id",[member])).rows,
   [{role:"student",active:false},{role:"assistant",active:false},{role:"student",active:false}]);
  assert.deepEqual((await pool.query("SELECT id,active FROM enrollments WHERE user_id<>$1 ORDER BY id",[member])).rows,others);
  // Rule 10/11: no cross-section or cross-tenant reach.
  await denied(teacher,`uc/sections/${f.s2}/enrollments`,"POST",{userId:member,role:"student"},404);
  await denied(teacher,`uc/sections/${f.s2}/enrollments/${f.teacher}`,"PATCH",{active:false},404);
  const foreignTeacher=await f.add(f.s4,users.foreign,"teacher",f.tenants.utfsm),utfsm=await login(app,f.env,"UTFSM");
  await denied(teacher,`utfsm/sections/${f.s4}/enrollments/${foreignTeacher}`,"PATCH",{active:false},404);
  await denied(utfsm,`uc/sections/${f.s1}/enrollments/${f.teacher}`,"PATCH",{active:false},404);
  await denied(utfsm,`utfsm/sections/${f.s1}/enrollments/${f.teacher}`,"PATCH",{active:false},404);
  for(const body of [{active:false},{role:"student"}])await denied(utfsm,`utfsm/sections/${f.s4}/enrollments/${foreignTeacher}`,"PATCH",body);
  // Owner manages teachers but cannot revoke self; super admin of another course gains nothing.
  for(const body of [{active:false},{role:"student"}])await denied(owner,`${s1}/${f.teacher}`,"PATCH",body);
  await denied(owner,s3,"POST",{userId:member,role:"teacher"});
  const added=await request(app,owner,s1,"POST",{userId:member,role:"teacher"});assert.equal(added.status,201);
  assert.equal((await request(app,owner,`${s1}/${added.body.id}`,"PATCH",{active:false})).status,200);
  await denied(teacher,`${s1}/${added.body.id}`,"PATCH",{active:true});
  assert.equal((await request(app,owner,`${s1}/${added.body.id}`,"PATCH",{active:true})).body.active,true);
  // Rule B: the last active teacher cannot be revoked or demoted, even by the course owner.
  const sole=await one(pool,f.s3,users.owner,"teacher");
  for(const body of [{active:false},{role:"student"}])assert.equal((await denied(teacher,`${s3}/${sole}`,"PATCH",body,409)).body.code,"LAST_SECTION_TEACHER");
  const replacement=await request(app,teacher,s3,"POST",{userId:member,role:"teacher"});assert.equal(replacement.status,201);
  const races=await Promise.all([sole,replacement.body.id].map(id=>request(app,teacher,`${s3}/${id}`,"PATCH",{active:false})));
  assert.deepEqual(races.map(r=>r.status).sort(),[200,409]);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM enrollments WHERE section_id=$1 AND role='teacher' AND active",[f.s3])).rows[0].n,1);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM enrollments WHERE section_id=$1 AND role='teacher'",[f.s3])).rows[0].n,2);
  // A valid revocation by the owner removes the revoked teacher's write permission but keeps the row.
  assert.equal((await request(app,owner,`${s1}/${peer}`,"PATCH",{active:false})).status,200);
  assert.equal((await pool.query("SELECT active FROM enrollments WHERE id=$1",[peer])).rows[0].active,false);
  await denied(teacher,s1,"POST",{userId:member,role:"student"},404);
  assert.equal((await request(app,teacher,s1)).status,404,"revoked teacher loses access to the section");
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM audit_events WHERE resource_id=$1 AND action='enrollment.activeChanged'",[peer])).rows[0].n,1);
 }finally{if(app)await app.close();await pool.end();}
});
