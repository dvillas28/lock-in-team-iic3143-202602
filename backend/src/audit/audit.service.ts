import { context,courseScope,sectionScope,requirePermission,type Sql } from "../courses/course-access";
import { page,paginated,text,uuid,timestamp } from "../courses/validation";
import { BadRequestException,NotFoundException,Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
const fields: Record<string,string[]> = {
 quizAttempt:["id","quizId","studentId","sectionId","attemptNumber","status","startedAt","submittedAt","cancelledAt"],
 grade:["id","gradeItemId","studentId","sectionId","attemptId","scorePercent","grade","publishedAt"],
 quiz:["id","courseId","sectionId","title","opensAt","closesAt","maxAttempts","publishedAt","createdBy","questionCount","totalPoints","gradeItemId"],
 courseModule:["id","courseId","title","position","publishedAt"],
 material:["id","moduleId","title","kind","markdownBody","publishedAt","createdBy"],
 course:["code","name","term","createdBy"], section:["code","capacity"],
 enrollment:["id","userId","sectionId","role","active"],
 institutionMembership:["id","userId","isAdmin","isSuperAdmin","source","operatorRef","operationId","inputFingerprint"],
};
export function snapshot(type: string, value: unknown): Record<string,unknown>|null {
  if(value===null || typeof value!=="object" || Array.isArray(value))return null;
  const source=value as Record<string,unknown>;
  if(type==="moduleOrder" || type==="gradebook") {
    const key=type==="moduleOrder"?"modules":"items",allowed=type==="moduleOrder"?["id","position"]:["gradeItemId","weightPercent"];
    return {[key]:Array.isArray(source[key])?source[key].filter(v=>v && typeof v==="object" && !Array.isArray(v)).map(v=>
      Object.fromEntries(Object.entries(v).filter(([k,val])=>((k===allowed[0] && typeof val==="string") || (k===allowed[1] && typeof val==="number" && Number.isFinite(val)))))):[]};
  }
  return Object.fromEntries(Object.entries(source).filter(([key,val])=>fields[type]?.includes(key) && (val===null || typeof val==="string" || typeof val==="number" || typeof val==="boolean" || val instanceof Date)));
}
export interface Event {institutionId:string; actorUserId:string|null; action:string; resourceType:string; resourceId:string; courseId?:string|null; sectionId?:string|null; before:Record<string,unknown>|null; after:Record<string,unknown>|null}
@Injectable()
export class AuditService {
  async record(client: PoolClient, e: Event) {
    await client.query(`INSERT INTO public.audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,course_id,section_id,changes)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [randomUUID(),e.institutionId,e.actorUserId,e.action,e.resourceType,e.resourceId,e.courseId??null,e.sectionId??null,
      {before:snapshot(e.action==="module.reordered"?"moduleOrder":e.resourceType,e.before),after:snapshot(e.action==="module.reordered"?"moduleOrder":e.resourceType,e.after)}]);
  }
  async list(db:Sql,actor:string,slug:string,course:string,query:Record<string,unknown>) {
    const m=await context(db,actor,slug),scope=await courseScope(db,m,course);
    const sections=scope.roles.filter(e=>e.role==="teacher").map(e=>e.section_id);
    requirePermission(scope.owner || sections.length>0);
    const filters:Record<string,string>={};
    for(const key of ["action","resourceType"])if(query[key]!==undefined)filters[key]=text(query[key],key==="action"?64:32);
    for(const key of ["resourceId","actorUserId","sectionId"])if(query[key]!==undefined)filters[key]=uuid(query[key]);
    for(const key of ["from","to"])if(query[key]!==undefined)filters[key]=timestamp(query[key]);
    if(filters.from && filters.to && filters.from>filters.to)throw new BadRequestException();
    if(filters.sectionId) {
      const visible=await sectionScope(db,m,filters.sectionId);
      if(visible.course.id!==course || (!scope.owner && !sections.includes(filters.sectionId)))throw new NotFoundException();
    }
    const p=page(query,JSON.stringify(["audit",m.institution_id,course,actor,filters]),["action","resourceType","resourceId","actorUserId","sectionId","from","to"]);
    const rows=(await db.query(`SELECT a.*,to_char(a.occurred_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
      FROM public.audit_events a WHERE a.institution_id=$1 AND a.course_id=$2 AND ($3::boolean OR a.section_id=ANY($4::uuid[]))
      AND ($5::text IS NULL OR a.action=$5) AND ($6::text IS NULL OR a.resource_type=$6) AND ($7::uuid IS NULL OR a.resource_id=$7)
      AND ($8::uuid IS NULL OR a.actor_user_id=$8) AND ($9::uuid IS NULL OR a.section_id=$9)
      AND ($10::timestamptz IS NULL OR a.occurred_at>=$10) AND ($11::timestamptz IS NULL OR a.occurred_at<=$11)
      AND ($12::timestamptz IS NULL OR (a.occurred_at,a.id)>($12::timestamptz,$13::uuid)) ORDER BY a.occurred_at,a.id LIMIT $14`,
      [m.institution_id,course,scope.owner,sections,filters.action??null,filters.resourceType??null,filters.resourceId??null,filters.actorUserId??null,filters.sectionId??null,filters.from??null,filters.to??null,p.date,p.id,p.limit+1])).rows;
    const result=paginated(rows,p,r=>r.cursor_date);
    return {...result,items:result.items.map(e=>({id:e.id,institutionId:e.institution_id,actorUserId:e.actor_user_id,action:e.action,resourceType:e.resource_type,resourceId:e.resource_id,courseId:e.course_id,sectionId:e.section_id,occurredAt:e.occurred_at,changes:{before:snapshot(e.action==="module.reordered"?"moduleOrder":e.resource_type,e.changes?.before),after:snapshot(e.action==="module.reordered"?"moduleOrder":e.resource_type,e.changes?.after)}}))};
  }

}
