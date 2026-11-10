import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { database,http,runtimeDatabase } from "./helpers.mjs";
import { failAudit,restoreAudit } from "./course-fixtures.mjs";
import { quizFixture,tokens,users,request,question } from "./quiz-fixtures.mjs";

test("assignments and quizzes share defaults, enforce scope and preserve gradebook history",async()=>{
 const pool=await database();let app;
 try {
  const f=await quizFixture(pool);
  app=await http();
  const t=await tokens(app,f), course=`uc/courses/${f.own}`, path=course+"/assignments";
  const call=(actor,suffix="",method="GET",body)=>request(app,t[actor],path+suffix,method,body);
  const first={id:randomUUID(),title:"Informe de laboratorio",maxPoints:0,sectionId:f.s1,
   allowedExtensions:["PDF",".docx","pdf"],maxAttempts:null,instructions:"Incluye las observaciones del laboratorio."};
  const second={...first,id:randomUUID(),title:"Lectura sin fecha"};
  assert.equal((await call("student","","POST",first)).status,403);
  assert.equal((await call("teacher","","POST",{...first,sectionId:null})).status,403);
  assert.equal((await call("teacher","","POST",{...first,sectionId:f.s3})).status,404);
  assert.equal((await call("teacher","","POST",{...first,groupId:randomUUID()})).status,422);
  assert.equal((await call("teacher","","POST",{...first,dueAt:"2026-02-30T00:00:00Z"})).status,400);
  assert.equal((await call("teacher","","POST",{...first,availableFrom:"2026-04-05T03:00:00Z",availableUntil:"2026-04-05T02:59:59.999999Z"})).status,422);
  assert.equal((await call("teacher","","POST",{...first,allowedExtensions:["../../pdf"]})).status,400);
  assert.equal((await call("teacher","","POST",{...first,id:randomUUID(),allowedExtensions:[]})).status,422);
  assert.equal((await call("teacher","","POST",{...first,id:randomUUID(),allowedExtensions:["odt"]})).status,422);
  const created=await Promise.all([first,second,first].map(body=>call("teacher","","POST",body)));
  assert.deepEqual(created.map(r=>r.status),[201,201,201]);
  const a=created[0].body, b=created[1].body;
  assert.equal(a.groupId,b.groupId);
  assert.deepEqual(a.allowedExtensions,["docx","pdf"]);
  assert.equal(a.weightPercent,100);
  assert.equal(a.maxPoints,0);
  assert.deepEqual((await call("student")).body.items,[]);
  assert.equal((await call("student","/"+a.id)).status,404);
  assert.equal((await call("assistant")).status,403);
  assert.equal((await call("admin")).status,404);
  assert.equal((await call("teacher","","POST",{...first,title:"Different request"})).status,409);

  const gradeItems=()=>request(app,t.owner,course+"/grade-items");
  const before=await gradeItems();
  assert.equal(before.body.items.length,2);
  assert.equal(before.body.items.find(i=>i.assignmentId===a.id).quizId,null);
  const groups=before.body.groups.map(g=>({id:g.id,weightPercent:g.weightPercent,title:"Trabajos",gradeItemIds:before.body.items.map(i=>i.id)}));
  const renamed=await request(app,t.owner,course+"/gradebook/groups","PUT",{
   expectedVersion:before.body.version,confirmRecalculation:false,groups,
  });
  assert.equal(renamed.status,200);
  const third=await call("teacher","","POST",{...first,id:randomUUID()});
  assert.equal(third.body.groupTitle,"Trabajos");
  assert.equal(third.body.groupId,a.groupId);
  const quiz=await request(app,t.teacher,course+"/quizzes","POST",{title:"Control",sectionId:f.s1,questions:[question]});
  assert.equal(quiz.status,201);
  const after=await gradeItems();
  assert.deepEqual(after.body.groups.map(g=>[g.title,g.weightPercent]),[["Trabajos",100],["Quizzes",0]]);
  const quizGroup=after.body.groups[1].id;
  assert.equal(quiz.body.groupId,quizGroup);
  assert.equal((await request(app,t.teacher,`uc/quizzes/${quiz.body.id}`,"PATCH",{groupId:a.groupId})).body.groupId,a.groupId);
  assert.equal((await request(app,t.teacher,`uc/quizzes/${quiz.body.id}/publish`,"POST")).status,200);
  assert.equal((await gradeItems()).body.items.find(i=>i.quizId===quiz.body.id).groupId,a.groupId);

  const suffix="/"+a.id,visibility=suffix+"/visibility";
  const future=(hours)=>new Date(Date.now()+hours*3600000).toISOString();
  const schedule={availableFrom:future(1),dueAt:future(2),availableUntil:future(3)};
  assert.equal((await call("teacher",suffix,"PATCH",{expectedVersion:0,...schedule,groupId:quizGroup})).status,200);
  const pub=await call("teacher",visibility,"PATCH",{expectedVersion:1,published:true});
  assert.equal(pub.status,200);
  assert.equal(pub.body.weightPercent,0);
  assert.equal((await call("teacher",visibility,"PATCH",{expectedVersion:1,published:true})).body.version,2);
  assert.equal((await call("student",suffix)).body.instructions,first.instructions);
  assert.equal((await request(app,t.assistant,course+"/grade-items")).body.items.some(i=>i.assignmentId===a.id),false);
  assert.equal((await call("student",suffix,"PATCH",{expectedVersion:2,title:"No"})).status,403);
  assert.equal((await call("teacher",suffix,"PATCH",{expectedVersion:1,title:"Stale"})).status,409);
  assert.equal((await call("teacher",suffix,"PATCH",{expectedVersion:2,maxPoints:12.5})).body.status,"published");
  assert.equal((await call("teacher",suffix,"PATCH",{expectedVersion:3,allowedExtensions:["odt"]})).status,422);
  assert.equal((await call("teacher",visibility,"PATCH",{expectedVersion:3,published:false})).body.status,"hidden");
  assert.equal((await call("student",suffix)).status,404);
  assert.equal((await call("teacher",visibility,"PATCH",{expectedVersion:4,published:true})).status,200);
  assert.equal((await request(app,t.owner,path.replace(/^uc/,"utfsm")+suffix)).status,404);
  assert.equal((await request(app,t.owner,`uc/courses/${f.other}/assignments/${a.id}`)).status,404);
  const mine=await request(app,t.student,course+"/my-grades");
  assert.deepEqual(mine.body.items,[]);
  assert.equal(mine.body.partialAverage,null);
  await pool.query("UPDATE enrollments SET active=false WHERE section_id=$1 AND user_id=$2",[f.s1,users.revoked]);
  assert.equal((await call("student",suffix)).status,404);
  const events=await pool.query("SELECT action FROM audit_events WHERE resource_id=$1 AND resource_type='assignment'",[a.id]);
  assert.equal(events.rowCount,6);
  const global=await call("owner","","POST",{...first,id:randomUUID(),sectionId:null,title:"Tarea para el curso"});
  assert.equal(global.status,201);
  assert.equal((await call("owner","/"+global.body.id+"/visibility","PATCH",{expectedVersion:0,published:true})).status,200);
  await f.add(f.s2,users.revoked,"student");
  const visible=await call("student");
  assert.deepEqual(visible.body.items.map(i=>i.id),[global.body.id]);
  const db=await runtimeDatabase();
  try {
   await db.withInstitution(users.owner,"utfsm",async c=>{
    assert.equal((await c.query("SELECT id FROM assignments WHERE id=$1",[a.id])).rowCount,0);
   });
  } finally {await db.onApplicationShutdown();}
 } finally {if(app)await app.close();await pool.end();}
});

