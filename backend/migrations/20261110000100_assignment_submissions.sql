-- Up Migration
ALTER TABLE public.assignments ADD COLUMN allow_written_response boolean NOT NULL DEFAULT false;

CREATE TABLE public.assignment_attempts (
 id uuid PRIMARY KEY,
 institution_id uuid NOT NULL,
 course_id uuid NOT NULL,
 assignment_id uuid NOT NULL,
 section_id uuid NOT NULL,
 student_id uuid NOT NULL,
 attempt_number integer NOT NULL CHECK(attempt_number>0),
 submitted_at timestamptz(6) NOT NULL,
 is_late boolean NOT NULL,
 written_response text CHECK(char_length(written_response) BETWEEN 1 AND 10000),
 file_count integer NOT NULL CHECK(file_count BETWEEN 0 AND 5),
 CHECK(written_response IS NOT NULL OR file_count>0),
 submit_key uuid NOT NULL,
 submit_digest text NOT NULL CHECK(submit_digest ~ '^[0-9a-f]{64}$'),
 UNIQUE(institution_id,assignment_id,student_id,attempt_number),
 UNIQUE(institution_id,assignment_id,student_id,submit_key),
 UNIQUE(institution_id,id),
 UNIQUE(institution_id,id,assignment_id,student_id,section_id),
 FOREIGN KEY(institution_id,course_id,assignment_id) REFERENCES public.assignments(institution_id,course_id,id),
 FOREIGN KEY(institution_id,section_id,course_id) REFERENCES public.sections(institution_id,id,course_id),
 FOREIGN KEY(institution_id,student_id) REFERENCES public.institution_memberships(institution_id,user_id)
);
CREATE INDEX assignment_attempts_section_idx ON public.assignment_attempts(institution_id,assignment_id,section_id,student_id);
CREATE TABLE public.assignment_attempt_files (
 id uuid PRIMARY KEY,
 institution_id uuid NOT NULL,
 attempt_id uuid NOT NULL,
 file_key text NOT NULL UNIQUE,
 file_name varchar(480) NOT NULL,
 media_type varchar(120) NOT NULL,
 byte_size integer NOT NULL CHECK(byte_size BETWEEN 1 AND 10485760),
 sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
 position integer NOT NULL CHECK(position BETWEEN 0 AND 4),
 UNIQUE(institution_id,attempt_id,position),
 FOREIGN KEY(institution_id,attempt_id) REFERENCES public.assignment_attempts(institution_id,id),
 CHECK(split_part(file_key,'/',1)='academic' AND split_part(file_key,'/',2)='submissions'
  AND split_part(file_key,'/',3)=institution_id::text AND split_part(file_key,'/',7)=attempt_id::text
  AND split_part(file_key,'/',8)=id::text)
);
CREATE FUNCTION public.check_assignment_file_count() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE attempt uuid; total integer;
BEGIN
 attempt:=coalesce((to_jsonb(NEW)->>'attempt_id')::uuid,NEW.id);
 SELECT file_count INTO total FROM public.assignment_attempts WHERE institution_id=NEW.institution_id AND id=attempt;
 IF total IS DISTINCT FROM (SELECT count(*) FROM public.assignment_attempt_files
  WHERE institution_id=NEW.institution_id AND attempt_id=attempt) THEN
  RAISE EXCEPTION 'Assignment evidence must be stored atomically' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER assignment_attempt_complete AFTER INSERT ON public.assignment_attempts
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_assignment_file_count();
CREATE CONSTRAINT TRIGGER assignment_files_complete AFTER INSERT ON public.assignment_attempt_files
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_assignment_file_count();

DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['assignment_attempts','assignment_attempt_files'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',name);
  EXECUTE format('CREATE POLICY tenant_boundary ON public.%I TO academix_runtime USING
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid) WITH CHECK
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid)',name);
  EXECUTE format('CREATE POLICY operator_maintenance ON public.%I TO CURRENT_USER USING (true) WITH CHECK (true)',name);
  EXECUTE format('GRANT SELECT,INSERT ON public.%I TO academix_runtime',name);
  EXECUTE format('CREATE TRIGGER submission_history BEFORE UPDATE OR DELETE ON public.%I
   FOR EACH ROW EXECUTE FUNCTION public.preserve_publication_receipt()',name);
 END LOOP;
END $$;
CREATE POLICY assignment_attempt_actor ON public.assignment_attempts AS RESTRICTIVE FOR INSERT TO academix_runtime
 WITH CHECK(student_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid);
CREATE POLICY assignment_file_actor ON public.assignment_attempt_files AS RESTRICTIVE FOR INSERT TO academix_runtime
 WITH CHECK(EXISTS(SELECT 1 FROM public.assignment_attempts a
  WHERE a.institution_id=assignment_attempt_files.institution_id AND a.id=assignment_attempt_files.attempt_id
   AND a.student_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid
   AND assignment_attempt_files.file_key=
    'academic/submissions/'||a.institution_id||'/'||a.course_id||'/'||a.assignment_id||'/'||a.student_id||'/'||a.id||'/'||assignment_attempt_files.id));

-- Down Migration
DO $$ BEGIN
 RAISE EXCEPTION 'Assignment submission history requires a forward migration';
END $$;
