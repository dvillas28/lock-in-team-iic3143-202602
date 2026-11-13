import { Injectable,NotFoundException,ConflictException,BadRequestException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { QueryResultRow,PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { lockContext,sectionScope,requirePermission } from "../courses/course-access";
import { page,paginated } from "../courses/validation";
import { requireStudentSeat } from "../sections/section-capacity";
const dto=(e:QueryResultRow)=>({id:e.id,sectionId:e.section_id,user:{id:e.user_id,email:e.email,name:e.name,active:e.user_active},role:e.role,active:e.active,createdAt:e.created_at});
const snapshot=(e:QueryResultRow)=>({id:e.id,userId:e.user_id,sectionId:e.section_id,role:e.role,active:e.active});
// Teacher enrollments are owner-only; teachers keep managing students and assistants of their section.
const mayManage=(scope:{owner:boolean;roles:QueryResultRow[]},roles:string[])=>scope.owner || !roles.includes("teacher") && scope.roles.some(e=>e.role==="teacher");
@Injectable()
export class EnrollmentsService {
 constructor(private readonly database:DatabaseService,private readonly audit:AuditService) {}
 async list(actor:string,slug:string,section:string,query:Record<string,unknown>) {
 return this.database.withInstitution(actor,slug,async (db,member)=>{
  const m=member,scope=await sectionScope(db,m,section);
  requirePermission(scope.owner || scope.roles.some(e=>["teacher","assistant"].includes(e.role)));
  // Optional view filter: active roster or revoked history; absent keeps the full list.
  const status=query.status===undefined?null:query.status;
  if(status!==null && status!=="active" && status!=="historical")throw new BadRequestException();
  const p=page(query,JSON.stringify(["enrollments",m.institution_id,section,actor,status]),["status"]);
  const rows=(await db.query(`SELECT e.*,u.email,u.name,u.active AS user_active,
   to_char(e.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
   FROM public.enrollments e JOIN public.users u ON u.id=e.user_id WHERE e.institution_id=$1 AND e.section_id=$2
   AND ($3::timestamptz IS NULL OR (e.created_at,e.id)>($3::timestamptz,$4::uuid)) AND ($6::boolean IS NULL OR e.active=$6) ORDER BY e.created_at,e.id LIMIT $5`,[m.institution_id,section,p.date,p.id,p.limit+1,status===null?null:status==="active"])).rows;
  const result=paginated(rows,p,r=>r.cursor_date);return {...result,items:result.items.map(dto)};

 });
}
 // Read-only roster for every active participant of the section (owner included): one row per user, no email, history or audit data.
 async participants(actor:string,slug:string,section:string) {
  return this.database.withInstitution(actor,slug,async (db,m)=>{
   await sectionScope(db,m,section);
   const rank="CASE e.role WHEN 'teacher' THEN 0 WHEN 'assistant' THEN 1 ELSE 2 END";
   const rows=(await db.query(`SELECT u.id,u.name,array_agg(e.role ORDER BY ${rank}) AS roles
    FROM public.enrollments e JOIN public.users u ON u.id=e.user_id
    JOIN public.institution_memberships im ON im.institution_id=e.institution_id AND im.user_id=e.user_id
    WHERE e.institution_id=$1 AND e.section_id=$2 AND e.active AND u.active AND im.active
    GROUP BY u.id,u.name ORDER BY min(${rank}),lower(u.name),u.id`,[m.institution_id,section])).rows;
   return {items:rows.map(r=>({userId:r.id,name:r.name,roles:r.roles}))};
  });
 }
 private async result(db:PoolClient,id:string) {return dto((await db.query("SELECT e.*,u.email,u.name,u.active AS user_active FROM public.enrollments e JOIN public.users u ON u.id=e.user_id WHERE e.id=$1",[id])).rows[0]);}
 async create(actor:string,slug:string,section:string,user:string,role:string) {
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug,[user]),scope=await sectionScope(db,m,section,true);
   requirePermission(mayManage(scope,[role]));
   const existing=(await db.query("SELECT id FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND user_id=$3 AND role=$4 AND active",[m.institution_id,section,user,role])).rows[0];
   if(existing)return {created:false,item:await this.result(db,existing.id)};
   if(role==="student")await requireStudentSeat(db,m.institution_id,scope.section);
   const e=(await db.query("INSERT INTO public.enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5) RETURNING *",[randomUUID(),m.institution_id,section,user,role])).rows[0];
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,courseId:scope.course.id,sectionId:section,action:"enrollment.created",resourceType:"enrollment",resourceId:e.id,before:null,after:snapshot(e)});
   return {created:true,item:await this.result(db,e.id)};
  });
 }
 async update(actor:string,slug:string,section:string,id:string,input:{role?:string;active?:boolean}) {
  return this.database.withInstitution(actor,slug,async db=>{
   const target=(await db.query(`SELECT e.user_id FROM public.enrollments e JOIN public.institutions i ON i.id=e.institution_id
    WHERE i.slug=$1 AND e.section_id=$2 AND e.id=$3`,[slug,section,id])).rows[0];
   const m=await lockContext(db,actor,slug,target?[target.user_id]:[]),scope=await sectionScope(db,m,section,true,id);
   requirePermission(scope.owner || scope.roles.some(e=>e.role==="teacher"));
   const e=(await db.query("SELECT * FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND id=$3 FOR UPDATE",[m.institution_id,section,id])).rows[0];
   if(!e)throw new NotFoundException();
   requirePermission(mayManage(scope,[e.role,input.role??e.role]));
   if(e.role==="teacher" && e.active && (input.active===false || input.role!==undefined && input.role!=="teacher")) {
    requirePermission(e.user_id!==actor);
    // The course lock taken by sectionScope serializes concurrent removals of the remaining teachers.
    const others=(await db.query("SELECT count(*)::int AS n FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND role='teacher' AND active AND id<>$3",[m.institution_id,section,id])).rows[0].n;
    if(!others)throw new ConflictException({code:"LAST_SECTION_TEACHER"});
   }
   let after:QueryResultRow=e;
   if(input.role!==undefined) {
    if(!e.active)throw new ConflictException();
    if(e.role===input.role)return this.result(db,id);
    const existing=(await db.query("SELECT * FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND user_id=$3 AND role=$4 AND active",[m.institution_id,section,e.user_id,input.role])).rows[0];
    // Becoming a student takes a seat unless an active student enrollment already holds one.
    if(input.role==="student" && !existing)await requireStudentSeat(db,m.institution_id,scope.section);
    await db.query("UPDATE public.enrollments SET active=false WHERE id=$1",[id]);
    after=existing??(await db.query("INSERT INTO public.enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5) RETURNING *",[randomUUID(),m.institution_id,section,e.user_id,input.role])).rows[0];
   } else {
    if(e.active===input.active)return this.result(db,id);
    // Reactivating a student enrollment takes a seat like a new one.
    if(input.active && e.role==="student")await requireStudentSeat(db,m.institution_id,scope.section);
    after=(await db.query("UPDATE public.enrollments SET active=$1 WHERE id=$2 RETURNING *",[input.active,id])).rows[0];
   }
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,courseId:scope.course.id,sectionId:section,action:input.role===undefined?"enrollment.activeChanged":"enrollment.roleChanged",resourceType:"enrollment",resourceId:id,before:snapshot(e),after:snapshot(after)});
   return this.result(db,after.id);
  });
 }
}
