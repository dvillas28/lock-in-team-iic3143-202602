import type {Pool,Client} from "pg";
export const tenantTables=["institution_memberships","courses","sections","enrollments","course_modules","materials","quizzes","grade_items","quiz_attempts","grades","grade_publications","audit_events"];
export async function checkRuntime(db:Pool|Client) {
 const role=(await db.query(`SELECT r.oid,r.rolname,r.rolsuper,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,
  EXISTS(SELECT FROM pg_auth_members WHERE member=r.oid) AS member,
  EXISTS(SELECT FROM pg_class WHERE relowner=r.oid AND relnamespace='public'::regnamespace) AS owner,
  (has_schema_privilege(current_user,'public','CREATE') OR has_database_privilege(current_user,current_database(),'CREATE')) AS ddl
  FROM pg_roles r WHERE rolname=current_user`)).rows[0];
 if(!role || role.rolname!=="academix_runtime" || role.rolsuper || role.rolbypassrls || role.rolcreatedb || role.rolcreaterole || role.member || role.owner || role.ddl)throw new Error("Unsafe runtime role");
 const tables=(await db.query(`SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class
  WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[tenantTables])).rows;
 if(tables.length!==12 || tables.some(r=>!r.relrowsecurity || !r.relforcerowsecurity))throw new Error("Incomplete RLS");
 const policies=(await db.query(`SELECT tablename,policyname,permissive,roles::text[],cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename=ANY($1::text[])`,[tenantTables])).rows;
 // Operator policies (owner under FORCE RLS) may exist, but must never reach runtime or PUBLIC.
 const operator=policies.filter(p=>p.policyname==="operator_maintenance");
 if(operator.some(p=>p.cmd!=="ALL" || p.permissive!=="PERMISSIVE" || p.qual!=="true" || p.with_check!=="true"
  || p.roles.some((r:string)=>r==="academix_runtime" || r==="public")))throw new Error("Unsafe operator policy");
 if(policies.length-operator.length!==14)throw new Error("Unexpected RLS policies");
 for(const name of tenantTables) {
  const p=policies.find(p=>p.tablename===name && p.policyname==="tenant_boundary");
  if(!p || p.cmd!=="ALL" || p.permissive!=="PERMISSIVE" || JSON.stringify(p.roles)!=='["academix_runtime"]' || p.qual!=="(institution_id = (NULLIF(current_setting('academix.institution_id'::text, true), ''::text))::uuid)" || p.qual!==p.with_check)throw new Error("Invalid tenant policy");
 }
 const directory=policies.find(p=>p.policyname==="own_directory" && p.tablename==="institution_memberships");
 const audit=policies.find(p=>p.policyname==="audit_actor" && p.tablename==="audit_events");
 const directoryExpression="((NULLIF(current_setting('academix.institution_id'::text, true), ''::text) IS NULL) AND (user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid))";
 const auditExpression="((actor_user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid) AND ((action)::text <> ALL ((ARRAY['membership.demoProvisioned'::character varying, 'membership.onboarded'::character varying, 'membership.superAdminChanged'::character varying])::text[])))";
 if(directory?.cmd!=="SELECT" || directory.permissive!=="PERMISSIVE" || JSON.stringify(directory.roles)!=='["academix_runtime"]' || directory.qual!==directoryExpression || audit?.permissive!=="RESTRICTIVE" || audit.cmd!=="INSERT" || JSON.stringify(audit.roles)!=='["academix_runtime"]' || audit.with_check!==auditExpression)throw new Error("Invalid identity policies");
 const unexpected=(await db.query(`SELECT a.attname FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
  WHERE c.relnamespace='public'::regnamespace AND c.relname IN ('users','institutions','institution_memberships')
  AND a.attnum>0 AND NOT a.attisdropped AND has_column_privilege(current_user,c.oid,a.attnum,'UPDATE')
  AND NOT (a.attname='id' OR (c.relname='institution_memberships' AND a.attname IN ('is_admin','updated_at')))`)).rowCount;
 if(unexpected)throw new Error("Unsafe identity grants");
 const forbidden=(await db.query(`SELECT
  has_table_privilege(current_user,'public.users','INSERT,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.institutions','INSERT,DELETE,TRUNCATE') OR
  has_column_privilege(current_user,'public.users','password_hash','UPDATE') OR
  has_column_privilege(current_user,'public.institution_memberships','is_super_admin','UPDATE') OR
  has_table_privilege(current_user,'public.institution_memberships','INSERT,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.audit_events','UPDATE,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.demo_data_runs','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.pgmigrations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS unsafe`)).rows[0];
 if(forbidden.unsafe)throw new Error("Unsafe runtime grants");
}
