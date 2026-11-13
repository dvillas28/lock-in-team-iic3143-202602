-- Up Migration
-- Serialize the preflight and index build with enrollment writes.
LOCK TABLE public.enrollments IN SHARE MODE;

DO $$
DECLARE duplicate_groups bigint;
BEGIN
 SELECT count(*) INTO duplicate_groups
 FROM (
  SELECT 1 FROM public.enrollments WHERE active
  GROUP BY institution_id, section_id, user_id HAVING count(*) > 1
 ) duplicates;
 IF duplicate_groups > 0 THEN
  RAISE EXCEPTION 'Found % users with multiple active roles in a section', duplicate_groups
   USING ERRCODE = '23505',
     HINT = 'Review each group and revoke only the roles approved for archival before retrying.';
 END IF;
END $$;

-- Index validation also detects duplicates if the migration role is subject to RLS.
CREATE UNIQUE INDEX enrollments_one_active_section_role_idx
 ON public.enrollments(institution_id, section_id, user_id) WHERE active;
DROP INDEX public.enrollments_active_role_idx;

-- Down Migration
CREATE UNIQUE INDEX enrollments_active_role_idx
 ON public.enrollments(institution_id, section_id, user_id, role) WHERE active;
DROP INDEX public.enrollments_one_active_section_role_idx;
