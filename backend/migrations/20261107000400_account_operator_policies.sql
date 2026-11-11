-- Up Migration
-- The migration operator keeps bounded maintenance access under FORCE RLS.
-- This policy never applies to the HTTP role or the NOLOGIN function owner.
DO $$ DECLARE tbl text; BEGIN
 FOREACH tbl IN ARRAY ARRAY['account_security_events','account_invitations','user_imports','user_import_rows'] LOOP
  EXECUTE format('CREATE POLICY operator_maintenance ON public.%I TO %I USING(true) WITH CHECK(true)',tbl,current_user);
 END LOOP;
END $$;
