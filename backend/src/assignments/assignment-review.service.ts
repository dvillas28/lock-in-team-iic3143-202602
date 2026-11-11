import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import { requirePermission } from "../courses/course-access";
import { object, timestamp, uuid } from "../courses/validation";
import { DatabaseService } from "../database/database.service";
import { gradebookScope } from "../gradebook/gradebook-access";
import { pointsInput } from "../gradebook/gradebook-validation";
import { gradeResults } from "../gradebook/gradebook-results";
import { assignmentForSubmission, requireReviewer } from "./submission-access";
import { attemptDto, attemptFields } from "./submission-results";
import { assignmentGradeDto } from "./submission-grades";
import { feedbackInput, invalid } from "./submission-validation";

@Injectable()
export class AssignmentReviewService {
 constructor(private readonly db: DatabaseService, private readonly audit: AuditService) {}

 async roster(actor: string, slug: string, course: string, id: string) {
  return this.db.withInstitution(actor,slug,async c=>{
   const scope=await gradebookScope(c,actor,slug,course), tenant=scope.member.institution_id;
   const a=await assignmentForSubmission(c,scope,id);
   const review=requireReviewer(scope,a.section_id,a.status);
   const result=await c.query(`WITH pairs AS (
    SELECT e.user_id AS student_id,e.section_id FROM public.enrollments e
    JOIN public.sections s ON (s.institution_id,s.id)=(e.institution_id,e.section_id)
    JOIN public.institution_memberships m ON (m.institution_id,m.user_id)=(e.institution_id,e.user_id)
    JOIN public.users u ON u.id=e.user_id
    WHERE e.institution_id=$1 AND s.course_id=$2 AND e.role='student' AND e.active AND m.active AND u.active
    UNION
    SELECT student_id,section_id FROM public.assignment_attempts WHERE institution_id=$1 AND assignment_id=$3
   )
   SELECT p.student_id,p.section_id,u.name,s.code,latest.attempt_number,latest.is_late,g.id AS grade_id,g.published_at,
    to_char(g.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS version_stamp
   FROM pairs p JOIN public.users u ON u.id=p.student_id
   JOIN public.sections s ON s.institution_id=$1 AND s.id=p.section_id
   LEFT JOIN LATERAL (SELECT attempt_number,is_late FROM public.assignment_attempts
    WHERE institution_id=$1 AND assignment_id=$3 AND student_id=p.student_id AND section_id=p.section_id
    ORDER BY attempt_number DESC LIMIT 1) latest ON true
   LEFT JOIN public.grades g ON g.institution_id=$1 AND g.assignment_id=$3 AND g.student_id=p.student_id AND g.section_id=p.section_id
   WHERE p.student_id<>$7 AND ($4::uuid IS NULL OR p.section_id=$4) AND ($5::boolean OR p.section_id=ANY($6::uuid[]))
   ORDER BY s.code,u.name,p.student_id`,[tenant,course,id,a.section_id,review.global,review.sections,actor]);
   return {gradeItemId:a.grade_item_id,students:result.rows.map(row=>({
    studentId:row.student_id,sectionId:row.section_id,name:row.name,sectionCode:row.code,
    latestAttempt:row.attempt_number,isLate:row.is_late,
    draft:row.grade_id && !row.published_at ? {id:row.grade_id,expectedUpdatedAt:row.version_stamp} : null,
    gradeStatus:row.grade_id===null ? "none" : row.published_at===null ? "draft" : "published",
   }))};
  });
 }

