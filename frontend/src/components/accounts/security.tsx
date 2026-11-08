'use client';
import { useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '../../lib/api/accounts.ts';
import { AccountValidationError,validateNewPassword } from '../../lib/accounts/validation.ts';
import { useSession } from '../auth/session-provider.tsx';
import { accountMessage } from './feedback.ts';
export function Security() {
 const {session}=useSession();const router=useRouter();const locked=useRef(false);const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[field,setField]=useState<string>();
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(locked.current)return;const form=event.currentTarget,data=new FormData(form),currentPassword=String(data.get('currentPassword')??''),newPassword=String(data.get('newPassword')??''),confirmPassword=String(data.get('confirmPassword')??'');const generation=session.getSnapshot().generation;
  try{if(!currentPassword)throw new AccountValidationError('currentPassword','Ingresa tu contraseña actual.');validateNewPassword(newPassword,confirmPassword);locked.current=true;setBusy(true);setMessage('');const work=session.accountRequest(c=>changePassword(c,{currentPassword,newPassword,confirmPassword}));form.reset();await work;if(session.getSnapshot().generation!==generation)return;session.logout('Contraseña actualizada. Inicia sesión nuevamente.');router.replace('/login?next=%2Fprofile');}
  catch(error){if(session.getSnapshot().generation===generation){setField(error instanceof AccountValidationError?error.field:error&&typeof error==='object'&&'status'in error&&error.status===400?'currentPassword':undefined);setMessage(error&&typeof error==='object'&&'status'in error&&error.status===400?'La contraseña actual es incorrecta o la nueva no cumple los requisitos. Revisa los campos.':accountMessage(error));}}
  finally{locked.current=false;setBusy(false);}
 }
 return <div className="stack"><div className="page-heading"><div><p className="section-label">Mi cuenta</p><h1>Seguridad</h1></div></div><section className="card panel stack"><h2>Cambiar contraseña</h2><p>Al guardar se cerrarán las sesiones anteriores en todas tus instituciones.</p><form className="stack" aria-label="Cambiar contraseña" aria-busy={busy} onSubmit={submit}><fieldset className="stack access-boundary" disabled={busy}>{[['currentPassword','Contraseña actual','current-password'],['newPassword','Nueva contraseña','new-password'],['confirmPassword','Repetir nueva contraseña','new-password']].map(([name,label,complete])=><div key={name}><label className="field-label" htmlFor={name}>{label}</label><input className="field" id={name} name={name} aria-invalid={field===name||undefined} aria-describedby={field===name?'password-error':undefined} type="password" autoComplete={complete} required/></div>)}<p className="hint">La nueva contraseña debe tener al menos 12 caracteres y como máximo 128 bytes.</p><button className="btn btn-primary">Actualizar contraseña</button></fieldset><p id="password-error" role="status" aria-live="polite">{busy?'Actualizando contraseña…':message}</p></form></section></div>;
}