test("deadlines reject new or changed past due dates while preserving historical values",async()=>{
 const pool=await database();let app;
 try {
  const f=await quizFixture(pool);
  app=await http();
  const t=await tokens(app,f);
  const path=`uc/courses/${f.own}/assignments`;
  const dueAt="2027-04-05T03:30:00.123456Z";
  const body={id:randomUUID(),title:"Evaluación histórica",maxPoints:0,sectionId:f.s1,dueAt};
  const create=(input,actor="teacher")=>request(app,t[actor],path,"POST",input);
  const edit=input=>request(app,t.teacher,path+"/"+body.id,"PATCH",input);
  const rejected=await create(body);
  assert.equal(rejected.status,422);
  assert.equal(rejected.body.code,"ASSIGNMENT_DUE_DATE_IN_PAST");
  assert.equal((await pool.query("SELECT id FROM assignments")).rowCount,0);
  const past=await create({...body,dueAt:"2026-04-05T03:30:00.123456Z"});
  assert.equal(past.status,422);
  assert.equal(past.body.code,"ASSIGNMENT_DUE_DATE_IN_PAST");
  const saved=await create(body);
  assert.equal(saved.status,201);
  assert.equal(saved.body.dueAt,dueAt);
  assert.equal((await create(body)).body.id,body.id);
  const undated=await create({id:randomUUID(),title:"Sin fecha",maxPoints:0,sectionId:f.s1});
  assert.equal(undated.status,201);
  const rename=await edit({expectedVersion:0,title:"Evaluación corregida",dueAt});
  assert.equal(rename.status,200);
  assert.equal(rename.body.dueAt,dueAt);

  const older="2000-01-01T00:00:00Z";
  const change=await edit({expectedVersion:1,dueAt:older});
  assert.equal(change.status,422);
  assert.equal(change.body.code,"ASSIGNMENT_DUE_DATE_IN_PAST");
  const updated=await edit({expectedVersion:1,title:"Evaluación corregida"});
  assert.equal(updated.status,200);
  assert.equal(updated.body.dueAt,dueAt);
  assert.equal((await request(app,t.owner,path.replace(/^uc/,"utfsm")+"/"+body.id,"PATCH",
   {expectedVersion:2,dueAt,confirmPastDue:true})).status,404);
  assert.equal((await request(app,t.teacher,path+"/"+body.id+"/visibility","PATCH",
   {expectedVersion:2,published:true})).status,200);
  assert.equal((await request(app,t.student,path+"/"+body.id)).body.dueAt,updated.body.dueAt);
 } finally {if(app)await app.close();await pool.end();}
});

