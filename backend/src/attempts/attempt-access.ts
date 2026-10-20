import {NotFoundException,ConflictException,UnprocessableEntityException} from "@nestjs/common";
import type {PoolClient} from "pg";
import {lockContext,courseScope,requirePermission} from "../courses/course-access";
import {canAuthorQuiz,visibleSql,visibilityArgs} from "../quizzes/quiz-access";
import {quizInput,type QuizRow} from "../quizzes/quiz-dto";
import {validatePublish} from "../quizzes/quiz-validation";
import type {AttemptRow,View} from "./attempt-dto";
import type {Answer} from "./attempt-validation";
export async function attemptScope(db:PoolClient,actor:string,slug:string,id:string,kind:"attempt"|"quiz") {
 const member=await lockContext(db,actor,slug);
 const found=(await db.query(`SELECT course_id,${kind==="attempt"?"quiz_id":"id AS quiz_id"}
  FROM public.${kind==="attempt"?"quiz_attempts":"quizzes"} WHERE institution_id=$1 AND id=$2`,[member.institution_id,id])).rows[0];
 if(!found)throw new NotFoundException();
 const scope=await courseScope(db,member,found.course_id,true);
 const params=visibilityArgs({...scope,member,courseId:found.course_id});
 const [tenant,course,owner,teacher,teachers,sections]=params;
 const metadata=(await db.query<{section_id:string|null}>(`SELECT q.section_id FROM public.quizzes q
  WHERE q.institution_id=$1 AND q.course_id=$2 AND q.id=$3${kind==="quiz"?` AND ${visibleSql()}`:""} FOR UPDATE OF q`,
 kind==="quiz"?[tenant,course,found.quiz_id,owner,teacher,teachers,sections]:[tenant,course,found.quiz_id])).rows[0];
 if(!metadata)throw new NotFoundException();
 if(kind==="attempt") {
  const a=(await db.query<{student_id:string;section_id:string}>("SELECT student_id,section_id FROM public.quiz_attempts WHERE institution_id=$1 AND id=$2 FOR UPDATE",[tenant,id])).rows[0];
  if(!a)throw new NotFoundException();
  attemptView({...scope,member,q:metadata,a});
 }
 // shortcut: pg Date parsing loses sub-ms precision (accepted debt); preserve SQL precision when sub-ms windows are required.
 const q=(await db.query<QuizRow>("SELECT * FROM public.quizzes WHERE institution_id=$1 AND id=$2 FOR UPDATE",[member.institution_id,found.quiz_id])).rows[0];
 if(!q)throw new NotFoundException();
 const a=kind==="attempt"?(await db.query<AttemptRow>("SELECT * FROM public.quiz_attempts WHERE institution_id=$1 AND id=$2 FOR UPDATE",[member.institution_id,id])).rows[0]:null;
 return {...scope,member,q,a};
}
export type Scope=Awaited<ReturnType<typeof attemptScope>>;
type AccessScope={owner:boolean;roles:{role:string;section_id:string}[];q:{section_id:string|null}};
export function studentEligible(s:AccessScope) {
 return s.roles.some(e=>e.role==="student") && !canAuthorQuiz(s,s.q.section_id);
}
export function attemptView(s:AccessScope & {member:{user_id:string};a:{student_id:string;section_id:string}|null}):View {
 const a=s.a!;
 if(a.student_id===s.member.user_id && studentEligible(s))return "student";
 if(canAuthorQuiz(s,a.section_id))return "teacher";
 if(s.roles.some(e=>e.role==="assistant" && e.section_id===a.section_id))return "assistant";
 throw new NotFoundException();
}
export function requireStudent(s:Scope) {requirePermission(attemptView(s)==="student");}
export async function requireWindow(db:PoolClient,q:QuizRow) {
 const row=(await db.query(`SELECT ($1::timestamptz IS NULL OR $1<=t.now) AND ($2::timestamptz IS NULL OR t.now<$2) AS allowed
  FROM (SELECT clock_timestamp() AS now) t`,[q.opens_at,q.closes_at])).rows[0];
 if(!row.allowed)throw new ConflictException();
}
export function validateAnswers(q:QuizRow,answers:Answer[]) {
 validatePublish(quizInput(q));
 if(answers.some(a=>!q.questions.some(p=>p.id===a.questionId && p.alternatives.some(o=>o.id===a.alternativeId))))throw new UnprocessableEntityException();
}
