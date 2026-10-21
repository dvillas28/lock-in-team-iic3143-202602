import { randomUUID } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { courseScope,lockContext,requirePermission } from "./course-access";
import type { QueryResultRow } from "pg";
export const courseDto=(c:QueryResultRow)=>({id:c.id,code:c.code,name:c.name,term:c.term,createdBy:c.created_by,createdAt:c.created_at});
@Injectable()
export class CoursesService {
  constructor(private readonly database: DatabaseService,private readonly audit:AuditService) {}
  async list(actor:string,slug:string) {
 return this.database.withInstitution(actor,slug,async (db,member)=>{
    const m=member;
    return {items:(await db.query(`SELECT c.id,c.code,c.name,c.term FROM public.courses c
      JOIN public.institution_memberships m ON m.institution_id=c.institution_id AND m.user_id=$2
      JOIN public.users u ON u.id=m.user_id JOIN public.institutions i ON i.id=c.institution_id
      WHERE c.institution_id=$1 AND m.active AND u.active AND i.active AND
      ((m.is_admin AND c.created_by=$2) OR EXISTS(SELECT 1 FROM public.enrollments e JOIN public.sections s ON s.institution_id=e.institution_id AND s.id=e.section_id
       WHERE e.institution_id=c.institution_id AND s.course_id=c.id AND e.user_id=$2 AND e.active)) ORDER BY c.code,c.term,c.id`,[m.institution_id,actor])).rows};

 });
}
  async get(actor:string,slug:string,id:string) {
 return this.database.withInstitution(actor,slug,async (db,member)=>{const m=member;return courseDto((await courseScope(db,m,id)).course);
 });
}
  async create(actor:string,slug:string,input:{code:string;name:string;term:string;initialSection:{code:string;capacity:number|null}}) {
    return this.database.withInstitution(actor,slug,async db=>{
      const m=await lockContext(db,actor,slug);requirePermission(m.is_admin);
      const id=randomUUID(),sectionId=randomUUID(),enrollmentId=randomUUID();
      const c=(await db.query("INSERT INTO public.courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        [id,m.institution_id,input.code,input.name,input.term,actor])).rows[0];
      await db.query("INSERT INTO public.sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,$4,$5)",[sectionId,m.institution_id,id,input.initialSection.code,input.initialSection.capacity]);
      await db.query("INSERT INTO public.enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,'teacher')",[enrollmentId,m.institution_id,sectionId,actor]);
      const event={institutionId:m.institution_id,actorUserId:actor,courseId:id,before:null};
      await this.audit.record(db,{...event,action:"course.created",resourceType:"course",resourceId:id,after:courseDto(c)});
      await this.audit.record(db,{...event,action:"section.created",resourceType:"section",resourceId:sectionId,sectionId,after:input.initialSection});
      await this.audit.record(db,{...event,action:"enrollment.created",resourceType:"enrollment",resourceId:enrollmentId,sectionId,after:{id:enrollmentId,userId:actor,sectionId,role:"teacher",active:true}});
      return courseDto(c);
    });
  }
  async update(actor:string,slug:string,id:string,input:{code?:string;name?:string;term?:string}) {
    return this.database.withInstitution(actor,slug,async db=>{
      const m=await lockContext(db,actor,slug),scope=await courseScope(db,m,id,true);requirePermission(scope.owner);
      const before=courseDto(scope.course),after={...before,...input};
      if(before.code===after.code && before.name===after.name && before.term===after.term)return before;
      const c=(await db.query("UPDATE public.courses SET code=$1,name=$2,term=$3 WHERE institution_id=$4 AND id=$5 RETURNING *",[after.code,after.name,after.term,m.institution_id,id])).rows[0];
      await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,courseId:id,action:"course.updated",resourceType:"course",resourceId:id,before,after:courseDto(c)});
      return courseDto(c);
    });
  }

}
