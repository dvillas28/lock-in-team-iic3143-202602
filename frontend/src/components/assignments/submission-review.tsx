"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useContentNotice } from "../content/content-notices.tsx";
import { ErrorState } from "../route-states.tsx";
import { SubmissionReviewSkeleton } from "./assignment-skeleton.tsx";
import { correctPublishedGrade } from "../../lib/api/gradebook.ts";
import { reviewSubmission, saveDraft, type RosterEntry, type Submission, type SubmissionGrade, type SubmissionScope } from "../../lib/api/submissions.ts";
import type { Correction } from "../../lib/gradebook/validation.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { AttemptEvidence } from "./submission-evidence.tsx";
import { ChileDate, points } from "./assignment-facts.tsx";
import { submissionError, uncertainResult } from "./submission-feedback.ts";

export function SubmissionReview({scope,student,maxPoints,disabled,onChanged,onDirty}:{
 scope:SubmissionScope;student:RosterEntry;maxPoints:number;disabled:boolean;onChanged:()=>Promise<unknown>;onDirty?:(dirty:boolean)=>void;
}) {
 const {session}=useSession();
 const resource=useResource(session,`${scope.assignmentId}:${student.sectionId}:${student.studentId}`,c=>reviewSubmission(c,scope,student));
 const [selected,setSelected]=useState(""), titleId=useId();
 const data=resource.data;
 if (!data) return resource.error ? <ErrorState headingLevel={3} feedback={resource.error} onRetry={()=>void resource.reload()}/> : <SubmissionReviewSkeleton name={student.name} sectionCode={student.sectionCode}/>;
 const attempt=data.attempts.find(a=>a.id===selected) ?? data.attempts.find(a=>a.id===data.grade?.attemptId) ?? data.attempts[0];
 const graded=data.attempts.find(a=>a.id===data.grade?.attemptId);
 return <section className="stack assignment-review" aria-labelledby={titleId}>
  <div><p className="section-label">Revisión · Sección {student.sectionCode}</p><h3 id={titleId}>{student.name}</h3></div>
  {resource.error && <ErrorState headingLevel={4} feedback={resource.error} onRetry={()=>void resource.reload()}/>}
  {attempt ? <>
   <label className="field-label"><span>Intento para revisar</span>
    <select className="field" value={attempt.id} onChange={event=>setSelected(event.target.value)} disabled={disabled || resource.refreshing}>
     {data.attempts.map(a=><option key={a.id} value={a.id}>Intento {a.attemptNumber}{a.isLate ? " · Atrasado" : ""}
      {a.id===graded?.id ? " · Asociado a la nota" : ""}</option>)}
    </select>
   </label>
   <p className="hint tnum">Entregado el <ChileDate value={attempt.submittedAt} empty=""/>.</p>
   <AttemptEvidence attempt={attempt} scope={scope}/>
   <GradeForm key={`${attempt.id}:${data.grade?.updatedAt}:${data.grade?.revisionId}`}
    scope={scope} attempt={attempt} grade={data.grade} maxPoints={maxPoints} gradedAttempt={graded?.attemptNumber}
    disabled={disabled || !!resource.error || !!resource.refreshing} onDirty={onDirty} onChanged={async()=>{
     await resource.reload();await onChanged();
    }}/>
  </> : <p className="hint">El estudiante todavía no tiene intentos en esta sección.</p>}
 </section>;
}

