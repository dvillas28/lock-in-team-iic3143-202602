import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiClient } from "../src/lib/api/client.ts";
import { listCourseQuizzes, getQuiz, createQuiz, updateQuiz, getQuizAuthoringView } from "../src/lib/api/quizzes.ts";
import { draft, question, course, section, id } from "./fixtures/quizzes.ts";
const client = (value: unknown, requests: Request[] = []) => createApiClient({baseUrl:"https://api.test",fetch:async r=>{requests.push(r as Request);return Response.json(value);}});
test("safe projections discard answer key/creator; tenant paths and parent relations validated", async()=>{
 for(const slug of ["uc","utfsm"]) {
 const requests:Request[]=[]; const safe=await getQuiz(client(draft,requests),slug,course.id,draft.id);
 assert.equal(JSON.stringify(safe).includes("isCorrect"),false);assert.equal("createdBy" in safe,false);
 assert.match(requests[0].url,new RegExp(`/institution/${slug}/quizzes/`));
 const items=await listCourseQuizzes(client({items:[draft]}),slug,course.id,section.id);
 assert.equal("questions" in items[0],false);
 await assert.rejects(getQuiz(client({...draft,courseId:id(11)}),slug,course.id,draft.id));
 await assert.rejects(getQuiz(client({...draft,id:id(99)}),slug,course.id,draft.id));
 await assert.rejects(listCourseQuizzes(client({}),slug,course.id));
 }
 await assert.rejects(listCourseQuizzes(client({items:[]}),"bad slug",course.id));
 await assert.rejects(listCourseQuizzes(client({items:[]}),"uc",course.id,"invalid"));
});
test("create empty draft; PATCH omits unchanged destination, retains UUID and omits new question id",async()=>{
 const requests:Request[]=[];
 await createQuiz(client({...draft,questions:[]},requests),"uc",course.id,{title:draft.title,sectionId:section.id,questions:[]});
 assert.deepEqual(await requests[0].clone().json(),{title:draft.title,sectionId:section.id,questions:[]});
 const {id: questionId,...fresh}=question;
 const next={...draft,questions:[question,{...fresh,id:id(62),position:2}]};
 await updateQuiz(client(next,requests),"uc",draft,{questions:[question,{...fresh,position:2}]});
 const body=await requests[1].clone().json();assert.equal("sectionId" in body,false);assert.equal(body.questions[0].id,questionId);assert.equal("id" in body.questions[1],false);
 await updateQuiz(client({...draft,sectionId:null},requests),"uc",draft,{sectionId:null});assert.equal((await requests[2].clone().json()).sectionId,null);
 assert.equal((await getQuizAuthoringView(client(draft),"uc",course.id,draft.id)).questions[0].alternatives[0].isCorrect,true);
 await assert.rejects(createQuiz(client(draft),"uc",course.id,{title:"x",questions:[question]}));
 for(const value of [{...draft,questions:[{...question,id:"bad"}]},{...draft,status:"published"}, {...draft,questions:[{...question,alternatives:[]}]}]) await assert.rejects(getQuizAuthoringView(client(value),"uc",course.id,draft.id));
});
