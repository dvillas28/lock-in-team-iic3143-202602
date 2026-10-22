import {test} from "node:test";
import assert from "node:assert/strict";
import {gradebookCapabilities} from "../src/lib/gradebook/capabilities.ts";
import {user,course,section,otherSection} from "./fixtures/gradebook.ts";
test("academic permissions require current academic roles; ownership only expands audit",()=>{
 for(const role of ['owner','super','student','assistant','teacher','ownerTeacher','multi']){
  const c=gradebookCapabilities(user(role),course);
  assert.equal(c.book,['assistant','teacher','ownerTeacher','multi'].includes(role));
  assert.equal(c.weights,role==='ownerTeacher');
  assert.equal(c.audit,['owner','teacher','ownerTeacher','multi'].includes(role));
  assert.equal(c.student,['student','multi'].includes(role));
 }
 assert.equal(gradebookCapabilities(user('teacher'),course,otherSection.id).book,false);
 assert.equal(gradebookCapabilities(user('ownerTeacher'),course,otherSection.id).publish,true);
 const revoked={...user('multi'),sectionMemberships:[]};assert.equal(gradebookCapabilities(revoked,course,section.id).book,false);
 const actor=user('ownerTeacher'),inactive={...actor,institutionMembership:{...actor.institutionMembership,active:false}};assert.equal(gradebookCapabilities(inactive,course).audit,false);
});
