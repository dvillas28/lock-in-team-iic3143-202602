import {ConflictException, UnprocessableEntityException} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import type {PoolClient, QueryResultRow} from "pg";
import type {GradebookScope} from "./gradebook-access";
import type {groupsInput} from "./gradebook-validation";

export const groupDto=(r:QueryResultRow)=>({
 id:r.id as string,title:r.title as string,weightPercent:Number(r.weight_percent),position:Number(r.position)
});

export async function groupsFor(c:PoolClient,s:GradebookScope) {
 const {rows}=await c.query(`SELECT * FROM public.grade_groups
  WHERE institution_id=$1 AND course_id=$2 ORDER BY position,id`,[s.member.institution_id,s.courseId]);
 return rows.map(groupDto);
}

export async function configureGroups(c:PoolClient,s:GradebookScope,input:ReturnType<typeof groupsInput>,items:QueryResultRow[]) {
 const tenant=s.member.institution_id,course=s.courseId;
 const groups=await groupsFor(c,s);
 const previous={
  calculation:s.course.gradebook_grouped?"points":"legacy",
  groups:groups.map(g=>({...g,gradeItemIds:items.filter(i=>i.group_id===g.id).map(i=>i.id as string)})),
 };
 if(s.course.gradebook_version!==input.expectedVersion) {
  const same=s.course.gradebook_grouped && s.course.gradebook_version===input.expectedVersion+1 &&
   input.groups.length===previous.groups.length && input.groups.every((g,index)=>{
    const saved=previous.groups[index];
    return isDeepStrictEqual({...g,id:g.id??saved.id,position:index+1},saved);
   });
  if(same)return null;
  throw new ConflictException({code:"GRADEBOOK_CHANGED"});
 }
 const known=new Set(groups.map(g=>g.id));
 const assigned=input.groups.flatMap(g=>g.gradeItemIds);
 if(input.groups.some(g=>g.id!==null && !known.has(g.id)) || assigned.length!==items.length ||
  items.some(i=>!assigned.includes(i.id)) || input.groups.reduce((sum,g)=>sum+Math.round(g.weightPercent*100),0)!==10000) {
  throw new UnprocessableEntityException({code:"INVALID_GRADE_GROUPS"});
 }
 if((!s.course.gradebook_grouped && items.length>0 || s.course.grade_items_locked_at!==null) && !input.confirmRecalculation) {
  throw new ConflictException({code:"GRADEBOOK_CONFIRM_RECALCULATION"});
 }
 const next={calculation:"points",groups:input.groups.map((g,index)=>({...g,id:g.id??randomUUID(),position:index+1}))};
 if(isDeepStrictEqual(previous,next))return null;
 await c.query(`INSERT INTO public.grade_groups(id,institution_id,course_id,title,weight_percent,position)
  SELECT (g->>'id')::uuid,$2,$3,g->>'title',(g->>'weightPercent')::numeric,(g->>'position')::int
  FROM jsonb_array_elements($1::jsonb) g
  ON CONFLICT(institution_id,course_id,id) DO UPDATE
   SET title=EXCLUDED.title,weight_percent=EXCLUDED.weight_percent,position=EXCLUDED.position`,
 [JSON.stringify(next.groups),tenant,course]);
 await c.query(`UPDATE public.grade_items i SET group_id=(g->>'id')::uuid
  FROM jsonb_array_elements($1::jsonb) g CROSS JOIN LATERAL jsonb_array_elements_text(g->'gradeItemIds') a(id)
  WHERE i.institution_id=$2 AND i.course_id=$3 AND i.id=a.id::uuid AND i.group_id<>(g->>'id')::uuid`,
 [JSON.stringify(next.groups),tenant,course]);
 await c.query(`DELETE FROM public.grade_groups WHERE institution_id=$1 AND course_id=$2 AND NOT(id=ANY($3::uuid[]))`,
 [tenant,course,next.groups.map(g=>g.id)]);
 await c.query(`UPDATE public.courses SET gradebook_grouped=true,gradebook_version=gradebook_version+1
  WHERE institution_id=$1 AND id=$2`,[tenant,course]);
 return {before:previous,after:next};
}
