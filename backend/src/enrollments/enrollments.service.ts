import { Injectable,NotFoundException,ConflictException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { QueryResultRow,PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { lockContext,sectionScope,requirePermission } from "../courses/course-access";
import { page,paginated } from "../courses/validation";
const dto=(e:QueryResultRow)=>({id:e.id,sectionId:e.section_id,user:{id:e.user_id,email:e.email,name:e.name,active:e.user_active},role:e.role,active:e.active,createdAt:e.created_at});
const snapshot=(e:QueryResultRow)=>({id:e.id,userId:e.user_id,sectionId:e.section_id,role:e.role,active:e.active});
@Injectable()
export class EnrollmentsService {
 constructor(private readonly database:DatabaseService,private readonly audit:AuditService) {}
 async list(actor:string,slug:string,section:string,query:Record<string,unknown>) {
 return this.database.withInstitution(actor,slug,async (db,member)=>{
  const m=member,scope=await sectionScope(db,m,section);
  requirePermission(scope.owner || scope.roles.some(e=>["teacher","assistant"].includes(e.role)));
  const p=page(query,JSON.stringify(["enrollments",m.institution_id,section,actor]));
  const rows=(await db.query(`SELECT e.*,u.email,u.name,u.active AS user_active,
   to_char(e.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
   FROM public.enrollments e JOIN public.users u ON u.id=e.user_id WHERE e.institution_id=$1 AND e.section_id=$2
   AND ($3::timestamptz IS NULL OR (e.created_at,e.id)>($3::timestamptz,$4::uuid)) ORDER BY e.created_at,e.id LIMIT $5`,[m.institution_id,section,p.date,p.id,p.limit+1])).rows;
  const result=paginated(rows,p,r=>r.cursor_date);return {...result,items:result.items.map(dto)};

 });
}
 private async result(db:PoolClient,id:string) {return dto((await db.query("SELECT e.*,u.email,u.name,u.active AS user_active FROM public.enrollments e JOIN public.users u ON u.id=e.user_id WHERE e.id=$1",[id])).rows[0]);}
 async create(actor:string,slug:string,section:string,user:string,role:string) {
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug,[user]),scope=await sectionScope(db,m,section,true);
   requirePermission(scope.owner || scope.roles.some(e=>e.role==="teacher"));
   const existing=(await db.query("SELECT id FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND user_id=$3 AND role=$4 AND active",[m.institution_id,section,user,role])).rows[0];
   if(existing)return {created:false,item:await this.result(db,existing.id)};
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
   let after:QueryResultRow=e;
   if(input.role!==undefined) {
    if(!e.active)throw new ConflictException();
    if(e.role===input.role)return this.result(db,id);
    await db.query("UPDATE public.enrollments SET active=false WHERE id=$1",[id]);
    const existing=(await db.query("SELECT * FROM public.enrollments WHERE institution_id=$1 AND section_id=$2 AND user_id=$3 AND role=$4 AND active",[m.institution_id,section,e.user_id,input.role])).rows[0];
    after=existing??(await db.query("INSERT INTO public.enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5) RETURNING *",[randomUUID(),m.institution_id,section,e.user_id,input.role])).rows[0];
   } else {
    if(e.active===input.active)return this.result(db,id);
    after=(await db.query("UPDATE public.enrollments SET active=$1 WHERE id=$2 RETURNING *",[input.active,id])).rows[0];
   }
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,courseId:scope.course.id,sectionId:section,action:input.role===undefined?"enrollment.activeChanged":"enrollment.roleChanged",resourceType:"enrollment",resourceId:id,before:snapshot(e),after:snapshot(after)});
   return this.result(db,after.id);
  });
 }
}
