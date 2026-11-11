-- Up Migration
ALTER TABLE public.users
 ADD COLUMN bio varchar(500), ADD COLUMN avatar_key varchar(512),
 ADD COLUMN credential_version integer NOT NULL DEFAULT 0 CHECK(credential_version>=0),
 ADD CONSTRAINT users_avatar_key_check CHECK(avatar_key IS NULL OR avatar_key ~ '^avatars/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$');

DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='academix_account_writer') THEN
  CREATE ROLE academix_account_writer NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
 END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='academix_account_writer' AND
  (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole)) THEN
  RAISE EXCEPTION 'Unsafe account function owner';
 END IF;
END $$;
GRANT USAGE ON SCHEMA public TO academix_account_writer;
GRANT SELECT ON public.users,public.institutions,public.institution_memberships TO academix_account_writer;
GRANT UPDATE(id) ON public.institutions,public.institution_memberships TO academix_account_writer;
GRANT UPDATE(name,bio,avatar_key,password_hash,credential_version,updated_at) ON public.users TO academix_account_writer;
GRANT INSERT ON public.users,public.institution_memberships TO academix_account_writer;

CREATE TABLE public.account_security_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.users(id),
 actor_user_id uuid NOT NULL REFERENCES public.users(id), action varchar(40) NOT NULL
  CHECK(action IN ('profile.updated','credential.changed','avatar.changed')),
 occurred_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(), metadata jsonb NOT NULL,
 CHECK(user_id=actor_user_id), CHECK(jsonb_typeof(metadata)='object')
);
CREATE INDEX account_events_user_idx ON public.account_security_events(user_id,occurred_at,id);
ALTER TABLE public.account_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_security_events FORCE ROW LEVEL SECURITY;
CREATE POLICY own_security_events ON public.account_security_events FOR SELECT TO academix_runtime
 USING(user_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid);
CREATE POLICY account_event_writer ON public.account_security_events FOR INSERT TO academix_account_writer
 WITH CHECK(user_id=NULLIF(current_setting('academix.actor_id',true),'')::uuid AND user_id=actor_user_id);
GRANT SELECT ON public.account_security_events TO academix_runtime;
GRANT INSERT ON public.account_security_events TO academix_account_writer;
CREATE FUNCTION public.account_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Account audit is immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER account_security_history BEFORE UPDATE OR DELETE ON public.account_security_events
 FOR EACH ROW EXECUTE FUNCTION public.account_event_immutable();

CREATE FUNCTION public.account_update_profile(p_name text,p_bio text,p_expected timestamptz,p_version integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=NULLIF(current_setting('academix.actor_id',true),'')::uuid; u public.users;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=actor AND active FOR UPDATE;
 IF NOT FOUND OR p_version IS NULL OR u.credential_version<>p_version THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='28000'; END IF;
 IF p_expected IS NULL OR u.updated_at<>p_expected THEN RAISE EXCEPTION 'Stale profile' USING ERRCODE='40001'; END IF;
 IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 200 OR p_name<>btrim(p_name)
  OR length(p_bio)>500 THEN RAISE EXCEPTION 'Invalid profile' USING ERRCODE='23514'; END IF;
 IF (u.name,u.bio) IS DISTINCT FROM (p_name,p_bio) THEN
  UPDATE public.users SET name=p_name,bio=p_bio,updated_at=greatest(clock_timestamp(),u.updated_at+interval '1 microsecond') WHERE id=actor;
  INSERT INTO public.account_security_events(user_id,actor_user_id,action,metadata)
   VALUES(actor,actor,'profile.updated',jsonb_build_object('fields',jsonb_build_array('name','bio')));
 END IF;
END $$;

CREATE FUNCTION public.account_change_password(p_hash text,p_version integer) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=NULLIF(current_setting('academix.actor_id',true),'')::uuid; u public.users;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=actor AND active FOR UPDATE;
 IF NOT FOUND OR p_version IS NULL OR u.credential_version<>p_version THEN RAISE EXCEPTION 'Stale credential' USING ERRCODE='40001'; END IF;
 IF p_hash IS NULL OR p_hash !~ '^\$argon2id\$v=19\$' THEN RAISE EXCEPTION 'Invalid credential' USING ERRCODE='23514'; END IF;
 UPDATE public.users SET password_hash=p_hash,credential_version=credential_version+1,
  updated_at=greatest(clock_timestamp(),u.updated_at+interval '1 microsecond') WHERE id=actor;
 INSERT INTO public.account_security_events(user_id,actor_user_id,action,metadata) VALUES(actor,actor,'credential.changed','{}');
END $$;

CREATE FUNCTION public.account_set_avatar(p_key text,p_expected timestamptz,p_version integer) RETURNS text
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=NULLIF(current_setting('academix.actor_id',true),'')::uuid; u public.users;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=actor AND active FOR UPDATE;
 IF NOT FOUND OR p_version IS NULL OR u.credential_version<>p_version THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='28000'; END IF;
 IF p_expected IS NULL OR u.updated_at<>p_expected THEN RAISE EXCEPTION 'Stale profile' USING ERRCODE='40001'; END IF;
 IF p_key IS NOT NULL AND p_key !~ ('^avatars/'||actor::text||'/[0-9a-f-]{36}\.webp$') THEN
  RAISE EXCEPTION 'Invalid avatar owner' USING ERRCODE='23514';
 END IF;
 IF u.avatar_key IS DISTINCT FROM p_key THEN
  UPDATE public.users SET avatar_key=p_key,updated_at=greatest(clock_timestamp(),u.updated_at+interval '1 microsecond') WHERE id=actor;
  INSERT INTO public.account_security_events(user_id,actor_user_id,action,metadata) VALUES(actor,actor,'avatar.changed','{}');
 END IF;
 RETURN u.avatar_key;
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
ALTER FUNCTION public.account_update_profile(text,text,timestamptz,integer) OWNER TO academix_account_writer;
ALTER FUNCTION public.account_change_password(text,integer) OWNER TO academix_account_writer;
ALTER FUNCTION public.account_set_avatar(text,timestamptz,integer) OWNER TO academix_account_writer;
REVOKE CREATE ON SCHEMA public FROM academix_account_writer;
REVOKE ALL ON FUNCTION public.account_update_profile(text,text,timestamptz,integer),
 public.account_change_password(text,integer),public.account_set_avatar(text,timestamptz,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.account_update_profile(text,text,timestamptz,integer),
 public.account_change_password(text,integer),public.account_set_avatar(text,timestamptz,integer) TO academix_runtime;
DO $$ BEGIN
 IF current_setting('academix.account_writer_set_restore',true)='set_false' THEN
  EXECUTE format('GRANT academix_account_writer TO %I WITH SET FALSE',current_user);
 ELSIF current_setting('academix.account_writer_set_restore',true)='revoke' THEN
  EXECUTE format('REVOKE academix_account_writer FROM %I',current_user);
 END IF;
 PERFORM set_config('academix.account_writer_set_restore','',true);
END $$;
