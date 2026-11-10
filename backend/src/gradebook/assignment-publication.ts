import { NotFoundException } from "@nestjs/common";
import type { PoolClient } from "pg";
import { academicScope, type GradebookScope } from "./gradebook-access";
import type { publicationRequest } from "./gradebook-validation";

type Request = Extract<ReturnType<typeof publicationRequest>,{scope:"assignment"}>;

export async function assignmentDraftsForPublication(c: PoolClient, scope: GradebookScope, input: Request) {
 const access=academicScope(scope,true);
 const result=await c.query(`SELECT g.*,to_char(g.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS version_stamp
  FROM public.grades g JOIN public.grade_items i ON (i.institution_id,i.id)=(g.institution_id,g.grade_item_id)
  WHERE g.institution_id=$1 AND i.course_id=$2 AND g.grade_item_id=$3 AND g.assignment_id IS NOT NULL
   AND ($4::boolean OR g.section_id=ANY($5::uuid[])) AND g.id=ANY($6::uuid[]) AND g.student_id<>$7
  ORDER BY g.id FOR UPDATE OF g`,
  [scope.member.institution_id,scope.courseId,input.gradeItemId,access.global,access.sections,input.grades.map(g=>g.id),scope.member.user_id]);
 if (result.rows.length!==input.grades.length) throw new NotFoundException();
 return result.rows;
}
