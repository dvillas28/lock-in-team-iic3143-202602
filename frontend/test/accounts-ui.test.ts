import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement as h} from 'react';
import {Profile} from '../src/components/accounts/profile.tsx';
import {Security} from '../src/components/accounts/security.tsx';
import {Activate} from '../src/components/accounts/activate.tsx';
import {InstitutionUsers} from '../src/components/accounts/institution-users.tsx';
import {CsvImport} from '../src/components/accounts/csv-import.tsx';
import {ProtectedAccount} from '../src/components/accounts/protected-account.tsx';
import {useSession} from '../src/components/auth/session-provider.tsx';
import {DEFAULT_PORTAL_ORIGIN} from '../src/lib/auth/portal-origin.ts';
import {mountAccount} from './fixtures/account-ui.ts';
const id='10000000-0000-4000-8000-000000000001';
const batch={id,status:'previewed',expiresAt:'2099-11-08T12:00:00.000001Z',confirmedAt:null,totalRows:1,createdCount:0,skippedCount:0,rows:[{rowNumber:2,name:'Ana',email:'ana@example.test',validationCode:'valid',outcome:null,invitationId:null}]};
function ImportView({emailAvailable=false}:{emailAvailable?:boolean}){const {session}=useSession();return h(CsvImport,{session,slug:'uc',emailAvailable,onConfirmed:async()=>{}});}
test('own profile is usable without memberships and disabled photos remain explicit',async()=>{
 const ui=await mountAccount(h(ProtectedAccount,null,h(Profile)),()=>Response.json({}),{membership:false,url:`${DEFAULT_PORTAL_ORIGIN}/profile`});
 try{assert.match(ui.doc.body.textContent!,/Mi perfil/);assert.ok(ui.doc.querySelector('form[aria-label="Editar perfil"]'));assert.match(ui.doc.body.textContent!,/gestión de fotos está temporalmente no disponible/);assert.equal(ui.doc.querySelector<HTMLFieldSetElement>('form[aria-label="Cambiar foto"] fieldset')?.disabled,true);assert.equal(ui.session.getSnapshot().context,undefined);assert.equal(ui.dom.window.localStorage.length,0);}finally{await ui.close();}
});
test('unsaved personal fields block avatar changes without losing the draft',async()=>{
 const ui=await mountAccount(h(Profile),()=>Response.json({}),{account:{capabilities:{avatar:true,invitationEmail:false}}});
 try{
  const name=ui.doc.querySelector<HTMLInputElement>('[name="name"]')!,bio=ui.doc.querySelector<HTMLTextAreaElement>('[name="bio"]')!;
  await ui.settle(()=>{name.value='Nombre en borrador';bio.value='Descripción pendiente';name.dispatchEvent(new ui.dom.window.Event('input',{bubbles:true}));});
  assert.equal(ui.doc.querySelector<HTMLFieldSetElement>('form[aria-label="Cambiar foto"] fieldset')!.disabled,true);assert.match(ui.doc.body.textContent!,/Guarda o cancela los cambios/);assert.equal(name.value,'Nombre en borrador');assert.equal(bio.value,'Descripción pendiente');assert.equal(ui.requests.some(r=>r.url.endsWith('/me/avatar')),false);
  await ui.click('Cancelar cambios');assert.equal(ui.doc.querySelector<HTMLFieldSetElement>('form[aria-label="Cambiar foto"] fieldset')!.disabled,false);assert.doesNotMatch(ui.doc.body.textContent!,/Guarda o cancela los cambios/);
 }finally{await ui.close();}
});
test('profile conflict retains typed fields and does not overwrite the session',async()=>{
 const ui=await mountAccount(h(Profile),()=>Response.json({code:'CONFLICT',detail:'PRIVATE'},{status:409}));
 try{await ui.submit('form[aria-label="Editar perfil"]',{name:'Otro nombre',bio:'Mi descripción'});assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="name"]')!.value,'Otro nombre');assert.match(ui.doc.body.textContent!,/estado cambió/);assert.ok(ui.doc.querySelector('button[type="button"]'));assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE/);assert.notEqual(ui.session.getSnapshot().account?.name,'Otro nombre');}finally{await ui.close();}
});
test('password current-field error clears password inputs while preserving authentication',async()=>{
 const ui=await mountAccount(h(Security),()=>Response.json({errors:[{field:'currentPassword',message:'PRIVATE'}]},{status:400}));
 try{await ui.submit('form',{currentPassword:'old-password',newPassword:'long-password-123',confirmPassword:'long-password-123'});assert.equal(ui.session.getSnapshot().status,'authenticated');assert.match(ui.doc.body.textContent!,/contraseña actual es incorrecta/);for(const input of ui.doc.querySelectorAll<HTMLInputElement>('input[type="password"]'))assert.equal(input.value,'');assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE/);}finally{await ui.close();}
});
test('activation removes the fragment and waits for explicit confirmation, then existing account login retains the code',async()=>{
 const token='x'.repeat(43);let attempts=0;
 const ui=await mountAccount(h(Activate),request=>{
  if(request.url.endsWith('/activate')){attempts++;return Response.json({code:'INVITATION_LOGIN_REQUIRED'},{status:409});}
  return new Response(null,{status:204});
 },{anonymous:true,url:'http://uc.localhost:3000/activate#token='+token});
 try{assert.equal(ui.dom.window.location.hash,'');assert.equal(attempts,0);assert.doesNotMatch(ui.doc.body.innerHTML,new RegExp(token));await ui.submit('form[aria-label="Activar cuenta nueva"]',{password:'long-password-123',confirmPassword:'long-password-123'});assert.equal(attempts,1);assert.ok(ui.doc.querySelector('form[aria-label="Ingresar para aceptar invitación"]'));await ui.submit('form[aria-label="Ingresar para aceptar invitación"]',{email:'ana@example.test',password:'existing'});assert.equal(ui.dom.window.location.pathname,'/activate');await ui.click('Aceptar acceso con mi cuenta');const accept=ui.requests.find(r=>r.url.endsWith('/me/invitations/accept'))!;assert.equal((await accept.json()).token,token);assert.match(ui.doc.body.textContent!,/Acceso institucional activado/);assert.equal(ui.dom.window.localStorage.length,0);assert.equal(ui.dom.window.sessionStorage.length,0);assert.equal(ui.requests.filter(r=>r.url.endsWith('/auth/invitations/activate'))[0].headers.has('Authorization'),false);}finally{await ui.close();}
});
test('institution users fail closed for ordinary members before administrative queries',async()=>{
 const ui=await mountAccount(h(InstitutionUsers),()=>{throw new Error('must not request admin');},{role:'student'});
 try{assert.match(ui.doc.body.textContent!,/Solo los administradores/);assert.equal(ui.requests.some(r=>r.url.endsWith('/invitations')||r.url.endsWith('/memberships')),false);}finally{await ui.close();}
});
test('active members combine search and permissions, reset cursors and recover failed pages',async()=>{
 const member={id,user:{id,name:'Ana',email:'ana@example.test',active:true},isAdmin:true,isSuperAdmin:true,active:true};
 let failNext=true;
 const ui=await mountAccount(h(InstitutionUsers),request=>{
  const {pathname,searchParams}=new URL(request.url);
  if(!pathname.endsWith('/memberships'))return Response.json({items:[]});
  if(searchParams.has('cursor')&&failNext){
   failNext=false;
   return Response.json({}, {status:503});
  }
  if(searchParams.get('permission')==='member')return Response.json({items:[]});
  return Response.json({items:[member],nextCursor:searchParams.has('cursor')?null:'next'});
 });
 try{
  const query=()=>new URL(ui.requests.filter(request=>new URL(request.url).pathname.endsWith('/memberships')).at(-1)!.url).searchParams;
  const nav=()=>ui.doc.querySelector('nav[aria-label="Páginas de miembros activos"]')!;
  await ui.submit('form[role="search"]',{search:'  ana@example  '});
  assert.equal(query().get('search'),'ana@example');
  await ui.click('Siguiente');
  assert.equal(query().get('cursor'),'next');
  await ui.click('Reintentar');
  assert.match(nav().textContent!,/Página 2/);
  assert.equal(nav().querySelectorAll('button')[1].disabled,true);
  await ui.click('Anterior');
  assert.equal(query().has('cursor'),false);
  await ui.click('Siguiente');
  await ui.settle(()=>{
   const select=ui.doc.querySelector<HTMLSelectElement>('#member-permission')!;
   select.value='member';
   select.dispatchEvent(new ui.dom.window.Event('change',{bubbles:true}));
  });
  assert.equal(query().get('permission'),'member');
  assert.equal(query().get('search'),'ana@example');
  assert.equal(query().has('cursor'),false);
  assert.match(nav().textContent!,/Página 1/);
  assert.match(ui.doc.body.textContent!,/No hay coincidencias/);
  await ui.click('Limpiar búsqueda');
  assert.equal(query().has('search'),false);
  assert.equal(query().get('permission'),'member');
 }finally{await ui.close();}
});
test('CSV receipt recovers by authorized ID and bad rows keep confirmation disabled',async()=>{
 const ui=await mountAccount(h(ImportView),()=>Response.json({...batch,rows:[{...batch.rows[0],validationCode:'invalid_email'}]}),{url:'http://uc.localhost:3000/admin/users?importId='+id});
 try{await ui.settle(async()=>{});assert.match(ui.doc.body.textContent!,/Correo inválido/);const confirm=[...ui.doc.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Confirmar importación')!;assert.equal(confirm.disabled,true);assert.equal(ui.requests.filter(r=>r.method==='POST'&&!r.url.endsWith('/login')).length,0);}finally{await ui.close();}
});
test('CSV confirmation records invitations with mail disabled and leaves sending unavailable',async()=>{
 const ui=await mountAccount(h(ImportView),request=>Response.json(request.method==='POST'?{...batch,status:'confirmed',confirmedAt:'2026-11-07T12:00:00Z',createdCount:1,rows:[{...batch.rows[0],outcome:'created',invitationId:id,deliveryStatus:'pending',deliveryVersion:0,invitationStatus:'pending'}]}:batch),{url:'http://uc.localhost:3000/admin/users?importId='+id});
 try{await ui.settle(async()=>{});await ui.click('Confirmar importación');await ui.click('¿Confirmar estas altas pendientes?');assert.match(ui.doc.body.textContent!,/Lote confirmado/);const send=[...ui.doc.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Continuar envíos pendientes')!;assert.equal(send.disabled,true);assert.equal(ui.requests.some(r=>r.url.endsWith('/send')),false);}finally{await ui.close();}
});

test('CSV dispatch pauses on quota and never retries accepted or unknown results',async()=>{
 let receipt={...batch,status:'confirmed',confirmedAt:'2026-11-07T12:00:00Z',totalRows:4,createdCount:4,rows:[0,1,2,3].map((n)=>({...batch.rows[0],rowNumber:n+2,outcome:'created',invitationId:'10000000-0000-4000-8000-'+String(n+2).padStart(12,'0'),deliveryStatus:n===1?'accepted':n===2?'unknown':'pending',deliveryVersion:n===1||n===2?1:0,invitationStatus:'pending'}))};
 const ui=await mountAccount(h(ImportView,{emailAvailable:true}),request=>{
  if(request.url.endsWith('/send')){receipt={...receipt,rows:receipt.rows.map((r,index)=>index===0?{...r,deliveryStatus:'quota_blocked',deliveryVersion:1}:r)};return Response.json({code:'QUOTA_EXCEEDED'},{status:429});}
  return Response.json(receipt);
 },{url:'http://uc.localhost:3000/admin/users?importId='+id});
 try{await ui.settle(async()=>{});await ui.click('Continuar envíos pendientes');assert.equal(ui.requests.filter(r=>r.url.endsWith('/send')).length,1);assert.match(ui.doc.body.textContent!,/Envío pausado/);assert.match(ui.doc.body.textContent!,/requieren un reenvío explícito/);assert.equal(ui.requests.some(r=>r.url.includes(receipt.rows[1].invitationId+'/send')||r.url.includes(receipt.rows[2].invitationId+'/send')),false);}finally{await ui.close();}
});

test('admin invitation form recovers a creation retry with the same operation key',async()=>{
 let created=false;const keys:string[]=[];
 const invite={id,name:'Persona nueva',email:'new@example.test',status:'pending',deliveryStatus:'pending',deliveryVersion:0,createdAt:'2026-11-07T12:00:00Z',expiresAt:null,acceptedAt:null,revokedAt:null};
 const ui=await mountAccount(h(InstitutionUsers),request=>{
  if(request.url.endsWith('/memberships'))return Response.json({items:[],nextCursor:null});
  if(request.url.endsWith('/invitations')&&request.method==='POST'){keys.push(request.headers.get('Idempotency-Key')!);if(keys.length===1)return Response.json({detail:'PRIVATE'},{status:503});created=true;return Response.json(invite,{status:201});}
  return Response.json({items:created?[invite]:[],nextCursor:null});
 });
 try{
  await ui.submit('form[aria-label="Invitar usuario"]',{name:'Persona nueva',email:'NEW@example.test'});assert.equal(ui.doc.querySelector<HTMLInputElement>('#invite-name')!.value,'Persona nueva');assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE/);
  await ui.submit('form[aria-label="Invitar usuario"]');assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);assert.equal(ui.doc.querySelector<HTMLInputElement>('#invite-name')!.value,'');assert.match(ui.doc.body.textContent!,/new@example.test/);const send=[...ui.doc.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Enviar invitación')!;assert.equal(send.disabled,true);
 }finally{await ui.close();}
});

test('superadmin without admin flag explicitly confirms resend and revoke',async()=>{
 let invite={id,name:'Persona invitada',email:'person@example.test',status:'pending',deliveryStatus:'unknown',deliveryVersion:1,createdAt:'2026-11-07T12:00:00Z',expiresAt:new Date(Date.now()+86400000-65000).toISOString(),acceptedAt:null,revokedAt:null as string|null};
 const ui=await mountAccount(h(InstitutionUsers),request=>{
  if(request.url.endsWith('/memberships'))return Response.json({items:[],nextCursor:null});
  if(request.url.endsWith('/resend')){invite={...invite,deliveryStatus:'accepted',deliveryVersion:2,expiresAt:new Date(Date.now()+86400000).toISOString()};return Response.json(invite);}
  if(request.url.endsWith('/revoke')){invite={...invite,status:'revoked',revokedAt:new Date().toISOString()};return Response.json(invite);}
  return Response.json({items:[invite],nextCursor:null});
 },{role:'super',account:{capabilities:{avatar:false,invitationEmail:true}}});
 try{
  assert.ok(ui.doc.querySelector('form[aria-label="Invitar usuario"]'));await ui.click('Reenviar invitación');assert.equal(ui.requests.some(r=>r.url.endsWith('/resend')),false);assert.match(ui.doc.body.textContent!,/enlace anterior dejará de funcionar/);await ui.click('¿Enviar un enlace nuevo?');assert.equal(ui.requests.filter(r=>r.url.endsWith('/resend')).length,1);assert.match(ui.doc.body.textContent!,/Aceptado por el servicio de correo/);await ui.click('Revocar invitación');await ui.click('¿Revocar esta invitación?');assert.equal(ui.requests.filter(r=>r.url.endsWith('/revoke')).length,1);assert.match(ui.doc.body.textContent!,/Revocada/);
 }finally{await ui.close();}
});
