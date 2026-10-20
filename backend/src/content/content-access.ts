import {NotFoundException} from "@nestjs/common";
import type {PoolClient} from "pg";
import {lockContext,courseScope} from "../courses/course-access";
export async function contentScope(db:PoolClient,actor:string,slug:string,id:string,kind:"course"|"module"|"material") {
 const member=await lockContext(db,actor,slug);
 let courseId=id;
 if(kind!=="course") {
  const query=kind==="module" ? "SELECT course_id FROM public.course_modules WHERE institution_id=$1 AND id=$2" :
   `SELECT m.course_id FROM public.materials a JOIN public.course_modules m ON m.institution_id=a.institution_id AND m.id=a.module_id
    WHERE a.institution_id=$1 AND a.id=$2`;
  const row=(await db.query(query,[member.institution_id,id])).rows[0];
  if(!row)throw new NotFoundException();
  courseId=row.course_id;
 }
 // The shared course lock serializes visibility changes and revocation with reads and writes.
 const scope=await courseScope(db,member,courseId,true);
 if(!scope.roles.length)throw new NotFoundException();
 return {member,courseId,teacher:scope.roles.some(e=>e.role==="teacher")};
}
export type ContentScope=Awaited<ReturnType<typeof contentScope>>;
export interface ModuleRow {id:string;course_id:string;title:string;position:number;published_at:Date|null}
export interface MaterialRow {id:string;module_id:string;title:string;kind:"markdown";markdown_body:string;published_at:Date|null;created_by:string}
export const moduleDto=(m:ModuleRow)=>({id:m.id,courseId:m.course_id,title:m.title,position:m.position,publishedAt:m.published_at});
export const materialDto=(m:MaterialRow)=>({id:m.id,moduleId:m.module_id,title:m.title,kind:m.kind,markdownBody:m.markdown_body,publishedAt:m.published_at,createdBy:m.created_by});
export async function visibleModule(db:PoolClient,s:ContentScope,id:string) {
 const row=(await db.query<ModuleRow>(`SELECT id,course_id,title,position,published_at FROM public.course_modules
  WHERE institution_id=$1 AND course_id=$2 AND id=$3 AND ($4::boolean OR published_at IS NOT NULL)`,[s.member.institution_id,s.courseId,id,s.teacher])).rows[0];
 if(!row)throw new NotFoundException();
 return row;
}
export async function visibleMaterial(db:PoolClient,s:ContentScope,id:string) {
 const row=(await db.query<MaterialRow>(`SELECT a.id,a.module_id,a.title,a.kind,a.markdown_body,a.published_at,a.created_by
  FROM public.materials a JOIN public.course_modules m ON m.institution_id=a.institution_id AND m.id=a.module_id
  WHERE a.institution_id=$1 AND m.course_id=$2 AND a.id=$3 AND ($4::boolean OR (m.published_at IS NOT NULL AND a.published_at IS NOT NULL))`,
  [s.member.institution_id,s.courseId,id,s.teacher])).rows[0];
 if(!row)throw new NotFoundException();
 return row;
}
