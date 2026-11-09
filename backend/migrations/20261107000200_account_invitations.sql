-- Up Migration
CREATE TABLE public.account_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), institution_id uuid NOT NULL REFERENCES public.institutions(id),
 normalized_email varchar(254), invited_name varchar(200), created_by uuid NOT NULL,
 status varchar(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked','expired')),
 token_hash varchar(64) UNIQUE, expires_at timestamptz(6), accepted_at timestamptz(6), revoked_at timestamptz(6),
 accepted_user_id uuid REFERENCES public.users(id), closed_at timestamptz(6), pii_purged_at timestamptz(6),
 operation_key uuid NOT NULL, input_fingerprint varchar(64), created_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(),
 delivery_status varchar(16) NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending','sending','accepted','failed','quota_blocked','unknown')),
 delivery_version integer NOT NULL DEFAULT 0 CHECK(delivery_version>=0), delivery_key uuid,
 provider_email_id varchar(200), delivery_attempts integer NOT NULL DEFAULT 0 CHECK(delivery_attempts>=0),
 delivery_started_at timestamptz(6), last_delivery_at timestamptz(6), last_delivery_error_code varchar(64),
 UNIQUE(institution_id,id), UNIQUE(institution_id,created_by,operation_key),
 FOREIGN KEY(institution_id,created_by) REFERENCES public.institution_memberships(institution_id,id),
 CHECK(normalized_email IS NULL OR (normalized_email=lower(btrim(normalized_email)) AND length(normalized_email)>0)),
 CHECK(invited_name IS NULL OR (invited_name=btrim(invited_name) AND length(invited_name)>0)),
 CHECK(token_hash IS NULL OR token_hash ~ '^[0-9a-f]{64}$'),
 CHECK((status='accepted')=(accepted_at IS NOT NULL AND accepted_user_id IS NOT NULL)),
 CHECK((status='revoked')=(revoked_at IS NOT NULL)),
 CHECK((status='pending')=(closed_at IS NULL)),
 CHECK((pii_purged_at IS NOT NULL AND status<>'pending' AND normalized_email IS NULL AND invited_name IS NULL AND token_hash IS NULL AND input_fingerprint IS NULL)
  OR (pii_purged_at IS NULL AND normalized_email IS NOT NULL AND invited_name IS NOT NULL AND input_fingerprint IS NOT NULL)),
 CHECK(pii_purged_at IS NOT NULL OR delivery_version=0 OR (token_hash IS NOT NULL AND expires_at IS NOT NULL))
);
CREATE UNIQUE INDEX invitation_pending_email_idx ON public.account_invitations(institution_id,normalized_email) WHERE status='pending';
CREATE INDEX invitation_listing_idx ON public.account_invitations(institution_id,created_at,id);
CREATE INDEX invitation_cleanup_idx ON public.account_invitations(closed_at) WHERE pii_purged_at IS NULL;
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invitations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_boundary ON public.account_invitations TO academix_runtime
 USING(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid)
 WITH CHECK(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid);
CREATE POLICY account_invitation_lookup ON public.account_invitations FOR SELECT TO academix_account_writer USING(true);
CREATE POLICY account_invitation_accept ON public.account_invitations FOR UPDATE TO academix_account_writer
 USING(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid)
 WITH CHECK(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid);
