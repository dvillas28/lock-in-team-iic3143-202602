import {Injectable,ConflictException,NotFoundException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {transaction,requirePermission} from "../courses/course-access";
import {contentScope,visibleModule,moduleDto,type ModuleRow} from "../content/content-access";
import {object,title,position,order,noBody} from "../content/content-validation";
@Injectable()
export class ModulesService {
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService) {}
 async create(actor:string,slug:string,course:string,body:unknown) {
  return transaction(this.db.pool,async c=>{
   const s=await contentScope(c,actor,slug,course,"course");requirePermission(s.teacher);
   const dto=object(body,["title","position"],["title","position"]),name=title(dto.title),pos=position(dto.position);
   const row=(await c.query<ModuleRow>(`INSERT INTO public.course_modules(id,institution_id,course_id,title,position) VALUES($1,$2,$3,$4,$5) RETURNING *`,[randomUUID(),s.member.institution_id,course,name,pos])).rows[0];
   const after=moduleDto(row);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:"module.created",resourceType:"courseModule",resourceId:row.id,courseId:course,before:null,after});
   return after;
  });
 }
 async update(actor:string,slug:string,id:string,body:unknown,state?:boolean) {
  return transaction(this.db.pool,async c=>{
   const s=await contentScope(c,actor,slug,id,"module"),row=await visibleModule(c,s,id);requirePermission(s.teacher);
   const before=moduleDto(row);
   if(state===undefined) {
    const dto=object(body,["title"],["title"]),name=title(dto.title);
    if(name===row.title)return before;
    await c.query("UPDATE public.course_modules SET title=$1 WHERE institution_id=$2 AND id=$3",[name,s.member.institution_id,id]);
   } else {
    noBody(body);if(state===(row.published_at!==null))return before;
    await c.query(`UPDATE public.course_modules SET published_at=${state?"clock_timestamp()":"NULL"} WHERE institution_id=$1 AND id=$2`,[s.member.institution_id,id]);
   }
   const after=moduleDto(await visibleModule(c,s,id));
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:state===undefined?"module.updated":state?"module.published":"module.unpublished",resourceType:"courseModule",resourceId:id,courseId:s.courseId,before,after});
   return after;
  });
 }
 async reorder(actor:string,slug:string,course:string,body:unknown) {
  return transaction(this.db.pool,async c=>{
   const s=await contentScope(c,actor,slug,course,"course");requirePermission(s.teacher);
   const dto=object(body,["moduleIds"],["moduleIds"]),ids=order(dto.moduleIds);
   const rows=(await c.query<ModuleRow>("SELECT * FROM public.course_modules WHERE institution_id=$1 AND course_id=$2 ORDER BY position",[s.member.institution_id,course])).rows;
   if(ids.some(id=>!rows.some(m=>m.id===id)))throw new NotFoundException();
   if(ids.length!==rows.length)throw new ConflictException();
   if(rows.every((m,i)=>m.id===ids[i] && m.position===i+1))return {items:rows.map(moduleDto)};
   await c.query("SET CONSTRAINTS course_modules_position_key DEFERRED");
   for(const [i,id] of ids.entries())await c.query("UPDATE public.course_modules SET position=$1 WHERE institution_id=$2 AND course_id=$3 AND id=$4",[i+1,s.member.institution_id,course,id]);
   const sorted=(await c.query<ModuleRow>("SELECT * FROM public.course_modules WHERE institution_id=$1 AND course_id=$2 ORDER BY position",[s.member.institution_id,course])).rows;
   const positions=(list:ModuleRow[])=>({modules:list.map(m=>({id:m.id,position:m.position}))});
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:"module.reordered",resourceType:"course",resourceId:course,courseId:course,before:positions(rows),after:positions(sorted)});
   return {items:sorted.map(moduleDto)};
  });
 }
 async get(actor:string,slug:string,id:string) {
  return transaction(this.db.pool,async c=>{const s=await contentScope(c,actor,slug,id,"module");return moduleDto(await visibleModule(c,s,id));});
 }
 async list(actor:string,slug:string,course:string) {
  return transaction(this.db.pool,async c=>{
   const s=await contentScope(c,actor,slug,course,"course");
   const rows=(await c.query<ModuleRow>(`SELECT id,course_id,title,position,published_at FROM public.course_modules
    WHERE institution_id=$1 AND course_id=$2 AND ($3::boolean OR published_at IS NOT NULL) ORDER BY position`,[s.member.institution_id,course,s.teacher])).rows;
   return {items:rows.map(moduleDto)};
  });
 }
}
