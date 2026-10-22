import assert from "node:assert/strict";
import { test } from "node:test";
import * as v from "../src/lib/courses/validation.ts";
import { capabilities } from "../src/lib/courses/capabilities.ts";
import { listCourses, getCourse } from "../src/lib/api/courses.ts";
import { listSections, getSection } from "../src/lib/api/sections.ts";
import { createApiClient } from "../src/lib/api/client.ts";
import { course, section, user, id, failureStatuses } from "./fixtures/courses.ts";

test("DTO validation checks UUID, owner, relation and malformed lists",()=>{
 assert.deepEqual(v.course(course),course); assert.deepEqual(v.section(section,course.id),section);
 for(const x of [{},null,{...course,id:"bad"},{...course,createdBy:"bad"},{...course,name:""}]) assert.throws(()=>v.course(x));
 assert.throws(()=>v.section(section,id(99))); assert.throws(()=>v.courseList({}));
 assert.throws(()=>v.course({...course,id:id(11)},course.id));
});
test("forms trim Unicode, preserve null/zero and reject empty PATCH",()=>{
 assert.equal(v.text(" 😀 ",1,"name"),"😀"); assert.throws(()=>v.text("😀😀",1,"name"));
 assert.equal(v.capacity(""),null);assert.equal(v.capacity("0"),0);assert.equal(v.capacity("2147483647"),2147483647);
 for(const x of ["-1","1.5","2147483648","bad"])assert.throws(()=>v.capacity(x));
 assert.throws(()=>v.changed({code:"x"},{code:"x"}));assert.deepEqual(v.changed({code:"y"},{code:"x"}),{code:"y"});
});
test("capabilities require active admin, confirmed ownership and contextual teacher",()=>{
 for(const p of ["owner","ownerTeacher","foreign","teacher","assistant","student","super","multi"]){
  const u=user(p),c=capabilities(u,course,section);
  assert.equal(c.configure,["owner","ownerTeacher"].includes(p));assert.equal(c.manage,["owner","ownerTeacher","foreign","teacher","multi"].includes(p));
  assert.equal(c.search,["ownerTeacher","foreign","teacher","multi"].includes(p));
  assert.equal(capabilities(u,undefined).configure,false);
  assert.equal(capabilities(u,{id:course.id,code:course.code,name:course.name,term:course.term}).configure,false);
 }
 assert.equal(capabilities(user("teacher"),course,{...section,id:id(99)}).manage,false);
 const base=user();const u={...base,institutionMembership:{...base.institutionMembership,active:false}};assert.equal(capabilities(u,course,section).create,false);
});
test("reads use institutional OpenAPI client, validate relation and do not N+1",async()=>{
 for(const slug of ["uc","utfsm"]){
  const requests:Request[]=[];const client=createApiClient({baseUrl:"https://api.test",getToken:()=>"test",fetch:async input=>{const r=input as Request;requests.push(r);return Response.json(r.url.endsWith('/sections')?{items:[section]}:r.url.includes('/sections/')?section:r.url.endsWith(course.id)?course:{items:[course]});}});
  assert.equal((await listCourses(client,slug))[0].id,course.id);await getCourse(client,slug,course.id);await listSections(client,slug,course.id);await getSection(client,slug,section.id,course.id);
  assert.equal(requests.length,4);assert.ok(requests.every(r=>r.url.includes(`/institution/${slug}/`)&&r.headers.get('Authorization')==='Bearer test'&&r.cache==='no-store'));
  await assert.rejects(getCourse(client,slug,"bad"));
 }
});
test("all HTTP read failures remain failures, including absent routes",async()=>{
 for(const status of failureStatuses){const client=createApiClient({baseUrl:"https://api.test",fetch:async()=>Response.json({}, {status})});await assert.rejects(listCourses(client,"uc"));}
});
