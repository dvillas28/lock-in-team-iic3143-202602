import {test} from "node:test";
import assert from "node:assert/strict";
import {createApiClient} from "../src/lib/api/client.ts";
import {getStudentGrades} from "../src/lib/api/gradebook.ts";
import {mine,zero,empty,course,id} from "./fixtures/gradebook.ts";
test('my-grades only GET without query and preserves backend null/average',async()=>{
 for(const slug of ['uc','utfsm'])for(const data of [mine,zero,empty]){
  const c=createApiClient({baseUrl:'https://api.test',fetch:async r=>{const req=r as Request;assert.equal(req.method,'GET');assert.equal(new URL(req.url).search,'');assert.equal(new URL(req.url).pathname,`/api/v1/institution/${slug}/courses/${course.id}/my-grades`);return Response.json(data);}});
  assert.deepEqual(await getStudentGrades(c,slug,course.id),data);
 }
});
test('my-grades rejects wrong course, hidden/malformed values and errors',async()=>{
 for(const data of [{...mine,courseId:id(11)},{...mine,partialAverage:0},{...mine,items:[{...mine.items[0],publishedAt:null}]},{...mine,items:[...mine.items,...mine.items]}]){
  const c=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json(data)});await assert.rejects(()=>getStudentGrades(c,'uc',course.id));
 }
 for(const status of [401,403,404,503]){const c=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({}, {status})});await assert.rejects(()=>getStudentGrades(c,'uc',course.id));}
});
