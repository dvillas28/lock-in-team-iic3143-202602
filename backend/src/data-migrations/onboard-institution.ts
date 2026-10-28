import { randomUUID } from "node:crypto";
import { hash,argon2id } from "argon2";
import { ConflictException, BadRequestException } from "@nestjs/common";
import type { Pool } from "pg";
import { transaction } from "../courses/course-access";
import { text,slug,uuid } from "../courses/validation";
import { AuditService } from "../audit/audit.service";
import { evidence,fingerprint,run } from "./operation";
export async function onboardInstitution(pool:Pool, env:NodeJS.ProcessEnv=process.env) {
 const input={institutionSlug:slug(env.ONBOARD_INSTITUTION_SLUG??""),institutionName:text(env.ONBOARD_INSTITUTION_NAME,200),
  initialUserId:uuid(env.ONBOARD_USER_ID),initialUserEmail:text(env.ONBOARD_USER_EMAIL,254).toLowerCase(),initialUserName:text(env.ONBOARD_USER_NAME,200),
  ...evidence(env.ONBOARD_OPERATION_ID,env.ONBOARD_OPERATOR_REF)};
 if(!/^[\x21-\x7e]+$/.test(input.initialUserEmail) || !/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(input.initialUserEmail))throw new BadRequestException();
 const inputFingerprint=fingerprint(input);
 return transaction(pool,async db=>{
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["onboard-operation:"+input.operationId]);
  const applied=(await db.query("SELECT institution_id,changes FROM public.audit_events WHERE action='membership.onboarded' AND changes->'after'->>'operationId'=$1",[input.operationId])).rows[0];
  if(applied) {
   if(applied.changes.after.inputFingerprint!==inputFingerprint)throw new ConflictException();
   return {outcome:"alreadyApplied",operationId:input.operationId,institutionId:applied.institution_id};
  }
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["onboard:"+input.institutionSlug]);
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["onboard-user:"+input.initialUserId]);
  const user=(await db.query("SELECT * FROM public.users WHERE id=$1 OR lower(btrim(email))=$2 ORDER BY id FOR SHARE",[input.initialUserId,input.initialUserEmail])).rows;
  const institution=(await db.query("SELECT * FROM public.institutions WHERE slug=$1 FOR UPDATE",[input.institutionSlug])).rows[0];
  if(institution) {
   const event=(await db.query("SELECT changes FROM public.audit_events WHERE institution_id=$1 AND action='membership.onboarded'",[institution.id])).rows[0];
   if(event?.changes.after.inputFingerprint!==inputFingerprint)throw new ConflictException();
   return {outcome:"alreadyApplied",operationId:input.operationId,institutionId:institution.id};
  }
  if(user.length && (user.length!==1 || user[0].id!==input.initialUserId || user[0].email.trim().toLowerCase()!==input.initialUserEmail || !user[0].active))throw new ConflictException();
  if(!user.length) {
   const password=env.ONBOARD_INITIAL_PASSWORD;
   if(!password || [...password].length<8 || [...password].length>30)throw new BadRequestException();
   const passwordHash=await hash(password,{type:argon2id,memoryCost:19456,timeCost:2,parallelism:1});
   await db.query("INSERT INTO public.users(id,email,name,password_hash) VALUES($1,$2,$3,$4)",[input.initialUserId,input.initialUserEmail,input.initialUserName,passwordHash]);
  }
  const institutionId=randomUUID(),membershipId=randomUUID();
  await db.query("INSERT INTO public.institutions(id,slug,name) VALUES($1,$2,$3)",[institutionId,input.institutionSlug,input.institutionName]);
  await db.query("INSERT INTO public.institution_memberships(id,institution_id,user_id,is_admin,is_super_admin) VALUES($1,$2,$3,true,true)",[membershipId,institutionId,input.initialUserId]);
  await new AuditService().record(db,{institutionId,actorUserId:null,action:"membership.onboarded",resourceType:"institutionMembership",resourceId:membershipId,
   before:null,after:{id:membershipId,userId:input.initialUserId,isAdmin:true,isSuperAdmin:true,source:input.source,operationId:input.operationId,operatorRef:input.operatorRef,inputFingerprint}});
  return {outcome:"applied",operationId:input.operationId,institutionId,membershipId};
 });
}
if(require.main===module) void run("onboard-institution",pool=>onboardInstitution(pool));
