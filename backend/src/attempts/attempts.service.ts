import {Injectable,ConflictException,NotFoundException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import type {PoolClient} from "pg";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {transaction,requirePermission} from "../courses/course-access";
import {attemptScope,attemptView,requireStudent,studentEligible,requireWindow,validateAnswers,type Scope} from "./attempt-access";
import {attemptDto,attemptSnapshot,submissionReceipt,type AttemptRow} from "./attempt-dto";
import {calculateGrade} from "./grading";
import {answersInput,emptyBody} from "./attempt-validation";
@Injectable()
export class AttemptsService {
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService) {}
 async event(c:PoolClient,s:Scope,action:string,before:AttemptRow|null,after:AttemptRow) {
  await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:s.member.user_id,action,resourceType:"quizAttempt",resourceId:after.id,
  courseId:after.course_id,sectionId:after.section_id,before:before?attemptSnapshot(before):null,after:attemptSnapshot(after)});
 }
 async grade(c:PoolClient,s:Scope,student:string) {
  return (await c.query("SELECT * FROM public.grades WHERE institution_id=$1 AND quiz_id=$2 AND student_id=$3 FOR UPDATE",[s.member.institution_id,s.q.id,student])).rows[0];
 }
 async start(actor:string,slug:string,quiz:string,section:string,key:string,body:unknown) {
  emptyBody(body);
  return transaction(this.db.pool,async c=>{
   const s=await attemptScope(c,actor,slug,quiz,"quiz");
   if(!s.roles.some(e=>e.section_id===section))throw new NotFoundException();
   if(s.q.section_id!==null && s.q.section_id!==section)throw new NotFoundException();
   requirePermission(studentEligible(s) && s.roles.some(e=>e.role==="student" && e.section_id===section));
   const replay=(await c.query<AttemptRow>("SELECT * FROM public.quiz_attempts WHERE institution_id=$1 AND student_id=$2 AND start_key=$3",[s.member.institution_id,actor,key])).rows[0];
   if(replay) {
    if(replay.quiz_id!==quiz || replay.section_id!==section)throw new ConflictException();
    return attemptDto({...replay,status:"in_progress",answers:[],submitted_at:null,cancelled_at:null},"student");
   }
   const previous=(await c.query("SELECT COALESCE(MAX(attempt_number),0) AS number,BOOL_OR(status='in_progress') AS active FROM public.quiz_attempts WHERE institution_id=$1 AND quiz_id=$2 AND student_id=$3",[s.member.institution_id,quiz,actor])).rows[0];
   const grade=await this.grade(c,s,actor);
   if(!s.q.published_at || grade?.published_at || previous.active || (s.q.max_attempts!==null && previous.number>=s.q.max_attempts))throw new ConflictException();
   validateAnswers(s.q,[]);await requireWindow(c,s.q);
   const a=(await c.query<AttemptRow>(`INSERT INTO public.quiz_attempts(id,institution_id,course_id,quiz_id,section_id,student_id,attempt_number,status,start_key)
    VALUES($1,$2,$3,$4,$5,$6,$7,'in_progress',$8) RETURNING *`,[randomUUID(),s.member.institution_id,s.q.course_id,quiz,section,actor,previous.number+1,key])).rows[0];
   await this.event(c,s,"attempt.started",null,a);return attemptDto(a,"student");
  });
 }
 async get(actor:string,slug:string,id:string) {
  return transaction(this.db.pool,async c=>{const s=await attemptScope(c,actor,slug,id,"attempt");return attemptDto(s.a!,attemptView(s));});
 }
 async save(actor:string,slug:string,id:string,body:unknown) {
  const answers=answersInput(body);
  return transaction(this.db.pool,async c=>{
   const s=await attemptScope(c,actor,slug,id,"attempt"),a=s.a!;requireStudent(s);
   const grade=await this.grade(c,s,actor);
   if(a.status!=="in_progress" || grade?.published_at)throw new ConflictException();
   await requireWindow(c,s.q);validateAnswers(s.q,answers);
   if(isDeepStrictEqual(answers,a.answers))return attemptDto(a,"student");
   const after=(await c.query<AttemptRow>("UPDATE public.quiz_attempts SET answers=$1 WHERE institution_id=$2 AND id=$3 RETURNING *",[JSON.stringify(answers),s.member.institution_id,id])).rows[0];
   await this.event(c,s,"attempt.answersSaved",a,after);return attemptDto(after,"student");
  });
 }
 async cancel(actor:string,slug:string,id:string,body:unknown) {
  emptyBody(body);
  return transaction(this.db.pool,async c=>{
   const s=await attemptScope(c,actor,slug,id,"attempt"),a=s.a!,view=attemptView(s);
   requirePermission(view==="student" || view==="teacher");
   if(a.status==="cancelled")return;
   if(a.status!=="in_progress")throw new ConflictException();
   const after=(await c.query<AttemptRow>("UPDATE public.quiz_attempts SET status='cancelled',cancelled_at=clock_timestamp() WHERE institution_id=$1 AND id=$2 RETURNING *",[s.member.institution_id,id])).rows[0];
   await this.event(c,s,"attempt.cancelled",a,after);
  });
 }
 async submit(actor:string,slug:string,id:string,key:string,body:unknown) {
  emptyBody(body);
  return transaction(this.db.pool,async c=>{
   const s=await attemptScope(c,actor,slug,id,"attempt"),a=s.a!;requireStudent(s);
   const used=(await c.query("SELECT id FROM public.quiz_attempts WHERE institution_id=$1 AND student_id=$2 AND submit_key=$3",[s.member.institution_id,actor,key])).rows[0];
   if(used && used.id!==id)throw new ConflictException();
   if(a.status==="graded") {
    if(a.submit_key!==key)throw new ConflictException();return submissionReceipt(a);
   }
   const previous=await this.grade(c,s,actor);
   if(a.status!=="in_progress" || previous?.published_at)throw new ConflictException();
   await requireWindow(c,s.q);validateAnswers(s.q,answersInput({answers:a.answers}));
   const item=(await c.query("SELECT id FROM public.grade_items WHERE institution_id=$1 AND quiz_id=$2",[s.member.institution_id,s.q.id])).rows[0];
   if(!item)throw new ConflictException();
   await c.query("UPDATE public.quiz_attempts SET status='submitted',submitted_at=clock_timestamp(),submit_key=$1 WHERE institution_id=$2 AND id=$3",[key,s.member.institution_id,id]);
   const result=await calculateGrade(c,s.q.questions,a.answers);
   const after=(await c.query<AttemptRow>(`UPDATE public.quiz_attempts SET status='graded',answers=$1,score_points=$2,score_percent=$3,grade_value=$4
    WHERE institution_id=$5 AND id=$6 RETURNING *`,[JSON.stringify(result.answers),result.score,result.percent,result.grade,s.member.institution_id,id])).rows[0];
   let updated;
   if(!previous) {
    updated=(await c.query(`INSERT INTO public.grades(id,institution_id,grade_item_id,quiz_id,student_id,section_id,attempt_id,score_percent,grade_value)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[randomUUID(),s.member.institution_id,item.id,s.q.id,actor,a.section_id,id,result.percent,result.grade])).rows[0];
   }else {
    updated=(await c.query(`UPDATE public.grades g SET attempt_id=$1,section_id=$2,score_percent=$3,grade_value=$4,updated_at=clock_timestamp()
     FROM public.quiz_attempts old WHERE g.institution_id=$5 AND g.id=$6 AND old.id=g.attempt_id AND old.institution_id=g.institution_id
     AND old.attempt_number<$7 AND g.published_at IS NULL RETURNING g.*`,[id,a.section_id,result.percent,result.grade,s.member.institution_id,previous.id,a.attempt_number])).rows[0];
   }
   await this.event(c,s,"attempt.graded",a,after);
   if(updated) {
    const snapshot=(g:typeof updated)=>({id:g.id,gradeItemId:g.grade_item_id,studentId:g.student_id,sectionId:g.section_id,attemptId:g.attempt_id,
     scorePercent:g.score_percent,grade:g.grade_value,publishedAt:g.published_at});
    await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:previous?"grade.updated":"grade.created",resourceType:"grade",resourceId:updated.id,
     courseId:a.course_id,sectionId:a.section_id,before:previous?snapshot(previous):null,after:snapshot(updated)});
   }
   return submissionReceipt(after);
  });
 }

}
