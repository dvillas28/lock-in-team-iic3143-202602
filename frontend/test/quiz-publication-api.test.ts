import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiClient } from "../src/lib/api/client.ts";
import { publishQuiz, listCourseGradeItems } from "../src/lib/api/quizzes.ts";
import { course, draft, published, grade, id } from "./fixtures/quizzes.ts";
test("publish sends no body; repeat preserves timestamp; grade item real weight and relationships",async()=>{
 const requests:Request[]=[];const client=createApiClient({baseUrl:"https://api.test",fetch:async input=>{const r=input as Request;requests.push(r);return Response.json(r.method==='POST'?published:{items:[{...grade,weightPercent:23.45}],totalWeightPercent:23.45});}});
 for(let n=0;n<2;n++)assert.equal((await publishQuiz(client,'uc',course.id,draft.id)).publishedAt,published.publishedAt);
 assert.equal(await requests[0].clone().text(),'');
 assert.equal((await listCourseGradeItems(client,'uc',course.id))[0].weightPercent,23.45);
 assert.equal(requests.filter(r=>r.method==='POST').length,2);
 for(const items of [[{...grade,courseId:id(11)}],[grade,{...grade,id:id(71)}],[{...grade,weightPercent:NaN}],[{...grade,createdAt:'bad'}]]) {
 const c=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({items})});await assert.rejects(listCourseGradeItems(c,'uc',course.id));
 }
 const frozen=createApiClient({baseUrl:'https://api.test',fetch:async()=>Response.json({},{status:409})});await assert.rejects(publishQuiz(frozen,'uc',course.id,draft.id),e=>e instanceof Error && 'status' in e && e.status===409);
});
