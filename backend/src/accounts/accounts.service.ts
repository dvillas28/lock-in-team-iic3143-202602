import {BadRequestException,HttpException,Injectable,NotFoundException,ServiceUnavailableException} from "@nestjs/common";
import {hash,verify,argon2id} from "argon2";
import {randomUUID} from "node:crypto";
import type {PoolClient} from "pg";
import {DatabaseService} from "../database/database.service";
import {AccountIntegrations} from "./integrations";
import {normalizeAvatar} from "./providers/image";
import {name,object,password,versionDate} from "./validation";

const columns=`id,email,name,bio,avatar_key,to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS profile_updated_at`;
@Injectable()
export class AccountsService {
 private readonly passwordAttempts=new Map<string,{count:number;until:number}>();
 constructor(private readonly database:DatabaseService,private readonly integrations:AccountIntegrations) {}
 private async read(db:PoolClient,actor:string) {
  const row=(await db.query(`SELECT ${columns} FROM public.users WHERE id=$1 AND active`,[actor])).rows[0];
  if(!row)throw new NotFoundException();
  return {id:row.id,email:row.email,name:row.name,bio:row.bio,hasAvatar:row.avatar_key!==null,updatedAt:row.profile_updated_at,capabilities:this.integrations.capabilities()};
 }
 get(actor:string) {return this.database.withIdentity(actor,db=>this.read(db,actor));}
 async update(actor:string,version:number,body:unknown) {
  const dto=object(body,["name","bio","expectedUpdatedAt"]),visibleName=name(dto.name),expected=versionDate(dto.expectedUpdatedAt);
  if(dto.bio!==null && (typeof dto.bio!=="string" || [...dto.bio].length>500))throw new BadRequestException({field:"bio"});
  const bio=typeof dto.bio==="string"?dto.bio.trim()||null:null;
  return this.database.withIdentity(actor,async db=>{
   await db.query("SELECT public.account_update_profile($1,$2,$3::timestamptz,$4)",[visibleName,bio,expected,version]);
   return this.read(db,actor);
  });
 }
 async changePassword(actor:string,version:number,body:unknown) {
  const now=Date.now();
  for(const [id,value] of this.passwordAttempts)if(value.until<=now)this.passwordAttempts.delete(id);
  const attempts=this.passwordAttempts.get(actor)??{count:0,until:now+60_000};
  if(attempts.count>=5)throw new HttpException({retryAfter:Math.ceil((attempts.until-now)/1000)},429);
  if(this.passwordAttempts.size>=10_000&&!this.passwordAttempts.has(actor))throw new HttpException({retryAfter:60},429);
  attempts.count++;this.passwordAttempts.set(actor,attempts);
  const dto=object(body,["currentPassword","newPassword","confirmPassword"]);
  if(typeof dto.currentPassword!=="string" || !dto.currentPassword.length || Buffer.byteLength(dto.currentPassword)>128)throw new BadRequestException({field:"currentPassword"});
  const next=password(dto.newPassword,dto.confirmPassword);
  const row=await this.database.withIdentity(actor,async db=>(await db.query("SELECT password_hash,credential_version FROM public.users WHERE id=$1 AND active",[actor])).rows[0]);
  if(!row || !await verify(row.password_hash,dto.currentPassword))throw new BadRequestException({field:"currentPassword"});
  const encoded=await hash(next,{type:argon2id,memoryCost:19456,timeCost:2,parallelism:1});
  await this.database.withIdentity(actor,db=>db.query("SELECT public.account_change_password($1,$2)",[encoded,version]));
 }
 private requireStorage() {
  if(!this.integrations.avatars.available)throw new ServiceUnavailableException({code:"INTEGRATION_NOT_CONFIGURED"});
 }
 async avatar(actor:string) {
  this.requireStorage();
  const key=await this.database.withIdentity(actor,async db=>(await db.query("SELECT avatar_key FROM public.users WHERE id=$1 AND active",[actor])).rows[0]?.avatar_key);
  if(!key)throw new NotFoundException();
  return this.integrations.avatars.get(key);
 }
 async putAvatar(actor:string,version:number,body:unknown,file?:{buffer:Buffer}) {
  this.requireStorage();
  const dto=object(body,["expectedUpdatedAt"]),expected=versionDate(dto.expectedUpdatedAt);
  if(!file?.buffer)throw new BadRequestException({field:"file"});
  const image=await normalizeAvatar(file.buffer),key=`avatars/${actor}/${randomUUID()}.webp`;
  await this.integrations.avatars.put(key,image);
  let oldKey:string|null;
  try {
   oldKey=await this.database.withIdentity(actor,async db=>(await db.query("SELECT public.account_set_avatar($1,$2::timestamptz,$3) AS old_key",[key,expected,version])).rows[0].old_key);
  } catch(error) {await this.integrations.avatars.delete(key).catch(()=>{});throw error;}
  if(oldKey)await this.integrations.avatars.delete(oldKey).catch(()=>{});
  return this.get(actor);
 }
 async deleteAvatar(actor:string,version:number,body:unknown) {
  this.requireStorage();
  const dto=object(body,["expectedUpdatedAt"]),expected=versionDate(dto.expectedUpdatedAt);
  const oldKey=await this.database.withIdentity(actor,async db=>(await db.query("SELECT public.account_set_avatar(NULL,$1::timestamptz,$2) AS old_key",[expected,version])).rows[0].old_key);
  if(oldKey)await this.integrations.avatars.delete(oldKey).catch(()=>{});
  return this.get(actor);
 }
}
