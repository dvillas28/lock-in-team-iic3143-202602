-- Up Migration
CREATE TABLE public.quiz_attempts (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, course_id uuid NOT NULL, quiz_id uuid NOT NULL,
 section_id uuid NOT NULL, student_id uuid NOT NULL, attempt_number integer NOT NULL CHECK(attempt_number>0),
 status varchar(16) NOT NULL CHECK(status IN ('in_progress','submitted','graded','cancelled')),
 started_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(), submitted_at timestamptz(6), cancelled_at timestamptz(6),
 answers jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(answers)='array'),
 score_points numeric(8,2) CHECK(score_points BETWEEN 0 AND 999999.99), score_percent numeric(5,2) CHECK(score_percent BETWEEN 0 AND 100),
 grade_value numeric(3,1) CHECK(grade_value BETWEEN 1 AND 7),
 start_key text NOT NULL CHECK(char_length(start_key) BETWEEN 1 AND 200),
 submit_key text CHECK(char_length(submit_key) BETWEEN 1 AND 200),
 UNIQUE(institution_id,quiz_id,student_id,attempt_number),
 UNIQUE(institution_id,id,quiz_id,student_id,section_id), UNIQUE(institution_id,student_id,start_key),
 FOREIGN KEY(institution_id,quiz_id,course_id) REFERENCES public.quizzes(institution_id,id,course_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,section_id,course_id) REFERENCES public.sections(institution_id,id,course_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,student_id) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK((status='in_progress' AND submitted_at IS NULL AND cancelled_at IS NULL AND submit_key IS NULL AND score_points IS NULL AND score_percent IS NULL AND grade_value IS NULL)
 OR (status='cancelled' AND submitted_at IS NULL AND cancelled_at IS NOT NULL AND submit_key IS NULL AND score_points IS NULL AND score_percent IS NULL AND grade_value IS NULL)
 OR (status='submitted' AND submitted_at IS NOT NULL AND cancelled_at IS NULL AND submit_key IS NOT NULL AND score_points IS NULL AND score_percent IS NULL AND grade_value IS NULL)
 OR (status='graded' AND submitted_at IS NOT NULL AND cancelled_at IS NULL AND submit_key IS NOT NULL AND score_points IS NOT NULL AND score_percent IS NOT NULL AND grade_value IS NOT NULL))
);
CREATE UNIQUE INDEX quiz_attempts_active_unique ON public.quiz_attempts(institution_id,quiz_id,student_id) WHERE status='in_progress';
CREATE UNIQUE INDEX quiz_attempts_submit_key_unique ON public.quiz_attempts(institution_id,student_id,submit_key) WHERE submit_key IS NOT NULL;
CREATE TABLE public.grades (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, grade_item_id uuid NOT NULL, quiz_id uuid NOT NULL,
 student_id uuid NOT NULL, section_id uuid NOT NULL, attempt_id uuid NOT NULL,
 score_percent numeric(5,2) NOT NULL CHECK(score_percent BETWEEN 0 AND 100),
 grade_value numeric(3,1) NOT NULL CHECK(grade_value BETWEEN 1 AND 7), published_at timestamptz(6),
 created_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(institution_id,grade_item_id,student_id),
 FOREIGN KEY(institution_id,grade_item_id,quiz_id) REFERENCES public.grade_items(institution_id,id,quiz_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,attempt_id,quiz_id,student_id,section_id) REFERENCES public.quiz_attempts(institution_id,id,quiz_id,student_id,section_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,student_id) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX grades_student_publication_idx ON public.grades(institution_id,student_id,published_at);
CREATE FUNCTION public.preserve_attempt_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Attempt history is immutable' USING ERRCODE='23514'; END IF;
 IF OLD.status IN ('graded','cancelled') OR
 (NEW.id,NEW.institution_id,NEW.course_id,NEW.quiz_id,NEW.section_id,NEW.student_id,NEW.attempt_number,NEW.start_key,NEW.started_at)
 IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.course_id,OLD.quiz_id,OLD.section_id,OLD.student_id,OLD.attempt_number,OLD.start_key,OLD.started_at)
 OR (OLD.status='submitted' AND NEW.status<>'graded')
 THEN RAISE EXCEPTION 'Attempt history is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attempts_history BEFORE UPDATE OR DELETE ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.preserve_attempt_history();
CREATE FUNCTION public.no_pending_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.quiz_attempts WHERE id=NEW.id AND status='submitted')
 THEN RAISE EXCEPTION 'Submission must be graded atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER attempts_no_pending AFTER INSERT OR UPDATE ON public.quiz_attempts
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.no_pending_submission();
CREATE FUNCTION public.preserve_grade_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Grade history is immutable' USING ERRCODE='23514'; END IF;
 IF OLD.published_at IS NOT NULL OR
 (NEW.id,NEW.institution_id,NEW.grade_item_id,NEW.quiz_id,NEW.student_id,NEW.created_at)
 IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.grade_item_id,OLD.quiz_id,OLD.student_id,OLD.created_at)
 OR (NEW.published_at IS NOT NULL AND
 (NEW.attempt_id,NEW.section_id,NEW.score_percent,NEW.grade_value) IS DISTINCT FROM (OLD.attempt_id,OLD.section_id,OLD.score_percent,OLD.grade_value))
 THEN RAISE EXCEPTION 'Grade history is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER grades_history BEFORE UPDATE OR DELETE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.preserve_grade_history();
CREATE FUNCTION public.freeze_attempted_quiz() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.questions,NEW.max_attempts,NEW.section_id,NEW.course_id,NEW.institution_id) IS DISTINCT FROM
 (OLD.questions,OLD.max_attempts,OLD.section_id,OLD.course_id,OLD.institution_id)
 AND EXISTS(SELECT 1 FROM public.quiz_attempts WHERE institution_id=OLD.institution_id AND quiz_id=OLD.id)
 THEN RAISE EXCEPTION 'Attempted quiz is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quizzes_attempt_freeze BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.freeze_attempted_quiz();
-- Down Migration
DROP TRIGGER quizzes_attempt_freeze ON public.quizzes;
DROP FUNCTION public.freeze_attempted_quiz();
DROP TABLE public.grades;
DROP FUNCTION public.preserve_grade_history();
DROP TABLE public.quiz_attempts;
DROP FUNCTION public.no_pending_submission();
DROP FUNCTION public.preserve_attempt_history();
