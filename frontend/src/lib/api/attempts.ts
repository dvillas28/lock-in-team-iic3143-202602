import type {ApiClient} from "./client.ts";
import {ApiResponseError} from "./errors.ts";
import {path} from "../courses/validation.ts";
import type {SafeQuiz} from "../quizzes/validation.ts";
import {attemptDto,answersInput,sameAnswers,submissionReceipt,type Attempt,type Answer,type Expected} from "../attempts/validation.ts";
import {reviewDto} from '../attempts/review.ts';
import {pageInfo,queryPage,unique} from '../gradebook/validation.ts';
import {attemptCapabilities} from '../attempts/capabilities.ts';
import {gradebookCapabilities} from '../gradebook/capabilities.ts';
import type {CurrentUser} from '../auth/validation.ts';
import type {Course} from '../courses/validation.ts';
import type {Summary} from '../quizzes/validation.ts';
function review(v:unknown,user:CurrentUser,course:Course,quiz:Summary,list=false){
 if(quiz.courseId!==course.id)throw new ApiResponseError();
 const a=attemptDto(v,{quizId:quiz.id,staff:true}),cap=gradebookCapabilities(user,course,a.sectionId),access=attemptCapabilities(user,course,quiz,a);
 if(!cap.book||(!access.teacher&&!access.student&&!user.sectionMemberships.some(m=>m.courseId===course.id&&m.sectionId===a.sectionId&&m.role==='assistant')))throw new ApiResponseError();
 return reviewDto(v,{quizId:quiz.id,view:access.student?(list?'assistant':'student'):access.teacher?'teacher':'assistant'});
}
export async function getAttemptReview(c:ApiClient,slug:string,attemptId:string,user:CurrentUser,course:Course,quiz:Summary){
 const r=await c.GET('/api/v1/institution/{institutionSlug}/quiz-attempts/{attemptId}',{params:{path:{...path(slug,{attemptId}),attemptId}}});const a=review(r.data,user,course,quiz);if(a.id!==attemptId)throw new ApiResponseError();return a;
}
export async function listQuizAttempts(c:ApiClient,slug:string,user:CurrentUser,course:Course,quiz:Summary,q:{sectionId?:string;studentId?:string;status?:Attempt['status'];cursor?:string;limit?:number}={}){
 path(slug,{quizId:quiz.id,...(q.sectionId!==undefined?{sectionId:q.sectionId}:{}),...(q.studentId!==undefined?{studentId:q.studentId}:{})});
 if(q.status!==undefined&&!['inProgress','submitted','graded','cancelled'].includes(q.status))throw new TypeError('Estado inválido.');
 const r=await c.GET('/api/v1/institution/{institutionSlug}/quizzes/{quizId}/attempts',{params:{path:{institutionSlug:slug,quizId:quiz.id},query:{...q,...queryPage(q.cursor,q.limit)}}});
 const p=pageInfo(r.data),items=p.items.map(v=>review(v,user,course,quiz,true));if(!unique(items.map(a=>a.id))||items.some(a=>(q.sectionId&&a.sectionId!==q.sectionId)||(q.studentId&&a.studentId!==q.studentId)||(q.status&&a.status!==q.status)))throw new ApiResponseError();return {...p,items};
}
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
