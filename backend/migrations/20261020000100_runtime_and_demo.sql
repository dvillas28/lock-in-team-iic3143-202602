-- Up Migration
DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='academix_runtime') THEN
  CREATE ROLE academix_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
 END IF;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE TABLE public.demo_data_runs (
 version text PRIMARY KEY, input_fingerprint text NOT NULL, operator_ref text NOT NULL,
 result jsonb NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.audit_events'::regclass
  AND contype='c' AND (pg_get_constraintdef(oid) LIKE '%resource_type%' OR pg_get_constraintdef(oid) LIKE '%actor_user_id%') LOOP
  EXECUTE format('ALTER TABLE public.audit_events DROP CONSTRAINT %I',c.conname);
 END LOOP;
END $$;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_scope_check CHECK (
 course_id IS NOT NULL OR (resource_type='institutionMembership' AND action IN
 ('membership.adminChanged','membership.superAdminChanged','membership.onboarded','membership.demoProvisioned'))
);
ALTER TABLE public.audit_events ADD CONSTRAINT audit_actor_check CHECK (
 actor_user_id IS NOT NULL OR (resource_type='institutionMembership' AND action IN
 ('membership.onboarded','membership.superAdminChanged','membership.demoProvisioned')
 AND changes->'after'->>'source'='operatorMigration'
 AND length(btrim(changes->'after'->>'operationId'))>0 AND length(btrim(changes->'after'->>'operatorRef'))>0) IS TRUE
);
-- Down Migration
DO $$ BEGIN
 IF current_database() !~ '_test$' OR EXISTS(SELECT FROM public.demo_data_runs) THEN
  RAISE EXCEPTION 'Empty disposable test database required';
 END IF;
END $$;
DROP TABLE public.demo_data_runs;