test("direct publication is atomic for creation and edits and can be retried",async()=>{
 const pool=await database();let app;
 try {
  const f=await quizFixture(pool);
  app=await http();
  const t=await tokens(app,f), path=`uc/courses/${f.own}/assignments`;
  const body={id:randomUUID(),title:"Publicación directa",sectionId:f.s1,maxPoints:10,allowedExtensions:["pdf"],publish:true};
  const create=(input=body,actor="teacher")=>request(app,t[actor],path,"POST",input);
  const student=id=>request(app,t.student,path+"/"+id);
  const events=async id=>(await pool.query("SELECT action FROM audit_events WHERE resource_id=$1 ORDER BY action",[id])).rows.map(r=>r.action);
  assert.equal((await create(body,"student")).status,403);
  assert.equal((await create({...body,dueAt:"2000-01-01T00:00:00Z"})).body.code,"ASSIGNMENT_DUE_DATE_IN_PAST");
  await failAudit(pool,"assignment.published",body.id);
  try {assert.equal((await create()).status,500);}
  finally {await restoreAudit(pool);}
  assert.equal((await pool.query("SELECT id FROM assignments WHERE id=$1",[body.id])).rowCount,0);
  assert.equal((await pool.query("SELECT id FROM grade_items WHERE assignment_id=$1",[body.id])).rowCount,0);
  assert.deepEqual(await events(body.id),[]);

  const pair=await Promise.all([create(),create()]);
  assert.deepEqual(pair.map(r=>r.status),[201,201]);
  assert.deepEqual(pair[0].body,pair[1].body);
  assert.equal(pair[0].body.status,"published");
  assert.equal((await student(body.id)).status,200);
  assert.deepEqual(await events(body.id),["assignment.created","assignment.published"]);
  assert.equal((await create({...body,publish:false})).status,409);

  const draftId=randomUUID();
  const draft=await create({...body,id:draftId,publish:false,title:"Borrador"});
  assert.equal(draft.body.status,"draft");
  assert.equal((await student(draftId)).status,404);
  const changes={expectedVersion:draft.body.version,publish:true,title:"Borrador revisado"};
  const update=()=>request(app,t.teacher,path+"/"+draftId,"PATCH",changes);
  await failAudit(pool,"assignment.published",draftId);
  try {assert.equal((await update()).status,500);}
  finally {await restoreAudit(pool);}
  assert.equal((await request(app,t.teacher,path+"/"+draftId)).body.title,"Borrador");
  assert.equal((await student(draftId)).status,404);
  const published=await update();
  assert.equal(published.body.status,"published");
  assert.equal((await student(draftId)).body.title,"Borrador revisado");
  assert.deepEqual((await update()).body,published.body);
  assert.deepEqual(await events(draftId),["assignment.created","assignment.published","assignment.updated"]);
 } finally {if(app)await app.close();await pool.end();}
});
