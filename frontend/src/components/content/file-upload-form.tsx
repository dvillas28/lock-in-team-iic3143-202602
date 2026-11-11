"use client";

import {useEffect,useRef,useState,type FormEvent} from "react";
import {Upload,File} from "lucide-react";
import {sendAcademicFile,uploadTransport} from "../../lib/api/academic-files.ts";
import {ApiHttpError} from "../../lib/api/errors.ts";
import type {Session} from "../../lib/auth/session.ts";
import {acceptedFiles,checkSelectedFile,formatBytes,type AcademicFile,type UploadLimits} from "../../lib/content/academic-files.ts";
import {useContentNotice} from "./content-notices.tsx";
import {getRouteFeedback} from "../../lib/route-feedback.ts";

export function FileUploadForm({session,slug,moduleId,item,limits,disabled,reload,onBusyChange,onDone,onPendingChange}:{
 session:Session;slug:string;moduleId:string;item?:AcademicFile;limits:UploadLimits;disabled:boolean;reload:()=>Promise<boolean|undefined>;onBusyChange?:(busy:boolean)=>void;onDone?:()=>void;onPendingChange?:(pending:boolean)=>void;
}) {
 const [selected,setSelected]=useState<{file:globalThis.File;operation:string}[]>([]);
 const [progress,setProgress]=useState<number>();
 const [busy,setBusy]=useState(false);
 const [dragging,setDragging]=useState(false);
 const [feedback,setFeedback]=useState<string>();
 const notify=useContentNotice();
 const input=useRef<HTMLInputElement>(null), running=useRef<AbortController>(null);
 useEffect(()=>()=>{running.current?.abort();running.current=null;},[]);
 useEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
 useEffect(()=>{onPendingChange?.(selected.length>0);},[selected.length,onPendingChange]);
 useEffect(()=>{
  if (!selected.length) return;
  function warn(event:BeforeUnloadEvent) {event.preventDefault();event.returnValue=true;}
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[selected]);

 function choose(files:globalThis.File[], fromInput=false) {
  if (item && files.length>1) {
   setFeedback("Selecciona un solo archivo para el reemplazo.");
   return;
  }
  const invalid=files.find(file=>checkSelectedFile(file,limits));
  setSelected(invalid?[]:files.map(file=>({file,operation:crypto.randomUUID()})));
  setFeedback(invalid?`${invalid.name}. ${checkSelectedFile(invalid,limits)}`:undefined);
  if (input.current && (!fromInput || invalid || !files.length)) input.current.value="";
 }
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!selected.length || disabled || running.current) return;
  const controller=new AbortController();
  running.current=controller;
  setBusy(true);setProgress(undefined);setFeedback(undefined);
  const context=session.getSnapshot().context, generation=session.getSnapshot().generation;
  const current=()=>running.current===controller && context===session.getSnapshot().context && generation===session.getSnapshot().generation;
  let saved=0;
  try {
   for (const {file,operation} of selected) {
    if (controller.signal.aborted || !current()) throw controller.signal.reason;
    setProgress(undefined);
    const body=new FormData();
    body.append("file",file);
    await session.request(c=>sendAcademicFile(c,slug,moduleId,body,controller.signal,operation,item),current,
     uploadTransport(body,value=>{if(current()) setProgress(value);}));
    saved++;
    if (current()) setSelected(remaining=>remaining.filter(entry=>entry.operation!==operation));
   }
   const refreshed=await reload();
   if (!current()) return;
   if (input.current) input.current.value="";
   const message=item?"Archivo reemplazado.":saved===1?"Archivo agregado como borrador.":`${saved} archivos agregados como borradores.`;
   if (refreshed) {notify?.(message);onDone?.();}
   else setFeedback(`${message} Usa Reintentar para consultar los recursos.`);
  } catch(error) {
   if (!current()) return;
   const rejected=error instanceof ApiHttpError && error.status<500;
   if (saved || controller.signal.aborted || !rejected || error.status===409) await reload();
   if (!current()) return;
   if (controller.signal.aborted || !rejected || error.status===409) {
    setFeedback(controller.signal.aborted
     ? "Carga cancelada. Revisa el módulo antes de volver a enviarla."
     : "Revisa el estado actual del módulo antes de volver a enviar el archivo.");
   } else {
    const message=error.status===413 ? "El archivo supera el límite de tamaño." :
     error.status===415 ? "El archivo no coincide con un formato admitido." : getRouteFeedback(error).message;
    setFeedback(message);
   }
  } finally {
   if (running.current===controller) {running.current=null;setBusy(false);setProgress(undefined);}
  }
 }

 return <form className="file-upload stack" onSubmit={submit}>
  <div className={`upload-zone file-drop${dragging?" is-dragging":""}`}
    onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect=busy||disabled?"none":"copy";if(!busy&&!disabled)setDragging(true);}}
    onDragLeave={()=>setDragging(false)}
    onDrop={event=>{event.preventDefault();setDragging(false);if(busy||disabled)return;
      choose(Array.from(event.dataTransfer.files));}}>
   <Upload size={20} aria-hidden="true"/>
   <div><label className="field-label" htmlFor={`upload-${item?.id??moduleId}`}>{item?"Seleccionar archivo de reemplazo":"Seleccionar archivo"}</label>
   <p className="hint">También puedes arrastrarlo aquí.</p></div>
   <input id={`upload-${item?.id??moduleId}`} name="file" type="file" ref={input} accept={acceptedFiles}
    multiple={!item} disabled={busy||disabled} onChange={event=>choose(Array.from(event.currentTarget.files??[]),true)}/>
  </div>
  {!!selected.length && <ul className="file-selections" aria-label="Archivos seleccionados">{selected.map(({file,operation})=>
   <li className="file-selection" key={operation}><File size={16} aria-hidden="true"/><strong>{file.name}</strong>
    <span className="tnum">{formatBytes(file.size)}</span></li>)}</ul>}
  {busy && <div className="file-progress">
   <progress aria-label="Progreso de carga" max={100} value={progress}/>
   <span role="status">{progress===100?"Validando y guardando…":progress===undefined?"Preparando carga…":`Subiendo ${progress} %`}</span>
  </div>}
  {feedback && <p role="alert">{feedback}</p>}
  <div className="actions">
   <button type="submit" className="btn btn-primary" disabled={disabled||busy||!selected.length}>{item?"Reemplazar archivo":"Subir como borrador"}</button>
   {(busy||selected.length>0) && <button className="btn btn-ghost" type="button"
    onClick={()=>{if(busy)running.current?.abort();else choose([]);}}>Cancelar carga</button>}
  </div>
 </form>;
}
