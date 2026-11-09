import {BadRequestException} from "@nestjs/common";
import {createHash} from "node:crypto";

export function object(value:unknown,keys:string[],optional:string[]=[]):Record<string,unknown> {
 if(!value || typeof value!=="object" || Array.isArray(value))throw new BadRequestException({field:"body"});
 const dto=value as Record<string,unknown>;
 if(Object.keys(dto).some(k=>!keys.includes(k)&&!optional.includes(k)) || keys.some(k=>!Object.hasOwn(dto,k)))throw new BadRequestException({field:"body"});
 return dto;
}
export function name(value:unknown) {
 if(typeof value!=="string" || [...value.trim()].length<1 || [...value.trim()].length>200)throw new BadRequestException({field:"name"});
 return value.trim();
}
export function email(value:unknown) {
 if(typeof value!=="string")throw new BadRequestException({field:"email"});
 const normalized=value.trim().toLowerCase();
 if(normalized.length>254 || !/^[\x21-\x7e]+$/.test(normalized) || !/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(normalized))throw new BadRequestException({field:"email"});
 return normalized;
}
export function versionDate(value:unknown) {
 if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value) || (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,19)!==value.slice(0,19)))throw new BadRequestException({field:"expectedUpdatedAt"});
 return value;
}
export function password(value:unknown,confirmation:unknown,field="newPassword") {
 if(typeof value!=="string" || [...value].length<12 || Buffer.byteLength(value,"utf8")>128)throw new BadRequestException({field});
 if(value!==confirmation)throw new BadRequestException({field:"confirmPassword"});
 return value;
}
export function uuid(value:unknown) {
 if(typeof value!=="string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw new BadRequestException({field:"body"});
 return value.toLowerCase();
}
export const fingerprint=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function token(value:unknown) {
 if(typeof value!=="string" || !/^[A-Za-z0-9_-]{43}$/.test(value))throw new BadRequestException({field:"token"});
 return value;
}
