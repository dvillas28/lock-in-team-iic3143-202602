import type {Pool,Client} from "pg";
export const tenantTables=["institution_memberships","courses","sections","enrollments","course_modules","materials","quizzes","assignments","assignment_attempts","assignment_attempt_files","grade_items","grade_groups","grade_revisions","quiz_attempts","grades","grade_publications","audit_events","account_invitations","user_imports","user_import_rows"];
export async function checkRuntime(db:Pool|Client) {
 const role=(await db.query(`SELECT r.oid,r.rolname,r.rolsuper,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,
  EXISTS(SELECT FROM pg_auth_members WHERE member=r.oid) AS member,
  EXISTS(SELECT FROM pg_class WHERE relowner=r.oid AND relnamespace='public'::regnamespace) AS owner,
  (has_schema_privilege(current_user,'public','CREATE') OR has_database_privilege(current_user,current_database(),'CREATE')) AS ddl
  FROM pg_roles r WHERE rolname=current_user`)).rows[0];
 if(!role || role.rolname!=="academix_runtime" || role.rolsuper || role.rolbypassrls || role.rolcreatedb || role.rolcreaterole || role.member || role.owner || role.ddl)throw new Error("Unsafe runtime role");
 const tables=(await db.query(`SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class
  WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[tenantTables])).rows;
 if(tables.length!==tenantTables.length || tables.some(r=>!r.relrowsecurity || !r.relforcerowsecurity))throw new Error("Incomplete RLS");
 const policies=(await db.query(`SELECT tablename,policyname,permissive,roles::text[],cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename=ANY($1::text[])`,[tenantTables])).rows;
 // Operator policies (owner under FORCE RLS) may exist, but must never reach runtime or PUBLIC.
 const operator=policies.filter(p=>p.policyname==="operator_maintenance");
 if(operator.some(p=>p.cmd!=="ALL" || p.permissive!=="PERMISSIVE" || p.qual!=="true" || p.with_check!=="true"
  || p.roles.some((r:string)=>r==="academix_runtime" || r==="public")))throw new Error("Unsafe operator policy");
 if(policies.length-operator.length!==29)throw new Error("Unexpected RLS policies");
 for(const name of tenantTables) {
  const p=policies.find(p=>p.tablename===name && p.policyname==="tenant_boundary");
  if(!p || p.cmd!=="ALL" || p.permissive!=="PERMISSIVE" || JSON.stringify(p.roles)!=='["academix_runtime"]' || p.qual!=="(institution_id = (NULLIF(current_setting('academix.institution_id'::text, true), ''::text))::uuid)" || p.qual!==p.with_check)throw new Error("Invalid tenant policy");
 }
 const directory=policies.find(p=>p.policyname==="own_directory" && p.tablename==="institution_memberships");
 const audit=policies.find(p=>p.policyname==="audit_actor" && p.tablename==="audit_events");
 const directoryExpression="((NULLIF(current_setting('academix.institution_id'::text, true), ''::text) IS NULL) AND (user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid))";
 const auditExpression="((actor_user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid) AND ((action)::text <> ALL ((ARRAY['membership.demoProvisioned'::character varying, 'membership.onboarded'::character varying, 'membership.superAdminChanged'::character varying])::text[])))";
 if(directory?.cmd!=="SELECT" || directory.permissive!=="PERMISSIVE" || JSON.stringify(directory.roles)!=='["academix_runtime"]' || directory.qual!==directoryExpression || audit?.permissive!=="RESTRICTIVE" || audit.cmd!=="INSERT" || JSON.stringify(audit.roles)!=='["academix_runtime"]' || audit.with_check!==auditExpression)throw new Error("Invalid identity policies");
 const revision=policies.find(p=>p.tablename==="grade_revisions" && p.policyname==="grade_revision_actor");
 if(revision?.cmd!=="INSERT" || revision.permissive!=="RESTRICTIVE" || JSON.stringify(revision.roles)!=='["academix_runtime"]' ||
  revision.with_check!=="(actor_user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid)")throw new Error("Invalid grade revision policy");
 for(const [table,name] of [["assignment_attempts","assignment_attempt_actor"],["assignment_attempt_files","assignment_file_actor"]]) {
  const p=policies.find(p=>p.tablename===table && p.policyname===name);
  if(p?.cmd!=="INSERT" || p.permissive!=="RESTRICTIVE" || JSON.stringify(p.roles)!=='["academix_runtime"]' || !p.with_check)throw new Error("Invalid submission policy");
 }
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
  has_table_privilege(current_user,'public.grade_revisions','UPDATE,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.assignments','DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.assignment_attempts','UPDATE,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.assignment_attempt_files','UPDATE,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.demo_data_runs','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR
  has_table_privilege(current_user,'public.pgmigrations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS unsafe`)).rows[0];
 if(forbidden.unsafe)throw new Error("Unsafe runtime grants");
 await checkAccountRuntime(db);
}

