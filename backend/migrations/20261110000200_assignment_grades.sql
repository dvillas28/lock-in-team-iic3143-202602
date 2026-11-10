-- Up Migration
ALTER TABLE public.grade_items ADD UNIQUE(institution_id,id,assignment_id);
ALTER TABLE public.grades ALTER COLUMN quiz_id DROP NOT NULL, ALTER COLUMN attempt_id DROP NOT NULL,
 ALTER COLUMN score_percent DROP NOT NULL, ALTER COLUMN grade_value DROP NOT NULL,
 ADD COLUMN assignment_id uuid, ADD COLUMN assignment_attempt_id uuid,
 ADD COLUMN assignment_points numeric(8,2) CHECK(assignment_points>=0),
 ADD COLUMN feedback varchar(4000),
 ADD CHECK ((quiz_id IS NOT NULL AND attempt_id IS NOT NULL AND assignment_id IS NULL AND assignment_attempt_id IS NULL
  AND assignment_points IS NULL AND feedback IS NULL AND score_percent IS NOT NULL AND grade_value IS NOT NULL)
  OR (quiz_id IS NULL AND attempt_id IS NULL AND assignment_id IS NOT NULL AND assignment_attempt_id IS NOT NULL
  AND assignment_points IS NOT NULL AND (score_percent IS NULL)=(grade_value IS NULL))),
 ADD FOREIGN KEY(institution_id,grade_item_id,assignment_id) REFERENCES public.grade_items(institution_id,id,assignment_id),
 ADD FOREIGN KEY(institution_id,assignment_attempt_id,assignment_id,student_id,section_id)
  REFERENCES public.assignment_attempts(institution_id,id,assignment_id,student_id,section_id);

CREATE OR REPLACE FUNCTION public.preserve_grade_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Grade history is immutable' USING ERRCODE='23514'; END IF;
 IF OLD.published_at IS NOT NULL OR
 (NEW.id,NEW.institution_id,NEW.grade_item_id,NEW.quiz_id,NEW.assignment_id,NEW.student_id,NEW.created_at)
 IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.grade_item_id,OLD.quiz_id,OLD.assignment_id,OLD.student_id,OLD.created_at)
 OR (NEW.published_at IS NOT NULL AND
 (NEW.attempt_id,NEW.assignment_attempt_id,NEW.assignment_points,NEW.feedback,NEW.section_id,NEW.score_percent,NEW.grade_value)
 IS DISTINCT FROM (OLD.attempt_id,OLD.assignment_attempt_id,OLD.assignment_points,OLD.feedback,OLD.section_id,OLD.score_percent,OLD.grade_value))
 THEN RAISE EXCEPTION 'Grade history is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.prepare_assignment_grade() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE points numeric;
BEGIN
 SELECT max_points INTO points FROM public.grade_items WHERE institution_id=NEW.institution_id AND id=NEW.grade_item_id;
 IF points IS NULL OR NEW.assignment_points>points THEN
  RAISE EXCEPTION 'Invalid assignment points' USING ERRCODE='23514'; END IF;
 NEW.score_percent:=round(100*NEW.assignment_points/NULLIF(points,0),2);
 NEW.grade_value:=public.chilean_grade(NEW.score_percent);
 RETURN NEW;
END $$;
CREATE TRIGGER grades_assignment_score BEFORE INSERT OR UPDATE ON public.grades
 FOR EACH ROW WHEN (NEW.assignment_id IS NOT NULL) EXECUTE FUNCTION public.prepare_assignment_grade();

