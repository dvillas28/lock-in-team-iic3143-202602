-- Up Migration
ALTER TABLE public.assignments ADD COLUMN creation_key uuid;

-- Existing clients used the resource identifier as their retry key.
UPDATE public.assignments SET creation_key=id;

ALTER TABLE public.assignments
 ALTER COLUMN creation_key SET NOT NULL,
 ADD UNIQUE(institution_id,course_id,created_by,creation_key);

-- Down Migration
DO $$ BEGIN
 RAISE EXCEPTION 'Assignment retry history requires a forward migration';
END $$;
