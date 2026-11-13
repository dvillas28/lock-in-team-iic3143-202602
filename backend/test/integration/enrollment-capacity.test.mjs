import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,users,request} from "./course-fixtures.mjs";

// Capacity counts student seats: active student enrollments only. Staff never fill a section.
async function members(pool,f,count) {
 const ids=[];
 for(let i=0;i<count;i++){
  const id=randomUUID();ids.push(id);
  await pool.query("INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,$3,password_hash FROM users WHERE id=$4",[id,`seat-${i}-${id.slice(0,8)}@example.test`,`Cupo ${i}`,users.other]);
  await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)",[randomUUID(),f.tenants.uc,id]);
 }
 return ids;
}
const counts=async(pool,section)=>(await pool.query(`SELECT count(*) FILTER (WHERE role='student' AND active)::int AS students,
 count(*)::int AS rows,(SELECT count(*)::int FROM audit_events WHERE section_id=$1) AS audit FROM enrollments WHERE section_id=$1`,[section])).rows[0];

test("enrollment capacity: student seats only, unlimited stays open, full sections reject without writing",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env),teacher=await login(app,f.env,"UC");
  await pool.query("UPDATE enrollments SET active=false WHERE section_id=$1 AND user_id=$2 AND active",[f.s1,users.other]);
  await f.add(f.s1,users.other,"teacher");
  const [a,b,c,d,existing]=await members(pool,f,5);
  await f.add(f.s1,existing,"student");
  const enroll=(token,section,userId,role)=>request(app,token,`uc/sections/${section}/enrollments`,"POST",{userId,role});
  // Unlimited: s2 has no capacity and accepts any number of students.
  for(const id of [a,b,c])assert.equal((await enroll(owner,f.s2,id,"student")).status,201);
  // s1 already holds one active student next to a teacher and an assistant: capacity 2 leaves one seat.
  assert.equal((await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{capacity:2})).status,200,"staff do not count against the capacity");
  assert.equal((await enroll(teacher,f.s1,a,"student")).status,201);
  const before=await counts(pool,f.s1);
  for(const token of [owner,teacher]){
   const full=await enroll(token,f.s1,b,"student");
   assert.equal(full.status,409);assert.equal(full.body.code,"SECTION_FULL");
  }
  assert.deepEqual(await counts(pool,f.s1),before,"a rejected seat writes neither enrollment nor audit");
  // Staff never consume seats; a repeated active student assignment is idempotent even when full.
  assert.equal((await enroll(teacher,f.s1,b,"assistant")).status,201);
  assert.equal((await enroll(owner,f.s1,c,"teacher")).status,201);
  const replay=await enroll(teacher,f.s1,a,"student");
  assert.equal(replay.status,200);assert.equal((await counts(pool,f.s1)).students,2);
  // Permissions still come first: a non-owner teacher cannot assign teachers, full or not.
  assert.equal((await enroll(teacher,f.s1,d,"teacher")).status,403);
  // Raising the capacity frees a seat at once.
  assert.equal((await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{capacity:3})).status,200);
  assert.equal((await enroll(teacher,f.s1,d,"student")).status,201);
  // Legacy zero capacity admits no student, staff still allowed.
  const legacy=randomUUID();
  await pool.query("INSERT INTO sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,'LEGACY',0)",[legacy,f.tenants.uc,f.own]);
  assert.equal((await enroll(owner,legacy,a,"student")).body.code,"SECTION_FULL");
  assert.equal((await enroll(owner,legacy,a,"assistant")).status,201);
 }finally{if(app)await app.close();await pool.end();}
});

