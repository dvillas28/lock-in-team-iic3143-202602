import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {database,http,login} from "./helpers.mjs";
import {coursesFixture,users,request} from "./course-fixtures.mjs";

test("section capacity: integers from 1, never below the current value or active students, null stays unlimited",async()=>{
 const pool=await database();let app;try{
  const f=await coursesFixture(pool);app=await http();const owner=await login(app,f.env);
  const patch=body=>request(app,owner,`uc/sections/${f.s1}`,"PATCH",body);
  const stored=async()=>(await pool.query("SELECT capacity FROM sections WHERE id=$1",[f.s1])).rows[0].capacity;
  const events=async()=>(await pool.query("SELECT count(*)::int AS n FROM audit_events WHERE resource_id=$1",[f.s1])).rows[0].n;
  // Shape: zero, negatives, decimals and strings never reach the service.
  for(const capacity of [0,-1,1.5,"10",2147483648])assert.equal((await patch({capacity})).status,400,String(capacity));
  for(const capacity of [0,-1])assert.equal((await request(app,owner,`uc/courses/${f.own}/sections`,"POST",{code:`Z${capacity}`,capacity})).status,400);
  assert.equal((await request(app,owner,"uc/courses","POST",{code:"ZERO",name:"Zero",term:"2026-2",initialSection:{code:"1",capacity:0}})).status,400);
  assert.equal((await request(app,owner,`uc/courses/${f.own}/sections`,"POST",{code:"ONE",capacity:1})).status,201);
  assert.equal((await request(app,owner,`uc/courses/${f.own}/sections`,"POST",{code:"FREE",capacity:null})).status,201);
  // s1 is unlimited with a teacher and an assistant active. Add two students.
  // Capacity counts student seats only: the teacher and the assistant never consume one.
  for (let i=1;i<=2;i++) {
   const student=randomUUID();
   await pool.query("INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,$2,password_hash FROM users WHERE id=$3",[student,`section-seat-${i}@example.test`,users.owner]);
   await pool.query("INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)",[randomUUID(),f.tenants.uc,student]);
   await f.add(f.s1,student,"student");
  }
  const audited=await events();
  const below=await patch({capacity:1});
  assert.equal(below.status,409);assert.equal(below.body.code,"SECTION_CAPACITY_BELOW_ENROLLMENTS");
  assert.equal(await stored(),null);assert.equal(await events(),audited,"a rejected change leaves no audit");
  assert.equal((await patch({capacity:2})).body.capacity,2,"four active enrollments, two students: staff do not count");
  assert.equal((await patch({capacity:3})).body.capacity,3);
  const decrease=await patch({capacity:2});
  assert.equal(decrease.status,409);assert.equal(decrease.body.code,"SECTION_CAPACITY_DECREASE");assert.equal(await stored(),3);
  assert.equal((await patch({capacity:5})).body.capacity,5);
  assert.equal((await patch({capacity:null})).body.capacity,null,"unlimited is always allowed");
  assert.equal((await patch({capacity:4})).body.capacity,4,"from unlimited, any value covering active students");
  // Revoked enrollments do not count as active.
  await pool.query("UPDATE enrollments SET active=false WHERE section_id=$1 AND role<>'teacher'",[f.s1]);
  await patch({capacity:null});assert.equal((await patch({capacity:1})).body.capacity,1);
  // Legacy rows keep their stored zero: readable and editable without touching capacity.
  const legacy=randomUUID();
  await pool.query("INSERT INTO sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,'LEGACY',0)",[legacy,f.tenants.uc,f.own]);
  assert.equal((await request(app,owner,`uc/sections/${legacy}`)).body.capacity,0);
  const renamed=await request(app,owner,`uc/sections/${legacy}`,"PATCH",{code:"LEGACY-2"});
  assert.equal(renamed.status,200);assert.equal(renamed.body.capacity,0);
 }finally{if(app)await app.close();await pool.end();}
});
