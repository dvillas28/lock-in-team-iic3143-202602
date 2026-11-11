import type { PoolClient, QueryResultRow } from "pg";

export const attemptFields = `a.id,a.section_id,a.attempt_number,a.submitted_at,a.is_late,a.written_response,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('id',f.id,'name',f.file_name,'mediaType',f.media_type,
 'byteSize',f.byte_size,'sha256',f.sha256) ORDER BY f.position) FROM public.assignment_attempt_files f
 WHERE f.institution_id=a.institution_id AND f.attempt_id=a.id),'[]'::jsonb) AS files`;

export function attemptDto(row: QueryResultRow) {
 return {id:row.id,sectionId:row.section_id,attemptNumber:row.attempt_number,submittedAt:row.submitted_at,
  isLate:row.is_late,writtenResponse:row.written_response,files:row.files};
}

export async function receipt(c: PoolClient, tenant: string, id: string) {
 const result = await c.query(`SELECT ${attemptFields} FROM public.assignment_attempts a
  WHERE a.institution_id=$1 AND a.id=$2`,[tenant,id]);
 return attemptDto(result.rows[0]);
}
