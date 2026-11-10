import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { test } from "node:test";
import { AuditService } from "../../dist/audit/audit.service.js";
import { S3ObjectStorage } from "../../dist/academic-files/object-storage.js";
import { SubmissionsService } from "../../dist/assignments/submissions.service.js";
import { database, http, login, runtimeDatabase } from "./helpers.mjs";
import { quizFixture, request, users } from "./quiz-fixtures.mjs";

const pdf=Buffer.from("%PDF-1.7\n%%EOF");
const checksum=createHash("sha256").update(pdf).digest("hex");
const upload={buffer:pdf,originalname:"informe.pdf",mimetype:"application/pdf"};

test("assignment submissions keep evidence, authorization and gradebook publication consistent",async()=>{
 const pool=await database(), directory=await mkdtemp(join(tmpdir(),"submissions-"));
 let app, db;
 try {
  const f=await quizFixture(pool);
  await f.add(f.s1,users.inactive,"student");
  app=await http({ACADEMIC_STORAGE_DRIVER:"local",ACADEMIC_LOCAL_DIR:directory});
  const t={owner:await login(app,f.env),teacher:await login(app,f.env,"UC"),student:await login(app,f.env,"REVOKED")};
  const otherStudent=await login(app,f.env,"INACTIVE"), foreign=await login(app,f.env,"UTFSM");
  const course=`uc/courses/${f.own}`, path=course+"/assignments";
  const call=(token,suffix,method="GET",body)=>request(app,token,path+suffix,method,body);
  async function create(modalities,teacher=t.teacher) {
   const result=await call(teacher,"","POST",{idempotencyKey:randomUUID(),title:"Informe",maxPoints:10,
    sectionId:f.s1,publish:true,...modalities});
   assert.equal(result.status,201,JSON.stringify(result.body));
   return result.body.id;
  }
  const assignment=await create({allowedExtensions:["pdf"],allowWrittenResponse:true,maxAttempts:2});
  const route="/"+assignment, endpoint=route+"/my-submissions";
  const submit=(number, options={})=>{
   const form=new FormData();
   form.set("sectionId",options.section??f.s1);
   form.set("expectedAttempts",String(number));
   form.set("idempotencyKey",options.key??randomUUID());
   if (options.text!==undefined) form.set("writtenResponse",options.text);
   if (options.file) form.append("files",new Blob([options.file],{type:"application/pdf"}),"informe.pdf");
   return fetch(app.base+"/api/v1/institution/"+path+(options.endpoint??endpoint),{
    method:"POST",headers:{Authorization:`Bearer ${options.token??t.student}`},body:form,
   });
  };
  const window=async(open,close,due)=>pool.query(`UPDATE assignments SET
   available_from=clock_timestamp()+$2::interval,available_until=clock_timestamp()+$3::interval,
   due_at=clock_timestamp()+$4::interval WHERE id=$1`,[assignment,open,close,due]);
  await window("1 hour",null,null);
  assert.equal((await submit(0,{text:"Aún no"})).status,409);
  await window("-2 hours",null,"-1 hour");
  for (const text of [" ** _ ", "- \n1.", "&nbsp; &#8203;", "<b></b>", "[id]: https://example.test"]) {
   assert.equal((await submit(0,{text})).status,422);
  }
  assert.equal((await submit(0,{text:"wrong section",section:f.s2})).status,403);
  assert.equal((await submit(0,{file:Buffer.from("fake pdf")})).status,415);
  assert.equal((await submit(0,{text:"ok",token:t.teacher})).status,403);

  const key=randomUUID(), payload={key,text:"**Primera versión**\n\n- Evidencia",file:pdf};
  const concurrent=await Promise.all([submit(0,payload),submit(0,payload),submit(0,{...payload,key:randomUUID()})]);
  const accepted=await Promise.all(concurrent.filter(response=>response.status===201).map(response=>response.json()));
  assert.ok(accepted.length===1 || accepted.length===2);
  assert.ok(concurrent.every(response=>[201,409].includes(response.status)));
  assert.equal(new Set(accepted.map(attempt=>attempt.id)).size,1);
  const attempt=accepted[0], file=attempt.files[0];
  assert.equal(attempt.isLate,true);
  assert.equal(attempt.writtenResponse,payload.text);
  assert.equal(file.sha256,checksum);
  assert.equal(await pool.query("SELECT 1 FROM assignment_attempts WHERE assignment_id=$1",[assignment]).then(r=>r.rowCount),1);

  const download=route+"/submission-files/"+file.id;
  const getFile=(token,scope=path)=>fetch(app.base+"/api/v1/institution/"+scope+download,{
   headers:token ? {Authorization:`Bearer ${token}`} : undefined,
  });
  for (const token of [t.student,t.teacher]) {
   const downloaded=await getFile(token);
   assert.equal(downloaded.status,200);
   assert.equal(downloaded.headers.get("cache-control"),"no-store");
   assert.match(downloaded.headers.get("content-disposition"),/^attachment;/);
   assert.equal(createHash("sha256").update(Buffer.from(await downloaded.arrayBuffer())).digest("hex"),checksum);
  }
  assert.equal((await getFile()).status,401);
  assert.equal((await getFile(otherStudent)).status,404);
  assert.equal((await getFile(foreign,`utfsm/courses/${f.foreign}/assignments`)).status,404);
  const roster=(await call(t.teacher,route+"/submissions")).body;
  assert.ok(roster.students.some(s=>s.latestAttempt===null));
  assert.equal(roster.students.find(s=>s.studentId===users.revoked).isLate,true);
  assert.equal((await call(t.student,route+"/submissions")).status,403);
  assert.equal((await call(otherStudent,route+`/submission-review?sectionId=${f.s1}&studentId=${users.revoked}`)).status,403);

  const gradePath=route+"/submissions/"+attempt.id+"/grade";
  assert.equal((await call(t.teacher,gradePath,"PUT",{points:11,feedback:null,expectedUpdatedAt:null})).status,422);
  const grade=(await call(t.teacher,gradePath,"PUT",{points:7.5,feedback:"Bien argumentado",expectedUpdatedAt:null})).body;
  assert.equal(grade.pointsEarned,7.5,JSON.stringify(grade));
  assert.equal((await call(t.student,endpoint)).body.grade,null);
  assert.deepEqual((await request(app,t.student,course+"/my-grades")).body.items,[]);
  const publication={scope:"assignment",gradeItemId:roster.gradeItemId,grades:[{id:grade.id,expectedUpdatedAt:grade.updatedAt}]};
  const pubKey=randomUUID(), publicationPath=course+"/gradebook/publications";
  const publish=async(body,token=t.teacher,key=pubKey)=>{
   const response=await fetch(app.base+"/api/v1/institution/"+publicationPath,{method:"POST",
    headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","Idempotency-Key":key},body:JSON.stringify(body)});
   return {status:response.status,body:await response.json()};
  };
  assert.equal((await publish({...publication,grades:[{...publication.grades[0],expectedUpdatedAt:"2000-01-01T00:00:00Z"}]})).status,409);
  assert.equal((await publish(publication,t.student)).status,403);
  assert.equal((await publish(publication)).body.publishedCount,1);
  assert.equal((await publish(publication)).body.publishedCount,1);
  assert.equal((await call(t.student,endpoint)).body.grade.feedback,"Bien argumentado");
  assert.equal((await request(app,t.student,course+"/my-grades")).body.partialAverage,5.1);

  const next=await submit(1,{text:"Segunda versión"});
  assert.equal(next.status,201);
  const second=await next.json();
  assert.equal((await submit(2,{text:"Tercera versión"})).status,409);
  assert.equal((await call(t.student,endpoint)).body.grade.attemptId,attempt.id);
  const correctionPath=course+"/gradebook/grades/"+grade.id;
  const correction={revisionId:randomUUID(),expectedRevisionId:null,points:10,reason:"Revisión del segundo intento",attemptId:second.id};
  assert.equal((await request(app,t.teacher,correctionPath,"PATCH",correction)).body.attemptId,second.id);
  assert.equal((await request(app,t.teacher,correctionPath,"PATCH",correction)).body.attemptId,second.id);
  assert.equal((await request(app,t.student,course+"/my-grades")).body.partialAverage,7);
  const history=(await call(t.student,endpoint)).body;
  assert.deepEqual(history.attempts.map(a=>a.writtenResponse),["Segunda versión",payload.text]);
  const audit=(await pool.query("SELECT changes FROM audit_events WHERE resource_id=$1 AND action='grade.corrected'",[grade.id])).rows[0].changes;
  assert.equal(audit.before.attemptId,attempt.id);
  assert.equal(audit.after.attemptId,second.id);
  assert.equal(audit.after.reason,correction.reason);

  const textOnly=await create({allowWrittenResponse:true,allowedExtensions:[],maxPoints:0});
  const textRoute="/"+textOnly, textEndpoint=textRoute+"/my-submissions";
  assert.equal((await submit(0,{file:pdf,endpoint:textEndpoint})).status,422);
  const zero=await submit(0,{text:"Texto",endpoint:textEndpoint}).then(r=>r.json());
  const zeroGrade=(await call(t.teacher,textRoute+"/submissions/"+zero.id+"/grade","PUT",{points:0,feedback:"Recibido",expectedUpdatedAt:null})).body;
  assert.equal(zeroGrade.grade,null,JSON.stringify(zeroGrade));
  assert.equal((await publish({scope:"assignment",gradeItemId:zeroGrade.gradeItemId,
   grades:[{id:zeroGrade.id,expectedUpdatedAt:zeroGrade.updatedAt}]},t.teacher,randomUUID())).status,200);
  assert.equal((await request(app,t.student,course+"/my-grades")).body.partialAverage,7);
  assert.equal((await call(t.student,textEndpoint)).body.grade.scorePercent,null);
  await pool.query("UPDATE assignments SET available_until=clock_timestamp()-interval '1 second' WHERE id=$1",[textOnly]);
  assert.equal((await submit(1,{text:"Cerrada",endpoint:textEndpoint})).status,409);

  const shared=await create({sectionId:null,allowedExtensions:["pdf"]},t.owner);
  const fileOnlyEndpoint="/"+shared+"/my-submissions";
  assert.equal((await submit(0,{text:"Solo archivos",endpoint:fileOnlyEndpoint})).status,422);
  const bytesOnly=await submit(0,{file:pdf,endpoint:fileOnlyEndpoint});
  assert.equal(bytesOnly.status,201);
  const sharedFile=(await bytesOnly.json()).files[0];
  const teacher2=foreign;
  await pool.query(`INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)
   ON CONFLICT(institution_id,user_id) DO NOTHING`,[randomUUID(),f.tenants.uc,users.foreign]);
  await f.add(f.s2,users.foreign,"teacher",f.tenants.uc);
  const scoped=await call(teacher2,"/"+shared+"/submissions");
  assert.equal(scoped.status,200);
  assert.ok(scoped.body.students.every(student=>student.sectionId===f.s2));
  assert.equal((await getFile(teacher2,path)).status,404);
  assert.equal((await fetch(app.base+`/api/v1/institution/${path}/${shared}/submission-files/${sharedFile.id}`,{
   headers:{Authorization:`Bearer ${teacher2}`},
  })).status,404);

  db=await runtimeDatabase();
  const commands=[];
  const store=new S3ObjectStorage("synthetic",async command=>{
   commands.push(command);
   if (command.input.Key.split("/")[5]!==users.revoked) assert.fail("unexpected object owner");
   if (command.constructor.name==="PutObjectCommand" && commands.length===2) throw {name:"AccessDenied"};
   if (command.constructor.name==="GetObjectCommand") return {ContentLength:pdf.length,Body:Readable.from(Buffer.alloc(pdf.length))};
   return {};
  });
  const service=new SubmissionsService(db,new AuditService(),{objects:store});
  await assert.rejects(()=>service.submit(users.revoked,"uc",f.own,shared,{
   sectionId:f.s1,idempotencyKey:randomUUID(),expectedAttempts:"1",
  },[upload,{...upload,originalname:"otro.pdf"}]),error=>error.getResponse().code==="SUBMISSION_STORAGE_UNAVAILABLE");
  assert.deepEqual(commands.map(c=>c.constructor.name),["PutObjectCommand","PutObjectCommand","DeleteObjectCommand"]);
  assert.equal(commands[2].input.Key,commands[0].input.Key);
  assert.notEqual(commands[2].input.Key,commands[1].input.Key);
  assert.equal(commands[0].input.ChecksumSHA256,Buffer.from(checksum,"hex").toString("base64"));
  assert.match(commands[0].input.Key,new RegExp(`^academic/submissions/${f.tenants.uc}/${f.own}/${shared}/${users.revoked}/`));
  assert.equal((await call(t.student,fileOnlyEndpoint)).body.usedAttempts,1);
  await assert.rejects(()=>service.download(users.revoked,"uc",f.own,shared,sharedFile.id),error=>
   error.getResponse().code==="SUBMISSION_STORAGE_UNAVAILABLE");
 } finally {
  if(db) await db.onApplicationShutdown();
  if(app) await app.close();
  await rm(directory,{recursive:true,force:true});
  await pool.end();
 }
});
