import {Injectable,BadRequestException,ConflictException,NotFoundException,UnprocessableEntityException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import type {PoolClient} from "pg";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {requirePermission} from "../courses/course-access";
import {uuid} from "../courses/validation";
import {gradebookScope,academicScope,selectedSections,type GradebookScope} from "./gradebook-access";
import {weightsInput,publicationInput,bookPage,type Selection} from "./gradebook-validation";
import {itemDto,gradeDto,publishedDto,receiptDto} from "./gradebook-dto";
const conflict=(code:string)=>new ConflictException({code});
@Injectable()
export class GradebookService {
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService) {}
 async items(c:PoolClient,s:GradebookScope) {
  return (await c.query("SELECT *,sum(weight_percent) OVER() AS total FROM public.grade_items WHERE institution_id=$1 AND course_id=$2 ORDER BY id",[s.member.institution_id,s.courseId])).rows;
 }
 async listItems(actor:string,slug:string,course:string) {
  return this.db.withInstitution(actor,slug,async c=>{const s=await gradebookScope(c,actor,slug,course);academicScope(s);const rows=await this.items(c,s);
   return {items:rows.map(itemDto),totalWeightPercent:Number(rows[0]?.total??0)};});
 }
 async weights(actor:string,slug:string,course:string,body:unknown) {
  const input=weightsInput(body);
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course);academicScope(s,true);requirePermission(s.owner);
   if(s.course.grade_items_locked_at!==null)throw conflict("GRADE_WEIGHTS_LOCKED");
   const rows=await this.items(c,s);
   if(rows.length!==input.length || rows.some((r,i)=>r.id!==input[i].gradeItemId))throw new UnprocessableEntityException();
   const total=(await c.query("SELECT sum((i->>'weightPercent')::numeric)=100 AS valid FROM jsonb_array_elements($1::jsonb) i",[JSON.stringify(input)])).rows[0];
   if(!total.valid)throw new UnprocessableEntityException();
   const before={items:rows.map(r=>({gradeItemId:r.id,weightPercent:Number(r.weight_percent)}))},after={items:input};
   if(!isDeepStrictEqual(before,after)) {
    await c.query(`UPDATE public.grade_items g SET weight_percent=(v->>'weightPercent')::numeric FROM jsonb_array_elements($1::jsonb) v
     WHERE g.institution_id=$2 AND g.course_id=$3 AND g.id=(v->>'gradeItemId')::uuid`,[JSON.stringify(input),s.member.institution_id,course]);
    await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:course,action:"gradebook.weightsUpdated",resourceType:"gradebook",resourceId:course,before,after});
   }
   const updated=await this.items(c,s);return {items:updated.map(itemDto),totalWeightPercent:100};
  });
 }
 async selection(c:PoolClient,s:GradebookScope,input:Selection) {
  await selectedSections(c,s,input.sectionIds,true);
  const items=(await c.query("SELECT * FROM public.grade_items WHERE institution_id=$1 AND course_id=$2 AND id=ANY($3::uuid[]) ORDER BY id FOR UPDATE",[s.member.institution_id,s.courseId,input.gradeItemIds])).rows;
  if(items.length!==input.gradeItemIds.length)throw new NotFoundException();
  return items;
 }
 async publish(actor:string,slug:string,course:string,key:string,body:unknown) {
  const input=publicationInput(body);
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course),items=await this.selection(c,s,input);
   const existing=(await c.query("SELECT *,to_char(published_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS published_at FROM public.grade_publications WHERE institution_id=$1 AND actor_user_id=$2 AND idempotency_key=$3",[s.member.institution_id,actor,key])).rows[0];
   if(existing) {
    if(existing.course_id!==course || !isDeepStrictEqual(existing.request,input))throw conflict("IDEMPOTENCY_CONFLICT");
    return receiptDto(existing);
   }
   if(Number((await this.items(c,s))[0]?.total)!==100)throw new ConflictException();
   const quizzes=items.map(i=>i.quiz_id).sort();
   await c.query("SELECT id FROM public.quizzes WHERE institution_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",[s.member.institution_id,quizzes]);
   const attempts=(await c.query(`SELECT * FROM public.quiz_attempts WHERE institution_id=$1 AND quiz_id=ANY($2::uuid[]) AND student_id=ANY($3::uuid[]) ORDER BY id FOR UPDATE`,[s.member.institution_id,quizzes,input.studentIds])).rows;
   const grades=(await c.query(`SELECT * FROM public.grades WHERE institution_id=$1 AND grade_item_id=ANY($2::uuid[]) AND student_id=ANY($3::uuid[]) ORDER BY id FOR UPDATE`,[s.member.institution_id,input.gradeItemIds,input.studentIds])).rows;
   if(grades.length!==input.gradeItemIds.length*input.studentIds.length || attempts.some(a=>a.status==="in_progress"))throw new ConflictException();
   for(const g of grades) {
    if(!input.sectionIds.includes(g.section_id))throw new ConflictException();
    const a=attempts.find(a=>a.id===g.attempt_id);
    if(!a || a.status!=="graded" || a.score_percent!==g.score_percent || a.grade_value!==g.grade_value || attempts.some(other=>other.quiz_id===g.quiz_id && other.student_id===g.student_id && other.status==="graded" && other.attempt_number>a.attempt_number))throw new ConflictException();
    if(g.published_at!==null)throw conflict("GRADE_ALREADY_PUBLISHED");
   }
   const stamp=(await c.query(`SELECT to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS at`)).rows[0].at;
   const changed=(await c.query("UPDATE public.grades SET published_at=$1,updated_at=$1 WHERE institution_id=$2 AND id=ANY($3::uuid[]) RETURNING *",[stamp,s.member.institution_id,grades.map(g=>g.id)])).rows;
   for(const g of changed)await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:course,sectionId:g.section_id,action:"grade.published",resourceType:"grade",resourceId:g.id,before:gradeDto(grades.find(old=>old.id===g.id)!),after:gradeDto(g)});
   const receipt={publishedCount:changed.length,publishedAt:stamp};
   const inserted=await c.query(`INSERT INTO public.grade_publications(id,institution_id,course_id,actor_user_id,idempotency_key,request,published_count,published_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(institution_id,actor_user_id,idempotency_key) DO NOTHING RETURNING id`,[randomUUID(),s.member.institution_id,course,actor,key,input,changed.length,stamp]);
   if(inserted.rowCount!==1)throw conflict("IDEMPOTENCY_CONFLICT");
   return receipt;
  });
 }
 async myGrades(actor:string,slug:string,course:string,query:Record<string,unknown>) {
  if(Object.keys(query).length)throw new BadRequestException();
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course);requirePermission(s.roles.some(e=>e.role==="student"));
   const rows=(await c.query(`SELECT g.*,i.title,i.weight_percent FROM public.grades g JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
    WHERE g.institution_id=$1 AND i.course_id=$2 AND g.student_id=$3 AND g.published_at IS NOT NULL ORDER BY i.created_at,i.id`,[s.member.institution_id,course,actor])).rows;
   const summary=(await c.query(`SELECT round(sum(g.grade_value*i.weight_percent)/NULLIF(sum(i.weight_percent),0),1) AS average,COALESCE(sum(i.weight_percent),0) AS weight
    FROM public.grades g JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
    WHERE g.institution_id=$1 AND i.course_id=$2 AND g.student_id=$3 AND g.published_at IS NOT NULL`,[s.member.institution_id,course,actor])).rows[0];
   return {courseId:course,items:rows.map(publishedDto),partialAverage:summary.average===null?null:Number(summary.average),publishedWeightPercent:Number(summary.weight),isPartial:Number(summary.weight)<100};
  });
 }
 async book(actor:string,slug:string,course:string,query:Record<string,unknown>) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course),scope=academicScope(s),section=query.sectionId===undefined?null:uuid(query.sectionId);
   if(section)await selectedSections(c,s,[section]);
   const p=bookPage(query,JSON.stringify(["gradebook",s.member.institution_id,course,actor,section]));
   const rows=(await c.query(`WITH grouped AS (
    SELECT g.student_id,g.section_id,min(g.created_at) AS date,
    round(sum(g.grade_value*i.weight_percent) FILTER(WHERE g.published_at IS NOT NULL)/NULLIF(sum(i.weight_percent) FILTER(WHERE g.published_at IS NOT NULL),0),1) AS average,
    COALESCE(sum(i.weight_percent) FILTER(WHERE g.published_at IS NOT NULL),0) AS weight
    FROM public.grades g JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
    WHERE g.institution_id=$1 AND i.course_id=$2 AND ($3::boolean OR g.section_id=ANY($4::uuid[])) AND ($5::uuid IS NULL OR g.section_id=$5)
    GROUP BY g.student_id,g.section_id)
    SELECT x.*,u.name,u.email,u.active,to_char(x.date AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
    FROM grouped x JOIN public.users u ON u.id=x.student_id
    WHERE $6::timestamptz IS NULL OR (x.date,x.student_id,x.section_id)>($6::timestamptz,$7::uuid,$8::uuid)
    ORDER BY x.date,x.student_id,x.section_id LIMIT $9`,[s.member.institution_id,course,scope.global,scope.sections,section,p.date,p.id,p.section,p.limit+1])).rows;
   const hasMore=rows.length>p.limit,visible=rows.slice(0,p.limit),last=visible.at(-1);
   const items=[];
   for(const row of visible) {
    const grades=(await c.query(`SELECT g.* FROM public.grades g JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
     WHERE g.institution_id=$1 AND i.course_id=$2 AND g.student_id=$3 AND g.section_id=$4 ORDER BY i.created_at,i.id`,[s.member.institution_id,course,row.student_id,row.section_id])).rows;
    items.push({student:{id:row.student_id,name:row.name,email:row.email,active:row.active},sectionId:row.section_id,grades:grades.map(gradeDto),partialAverage:row.average===null?null:Number(row.average),publishedWeightPercent:Number(row.weight)});
   }
   return {courseId:course,items,hasMore,nextCursor:hasMore && last?Buffer.from(JSON.stringify({scope:p.scope,date:last.cursor_date,id:last.student_id,section:last.section_id})).toString("base64url"):null};
  });
 }
}
