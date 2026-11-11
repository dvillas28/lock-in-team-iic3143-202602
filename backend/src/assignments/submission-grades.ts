import type { QueryResultRow } from "pg";
import { gradeResultDto } from "../gradebook/gradebook-dto";

export function assignmentGradeDto(row: QueryResultRow) {
 return {...gradeResultDto(row),feedback:row.effective_feedback,updatedAt:row.version_stamp};
}
