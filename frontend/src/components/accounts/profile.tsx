'use client';
import Image from 'next/image';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import { useSession } from '../auth/session-provider.tsx';
import { deleteAvatar,replaceAvatar,updateAccount } from '../../lib/api/accounts.ts';
import { AccountValidationError,validateProfile } from '../../lib/accounts/validation.ts';
import type { AccountProfile } from '../../lib/accounts/validation.ts';
import type { Session } from '../../lib/auth/session.ts';
import { AttemptConfirmation } from '../attempts/attempt-confirmation.tsx';
import { AccountAvatar } from './account-avatar.tsx';
import { accountMessage } from './feedback.ts';
export function Profile() {
 const {session,state}=useSession();const account=state.account;const [notice,setNotice]=useState(''),[profileDirty,setProfileDirty]=useState(false),[avatarBusy,setAvatarBusy]=useState(false);
 if(!account)return null;
 return <div className="stack"><div className="page-heading"><div><p className="section-label">Mi cuenta</p><h1>Mi perfil</h1><p>Tu nombre, descripción y foto se comparten entre tus instituciones.</p></div></div><p role="status" aria-live="polite">{notice}</p><ProfileForm key={account.updatedAt} session={session} account={account} disabled={avatarBusy} onDirtyChange={setProfileDirty} onSaved={()=>setNotice('Perfil actualizado.')}/><AvatarForm session={session} account={account} disabled={profileDirty} onBusyChange={setAvatarBusy}/></div>;
}
export function ProfileForm({session,account,onSaved,onDirtyChange,disabled=false}:{session:Session;account:AccountProfile;onSaved?:()=>void;onDirtyChange?:(dirty:boolean)=>void;disabled?:boolean}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[dirty,setDirty]=useState(false),[conflict,setConflict]=useState(false),[field,setField]=useState<string>();
 const locked=useRef(false),alive=useRef(true);const generation=session.getSnapshot().generation;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(locked.current||disabled)return;const form=event.currentTarget,data=new FormData(form);setMessage('');
  try {
   const body=validateProfile(String(data.get('name')??''),String(data.get('bio')??''));locked.current=true;setBusy(true);
   const saved=await session.accountRequest(c=>updateAccount(c,{...body,expectedUpdatedAt:account.updatedAt}));
   if(!alive.current||session.getSnapshot().generation!==generation)return;
   setDirty(false);onDirtyChange?.(false);onSaved?.();session.rememberAccount(saved);setMessage('Perfil actualizado.');
  }catch(error){if(alive.current&&session.getSnapshot().generation===generation){setMessage(accountMessage(error));setField(error instanceof AccountValidationError?error.field:undefined);setConflict(!!error&&typeof error==='object'&&'status'in error&&error.status===409);}}
  finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 return <section className="card panel stack"><h2>Datos personales</h2><form className="stack" onSubmit={submit} onInput={()=>{setDirty(true);onDirtyChange?.(true);}} aria-label="Editar perfil" aria-busy={busy}><fieldset className="stack access-boundary" disabled={busy||disabled}><div><label className="field-label" htmlFor="profile-email">Correo electrónico</label><input className="field" id="profile-email" value={account.email} readOnly/><p className="hint">El correo de acceso permanece fijo.</p></div><div><label className="field-label" htmlFor="profile-name">Nombre visible</label><input className="field" id="profile-name" aria-invalid={field==='name'||undefined} aria-describedby={field==='name'?'profile-error':undefined} name="name" defaultValue={account.name} required maxLength={200} autoComplete="name"/></div><div><label className="field-label" htmlFor="profile-bio">Descripción</label><textarea className="field" id="profile-bio" aria-invalid={field==='bio'||undefined} aria-describedby={field==='bio'?'profile-error':undefined} name="bio" defaultValue={account.bio??''} maxLength={500} rows={4}/><p className="hint">Opcional. Hasta 500 caracteres.</p></div><div className="state-actions"><button className="btn btn-primary" disabled={!dirty||busy}>Guardar perfil</button><button className="btn btn-ghost" type="reset" onClick={()=>{setDirty(false);onDirtyChange?.(false);setField(undefined);setConflict(false);setMessage('');}}>Cancelar cambios</button></div></fieldset><p id="profile-error" role="status" aria-live="polite">{busy?'Guardando…':message|| (dirty?'Hay cambios sin guardar.':'')}</p>{conflict&&<button type="button" className="btn btn-ghost" onClick={()=>{onDirtyChange?.(false);void session.loadAccount();}}>Recargar perfil y descartar cambios locales</button>}</form></section>;
}
function AvatarForm({session,account,disabled,onBusyChange}:{session:Session;account:AccountProfile;disabled:boolean;onBusyChange:(busy:boolean)=>void}) {
 const [file,setFile]=useState<File>(),[preview,setPreview]=useState<string>(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const locked=useRef(false);
 const input=useRef<HTMLInputElement>(null);const generation=session.getSnapshot().generation;
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 async function save(remove=false){
  if(locked.current||disabled||!account.capabilities.avatar||!remove&&!file)return;locked.current=true;setBusy(true);onBusyChange(true);setMessage('');
  try{const result=await session.accountRequest(c=>remove?deleteAvatar(c,account.updatedAt):replaceAvatar(c,file!,account.updatedAt));if(session.getSnapshot().generation!==generation)return;session.rememberAccount(result);setFile(undefined);setPreview(undefined);if(input.current)input.current.value='';setMessage(remove?'Foto eliminada.':'Foto actualizada.');}
  catch(error){if(session.getSnapshot().generation===generation)setMessage(accountMessage(error));}
  finally{locked.current=false;setBusy(false);onBusyChange(false);}
 }
 return <section className="card panel stack"><h2>Foto de perfil</h2><p>La foto es privada y solo puedes consultarla desde tu cuenta.</p><div className="state-actions">{preview?<Image className="account-avatar-preview" src={preview} alt="Vista previa de la nueva foto" width={96} height={96} unoptimized/>:<AccountAvatar name={account.name} large/>}</div>{disabled&&<p className="notice" role="status">Guarda o cancela los cambios de tus datos antes de cambiar la foto.</p>}{!account.capabilities.avatar&&<p className="notice" role="status">La gestión de fotos está temporalmente no disponible. Puedes seguir editando tus datos.</p>}<form className="stack" aria-label="Cambiar foto" aria-busy={busy} onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={busy||disabled||!account.capabilities.avatar} className="stack access-boundary"><label className="field-label" htmlFor="avatar-file">Elegir una foto</label><input ref={input} id="avatar-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{setMessage('');const selected=event.target.files?.[0];if(selected&&(selected.size>2*1024*1024||!['image/jpeg','image/png','image/webp'].includes(selected.type))){setMessage('Elige una imagen JPEG, PNG o WebP de hasta 2 MiB.');event.target.value='';setFile(undefined);setPreview(undefined);return;}setFile(selected);setPreview(selected?URL.createObjectURL(selected):undefined);}}/><p className="hint">JPEG, PNG o WebP, hasta 2 MiB. Se ajustará a un máximo de 1024 × 1024.</p><div className="state-actions"><button className="btn btn-primary" disabled={!file||busy}>Guardar foto</button>{file&&<button className="btn btn-ghost" type="button" onClick={()=>{setFile(undefined);setPreview(undefined);if(input.current)input.current.value='';}}>Cancelar</button>}{account.hasAvatar&&<AttemptConfirmation label="Eliminar foto" title="¿Eliminar tu foto?" disabled={busy} danger onConfirm={()=>void save(true)}><p>Volverás a ver la inicial de tu nombre.</p></AttemptConfirmation>}</div></fieldset><p role="status" aria-live="polite">{busy?'Actualizando foto…':message}</p></form></section>;
}
