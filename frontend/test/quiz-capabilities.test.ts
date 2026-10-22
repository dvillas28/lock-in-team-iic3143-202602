import assert from "node:assert/strict";
import { test } from "node:test";
import { canAuthor, destinations } from "../src/lib/quizzes/capabilities.ts";
import { course, section, otherSection, user } from "./fixtures/courses.ts";
test("authoring requires active teaching, validates original and destination; ownership alone insufficient", () => {
 for (const role of ["owner", "super", "assistant", "student"]) assert.equal(canAuthor(user(role), course, [section,otherSection], section.id), false);
 for (const role of ["teacher","multi","ownerTeacher"]) {
  assert.equal(canAuthor(user(role),course,[section,otherSection],section.id),true);
  assert.equal(canAuthor(user(role),course,[section,otherSection],null),role==="ownerTeacher");
  assert.equal(canAuthor(user(role),course,[section,otherSection],otherSection.id),role==="ownerTeacher");
 }
 const actor=user("teacher"); const revoked={...actor,institutionMembership:{...actor.institutionMembership,active:false}};
 assert.equal(canAuthor(revoked,course,[section],section.id),false);
 assert.equal(canAuthor(user("foreign"),course,[section,otherSection],null),false);
 assert.equal(canAuthor(user("teacher"),course,[{...section,courseId:otherSection.id}],section.id),false);
 assert.deepEqual(destinations(user("teacher"),course,[section,otherSection]).map(s=>s.id),[section.id]);
});
