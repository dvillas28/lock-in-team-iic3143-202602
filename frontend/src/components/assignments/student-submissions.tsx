"use client";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { FileUp, X } from "lucide-react";
import type { Assignment } from "../../lib/api/assignments.ts";
import { uploadTransport } from "../../lib/api/academic-files.ts";
import { mySubmissions, submissionForm, submitAttempt, type SubmissionGrade, type SubmissionRequest, type SubmissionScope } from "../../lib/api/submissions.ts";
import { assignmentState } from "../../lib/assignments/dates.ts";
import type { Section } from "../../lib/courses/validation.ts";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useContentNotice } from "../content/content-notices.tsx";
import { ErrorState } from "../route-states.tsx";
import { StudentSubmissionsSkeleton } from "./assignment-skeleton.tsx";
import { AttemptHistory } from "./submission-evidence.tsx";
import { ChileDate, points } from "./assignment-facts.tsx";
import { submissionError, uncertainResult } from "./submission-feedback.ts";
import { WrittenEditor } from "./written-editor.tsx";

const fileLimit=5, fileBytes=10*1024*1024;

export function StudentSubmissions({item,scope,sections,now}:{item:Assignment;scope:SubmissionScope;sections:Section[];now:number}) {
 const {session}=useSession(), notify=useContentNotice();
 const resource=useResource(session,`${scope.assignmentId}:my-submissions`,c=>mySubmissions(c,scope));
 const hasData=!!resource.data;
 const [response,setResponse]=useState(""), [files,setFiles]=useState<File[]>([]), [chosen,setChosen]=useState("");
 const [error,setError]=useState(""), [fileError,setFileError]=useState(""), [progress,setProgress]=useState<number>();
 const [dragging,setDragging]=useState(false);
 const [pending,setPending]=useState<SubmissionRequest>();
 const dialog=useRef<HTMLDialogElement>(null), historyDialog=useRef<HTMLDialogElement>(null),
  historyTrigger=useRef<HTMLButtonElement>(null), running=useRef(false), fileId=useId(), titleId=useId();
 useEffect(()=>{
  const modal=historyDialog.current;
  if (!modal) return;
  const unlock=()=>{document.body.style.overflow="";};
  modal.addEventListener("close",unlock);
  return ()=>{modal.removeEventListener("close",unlock);unlock();};
 },[hasData]);
 const data=resource.data;
 if (!data) return resource.error ? <ErrorState headingLevel={2} feedback={resource.error} onRetry={()=>void resource.reload()}/> : <StudentSubmissionsSkeleton/>;
 const sectionId=data.sections.includes(chosen) ? chosen : data.sections[0];
 const status=assignmentState(item,now+data.clockOffset);
 const left=item.maxAttempts===null ? null : Math.max(0,item.maxAttempts-data.usedAttempts);
 const acceptsFiles=item.allowedExtensions.length>0 || !item.allowWrittenResponse;
 const blocked=!!resource.error || !!resource.refreshing || progress!==undefined;
 const canSubmit=sectionId && status!=="upcoming" && status!=="closed" && left!==0;
 const suffixes=item.allowedExtensions.map(value=>`.${value.replace(/^\./,"").toLowerCase()}`);
 const content=files.length>0 || response.trim().length>0;
 const latest=data.attempts[0];
 const state=data.grade ? "Calificada" : latest ? (latest.isLate ? "Entregada con atraso" : "Entregada") : "Pendiente";
 function openHistory() {
  historyTrigger.current?.focus();
  document.body.style.overflow="hidden";
  historyDialog.current?.showModal();
 }

 function addFiles(next: File[]) {
  setFileError("");
  if (next.some(file=>file.size===0 || file.size>fileBytes)) {
   setFileError("Cada archivo debe contener datos y pesar hasta 10 MiB.");
   return;
  }
  if (suffixes.length && next.some(file=>!suffixes.some(ext=>file.name.toLowerCase().endsWith(ext)))) {
   setFileError("Selecciona archivos de los formatos permitidos.");
   return;
  }
  const combined=[...files];
  for (const file of next) {
   if (!combined.some(old=>old.name===file.name && old.size===file.size && old.lastModified===file.lastModified)) combined.push(file);
  }
  if (combined.length>fileLimit) {
   setFileError("Puedes adjuntar hasta cinco archivos.");
   return;
  }
  setFiles(combined);
 }

 function drop(event: DragEvent<HTMLElement>) {
  event.preventDefault();
  setDragging(false);
  if (!blocked && !pending) addFiles(Array.from(event.dataTransfer.files));
 }

 async function submit(request: SubmissionRequest) {
  if (running.current) return;
  running.current=true;
  dialog.current?.close();
  const context=session.getSnapshot().context, current=()=>context===session.getSnapshot().context;
  const form=submissionForm(request);
  setError("");
  setPending(request);
  setProgress(0);
  try {
   const saved=await session.request(c=>submitAttempt(c,scope,request,form),current,uploadTransport(form,setProgress));
   if (!current()) return;
   setPending(undefined);
   setFiles([]);
   setFileError("");
   setResponse("");
   notify?.(`Intento ${saved.attemptNumber} entregado${saved.isLate ? " con atraso" : ""}.`);
   await resource.reload();
  } catch (failure) {
   if (!current()) return;
   setError(submissionError(failure));
   if (!uncertainResult(failure)) {
    setPending(undefined);
    await resource.reload();
   }
  } finally {
   running.current=false;
   if (current()) setProgress(undefined);
  }
 }

 return <section className="card panel stack assignment-submission" aria-labelledby={titleId}>
  <header className="submission-heading">
   <div><h2 id={titleId}>Tu entrega</h2><p className="hint tnum">{data.usedAttempts} {data.usedAttempts===1 ? "intento utilizado" : "intentos utilizados"}
    {" · "}{left===null ? "Intentos ilimitados" : `${left} disponibles`}</p></div>
   <div className="submission-heading-actions">
    <span className={latest?.isLate && !data.grade ? "chip chip-warning" : latest ? "chip chip-success" : "chip"}>{state}</span>
    {data.attempts.length>0 && <button ref={historyTrigger} type="button" className="btn btn-ghost submission-history-trigger"
     onClick={openHistory}>Ver historial de intentos</button>}
   </div>
  </header>
  {data.grade && <PublishedResult grade={data.grade} attempt={data.attempts.find(a=>a.id===data.grade?.attemptId)?.attemptNumber} max={item.maxPoints}/>}
  {resource.error && <ErrorState headingLevel={3} feedback={resource.error} onRetry={()=>void resource.reload()}/>}
  {status==="upcoming" && <p className="notice">Puedes entregar desde <ChileDate value={item.availableFrom} empty=""/>.</p>}
  {status==="closed" && <p className="notice">La recepción de entregas está cerrada.</p>}
  {status==="late" && left!==0 && <p className="notice">El plazo de entrega venció. Los nuevos intentos quedarán marcados como atrasados.</p>}
  {left===0 && <p className="hint">Ya utilizaste todos los intentos.</p>}
  {(canSubmit || pending) && <div className="stack assignment-delivery">
   <fieldset className="stack" disabled={blocked || !!pending}>
    {data.sections.length>1 && <label className="field-label"><span>Sección para este intento</span>
     <select className="field" value={sectionId} onChange={event=>setChosen(event.target.value)}>
      {data.sections.map(id=><option key={id} value={id}>Sección {sections.find(section=>section.id===id)?.code??id}</option>)}
     </select>
    </label>}
    {item.allowWrittenResponse && <WrittenEditor value={response} onChange={setResponse}/>}
    {acceptsFiles && <div className="stack submission-files-field">
     <div className={`submission-drop${dragging ? " is-dragging" : ""}`} onDragEnter={event=>{event.preventDefault();setDragging(true);}}
      onDragOver={event=>event.preventDefault()} onDragLeave={event=>{if (event.currentTarget===event.target) setDragging(false);}} onDrop={drop}>
      <div className="submission-drop-heading"><FileUp size={18} aria-hidden="true"/><strong>Adjuntar archivos</strong></div>
      <label htmlFor={fileId} className="btn btn-ghost">Seleccionar archivos</label>
      <input id={fileId} className="submission-file-input" type="file" multiple accept={suffixes.join(",") || undefined}
       aria-describedby={`${fileId}-hint`} onChange={event=>{addFiles(Array.from(event.target.files??[]));event.target.value="";}}/>
      <p id={`${fileId}-hint`} className="hint">Arrastra archivos aquí · Máximo 5 archivos · 10 MiB por archivo</p>
     </div>
     {fileError && <p role="alert" className="assignment-field-error">{fileError}</p>}
     {!!files.length && <ul className="submission-files">{files.map((file,index)=><li key={`${file.name}-${index}`} className="submission-file">
      <span>{file.name}<small className="hint">{points.format(file.size/1024)} KB</small></span>
      <button type="button" className="btn btn-ghost" aria-label={`Quitar ${file.name}`}
       onClick={()=>{setFiles(files.filter((_,i)=>i!==index));setFileError("");}}><X size={16} aria-hidden="true"/></button>
     </li>)}</ul>}
    </div>}
   </fieldset>
   {progress!==undefined && <div className="stack">
    <label htmlFor={`${titleId}-progress`} role="status">{progress<100 ? `Enviando entrega · ${progress} %` : "Verificando y registrando la entrega…"}</label>
    <progress id={`${titleId}-progress`} max={100} value={progress}/>
   </div>}
   {error && <p role="alert" className="assignment-field-error">{error}</p>}
   <div className="actions">
    {pending ? <>
     <button className="btn btn-primary" type="button" disabled={blocked} onClick={()=>void submit(pending)}>Reintentar el mismo envío</button>
     <button className="btn btn-ghost" type="button" disabled={blocked} onClick={async()=>{
      if (await resource.reload()) {setPending(undefined);setError("");}
     }}>Consultar historial</button>
    </> : <button className="btn btn-primary" type="button" disabled={!content || blocked}
     onClick={()=>dialog.current?.showModal()}>Entregar tarea</button>}
   </div>
  </div>}
  {!(canSubmit || pending) && error && <p role="alert" className="assignment-field-error">{error}</p>}
  <dialog ref={historyDialog} className="native-dialog submission-history-dialog" closedby="any"
   aria-labelledby={`${titleId}-history`} onClose={()=>historyTrigger.current?.focus()}>
   <div className="submission-history-content">
    <header className="submission-review-dialog-heading">
     <h2 id={`${titleId}-history`}>Historial de intentos</h2>
     <button type="button" className="btn btn-ghost" onClick={()=>historyDialog.current?.close()}>Cerrar</button>
    </header>
    <AttemptHistory attempts={data.attempts} scope={scope}/>
   </div>
  </dialog>
  <dialog ref={dialog} className="native-dialog" aria-labelledby={`${titleId}-confirm`}>
   <div className="stack">
    <h2 id={`${titleId}-confirm`}>Confirmar intento {data.usedAttempts+1}</h2>
    <p>La entrega quedará registrada en el historial y no podrás editarla.</p>
    {status==="late" && <p className="notice">Este intento se registrará con atraso.</p>}
    <div className="actions">
     <button type="button" className="btn btn-ghost" onClick={()=>dialog.current?.close()}>Volver a editar</button>
     <button type="button" className="btn btn-primary" disabled={!canSubmit || blocked} onClick={()=>void submit({
      key:crypto.randomUUID(),sectionId,expectedAttempts:data.usedAttempts,files,writtenResponse:response,
     })}>Confirmar entrega</button>
    </div>
   </div>
  </dialog>
 </section>;
}

function PublishedResult({grade,max,attempt}:{grade:SubmissionGrade;max:number;attempt?:number}) {
 return <div className="stack assignment-published-result">
  <div className="submission-heading"><h3>{grade.revisedAt ? "Calificación corregida" : "Calificación publicada"}</h3>
   <strong className="grade-value tnum">{grade.grade===null ? "Sin nota numérica" : points.format(grade.grade)}</strong>
  </div>
  <p className="hint tnum">{points.format(grade.pointsEarned)} / {points.format(max)} pts{attempt && ` · Intento ${attempt}`}
   {" · "}<ChileDate value={grade.revisedAt??grade.publishedAt} empty=""/></p>
  {grade.feedback && <p className="submission-feedback">{grade.feedback}</p>}
 </div>;
}
