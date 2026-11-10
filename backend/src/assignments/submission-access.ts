import { NotFoundException } from "@nestjs/common";
import type { PoolClient } from "pg";
import { requirePermission } from "../courses/course-access";
import type { GradebookScope } from "../gradebook/gradebook-access";

export async function assignmentForSubmission(c: PoolClient, scope: GradebookScope, id: string) {
 const assignment = (await c.query(`SELECT a.*,i.id AS grade_item_id,i.max_points FROM public.assignments a
  JOIN public.grade_items i ON (i.institution_id,i.course_id,i.assignment_id)=(a.institution_id,a.course_id,a.id)
  WHERE a.institution_id=$1 AND a.course_id=$2 AND a.id=$3`,[scope.member.institution_id,scope.courseId,id])).rows[0];
 if (!assignment) throw new NotFoundException();
 return assignment;
}

export function studentSections(scope: GradebookScope, destination: string | null): string[] {
 const teaching=reviewSections(scope,null);
 if (teaching.global) return [];
 return scope.roles.filter(role=>role.role==="student" && !teaching.sections.includes(role.section_id) &&
  (destination===null || role.section_id===destination))
  .map(role=>role.section_id);
}

export function reviewSections(scope: GradebookScope, destination: string | null) {
 const sections: string[] = scope.roles.filter(role=>role.role==="teacher").map(role=>role.section_id);
 const global = scope.owner && sections.length>0;
 return {global, sections:destination===null ? sections : sections.filter(id=>id===destination)};
}

export function requireReviewer(scope: GradebookScope, destination: string | null, status: string) {
 const review = reviewSections(scope,destination);
 requirePermission(review.global || review.sections.length>0);
 if (status==="draft" && destination===null && !review.global) throw new NotFoundException();
 return review;
}
