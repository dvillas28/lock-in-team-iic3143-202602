-- Up Migration
GRANT USAGE ON SCHEMA public TO academix_runtime;
GRANT SELECT ON public.users,public.institutions,public.institution_memberships TO academix_runtime;
-- FOR SHARE requires UPDATE privilege; identity triggers reject changes to these columns.
GRANT UPDATE(id) ON public.users,public.institutions,public.institution_memberships TO academix_runtime;
GRANT UPDATE(is_admin,updated_at) ON public.institution_memberships TO academix_runtime;
GRANT SELECT,INSERT,UPDATE ON public.courses,public.sections,public.enrollments,
 public.course_modules,public.materials,public.quizzes,public.grade_items,public.quiz_attempts,public.grades TO academix_runtime;
GRANT SELECT,INSERT ON public.grade_publications,public.audit_events TO academix_runtime;
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['institution_memberships','courses','sections','enrollments','course_modules',
  'materials','quizzes','grade_items','quiz_attempts','grades','grade_publications','audit_events'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',name);
  EXECUTE format('CREATE POLICY tenant_boundary ON public.%I TO academix_runtime USING
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid) WITH CHECK
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid)',name);
 END LOOP;
END $$;
CREATE POLICY own_directory ON public.institution_memberships FOR SELECT TO academix_runtime USING (
 NULLIF(current_setting('academix.institution_id',true),'') IS NULL
 AND user_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid
);
CREATE POLICY audit_actor ON public.audit_events AS RESTRICTIVE FOR INSERT TO academix_runtime WITH CHECK (
 actor_user_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid
 AND action NOT IN ('membership.demoProvisioned','membership.onboarded','membership.superAdminChanged')
);
CREATE FUNCTION public.runtime_identity_lock_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF current_user='academix_runtime' AND NEW IS DISTINCT FROM OLD THEN
  RAISE EXCEPTION 'Identity is read only' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER runtime_users_readonly BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.runtime_identity_lock_only();
CREATE TRIGGER runtime_institutions_readonly BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.runtime_identity_lock_only();
CREATE FUNCTION public.runtime_membership_id_lock_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF current_user='academix_runtime' AND NEW.id IS DISTINCT FROM OLD.id THEN
  RAISE EXCEPTION 'Membership identity is immutable' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER runtime_membership_id BEFORE UPDATE ON public.institution_memberships FOR EACH ROW EXECUTE FUNCTION public.runtime_membership_id_lock_only();
-- Down Migration
-- Only disposable tests may remove the isolation barrier; production uses forward fixes.
DO $$ BEGIN
 IF current_database() !~ '_test$' THEN RAISE EXCEPTION 'Test database required'; END IF;
END $$;
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['institution_memberships','courses','sections','enrollments','course_modules',
  'materials','quizzes','grade_items','quiz_attempts','grades','grade_publications','audit_events'] LOOP
  EXECUTE format('DROP POLICY tenant_boundary ON public.%I',name);
  EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',name);
  EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY',name);
 END LOOP;
END $$;
DROP POLICY own_directory ON public.institution_memberships;
DROP POLICY audit_actor ON public.audit_events;
DROP TRIGGER runtime_users_readonly ON public.users;
DROP TRIGGER runtime_institutions_readonly ON public.institutions;
DROP TRIGGER runtime_membership_id ON public.institution_memberships;
DROP FUNCTION public.runtime_identity_lock_only();
DROP FUNCTION public.runtime_membership_id_lock_only();
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM academix_runtime;
