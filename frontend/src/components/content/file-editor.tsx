"use client";

import {useEffect,useId,useRef,useState,type FormEvent} from "react";
import {X} from "lucide-react";
import {useContentMutation} from "./content-notices.tsx";
import {useSession} from "../auth/session-provider.tsx";
import {renameAcademicFile} from "../../lib/api/academic-files.ts";
import type {Session} from "../../lib/auth/session.ts";
import type {AcademicFile,UploadLimits} from "../../lib/content/academic-files.ts";
import {title as checkTitle} from "../../lib/content/validation.ts";
import {FileUploadForm} from "./file-upload-form.tsx";

type Props={
 session:Session;slug:string;item:AcademicFile;limits:UploadLimits;disabled:boolean;
 reload:()=>Promise<boolean|undefined>;remove:(item:AcademicFile)=>void;onClose:()=>void;
};

function Editor({session,slug,item,limits,disabled,reload,remove,onClose}:Props) {
 const mutation=useContentMutation(session);
 const accessWarning=!!useSession().state.contextWarning;
 const dialog=useRef<HTMLDialogElement>(null),confirmation=useRef<HTMLDialogElement>(null),modal=useRef(true),name=useRef<HTMLInputElement>(null);
 const ids={heading:useId(),field:useId(),form:useId()};
 const [value,setValue]=useState(item.title),[edited,setEdited]=useState(false),[touched,setTouched]=useState(false);
 const [uploading,setUploading]=useState(false),[pending,setPending]=useState(false),[confirming,setConfirming]=useState(false);
 const trimmed=value.trim();
 const error=!trimmed?"Ingresa un nombre.":[...trimmed].length>200?"El nombre admite hasta 200 caracteres.":trimmed.includes("\0")?"El nombre contiene un carácter no válido.":undefined;
 const renamed=trimmed!==item.title, dirty=renamed||pending;
 const locked=disabled||accessWarning||mutation.busy||!!mutation.uncertain||uploading;
 const reconcile=async()=>{await reload();return "Revisa el archivo en la lista actual.";};

 useEffect(()=>{
  const element=dialog.current;
  element?.showModal();
  name.current?.focus();
  return ()=>element?.close();
 },[]);
 // While access is unverified the page shows its own recovery notice: keep the editor visible but non-modal, then restore it.
 useEffect(()=>{
  const element=dialog.current;
  if (!element) return;
  if (accessWarning&&element.open&&modal.current) {element.close();element.show?.();modal.current=false;}
  else if (!accessWarning&&!modal.current) {element.close();element.showModal();modal.current=true;}
 },[accessWarning]);
 // Close only after the confirmation notice was emitted; a stale-list warning keeps the editor open.
 useEffect(()=>{if (mutation.confirmed&&!mutation.persistent) onClose();},[mutation.confirmed,mutation.persistent,onClose]);

 function requestClose() {
  if (mutation.busy||uploading) return;
  if (dirty&&!confirming) {setConfirming(true);return;}
  onClose();
 }
 function rename(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (locked) return;
  const next=String(new FormData(event.currentTarget).get("title")??"");
  setValue(next);setTouched(true);
  if (!next.trim()||[...next.trim()].length>200||next.trim()===item.title) return;
  void mutation.run(async current=>{
   await session.request(c=>renameAcademicFile(c,slug,item,checkTitle(next)),current);
   if (!current()) return;
   return await reload() ? "Nombre actualizado." : {message:"Nombre guardado. Usa Reintentar para consultar los recursos.",persistent:true};
  },reconcile);
 }
 const shown=touched?error:undefined;
 return <dialog ref={dialog} className="modal native-dialog academic-dialog page-editor-dialog" aria-labelledby={ids.heading}
  onCancel={event=>{event.preventDefault();requestClose();}}>
  <div className="stack">
   <div className="dialog-heading">
    <div><h2 id={ids.heading}>Editar archivo</h2><p className="hint">Cambia el nombre visible, reemplaza el archivo o elimínalo del módulo.</p></div>
    <button type="button" className="btn btn-ghost" aria-label="Cerrar" disabled={mutation.busy||uploading} onClick={requestClose}><X size={18} aria-hidden="true"/></button>
   </div>
   <form id={ids.form} className="stack" aria-label={`Editar archivo ${item.title}`} noValidate onSubmit={rename}>
    <fieldset className="stack" disabled={locked}>
     <label className="field-label" htmlFor={ids.field}>Nombre visible</label>
     <input ref={name} id={ids.field} name="title" className="field" defaultValue={item.title} maxLength={200} required autoComplete="off"
      aria-invalid={shown?true:undefined} aria-describedby={shown?`${ids.field}-error`:undefined}
      onInput={event=>{setEdited(true);setValue(event.currentTarget.value);}} onBlur={()=>{if (edited) setTouched(true);}}/>
     {shown&&<p id={`${ids.field}-error`} className="field-error">{shown}</p>}
    </fieldset>
    {mutation.message&&<p role={mutation.confirmed?"status":"alert"}>{mutation.message}</p>}
   </form>
   <section className="stack file-replace" aria-labelledby={`${ids.heading}-replace`}>
    <h3 id={`${ids.heading}-replace`}>Reemplazar archivo</h3>
    <p className="hint">El recurso conserva su posición y estado de publicación.</p>
    <FileUploadForm session={session} slug={slug} moduleId={item.moduleId} item={item} limits={limits} disabled={locked&&!uploading}
     reload={reload} onBusyChange={setUploading} onPendingChange={setPending} onDone={onClose}/>
   </section>
   {confirming&&<div className="discard-confirm" role="alert"><p>Tienes cambios sin guardar. ¿Quieres descartarlos?</p>
    <div className="actions"><button type="button" className="btn btn-ghost" onClick={()=>setConfirming(false)}>Seguir editando</button>
     <button type="button" className="btn btn-danger" onClick={onClose}>Descartar cambios</button></div></div>}
   <div className="actions dialog-actions">
    <button type="button" className="btn btn-danger page-delete" disabled={locked} onClick={()=>confirmation.current?.showModal()}>Eliminar archivo</button>
    <button type="button" className="btn btn-ghost" disabled={mutation.busy||uploading} onClick={requestClose}>Cancelar</button>
    <button type="submit" form={ids.form} className="btn btn-primary" disabled={locked||!renamed||!!error}>Guardar cambios</button>
   </div>
  </div>
  <dialog className="modal native-dialog file-delete-dialog" ref={confirmation} aria-labelledby={`${ids.heading}-delete`}>
   <div className="stack">
    <h2 className="serif" id={`${ids.heading}-delete`}>Eliminar archivo</h2>
    <p>Se retirará «{item.title}» del módulo.</p>
    <form method="dialog" className="actions">
     <button type="submit" className="btn btn-ghost">Volver</button>
     <button className="btn btn-danger" type="button" onClick={()=>{confirmation.current?.close();onClose();remove(item);}}>Eliminar archivo</button>
    </form>
   </div>
  </dialog>
 </dialog>;
}

/** Edit a file resource (rename, replace, delete) in the same modal pattern as pages; mounts only while open. */
export function FileEditorDialog({open,...props}:Props&{open:boolean}) {
 return open ? <Editor {...props}/> : null;
}
