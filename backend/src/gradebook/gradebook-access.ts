import {NotFoundException} from "@nestjs/common";
import type {PoolClient} from "pg";
import {lockContext,courseScope,requirePermission} from "../courses/course-access";
export async function gradebookScope(db:PoolClient,actor:string,slug:string,course:string) {
 const member=await lockContext(db,actor,slug),scope=await courseScope(db,member,course,true);
 return {...scope,member,courseId:course};
}
export type GradebookScope=Awaited<ReturnType<typeof gradebookScope>>;
export function academicScope(s:GradebookScope,write=false) {
 const teachers=s.roles.filter(e=>e.role==="teacher");
 const sections=s.roles.filter(e=>e.role==="teacher" || (!write && e.role==="assistant")).map(e=>e.section_id as string);
 requirePermission(sections.length>0);
 return {global:s.owner && teachers.length>0,sections};
}
export async function selectedSections(db:PoolClient,s:GradebookScope,ids:string[],write=false) {
 const scope=academicScope(s,write);
 const rows=(await db.query("SELECT id FROM public.sections WHERE institution_id=$1 AND course_id=$2 AND id=ANY($3::uuid[])",[s.member.institution_id,s.courseId,ids])).rows;
 if(rows.length!==ids.length || (!scope.global && ids.some(id=>!scope.sections.includes(id))))throw new NotFoundException();
 return scope;
}
