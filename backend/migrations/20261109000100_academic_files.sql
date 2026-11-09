-- Up Migration
ALTER TABLE public.course_modules ADD UNIQUE (institution_id,id,course_id);
ALTER TABLE public.materials
 DROP CONSTRAINT materials_kind_check,
 ALTER COLUMN markdown_body DROP NOT NULL,
 ADD COLUMN position integer CHECK (position > 0),
 ADD COLUMN file_key text UNIQUE,
 ADD COLUMN file_name text,
 ADD COLUMN upload_id uuid,
 ADD COLUMN upload_digest char(64),
 ADD COLUMN media_type text,
 ADD COLUMN byte_size integer,
 ADD COLUMN quiz_id uuid,
 ADD COLUMN quiz_course_id uuid,
 ADD FOREIGN KEY (institution_id,module_id,quiz_course_id) REFERENCES public.course_modules(institution_id,id,course_id),
 ADD FOREIGN KEY (institution_id,quiz_id,quiz_course_id) REFERENCES public.quizzes(institution_id,id,course_id),
 ADD UNIQUE (institution_id,module_id,quiz_id),
 ADD UNIQUE (institution_id,module_id,created_by,upload_id),
 ADD CHECK ((upload_id IS NULL AND upload_digest IS NULL) OR
  (kind='file' AND upload_id IS NOT NULL AND upload_digest IS NOT NULL AND upload_digest ~ '^[0-9a-f]{64}$')),
 ADD CONSTRAINT materials_shape CHECK (
  (kind = 'markdown' AND markdown_body IS NOT NULL AND file_key IS NULL AND file_name IS NULL
   AND media_type IS NULL AND byte_size IS NULL AND quiz_id IS NULL AND quiz_course_id IS NULL)
  OR (kind = 'file' AND markdown_body IS NULL AND quiz_id IS NULL AND quiz_course_id IS NULL
   AND file_key IS NOT NULL AND file_name IS NOT NULL AND char_length(file_name) BETWEEN 1 AND 240
   AND media_type IS NOT NULL AND byte_size IS NOT NULL AND byte_size BETWEEN 1 AND 52428800
   AND file_key ~ ('^academic/materials/' || institution_id || '/' || id || '/[0-9a-f-]{36}$'))
  OR (kind = 'quiz' AND markdown_body IS NULL AND file_key IS NULL AND file_name IS NULL
   AND media_type IS NULL AND byte_size IS NULL AND quiz_id IS NOT NULL AND quiz_course_id IS NOT NULL
   AND published_at IS NULL)
 );
WITH positions AS (
 SELECT id,row_number() OVER (PARTITION BY institution_id,module_id ORDER BY id) AS n FROM public.materials
)
UPDATE public.materials m SET position=p.n FROM positions p WHERE m.id=p.id;
ALTER TABLE public.materials ALTER COLUMN position SET NOT NULL,
 ADD CONSTRAINT materials_position_key UNIQUE (institution_id,module_id,position) DEFERRABLE INITIALLY IMMEDIATE;
CREATE FUNCTION public.append_material_position() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.position IS NULL THEN
  PERFORM 1 FROM public.course_modules WHERE institution_id=NEW.institution_id AND id=NEW.module_id FOR UPDATE;
  SELECT coalesce(max(position),0)+1 INTO NEW.position FROM public.materials
   WHERE institution_id=NEW.institution_id AND module_id=NEW.module_id;
 END IF;
 RETURN NEW;
END
$$;
CREATE TRIGGER materials_append_position BEFORE INSERT ON public.materials
 FOR EACH ROW EXECUTE FUNCTION public.append_material_position();
GRANT DELETE ON public.materials TO academix_runtime;

-- Down Migration
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.materials WHERE kind IN ('file','quiz')) THEN
  RAISE EXCEPTION 'Retain academic file and quiz references before reverting this migration';
 END IF;
END
$$;
REVOKE DELETE ON public.materials FROM academix_runtime;
DROP TRIGGER materials_append_position ON public.materials;
DROP FUNCTION public.append_material_position();
ALTER TABLE public.materials DROP CONSTRAINT materials_shape,
 DROP COLUMN position,DROP COLUMN file_key,DROP COLUMN file_name,DROP COLUMN media_type,DROP COLUMN byte_size,
 DROP COLUMN upload_id,DROP COLUMN upload_digest,DROP COLUMN quiz_id,DROP COLUMN quiz_course_id,
 ALTER COLUMN markdown_body SET NOT NULL,
 ADD CONSTRAINT materials_kind_check CHECK(kind='markdown');
ALTER TABLE public.course_modules DROP CONSTRAINT course_modules_institution_id_id_course_id_key;
