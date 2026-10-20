-- Up Migration
ALTER TABLE public.courses ADD COLUMN grade_items_locked_at timestamptz(6);
CREATE FUNCTION public.preserve_grade_items_lock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.grade_items_locked_at IS NOT NULL AND NEW.grade_items_locked_at IS DISTINCT FROM OLD.grade_items_locked_at
 THEN RAISE EXCEPTION 'Frozen gradebook' USING ERRCODE='23514',CONSTRAINT='courses_grade_items_lock_monotonic'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER courses_grade_items_lock BEFORE UPDATE OF grade_items_locked_at ON public.courses
 FOR EACH ROW EXECUTE FUNCTION public.preserve_grade_items_lock();
CREATE TABLE public.quizzes (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, course_id uuid NOT NULL, section_id uuid,
 title varchar(200) NOT NULL CHECK(title=btrim(title) AND char_length(title) BETWEEN 1 AND 200),
 instructions varchar(10000), opens_at timestamptz(6), closes_at timestamptz(6),
 max_attempts integer CHECK(max_attempts>0), published_at timestamptz(6), created_by uuid NOT NULL,
 questions jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(questions)='array'),
 CHECK(opens_at IS NULL OR closes_at IS NULL OR opens_at<closes_at),
 UNIQUE(institution_id,id), UNIQUE(institution_id,id,course_id),
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,section_id,course_id) REFERENCES public.sections(institution_id,id,course_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,created_by) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX quizzes_course_idx ON public.quizzes(institution_id,course_id,id);
CREATE TABLE public.grade_items (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, course_id uuid NOT NULL, quiz_id uuid NOT NULL,
 title varchar(200) NOT NULL CHECK(title=btrim(title) AND char_length(title) BETWEEN 1 AND 200),
 weight_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK(weight_percent BETWEEN 0 AND 100),
 created_at timestamptz(6) NOT NULL DEFAULT now(),
 UNIQUE(institution_id,quiz_id), UNIQUE(institution_id,id,quiz_id),
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,quiz_id,course_id) REFERENCES public.quizzes(institution_id,id,course_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX grade_items_course_idx ON public.grade_items(institution_id,course_id,id);
CREATE FUNCTION public.check_grade_items_open() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE frozen timestamptz;
BEGIN
 SELECT grade_items_locked_at INTO frozen FROM public.courses
  WHERE institution_id=NEW.institution_id AND id=NEW.course_id FOR UPDATE;
 IF frozen IS NOT NULL THEN RAISE EXCEPTION 'Frozen gradebook'
  USING ERRCODE='23514',CONSTRAINT='grade_items_course_frozen'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER grade_items_open BEFORE INSERT ON public.grade_items
 FOR EACH ROW EXECUTE FUNCTION public.check_grade_items_open();
-- Down Migration
DROP TABLE public.grade_items;
DROP FUNCTION public.check_grade_items_open();
DROP TABLE public.quizzes;
DROP TRIGGER courses_grade_items_lock ON public.courses;
DROP FUNCTION public.preserve_grade_items_lock();
ALTER TABLE public.courses DROP COLUMN grade_items_locked_at;
