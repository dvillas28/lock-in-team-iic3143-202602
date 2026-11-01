"use client";
import {useId,useRef,type ReactNode} from "react";
export function AttemptConfirmation({label,title,disabled,onConfirm,children,danger=false,primary=false}:{label:string;title:string;disabled:boolean;onConfirm:()=>void;children:ReactNode;danger?:boolean;primary?:boolean}) {
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),back=useRef<HTMLButtonElement>(null),titleId=useId();
 function close(){dialog.current?.close();trigger.current?.focus();}
 return <><button ref={trigger} type="button" className={`btn ${danger?"btn-danger":primary?"btn-primary":"btn-ghost"}`} disabled={disabled} onClick={()=>{dialog.current?.showModal();back.current?.focus();}}>{label}</button>
 <dialog ref={dialog} className="modal native-dialog panel" aria-labelledby={titleId} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{
  if(e.key!=="Tab")return;
  const first=back.current,last=e.currentTarget.querySelector<HTMLButtonElement>("button:last-child");
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }}><div className="stack"><h2 className="serif" id={titleId}>{title}</h2>{children}<div className="actions">
 <button ref={back} type="button" className="btn btn-ghost" onClick={close}>Volver</button><button type="button" className={`btn ${danger?"btn-danger":"btn-primary"}`} disabled={disabled} onClick={()=>{close();onConfirm();}}>{title}</button>
 </div></div></dialog></>;
}