CREATE OR REPLACE FUNCTION public.check_grade_publication() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE course uuid; selected_attempt_number integer;
BEGIN
 IF NEW.published_at IS NULL THEN RETURN NEW; END IF;
 SELECT course_id INTO course FROM public.grade_items WHERE institution_id=NEW.institution_id AND id=NEW.grade_item_id;
 PERFORM id FROM public.courses WHERE institution_id=NEW.institution_id AND id=course FOR UPDATE;
 IF (SELECT sum(weight_percent) FROM public.grade_groups WHERE institution_id=NEW.institution_id AND course_id=course) IS DISTINCT FROM 100::numeric
 THEN RAISE EXCEPTION 'Grade is not publishable' USING ERRCODE='23514'; END IF;
 IF NEW.quiz_id IS NOT NULL THEN
  SELECT a.attempt_number INTO selected_attempt_number FROM public.quiz_attempts a
   WHERE a.institution_id=NEW.institution_id AND a.id=NEW.attempt_id
   AND a.status='graded' AND (a.score_percent,a.grade_value)=(NEW.score_percent,NEW.grade_value);
  IF selected_attempt_number IS NULL
  OR EXISTS(SELECT 1 FROM public.quiz_attempts a WHERE a.institution_id=NEW.institution_id AND a.quiz_id=NEW.quiz_id AND a.student_id=NEW.student_id
   AND (a.status='in_progress' OR (a.status='graded' AND a.attempt_number>selected_attempt_number)))
  THEN RAISE EXCEPTION 'Grade is not publishable' USING ERRCODE='23514'; END IF;
 END IF;
 UPDATE public.courses SET grade_items_locked_at=NEW.published_at
  WHERE institution_id=NEW.institution_id AND id=course AND grade_items_locked_at IS NULL;
 RETURN NEW;
END $$;

ALTER TABLE public.grade_revisions ALTER COLUMN score_percent DROP NOT NULL, ALTER COLUMN grade_value DROP NOT NULL,
 ADD COLUMN assignment_attempt_id uuid, ADD COLUMN feedback varchar(4000),
 ADD FOREIGN KEY(institution_id,assignment_attempt_id) REFERENCES public.assignment_attempts(institution_id,id);
CREATE OR REPLACE FUNCTION public.check_grade_revision() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE points numeric; previous uuid; previous_at timestamptz; grade_row public.grades%ROWTYPE;
BEGIN
 SELECT * INTO grade_row FROM public.grades
  WHERE institution_id=NEW.institution_id AND id=NEW.grade_id AND published_at IS NOT NULL FOR UPDATE;
 SELECT max_points INTO points FROM public.grade_items WHERE institution_id=NEW.institution_id AND id=grade_row.grade_item_id;
 SELECT id,created_at INTO previous,previous_at FROM public.grade_revisions
  WHERE institution_id=NEW.institution_id AND grade_id=NEW.grade_id ORDER BY created_at DESC,id DESC LIMIT 1;
 IF points IS NULL OR NEW.score_points>points OR NEW.id=NEW.previous_revision_id
  OR NEW.previous_revision_id IS DISTINCT FROM previous
  OR (grade_row.quiz_id IS NOT NULL AND (NEW.assignment_attempt_id IS NOT NULL OR NEW.feedback IS NOT NULL))
  OR (grade_row.assignment_id IS NOT NULL AND NOT EXISTS(SELECT FROM public.assignment_attempts a
   WHERE (a.institution_id,a.id,a.assignment_id,a.student_id,a.section_id)=
    (NEW.institution_id,NEW.assignment_attempt_id,grade_row.assignment_id,grade_row.student_id,grade_row.section_id))) THEN
  RAISE EXCEPTION 'Invalid grade revision' USING ERRCODE='23514';
 END IF;
 NEW.created_at:=greatest(clock_timestamp(),previous_at+interval '1 microsecond');
 NEW.score_percent:=round(100*NEW.score_points/NULLIF(points,0),2);
 NEW.grade_value:=public.chilean_grade(NEW.score_percent);
 RETURN NEW;
END $$;

CREATE FUNCTION public.freeze_graded_assignment_points() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF EXISTS(SELECT FROM public.grades WHERE institution_id=OLD.institution_id AND grade_item_id=OLD.id)
 THEN RAISE EXCEPTION 'Graded assignment points are immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER assignment_points_history BEFORE UPDATE OF max_points ON public.grade_items
 FOR EACH ROW WHEN (OLD.assignment_id IS NOT NULL AND NEW.max_points IS DISTINCT FROM OLD.max_points)
 EXECUTE FUNCTION public.freeze_graded_assignment_points();

-- Down Migration
DO $$ BEGIN
 RAISE EXCEPTION 'Assignment grade history requires a forward migration';
END $$;
