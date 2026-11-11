"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useContentNotice } from "../content/content-notices.tsx";
import { ErrorState } from "../route-states.tsx";
import { TeacherSubmissionsSkeleton } from "./assignment-skeleton.tsx";
import { publishAssignmentGrades, submissionRoster, type AssignmentPublication, type RosterEntry, type SubmissionScope } from "../../lib/api/submissions.ts";
import { SubmissionReview } from "./submission-review.tsx";
import { submissionError, uncertainResult } from "./submission-feedback.ts";

type Publication = {body:AssignmentPublication;key:string};
const studentKey=(student:RosterEntry)=>`${student.sectionId}/${student.studentId}`;

export function TeacherSubmissions({scope,maxPoints}:{scope:SubmissionScope;maxPoints:number}) {
 const {session}=useSession(), notify=useContentNotice();
 const resource=useResource(session,`${scope.assignmentId}:roster`,c=>submissionRoster(c,scope));
 const hasRoster=!!resource.data;
 const [section,setSection]=useState(""), [student,setStudent]=useState(""), [revision,setRevision]=useState(0);
 const [selected,setSelected]=useState<string[]>([]);
 const [pending,setPending]=useState<Publication>(), [busy,setBusy]=useState(false), [error,setError]=useState("");
 const running=useRef(false), reviewDirty=useRef(false), dialog=useRef<HTMLDialogElement>(null), reviewDialog=useRef<HTMLDialogElement>(null),
  studentTrigger=useRef<HTMLButtonElement>(null), titleId=useId();
 useEffect(()=>{
  const modal=reviewDialog.current;
  if (!modal) return;
  const unlock=()=>{document.body.style.overflow="";};
  modal.addEventListener("close",unlock);
  return ()=>{modal.removeEventListener("close",unlock);unlock();};
 },[hasRoster]);
 const roster=resource.data;
 if (!roster) return resource.error ? <ErrorState feedback={resource.error} onRetry={()=>void resource.reload()}/> : <TeacherSubmissionsSkeleton/>;
 const sections=new Map(roster.students.map(entry=>[entry.sectionId,entry.sectionCode]));
 const students=roster.students.filter(entry=>!section || entry.sectionId===section);
 const entry=students.find(entry=>studentKey(entry)===student);
 const grades=students.flatMap(entry=>entry.draft && selected.includes(entry.draft.id) ? [entry.draft] : []);
 const blocked=!!resource.refreshing || !!resource.error || busy;
 const gradeItemId=roster.gradeItemId;
 function closeReview() {
  if (reviewDirty.current && !window.confirm("Hay cambios de calificación sin guardar. ¿Deseas descartarlos?")) return;
  reviewDirty.current=false;
  reviewDialog.current?.close();
 }

 async function publish(operation: Publication) {
  if (running.current) return;
  running.current=true;
  dialog.current?.close();
  const context=session.getSnapshot().context, current=()=>session.getSnapshot().context===context;
  setBusy(true);
  setError("");
  setPending(operation);
  try {
   const receipt=await session.request(c=>publishAssignmentGrades(c,scope,operation.body,operation.key),current);
   if (!current()) return;
   setPending(undefined);
   setSelected([]);
   setRevision(value=>value+1);
   await resource.reload();
   if (current()) notify?.(receipt.publishedCount===1 ? "Nota publicada." : `${receipt.publishedCount} notas publicadas.`);
  } catch (failure) {
   if (!current()) return;
   setError(submissionError(failure));
   if (!uncertainResult(failure)) {
    setPending(undefined);
    setSelected([]);
    setRevision(value=>value+1);
    await resource.reload();
   }
  } finally {
   running.current=false;
   if (current()) setBusy(false);
  }
 }

 return <section className="card panel stack assignment-submission teacher-submissions" aria-labelledby={titleId}>
  <header className="submission-heading">
   <div><h2 id={titleId}>Entregas y calificaciones</h2><p className="hint">{students.length} {students.length===1 ? "estudiante" : "estudiantes"} en la vista</p></div>
   {sections.size>1 && <label className="field-label"><span>Sección</span>
    <select className="field" value={section} disabled={blocked || !!pending} onChange={event=>{
     setSection(event.target.value);setStudent("");setSelected([]);
    }}>
     <option value="">Todas las autorizadas</option>
     {[...sections].map(([id,code])=><option key={id} value={id}>Sección {code}</option>)}
    </select>
   </label>}
  </header>
  {resource.error && <ErrorState feedback={resource.error} onRetry={()=>void resource.reload()}/>}
  {!students.length ? <p className="hint">No hay estudiantes ni entregas en las secciones autorizadas.</p> : <>
   <div className="submission-master-detail">
    <div className="table-scroll" role="region" aria-label="Estados de entrega por estudiante">
     <table className="data-table">
      <caption>Selecciona los borradores que quieras publicar.</caption>
      <thead><tr><th scope="col">Publicar</th><th scope="col">Estudiante</th><th scope="col">Entrega</th><th scope="col">Nota</th></tr></thead>
      <tbody>{students.map(row=>{
       const draft=row.draft;
       return <tr key={studentKey(row)}>
        <td>{draft ? <input type="checkbox" className="submission-checkbox" aria-label={`Publicar nota de ${row.name}, sección ${row.sectionCode}`}
         disabled={blocked || !!pending} checked={selected.includes(draft.id)}
         onChange={event=>setSelected(event.target.checked ? [...selected,draft.id] : selected.filter(id=>id!==draft.id))}/> : <span aria-hidden="true">—</span>}</td>
        <th scope="row"><button type="button" className="btn btn-ghost submission-student" disabled={busy}
          aria-pressed={studentKey(row)===student} aria-controls={`${titleId}-review`} onClick={event=>{
           studentTrigger.current=event.currentTarget;
           setStudent(studentKey(row));
           requestAnimationFrame(()=>{
            document.body.style.overflow="hidden";
            reviewDialog.current?.showModal();
           });
          }}>
         <span>{row.name}<small className="hint">Sección {row.sectionCode}</small></span>
        </button></th>
        <td>{row.latestAttempt===null ? <span className="hint">Pendiente</span> : <span className={row.isLate ? "chip chip-warning" : "chip chip-success"}>
         {row.isLate ? "Atrasada" : "Entregada"} · {row.latestAttempt}</span>}</td>
        <td>{row.gradeStatus==="draft" ? "Borrador" : row.gradeStatus==="published" ? "Publicada" : "Pendiente"}</td>
       </tr>;
      })}</tbody>
     </table>
    </div>
   </div>
   {error && <p className="assignment-field-error" role="alert">{error}</p>}
   <div className="actions">
    {pending ? <>
     <button type="button" className="btn btn-primary" disabled={blocked} onClick={()=>void publish(pending)}>Reintentar publicación</button>
     <button type="button" className="btn btn-ghost" disabled={blocked} onClick={async()=>{
      if (await resource.reload()) {setPending(undefined);setSelected([]);setError("");setRevision(value=>value+1);}
     }}>Actualizar estados</button>
    </> : <button type="button" className="btn btn-primary" disabled={blocked || !grades.length || grades.length>100}
     onClick={()=>dialog.current?.showModal()}>Publicar selección{grades.length ? ` (${grades.length})` : ""}</button>}
    {busy && <p role="status">Publicando…</p>}
    {grades.length>100 && <p className="hint">Puedes publicar hasta 100 notas por selección.</p>}
   </div>
  </>}
  <dialog ref={reviewDialog} id={`${titleId}-review`} className="native-dialog submission-review-dialog" closedby="any"
   aria-labelledby={`${titleId}-review-title`}
   onCancel={event=>{if (reviewDirty.current && !window.confirm("Hay cambios de calificación sin guardar. ¿Deseas descartarlos?")) event.preventDefault(); else reviewDirty.current=false;}}
   onClose={()=>{studentTrigger.current?.focus();studentTrigger.current=null;}}>
   <div className="submission-review-dialog-content">
    <header className="submission-review-dialog-heading">
     <h2 id={`${titleId}-review-title`}>Revisión de entrega</h2>
     <button type="button" className="btn btn-ghost" onClick={closeReview}>Cerrar</button>
    </header>
    {entry && <SubmissionReview key={`${studentKey(entry)}:${revision}`} scope={scope} student={entry}
     maxPoints={maxPoints} disabled={blocked || !!pending} onDirty={dirty=>{reviewDirty.current=dirty;}}
     onChanged={async()=>{reviewDirty.current=false; await resource.reload();}}/>}
   </div>
  </dialog>
  <dialog ref={dialog} className="native-dialog" aria-labelledby={`${titleId}-publish`}>
   <div className="stack">
    <h2 id={`${titleId}-publish`}>Publicar {grades.length===1 ? "1 calificación" : `${grades.length} calificaciones`}</h2>
    <p>Las notas seleccionadas y su retroalimentación quedarán visibles para sus estudiantes.</p>
    <div className="actions">
     <button type="button" className="btn btn-ghost" onClick={()=>dialog.current?.close()}>Volver a la selección</button>
     <button type="button" className="btn btn-primary" disabled={blocked || !grades.length || grades.length>100}
      onClick={()=>void publish({body:{scope:"assignment",gradeItemId,grades},key:crypto.randomUUID()})}>Confirmar publicación</button>
    </div>
   </div>
  </dialog>
 </section>;
}
