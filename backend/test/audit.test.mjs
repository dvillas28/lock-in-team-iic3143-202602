import assert from "node:assert/strict";
import {test} from "node:test";
import audit from "../dist/audit/audit.service.js";

test("audit persists only the allowed snapshot fields for every resource",async()=>{
 const resources={
  quiz:{id:"q",courseId:"c",sectionId:"s",title:"Quiz",opensAt:null,closesAt:null,maxAttempts:null,publishedAt:null,createdBy:"u",questionCount:1,totalPoints:2,gradeItemId:"g"},
  courseModule:{id:"module",courseId:"c",title:"Module",position:1,publishedAt:null},
  material:{id:"item",moduleId:"module",title:"Source",kind:"markdown",markdownBody:"historical",publishedAt:null,createdBy:"u"},
  course:{code:"C",name:"Course",term:"2026-2",createdBy:"owner"},
  section:{code:"1",capacity:42},
  enrollment:{id:"e",userId:"u",sectionId:"s",role:"teacher",active:true},
  institutionMembership:{id:"m",userId:"u",isAdmin:false,isSuperAdmin:true,source:"operatorMigration",operatorRef:"PM",operationId:"op",inputFingerprint:"fingerprint"},
 };
 const secrets={password:"secret-password",password_hash:"secret-hash",email:"secret@example.test",token:"secret-token",sql:"secret-sql",payload:{password:"nested-secret"},questions:[{isCorrect:true}],instructions:"private"};
 for(const [resourceType,allowed] of Object.entries(resources)){
  let persisted;
  const client={query:async(_sql,args)=>{persisted=args[8];}};
  await new audit.AuditService().record(client,{institutionId:"i",actorUserId:"u",action:"test",resourceType,resourceId:"r",
   before:{...allowed,...secrets},after:{...allowed,...secrets}});
  assert.deepEqual(persisted,{before:allowed,after:allowed});
  assert.equal(audit.snapshot(resourceType,null),null);
 }
});

test("reorder snapshots project nested id/position without expanding ordinary course snapshots",()=>{
 assert.deepEqual(audit.snapshot("moduleOrder",{modules:[{id:"m",position:1,secret:"discard"}],secret:"discard"}),{modules:[{id:"m",position:1}]});
 assert.deepEqual(audit.snapshot("course",{modules:[{id:"m",position:1}]}),{});
});
