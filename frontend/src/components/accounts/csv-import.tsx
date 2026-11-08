'use client';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import type { Session } from '../../lib/auth/session.ts';
import { confirmImport,getImport,invitationAction,previewImport } from '../../lib/api/accounts.ts';
import { isAccountId,pendingImportSends,validateCsv,type UserImport } from '../../lib/accounts/validation.ts';
import { ApiHttpError } from '../../lib/api/errors.ts';
import { AttemptConfirmation } from '../attempts/attempt-confirmation.tsx';
import { accountMessage } from './feedback.ts';
const validationLabels:Record<string,string>={valid:'Lista para invitar',already_member:'Ya pertenece: se omitirá',already_pending:'Ya tiene invitación: se omitirá',invalid_name:'Nombre inválido',invalid_email:'Correo inválido',duplicate:'Correo repetido en el archivo',revoked_membership:'Pertenencia revocada: requiere revisión'};
const deliveryLabels:Record<string,string>={pending:'Pendiente de envío',sending:'Envío en curso',accepted:'Aceptado por el servicio de correo',failed:'Envío fallido',quota_blocked:'Pausa por cuota',unknown:'Resultado incierto; requiere reenvío explícito'};
export function CsvImport({session,slug,emailAvailable,onConfirmed}:{session:Session;slug:string;emailAvailable:boolean;onConfirmed:()=>Promise<void>}) {
 const [batch,setBatch]=useState<UserImport>(),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[message,setMessage]=useState(''),[now,setNow]=useState(Date.now);
 const alive=useRef(true),locked=useRef(false),pause=useRef(false),input=useRef<HTMLInputElement>(null);
 const operations=useRef(new Map<string,string>());const generation=session.getSnapshot().generation,context=session.getSnapshot().context;
 const current=()=>alive.current&&generation===session.getSnapshot().generation&&context===session.getSnapshot().context;
 const key=(id:string)=>{let value=operations.current.get(id);if(!value){value=crypto.randomUUID();operations.current.set(id,value);}return value;};
 function remember(next:UserImport){if(!current())return;setBatch(next);const url=new URL(window.location.href);url.searchParams.set('importId',next.id);window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}
 async function refresh(id:string){try{const next=await session.request(c=>getImport(c,slug,id));remember(next);return next;}catch(error){if(current())setMessage(accountMessage(error));return undefined;}}
 useEffect(()=>{alive.current=true;const id=new URLSearchParams(window.location.search).get('importId');if(id&&isAccountId(id))void Promise.resolve().then(()=>refresh(id));return()=>{alive.current=false;pause.current=true;};},[session,slug]); // eslint-disable-line react-hooks/exhaustive-deps
 async function preview(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(locked.current)return;const file=input.current?.files?.[0];if(!file){setMessage('Selecciona un archivo CSV.');return;}
  try{validateCsv(file);}catch(error){setMessage(accountMessage(error));return;}
  locked.current=true;setBusy(true);setMessage('');
  try{const next=await session.request(c=>previewImport(c,slug,file,crypto.randomUUID()));if(current()){remember(next);setMessage('Archivo validado. Revisa las filas antes de confirmar.');}}
  catch(error){if(current())setMessage(accountMessage(error));}
  finally{if(input.current)input.current.value='';locked.current=false;if(current())setBusy(false);}
 }
 async function confirm(){
  if(locked.current||!batch)return;locked.current=true;setBusy(true);setMessage('');
  try{const next=await session.request(c=>confirmImport(c,slug,batch.id));if(current()){remember(next);setMessage('Lote confirmado. Las invitaciones están registradas; los correos se envían por separado.');await onConfirmed();}}
  catch(error){if(current()){setMessage(accountMessage(error)+' Consulta el estado antes de volver a confirmar.');await refresh(batch.id);}}
  finally{locked.current=false;if(current())setBusy(false);}
 }
 async function send(){
  if(locked.current||!batch||!emailAvailable)return;locked.current=true;pause.current=false;setSending(true);setMessage('');
  try{
   let latest=await refresh(batch.id);if(!latest||!current())return;
   const rows=pendingImportSends(latest);let done=0;
   for(const row of rows){
    if(pause.current||!current())break;
    try{const delivered=await session.request(c=>invitationAction(c,slug,row.invitationId!,'send',key(row.invitationId!)));done++;if(current())setMessage(`Procesadas ${done} de ${rows.length} invitaciones pendientes.`);if(['quota_blocked','unknown'].includes(delivered.deliveryStatus)){pause.current=true;break;}}
    catch(error){if(current())setMessage(accountMessage(error)+' Los resultados guardados se conservan.');if(error instanceof ApiHttpError&&[429,503].includes(error.status)||!(error instanceof ApiHttpError)||error instanceof ApiHttpError&&([401,403,404].includes(error.status)||error.problem.code==='ACCESS_REVALIDATION_REQUIRED')){pause.current=true;break;}}
    latest=await refresh(batch.id);if(!latest)break;
   }
   if(current()){await refresh(batch.id);await onConfirmed();if(pause.current)setMessage('Envío pausado. Consulta los resultados y continúa los pendientes cuando corresponda.');else setMessage('Despacho terminado. Revisa los resultados; aceptación del correo y activación son estados distintos.');}
  }finally{locked.current=false;if(current())setSending(false);}
 }
 useEffect(()=>{if(batch?.status!=='previewed')return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[batch?.status]);
 const valid=batch?.status==='previewed'&&Date.parse(batch.expiresAt)>now&&batch.rows.every(r=>['valid','already_member','already_pending'].includes(r.validationCode));
 return <section className="card panel stack"><h2>Importar usuarios por CSV</h2><p>Usa las columnas <code>name,email</code>, hasta 100 personas y 256 KiB. El archivo se descarta después de procesarlo.</p><a className="btn btn-ghost" href="data:text/csv;charset=utf-8,name%2Cemail%0AAna%20P%C3%A9rez%2Cana%40example.test%0A" download="plantilla-usuarios.csv">Descargar plantilla CSV</a><form aria-label="Validar CSV" className="stack" aria-busy={busy} onSubmit={preview}><label className="field-label" htmlFor="users-csv">Archivo CSV</label><input ref={input} id="users-csv" className="account-file-field" type="file" accept=".csv,text/csv" disabled={busy||sending}/><button type="submit" className="btn btn-ghost" disabled={busy||sending}>Validar archivo</button></form><p role="status" aria-live="polite">{busy?'Procesando archivo…':message}</p>{batch&&<><div className="state-actions"><p>Lote <span className="tnum">{batch.id}</span>: {batch.totalRows} filas · {batch.createdCount} invitaciones creadas · {batch.skippedCount} omitidas.</p><button className="btn btn-ghost" disabled={busy||sending} onClick={()=>void refresh(batch.id)}>Consultar estado del lote</button></div>{batch.status==='previewed'&&<><p>La vista previa vence el <time dateTime={batch.expiresAt}>{new Date(batch.expiresAt).toLocaleString('es-CL')}</time>.</p>{!valid&&<p className="notice">Corrige los errores o vuelve a validar un archivo vigente antes de confirmar.</p>}<AttemptConfirmation label="Confirmar importación" title="¿Confirmar estas altas pendientes?" disabled={!valid||busy||sending} primary onConfirm={()=>void confirm()}><p>Se crearán invitaciones para las filas válidas; las personas ya pertenecientes o con invitación vigente se omitirán.</p></AttemptConfirmation></>}{batch.status==='expired'&&<p>La vista previa venció. Sube el archivo nuevamente para validarlo.</p>}{batch.status==='confirmed'&&<div className="state-actions"><button className="btn btn-primary" disabled={busy||sending||!emailAvailable||!pendingImportSends(batch).length} onClick={()=>void send()}>Continuar envíos pendientes</button>{sending&&<button className="btn btn-ghost" onClick={()=>{pause.current=true;}}>Pausar después del envío actual</button>}<p className="hint">Cerrar esta página pausa los envíos. Conserva este enlace para consultar el lote al volver.</p></div>}<div className="account-table-wrap" role="region" aria-label="Desplazar resultados CSV" tabIndex={0}><table className="data-table"><caption>Resultados por fila del lote</caption><thead><tr><th scope="col">Fila de datos</th><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Resultado</th><th scope="col">Estado de correo</th></tr></thead><tbody>{batch.rows.map(row=><tr key={row.rowNumber}><td className="tnum">{row.rowNumber}</td><td>{row.name??'Datos depurados'}</td><td>{row.email??'Datos depurados'}</td><td>{row.outcome==='created'?'Invitación creada':row.outcome==='skipped'?'Omitida':validationLabels[row.validationCode]??'Revisar fila'}</td><td>{row.deliveryStatus?deliveryLabels[row.deliveryStatus]:'Sin despacho'}</td></tr>)}</tbody></table></div>{batch.status==='confirmed'&&batch.rows.some(row=>row.invitationId&&(['failed','quota_blocked','unknown'].includes(row.deliveryStatus??'')||(row.deliveryVersion??0)>0&&row.deliveryStatus==='pending'))&&<p className="notice">Los envíos fallidos, pausados por cuota o con resultado incierto requieren un reenvío explícito desde la lista de invitaciones. El enlace anterior dejará de funcionar.</p>}</>}</section>;
}
