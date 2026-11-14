import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { timestamp } from "../courses/validation";

const maxRangeMs = 100 * 24 * 60 * 60 * 1000;
const iso = (column: string) => `to_char(${column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const inRange = (...columns: string[]) => `(${columns.map(c => `(${c}>=$3 AND ${c}<$4)`).join(" OR ")})`;

export function calendarRange(query: Record<string, unknown>) {
 if (Object.keys(query).some(k => !["from", "to"].includes(k))) throw new BadRequestException();
 const from = timestamp(query.from), to = timestamp(query.to);
 const span = Date.parse(to) - Date.parse(from);
 if (span <= 0 || span > maxRangeMs) throw new BadRequestException();
 return { from, to };
}

// Visibility mirrors the per-course lists: quizzes follow visibleSql() and assignments follow
// AssignmentsService.visible(). Only courses where the actor teaches or studies are included,
// so assistants and institution admins without enrollment receive no events.
const sql = `WITH mine AS (
  SELECT s.course_id,e.section_id,e.role FROM public.enrollments e
  JOIN public.sections s ON s.institution_id=e.institution_id AND s.id=e.section_id
  WHERE e.institution_id=$1 AND e.user_id=$2 AND e.active
 ), scope AS (
  SELECT c.id,c.code,c.name,
   bool_or(m.role='teacher') AS teacher,
   ($5::boolean AND c.created_by=$2) AS owner,
   coalesce(array_agg(m.section_id) FILTER (WHERE m.role='teacher'),'{}') AS teaches,
   coalesce(array_agg(m.section_id) FILTER (WHERE m.role IN ('teacher','student')),'{}') AS readers,
   array_agg(m.section_id) AS sections
  FROM public.courses c JOIN mine m ON m.course_id=c.id
  WHERE c.institution_id=$1 GROUP BY c.id
  HAVING bool_or(m.role IN ('teacher','student'))
 )
 SELECT 'quiz' AS kind,q.id,q.title,q.section_id,s.id AS course_id,s.code AS course_code,s.name AS course_name,
  CASE WHEN s.teacher THEN 'teacher' ELSE 'student' END AS viewer_role,
  CASE WHEN q.published_at IS NULL THEN 'draft' ELSE 'published' END AS status,
  ${iso("q.opens_at")} AS starts_at,NULL AS due_at,${iso("q.closes_at")} AS closes_at,
  coalesce(q.opens_at,q.closes_at) AS sort_at
 FROM public.quizzes q JOIN scope s ON s.id=q.course_id
 WHERE q.institution_id=$1 AND ${inRange("q.opens_at", "q.closes_at")}
  AND ((s.owner AND s.teacher) OR q.section_id=ANY(s.teaches) OR
   (q.published_at IS NOT NULL AND (q.section_id IS NULL OR q.section_id=ANY(s.sections))))
 UNION ALL
 SELECT 'assignment',a.id,i.title,a.section_id,s.id,s.code,s.name,
  CASE WHEN s.teacher THEN 'teacher' ELSE 'student' END,a.status,
  ${iso("a.available_from")},${iso("a.due_at")},${iso("a.available_until")},
  coalesce(a.available_from,a.due_at,a.available_until)
 FROM public.assignments a JOIN scope s ON s.id=a.course_id
 JOIN public.grade_items i ON (i.institution_id,i.course_id,i.assignment_id)=(a.institution_id,a.course_id,a.id)
 WHERE a.institution_id=$1 AND ${inRange("a.available_from", "a.due_at", "a.available_until")}
  AND ((s.owner AND cardinality(s.teaches)>0) OR a.section_id=ANY(s.teaches) OR
   (a.status='published' AND ((a.section_id IS NULL AND cardinality(s.readers)>0) OR a.section_id=ANY(s.readers))))
 ORDER BY sort_at,id`;

@Injectable()
export class CalendarService {
 constructor(private readonly db: DatabaseService) {}

 list(actor: string, slug: string, query: Record<string, unknown>) {
  const { from, to } = calendarRange(query);
  return this.db.withInstitution(actor, slug, async (c, member) => {
   const rows = (await c.query(sql, [member.institution_id, actor, from, to, member.is_admin])).rows;
   return {
    from, to,
    events: rows.map(r => ({
     id: r.id as string, kind: r.kind as "quiz" | "assignment", title: r.title as string,
     course: { id: r.course_id as string, code: r.course_code as string, name: r.course_name as string },
     sectionId: r.section_id as string | null, status: r.status as string, viewerRole: r.viewer_role as string,
     startsAt: r.starts_at as string | null, dueAt: r.due_at as string | null, closesAt: r.closes_at as string | null,
    })),
   };
  });
 }
}