 async review(actor: string, slug: string, course: string, id: string, section: string, student: string) {
  requirePermission(student!==actor);
  return this.db.withInstitution(actor,slug,async c=>{
   const scope=await gradebookScope(c,actor,slug,course), tenant=scope.member.institution_id;
   const a=await assignmentForSubmission(c,scope,id), access=requireReviewer(scope,a.section_id,a.status);
   if ((a.section_id!==null && a.section_id!==section) || (!access.global && !access.sections.includes(section))) throw new NotFoundException();
   const history=await c.query(`SELECT ${attemptFields} FROM public.assignment_attempts a
    WHERE a.institution_id=$1 AND a.assignment_id=$2 AND a.section_id=$3 AND a.student_id=$4 ORDER BY a.attempt_number DESC`,
    [tenant,id,section,student]);
   if (!history.rowCount) {
    const enrolled=await c.query(`SELECT 1 FROM public.enrollments e JOIN public.sections s
     ON (s.institution_id,s.id)=(e.institution_id,e.section_id)
     WHERE e.institution_id=$1 AND s.course_id=$2 AND e.section_id=$3 AND e.user_id=$4 AND e.role='student' AND e.active`,
     [tenant,course,section,student]);
    if (!enrolled.rowCount) throw new NotFoundException();
   }
   const grade=(await c.query(`${gradeResults} WHERE g.institution_id=$1 AND g.assignment_id=$2
    AND g.section_id=$3 AND g.student_id=$4`,[tenant,id,section,student])).rows[0];
   return {attempts:history.rows.map(attemptDto),grade:grade ? assignmentGradeDto(grade) : null};
  });
 }

 async draft(actor: string, slug: string, course: string, id: string, attemptId: string, body: unknown) {
  const input=object(body,["points","feedback","expectedUpdatedAt"],["points","feedback","expectedUpdatedAt"]);
  const points=pointsInput(input.points), feedback=feedbackInput(input.feedback);
  const expected=input.expectedUpdatedAt===null ? null : timestamp(input.expectedUpdatedAt);
  return this.db.withInstitution(actor,slug,async c=>{
   const scope=await gradebookScope(c,actor,slug,course), tenant=scope.member.institution_id;
   const a=await assignmentForSubmission(c,scope,id), review=requireReviewer(scope,a.section_id,a.status);
   const attempt=(await c.query(`SELECT * FROM public.assignment_attempts
    WHERE institution_id=$1 AND assignment_id=$2 AND id=$3
    AND ($4::boolean OR section_id=ANY($5::uuid[]))`,[tenant,id,attemptId,review.global,review.sections])).rows[0];
   if (!attempt) throw new NotFoundException();
   requirePermission(attempt.student_id!==actor);
   if (points>Number(a.max_points)) throw invalid("GRADE_POINTS_OUT_OF_RANGE");
   const current=(await c.query(`${gradeResults} WHERE g.institution_id=$1 AND g.grade_item_id=$2 AND g.student_id=$3`,
    [tenant,a.grade_item_id,attempt.student_id])).rows[0];
   if (current) {
    requirePermission(current.section_id===attempt.section_id);
    if (current.published_at!==null) throw new ConflictException({code:"GRADE_ALREADY_PUBLISHED"});
    if (current.assignment_attempt_id===attemptId && Number(current.assignment_points)===points && current.feedback===feedback) {
     return assignmentGradeDto(current);
    }
   }
   if ((current?.version_stamp??null)!==expected) throw new ConflictException({code:"GRADE_DRAFT_CHANGED"});
   const gradeId=current?.id??randomUUID();
   await c.query(`INSERT INTO public.grades(id,institution_id,grade_item_id,assignment_id,assignment_attempt_id,
    student_id,section_id,assignment_points,feedback) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT(institution_id,grade_item_id,student_id) DO UPDATE SET assignment_attempt_id=excluded.assignment_attempt_id,
     assignment_points=excluded.assignment_points,feedback=excluded.feedback,
     updated_at=greatest(clock_timestamp(),grades.updated_at+interval '1 microsecond')`,
    [gradeId,tenant,a.grade_item_id,id,attemptId,attempt.student_id,attempt.section_id,points,feedback]);
   const row=(await c.query(`${gradeResults} WHERE g.institution_id=$1 AND g.id=$2`,[tenant,gradeId])).rows[0];
   const result=assignmentGradeDto(row);
   await this.audit.record(c,{institutionId:tenant,actorUserId:actor,courseId:course,sectionId:attempt.section_id,
    resourceType:"grade",resourceId:gradeId,action:"grade.draftSaved",
    before:current ? assignmentGradeDto(current) : null,after:result});
   return result;
  });
 }
}

export function reviewParams(query: unknown) {
 const input=object(query,["sectionId","studentId"],["sectionId","studentId"]);
 return {section:uuid(input.sectionId),student:uuid(input.studentId)};
}
