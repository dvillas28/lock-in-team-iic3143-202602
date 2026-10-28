import {Injectable} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {requirePermission} from "../courses/course-access";
import {contentScope,visibleModule,visibleMaterial,materialDto,type MaterialRow} from "../content/content-access";
import {object,title,markdown,noBody} from "../content/content-validation";
@Injectable()
export class MaterialsService {
 constructor(private readonly db:DatabaseService,private readonly audit:AuditService) {}
 async create(actor:string,slug:string,module:string,body:unknown) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,module,"module");await visibleModule(c,s,module);requirePermission(s.teacher);
   const dto=object(body,["title","markdownBody"],["title","markdownBody"]),name=title(dto.title),source=markdown(dto.markdownBody);
   const row=(await c.query<MaterialRow>(`INSERT INTO public.materials(id,institution_id,module_id,title,markdown_body,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[randomUUID(),s.member.institution_id,module,name,source,actor])).rows[0];
   const after=materialDto(row);
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:"material.created",resourceType:"material",resourceId:row.id,courseId:s.courseId,before:null,after});
   return after;
  });
 }
 async update(actor:string,slug:string,id:string,body:unknown,state?:boolean) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,id,"material"),row=await visibleMaterial(c,s,id);requirePermission(s.teacher);
   const before=materialDto(row);
   if(state===undefined) {
    const dto=object(body,["title","markdownBody"]),name=dto.title===undefined?row.title:title(dto.title),source=dto.markdownBody===undefined?row.markdown_body:markdown(dto.markdownBody);
    if(name===row.title && source===row.markdown_body)return before;
    await c.query("UPDATE public.materials SET title=$1,markdown_body=$2 WHERE institution_id=$3 AND id=$4",[name,source,s.member.institution_id,id]);
   } else {
    noBody(body);if(state===(row.published_at!==null))return before;
    await c.query(`UPDATE public.materials SET published_at=${state?"clock_timestamp()":"NULL"} WHERE institution_id=$1 AND id=$2`,[s.member.institution_id,id]);
   }
   const after=materialDto(await visibleMaterial(c,s,id));
   await this.audit.record(c,{institutionId:s.member.institution_id,actorUserId:actor,action:state===undefined?"material.updated":state?"material.published":"material.unpublished",resourceType:"material",resourceId:id,courseId:s.courseId,before,after});
   return after;
  });
 }
 async get(actor:string,slug:string,id:string) {
  return this.db.withInstitution(actor,slug,async c=>{const s=await contentScope(c,actor,slug,id,"material");return materialDto(await visibleMaterial(c,s,id));});
 }
 async list(actor:string,slug:string,module:string) {
  return this.db.withInstitution(actor,slug,async c=>{
   const s=await contentScope(c,actor,slug,module,"module");await visibleModule(c,s,module);
   const rows=(await c.query<MaterialRow>(`SELECT a.id,a.module_id,a.title,a.kind,a.markdown_body,a.published_at,a.created_by
    FROM public.materials a JOIN public.course_modules m ON m.institution_id=a.institution_id AND m.id=a.module_id
    WHERE a.institution_id=$1 AND a.module_id=$2 AND m.course_id=$3 AND ($4::boolean OR (m.published_at IS NOT NULL AND a.published_at IS NOT NULL)) ORDER BY a.id`,[s.member.institution_id,module,s.courseId,s.teacher])).rows;
   return {items:rows.map(materialDto)};
  });
 }
}
