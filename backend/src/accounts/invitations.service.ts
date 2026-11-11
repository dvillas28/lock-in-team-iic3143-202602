import {ConflictException,HttpException,Injectable,ServiceUnavailableException} from "@nestjs/common";
import {randomBytes,createHash} from "node:crypto";
import {hash,argon2id} from "argon2";
import {DatabaseService} from "../database/database.service";
import {AuditService} from "../audit/audit.service";
import {lockContext,requirePermission} from "../courses/course-access";
import {page,paginated} from "../courses/validation";
import {AccountIntegrations} from "./integrations";
import {MailDeliveryError} from "./providers/mailer";
import {email,name,object,password,token,uuid} from "./validation";
import {expireInvitations,insertInvitation,invitationDto,invitationEvent,ownInvitation} from "./invitations.model";

const escape=(value:string)=>value.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]!));
@Injectable()
export class InvitationsService {
 constructor(private readonly database:DatabaseService,private readonly audit:AuditService,private readonly integrations:AccountIntegrations) {}
 async list(actor:string,slug:string,query:Record<string,unknown>) {
  return this.database.withInstitution(actor,slug,async(db,m)=>{
   requirePermission(m.is_admin||m.is_super_admin);
   const p=page(query,JSON.stringify(["invitations",m.institution_id,actor]));
   const rows=(await db.query(`SELECT *,to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
    FROM public.account_invitations WHERE institution_id=$1 AND ($2::timestamptz IS NULL OR (created_at,id)>($2::timestamptz,$3::uuid)) ORDER BY created_at,id LIMIT $4`,[m.institution_id,p.date,p.id,p.limit+1])).rows;
   const result=paginated(rows,p,r=>r.cursor_date);return {...result,items:result.items.map(invitationDto)};
  });
 }
 async create(actor:string,slug:string,body:unknown,operation:unknown) {
  const dto=object(body,["name","email"]),visibleName=name(dto.name),address=email(dto.email),key=uuid(operation);
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug);requirePermission(m.is_admin||m.is_super_admin);
   await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,20261107))",[m.institution_id+":"+address]);
   await expireInvitations(db,m.institution_id,actor);
   return invitationDto(await insertInvitation(db,this.audit,{institution:m.institution_id,membership:m.id,actor},visibleName,address,key));
  });
 }
 async revoke(actor:string,slug:string,id:string,body:unknown) {
  uuid(id);object(body??{},[]);
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug);requirePermission(m.is_admin||m.is_super_admin);
   const row=await ownInvitation(db,m.institution_id,id,true);
   if(row.pii_purged_at)throw new HttpException({code:"DATA_PURGED"},410);
   if(row.status==="accepted")throw new ConflictException();
   if(row.status!=="revoked") {
    await db.query("UPDATE public.account_invitations SET status='revoked',revoked_at=clock_timestamp(),closed_at=coalesce(closed_at,clock_timestamp()) WHERE id=$1",[id]);
    await invitationEvent(db,this.audit,m.institution_id,actor,id,"invitation.revoked",{status:"revoked"});
   }
   return invitationDto(await ownInvitation(db,m.institution_id,id));
  });
 }
 async send(actor:string,slug:string,id:string,operation:unknown,resend=false,body?:unknown) {
  uuid(id);const key=uuid(operation);object(body??{},[]);
  const origin=this.integrations.origins.get(slug);
  const prepared=await this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug);requirePermission(m.is_admin||m.is_super_admin);
   if(!this.integrations.mailer.available || !origin)throw new ServiceUnavailableException({code:"INTEGRATION_NOT_CONFIGURED"});
   const row=await ownInvitation(db,m.institution_id,id,true);
   if(row.pii_purged_at)throw new HttpException({code:"DATA_PURGED"},410);
   const prior=(await db.query(`SELECT changes->'after'->>'operation' AS operation FROM public.audit_events
    WHERE institution_id=$1 AND resource_id=$2 AND action='invitation.sending' AND changes->'after'->>'operationKey'=$3`,[m.institution_id,id,key])).rows[0];
   if(prior) {
    if(prior.operation!==(resend?"resend":"send"))throw new ConflictException({code:"IDEMPOTENCY_CONFLICT"});
    return {row};
   }
   const inviter=(await db.query(`SELECT m.id FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
    WHERE m.institution_id=$1 AND m.id=$2 AND m.active AND u.active AND (m.is_admin OR m.is_super_admin) FOR SHARE OF m,u`,[m.institution_id,row.created_by])).rows[0];
   requirePermission(!!inviter);
   if(row.status==="accepted" || row.status==="revoked")throw new ConflictException();
   const elapsed=row.delivery_started_at?Date.now()-new Date(row.delivery_started_at).getTime():Infinity;
   if(row.delivery_status==="sending" && elapsed<30_000)throw new ConflictException();
   if(elapsed<60_000)throw new HttpException({retryAfter:Math.ceil((60_000-elapsed)/1000)},429);
   if(!resend && (row.delivery_version>0 || row.status!=="pending"))throw new ConflictException();
   const code=randomBytes(32).toString("base64url"),digest=createHash("sha256").update(code).digest("hex");
   const updated=(await db.query(`UPDATE public.account_invitations SET status='pending',closed_at=NULL,token_hash=$1,
    expires_at=clock_timestamp()+interval '24 hours',delivery_status='sending',delivery_version=delivery_version+1,
    delivery_key=$2,delivery_started_at=clock_timestamp(),last_delivery_at=clock_timestamp(),delivery_attempts=delivery_attempts+1,
    provider_email_id=NULL,last_delivery_error_code=NULL WHERE id=$3 RETURNING *`,[digest,key,id])).rows[0];
   await invitationEvent(db,this.audit,m.institution_id,actor,id,"invitation.sending",{deliveryVersion:updated.delivery_version,operationKey:key,operation:resend?"resend":"send"});
   const institution=(await db.query("SELECT name FROM public.institutions WHERE id=$1",[m.institution_id])).rows[0].name as string;
   return {row:updated,code,institution};
  });
  if(!prepared.code)return invitationDto(prepared.row);
  const link=`${origin}/activate#token=${prepared.code}`,institution=prepared.institution!;
  let delivery="accepted",providerId:string|null=null,errorCode:string|null=null;
  try {
   const result=await this.integrations.mailer.send({to:prepared.row.normalized_email,subject:`Activa tu acceso a AcademiX — ${institution}`,
    html:`<p>Hola ${escape(prepared.row.invited_name)}.</p><p>Has recibido una invitación a ${escape(institution)} en AcademiX.</p><p><a href="${escape(link)}">Activar cuenta</a></p><p>El enlace vence en 24 horas. Si no esperabas esta invitación, puedes ignorarla.</p>`,
    text:`Has recibido una invitación a ${institution} en AcademiX. Activa tu cuenta: ${link}\nEl enlace vence en 24 horas. Si no esperabas esta invitación, puedes ignorarla.`},key);
   providerId=result.id;
  } catch(error) {
   if(error instanceof MailDeliveryError){delivery=error.status;errorCode=error.code;}
   else {delivery="unknown";errorCode="DELIVERY_RESULT_UNKNOWN";}
  }
  return this.database.withInstitution(actor,slug,async db=>{
   const m=await lockContext(db,actor,slug);requirePermission(m.is_admin||m.is_super_admin);
   const changed=(await db.query(`UPDATE public.account_invitations SET delivery_status=$1,provider_email_id=$2,last_delivery_error_code=$3
    WHERE institution_id=$4 AND id=$5 AND delivery_version=$6 AND delivery_key=$7 AND delivery_status='sending' AND status='pending' RETURNING id`,
    [delivery,providerId,errorCode,m.institution_id,id,prepared.row.delivery_version,key])).rowCount;
   if(changed)await invitationEvent(db,this.audit,m.institution_id,actor,id,"invitation.delivery",{deliveryVersion:prepared.row.delivery_version,deliveryStatus:delivery});
   return invitationDto(await ownInvitation(db,m.institution_id,id));
  });
 }
 async activate(body:unknown) {
  const dto=object(body,["token","password","confirmPassword"]),code=token(dto.token),plain=password(dto.password,dto.confirmPassword,"password");
  const encoded=await hash(plain,{type:argon2id,memoryCost:19456,timeCost:2,parallelism:1});
  await this.database.withIdentity(null,db=>db.query("SELECT public.account_accept_invitation($1,$2,NULL)",[code,encoded]));
 }
 async accept(actor:string,version:number,body:unknown) {
  const dto=object(body,["token"]),code=token(dto.token);
  await this.database.withIdentity(actor,db=>db.query("SELECT public.account_accept_invitation($1,NULL,$2)",[code,version]));
 }
}
