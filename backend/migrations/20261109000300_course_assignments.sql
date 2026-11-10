-- Up Migration
ALTER TABLE public.grade_groups
 ADD COLUMN default_kind text CHECK(default_kind IN ('quiz','assignment')),
 ADD UNIQUE(institution_id,course_id,default_kind);

ALTER TABLE public.quizzes ADD COLUMN group_id uuid,
 ADD FOREIGN KEY(institution_id,course_id,group_id)
 REFERENCES public.grade_groups(institution_id,course_id,id) ON DELETE SET NULL (group_id);

CREATE TABLE public.assignments (
 id uuid PRIMARY KEY,
 institution_id uuid NOT NULL,
 course_id uuid NOT NULL,
 section_id uuid,
 description varchar(2000),
 instructions varchar(10000),
 available_from timestamptz(6),
 due_at timestamptz(6),
 available_until timestamptz(6),
 allowed_extensions text[] NOT NULL DEFAULT '{}',
 max_attempts integer CHECK(max_attempts>0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')),
 published_at timestamptz(6),
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 created_by uuid NOT NULL,
 create_digest text NOT NULL CHECK(create_digest ~ '^[0-9a-f]{64}$'),
 UNIQUE(institution_id,course_id,id),
 CHECK(available_from<=due_at AND due_at<=available_until AND available_from<=available_until),
 CHECK((status='draft')=(published_at IS NULL)),
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id),
 FOREIGN KEY(institution_id,section_id,course_id) REFERENCES public.sections(institution_id,id,course_id),
 FOREIGN KEY(institution_id,created_by) REFERENCES public.institution_memberships(institution_id,user_id)
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_boundary ON public.assignments TO academix_runtime
 USING (institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid)
 WITH CHECK (institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid);
CREATE POLICY operator_maintenance ON public.assignments TO CURRENT_USER USING (true) WITH CHECK (true);
GRANT SELECT,INSERT,UPDATE ON public.assignments TO academix_runtime;

ALTER TABLE public.grade_items ALTER COLUMN quiz_id DROP NOT NULL,
 ADD COLUMN assignment_id uuid,
 ADD UNIQUE(institution_id,assignment_id),
 ADD CHECK(num_nonnulls(quiz_id,assignment_id)=1),
 ADD FOREIGN KEY(institution_id,course_id,assignment_id) REFERENCES public.assignments(institution_id,course_id,id);
ALTER TABLE public.grade_items DROP CONSTRAINT grade_items_max_points_check,
 ADD CHECK(max_points>=0 AND (assignment_id IS NOT NULL OR max_points>0));

CREATE OR REPLACE FUNCTION public.prepare_grade_item() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE grouped boolean; destination uuid;
BEGIN
 IF TG_OP='UPDATE' AND (
  (NEW.id,NEW.institution_id,NEW.course_id,NEW.quiz_id,NEW.assignment_id,NEW.created_at)
   IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.course_id,OLD.quiz_id,OLD.assignment_id,OLD.created_at)
  OR (NEW.quiz_id IS NOT NULL AND NEW.max_points IS DISTINCT FROM OLD.max_points)
 ) THEN
  RAISE EXCEPTION 'Grade item identity is immutable' USING ERRCODE='23514';
 END IF;
 SELECT gradebook_grouped INTO grouped FROM public.courses
  WHERE institution_id=NEW.institution_id AND id=NEW.course_id FOR UPDATE;
 IF TG_OP='INSERT' AND NEW.quiz_id IS NOT NULL THEN
  SELECT public.quiz_gradebook_points(questions),group_id INTO NEW.max_points,destination
   FROM public.quizzes WHERE institution_id=NEW.institution_id AND id=NEW.quiz_id;
  NEW.group_id:=coalesce(NEW.group_id,destination);
  IF NEW.group_id IS NULL THEN
   -- Preserve imports and historical seed behavior that provide individual weights.
   destination:=CASE WHEN grouped THEN NEW.course_id ELSE NEW.id END;
   INSERT INTO public.grade_groups(id,institution_id,course_id,title,weight_percent,position)
   SELECT destination,NEW.institution_id,NEW.course_id,
    CASE WHEN grouped THEN 'Sin clasificar' ELSE NEW.title END,
    CASE WHEN grouped THEN 0 ELSE NEW.weight_percent END,coalesce(max(position),0)+1
   FROM public.grade_groups WHERE institution_id=NEW.institution_id AND course_id=NEW.course_id
   ON CONFLICT(institution_id,course_id,id) DO NOTHING;
   NEW.group_id:=destination;
  END IF;
 ELSIF TG_OP='UPDATE' AND NOT grouped AND NEW.weight_percent IS DISTINCT FROM OLD.weight_percent THEN
  UPDATE public.grade_groups SET weight_percent=NEW.weight_percent
   WHERE institution_id=NEW.institution_id AND course_id=NEW.course_id AND id=NEW.group_id;
 END IF;
 RETURN NEW;
END $$;

-- Down Migration
DO $$ BEGIN
 RAISE EXCEPTION 'Course assignments require a forward migration';
END $$;
