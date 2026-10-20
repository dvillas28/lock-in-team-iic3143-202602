import type {QueryResultRow} from "pg";
export const itemDto=(r:QueryResultRow)=>({id:r.id,courseId:r.course_id,quizId:r.quiz_id,title:r.title,weightPercent:Number(r.weight_percent),createdAt:r.created_at});
export const gradeDto=(r:QueryResultRow)=>({id:r.id,gradeItemId:r.grade_item_id,studentId:r.student_id,sectionId:r.section_id,attemptId:r.attempt_id,
 scorePercent:Number(r.score_percent),grade:Number(r.grade_value),publishedAt:r.published_at});
export const publishedDto=(r:QueryResultRow)=>({gradeItemId:r.grade_item_id,title:r.title,weightPercent:Number(r.weight_percent),scorePercent:Number(r.score_percent),grade:Number(r.grade_value),publishedAt:r.published_at});
export const receiptDto=(r:QueryResultRow)=>({publishedCount:r.published_count,publishedAt:r.published_at});
