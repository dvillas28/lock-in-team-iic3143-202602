import {ConflictException,NotFoundException} from "@nestjs/common";
import type {PoolClient} from "pg";
import {lockContext,courseScope,requirePermission,type Sql} from "../courses/course-access";
import {quizColumns,type QuizRow} from "./quiz-dto";
type AcademicScope={owner:boolean;roles:{role:string;section_id:string}[]};
export function canAuthorQuiz(s:AcademicScope,section:string|null) {
 return s.roles.some(e=>e.role==="teacher" && (s.owner || e.section_id===section));
}
export function requireDraft(q:{published_at:unknown}) {if(q.published_at!==null)throw new ConflictException();}
export async function quizScope(db:PoolClient,actor:string,slug:string,id:string,kind:"course"|"quiz") {
 const member=await lockContext(db,actor,slug);
 let courseId=id;
 if(kind==="quiz") {
  const q=(await db.query("SELECT course_id FROM public.quizzes WHERE institution_id=$1 AND id=$2",[member.institution_id,id])).rows[0];
  if(!q)throw new NotFoundException();courseId=q.course_id;
 }
 const s=await courseScope(db,member,courseId,true);
 if(!s.roles.length)throw new NotFoundException();
 return {...s,member,courseId};
}
export type QuizScope=Awaited<ReturnType<typeof quizScope>>;
export async function requireDestination(db:Sql,s:QuizScope,section:string|null,author=false) {
 if(section!==null) {
  const row=(await db.query("SELECT id FROM public.sections WHERE institution_id=$1 AND course_id=$2 AND id=$3",[s.member.institution_id,s.courseId,section])).rows[0];
  if(!row || (!s.owner && !s.roles.some(e=>e.section_id===section)))throw new NotFoundException();
 }
 if(author)requirePermission(canAuthorQuiz(s,section));
}
export function visibleSql() {
 return `(($4::boolean AND $5::boolean) OR (q.section_id=ANY($6::uuid[])) OR
  (q.published_at IS NOT NULL AND (q.section_id IS NULL OR q.section_id=ANY($7::uuid[]))))`;
}
export function visibilityArgs(s:QuizScope) {
 return [s.member.institution_id,s.courseId,s.owner,s.roles.some(e=>e.role==="teacher"),s.roles.filter(e=>e.role==="teacher").map(e=>e.section_id),s.roles.map(e=>e.section_id)];
}
export async function visibleQuiz(db:PoolClient,s:QuizScope,id:string) {
 const [tenant,course,owner,teacher,teachers,sections]=visibilityArgs(s);
 const q=(await db.query<QuizRow>(`SELECT ${quizColumns} FROM public.quizzes q
  WHERE q.institution_id=$1 AND q.course_id=$2 AND q.id=$3 AND ${visibleSql()} FOR UPDATE OF q`,
 [tenant,course,id,owner,teacher,teachers,sections])).rows[0];
 if(!q)throw new NotFoundException();return q;
}
export async function requireStudentAttemptEligibility(db:PoolClient,actor:string,slug:string,id:string,section:string) {
 const s=await quizScope(db,actor,slug,id,"quiz"),q=await visibleQuiz(db,s,id);
 await requireDestination(db,s,section);
 requirePermission(s.roles.some(e=>e.role==="student" && e.section_id===section) &&
  (q.section_id===null || q.section_id===section) && !canAuthorQuiz(s,q.section_id));
 return {scope:s,quiz:q};
}