test("enrollment capacity: role changes and reactivations cannot bypass a full section",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env);
  const [a,b,existing]=await members(pool,f,3);
  await f.add(f.s1,existing,"student");
  const enroll=(userId,role)=>request(app,owner,`uc/sections/${f.s1}/enrollments`,"POST",{userId,role});
  const patch=(id,body)=>request(app,owner,`uc/sections/${f.s1}/enrollments/${id}`,"PATCH",body);
  await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{capacity:2});
  const student=(await enroll(a,"student")).body,assistant=(await enroll(b,"assistant")).body;
  // Full (existing + a). Promoting an assistant to student needs a seat; the assistant row survives the rejection.
  let before=await counts(pool,f.s1);
  const promote=await patch(assistant.id,{role:"student"});
  assert.equal(promote.status,409);assert.equal(promote.body.code,"SECTION_FULL");
  assert.deepEqual(await counts(pool,f.s1),before);
  assert.equal((await pool.query("SELECT active FROM enrollments WHERE id=$1",[assistant.id])).rows[0].active,true);
  // Revoke keeps history and frees the seat; reactivating takes it back only while one is free.
  assert.equal((await patch(student.id,{active:false})).status,200);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM enrollments WHERE id=$1",[student.id])).rows[0].n,1,"history preserved");
  const promoted=await patch(assistant.id,{role:"student"});
  assert.equal(promoted.status,200);assert.equal(promoted.body.role,"student");
  before=await counts(pool,f.s1);
  const reactivate=await patch(student.id,{active:true});
  assert.equal(reactivate.status,409);assert.equal(reactivate.body.code,"SECTION_FULL");
  assert.deepEqual(await counts(pool,f.s1),before);
  // A student becoming staff frees the seat; then the reactivation fits.
  const demoted=await patch(promoted.body.id,{role:"assistant"});
  assert.equal(demoted.status,200);
  assert.equal((await patch(student.id,{active:true})).status,200);
  assert.equal((await counts(pool,f.s1)).students,2);
  // Unlimited again: reactivations and promotions are never blocked by seats.
  await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{capacity:null});
  assert.equal((await patch(demoted.body.id,{role:"student"})).status,200);
  assert.equal((await counts(pool,f.s1)).students,3);
 }finally{if(app)await app.close();await pool.end();}
});

test("enrollment capacity: concurrent requests never exceed the last seat",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env),teacher=await login(app,f.env,"UC");
  await pool.query("UPDATE enrollments SET active=false WHERE section_id=$1 AND user_id=$2 AND active",[f.s1,users.other]);
  await f.add(f.s1,users.other,"teacher");
  const [existing,...ids]=await members(pool,f,7);
  await f.add(f.s1,existing,"student");
  await request(app,owner,`uc/sections/${f.s1}`,"PATCH",{capacity:3});
  // One student holds a seat: two remain for six simultaneous students from two actors.
  const responses=await Promise.all(ids.map((userId,i)=>request(app,i%2?teacher:owner,`uc/sections/${f.s1}/enrollments`,"POST",{userId,role:"student"})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[201,201,409,409,409,409]);
  assert.ok(responses.filter(r=>r.status===409).every(r=>r.body.code==="SECTION_FULL"));
  assert.equal((await counts(pool,f.s1)).students,3);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM audit_events WHERE section_id=$1 AND action='enrollment.created'",[f.s1])).rows[0].n,2);
  // Concurrent promotions of staff race for one freed seat.
  // Only people without a student enrollment: an active one would be reused without taking a seat.
  const staff=[];for(const userId of ids.filter((_,i)=>responses[i].status===409).slice(0,2))staff.push((await request(app,owner,`uc/sections/${f.s1}/enrollments`,"POST",{userId,role:"assistant"})).body);
  const winner=responses.find(r=>r.status===201).body;
  assert.equal((await request(app,owner,`uc/sections/${f.s1}/enrollments/${winner.id}`,"PATCH",{active:false})).status,200);
  const promotions=await Promise.all(staff.map(e=>request(app,owner,`uc/sections/${f.s1}/enrollments/${e.id}`,"PATCH",{role:"student"})));
  assert.deepEqual(promotions.map(r=>r.status).sort(),[200,409]);
  assert.equal((await counts(pool,f.s1)).students,3);
 }finally{if(app)await app.close();await pool.end();}
});

test("enrollment capacity stays per tenant: a UTFSM section is never counted or written from UC",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env);
  const [a]=await members(pool,f,1);
  await pool.query("UPDATE sections SET capacity=1 WHERE id=$1",[f.s4]);
  assert.equal((await request(app,owner,`uc/sections/${f.s4}/enrollments`,"POST",{userId:a,role:"student"})).status,404);
  assert.equal((await request(app,owner,`utfsm/sections/${f.s4}/enrollments`,"POST",{userId:a,role:"student"})).status,404,"no UTFSM membership for the owner's course scope");
  assert.equal((await counts(pool,f.s4)).rows,0);
 }finally{if(app)await app.close();await pool.end();}
});
