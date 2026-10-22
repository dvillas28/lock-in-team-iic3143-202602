import type { components } from "../api/schema";
import { ApiResponseError } from "../api/errors.ts";
import { isRecord } from "../auth/validation.ts";
import { FieldError, isId } from "../courses/validation.ts";
import { timestamp, jsonBody, type SafeQuiz } from "../quizzes/validation.ts";
export type Attempt = components["schemas"]["QuizAttemptStudentView"];
export type Answer = components["schemas"]["QuizAttemptAnswerInput"];
export type Receipt = components["schemas"]["QuizAttemptSubmissionReceipt"];
export type Expected = {id?:string;quizId?:string;sectionId?:string;studentId?:string;staff?:boolean};
const keys = ["id","quizId","sectionId","studentId","attemptNumber","status","startedAt","submittedAt","cancelledAt","answers"];
function selections(v:unknown, strict=true): Answer[] {
 if(!Array.isArray(v))throw new ApiResponseError();
 const out=v.map(a=>{
  if(!isRecord(a)||!isId(a.questionId)||typeof a.alternativeId!=="string"||!a.alternativeId.trim()||a.alternativeId.includes("\0") || (strict && Object.keys(a).some(k=>!["questionId","alternativeId"].includes(k))))throw new ApiResponseError();
  return {questionId:a.questionId,alternativeId:a.alternativeId};
 });
 if(new Set(out.map(a=>a.questionId)).size!==out.length)throw new ApiResponseError();return out;
}
export function attemptDto(v:unknown, expected:Expected={}):Attempt {
 try {
  if(!isRecord(v)||keys.slice(0,4).some(k=>!isId(v[k]))||(!expected.staff && Object.keys(v).some(k=>!keys.includes(k))))throw new ApiResponseError();
  for(const k of ["id","quizId","sectionId","studentId"] as const)if(expected[k]!==undefined && v[k]!==expected[k])throw new ApiResponseError();
  if(typeof v.attemptNumber!=="number"||!Number.isSafeInteger(v.attemptNumber)||v.attemptNumber<1||!["inProgress","submitted","graded","cancelled"].includes(v.status as string))throw new ApiResponseError();
  const startedAt=timestamp(v.startedAt,"startedAt"),submittedAt=timestamp(v.submittedAt,"submittedAt"),cancelledAt=timestamp(v.cancelledAt,"cancelledAt");
  if(!startedAt || ((v.status==="submitted"||v.status==="graded") !== (submittedAt!==null)) || ((v.status==="cancelled") !== (cancelledAt!==null)))throw new ApiResponseError();
  const answers=selections(v.answers,!expected.staff);
  return {id:v.id as string,quizId:v.quizId as string,sectionId:v.sectionId as string,studentId:v.studentId as string,attemptNumber:v.attemptNumber,status:v.status as Attempt["status"],startedAt,submittedAt,cancelledAt,answers:expected.staff?[]:answers};
 }catch{throw new ApiResponseError();}
}
export function submissionReceipt(v:unknown,id:string):Receipt {
 try {
  if(!isRecord(v)||!isId(id)||v.id!==id||v.status!=="graded"||Object.keys(v).some(k=>!["id","status","submittedAt"].includes(k)))throw new ApiResponseError();
  const submittedAt=timestamp(v.submittedAt,"submittedAt");if(!submittedAt)throw new ApiResponseError();
  return {id,status:"graded",submittedAt};
 }catch{throw new ApiResponseError();}
}
export function receiptFromAttempt(a:Attempt):Receipt|undefined {
 return a.status==="graded"?submissionReceipt({id:a.id,status:a.status,submittedAt:a.submittedAt},a.id):undefined;
}
export function answersInput(v:unknown,quiz:SafeQuiz) {
 const answers=selections(v);
 if(answers.some(a=>!quiz.questions.some(q=>q.id===a.questionId && q.alternatives.some(o=>o.id===a.alternativeId))))throw new FieldError("answers","Pregunta o alternativa ajena al quiz.");
 return jsonBody({answers});
}
export const sameAnswers=(a:Answer[],b:Answer[])=>a.length===b.length && a.every(x=>b.some(y=>x.questionId===y.questionId && x.alternativeId===y.alternativeId));
