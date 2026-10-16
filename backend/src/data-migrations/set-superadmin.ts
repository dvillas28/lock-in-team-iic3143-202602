import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import type { Pool } from "pg";
import { transaction } from "../courses/course-access";
import { slug,uuid } from "../courses/validation";
import { AuditService } from "../audit/audit.service";
import { evidence,fingerprint,run } from "./operation";
export async function setSuperadmin(pool:Pool,env:NodeJS.ProcessEnv=process.env) {
 const input={institutionSlug:slug(env.SUPERADMIN_INSTITUTION_SLUG??""),userId:uuid(env.SUPERADMIN_USER_ID),
  enabled:env.SUPERADMIN_ENABLED??"",replacement:env.SUPERADMIN_REPLACEMENT_USER_ID ? uuid(env.SUPERADMIN_REPLACEMENT_USER_ID) : null,
  ...evidence(env.SUPERADMIN_OPERATION_ID,env.SUPERADMIN_OPERATOR_REF)};
 if(!["true","false"].includes(input.enabled) || input.replacement===input.userId || (input.enabled==="true" && input.replacement))throw new BadRequestException();
 const inputFingerprint=fingerprint(input);
 return transaction(pool,async db=>{
  const users=[...new Set([input.userId,...(input.replacement?[input.replacement]:[])])].sort();
  const identities=(await db.query("SELECT id,active FROM public.users WHERE id=ANY($1::uuid[]) ORDER BY id FOR SHARE",[users])).rows;
  const institution=(await db.query("SELECT * FROM public.institutions WHERE slug=$1 FOR UPDATE",[input.institutionSlug])).rows[0];
  if(!institution?.active)throw new NotFoundException();
  const members=(await db.query("SELECT * FROM public.institution_memberships WHERE institution_id=$1 AND user_id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",[institution.id,users])).rows;
  const applied=(await db.query("SELECT changes FROM public.audit_events WHERE institution_id=$1 AND action='membership.superAdminChanged' AND changes->'after'->>'operationId'=$2",[institution.id,input.operationId])).rows;
  if(applied.length) {
   if(applied.some(e=>e.changes.after.inputFingerprint!==inputFingerprint))throw new ConflictException();
   return {outcome:"alreadyApplied",changed:0,operationId:input.operationId};
  }
  if(identities.length!==users.length || identities.some(u=>!u.active) || members.length!==users.length || members.some(m=>!m.active))throw new NotFoundException();
  const target=members.find(m=>m.user_id===input.userId)!;
  const changes:{member:typeof target;enabled:boolean}[]=[];
  if(input.enabled==="false" && target.is_super_admin) {
   const count=(await db.query(`SELECT count(*)::int AS n FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
    WHERE m.institution_id=$1 AND m.active AND u.active AND m.is_super_admin`,[institution.id])).rows[0].n;
   if(count===1 && !input.replacement)throw new ConflictException();
   if(input.replacement)changes.push({member:members.find(m=>m.user_id===input.replacement)!,enabled:true});
  }
  changes.push({member:target,enabled:input.enabled==="true"});
  let changed=0;
  for(const {member,enabled} of changes) {
   if(member.is_super_admin===enabled)continue;
   await db.query("UPDATE public.institution_memberships SET is_super_admin=$1,updated_at=now() WHERE id=$2",[enabled,member.id]);
   const before={id:member.id,userId:member.user_id,isAdmin:member.is_admin,isSuperAdmin:member.is_super_admin};
   await new AuditService().record(db,{institutionId:institution.id,actorUserId:null,action:"membership.superAdminChanged",resourceType:"institutionMembership",resourceId:member.id,
    before,after:{...before,isSuperAdmin:enabled,source:input.source,operationId:input.operationId,operatorRef:input.operatorRef,inputFingerprint}});
   changed++;
  }
  return {outcome:changed?"applied":"noOp",changed,operationId:input.operationId};
 });
}
if(require.main===module)void run("set-superadmin",pool=>setSuperadmin(pool));
