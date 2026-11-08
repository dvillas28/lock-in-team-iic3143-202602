import {BadRequestException,ConflictException,HttpException,Injectable,NotFoundException} from "@nestjs/common";
import {parse} from "csv-parse/sync";
import {randomUUID} from "node:crypto";
import type {PoolClient,QueryResultRow} from "pg";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {lockContext,requirePermission} from "../courses/course-access";
import {email,fingerprint,name,object,uuid} from "./validation";
import {expireInvitations,invitationDto} from "./invitations.model";

interface PreviewRow {rowNumber:number;name:string|null;email:string|null;validationCode:string;invitationId:string|null}
async function classifications(db:PoolClient,institution:string,addresses:string[]) {
 const memberships=(await db.query(`SELECT lower(btrim(u.email)) AS email,m.active,u.active AS user_active FROM public.institution_memberships m
  JOIN public.users u ON u.id=m.user_id WHERE m.institution_id=$1 AND lower(btrim(u.email))=ANY($2::text[])`,[institution,addresses])).rows;
 const pending=(await db.query("SELECT normalized_email,id FROM public.account_invitations WHERE institution_id=$1 AND status='pending' AND normalized_email=ANY($2::text[])",[institution,addresses])).rows;
 const result=new Map<string,{code:string;id:string|null}>();
 for(const row of pending)result.set(row.normalized_email,{code:"already_pending",id:row.id});
 for(const row of memberships)result.set(row.email,{code:row.active&&row.user_active?"already_member":"revoked_membership",id:null});
 return result;
}
@Injectable()
export class ImportsService {
 constructor(private readonly database:DatabaseService,private readonly audit:AuditService) {}
 private async dto(db:PoolClient,institution:string,id:string) {
  const row=(await db.query("SELECT * FROM public.user_imports WHERE institution_id=$1 AND id=$2",[institution,id])).rows[0];
  if(!row)throw new NotFoundException();
  const rows=(await db.query(`SELECT r.*,i.status AS invitation_status,i.delivery_status,i.delivery_version,i.delivery_started_at,i.expires_at AS invitation_expires_at
   FROM public.user_import_rows r LEFT JOIN public.account_invitations i ON i.institution_id=r.institution_id AND i.id=r.invitation_id
   WHERE r.institution_id=$1 AND r.import_id=$2 ORDER BY r.row_number`,[institution,id])).rows;
  return {id:row.id,status:row.status==="previewed"&&new Date(row.expires_at).getTime()<=Date.now()?"expired":row.status,
   expiresAt:row.expires_at,confirmedAt:row.confirmed_at,piiPurgedAt:row.pii_purged_at,totalRows:row.total_rows,createdCount:row.created_count,skippedCount:row.skipped_count,
   rows:rows.map(r=>({rowNumber:r.row_number,name:r.name,email:r.normalized_email,validationCode:r.validation_code,outcome:r.outcome,invitationId:r.invitation_id,
    ...(r.invitation_id?{deliveryStatus:invitationDto({delivery_status:r.delivery_status,delivery_started_at:r.delivery_started_at}).deliveryStatus,deliveryVersion:r.delivery_version,invitationStatus:invitationDto({status:r.invitation_status,expires_at:r.invitation_expires_at}).status}:{})}))};
 }
 async get(actor:string,slug:string,id:string) {
  uuid(id);return this.database.withInstitution(actor,slug,async(db,m)=>{requirePermission(m.is_admin||m.is_super_admin);return this.dto(db,m.institution_id,id);});
 }
 async preview(actor:string,slug:string,file:{buffer:Buffer}|undefined,operation:unknown,body:unknown={}) {
  const key=uuid(operation);object(body??{},[]);
  if(!file?.buffer || file.buffer.length>256*1024)throw new BadRequestException({field:"file"});
  let records:string[][];
  try {records=parse(new TextDecoder("utf-8",{fatal:true}).decode(file.buffer),{bom:true,skip_empty_lines:true,relax_column_count:true,max_record_size:256*1024}) as string[][];}
  catch {throw new BadRequestException({field:"file"});}
  if(records[0]?.length!==2 || records[0][0]!=="name" || records[0][1]!=="email")throw new BadRequestException({field:"file"});
  const data=records.slice(1).filter(r=>r.some(v=>v.trim()!==""));
  if(data.length<1||data.length>100||data.some(r=>r.length!==2))throw new BadRequestException({field:"file"});
  const input=fingerprint(data.map(r=>[r[0].trim(),r[1].trim().toLowerCase()]));
  const rows:PreviewRow[]=data.map((r,i)=>{
   const row:PreviewRow={rowNumber:i+1,name:null,email:null,validationCode:"valid",invitationId:null};
   try {row.name=name(r[0]);}catch {row.validationCode="invalid_name";}
   try {row.email=email(r[1]);}catch {row.validationCode="invalid_email";}
   return row;
  });
  const counts=new Map<string,number>();for(const row of rows)if(row.email)counts.set(row.email,(counts.get(row.email)??0)+1);
  for(const row of rows)if(row.validationCode==="valid" && (counts.get(row.email!)??0)>1)row.validationCode="duplicate";
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug);requirePermission(m.is_admin||m.is_super_admin);
   await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,20261107))",[m.institution_id+":"+m.id+":"+key]);
   const previous=(await db.query("SELECT * FROM public.user_imports WHERE institution_id=$1 AND created_by=$2 AND operation_key=$3",[m.institution_id,m.id,key])).rows[0];
   if(previous) {
    if(previous.pii_purged_at)throw new HttpException({code:"DATA_PURGED"},410);
    if(previous.input_fingerprint!==input)throw new ConflictException({code:"IDEMPOTENCY_CONFLICT"});
    return this.dto(db,m.institution_id,previous.id);
   }
   await expireInvitations(db,m.institution_id,actor);
   const classes=await classifications(db,m.institution_id,rows.filter(r=>r.validationCode==="valid").map(r=>r.email!));
   for(const row of rows)if(row.validationCode==="valid") {
    const found=classes.get(row.email!);if(found){row.validationCode=found.code;row.invitationId=found.id;}
   }
   const id=randomUUID();
   await db.query(`INSERT INTO public.user_imports(id,institution_id,created_by,operation_key,input_fingerprint,total_rows) VALUES($1,$2,$3,$4,$5,$6)`,[id,m.institution_id,m.id,key,input,rows.length]);
   await db.query(`INSERT INTO public.user_import_rows(institution_id,import_id,row_number,name,normalized_email,validation_code,invitation_id)
    SELECT $1,$2,r."rowNumber",r.name,r.email,r."validationCode",r."invitationId"::uuid FROM jsonb_to_recordset($3::jsonb)
    AS r("rowNumber" integer,name text,email text,"validationCode" text,"invitationId" text)`,[m.institution_id,id,JSON.stringify(rows)]);
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,action:"import.previewed",resourceType:"userImport",resourceId:id,before:null,after:{id,status:"previewed",totalRows:rows.length}});
   return this.dto(db,m.institution_id,id);
  });
 }
 async confirm(actor:string,slug:string,id:string,body:unknown={}) {
  uuid(id);object(body??{},[]);
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug);requirePermission(m.is_admin||m.is_super_admin);
   const lot=(await db.query("SELECT * FROM public.user_imports WHERE institution_id=$1 AND id=$2 FOR UPDATE",[m.institution_id,id])).rows[0];
   if(!lot)throw new NotFoundException();
   if(lot.pii_purged_at)throw new HttpException({code:"DATA_PURGED"},410);
   if(lot.status==="confirmed")return this.dto(db,m.institution_id,id);
   if(lot.status!=="previewed" || new Date(lot.expires_at).getTime()<=Date.now())throw new ConflictException();
   const rows=(await db.query("SELECT * FROM public.user_import_rows WHERE institution_id=$1 AND import_id=$2 ORDER BY row_number",[m.institution_id,id])).rows;
   if(rows.some(r=>!["valid","already_member","already_pending"].includes(r.validation_code)))throw new ConflictException();
   // PostgreSQL orders recipient locks using the same collation for every batch.
   await db.query("SELECT pg_advisory_xact_lock(hashtextextended(value,20261107)) FROM (SELECT unnest($1::text[]) AS value ORDER BY 1) ordered",[[...new Set(rows.map(r=>m.institution_id+":"+r.normalized_email))]]);
   await expireInvitations(db,m.institution_id,actor);
   const classes=await classifications(db,m.institution_id,rows.map(r=>r.normalized_email));
   for(const row of rows) {
    const current=classes.get(row.normalized_email)??{code:"valid",id:null};
    if(current.code!==row.validation_code || current.id!==row.invitation_id)throw new ConflictException();
   }
   const wanted=rows.filter(r=>r.validation_code==="valid").map(r=>({name:r.name,email:r.normalized_email,key:randomUUID(),fingerprint:fingerprint([r.name,r.normalized_email])}));
   const inserted:QueryResultRow[]=wanted.length?(await db.query(`WITH created AS (
    INSERT INTO public.account_invitations(institution_id,created_by,normalized_email,invited_name,operation_key,input_fingerprint)
    SELECT $1,$2,r.email,r.name,r.key,r.fingerprint FROM jsonb_to_recordset($3::jsonb) AS r(name text,email text,key uuid,fingerprint text)
    RETURNING id,institution_id,normalized_email,operation_key), recorded AS (
     INSERT INTO public.audit_events(id,institution_id,actor_user_id,action,resource_type,resource_id,changes)
     SELECT gen_random_uuid(),institution_id,$4,'invitation.created','accountInvitation',id,
      jsonb_build_object('before',NULL,'after',jsonb_build_object('id',id,'status','pending','operationKey',operation_key)) FROM created RETURNING id)
    SELECT id,normalized_email FROM created`,[m.institution_id,m.id,JSON.stringify(wanted),actor])).rows:[];
   const created=new Map(inserted.map(r=>[r.normalized_email,r.id]));
   const outcomes=rows.map(r=>({rowNumber:r.row_number,outcome:r.validation_code==="valid"?"created":"skipped",invitationId:created.get(r.normalized_email)??r.invitation_id}));
   await db.query(`UPDATE public.user_import_rows r SET outcome=v.outcome,invitation_id=v."invitationId"
    FROM jsonb_to_recordset($3::jsonb) AS v("rowNumber" integer,outcome text,"invitationId" uuid)
    WHERE r.institution_id=$1 AND r.import_id=$2 AND r.row_number=v."rowNumber"`,[m.institution_id,id,JSON.stringify(outcomes)]);
   await db.query("UPDATE public.user_imports SET status='confirmed',confirmed_at=clock_timestamp(),created_count=$1,skipped_count=$2 WHERE id=$3",[wanted.length,rows.length-wanted.length,id]);
   await this.audit.record(db,{institutionId:m.institution_id,actorUserId:actor,action:"import.confirmed",resourceType:"userImport",resourceId:id,before:null,after:{id,status:"confirmed",createdCount:wanted.length,skippedCount:rows.length-wanted.length}});
   return this.dto(db,m.institution_id,id);
  });
 }
}
