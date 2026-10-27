-- Up Migration
-- FORCE RLS also binds the table owner. Managed Postgres (Render) migrates as a non-superuser owner,
-- so operator migrations (demo, onboarding, superadmin) need an explicit policy; runtime is unchanged.
DO $$ DECLARE name text; BEGIN
 IF current_user='academix_runtime' THEN RAISE EXCEPTION 'Operator role required' USING ERRCODE='42501'; END IF;
 FOREACH name IN ARRAY ARRAY['institution_memberships','courses','sections','enrollments','course_modules',
  'materials','quizzes','grade_items','quiz_attempts','grades','grade_publications','audit_events'] LOOP
  EXECUTE format('CREATE POLICY operator_maintenance ON public.%I TO CURRENT_USER USING (true) WITH CHECK (true)',name);
 END LOOP;
END $$;
-- Down Migration
DO $$ BEGIN
 IF current_database() !~ '_test$' THEN RAISE EXCEPTION 'Test database required'; END IF;
END $$;
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['institution_memberships','courses','sections','enrollments','course_modules',
  'materials','quizzes','grade_items','quiz_attempts','grades','grade_publications','audit_events'] LOOP
  EXECUTE format('DROP POLICY operator_maintenance ON public.%I',name);
 END LOOP;
END $$;
