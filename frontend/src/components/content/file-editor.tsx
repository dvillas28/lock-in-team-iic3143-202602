"use client";

import {useId,useRef,type FormEvent} from "react";
import {useContentMutation} from "./content-notices.tsx";
import {renameAcademicFile} from "../../lib/api/academic-files.ts";
import type {Session} from "../../lib/auth/session.ts";
import type {AcademicFile,UploadLimits} from "../../lib/content/academic-files.ts";
import {title} from "../../lib/content/validation.ts";
import {FileUploadForm} from "./file-upload-form.tsx";

export function FileEditor({session,slug,item,limits,disabled,reload,remove}:{
 session:Session;slug:string;item:AcademicFile;limits:UploadLimits;disabled:boolean;reload:()=>Promise<boolean|undefined>;remove:(item:AcademicFile)=>void;
}) {
 const mutation=useContentMutation(session);
 const dialog=useRef<HTMLDialogElement>(null);
 const heading=useId(), label=useId();
 const unavailable=disabled||mutation.busy||!!mutation.uncertain;
 const reconcile=async()=>{await reload();return "Revisa el archivo en la lista actual.";};
 function rename(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const fields=new FormData(event.currentTarget);
  void mutation.run(async current=>{
   await session.request(c=>renameAcademicFile(c,slug,item,title(fields.get("title"))),current);
   return await reload() ? "Nombre actualizado." : {message:"Nombre guardado. Usa Reintentar para consultar los recursos.",persistent:true};
  },reconcile);
 }
 return <details className="academic-disclosure resource-editor">
  <summary>Administrar archivo <span className="content-sr-only">{item.title}</span></summary>
  <form className="file-rename" onSubmit={rename}>
   <label className="field-label" htmlFor={label}>Nombre visible</label>
   <input className="field" id={label} name="title" defaultValue={item.title} maxLength={200} required disabled={unavailable}/>
   <button className="btn btn-ghost" disabled={unavailable}>Guardar nombre</button>
  </form>
  {mutation.message && <p role={mutation.confirmed?"status":"alert"}>{mutation.message}</p>}
  <details className="academic-disclosure file-replace">
   <summary>Reemplazar archivo</summary>
   <p className="hint">El recurso conserva su posición y estado de publicación.</p>
   <FileUploadForm session={session} slug={slug} moduleId={item.moduleId} item={item} limits={limits} disabled={unavailable} reload={reload}/>
  </details>
  <button className="btn btn-danger" type="button" disabled={unavailable} onClick={()=>dialog.current?.showModal()}>Eliminar archivo</button>
  <dialog className="modal" ref={dialog} aria-labelledby={heading}>
   <div className="stack">
    <h2 className="serif" id={heading}>Eliminar archivo</h2>
    <p>Se retirará «{item.title}» del módulo.</p>
    <form method="dialog" className="actions">
     <button className="btn btn-ghost">Volver</button>
     <button className="btn btn-danger" type="button" onClick={()=>{dialog.current?.close();remove(item);}}>Eliminar archivo</button>
    </form>
   </div>
  </dialog>
 </details>;
}
