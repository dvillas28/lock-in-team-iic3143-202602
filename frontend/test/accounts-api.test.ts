import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApiClient} from '../src/lib/api/client.ts';
import {activateInvitation,avatar,createInvitation,getAccount,updateAccount,previewImport,confirmImport} from '../src/lib/api/accounts.ts';
import {activationToken,pendingImportSends,profile,userImport,validateNewPassword,validateProfile} from '../src/lib/accounts/validation.ts';
import {ApiResponseError} from '../src/lib/api/errors.ts';
const id='10000000-0000-4000-8000-000000000001';
const snapshot={id,email:'ana@example.test',name:'Ana',bio:null,hasAvatar:false,updatedAt:'2026-11-07T12:00:00.000001Z',capabilities:{avatar:false,invitationEmail:false}};
const invitation={id,name:'Ana',email:'ana@example.test',status:'pending',deliveryStatus:'pending',createdAt:snapshot.updatedAt,expiresAt:null,acceptedAt:null,revokedAt:null};
const client=(reply:(r:Request)=>Response|Promise<Response>,getToken:()=>string|undefined=()=> 'session')=>createApiClient({baseUrl:'https://api.test',getToken,fetch:async r=>reply(r as Request)});
test('profile parser preserves timestamp precision and excludes privileged metadata',()=>{
 assert.deepEqual(profile({...snapshot,password_hash:'private',isAdmin:true}),snapshot);
 for(const value of [null,{}, {...snapshot,id:'other'}, {...snapshot,capabilities:{avatar:'true',invitationEmail:false}}, {...snapshot,hasAvatar:'false'}])assert.throws(()=>profile(value),ApiResponseError);
 assert.deepEqual(validateProfile('  Ana  ','  '),{name:'Ana',bio:null});
 assert.throws(()=>validateProfile(' ','hello'));assert.throws(()=>validateProfile('Ana','x'.repeat(501)));
});
test('account update sends only self-profile data and expected timestamp',async()=>{
 let request!:Request;
 const c=client(r=>{request=r;return Response.json(snapshot);});
 await getAccount(c);assert.equal(request.url,'https://api.test/api/v1/me');assert.equal(request.headers.get('Authorization'),'Bearer session');
 await updateAccount(c,{name:'Ana',bio:null,expectedUpdatedAt:snapshot.updatedAt});
 assert.deepEqual(await request.json(),{name:'Ana',bio:null,expectedUpdatedAt:snapshot.updatedAt});
});
test('public activation never reads or attaches a session credential',async()=>{
 const token='a'.repeat(43);let request!:Request;
 const c=client(r=>{request=r;return new Response(null,{status:204});},()=>{throw new Error('must not read token');});
 await activateInvitation(c,{token,password:'long-password-123',confirmPassword:'long-password-123'});
 assert.equal(request.headers.has('Authorization'),false);assert.equal(new URL(request.url).search,'');
 assert.equal((await request.json()).token,token);
});
test('invitation creation is tenant scoped and preserves explicit idempotency key',async()=>{
 let request!:Request;
 const c=client(r=>{request=r;return Response.json(invitation);});
 await createInvitation(c,'uc',{name:'Ana',email:'ana@example.test'},id);
 assert.equal(request.url,'https://api.test/api/v1/institution/uc/invitations');assert.equal(request.headers.get('Idempotency-Key'),id);
 await assert.rejects(createInvitation(c,'../utfsm',{name:'Ana',email:'ana@example.test'},id));
});
test('avatar fetch is authenticated binary and rejects unexpected payload',async()=>{
 let request!:Request;
 const data=await avatar(client(r=>{request=r;return new Response(new Uint8Array([1,2]),{headers:{'Content-Type':'image/webp'}});}));
 assert.equal(data.type,'image/webp');assert.equal(request.headers.get('Authorization'),'Bearer session');
 await assert.rejects(avatar(client(()=>Response.json({url:'https://other.test'}))),ApiResponseError);
});
test('CSV preview sends ephemeral multipart and confirmation only references import ID',async()=>{
 let request!:Request;
 const batch={id,status:'previewed',expiresAt:snapshot.updatedAt,confirmedAt:null,totalRows:1,createdCount:0,skippedCount:0,rows:[{rowNumber:2,name:'Ana',email:'ana@example.test',validationCode:'valid',outcome:null,invitationId:null}]};
 const c=client(r=>{request=r;return Response.json(batch);});
 const file=new File(['name,email\nAna,ana@example.test\n'],'users.csv',{type:'text/csv'});
 await previewImport(c,'uc',file,id);
 assert.match(request.headers.get('Content-Type')??'',/^multipart\/form-data; boundary=/);
 const form=await request.formData();assert.equal(await (form.get('file') as File).text(),await file.text());
 await confirmImport(c,'uc',id);assert.deepEqual(await request.json(),{});assert.match(request.url,new RegExp('/user-imports/'+id+'/confirm$'));
});
test('CSV recovery only selects safe pending sends, never accepted or unknown',()=>{
 const rows=['pending','accepted','unknown','sending','failed','quota_blocked'].map((status,index)=>({rowNumber:index+2,name:'Ana',email:'ana@example.test',validationCode:'valid',outcome:'created',invitationId:id,deliveryStatus:status,deliveryVersion:status==='pending'?0:1,invitationStatus:'pending'}));
 const batch=userImport({id,status:'confirmed',expiresAt:snapshot.updatedAt,confirmedAt:snapshot.updatedAt,totalRows:6,createdCount:6,skippedCount:0,rows});
 assert.deepEqual(pendingImportSends(batch).map(row=>row.deliveryStatus),['pending']);
 assert.equal(pendingImportSends({...batch,piiPurgedAt:snapshot.updatedAt}).length,0);
 assert.equal(pendingImportSends({...batch,status:'previewed'}).length,0);
 assert.throws(()=>userImport({...batch,rows:[rows[0],rows[0]]}),ApiResponseError);
});
test('activation fragment and password validation reject ambiguous or oversized input',()=>{
 const code='A'.repeat(43);assert.equal(activationToken('#token='+code),code);
 for(const hash of ['','#token=short','#token='+code+'&token='+code,'#token='+code+'/bad'])assert.equal(activationToken(hash),undefined);
 validateNewPassword('long-password-123','long-password-123');
 assert.throws(()=>validateNewPassword('short','short'));assert.throws(()=>validateNewPassword('long-password-123','different-password'));
 assert.throws(()=>validateNewPassword('é'.repeat(65),'é'.repeat(65)));
});
