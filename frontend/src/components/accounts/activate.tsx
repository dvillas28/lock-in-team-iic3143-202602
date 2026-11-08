'use client';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { acceptInvitation,activateInvitation } from '../../lib/api/accounts.ts';
import { activationToken,validateNewPassword } from '../../lib/accounts/validation.ts';
import { ApiHttpError } from '../../lib/api/errors.ts';
import { useSession } from '../auth/session-provider.tsx';
import { accountMessage } from './feedback.ts';
export function Activate() {
 const {session,state}=useSession();const token=useRef<string|undefined>(undefined),locked=useRef(false),alive=useRef(true);
 const [ready,setReady]=useState(false),[hasToken,setHasToken]=useState(false),[phase,setPhase]=useState<'new'|'existing'|'done'>('new'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  alive.current=true;token.current??=activationToken(window.location.hash);
  if(window.location.hash)window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
  const present=!!token.current;void Promise.resolve().then(()=>{if(alive.current){setHasToken(present);setReady(true);}});
  return()=>{alive.current=false;};
 },[]);
 async function accept(){
  if(locked.current||!token.current)return;locked.current=true;setBusy(true);setMessage('');
  try{await session.accountRequest(c=>acceptInvitation(c,token.current!));if(alive.current){token.current=undefined;setPhase('done');setMessage('Acceso institucional activado.');await session.loadInstitutions();}}
  catch(error){if(alive.current)setMessage(accountMessage(error));}
  finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 async function create(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(locked.current||!token.current)return;
  const form=event.currentTarget,data=new FormData(form),password=String(data.get('password')??''),confirmPassword=String(data.get('confirmPassword')??'');
  try{validateNewPassword(password,confirmPassword);locked.current=true;setBusy(true);setMessage('');const request=session.publicRequest(c=>activateInvitation(c,{token:token.current!,password,confirmPassword}));form.reset();await request;if(alive.current){token.current=undefined;setPhase('done');setMessage('Cuenta activada. Ya puedes iniciar sesión.');}}
  catch(error){if(alive.current){if(error instanceof ApiHttpError&&error.problem.code==='INVITATION_LOGIN_REQUIRED'){setPhase('existing');setMessage('Ya tienes una cuenta. Inicia sesión con el correo de la invitación para aceptar el acceso.');}else setMessage(accountMessage(error));}}
  finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 async function login(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(locked.current)return;const form=event.currentTarget,data=new FormData(form),email=String(data.get('email')??''),password=String(data.get('password')??'');locked.current=true;setBusy(true);setMessage('');
  try{const work=session.login(email,password);form.reset();if(!await work&&alive.current)setMessage(session.getSnapshot().message??'No se pudo iniciar sesión.');}
  finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 return <main className="content auth-content"><div className="sidebar-logo"><GraduationCap aria-hidden="true"/><span className="logo-name">AcademiX</span></div><section className="card panel stack auth-panel"><h1>Activar acceso institucional</h1>{!ready?<p role="status">Preparando invitación…</p>:phase==='done'?<><p role="status">{message}</p><Link className="btn btn-primary" href={state.status==='authenticated'?'/courses':'/login'}>{state.status==='authenticated'?'Ir a mis cursos':'Iniciar sesión'}</Link><Link className="btn btn-ghost" href="/profile">Mi perfil</Link></>:!hasToken?<><p role="alert">El enlace está incompleto o ya no está disponible en esta página. Ábrelo nuevamente desde el correo o solicita una nueva invitación.</p><Link className="btn btn-ghost" href="/login">Volver al acceso</Link></>:<><p>Confirma la invitación para obtener acceso. Abrir esta página no activa tu cuenta.</p><div className="state-actions"><button className="btn btn-ghost" disabled={busy} aria-pressed={phase==='new'} onClick={()=>{setPhase('new');setMessage('');}}>Crear mi contraseña</button><button className="btn btn-ghost" disabled={busy} aria-pressed={phase==='existing'} onClick={()=>{setPhase('existing');setMessage('');}}>Ya tengo cuenta</button></div>{phase==='new'?<form className="stack" aria-label="Activar cuenta nueva" aria-busy={busy} onSubmit={create}><fieldset className="stack access-boundary" disabled={busy}><div><label className="field-label" htmlFor="activation-password">Nueva contraseña</label><input id="activation-password" className="field" name="password" type="password" autoComplete="new-password" required/></div><div><label className="field-label" htmlFor="activation-confirm">Repetir contraseña</label><input id="activation-confirm" className="field" name="confirmPassword" type="password" autoComplete="new-password" required/></div><p className="hint">Al menos 12 caracteres y como máximo 128 bytes.</p><button type="submit" className="btn btn-primary">Activar mi cuenta</button></fieldset></form>:state.status==='authenticated'?<div className="stack"><p>Confirma con tu cuenta actual. El correo debe coincidir con el de la invitación.</p><button className="btn btn-primary" disabled={busy} onClick={()=>void accept()}>Aceptar acceso con mi cuenta</button><button className="btn btn-ghost" disabled={busy} onClick={()=>session.logout()}>Usar otra cuenta</button></div>:<form className="stack" aria-label="Ingresar para aceptar invitación" aria-busy={busy} onSubmit={login}><fieldset className="stack access-boundary" disabled={busy||state.status==='authenticating'}><div><label className="field-label" htmlFor="activation-email">Correo de tu cuenta</label><input className="field" id="activation-email" name="email" type="email" autoComplete="username" required/></div><div><label className="field-label" htmlFor="activation-current">Contraseña actual</label><input className="field" id="activation-current" name="password" type="password" autoComplete="current-password" required/></div><button type="submit" className="btn btn-primary">Ingresar y continuar</button></fieldset></form>}<p role="status" aria-live="polite">{busy?'Procesando…':message}</p><p className="hint">Si recargas o sales antes de confirmar, vuelve a abrir el enlace del correo.</p></>}</section></main>;
}
