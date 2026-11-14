import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { database,http } from "./helpers.mjs";
import { quizFixture,tokens,request } from "./quiz-fixtures.mjs";

const at=days=>new Date(Date.now()+days*86400000).toISOString();

test("calendar aggregates visible deadlines per role without crossing tenants",async()=>{
 const pool=await database();let app;
 try {
  const f=await quizFixture(pool);
  app=await http();
  const t=await tokens(app,f);
  const dated=async(options,opens,closes)=>{
   const id=await f.make(options);
   await pool.query("UPDATE quizzes SET opens_at=$2,closes_at=$3 WHERE id=$1",[id,opens,closes]);
   return id;
  };
  const q={
   section:await dated({published:true},at(1),at(3)),
   draft:await dated({},at(1),at(2)),
   otherSection:await dated({section:f.s2,published:true},at(2),at(4)),
   global:await dated({section:null,published:true},null,at(5)),
   globalDraft:await dated({section:null},at(5),at(6)),
   outside:await dated({published:true},at(60),at(61)),
   courseB:await dated({course:f.other,section:f.s3,published:true},at(2),at(3)),
   foreign:await dated({course:f.foreign,tenant:f.tenants.utfsm,section:f.s4,published:true,creator:"10000000-0000-4000-8000-000000000002"},at(1),at(2)),
  };
  const assignments=`uc/courses/${f.own}/assignments`;
  const create=async(title,sectionId,publish)=>{
   const r=await request(app,t.teacher,assignments,"POST",{idempotencyKey:randomUUID(),title,maxPoints:10,sectionId,
    allowedExtensions:["pdf"],maxAttempts:null,availableFrom:at(1),dueAt:at(7),availableUntil:at(9)});
   assert.equal(r.status,201);
   if(publish)assert.equal((await request(app,t.teacher,`${assignments}/${r.body.id}/visibility`,"PATCH",{expectedVersion:r.body.version,published:true})).status,200);
   return r.body.id;
  };
  const a={published:await create("Informe final",f.s1,true),draft:await create("Borrador privado",f.s1,false)};

  const range=`from=${encodeURIComponent(at(0))}&to=${encodeURIComponent(at(30))}`;
  const calendar=(actor,query=range,slug="uc")=>request(app,t[actor],`${slug}/calendar?${query}`);
  const ids=r=>r.body.events.map(e=>e.id).sort();

  const student=await calendar("student");
  assert.equal(student.status,200);
  assert.deepEqual(ids(student),[q.section,q.global,a.published].sort());
  const informe=student.body.events.find(e=>e.id===a.published);
  assert.equal(informe.kind,"assignment");
  assert.equal(informe.title,"Informe final");
  assert.equal(informe.course.id,f.own);
  assert.equal(informe.viewerRole,"student");
  assert.ok(informe.startsAt && informe.dueAt && informe.closesAt);
  const quiz=student.body.events.find(e=>e.id===q.global);
  assert.equal(quiz.kind,"quiz");assert.equal(quiz.startsAt,null);assert.equal(quiz.dueAt,null);

  const teacher=await calendar("teacher");
  assert.deepEqual(ids(teacher),[q.section,q.draft,q.otherSection,q.global,a.published,a.draft].sort());
  assert.equal(teacher.body.events.find(e=>e.id===q.draft).status,"draft");
  assert.equal(teacher.body.events.find(e=>e.id===a.draft).status,"draft");
  assert.ok(teacher.body.events.every(e=>e.viewerRole==="teacher"));

  const owner=await calendar("owner");
  assert.ok(ids(owner).includes(q.globalDraft));
  assert.ok(ids(owner).includes(q.courseB));
  assert.ok(!ids(owner).includes(q.foreign));

  assert.deepEqual((await calendar("assistant")).body.events,[]);
  assert.deepEqual((await calendar("admin")).body.events,[]);
  assert.equal((await calendar("student",range,"utfsm")).status,404);
  for(const events of [student,teacher,owner].map(r=>r.body.events)) {
   assert.ok(!events.some(e=>e.id===q.outside || e.id===q.foreign));
  }

  for(const bad of ["",`from=${encodeURIComponent(at(5))}&to=${encodeURIComponent(at(1))}`,
   `from=${encodeURIComponent(at(0))}&to=${encodeURIComponent(at(120))}`,`${range}&course=${f.own}`,"from=hoy&to=mañana"]) {
   assert.equal((await calendar("student",bad)).status,400,bad);
  }
 } finally {if(app)await app.close();await pool.end();}
});
