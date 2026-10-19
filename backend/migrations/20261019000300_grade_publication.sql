-- Up Migration
CREATE TABLE public.grade_publications (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, course_id uuid NOT NULL, actor_user_id uuid NOT NULL,
 idempotency_key text NOT NULL CHECK(char_length(idempotency_key) BETWEEN 1 AND 200),
 request jsonb NOT NULL CHECK(jsonb_typeof(request)='object'),
 published_count integer NOT NULL CHECK(published_count>0), published_at timestamptz(6) NOT NULL,
 UNIQUE(institution_id,actor_user_id,idempotency_key),
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,actor_user_id) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE FUNCTION public.preserve_publication_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Publication receipt is immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER publications_history BEFORE UPDATE OR DELETE ON public.grade_publications
 FOR EACH ROW EXECUTE FUNCTION public.preserve_publication_receipt();
CREATE OR REPLACE FUNCTION public.check_grade_items_open() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tenant uuid; course uuid; frozen timestamptz;
BEGIN
 IF TG_OP='INSERT' THEN tenant:=NEW.institution_id; course:=NEW.course_id;
 ELSE tenant:=OLD.institution_id; course:=OLD.course_id; END IF;
 SELECT grade_items_locked_at INTO frozen FROM public.courses WHERE institution_id=tenant AND id=course FOR UPDATE;
 IF TG_OP='UPDATE' AND (NEW.id,NEW.institution_id,NEW.course_id,NEW.quiz_id,NEW.created_at)
  IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.course_id,OLD.quiz_id,OLD.created_at)
 THEN RAISE EXCEPTION 'Grade item identity is immutable' USING ERRCODE='23514'; END IF;
 IF frozen IS NOT NULL OR EXISTS(SELECT 1 FROM public.grades g JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
  WHERE i.institution_id=tenant AND i.course_id=course AND g.published_at IS NOT NULL) THEN
  IF TG_OP<>'UPDATE' THEN RAISE EXCEPTION 'Frozen gradebook' USING ERRCODE='23514',CONSTRAINT='grade_items_course_frozen'; END IF;
  IF NEW.weight_percent IS DISTINCT FROM OLD.weight_percent THEN
   RAISE EXCEPTION 'Frozen gradebook' USING ERRCODE='23514',CONSTRAINT='grade_items_course_frozen'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DROP TRIGGER grade_items_open ON public.grade_items;
CREATE TRIGGER grade_items_open BEFORE INSERT OR UPDATE OR DELETE ON public.grade_items
 FOR EACH ROW EXECUTE FUNCTION public.check_grade_items_open();
CREATE FUNCTION public.check_grade_publication() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE course uuid;
BEGIN
 IF NEW.published_at IS NULL THEN RETURN NEW; END IF;
 SELECT course_id INTO course FROM public.grade_items WHERE institution_id=NEW.institution_id AND id=NEW.grade_item_id;
 PERFORM id FROM public.courses WHERE institution_id=NEW.institution_id AND id=course FOR UPDATE;
 IF (SELECT sum(weight_percent) FROM public.grade_items WHERE institution_id=NEW.institution_id AND course_id=course) IS DISTINCT FROM 100::numeric
 OR NOT EXISTS(SELECT 1 FROM public.quiz_attempts a WHERE a.institution_id=NEW.institution_id AND a.id=NEW.attempt_id
  AND a.status='graded' AND (a.score_percent,a.grade_value)=(NEW.score_percent,NEW.grade_value))
 OR EXISTS(SELECT 1 FROM public.quiz_attempts a WHERE a.institution_id=NEW.institution_id AND a.quiz_id=NEW.quiz_id AND a.student_id=NEW.student_id
  AND (a.status='in_progress' OR (a.status='graded' AND a.attempt_number>(SELECT attempt_number FROM public.quiz_attempts WHERE id=NEW.attempt_id))))
 THEN RAISE EXCEPTION 'Grade is not publishable' USING ERRCODE='23514'; END IF;
 UPDATE public.courses SET grade_items_locked_at=NEW.published_at
  WHERE institution_id=NEW.institution_id AND id=course AND grade_items_locked_at IS NULL;
 RETURN NEW;
END $$;
CREATE TRIGGER grades_publication BEFORE INSERT OR UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.check_grade_publication();
UPDATE public.courses c SET grade_items_locked_at=first_publication.at
 FROM (SELECT i.institution_id,i.course_id,min(g.published_at) AS at FROM public.grade_items i JOIN public.grades g
 ON g.institution_id=i.institution_id AND g.grade_item_id=i.id WHERE g.published_at IS NOT NULL GROUP BY i.institution_id,i.course_id) first_publication
 WHERE c.institution_id=first_publication.institution_id AND c.id=first_publication.course_id AND c.grade_items_locked_at IS NULL;
CREATE INDEX grades_section_student_idx ON public.grades(institution_id,section_id,student_id);
-- Down Migration
DROP INDEX public.grades_section_student_idx;
DROP TRIGGER grades_publication ON public.grades;
DROP FUNCTION public.check_grade_publication();
DROP TABLE public.grade_publications;
DROP FUNCTION public.preserve_publication_receipt();
DROP TRIGGER grade_items_open ON public.grade_items;
CREATE OR REPLACE FUNCTION public.check_grade_items_open() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE frozen timestamptz;
BEGIN
 SELECT grade_items_locked_at INTO frozen FROM public.courses WHERE institution_id=NEW.institution_id AND id=NEW.course_id FOR UPDATE;
 IF frozen IS NOT NULL THEN RAISE EXCEPTION 'Frozen gradebook' USING ERRCODE='23514',CONSTRAINT='grade_items_course_frozen'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER grade_items_open BEFORE INSERT ON public.grade_items FOR EACH ROW EXECUTE FUNCTION public.check_grade_items_open();
