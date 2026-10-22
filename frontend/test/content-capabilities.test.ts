import assert from "node:assert/strict";
import {test} from "node:test";
import {canAuthorContent} from "../src/lib/content/capabilities.ts";
import {course,user,secondTeacher,id} from "./fixtures/content.ts";
test("content requires active teacher of any section, independent of administration",()=>{
 for(const profile of ["teacher","ownerTeacher","multi"])assert.equal(canAuthorContent(user(profile),course.id),true);
 assert.equal(canAuthorContent(secondTeacher,course.id),true);
 for(const profile of ["student","assistant","owner","super"])assert.equal(canAuthorContent(user(profile),course.id),false);
 assert.equal(canAuthorContent(user("teacher"),id(11)),false);
 const inactive=user("teacher");
 assert.equal(canAuthorContent({...inactive,institutionMembership:{...inactive.institutionMembership,active:false}},course.id),false);
 assert.equal(canAuthorContent({...inactive,institutionMembership:{...inactive.institutionMembership,institution:{...inactive.institutionMembership.institution,active:false}}},course.id),false);
});
