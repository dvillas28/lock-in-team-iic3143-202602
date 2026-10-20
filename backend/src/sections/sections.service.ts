import { randomUUID } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import { Injectable } from "@nestjs/common";
import type { QueryResultRow } from "pg";
import { DatabaseService } from "../database/database.service";
import { context, courseScope, sectionScope,lockContext,transaction,requirePermission } from "../courses/course-access";
export const sectionDto=(s:QueryResultRow)=>({id:s.id,courseId:s.course_id,code:s.code,capacity:s.capacity,createdAt:s.created_at});
@Injectable()
export class SectionsService {
 constructor(private readonly database: DatabaseService,private readonly audit:AuditService) {}
 async list(actor:string,slug:string,course:string) {
  const m=await context(this.database.pool,actor,slug),scope=await courseScope(this.database.pool,m,course);
  const rows=(await this.database.pool.query(`SELECT * FROM public.sections WHERE institution_id=$1 AND course_id=$2
   AND ($3::boolean OR id=ANY($4::uuid[])) ORDER BY code,id`,[m.institution_id,course,scope.owner,scope.roles.map(e=>e.section_id)])).rows;
  return {items:rows.map(sectionDto)};
 }
 async get(actor:string,slug:string,id:string) {const m=await context(this.database.pool,actor,slug);return sectionDto((await sectionScope(this.database.pool,m,id)).section);}
 async create(actor:string,slug:string,course:string,input:{code:string;capacity:number|null}) {
  return transaction(this.database.pool,async db=>{
   const m=await lockContext(db,actor,slug),scope=await courseScope(db,m,course,true);requirePermission(scope.owner);
   const row=(await db.query("INSERT INTO public.sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,$4,$5) RETURNING *",[randomUUID(),m.institution_id,course,input.code,input.capacity])).rows[0];
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,courseId:course,sectionId:row.id,action:"section.created",resourceType:"section",resourceId:row.id,before:null,after:sectionDto(row)});
   return sectionDto(row);
  });
 }
 async update(actor:string,slug:string,id:string,input:{code?:string;capacity?:number|null}) {
  return transaction(this.database.pool,async db=>{
   const m=await lockContext(db,actor,slug),scope=await sectionScope(db,m,id,true);requirePermission(scope.owner);
   const before=sectionDto(scope.section),after={...before,...input};
   if(before.code===after.code && before.capacity===after.capacity)return before;
   const row=(await db.query("UPDATE public.sections SET code=$1,capacity=$2 WHERE institution_id=$3 AND id=$4 RETURNING *",[after.code,after.capacity,m.institution_id,id])).rows[0];
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,courseId:row.course_id,sectionId:id,action:"section.updated",resourceType:"section",resourceId:id,before,after:sectionDto(row)});
   return sectionDto(row);
  });
 }

}
