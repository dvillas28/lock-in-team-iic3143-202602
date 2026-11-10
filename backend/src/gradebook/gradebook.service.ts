import {Injectable,BadRequestException,ConflictException,NotFoundException,UnprocessableEntityException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import type {PoolClient} from "pg";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {requirePermission} from "../courses/course-access";
import {uuid} from "../courses/validation";
import {gradebookScope,academicScope,selectedSections,type GradebookScope} from "./gradebook-access";
import {weightsInput,publicationRequest,bookPage,groupsInput,correctionInput,type Selection} from "./gradebook-validation";
import {itemDto,gradeDto,gradeResultDto,publishedDto,receiptDto} from "./gradebook-dto";
import {configureGroups,groupsFor} from "./gradebook-groups";
import {gradeResults,resultSummary} from "./gradebook-results";
const conflict=(code:string)=>new ConflictException({code});
@Injectable()
export class GradebookService {
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService) {}
 async items(c:PoolClient,s:GradebookScope) {
  return (await c.query(`SELECT i.*,g.weight_percent AS group_weight FROM public.grade_items i
   JOIN public.grade_groups g ON g.institution_id=i.institution_id AND g.course_id=i.course_id AND g.id=i.group_id
   WHERE i.institution_id=$1 AND i.course_id=$2 ORDER BY i.id`,[s.member.institution_id,s.courseId])).rows;
 }
 async configuration(c:PoolClient,s:GradebookScope) {
  const groups=await groupsFor(c,s),items=await this.items(c,s);
  return {items:items.map(itemDto),groups,totalWeightPercent:groups.reduce((n,g)=>n+Math.round(g.weightPercent*100),0)/100,
   weightsLocked:false,hasPublishedGrades:s.course.grade_items_locked_at!==null,
   calculation:s.course.gradebook_grouped?"points" as const:"legacy" as const,version:Number(s.course.gradebook_version)};
 }
 async listItems(actor:string,slug:string,course:string) {
  return this.db.withInstitution(actor,slug,async c=>{const s=await gradebookScope(c,actor,slug,course);academicScope(s);return this.configuration(c,s);});
 }
 async groups(actor:string,slug:string,course:string,body:unknown) {
  const input=groupsInput(body);
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course);academicScope(s,true);
   const changes=await configureGroups(c,s,input,await this.items(c,s));
   if(changes) {
    await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:course,
     action:"gradebook.groupsUpdated",resourceType:"gradebook",resourceId:course,...changes});
    s.course.gradebook_grouped=true;
    s.course.gradebook_version++;
   }
   return this.configuration(c,s);
  });
 }
 async correct(actor:string,slug:string,course:string,id:string,body:unknown) {
  const input=correctionInput(body);
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course),scope=academicScope(s,true),tenant=s.member.institution_id;
   const current=(await c.query(`${gradeResults} WHERE g.institution_id=$1 AND i.course_id=$2 AND g.id=$3
    AND ($4::boolean OR g.section_id=ANY($5::uuid[])) FOR UPDATE OF g`,[tenant,course,id,scope.global,scope.sections])).rows[0];
   if(!current)throw new NotFoundException();
   if(current.published_at===null)throw conflict("GRADE_NOT_PUBLISHED");
   const replay=(await c.query(`SELECT * FROM public.grade_revisions WHERE institution_id=$1 AND grade_id=$2 AND id=$3`,
    [tenant,id,input.revisionId])).rows[0];
   if(replay) {
    if(replay.actor_user_id!==actor || replay.previous_revision_id!==input.expectedRevisionId ||
      Number(replay.score_points)!==input.points || replay.reason!==input.reason)throw conflict("IDEMPOTENCY_CONFLICT");
    return gradeResultDto({...current,effective_percent:replay.score_percent,effective_grade:replay.grade_value,
     earned_points:replay.score_points,revision_id:replay.id,revised_at:replay.created_at});
   }
   if(current.revision_id!==input.expectedRevisionId)throw conflict("GRADE_REVISION_CHANGED");
   if(input.points>Number(current.max_points))throw new UnprocessableEntityException({code:"GRADE_POINTS_OUT_OF_RANGE"});
   const revision=(await c.query(`INSERT INTO public.grade_revisions
    (id,institution_id,grade_id,actor_user_id,previous_revision_id,reason,score_points)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING RETURNING *`,
    [input.revisionId,tenant,id,actor,input.expectedRevisionId,input.reason,input.points])).rows[0];
   if(!revision)throw conflict("IDEMPOTENCY_CONFLICT");
   const result=gradeResultDto({...current,effective_percent:revision.score_percent,effective_grade:revision.grade_value,
    earned_points:revision.score_points,revision_id:revision.id,revised_at:revision.created_at});
   await this.audit.record(c,{institutionId:tenant,actorUserId:actor,courseId:course,sectionId:current.section_id,
    action:"grade.corrected",resourceType:"grade",resourceId:id,before:gradeResultDto(current),after:{...result,reason:input.reason}});
   return result;
  });
 }
 async weights(actor:string,slug:string,course:string,body:unknown) {
  const input=weightsInput(body);
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course);academicScope(s,true);
   if(s.course.gradebook_grouped)throw conflict("USE_GRADE_GROUPS");
   const rows=await this.items(c,s);
   if(rows.length!==input.length || rows.some((r,i)=>r.id!==input[i].gradeItemId))throw new UnprocessableEntityException();
   const total=(await c.query("SELECT sum((i->>'weightPercent')::numeric)=100 AS valid FROM jsonb_array_elements($1::jsonb) i",[JSON.stringify(input)])).rows[0];
   if(!total.valid)throw new UnprocessableEntityException();
   const before={items:rows.map(r=>({gradeItemId:r.id,weightPercent:Number(r.weight_percent)}))},after={items:input};
   if(!isDeepStrictEqual(before,after)) {
    if(s.course.grade_items_locked_at!==null)throw conflict("USE_GRADE_GROUPS");
    await c.query(`UPDATE public.grade_items g SET weight_percent=(v->>'weightPercent')::numeric FROM jsonb_array_elements($1::jsonb) v
     WHERE g.institution_id=$2 AND g.course_id=$3 AND g.id=(v->>'gradeItemId')::uuid`,[JSON.stringify(input),s.member.institution_id,course]);
    await c.query("UPDATE public.courses SET gradebook_version=gradebook_version+1 WHERE institution_id=$1 AND id=$2",[s.member.institution_id,course]);
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
  const input=publicationRequest(body);
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course),items=await this.selection(c,s,input);
   const existing=(await c.query("SELECT *,to_char(published_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS published_at FROM public.grade_publications WHERE institution_id=$1 AND actor_user_id=$2 AND idempotency_key=$3",[s.member.institution_id,actor,key])).rows[0];
   if(existing) {
    if(existing.course_id!==course || !isDeepStrictEqual(existing.request,input))throw conflict("IDEMPOTENCY_CONFLICT");
    return receiptDto(existing);
   }
   if((await groupsFor(c,s)).reduce((sum,g)=>sum+Math.round(g.weightPercent*100),0)!==10000)throw new ConflictException();
   const bulk="scope" in input;
   const grades=(await c.query(`SELECT g.* FROM public.grades g JOIN public.grade_items i
    ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
    WHERE g.institution_id=$1 AND i.course_id=$2 AND (cardinality($3::uuid[])=0 OR g.grade_item_id=ANY($3))
    AND ($4::uuid[] IS NULL OR g.student_id=ANY($4))
    AND (NOT $5::boolean OR (g.section_id=ANY($6::uuid[]) AND g.published_at IS NULL))
    ORDER BY g.id FOR UPDATE OF g`,[s.member.institution_id,course,input.gradeItemIds,bulk?null:input.studentIds,bulk,input.sectionIds])).rows;
   if(!grades.length || (!bulk && grades.length!==items.length*input.studentIds.length))throw new ConflictException();
   // The course lock is shared with quiz/attempt writers and keeps each pair stable.
   const publishable=await c.query(`SELECT g.id FROM public.grades g JOIN public.quiz_attempts a
    ON a.institution_id=g.institution_id AND a.id=g.attempt_id
    WHERE g.institution_id=$1 AND g.id=ANY($2::uuid[])
    AND a.status='graded' AND (a.score_percent,a.grade_value)=(g.score_percent,g.grade_value)
    AND NOT EXISTS (SELECT 1 FROM public.quiz_attempts other
     WHERE other.institution_id=g.institution_id AND other.quiz_id=g.quiz_id AND other.student_id=g.student_id
      AND (other.status='in_progress' OR (other.status='graded' AND other.attempt_number>a.attempt_number)))`,
    [s.member.institution_id,grades.map(g=>g.id)]);
   if(publishable.rowCount!==grades.length || grades.some(g=>!input.sectionIds.includes(g.section_id)))throw new ConflictException();
   if(grades.some(g=>g.published_at!==null))throw conflict("GRADE_ALREADY_PUBLISHED");
   const stamp=(await c.query(`SELECT to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS at`)).rows[0].at;
   const changed=(await c.query("UPDATE public.grades SET published_at=$1,updated_at=$1 WHERE institution_id=$2 AND id=ANY($3::uuid[]) RETURNING *",[stamp,s.member.institution_id,grades.map(g=>g.id)])).rows;
   const before=new Map(grades.map(g=>[g.id,g]));
   for(const g of changed)await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,courseId:course,sectionId:g.section_id,action:"grade.published",resourceType:"grade",resourceId:g.id,before:gradeDto(before.get(g.id)!),after:gradeDto(g)});
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
   const rows=(await c.query(`${gradeResults} WHERE g.institution_id=$1 AND i.course_id=$2 AND g.student_id=$3
    AND g.published_at IS NOT NULL ORDER BY k.position,i.created_at,i.id`,[s.member.institution_id,course,actor])).rows;
   const summary=await resultSummary(c,rows,s.course.gradebook_grouped);
   return {courseId:course,items:rows.map(publishedDto),...summary,
    calculation:s.course.gradebook_grouped?"points":"legacy",isPartial:s.course.gradebook_grouped || summary.publishedWeightPercent<100};
  });
 }
 async book(actor:string,slug:string,course:string,query:Record<string,unknown>) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await gradebookScope(c,actor,slug,course),scope=academicScope(s),section=query.sectionId===undefined?null:uuid(query.sectionId);
   if(section)await selectedSections(c,s,[section]);
   const p=bookPage(query,JSON.stringify(["gradebook",s.member.institution_id,course,actor,section]));
   const rows=(await c.query(`WITH grouped AS (
    SELECT g.student_id,g.section_id,min(g.created_at) AS date
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
    const grades=(await c.query(`${gradeResults}
     WHERE g.institution_id=$1 AND i.course_id=$2 AND g.student_id=$3 AND g.section_id=$4 ORDER BY k.position,i.created_at,i.id`,
     [s.member.institution_id,course,row.student_id,row.section_id])).rows;
    items.push({student:{id:row.student_id,name:row.name,email:row.email,active:row.active},sectionId:row.section_id,
     grades:grades.map(gradeResultDto),...await resultSummary(c,grades,s.course.gradebook_grouped)});
   }
   return {courseId:course,items,hasMore,nextCursor:hasMore && last?Buffer.from(JSON.stringify({scope:p.scope,date:last.cursor_date,id:last.student_id,section:last.section_id})).toString("base64url"):null};
  });
 }
}
