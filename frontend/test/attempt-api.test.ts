import assert from "node:assert/strict";
import {test} from "node:test";
import {createApiClient} from "../src/lib/api/client.ts";
import {startAttempt,getAttempt,saveAnswers,submitAttempt,cancelAttempt} from "../src/lib/api/attempts.ts";
import {getQuiz} from "../src/lib/api/quizzes.ts";
import {attempt,quiz,receipt,answers,id,tenants} from "./fixtures/attempts.ts";
function client(value:unknown,requests:Request[]=[],status=200) {return createApiClient({baseUrl:"https://api.test",fetch:async r=>{requests.push(r as Request);return status===204?new Response(null,{status}):Response.json(value,{status});}});}
test("singular institutional paths, explicit section/key, full snapshot and no identity/pauta",async()=>{
 for(const slug of tenants){
 const requests:Request[]=[];
 await startAttempt(client(attempt,requests,201),slug,quiz.id,attempt.sectionId,id(90),attempt.studentId);
 assert.equal(new URL(requests[0].url).pathname,`/api/v1/institution/${slug}/sections/${attempt.sectionId}/quizzes/${quiz.id}/attempts`);
 assert.equal(requests[0].headers.get("Idempotency-Key"),id(90));assert.equal(await requests[0].text(),"");
 assert.deepEqual(await getAttempt(client(attempt),slug,attempt.id,{studentId:attempt.studentId}),attempt);
 for(const a of [answers,[]]){
 const saved={...attempt,answers:a};assert.deepEqual(await saveAnswers(client(saved,requests),slug,attempt,quiz,a),saved);
 assert.deepEqual(await requests.at(-1)!.json(),{answers:a});
 }
 await submitAttempt(client(receipt,requests),slug,attempt.id,id(91));assert.equal(requests.at(-1)!.headers.get("Idempotency-Key"),id(91));assert.equal(await requests.at(-1)!.text(),"");
 await cancelAttempt(client(null,requests,204),slug,attempt.id);assert.equal(requests.at(-1)!.headers.has("Idempotency-Key"),false);assert.equal(await requests.at(-1)!.text(),"");
 }
});
test("errors, crossed IDs, mismatched snapshot/receipt and unknown-course quiz validation",async()=>{
 for(const status of [400,401,403,404,409,413,415,422,503])await assert.rejects(saveAnswers(client({},[],status),"uc",attempt,quiz,answers));
 await assert.rejects(getAttempt(client({...attempt,id:id(99)}),"uc",attempt.id));
 await assert.rejects(saveAnswers(client(attempt),"uc",attempt,quiz,answers));
 await assert.rejects(submitAttempt(client({...receipt,grade:7}),"uc",attempt.id,id(91)));
 await assert.rejects(startAttempt(client(attempt),"uc",quiz.id,id(99),id(90),attempt.studentId));
 assert.equal((await getQuiz(client(quiz),"uc",undefined,quiz.id)).courseId,quiz.courseId);
 await assert.rejects(getQuiz(client({...quiz,courseId:"bad"}),"uc",undefined,quiz.id));
 await assert.rejects(getQuiz(client(quiz),"uc",id(99),quiz.id));
});
