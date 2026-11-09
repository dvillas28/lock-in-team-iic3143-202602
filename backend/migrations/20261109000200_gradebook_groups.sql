-- Up Migration
ALTER TABLE public.courses
 ADD COLUMN gradebook_grouped boolean NOT NULL DEFAULT false,
 ADD COLUMN gradebook_version integer NOT NULL DEFAULT 0 CHECK(gradebook_version>=0);

CREATE FUNCTION public.quiz_gradebook_points(questions jsonb) RETURNS numeric
 LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog,public AS $$
 SELECT sum((q->>'points')::numeric) FROM jsonb_array_elements(questions) q
$$;
CREATE FUNCTION public.chilean_grade(percent numeric) RETURNS numeric
 LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog,public AS $$
 SELECT round(CASE WHEN percent<=60 THEN 1+percent*3/60 ELSE 4+(percent-60)*3/40 END,1)
$$;

CREATE TABLE public.grade_groups (
 id uuid PRIMARY KEY,
 institution_id uuid NOT NULL,
 course_id uuid NOT NULL,
 title varchar(200) NOT NULL CHECK(title=btrim(title) AND char_length(title)>0),
 weight_percent numeric(5,2) NOT NULL CHECK(weight_percent BETWEEN 0 AND 100),
 position integer NOT NULL CHECK(position>0),
 UNIQUE(institution_id,course_id,id),
 UNIQUE(institution_id,course_id,position) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id)
);

ALTER TABLE public.grade_items ADD COLUMN group_id uuid, ADD COLUMN max_points numeric(8,2);
-- Disable the old freeze while assigning groups. Preserve the original grade rows,
-- individual weights, receipts and historical first-publication timestamp.
DROP TRIGGER grade_items_open ON public.grade_items;
DROP FUNCTION public.check_grade_items_open();
INSERT INTO public.grade_groups(id,institution_id,course_id,title,weight_percent,position)
 SELECT id,institution_id,course_id,title,weight_percent,
  row_number() OVER(PARTITION BY institution_id,course_id ORDER BY created_at,id)
 FROM public.grade_items;
UPDATE public.grade_items i SET group_id=i.id,max_points=public.quiz_gradebook_points(q.questions)
 FROM public.quizzes q WHERE q.institution_id=i.institution_id AND q.id=i.quiz_id;
ALTER TABLE public.grade_items
 ALTER COLUMN group_id SET NOT NULL,
 ALTER COLUMN max_points SET NOT NULL,
 ADD CHECK(max_points>0),
 ADD FOREIGN KEY(institution_id,course_id,group_id)
  REFERENCES public.grade_groups(institution_id,course_id,id);

-- A quiz keeps its own evidence and a point maximum on the shared grade item.
-- New items in a configured course enter the 0% group until staff classifies them.
CREATE FUNCTION public.prepare_grade_item() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE grouped boolean; destination uuid;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id,NEW.institution_id,NEW.course_id,NEW.quiz_id,NEW.created_at,NEW.max_points)
  IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.course_id,OLD.quiz_id,OLD.created_at,OLD.max_points) THEN
  RAISE EXCEPTION 'Grade item identity is immutable' USING ERRCODE='23514';
 END IF;
 SELECT gradebook_grouped INTO grouped FROM public.courses
  WHERE institution_id=NEW.institution_id AND id=NEW.course_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
  SELECT public.quiz_gradebook_points(questions) INTO NEW.max_points FROM public.quizzes
   WHERE institution_id=NEW.institution_id AND id=NEW.quiz_id;
  IF NEW.group_id IS NULL THEN
   destination:=CASE WHEN grouped THEN NEW.course_id ELSE NEW.id END;
   INSERT INTO public.grade_groups(id,institution_id,course_id,title,weight_percent,position)
   SELECT destination,NEW.institution_id,NEW.course_id,
    CASE WHEN grouped THEN 'Sin clasificar' ELSE NEW.title END,
    CASE WHEN grouped THEN 0 ELSE NEW.weight_percent END,coalesce(max(position),0)+1
   FROM public.grade_groups WHERE institution_id=NEW.institution_id AND course_id=NEW.course_id
   ON CONFLICT(institution_id,course_id,id) DO NOTHING;
   NEW.group_id:=destination;
  END IF;
 ELSIF NOT grouped AND NEW.weight_percent IS DISTINCT FROM OLD.weight_percent THEN
  UPDATE public.grade_groups SET weight_percent=NEW.weight_percent
   WHERE institution_id=NEW.institution_id AND course_id=NEW.course_id AND id=NEW.group_id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER grade_items_prepare BEFORE INSERT OR UPDATE ON public.grade_items
 FOR EACH ROW EXECUTE FUNCTION public.prepare_grade_item();

