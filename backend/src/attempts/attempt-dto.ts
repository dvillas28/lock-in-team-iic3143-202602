import type {Answer} from "./attempt-validation";
export interface AttemptRow {
 id:string;institution_id:string;course_id:string;quiz_id:string;section_id:string;student_id:string;attempt_number:number;
 status:string;started_at:Date|string;submitted_at:Date|string|null;cancelled_at:Date|string|null;answers:Answer[];
 score_points:string|null;score_percent:string|null;grade_value:string|null;start_key:string;submit_key:string|null;
}
export type View="student"|"teacher"|"assistant";
export function attemptDto(a:AttemptRow,view:View) {
 return {id:a.id,quizId:a.quiz_id,sectionId:a.section_id,studentId:a.student_id,attemptNumber:a.attempt_number,
 startedAt:a.started_at,submittedAt:a.submitted_at,cancelledAt:a.cancelled_at,status:a.status==="in_progress"?"inProgress":a.status,
 answers:a.answers.map(r=>({questionId:r.questionId,alternativeId:r.alternativeId,...(view==="teacher" && a.status==="graded"?{isCorrect:r.isCorrect,pointsAwarded:r.pointsAwarded}:{})})),
 ...(view!=="student"?{scorePercent:a.score_percent===null?null:Number(a.score_percent),grade:a.grade_value===null?null:Number(a.grade_value)}:{})};
}
export function submissionReceipt(a:AttemptRow) {return {id:a.id,status:"graded" as const,submittedAt:a.submitted_at};}
export function attemptSnapshot(a:AttemptRow) {
 return {id:a.id,quizId:a.quiz_id,studentId:a.student_id,sectionId:a.section_id,attemptNumber:a.attempt_number,status:a.status,
 startedAt:a.started_at,submittedAt:a.submitted_at,cancelledAt:a.cancelled_at};
}
