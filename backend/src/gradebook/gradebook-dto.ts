import type {QueryResultRow} from "pg";
const numeric=(value:unknown)=>value===null ? null : Number(value);
export const itemDto=(r:QueryResultRow)=>({id:r.id,courseId:r.course_id,quizId:r.quiz_id,...(r.assignment_id ? {assignmentId:r.assignment_id} : {}),title:r.title,
 weightPercent:Number(r.group_weight),groupId:r.group_id,maxPoints:Number(r.max_points),createdAt:r.created_at});
export const gradeDto=(r:QueryResultRow)=>({id:r.id,gradeItemId:r.grade_item_id,studentId:r.student_id,sectionId:r.section_id,attemptId:r.effective_attempt_id??r.assignment_attempt_id??r.attempt_id,
 scorePercent:numeric(r.effective_percent??r.score_percent),grade:numeric(r.effective_grade??r.grade_value),publishedAt:r.published_at});
export const gradeResultDto=(r:QueryResultRow)=>({...gradeDto(r),...(r.assignment_id ? {assignmentId:r.assignment_id} : {}),pointsEarned:Number(r.earned_points),revisionId:r.revision_id,revisedAt:r.revised_at});
export const publishedDto=(r:QueryResultRow)=>({gradeItemId:r.grade_item_id,title:r.title,weightPercent:Number(r.weight_percent),
 groupId:r.group_id,groupTitle:r.group_title,...(r.assignment_id ? {assignmentId:r.assignment_id} : {}),pointsEarned:Number(r.earned_points),maxPoints:Number(r.max_points),
 scorePercent:numeric(r.effective_percent),grade:numeric(r.effective_grade),publishedAt:r.published_at,revisedAt:r.revised_at});
export const receiptDto=(r:QueryResultRow)=>({publishedCount:r.published_count,publishedAt:r.published_at});
