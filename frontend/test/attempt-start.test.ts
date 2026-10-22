import assert from "node:assert/strict";
import {test} from "node:test";
import {AttemptOperations} from "../src/lib/attempts/operations.ts";
import {mount,reply,attempt,cancelled,quiz,course,user,deferred,otherSection,boundedQuiz} from "./fixtures/attempts.ts";
test("start double action, lost response stable key and GET current after historical replay",async()=>{
 const wait=deferred<Response>();let posts=0;
 const ui=await mount(null,r=>r.method==="POST"? (++posts===1?wait.promise:Response.json(attempt,{status:201})):reply(r,cancelled),"student");
 const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz);
 try{
 const first=ops.start(attempt.sectionId);await ops.start(attempt.sectionId);wait.reject(new Error("lost"));await first;
 assert.equal(ops.getSnapshot().pending,"start");await ops.replay();assert.equal(ops.getSnapshot().attempt?.status,"cancelled");
 const req=ui.requests.filter(r=>r.url.endsWith("/attempts"));assert.equal(req.length,2);assert.equal(req[0].headers.get("Idempotency-Key"),req[1].headers.get("Idempotency-Key"));
 assert.equal(ui.requests.filter(r=>r.url.includes("/quiz-attempts/")).length,1);
 }finally{ops.dispose();await ui.close();}
});
test("start conflict keeps original destination/key; no inferred availability or discovery",async()=>{
 const ui=await mount(null,r=>r.method==="POST"?Response.json({}, {status:409}):reply(r),"student");
 const ops=new AttemptOperations(ui.session,"uc",user("student"),course,quiz);
 try{await ops.start(attempt.sectionId);await ops.start(attempt.sectionId);const req=ui.requests.filter(r=>r.url.endsWith("/attempts"));assert.equal(req.length,2);assert.equal(req[0].headers.get("Idempotency-Key"),req[1].headers.get("Idempotency-Key"));assert.equal(ops.getSnapshot().attempt,undefined);}finally{ops.dispose();await ui.close();}
});

test("an explicit student section fixes the target even after rejection",async()=>{
 const second={...user('student'),sectionMemberships:[...user('student').sectionMemberships,{...user('student').sectionMemberships[0],sectionId:course.id}]};
 const ui=await mount(null,()=>Response.json({},{status:409}),'student');const ops=new AttemptOperations(ui.session,'uc',second,course,{...quiz,sectionId:null});
 try{await ops.start(course.id);await ops.start(attempt.sectionId);const req=ui.requests.filter(r=>r.url.endsWith('/attempts'));assert.equal(req.length,1);assert.ok(req[0].url.includes(`/sections/${course.id}/`));}finally{ops.dispose();await ui.close();}
});

test("GET following start cannot replace the explicit historical section",async()=>{
 const ui=await mount(null,r=>r.method==='POST'?Response.json(attempt,{status:201}):reply(r,{...attempt,sectionId:otherSection.id}),'student');
 const ops=new AttemptOperations(ui.session,'uc',user('student'),course,quiz);
 try{await ops.start(attempt.sectionId);assert.equal(ops.getSnapshot().attempt,undefined);assert.equal(ops.getSnapshot().pending,'start');assert.equal(ops.getSnapshot().knownId,attempt.id);}finally{ops.dispose();await ui.close();}
});

test("bounded window and maximum remain server-authorized, with no fabricated availability",async()=>{
 const ui=await mount(null,()=>Response.json({},{status:409}),'student');
 const ops=new AttemptOperations(ui.session,'uc',user('student'),course,boundedQuiz);
 try{await ops.start(attempt.sectionId);assert.equal(ui.requests.filter(r=>r.url.endsWith('/attempts')).length,1);assert.equal(ops.getSnapshot().attempt,undefined);assert.match(ops.getSnapshot().message,/Conflicto/);}finally{ops.dispose();await ui.close();}
});
