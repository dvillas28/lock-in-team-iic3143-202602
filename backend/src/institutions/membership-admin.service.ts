import { Injectable,NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { context,lockContext,requirePermission,transaction } from "../courses/course-access";
import { page,paginated } from "../courses/validation";
import type { QueryResultRow } from "pg";
const dto=(m:QueryResultRow)=>({id:m.id,user:{id:m.user_id,name:m.name,email:m.email,active:m.user_active},isAdmin:m.is_admin,isSuperAdmin:m.is_super_admin,active:m.active});
@Injectable()
export class MembershipAdminService {
 constructor(private readonly database:DatabaseService,private readonly audit:AuditService) {}
 async list(actor:string,slug:string,query:Record<string,unknown>) {
  const m=await context(this.database.pool,actor,slug);requirePermission(m.is_super_admin);
  const p=page(query,JSON.stringify(["memberships",m.institution_id,actor]));
  const rows=(await this.database.pool.query(`SELECT m.*,u.name,u.email,u.active AS user_active,to_char(m.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
   FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
   WHERE m.institution_id=$1 AND m.active AND u.active AND ($2::timestamptz IS NULL OR (m.created_at,m.id)>($2::timestamptz,$3::uuid))
   ORDER BY m.created_at,m.id LIMIT $4`,[m.institution_id,p.date,p.id,p.limit+1])).rows;
  const result=paginated(rows,p,r=>r.cursor_date);return {...result,items:result.items.map(dto)};
 }
 async set(actor:string,slug:string,id:string,enabled:boolean) {
  return transaction(this.database.pool,async db=>{
   const target=(await db.query("SELECT m.user_id FROM public.institution_memberships m JOIN public.institutions i ON i.id=m.institution_id WHERE m.id=$1 AND i.slug=$2",[id,slug])).rows[0];
   const m=await lockContext(db,actor,slug,target?[target.user_id]:[],true);
   requirePermission(m.is_super_admin);if(!target)throw new NotFoundException();
   const row=(await db.query("SELECT m.*,u.name,u.email,u.active AS user_active FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id WHERE m.id=$1 AND m.institution_id=$2 AND m.active AND u.active",[id,m.institution_id])).rows[0];
   if(!row)throw new NotFoundException();
   if(row.is_admin!==enabled) {
    await db.query("UPDATE public.institution_memberships SET is_admin=$1,updated_at=now() WHERE id=$2",[enabled,id]);
    const before={id,userId:row.user_id,isAdmin:row.is_admin,isSuperAdmin:row.is_super_admin};
    await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,action:"membership.adminChanged",resourceType:"institutionMembership",resourceId:id,before,after:{...before,isAdmin:enabled}});
   }
   return dto({...row,is_admin:enabled});
  });
 }
}
