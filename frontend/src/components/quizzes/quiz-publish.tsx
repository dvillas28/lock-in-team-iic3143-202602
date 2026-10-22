"use client";
import { useEffect, useId, useRef } from "react";
import type { Authoring } from "../../lib/quizzes/validation.ts";
import type { Session } from "../../lib/auth/session.ts";
import { ApiResponseError } from "../../lib/api/errors.ts";
import { FieldError } from "../../lib/courses/validation.ts";
import { questionsInput } from "../../lib/quizzes/validation.ts";
import { getQuizAuthoringView, publishQuiz, listCourseGradeItems } from "../../lib/api/quizzes.ts";
import { useMutation } from "../courses/use-mutation.ts";
import { useResource } from "../courses/use-resource.ts";
export function QuizPublish({session,slug,quiz,destination,disabled,onSaved,onLock}: {session:Session;slug:string;quiz:Authoring;destination:string;disabled:boolean;onSaved:(q:Authoring)=>void;onLock:(locked:boolean)=>void}) {
  const mutation=useMutation(session), dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null),trigger=useRef<HTMLButtonElement>(null),feedback=useRef<HTMLParagraphElement>(null), titleId=useId();
  useEffect(()=>{onLock(mutation.busy || !!mutation.uncertain);},[mutation.busy,mutation.uncertain,onLock]);
  useEffect(()=>{if(mutation.message)feedback.current?.focus();},[mutation.message]);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
  async function consult() {
    const snapshot=session.getSnapshot();
    const current=()=>alive.current && snapshot.context===session.getSnapshot().context && snapshot.generation===session.getSnapshot().generation;
    try {await reconcile(current);} catch { /* Keep uncertainty until a confirmed read. */ }
  }
  function close(){dialog.current?.close();trigger.current?.focus();}
  async function reconcile(current:()=>boolean) {
    const next=await session.request(c=>getQuizAuthoringView(c,slug,quiz.courseId,quiz.id),current);
    if(current() && next.status === "published")onSaved(next);
    return next.status === "published" ? "Publicación confirmada por consulta." : "El estado recibido continúa en borrador. Puede existir conflicto o curso congelado; no se asume una causa única.";
  }
  async function confirm() {
    if(disabled || mutation.busy || mutation.uncertain)return;
    close();
    await mutation.run(async current=>{
      if(!quiz.questions.length)throw new FieldError("questions","Agrega y guarda al menos una pregunta antes de publicar.");
      questionsInput(quiz.questions,quiz);
      const saved=await session.request(c=>publishQuiz(c,slug,quiz.courseId,quiz.id),current);
      if(current())onSaved(saved);
      return "Publicación confirmada.";
    },reconcile);
  }
  if(quiz.status === "published")return <PublishedItem session={session} slug={slug} quiz={quiz}/>;
  return <section className="panel stack"><h2 className="serif">Publicación</h2>
    <p>Publicar usa únicamente los datos guardados. Un curso congelado por publicación de notas puede rechazar nuevos quizzes; guardar borradores sigue permitido.</p>
    {disabled && <p>Guarda los cambios y resuelve cualquier operación pendiente antes de publicar.</p>}
    <button ref={trigger} type="button" className="btn btn-ghost" disabled={disabled || mutation.busy || mutation.uncertain} onClick={()=>{dialog.current?.showModal();cancel.current?.focus();}}>Publicar quiz</button>
    <p role="status" ref={feedback} tabIndex={-1}>{mutation.message}{mutation.message?.startsWith("Conflicto") && " El curso podría estar congelado o el quiz haber cambiado. No se confirmó publicación; guardar borradores sigue permitido."}</p>
    {mutation.uncertain && <button type="button" className="btn btn-ghost" onClick={()=>void consult()}>Consultar estado de publicación</button>}
    <dialog ref={dialog} className="modal native-dialog panel" aria-labelledby={titleId} onKeyDown={event=>{
      if(event.key!=="Tab")return;
      const first=cancel.current,last=event.currentTarget.querySelector<HTMLButtonElement>("button:last-child");
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }} onCancel={event=>{event.preventDefault();close();}}>
      <h2 id={titleId}>Confirmar publicación</h2><div className="stack">
        <p>{quiz.title} · {destination}</p><p>Apertura: {quiz.opensAt ?? "Sin límite"} · Cierre: {quiz.closesAt ?? "Sin límite"} · Intentos: {quiz.maxAttempts ?? "Ilimitados"}</p>
        <p>El quiz publicado queda inmutable. El backend crea un elemento de nota con peso inicial cero; aquí se consultará su peso actual. El acceso a pauta impide rendir, incluso con rol student.</p>
        <div className="actions"><button ref={cancel} type="button" className="btn btn-ghost" onClick={close}>Volver</button><button type="button" className="btn btn-primary" onClick={()=>void confirm()}>Confirmar publicación</button></div>
      </div>
    </dialog>
  </section>;
}
function PublishedItem({session,slug,quiz}:{session:Session;slug:string;quiz:Authoring}) {
  const result=useResource(session,`${session.getSnapshot().generation}:${slug}:${quiz.courseId}:${quiz.id}:${quiz.publishedAt}:grade-item`,async c=>{
    const items=await listCourseGradeItems(c,slug,quiz.courseId),item=items.find(i=>i.quizId===quiz.id);
    if(!item)throw new ApiResponseError();return item;
  });
  return <section className="panel stack"><h2 className="serif">Publicado</h2><p className="tnum">Publicación confirmada: {quiz.publishedAt}</p>
    {result.data ? <p className="tnum">Elemento de nota: {result.data.title} · {result.data.id} · Peso actual: {result.data.weightPercent} %</p>:<p role="status">Publicado. Lectura del elemento de nota pendiente.</p>}
    {result.error && <button type="button" className="btn btn-ghost" onClick={()=>void result.reload()}>Reintentar lectura del ítem</button>}
  </section>;
}
