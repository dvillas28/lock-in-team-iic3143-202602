import type {ApiClient} from "./client.ts";
import {ApiResponseError} from "./errors.ts";
import {path} from "../courses/validation.ts";
import type {SafeQuiz} from "../quizzes/validation.ts";
import {attemptDto,answersInput,sameAnswers,submissionReceipt,type Attempt,type Answer,type Expected} from "../attempts/validation.ts";
function key(value:string) {
 if(!value.length||value.length>200||/[\x00-\x20\x7f]/.test(value))throw new TypeError("Clave inválida.");return {"Idempotency-Key":value};
}
export async function startAttempt(c:ApiClient,slug:string,quizId:string,sectionId:string,idempotencyKey:string,studentId:string) {
 const p=path(slug,{quizId,sectionId,studentId});
 const r=await c.POST("/api/v1/institution/{institutionSlug}/sections/{sectionId}/quizzes/{quizId}/attempts",{params:{path:{institutionSlug:p.institutionSlug,quizId,sectionId},header:key(idempotencyKey)}});
 return attemptDto(r.data,{quizId,sectionId,studentId});
}
export async function getAttempt(c:ApiClient,slug:string,attemptId:string,expected:Expected={staff:true}) {
 const r=await c.GET("/api/v1/institution/{institutionSlug}/quiz-attempts/{attemptId}",{params:{path:{...path(slug,{attemptId}),attemptId}}});
 return attemptDto(r.data,{...expected,id:attemptId});
}
export async function saveAnswers(c:ApiClient,slug:string,a:Attempt,quiz:SafeQuiz,answers:Answer[]) {
 if(a.quizId!==quiz.id)throw new TypeError("Quiz ajeno.");
 const body=answersInput(answers,quiz);
 const r=await c.PUT("/api/v1/institution/{institutionSlug}/quiz-attempts/{attemptId}/answers",{params:{path:{...path(slug,{attemptId:a.id}),attemptId:a.id}},body});
 const saved=attemptDto(r.data,{id:a.id,quizId:a.quizId,sectionId:a.sectionId,studentId:a.studentId});
 if(saved.status!=="inProgress"||!sameAnswers(saved.answers,body.answers))throw new ApiResponseError();return saved;
}
export async function submitAttempt(c:ApiClient,slug:string,attemptId:string,idempotencyKey:string) {
 const r=await c.POST("/api/v1/institution/{institutionSlug}/quiz-attempts/{attemptId}/submit",{params:{path:{...path(slug,{attemptId}),attemptId},header:key(idempotencyKey)}});
 return submissionReceipt(r.data,attemptId);
}
export async function cancelAttempt(c:ApiClient,slug:string,attemptId:string) {
 const r=await c.POST("/api/v1/institution/{institutionSlug}/quiz-attempts/{attemptId}/cancel",{params:{path:{...path(slug,{attemptId}),attemptId}}});
 if(r.response.status!==204)throw new ApiResponseError();
}
