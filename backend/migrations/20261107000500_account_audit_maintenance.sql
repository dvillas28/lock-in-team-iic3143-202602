-- Up Migration
ALTER TABLE public.audit_events DROP CONSTRAINT audit_actor_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_actor_check CHECK (
 actor_user_id IS NOT NULL OR
 (resource_type='institutionMembership' AND action IN ('membership.onboarded','membership.superAdminChanged','membership.demoProvisioned')
 AND changes->'after'->>'source'='operatorMigration'
 AND length(btrim(changes->'after'->>'operationId'))>0 AND length(btrim(changes->'after'->>'operatorRef'))>0) IS TRUE OR
 (resource_type IN ('accountInvitation','userImport') AND action IN ('invitation.purged','import.purged')
 AND changes->'after'->>'source'='operatorMaintenance'
 AND length(btrim(changes->'after'->>'operationId'))>0 AND length(btrim(changes->'after'->>'operatorRef'))>0) IS TRUE
);
CREATE FUNCTION public.account_audit_scope() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.resource_type='accountInvitation' THEN
  IF NOT EXISTS(SELECT FROM public.account_invitations WHERE institution_id=NEW.institution_id AND id=NEW.resource_id) THEN
   RAISE EXCEPTION 'Invitation scope mismatch' USING ERRCODE='23503';
  END IF;
 END IF;
 IF NEW.resource_type='userImport' THEN
  IF NOT EXISTS(SELECT FROM public.user_imports WHERE institution_id=NEW.institution_id AND id=NEW.resource_id) THEN
   RAISE EXCEPTION 'Import scope mismatch' USING ERRCODE='23503';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER account_audit_scope BEFORE INSERT ON public.audit_events FOR EACH ROW EXECUTE FUNCTION public.account_audit_scope();
