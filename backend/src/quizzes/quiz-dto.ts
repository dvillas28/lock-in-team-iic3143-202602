import type {Question,QuizInput} from "./quiz-validation";
export interface QuizRow {id:string;course_id:string;section_id:string|null;title:string;instructions:string|null;opens_at:string|null;closes_at:string|null;max_attempts:number|null;published_at:string|null;created_by:string;questions:Question[]}
export const quizColumns=`q.*,to_char(q.opens_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS opens_at,
 to_char(q.closes_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS closes_at,
 to_char(q.published_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS published_at`;
export function summaryDto(q:QuizRow) {
 return {id:q.id,courseId:q.course_id,sectionId:q.section_id,title:q.title,instructions:q.instructions,opensAt:q.opens_at,closesAt:q.closes_at,maxAttempts:q.max_attempts,status:q.published_at===null?"draft" as const:"published" as const,publishedAt:q.published_at};
}
export function studentDto(q:QuizRow) {
 return {...summaryDto(q),questions:[...q.questions].sort((a,b)=>a.position-b.position).map(p=>({
  id:p.id,prompt:p.prompt,position:p.position,points:p.points,alternatives:p.alternatives.map(a=>({id:a.id,text:a.text})),
 }))};
}
export function authoringDto(q:QuizRow) {
 return {...summaryDto(q),createdBy:q.created_by,questions:[...q.questions].sort((a,b)=>a.position-b.position).map(p=>({
  id:p.id,prompt:p.prompt,position:p.position,points:p.points,alternatives:p.alternatives.map(a=>({id:a.id,text:a.text,isCorrect:a.isCorrect})),
 }))};
}
export function quizInput(q:QuizRow):QuizInput {
 return {title:q.title,sectionId:q.section_id,instructions:q.instructions,opensAt:q.opens_at,closesAt:q.closes_at,maxAttempts:q.max_attempts,questions:q.questions};
}
export function quizSnapshot(q:QuizRow,gradeItemId?:string) {
 return {id:q.id,courseId:q.course_id,sectionId:q.section_id,title:q.title,opensAt:q.opens_at,closesAt:q.closes_at,
 maxAttempts:q.max_attempts,publishedAt:q.published_at,createdBy:q.created_by,questionCount:q.questions.length,
 totalPoints:q.questions.reduce((sum,p)=>sum+Math.round(p.points*100),0)/100,...(gradeItemId?{gradeItemId}:{})};
}