function GradeForm({scope,attempt,grade,maxPoints,gradedAttempt,disabled,onChanged,onDirty}:{
 scope:SubmissionScope;attempt:Submission;grade:SubmissionGrade|null;maxPoints:number;gradedAttempt?:number;
 disabled:boolean;onChanged:()=>Promise<unknown>;onDirty?:(dirty:boolean)=>void;
}) {
 const {session}=useSession(), notify=useContentNotice();
 const [score,setScore]=useState(grade ? String(grade.pointsEarned) : "");
 const [feedback,setFeedback]=useState(grade?.feedback??""), [reason,setReason]=useState("");
 const [error,setError]=useState(""), [busy,setBusy]=useState(false), [retry,setRetry]=useState<Correction>();
 const running=useRef(false);
 const published=!!grade?.publishedAt, moved=grade && grade.attemptId!==attempt.id;
 useEffect(()=>{
  onDirty?.(score!==String(grade?.pointsEarned??"") || feedback!==(grade?.feedback??"") || (!!published && !!reason.trim()));
 },[feedback,grade?.feedback,grade?.pointsEarned,onDirty,published,reason,score]);

 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (running.current) return;
  const value=score.trim().replace(",",".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value)>maxPoints) {
   setError(`Ingresa un puntaje entre 0 y ${points.format(maxPoints)}, con hasta dos decimales.`);
   return;
  }
  if (published && !reason.trim()) {setError("Indica el motivo de la corrección.");return;}
  running.current=true;
  const context=session.getSnapshot().context, current=()=>session.getSnapshot().context===context;
  const body={points:Number(value),feedback:feedback.trim()||null};
  const correction=published ? retry??{...body,reason:reason.trim(),attemptId:attempt.id,
   revisionId:crypto.randomUUID(),expectedRevisionId:grade?.revisionId??null} : undefined;
  setBusy(true);setError("");
  try {
   if (correction && grade) await session.request(c=>correctPublishedGrade(c,scope.slug,scope.courseId,grade.id,correction),current);
   else await session.request(c=>saveDraft(c,scope,attempt.id,{...body,expectedUpdatedAt:grade?.updatedAt??null}),current);
   if (!current()) return;
   onDirty?.(false);
   setRetry(undefined);
   await onChanged();
   if (current()) notify?.(published ? "Calificación corregida." : "Calificación guardada como borrador.");
  } catch (failure) {
   if (!current()) return;
   setError(submissionError(failure));
   if (uncertainResult(failure)) setRetry(correction);
   else if (failure instanceof ApiHttpError && failure.status===409) {
    setRetry(undefined);
   }
  } finally {running.current=false;if (current()) setBusy(false);}
 }

 return <form className="stack assignment-grading" onSubmit={submit}>
  <div><h3>{published ? "Corregir calificación publicada" : "Calificar intento"}</h3>
   {grade && <p className="hint tnum">{published ? "Publicada" : "Borrador actual"}{gradedAttempt && ` · Intento ${gradedAttempt}`}
    {" · "}{points.format(grade.pointsEarned)} / {points.format(maxPoints)} pts
    {published && grade.grade!==null && ` · Nota ${points.format(grade.grade)}`}</p>}
   {moved && <p className="notice">Al guardar, la calificación quedará asociada al intento {attempt.attemptNumber}.</p>}
  </div>
  <fieldset className="stack" disabled={disabled || busy || !!retry}>
   <label className="field-label">Puntaje sobre {points.format(maxPoints)}
    <input className="field submission-score" inputMode="decimal" required value={score} onChange={event=>setScore(event.target.value)}/>
   </label>
   <label className="field-label"><span>Retroalimentación</span>
    <textarea className="field" rows={3} maxLength={4000} value={feedback} onChange={event=>setFeedback(event.target.value)}/>
   </label>
   {published && <label className="field-label"><span>Motivo de la corrección</span>
    <textarea className="field" rows={2} maxLength={500} required value={reason} onChange={event=>setReason(event.target.value)}/>
   </label>}
  </fieldset>
  {maxPoints===0 && <p className="hint">Esta tarea admite un puntaje de 0 y queda fuera del promedio.</p>}
  {error && <p className="assignment-field-error" role="alert">{error}</p>}
  <div className="actions">
   <button type="submit" className="btn btn-primary" disabled={disabled || busy}>
    {busy ? "Guardando…" : retry ? "Reintentar corrección" : published ? "Publicar corrección" : "Guardar borrador"}
   </button>
   {error && <button type="button" className="btn btn-ghost" disabled={busy} onClick={()=>void onChanged()}>Actualizar calificación</button>}
  </div>
 </form>;
}
