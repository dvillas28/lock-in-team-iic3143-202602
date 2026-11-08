'use client';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import { useSession } from '../auth/session-provider.tsx';
import { useResource } from '../courses/use-resource.ts';
import { ErrorState,LoadingState } from '../route-states.tsx';
import { AttemptConfirmation } from '../attempts/attempt-confirmation.tsx';
import { createInvitation,invitationAction,listInvitations,listMembers } from '../../lib/api/accounts.ts';
import type { Invitation } from '../../lib/accounts/validation.ts';
import type { Session } from '../../lib/auth/session.ts';
import { accountMessage } from './feedback.ts';
import { CsvImport } from './csv-import.tsx';
const deliveryLabels={pending:'Pendiente de envío',sending:'Envío en curso',accepted:'Aceptado por el servicio de correo',failed:'Envío fallido',quota_blocked:'En pausa por cuota',unknown:'Resultado de envío incierto'};
export function InstitutionUsers(){
 const {session,state}=useSession(),context=state.context;
 if(!context?.user)return <LoadingState/>;
 if(!context.user.institutionMembership.isAdmin&&!context.user.institutionMembership.isSuperAdmin)return <ErrorState feedback={{title:'Permisos insuficientes',message:'Solo los administradores de esta institución pueden gestionar sus usuarios.',retryable:false}}/>;
 return <Users key={`${state.generation}:${context.slug}`} session={session} slug={context.slug} emailAvailable={state.account?.capabilities.invitationEmail===true}/>;
}
function Users({session,slug,emailAvailable}:{session:Session;slug:string;emailAvailable:boolean}) {
 const [memberCursor,setMemberCursor]=useState<string>(),[inviteCursor,setInviteCursor]=useState<string>();
 const members=useResource(session,`members:${slug}:${memberCursor??''}`,c=>listMembers(c,slug,memberCursor),false);
 const invites=useResource(session,`invitations:${slug}:${inviteCursor??''}`,c=>listInvitations(c,slug,inviteCursor));
 const reload=async()=>{await invites.reload();};
 return <div className="stack"><div className="page-heading"><div><p className="section-label">Administración institucional</p><h1>Usuarios institucionales</h1><p>Invita personas a esta institución. El alta no asigna cursos ni permisos administrativos.</p></div></div>{!emailAvailable&&<p className="notice" role="status">El envío de correo está temporalmente no disponible. Puedes registrar invitaciones e importar usuarios; los correos permanecerán pendientes.</p>}<InvitationForm session={session} slug={slug} onSaved={reload}/><section className="card panel stack"><h2>Invitaciones</h2><button className="btn btn-ghost" onClick={()=>void invites.reload()}>Actualizar invitaciones</button>{invites.error?<ErrorState feedback={invites.error} onRetry={()=>void invites.reload()}/>:!invites.data?<LoadingState/>:invites.data.items.length===0?<p>No hay invitaciones en esta página.</p>:<div className="account-table-wrap" role="region" aria-label="Desplazar invitaciones" tabIndex={0}><table className="data-table"><caption>Invitaciones de esta institución</caption><thead><tr><th scope="col">Persona</th><th scope="col">Activación</th><th scope="col">Correo</th><th scope="col">Acciones</th></tr></thead><tbody>{invites.data.items.map(invite=><InvitationRow key={invite.id} session={session} slug={slug} invite={invite} emailAvailable={emailAvailable} onSaved={reload}/>)}</tbody></table></div>}<div className="state-actions">{inviteCursor&&<button className="btn btn-ghost" onClick={()=>setInviteCursor(undefined)}>Primera página</button>}{invites.data?.nextCursor&&<button className="btn btn-ghost" onClick={()=>setInviteCursor(invites.data!.nextCursor!)}>Siguientes invitaciones</button>}</div></section><CsvImport session={session} slug={slug} emailAvailable={emailAvailable} onConfirmed={reload}/><section className="card panel stack"><h2>Miembros activos</h2>{members.error?<ErrorState feedback={members.error} onRetry={()=>void members.reload()}/>:!members.data?<LoadingState/>:!members.data.items.length?<p>No hay miembros activos para mostrar.</p>:<div className="account-table-wrap" role="region" aria-label="Desplazar miembros" tabIndex={0}><table className="data-table"><caption>Miembros activos de esta institución</caption><thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Permisos institucionales</th></tr></thead><tbody>{members.data.items.map(member=><tr key={member.id}><td>{member.user.name}</td><td>{member.user.email}</td><td>{[member.isAdmin?'Administración':null,member.isSuperAdmin?'Superadministración':null].filter(Boolean).join(', ')||'Miembro'}</td></tr>)}</tbody></table></div>}<div className="state-actions">{memberCursor&&<button className="btn btn-ghost" onClick={()=>setMemberCursor(undefined)}>Primera página de miembros</button>}{members.data?.nextCursor&&<button className="btn btn-ghost" onClick={()=>setMemberCursor(members.data!.nextCursor!)}>Siguientes miembros</button>}</div></section></div>;
}
function InvitationForm({session,slug,onSaved}:{session:Session;slug:string;onSaved:()=>Promise<void>}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');const op=useRef<{signature:string;key:string}|undefined>(undefined),locked=useRef(false);const generation=session.getSnapshot().generation;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(locked.current)return;const form=event.currentTarget,data=new FormData(form),name=String(data.get('name')??'').trim(),email=String(data.get('email')??'').trim().toLowerCase();
  if(!name||name.length>200||email.length>254||!/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(email)){setMessage('Ingresa un nombre de hasta 200 caracteres y un correo válido.');return;}
  const body={name,email},signature=JSON.stringify(body);if(op.current?.signature!==signature)op.current={signature,key:crypto.randomUUID()};locked.current=true;setBusy(true);setMessage('');
  try{await session.request(c=>createInvitation(c,slug,body,op.current!.key));if(session.getSnapshot().generation!==generation)return;form.reset();op.current=undefined;setMessage('Invitación registrada. La persona obtendrá acceso después de activarla.');await onSaved();}
  catch(error){if(session.getSnapshot().generation===generation){setMessage(accountMessage(error)+' Puedes volver a intentar el mismo formulario sin duplicar la operación.');await onSaved();}}
  finally{locked.current=false;setBusy(false);}
 }
 return <section className="card panel stack"><h2>Invitar una persona</h2><form className="stack" aria-label="Invitar usuario" aria-busy={busy} onSubmit={submit}><fieldset className="stack access-boundary" disabled={busy}><div className="account-form-grid"><div><label className="field-label" htmlFor="invite-name">Nombre visible</label><input className="field" id="invite-name" name="name" required maxLength={200} autoComplete="off"/></div><div><label className="field-label" htmlFor="invite-email">Correo electrónico</label><input className="field" id="invite-email" name="email" type="email" required maxLength={254} autoComplete="off"/></div></div><button className="btn btn-primary">Registrar invitación</button></fieldset><p role="status" aria-live="polite">{busy?'Registrando invitación…':message}</p></form></section>;
}
export function InvitationRow({session,slug,invite,emailAvailable,onSaved}:{session:Session;slug:string;invite:Invitation;emailAvailable:boolean;onSaved:()=>Promise<void>}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[now,setNow]=useState(Date.now);const locked=useRef(false),operation=useRef<{action:string;key:string}|undefined>(undefined);const generation=session.getSnapshot().generation;
 const last=invite.lastDeliveryAt?Date.parse(invite.lastDeliveryAt):invite.expiresAt?Date.parse(invite.expiresAt)-86400000:0;
 const cooldown=last>0&&now<last+60000;
 useEffect(()=>{if(!cooldown)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[cooldown]);
 async function action(kind:'send'|'resend'|'revoke') {
  if(locked.current)return;locked.current=true;setBusy(true);setMessage('');if(operation.current?.action!==kind)operation.current={action:kind,key:crypto.randomUUID()};
  try{await session.request(c=>invitationAction(c,slug,invite.id,kind,operation.current!.key));if(session.getSnapshot().generation!==generation)return;operation.current=undefined;await onSaved();}
  catch(error){if(session.getSnapshot().generation===generation){setMessage(accountMessage(error));await onSaved();}}
  finally{locked.current=false;setBusy(false);}
 }
 const firstSend=(invite.deliveryVersion??(invite.expiresAt?1:0))===0;
 const pending=invite.status==='pending',renewable=invite.status==='expired'&&invite.name!==null&&invite.email!==null&&!invite.piiPurgedAt;
 return <tr><td>{invite.name??'Datos temporales depurados'}<span className="account-invite-status hint">{invite.email??'Recibo conservado sin correo'}</span></td><td>{{pending:'Pendiente',accepted:'Activada',revoked:'Revocada',expired:'Vencida'}[invite.status]}{invite.expiresAt&&<span className="account-invite-status hint">Vence: <time dateTime={invite.expiresAt}>{new Date(invite.expiresAt).toLocaleString('es-CL')}</time></span>}</td><td>{deliveryLabels[invite.deliveryStatus]}{cooldown&&<p className="hint">Podrás reenviar en {Math.ceil((last+60000-now)/1000)} s.</p>}</td><td><div className="state-actions">{pending&&firstSend&&['pending','failed','quota_blocked'].includes(invite.deliveryStatus)&&<button className="btn btn-ghost" disabled={busy||!emailAvailable||cooldown} onClick={()=>void action('send')}>Enviar invitación</button>}{(pending&&!firstSend&&['pending','failed','quota_blocked','accepted','unknown'].includes(invite.deliveryStatus)||renewable)&&<AttemptConfirmation label="Reenviar invitación" title="¿Enviar un enlace nuevo?" disabled={busy||!emailAvailable||cooldown} onConfirm={()=>void action('resend')}><p>El enlace anterior dejará de funcionar. La persona recibirá una nueva invitación.</p></AttemptConfirmation>}{pending&&<AttemptConfirmation label="Revocar invitación" title="¿Revocar esta invitación?" disabled={busy} danger onConfirm={()=>void action('revoke')}><p>El enlace dejará de permitir la activación.</p></AttemptConfirmation>}</div><p role="status" aria-live="polite">{busy?'Actualizando…':message}</p></td></tr>;
}