export async function checkAccountRuntime(db:Pool|Client) {
 const functions=(await db.query(`SELECT p.proname,p.prosecdef,p.proconfig,r.rolname,r.rolcanlogin,r.rolsuper,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,
  has_function_privilege(current_user,p.oid,'EXECUTE') AS execute,
  EXISTS(SELECT FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_execute
  FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner WHERE p.pronamespace='public'::regnamespace
  AND p.proname=ANY($1::text[])`,[['account_update_profile','account_change_password','account_set_avatar','account_accept_invitation']])).rows;
 if(functions.length!==4 || functions.some(f=>!f.prosecdef || f.rolname!=='academix_account_writer' || f.rolcanlogin || f.rolsuper || f.rolbypassrls || f.rolcreatedb || f.rolcreaterole || !f.execute || f.public_execute ||
  !f.proconfig?.some((c:string)=>c.replaceAll(' ','')==='search_path=pg_catalog,public')))throw new Error('Unsafe account functions');
 const events=(await db.query(`SELECT c.relrowsecurity,c.relforcerowsecurity,
  has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') AS unsafe
  FROM pg_class c WHERE c.oid='public.account_security_events'::regclass`)).rows[0];
 if(!events?.relrowsecurity || !events.relforcerowsecurity || events.unsafe)throw new Error('Unsafe account history');
 const own=(await db.query(`SELECT roles::text[],cmd,qual FROM pg_policies WHERE schemaname='public' AND tablename='account_security_events' AND policyname='own_security_events'`)).rows[0];
 if(JSON.stringify(own?.roles)!=='["academix_runtime"]' || own.cmd!=='SELECT' || own.qual!=="(user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid)")throw new Error('Unsafe own account policy');
 const globalPolicies=(await db.query(`SELECT policyname,roles::text[],cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='account_security_events'`)).rows;
 const maintenance=globalPolicies.find(p=>p.policyname==='operator_maintenance');
 const eventWriter=globalPolicies.find(p=>p.policyname==='account_event_writer');
 const normalize=(v:string|null)=>v?.replace(/[()\s]/g,'');
 if(globalPolicies.length!==3 || !maintenance || maintenance.cmd!=='ALL' || maintenance.qual!=='true' || maintenance.with_check!=='true' ||
  maintenance.roles.some((r:string)=>['public','academix_runtime','academix_account_writer'].includes(r)) ||
  eventWriter?.cmd!=='INSERT' || JSON.stringify(eventWriter.roles)!=='["academix_account_writer"]' ||
  normalize(eventWriter.with_check)!==normalize("(user_id = (NULLIF(current_setting('academix.actor_id'::text, true), ''::text))::uuid) AND (user_id = actor_user_id)"))throw new Error('Unsafe account audit policies');
 const writer=(await db.query(`SELECT tablename,policyname,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND roles::text[]=ARRAY['academix_account_writer'] AND tablename=ANY($1::text[])`,[tenantTables])).rows;
 const boundary="(institution_id = (NULLIF(current_setting('academix.institution_id'::text, true), ''::text))::uuid)";
 const lookup=writer.find(p=>p.policyname==='account_invitation_lookup');
 const invite=writer.find(p=>p.policyname==='account_invitation_accept');
 const member=writer.find(p=>p.policyname==='account_membership_writer');
 const accepted=writer.find(p=>p.policyname==='account_invitation_audit');
 if(writer.length!==4 || lookup?.tablename!=='account_invitations' || lookup.cmd!=='SELECT' || lookup.qual!=='true' || lookup.with_check!==null ||
  invite?.tablename!=='account_invitations' || invite.cmd!=='UPDATE' || invite.qual!==boundary || invite.with_check!==boundary ||
  member?.tablename!=='institution_memberships' || member.cmd!=='ALL' || member.qual!==boundary || member.with_check!==boundary ||
  accepted?.tablename!=='audit_events' || accepted.cmd!=='INSERT' ||
  normalize(accepted.with_check)!==normalize(boundary+" AND ((resource_type)::text = 'accountInvitation'::text) AND ((action)::text = 'invitation.accepted'::text)"))throw new Error('Unsafe account writer policies');
}
