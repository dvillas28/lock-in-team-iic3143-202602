import type { ApiClient } from './client.ts';
import type { components } from './schema';
import { profile,invitation,member,page,userImport,isAccountId } from '../accounts/validation.ts';
import { isInstitutionSlug } from '../institution-routes.ts';
import { ApiResponseError } from './errors.ts';
function scope(slug:string) {if(!isInstitutionSlug(slug))throw new TypeError('Contexto inválido.');return {institutionSlug:slug};}
function id(value:string){if(!isAccountId(value))throw new TypeError('Identificador inválido.');return value;}
export async function getAccount(client:ApiClient){return profile((await client.GET('/api/v1/me')).data);}
export async function updateAccount(client:ApiClient,body:components['schemas']['ProfileUpdate']){return profile((await client.PATCH('/api/v1/me',{body})).data);}
export async function changePassword(client:ApiClient,body:components['schemas']['PasswordChange']){await client.POST('/api/v1/me/password',{body});}
export async function avatar(client:ApiClient){const result=await client.GET('/api/v1/me/avatar',{parseAs:'blob'});if(!(result.data instanceof Blob)||!['image/webp','image/png','image/jpeg'].includes(result.data.type))throw new ApiResponseError();return result.data;}
export async function replaceAvatar(client:ApiClient,file:File,expectedUpdatedAt:string){
 const body=new FormData();body.set('file',file);body.set('expectedUpdatedAt',expectedUpdatedAt);
 // OpenAPI represents multipart binary as string; the actual body stays native FormData.
 return profile((await client.PUT('/api/v1/me/avatar',{body:body as unknown as components['schemas']['AvatarUpload']})).data);
}
export async function deleteAvatar(client:ApiClient,expectedUpdatedAt:string){return profile((await client.DELETE('/api/v1/me/avatar',{body:{expectedUpdatedAt}})).data);}
export async function listMembers(client:ApiClient,slug:string,cursor?:string){return page((await client.GET('/api/v1/institution/{institutionSlug}/memberships',{params:{path:scope(slug),query:{cursor,limit:20}}})).data,member);}
export async function listInvitations(client:ApiClient,slug:string,cursor?:string){return page((await client.GET('/api/v1/institution/{institutionSlug}/invitations',{params:{path:scope(slug),query:{cursor,limit:20}}})).data,invitation);}
export async function createInvitation(client:ApiClient,slug:string,body:components['schemas']['InvitationCreate'],key:string){return invitation((await client.POST('/api/v1/institution/{institutionSlug}/invitations',{params:{path:scope(slug),header:{'Idempotency-Key':key}},body})).data);}
export async function invitationAction(client:ApiClient,slug:string,invitationId:string,action:'send'|'resend'|'revoke',key:string){
 const params={path:{...scope(slug),invitationId:id(invitationId)},header:{'Idempotency-Key':key}};
 if(action==='send')return invitation((await client.POST('/api/v1/institution/{institutionSlug}/invitations/{invitationId}/send',{params})).data);
 if(action==='resend')return invitation((await client.POST('/api/v1/institution/{institutionSlug}/invitations/{invitationId}/resend',{params})).data);
 return invitation((await client.POST('/api/v1/institution/{institutionSlug}/invitations/{invitationId}/revoke',{params:{path:params.path}})).data);
}
export async function activateInvitation(client:ApiClient,body:components['schemas']['InvitationActivation']){await client.POST('/api/v1/auth/invitations/activate',{body});}
export async function acceptInvitation(client:ApiClient,token:string){await client.POST('/api/v1/me/invitations/accept',{body:{token}});}
export async function previewImport(client:ApiClient,slug:string,file:File,key:string){
 const body=new FormData();body.set('file',file);
 return userImport((await client.POST('/api/v1/institution/{institutionSlug}/user-imports/preview',{params:{path:scope(slug),header:{'Idempotency-Key':key}},body:body as unknown as components['schemas']['ImportPreview']})).data);
}
export async function getImport(client:ApiClient,slug:string,importId:string){return userImport((await client.GET('/api/v1/institution/{institutionSlug}/user-imports/{importId}',{params:{path:{...scope(slug),importId:id(importId)}}})).data);}
export async function confirmImport(client:ApiClient,slug:string,importId:string){return userImport((await client.POST('/api/v1/institution/{institutionSlug}/user-imports/{importId}/confirm',{params:{path:{...scope(slug),importId:id(importId)}},body:{}})).data);}
