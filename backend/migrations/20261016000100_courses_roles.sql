-- Up Migration
ALTER TABLE public.institution_memberships
 ADD COLUMN is_admin boolean NOT NULL DEFAULT false,
 ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;
CREATE TABLE public.courses (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, code varchar(32) NOT NULL CHECK(code=btrim(code) AND code<>''),
 name varchar(200) NOT NULL CHECK(name=btrim(name) AND name<>''), term varchar(16) NOT NULL CHECK(term=btrim(term) AND term<>''),
 created_by uuid NOT NULL, created_at timestamptz(6) NOT NULL DEFAULT now(),
 UNIQUE(institution_id,id), UNIQUE(institution_id,code,term),
 FOREIGN KEY(institution_id,created_by) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX courses_owner_idx ON public.courses(institution_id,created_by,id);
CREATE TABLE public.sections (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, course_id uuid NOT NULL,
 code varchar(32) NOT NULL CHECK(code=btrim(code) AND code<>''), capacity integer CHECK(capacity IS NULL OR capacity>=0),
 created_at timestamptz(6) NOT NULL DEFAULT now(), UNIQUE(institution_id,id), UNIQUE(institution_id,id,course_id), UNIQUE(institution_id,course_id,code),
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE TABLE public.enrollments (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, section_id uuid NOT NULL, user_id uuid NOT NULL,
 role varchar(16) NOT NULL CHECK(role IN ('teacher','student','assistant')), active boolean NOT NULL DEFAULT true,
 created_at timestamptz(6) NOT NULL DEFAULT now(), UNIQUE(institution_id,id),
 FOREIGN KEY(institution_id,section_id) REFERENCES public.sections(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,user_id) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX enrollments_active_role_idx ON public.enrollments(institution_id,section_id,user_id,role) WHERE active;
CREATE INDEX enrollments_visibility_idx ON public.enrollments(institution_id,user_id,active,section_id);
CREATE INDEX enrollments_participants_idx ON public.enrollments(institution_id,section_id,active,id);
CREATE TABLE public.audit_events (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL, actor_user_id uuid, action varchar(64) NOT NULL,
 resource_type varchar(32) NOT NULL, resource_id uuid NOT NULL, course_id uuid, section_id uuid,
 occurred_at timestamptz(6) NOT NULL DEFAULT now(), changes jsonb NOT NULL,
 FOREIGN KEY(institution_id,actor_user_id) REFERENCES public.institution_memberships(institution_id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,course_id) REFERENCES public.courses(institution_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(institution_id,section_id,course_id) REFERENCES public.sections(institution_id,id,course_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK(section_id IS NULL OR course_id IS NOT NULL),
 CHECK(course_id IS NOT NULL OR (resource_type='institutionMembership' AND action IN ('membership.adminChanged','membership.superAdminChanged','membership.onboarded'))),
 CHECK(actor_user_id IS NOT NULL OR (resource_type='institutionMembership' AND action IN ('membership.onboarded','membership.superAdminChanged')
  AND changes->'after'->>'source'='operatorMigration'
  AND length(btrim(changes->'after'->>'operationId'))>0 AND length(btrim(changes->'after'->>'operatorRef'))>0) IS TRUE)
);
CREATE INDEX audit_course_idx ON public.audit_events(institution_id,course_id,occurred_at,id);
CREATE UNIQUE INDEX audit_onboarding_idx ON public.audit_events(institution_id) WHERE action='membership.onboarded';
CREATE UNIQUE INDEX audit_superadmin_operation_idx ON public.audit_events(institution_id,action,(changes->'after'->>'operationId'),resource_id) WHERE action='membership.superAdminChanged';
CREATE FUNCTION public.preserve_academic_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'History is immutable' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='audit_events' THEN RAISE EXCEPTION 'Audit is immutable' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='courses' THEN
 IF (NEW.id,NEW.institution_id,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.created_by,OLD.created_at) THEN RAISE EXCEPTION 'Owner is immutable' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME='sections' THEN
 IF (NEW.id,NEW.institution_id,NEW.course_id,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.course_id,OLD.created_at) THEN RAISE EXCEPTION 'Section is immutable' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME='enrollments' THEN
 IF (NEW.id,NEW.institution_id,NEW.section_id,NEW.user_id,NEW.role,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.institution_id,OLD.section_id,OLD.user_id,OLD.role,OLD.created_at) THEN RAISE EXCEPTION 'Enrollment is immutable' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER courses_history BEFORE UPDATE OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.preserve_academic_history();
CREATE TRIGGER sections_history BEFORE UPDATE OR DELETE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.preserve_academic_history();
CREATE TRIGGER enrollments_history BEFORE UPDATE OR DELETE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.preserve_academic_history();
CREATE TRIGGER audit_history BEFORE UPDATE OR DELETE ON public.audit_events FOR EACH ROW EXECUTE FUNCTION public.preserve_academic_history();
CREATE FUNCTION public.audit_membership_scope() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.resource_type='institutionMembership' AND NOT EXISTS(SELECT 1 FROM public.institution_memberships WHERE institution_id=NEW.institution_id AND id=NEW.resource_id) THEN RAISE EXCEPTION 'Membership scope mismatch' USING ERRCODE='23503'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER audit_membership_scope BEFORE INSERT ON public.audit_events FOR EACH ROW EXECUTE FUNCTION public.audit_membership_scope();