CREATE FUNCTION public.preserve_grade_group_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.id,NEW.institution_id,NEW.course_id) IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.course_id) THEN
  RAISE EXCEPTION 'Grade group identity is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER grade_groups_identity BEFORE UPDATE ON public.grade_groups
 FOR EACH ROW EXECUTE FUNCTION public.preserve_grade_group_identity();

CREATE FUNCTION public.check_group_weights() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE tenant uuid; course uuid; grouped boolean;
BEGIN
 IF TG_TABLE_NAME='courses' THEN tenant:=NEW.institution_id; course:=NEW.id;
 ELSIF TG_OP='DELETE' THEN tenant:=OLD.institution_id; course:=OLD.course_id;
 ELSE tenant:=NEW.institution_id; course:=NEW.course_id; END IF;
 SELECT gradebook_grouped INTO grouped FROM public.courses
  WHERE institution_id=tenant AND id=course FOR UPDATE;
 IF grouped AND (SELECT sum(weight_percent) FROM public.grade_groups
  WHERE institution_id=tenant AND course_id=course) IS DISTINCT FROM 100::numeric THEN
  RAISE EXCEPTION 'Group weights must sum to 100' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER group_weights_total AFTER INSERT OR UPDATE OR DELETE ON public.grade_groups
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_group_weights();
CREATE CONSTRAINT TRIGGER course_group_weights_total AFTER UPDATE OF gradebook_grouped ON public.courses
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_group_weights();

CREATE OR REPLACE FUNCTION public.check_grade_publication() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE course uuid;
BEGIN
 IF NEW.published_at IS NULL THEN RETURN NEW; END IF;
 SELECT course_id INTO course FROM public.grade_items WHERE institution_id=NEW.institution_id AND id=NEW.grade_item_id;
 PERFORM id FROM public.courses WHERE institution_id=NEW.institution_id AND id=course FOR UPDATE;
 IF (SELECT sum(weight_percent) FROM public.grade_groups WHERE institution_id=NEW.institution_id AND course_id=course) IS DISTINCT FROM 100::numeric
 OR NOT EXISTS(SELECT 1 FROM public.quiz_attempts a WHERE a.institution_id=NEW.institution_id AND a.id=NEW.attempt_id
  AND a.status='graded' AND (a.score_percent,a.grade_value)=(NEW.score_percent,NEW.grade_value))
 OR EXISTS(SELECT 1 FROM public.quiz_attempts a WHERE a.institution_id=NEW.institution_id AND a.quiz_id=NEW.quiz_id AND a.student_id=NEW.student_id
  AND (a.status='in_progress' OR (a.status='graded' AND a.attempt_number>(SELECT attempt_number FROM public.quiz_attempts WHERE id=NEW.attempt_id))))
 THEN RAISE EXCEPTION 'Grade is not publishable' USING ERRCODE='23514'; END IF;
 UPDATE public.courses SET grade_items_locked_at=NEW.published_at
  WHERE institution_id=NEW.institution_id AND id=course AND grade_items_locked_at IS NULL;
 RETURN NEW;
