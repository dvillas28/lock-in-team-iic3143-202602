-- Up Migration
CREATE TABLE public.user_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), institution_id uuid NOT NULL REFERENCES public.institutions(id), created_by uuid NOT NULL,
 status varchar(12) NOT NULL DEFAULT 'previewed' CHECK(status IN ('previewed','confirmed','expired')),
 operation_key uuid NOT NULL, input_fingerprint varchar(64), total_rows integer NOT NULL CHECK(total_rows BETWEEN 1 AND 100),
 created_count integer NOT NULL DEFAULT 0 CHECK(created_count>=0), skipped_count integer NOT NULL DEFAULT 0 CHECK(skipped_count>=0),
 created_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz(6) NOT NULL DEFAULT clock_timestamp()+interval '24 hours',
 confirmed_at timestamptz(6), pii_purged_at timestamptz(6),
 UNIQUE(institution_id,id), UNIQUE(institution_id,created_by,operation_key),
 FOREIGN KEY(institution_id,created_by) REFERENCES public.institution_memberships(institution_id,id),
 CHECK((status='confirmed')=(confirmed_at IS NOT NULL)), CHECK(created_count+skipped_count<=total_rows),
 CHECK((pii_purged_at IS NULL)=(input_fingerprint IS NOT NULL))
);
CREATE TABLE public.user_import_rows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), institution_id uuid NOT NULL, import_id uuid NOT NULL,
 row_number integer NOT NULL CHECK(row_number BETWEEN 1 AND 100), name varchar(200), normalized_email varchar(254),
 validation_code varchar(24) NOT NULL CHECK(validation_code IN ('valid','already_member','already_pending','invalid_name','invalid_email','duplicate','revoked_membership')),
 outcome varchar(8) CHECK(outcome IN ('created','skipped')), invitation_id uuid,
 UNIQUE(institution_id,import_id,row_number),
 FOREIGN KEY(institution_id,import_id) REFERENCES public.user_imports(institution_id,id),
 FOREIGN KEY(institution_id,invitation_id) REFERENCES public.account_invitations(institution_id,id)
);
CREATE INDEX import_listing_idx ON public.user_imports(institution_id,created_at,id);
CREATE INDEX import_cleanup_idx ON public.user_imports(expires_at) WHERE pii_purged_at IS NULL;
DO $$ DECLARE tbl text; BEGIN
 FOREACH tbl IN ARRAY ARRAY['user_imports','user_import_rows'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tbl);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',tbl);
  EXECUTE format('CREATE POLICY tenant_boundary ON public.%I TO academix_runtime USING
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid) WITH CHECK
   (institution_id=NULLIF(current_setting(''academix.institution_id'',true),'''')::uuid)',tbl);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO academix_runtime',tbl);
 END LOOP;
END $$;
