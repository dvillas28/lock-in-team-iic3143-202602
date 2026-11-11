import {ConflictException,HttpException,NotFoundException} from "@nestjs/common";
import type {PoolClient,QueryResultRow} from "pg";
import {AuditService} from "../audit/audit.service";
import {fingerprint} from "./validation";

export function invitationDto(row:QueryResultRow) {
 const staleSending=row.delivery_status==="sending" && row.delivery_started_at && Date.now()-new Date(row.delivery_started_at).getTime()>=30_000;
 const expired=row.status==="pending" && row.expires_at && new Date(row.expires_at).getTime()<=Date.now();
 return {id:row.id,name:row.invited_name,email:row.normalized_email,status:expired?"expired":row.status,
  deliveryStatus:staleSending?"unknown":row.delivery_status,deliveryVersion:row.delivery_version,createdAt:row.created_at,expiresAt:row.expires_at,acceptedAt:row.accepted_at,revokedAt:row.revoked_at,piiPurgedAt:row.pii_purged_at};
}
export async function invitationEvent(db:PoolClient,audit:AuditService,institutionId:string,actor:string,id:string,action:string,after:Record<string,unknown>) {
 await audit.record(db,{institutionId,actorUserId:actor,action,resourceType:"accountInvitation",resourceId:id,before:null,after:{id,...after}});
}
export async function expireInvitations(db:PoolClient,institution:string,actor:string) {
 await db.query(`WITH expired AS (UPDATE public.account_invitations SET status='expired',closed_at=expires_at
  WHERE institution_id=$1 AND status='pending' AND expires_at<=clock_timestamp() RETURNING id,institution_id)
  INSERT INTO public.audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,changes)
  SELECT gen_random_uuid(),institution_id,$2,'invitation.expired','accountInvitation',id,
   jsonb_build_object('before',NULL,'after',jsonb_build_object('status','expired')) FROM expired`,[institution,actor]);
}
export async function classifyRecipient(db:PoolClient,institution:string,address:string) {
 const member=(await db.query(`SELECT m.active,u.active AS user_active FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
  WHERE m.institution_id=$1 AND lower(btrim(u.email))=$2`,[institution,address])).rows[0];
 if(member)return {code:member.active&&member.user_active?"already_member":"revoked_membership",invitationId:null};
 const invite=(await db.query(`SELECT id FROM public.account_invitations WHERE institution_id=$1 AND normalized_email=$2 AND status='pending'`,[institution,address])).rows[0];
 return {code:invite?"already_pending":"valid",invitationId:invite?.id??null};
}
export async function insertInvitation(db:PoolClient,audit:AuditService,scope:{institution:string;membership:string;actor:string},name:string,email:string,key:string) {
 const input=fingerprint([name,email]);
 const existing=(await db.query("SELECT * FROM public.account_invitations WHERE institution_id=$1 AND created_by=$2 AND operation_key=$3",[scope.institution,scope.membership,key])).rows[0];
 if(existing) {
  if(existing.pii_purged_at)throw new HttpException({code:"DATA_PURGED"},410);
  if(existing.input_fingerprint!==input)throw new ConflictException({code:"IDEMPOTENCY_CONFLICT"});
  return existing;
 }
 const classification=await classifyRecipient(db,scope.institution,email);
 if(classification.code!=="valid")throw new ConflictException();
 const row=(await db.query(`INSERT INTO public.account_invitations(institution_id,normalized_email,invited_name,created_by,operation_key,input_fingerprint)
  VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[scope.institution,email,name,scope.membership,key,input])).rows[0];
 await invitationEvent(db,audit,scope.institution,scope.actor,row.id,"invitation.created",{status:"pending",operationKey:key});
 return row;
}
export async function ownInvitation(db:PoolClient,institution:string,id:string,lock=false) {
 const row=(await db.query(`SELECT * FROM public.account_invitations WHERE institution_id=$1 AND id=$2${lock?" FOR UPDATE":""}`,[institution,id])).rows[0];
 if(!row)throw new NotFoundException();
 return row;
}