END $$;

ALTER TABLE public.grades ADD UNIQUE(institution_id,id);
CREATE TABLE public.grade_revisions (
 id uuid PRIMARY KEY,
 institution_id uuid NOT NULL,
 grade_id uuid NOT NULL,
 actor_user_id uuid NOT NULL,
 previous_revision_id uuid,
 reason text NOT NULL CHECK(reason=btrim(reason) AND char_length(reason) BETWEEN 1 AND 500),
 score_points numeric(8,2) NOT NULL CHECK(score_points>=0),
 score_percent numeric(5,2) NOT NULL CHECK(score_percent BETWEEN 0 AND 100),
 grade_value numeric(3,1) NOT NULL CHECK(grade_value BETWEEN 1 AND 7),
 created_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(institution_id,grade_id) REFERENCES public.grades(institution_id,id),
 FOREIGN KEY(institution_id,actor_user_id) REFERENCES public.institution_memberships(institution_id,user_id),
 UNIQUE(institution_id,grade_id,id),
 UNIQUE NULLS NOT DISTINCT(institution_id,grade_id,previous_revision_id),
 FOREIGN KEY(institution_id,grade_id,previous_revision_id) REFERENCES public.grade_revisions(institution_id,grade_id,id)
);
CREATE INDEX grade_revisions_latest ON public.grade_revisions(institution_id,grade_id,created_at DESC,id DESC);
CREATE FUNCTION public.check_grade_revision() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE points numeric; previous uuid; previous_at timestamptz;
BEGIN
 SELECT i.max_points INTO points FROM public.grades g JOIN public.grade_items i
  ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
  WHERE g.institution_id=NEW.institution_id AND g.id=NEW.grade_id AND g.published_at IS NOT NULL FOR UPDATE OF g;
 SELECT id,created_at INTO previous,previous_at FROM public.grade_revisions
  WHERE institution_id=NEW.institution_id AND grade_id=NEW.grade_id ORDER BY created_at DESC,id DESC LIMIT 1;
 IF points IS NULL OR NEW.score_points>points OR NEW.id=NEW.previous_revision_id
  OR NEW.previous_revision_id IS DISTINCT FROM previous THEN
  RAISE EXCEPTION 'Invalid grade revision' USING ERRCODE='23514';
 END IF;
 NEW.created_at:=greatest(clock_timestamp(),previous_at+interval '1 microsecond');
 NEW.score_percent:=round(100*NEW.score_points/points,2);
 NEW.grade_value:=public.chilean_grade(NEW.score_percent);
 RETURN NEW;
END $$;
CREATE TRIGGER grade_revisions_check BEFORE INSERT ON public.grade_revisions
 FOR EACH ROW EXECUTE FUNCTION public.check_grade_revision();
CREATE TRIGGER grade_revisions_history BEFORE UPDATE OR DELETE ON public.grade_revisions
 FOR EACH ROW EXECUTE FUNCTION public.preserve_publication_receipt();

GRANT SELECT,INSERT,UPDATE,DELETE ON public.grade_groups TO academix_runtime;
GRANT SELECT,INSERT ON public.grade_revisions TO academix_runtime;
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['grade_groups','grade_revisions'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',name);
  EXECUTE format('CREATE POLICY tenant_boundary ON public.%I TO academix_runtime USING
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid) WITH CHECK
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid)',name);
  EXECUTE format('CREATE POLICY operator_maintenance ON public.%I TO CURRENT_USER USING (true) WITH CHECK (true)',name);
 END LOOP;
END $$;
CREATE POLICY grade_revision_actor ON public.grade_revisions AS RESTRICTIVE FOR INSERT TO academix_runtime
 WITH CHECK(actor_user_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid);

-- Down Migration
DO $$ BEGIN
 RAISE EXCEPTION 'Gradebook groups and revision history require a forward migration';
END $$;