CREATE POLICY account_membership_writer ON public.institution_memberships TO academix_account_writer
 USING(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid)
 WITH CHECK(institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE ON public.account_invitations TO academix_runtime;
GRANT SELECT,UPDATE ON public.account_invitations TO academix_account_writer;

ALTER TABLE public.audit_events DROP CONSTRAINT audit_scope_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_scope_check CHECK (
 course_id IS NOT NULL OR (resource_type='institutionMembership' AND action IN
 ('membership.adminChanged','membership.superAdminChanged','membership.onboarded','membership.demoProvisioned'))
 OR (resource_type='accountInvitation' AND action IN ('invitation.created','invitation.revoked','invitation.expired','invitation.sending','invitation.delivery','invitation.accepted','invitation.purged'))
 OR (resource_type='userImport' AND action IN ('import.previewed','import.confirmed','import.purged'))
);
GRANT INSERT ON public.audit_events TO academix_account_writer;
CREATE POLICY account_invitation_audit ON public.audit_events FOR INSERT TO academix_account_writer WITH CHECK(
 institution_id=NULLIF(current_setting('academix.institution_id',true),'')::uuid AND resource_type='accountInvitation' AND action='invitation.accepted'
);

CREATE FUNCTION public.account_accept_invitation(p_token text,p_hash text,p_version integer) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=NULLIF(current_setting('academix.actor_id',true),'')::uuid;
 invite public.account_invitations; target public.users; member public.institution_memberships; new_user uuid;
BEGIN
 IF p_token IS NULL OR p_token !~ '^[A-Za-z0-9_-]{43}$' THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
 SELECT * INTO invite FROM public.account_invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
 PERFORM set_config('academix.institution_id',invite.institution_id::text,true);
 -- Serialize activations across institutions by normalized global identity, before row locks.
 PERFORM pg_advisory_xact_lock(hashtextextended(invite.normalized_email,20261107));
 PERFORM id FROM public.institutions WHERE id=invite.institution_id AND active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
 SELECT m.* INTO member FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
  WHERE m.id=invite.created_by AND m.institution_id=invite.institution_id AND m.active AND u.active AND (m.is_admin OR m.is_super_admin) FOR SHARE OF m,u;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
 SELECT * INTO invite FROM public.account_invitations WHERE id=invite.id FOR UPDATE;
 IF invite.status<>'pending' OR invite.pii_purged_at IS NOT NULL OR invite.expires_at IS NULL OR invite.expires_at<=clock_timestamp()
  OR invite.token_hash<>encode(sha256(convert_to(p_token,'UTF8')),'hex') THEN
  RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023';
 END IF;
 SELECT * INTO target FROM public.users WHERE lower(btrim(email))=invite.normalized_email FOR UPDATE;
 IF FOUND THEN
  IF actor IS NULL THEN RAISE EXCEPTION 'Login required' USING ERRCODE='P1001'; END IF;
  IF NOT target.active OR target.id<>actor OR p_version IS NULL OR target.credential_version<>p_version THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
  new_user:=target.id;
 ELSE
  IF actor IS NOT NULL OR p_hash IS NULL OR p_hash !~ '^\$argon2id\$v=19\$' THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
  new_user:=gen_random_uuid();
  INSERT INTO public.users(id,email,name,password_hash) VALUES(new_user,invite.normalized_email,invite.invited_name,p_hash);
 END IF;
 SELECT * INTO member FROM public.institution_memberships WHERE institution_id=invite.institution_id AND user_id=new_user FOR UPDATE;
 IF FOUND AND NOT member.active THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='22023'; END IF;
 IF NOT FOUND THEN
  INSERT INTO public.institution_memberships(id,institution_id,user_id,is_admin,is_super_admin) VALUES(gen_random_uuid(),invite.institution_id,new_user,false,false);
 END IF;
 UPDATE public.account_invitations SET status='accepted',accepted_at=clock_timestamp(),closed_at=clock_timestamp(),accepted_user_id=new_user WHERE id=invite.id;
 INSERT INTO public.audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,changes)
  VALUES(gen_random_uuid(),invite.institution_id,new_user,'invitation.accepted','accountInvitation',invite.id,
   jsonb_build_object('before',NULL,'after',jsonb_build_object('status','accepted')));
 RETURN new_user;
END $$;
-- PostgreSQL 17 grants a CREATEROLE creator ADMIN but not SET on a new role.
-- Enable SET only for ownership transfer, preserving any pre-existing membership.
DO $$ DECLARE direct_member boolean; BEGIN
 PERFORM set_config('academix.account_writer_set_restore','',true);
 IF NOT pg_has_role(current_user,'academix_account_writer','SET') THEN
  SELECT EXISTS(SELECT FROM pg_auth_members WHERE roleid='academix_account_writer'::regrole
   AND member=(SELECT oid FROM pg_roles WHERE rolname=current_user)) INTO direct_member;
  EXECUTE format('GRANT academix_account_writer TO %I WITH SET TRUE',current_user);
  PERFORM set_config('academix.account_writer_set_restore',CASE WHEN direct_member THEN 'set_false' ELSE 'revoke' END,true);
 END IF;
END $$;
GRANT CREATE ON SCHEMA public TO academix_account_writer;
ALTER FUNCTION public.account_accept_invitation(text,text,integer) OWNER TO academix_account_writer;
REVOKE CREATE ON SCHEMA public FROM academix_account_writer;
REVOKE ALL ON FUNCTION public.account_accept_invitation(text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.account_accept_invitation(text,text,integer) TO academix_runtime;
DO $$ BEGIN
 IF current_setting('academix.account_writer_set_restore',true)='set_false' THEN
  EXECUTE format('GRANT academix_account_writer TO %I WITH SET FALSE',current_user);
 ELSIF current_setting('academix.account_writer_set_restore',true)='revoke' THEN
  EXECUTE format('REVOKE academix_account_writer FROM %I',current_user);
 END IF;
 PERFORM set_config('academix.account_writer_set_restore','',true);
END $$;
