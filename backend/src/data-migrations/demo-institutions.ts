import {hash,argon2id} from "argon2";
import type {Pool} from "pg";
import {transaction} from "../database/tenant-transaction";
import {OperationError} from "../database/config";
import {AuditService} from "../audit/audit.service";
import {demoManifest,demoVersion} from "./demo-manifest";
import {evidence,fingerprint,run} from "./operation";
export async function demoInstitutions(pool:Pool,env:NodeJS.ProcessEnv=process.env) {
 const inputFingerprint=fingerprint(demoManifest);
 return transaction(pool,async db=>{
  await db.query("SELECT pg_advisory_xact_lock(202610200010)");
  const marker=(await db.query("SELECT * FROM public.demo_data_runs WHERE version=$1",[demoVersion])).rows[0];
  if(marker) {
   if(marker.input_fingerprint!==inputFingerprint)throw new OperationError("conflict");
   for(const tenant of marker.result) {
    if(!(await db.query("SELECT id FROM public.institutions WHERE id=$1 AND slug=$2",[tenant.id,tenant.slug])).rowCount)throw new OperationError("conflict");
    for(const user of tenant.users) {
     if(!(await db.query(`SELECT u.id FROM public.users u JOIN public.institution_memberships m ON m.user_id=u.id
      WHERE u.id=$1 AND lower(btrim(u.email))=$2 AND m.id=$3 AND m.institution_id=$4`,[user.id,demoManifest.find(t=>t.slug===tenant.slug)!.users.find(u=>u.id===user.id)!.email,user.membershipId,tenant.id])).rowCount)throw new OperationError("conflict");
    }
   }
   return {operation:demoVersion,outcome:"alreadyApplied"};
  }
  const origin=evidence(demoVersion,env.DEMO_OPERATOR_REF);
  // Lock identities before institutions/memberships, matching operational lock order.
  await db.query("SELECT id FROM public.users WHERE id=ANY($1::uuid[]) ORDER BY id FOR SHARE",[demoManifest.flatMap(t=>t.users.map(u=>u.id))]);
  const result=[];
  for(const tenant of demoManifest) {
   const existing=(await db.query("SELECT * FROM public.institutions WHERE slug=$1 OR id=$2 ORDER BY id FOR UPDATE",[tenant.slug,tenant.id])).rows;
   if(existing.length) {
    if(existing.length!==1 || existing[0].slug!==tenant.slug || existing[0].name!==tenant.name || env.DEMO_ADOPT_LEGACY!=="true")throw new OperationError("conflict");
    const legacyId=`10000000-0000-4000-8000-${tenant.slug==="uc"?"000000000001":"000000000002"}`;
    const legacy=(await db.query(`SELECT u.id FROM public.users u JOIN public.institution_memberships m ON m.user_id=u.id
     WHERE u.id=$1 AND lower(btrim(u.email))=$2 AND m.institution_id=$3`,[legacyId,`demo-${tenant.slug}@academix.example`,existing[0].id])).rowCount;
    const managed=(await db.query("SELECT id FROM public.audit_events WHERE institution_id=$1 AND action IN ('membership.onboarded','membership.superAdminChanged','membership.adminChanged') LIMIT 1",[existing[0].id])).rowCount;
    const flags=(await db.query("SELECT id FROM public.institution_memberships WHERE institution_id=$1 AND (is_admin OR is_super_admin) LIMIT 1",[existing[0].id])).rowCount;
    if(!legacy || managed || flags)throw new OperationError("conflict");
   }
   const institutionId=existing[0]?.id??tenant.id;
   if(!existing.length)await db.query("INSERT INTO public.institutions(id,slug,name) VALUES($1,$2,$3)",[institutionId,tenant.slug,tenant.name]);
   const users=[];
   for(const user of tenant.users) {
    const found=(await db.query("SELECT id FROM public.users WHERE id=$1 OR lower(btrim(email))=$2",[user.id,user.email])).rows;
    // Without a marker, adopting a preexisting demo identity would silently grant privileges.
    if(found.length)throw new OperationError("conflict");
    const password=env[user.secret];
    if(!password || [...password].length<8 || [...password].length>30)throw new OperationError("config");
    const encoded=await hash(password,{type:argon2id,memoryCost:19456,timeCost:2,parallelism:1});
    await db.query("INSERT INTO public.users(id,email,name,password_hash) VALUES($1,$2,$3,$4)",[user.id,user.email,user.name,encoded]);
    const admin=user.role==="superadmin";
    await db.query("INSERT INTO public.institution_memberships(id,institution_id,user_id,is_admin,is_super_admin) VALUES($1,$2,$3,$4,$4)",[user.membershipId,institutionId,user.id,admin]);
    await new AuditService().record(db,{institutionId,actorUserId:null,action:"membership.demoProvisioned",resourceType:"institutionMembership",resourceId:user.membershipId,
     before:null,after:{id:user.membershipId,userId:user.id,isAdmin:admin,isSuperAdmin:admin,...origin,inputFingerprint}});
    users.push({id:user.id,membershipId:user.membershipId});
   }
   result.push({id:institutionId,slug:tenant.slug,adoptedLegacy:Boolean(existing.length),users});
  }
  await db.query("INSERT INTO public.demo_data_runs(version,input_fingerprint,operator_ref,result) VALUES($1,$2,$3,$4)",[demoVersion,inputFingerprint,origin.operatorRef,JSON.stringify(result)]);
  return {operation:demoVersion,outcome:"applied"};
 });
}
if(require.main===module)void run(demoVersion,pool=>demoInstitutions(pool));
