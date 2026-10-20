-- Up Migration
-- Validate pre-existing publications without rewriting or repairing academic results.
DO $$
BEGIN
 IF EXISTS (
  SELECT 1 FROM public.grades g
  JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
  JOIN public.quiz_attempts a ON a.institution_id=g.institution_id AND a.id=g.attempt_id
  WHERE g.published_at IS NOT NULL AND (
   a.status<>'graded' OR (a.score_percent,a.grade_value) IS DISTINCT FROM (g.score_percent,g.grade_value)
   OR (SELECT sum(weight_percent) FROM public.grade_items x WHERE x.institution_id=i.institution_id AND x.course_id=i.course_id) IS DISTINCT FROM 100::numeric
   OR EXISTS(SELECT 1 FROM public.quiz_attempts newer WHERE newer.institution_id=g.institution_id AND newer.quiz_id=g.quiz_id AND newer.student_id=g.student_id
    AND (newer.status='in_progress' OR (newer.status='graded' AND newer.attempt_number>a.attempt_number)))
  )
 ) THEN RAISE EXCEPTION 'Existing publication violates academic integrity' USING ERRCODE='23514'; END IF;
END $$;
-- Down Migration
-- Validation does not modify academic rows.
SELECT 1;
