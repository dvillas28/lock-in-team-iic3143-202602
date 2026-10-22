import assert from "node:assert/strict";
import {test} from "node:test";
import {attemptCapabilities, startSections} from "../src/lib/attempts/capabilities.ts";
import {attempt, historical, quiz, course, section, otherSection, user, revoked, id} from "./fixtures/attempts.ts";
test("student owner without pauta; historical section is not current enrollment",()=>{
 assert.equal(attemptCapabilities(user("student"),course,quiz,historical).edit,true);
 assert.equal(attemptCapabilities(user("student"),course,quiz,{...attempt,studentId:id(90)}).edit,false);
 assert.equal(attemptCapabilities(revoked,course,quiz,attempt).cancel,false);
 assert.equal(startSections(user("student"),course,quiz,[section,otherSection]).length,1);
 const scoped={...quiz,sectionId:section.id};
 assert.equal(startSections(user("multi"),course,scoped,[section]).length,0);
 assert.equal(attemptCapabilities(user("multi"),course,scoped,attempt).edit,false);
});
test("teacher historical or owner admin teacher; assistant/admin alone never cancel",()=>{
 for(const p of ["teacher","ownerTeacher","assistant","owner","foreign","super"]) {
 const cap=attemptCapabilities(user(p),course,quiz,{...attempt,studentId:id(90)});
 assert.equal(cap.cancel,["teacher","ownerTeacher","foreign"].includes(p));
 }
 assert.equal(attemptCapabilities(user("teacher"),course,quiz,{...historical,studentId:id(90)}).cancel,false);
 assert.equal(attemptCapabilities(user("ownerTeacher"),course,quiz,{...historical,studentId:id(90)}).cancel,true);
});
