import { ApiResponseError } from '../api/errors.ts';
import { isRecord } from '../auth/validation.ts';
export class AccountValidationError extends Error {readonly field:string;constructor(field:string,message:string){super(message);this.field=field;this.name='AccountValidationError';}}
export type AccountProfile = {id:string;email:string;name:string;bio:string|null;hasAvatar:boolean;updatedAt:string;capabilities:{avatar:boolean;invitationEmail:boolean}};
export type DeliveryStatus = 'pending'|'sending'|'accepted'|'failed'|'quota_blocked'|'unknown';
export type Invitation = {id:string;name:string|null;email:string|null;status:'pending'|'accepted'|'revoked'|'expired';deliveryStatus:DeliveryStatus;deliveryVersion?:number;createdAt:string;expiresAt:string|null;acceptedAt:string|null;revokedAt:string|null;lastDeliveryAt?:string|null;piiPurgedAt?:string|null};
export type Page<T> = {items:T[];nextCursor:string|null};
export type ImportRow = {rowNumber:number;name:string|null;email:string|null;validationCode:string;outcome:null|'created'|'skipped';invitationId:string|null;deliveryStatus?:DeliveryStatus;deliveryVersion?:number;invitationStatus?:'pending'|'accepted'|'revoked'|'expired'};
export type UserImport = {id:string;status:'previewed'|'confirmed'|'expired';expiresAt:string;confirmedAt:string|null;totalRows:number;createdCount:number;skippedCount:number;rows:ImportRow[];piiPurgedAt?:string|null};
export type Member = {id:string;user:{id:string;name:string;email:string;active:boolean};isAdmin:boolean;isSuperAdmin:boolean;active:boolean};
export const isAccountId = (v:unknown):v is string=>typeof v==='string'&&/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(v);
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const nullableText=(v:unknown)=>v===null||typeof v==='string';
const nullableDate=(v:unknown)=>v===null||date(v);
export const deliveryStatuses:readonly string[]=['pending','sending','accepted','failed','quota_blocked','unknown'];
export function profile(value:unknown):AccountProfile {
 if(!isRecord(value)||!isAccountId(value.id)||typeof value.email!=='string'||typeof value.name!=='string'||!value.name.trim()||!nullableText(value.bio)||typeof value.hasAvatar!=='boolean'||!date(value.updatedAt)||!isRecord(value.capabilities)||typeof value.capabilities.avatar!=='boolean'||typeof value.capabilities.invitationEmail!=='boolean')throw new ApiResponseError();
 return {id:value.id,email:value.email,name:value.name,bio:value.bio as string|null,hasAvatar:value.hasAvatar,updatedAt:value.updatedAt,capabilities:{avatar:value.capabilities.avatar,invitationEmail:value.capabilities.invitationEmail}};
}
export function invitation(value:unknown):Invitation {
 if(!isRecord(value)||!(value.deliveryVersion===undefined||Number.isSafeInteger(value.deliveryVersion)&&(value.deliveryVersion as number)>=0)||!isAccountId(value.id)||!nullableText(value.name)||!nullableText(value.email)||!['pending','accepted','revoked','expired'].includes(String(value.status))||!deliveryStatuses.includes(String(value.deliveryStatus))||!date(value.createdAt)||!nullableDate(value.expiresAt)||!nullableDate(value.acceptedAt)||!nullableDate(value.revokedAt))throw new ApiResponseError();
 return value as Invitation;
}
export function page<T>(value:unknown,read:(v:unknown)=>T):Page<T> {
 if(!isRecord(value)||!Array.isArray(value.items)||!(value.nextCursor===undefined||value.nextCursor===null||typeof value.nextCursor==='string'))throw new ApiResponseError();
 const items=value.items.map(read);
 return {items,nextCursor:typeof value.nextCursor==='string'?value.nextCursor:null};
}
export function member(value:unknown):Member {
 if(!isRecord(value)||!isAccountId(value.id)||!isRecord(value.user)||!isAccountId(value.user.id)||typeof value.user.name!=='string'||typeof value.user.email!=='string'||typeof value.user.active!=='boolean'||typeof value.isAdmin!=='boolean'||typeof value.isSuperAdmin!=='boolean'||typeof value.active!=='boolean')throw new ApiResponseError();
 return value as Member;
}
export function userImport(value:unknown):UserImport {
 if(!isRecord(value)||!isAccountId(value.id)||!['previewed','confirmed','expired'].includes(String(value.status))||!date(value.expiresAt)||!nullableDate(value.confirmedAt)||!Number.isSafeInteger(value.totalRows)||!Number.isSafeInteger(value.createdCount)||!Number.isSafeInteger(value.skippedCount)||!Array.isArray(value.rows)||value.rows.length>100)throw new ApiResponseError();
 const ids=new Set<number>();
 for(const row of value.rows) {
  if(!isRecord(row)||!Number.isSafeInteger(row.rowNumber)||(row.rowNumber as number)<1||ids.has(row.rowNumber as number)||!nullableText(row.name)||!nullableText(row.email)||typeof row.validationCode!=='string'||!['valid','already_member','already_pending','invalid_name','invalid_email','duplicate','revoked_membership'].includes(row.validationCode)||![null,'created','skipped'].includes(row.outcome as null|string)||!(row.invitationId===null||isAccountId(row.invitationId))||!(row.deliveryStatus===undefined||deliveryStatuses.includes(String(row.deliveryStatus)))||!(row.deliveryVersion===undefined||Number.isSafeInteger(row.deliveryVersion)&&(row.deliveryVersion as number)>=0)||!(row.invitationStatus===undefined||['pending','accepted','revoked','expired'].includes(String(row.invitationStatus))))throw new ApiResponseError();
  ids.add(row.rowNumber as number);
 }
 return value as UserImport;
}
export function validateProfile(name:string,bio:string) {
 const normalized=name.trim();if(!normalized||normalized.length>200)throw new AccountValidationError('name','El nombre debe tener entre 1 y 200 caracteres.');
 if(bio.length>500)throw new AccountValidationError('bio','La descripción puede tener hasta 500 caracteres.');
 return {name:normalized,bio:bio.trim()?bio:null};
}
export function validateNewPassword(password:string,confirmation:string) {
 if([...password].length<12||new TextEncoder().encode(password).length>128)throw new AccountValidationError('newPassword','La nueva contraseña debe tener al menos 12 caracteres y como máximo 128 bytes.');
 if(password!==confirmation)throw new AccountValidationError('confirmPassword','Las contraseñas nuevas no coinciden.');
}
export function validateCsv(file:File) {if(!file.size||file.size>256*1024)throw new AccountValidationError('file','El archivo CSV debe contener datos y pesar como máximo 256 KiB.');}
export function activationToken(hash:string):string|undefined {
 const pairs=new URLSearchParams(hash.replace(/^#/,''));const tokens=pairs.getAll('token');
 return tokens.length===1&&/^[A-Za-z0-9_-]{43}$/.test(tokens[0])?tokens[0]:undefined;
}
export function pendingImportSends(batch:UserImport):ImportRow[] {
 return batch.status==='confirmed'&&!batch.piiPurgedAt?batch.rows.filter(r=>r.outcome==='created'&&r.invitationId&&(r.invitationStatus===undefined||r.invitationStatus==='pending')&&(r.deliveryVersion??0)===0&&(r.deliveryStatus??'pending')==='pending'):[];
}
