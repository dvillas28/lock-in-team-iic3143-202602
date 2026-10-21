import {Injectable,BadRequestException,ConflictException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {requirePermission} from "../courses/course-access";
import {uuid} from "../courses/validation";
import {noBody} from "../content/content-validation";
import {quizScope,visibleQuiz,canAuthorQuiz,requireDestination,requireDraft,visibilityArgs,visibleSql} from "./quiz-access";
import {validateQuiz,validatePublish} from "./quiz-validation";
import {quizColumns,quizInput,quizSnapshot,authoringDto,studentDto,summaryDto,type QuizRow} from "./quiz-dto";
@Injectable()
export class QuizzesService {
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService) {}
 async create(actor:string,slug:string,course:string,body:unknown) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await quizScope(c,actor,slug,course,"course"),input=validateQuiz(body);
   await requireDestination(c,s,input.sectionId,true);
   const id=randomUUID();
   await c.query(`INSERT INTO public.quizzes(id,institution_id,course_id,section_id,title,instructions,opens_at,closes_at,max_attempts,questions,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[id,s.member.institution_id,course,input.sectionId,input.title,input.instructions,input.opensAt,input.closesAt,input.maxAttempts,JSON.stringify(input.questions),actor]);
   const row=await visibleQuiz(c,s,id);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:"quiz.created",resourceType:"quiz",resourceId:id,courseId:course,sectionId:row.section_id,before:null,after:quizSnapshot(row)});
   return authoringDto(row);
  });
 }
 async update(actor:string,slug:string,id:string,body:unknown) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await quizScope(c,actor,slug,id,"quiz"),row=await visibleQuiz(c,s,id);
   requirePermission(canAuthorQuiz(s,row.section_id));requireDraft(row);
   const before=quizInput(row),input=validateQuiz(body,before);
   await requireDestination(c,s,input.sectionId,true);
   if(isDeepStrictEqual(input,before))return authoringDto(row);
   await c.query(`UPDATE public.quizzes SET section_id=$1,title=$2,instructions=$3,opens_at=$4,closes_at=$5,max_attempts=$6,questions=$7
    WHERE institution_id=$8 AND id=$9`,[input.sectionId,input.title,input.instructions,input.opensAt,input.closesAt,input.maxAttempts,JSON.stringify(input.questions),s.member.institution_id,id]);
   const after=await visibleQuiz(c,s,id);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:"quiz.updated",resourceType:"quiz",resourceId:id,courseId:s.courseId,
    sectionId:row.section_id===after.section_id?row.section_id:null,before:quizSnapshot(row),after:quizSnapshot(after)});
   return authoringDto(after);
  });
 }
 async publish(actor:string,slug:string,id:string,body:unknown) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await quizScope(c,actor,slug,id,"quiz"),row=await visibleQuiz(c,s,id);
   requirePermission(canAuthorQuiz(s,row.section_id));noBody(body);
   if(row.published_at!==null)return authoringDto(row);
   validatePublish(quizInput(row));
   if(s.course.grade_items_locked_at!==null)throw new ConflictException();
   const item=randomUUID();
   try {
    await c.query("INSERT INTO public.grade_items(id,institution_id,course_id,quiz_id,title) VALUES($1,$2,$3,$4,$5)",[item,s.member.institution_id,s.courseId,id,row.title]);
   }catch(error){
    const e=error as {code?:string;constraint?:string};
    if(e.code==="23514" && e.constraint==="grade_items_course_frozen")throw new ConflictException();
    throw error;
   }
   await c.query("UPDATE public.quizzes SET published_at=clock_timestamp() WHERE institution_id=$1 AND id=$2",[s.member.institution_id,id]);
   const after=await visibleQuiz(c,s,id);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:"quiz.published",resourceType:"quiz",resourceId:id,courseId:s.courseId,sectionId:row.section_id,before:quizSnapshot(row),after:quizSnapshot(after,item)});
   return authoringDto(after);
  });
 }
 async get(actor:string,slug:string,id:string,authoring=false) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await quizScope(c,actor,slug,id,"quiz"),row=await visibleQuiz(c,s,id);
   if(authoring){requirePermission(canAuthorQuiz(s,row.section_id));return authoringDto(row);}
   return studentDto(row);
  });
 }
 async list(actor:string,slug:string,course:string,query:Record<string,unknown>) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await quizScope(c,actor,slug,course,"course");
   if(Object.keys(query).some(key=>key!=="sectionId"))throw new BadRequestException();
   const section=query.sectionId===undefined?null:uuid(query.sectionId);
   if(section)await requireDestination(c,s,section);
   const [tenant,courseId,owner,teacher,teachers,sections]=visibilityArgs(s);
   const rows=(await c.query<QuizRow>(`SELECT ${quizColumns} FROM public.quizzes q
    WHERE q.institution_id=$1 AND q.course_id=$2 AND ($3::uuid IS NULL OR q.section_id IS NULL OR q.section_id=$3)
    AND ${visibleSql()} ORDER BY q.id`,[tenant,courseId,section,owner,teacher,teachers,sections])).rows;
   return {items:rows.map(summaryDto)};
  });
 }
}
