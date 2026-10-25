import assert from "node:assert/strict";
import { test } from "node:test";
import { academicSeedConfig } from "../dist/seeds/demo-academics.js";
import { academicDemoManifest } from "../dist/seeds/demo-academic-manifest.js";

test("academic seed is opt-in and validates operator reference before any connection", () => {
  assert.equal(academicSeedConfig({}), undefined);
  assert.equal(academicSeedConfig({DEMO_ACADEMIC_DATA_ENABLED:"false"}), undefined);
  assert.deepEqual(academicSeedConfig({DEMO_ACADEMIC_DATA_ENABLED:"true",DEMO_OPERATOR_REF:" local-demo "}), {operatorRef:"local-demo"});
  for(const value of ["", "TRUE", "1", "yes"])
    assert.throws(()=>academicSeedConfig({DEMO_ACADEMIC_DATA_ENABLED:value}), e=>e.category==="config");
  for(const value of [undefined, "", " ", "x".repeat(201), "line\nbreak"])
    assert.throws(()=>academicSeedConfig({DEMO_ACADEMIC_DATA_ENABLED:"true",DEMO_OPERATOR_REF:value}), e=>e.category==="config");
});

test("academic manifest assigns distinct tenant resources with existing demo identities", () => {
  assert.deepEqual(academicDemoManifest.map(t=>t.slug), ["uc","utfsm"]);
  const ids=academicDemoManifest.flatMap(t=>[t.courseId,t.sectionId,t.teacherEnrollmentId,t.studentEnrollmentId]);
  assert.equal(new Set(ids).size,8);
  assert.equal(new Set(academicDemoManifest.map(t=>t.teacherId)).size,2);
  assert.ok(academicDemoManifest.every(t=>t.studentId==="10000000-0000-4000-8000-000000000003" && t.teacherId!==t.studentId));
});
