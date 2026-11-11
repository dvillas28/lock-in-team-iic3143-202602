"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowDown, Save, Send } from "lucide-react";
import { QuizWorkspace } from "../quizzes/quiz-workspace.tsx";
import { quizDate } from "../quizzes/quiz-facts.tsx";
import { QuizLeaveGuard } from "../quizzes/quiz-leave-guard.tsx";
import { AttemptReference, AttemptStatus } from "./attempt-facts.tsx";
import Link from "next/link";
import type {Session} from "../../lib/auth/session.ts";
import type {CurrentUser} from "../../lib/auth/validation.ts";
import type {Course} from "../../lib/courses/validation.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {receiptFromAttempt,sameAnswers,type Attempt} from "../../lib/attempts/validation.ts";
import {attemptProgress,optionLabel,quizClosed} from "../../lib/attempts/progress.ts";
import {attemptCapabilities} from "../../lib/attempts/capabilities.ts";
import {getAttempt,getAttemptQuestions} from "../../lib/api/attempts.ts";
import {getQuiz} from "../../lib/api/quizzes.ts";
import {getCourse} from "../../lib/api/courses.ts";
import {ApiHttpError} from "../../lib/api/errors.ts";
import {useSession} from "../auth/session-provider.tsx";
import {useResource} from "../courses/use-resource.ts";
import {ErrorState,LoadingState} from "../route-states.tsx";
import {useAttemptOperations} from "./use-attempt-operations.ts";
import {AttemptReceipt,AttemptSubmitDialog,AttemptSubmitRecovery} from "./attempt-submit.tsx";
import {AttemptCancelMenu,AttemptCancelStatus} from "./attempt-cancel.tsx";
export function AttemptDetail({attemptId}:{attemptId:string}){
 const {session,state}=useSession(),context=state.context,slug=context?.slug??"";
 const scope=`${state.generation}:${slug}:${attemptId}:${JSON.stringify(context?.user)}`;
 const result=useResource(session,scope,async c=>{
  const a=await getAttempt(c,slug,attemptId);
  let metadata;
  try{metadata=await getQuiz(c,slug,undefined,a.quizId,true);}
  catch(error){
   // Access failures still pass through Session, which clears and revalidates context.
   if(a.status!=="inProgress" && !(error instanceof ApiHttpError && [401,403,404].includes(error.status)))return {attempt:a};
   throw error;
  }
  const quiz:SafeQuiz={...metadata,questions:[]};
  const course=await getCourse(c,slug,quiz.courseId);
  if(!context?.user)throw new ApiHttpError(403);
  const cap=attemptCapabilities(context.user,course,quiz,a);
  const current=cap.student?await getAttempt(c,slug,attemptId,{studentId:context.user.id,quizId:a.quizId,sectionId:a.sectionId}):a;
  const detail=attemptCapabilities(context.user,course,quiz,current).edit?await getAttemptQuestions(c,slug,current,course.id):quiz;
  return {attempt:current,quiz:detail,course};
 });
 if(!context?.user)return <LoadingState/>;
 if(result.error)return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
 if(!result.data)return <LoadingState/>;
 if(!result.data.quiz||!result.data.course){
  const a=result.data.attempt,receipt=receiptFromAttempt(a);
  const terminalAt=receipt?.submittedAt??a.cancelledAt;
  return <section className="card panel stack attempt-workspace"><div className="quiz-section-heading"><h1 className="serif">Intento conocido</h1><AttemptStatus status={a.status}/></div><p className="tnum">{terminalAt?quizDate(terminalAt):"Sin fecha terminal registrada"}</p><p className="hint">Resumen autorizado. No se pudo cargar el contexto del quiz.</p><AttemptReference attempt={a}/></section>;
 }
 return <AttemptWork key={scope} session={session} slug={slug} user={context.user} {...result.data}/>;
}
const leaveCopy = {
 title: "¿Salir del intento?",
 body: "Tienes respuestas que aún no se han guardado. Si sales ahora, se perderán.",
 stay: "Seguir respondiendo",
 leave: "Salir sin guardar",
};
function AttemptWork({session,slug,user,course,quiz,attempt}:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;attempt:Attempt}){
 const {ops,state}=useAttemptOperations(session,slug,user,course,quiz,attempt),a=state.attempt??attempt,cap=attemptCapabilities(user,course,quiz,a);
 const [now,setNow]=useState(Date.now),[confirming,setConfirming]=useState(false);
 const formId=useId(),receiptRef=useRef<HTMLDivElement>(null),submitted=useRef(false);
 // One timer at the closing time: no polling, and the server still enforces the window.
 useEffect(()=>{
  if(!quiz.closesAt)return;
  const remaining=Date.parse(quiz.closesAt)-Date.now();
  if(remaining<=0)return;
  const timer=window.setTimeout(()=>setNow(Date.now()),Math.min(remaining+250,2147483647));
  return ()=>window.clearTimeout(timer);
 },[quiz.closesAt]);
 const closed=quizClosed(quiz.closesAt,now);
 const editing=cap.edit&&!state.cancelConfirmed&&!state.receipt;
 const dirty=!sameAnswers(state.draft,state.confirmed);
 const locked=state.busy||!!state.pending||!!state.cancelConfirmed||!cap.edit||closed;
 const progress=attemptProgress(quiz,state.draft);
 const quizHref=`/courses/${course.id}/quizzes/${quiz.id}`;
 const closeConfirm=useCallback(()=>setConfirming(false),[]);
 useEffect(()=>{ if(state.receipt&&submitted.current)receiptRef.current?.querySelector<HTMLElement>(".attempt-receipt")?.focus(); },[state.receipt]);
 const saveStatus=state.busy&&state.phase==="saving"?"Guardando…":state.pending==="save"?"Guardado sin confirmar":dirty?"Cambios sin guardar":state.confirmed.length?"Respuestas guardadas":"";
 function focusQuestion(id:string){
  const question=document.getElementById(`question-${id}`);
  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  question?.scrollIntoView?.({block:"center",behavior:reduce?"auto":"smooth"});
  question?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({preventScroll:true});
 }
 function review(id:string){setConfirming(false);requestAnimationFrame(()=>focusQuestion(id));}
 function choose(questionId:string,alternativeId?:string){
  ops.setDraft([...state.draft.filter(answer=>answer.questionId!==questionId),...(alternativeId?[{questionId,alternativeId}]:[])]);
 }
 const nextPending=progress.pending[0];
 return <QuizWorkspace course={course} user={user} title={quiz.title}>
 <div className="stack attempt-workspace">
 <Link className="text-link attempt-back" href={quizHref}><ArrowLeft size={16} aria-hidden="true"/>Volver al quiz</Link>
 <QuizLeaveGuard active={(editing&&!closed&&dirty)||state.busy||!!state.pending} copy={leaveCopy}/>
 <section className="card panel attempt-header" aria-label="Resumen del intento">
  <div className="attempt-header-top">
   <div className="attempt-header-title"><h2 className="serif">Intento {a.attemptNumber}</h2>{cap.student&&quiz.maxAttempts?<span className="hint tnum">de {quiz.maxAttempts} permitidos</span>:null}</div>
   <div className="attempt-header-meta"><AttemptStatus status={state.cancelConfirmed?"cancelled":a.status} student={cap.student}/><AttemptCancelMenu ops={ops} state={state} allowed={cap.cancel&&!state.receipt}/></div>
  </div>
  {editing&&<p className="hint tnum">{quiz.closesAt?`${closed?"Cerró":"Cierra"} el ${quizDate(quiz.closesAt)}`:"Sin fecha de cierre"} · {quiz.questions.length} {quiz.questions.length===1?"pregunta":"preguntas"}</p>}
  {editing&&quiz.instructions?.trim()&&<p className="quiz-instructions">{quiz.instructions}</p>}
  {!cap.student&&<AttemptReference attempt={a}/>}
 </section>
 {editing&&closed&&<p className="notice warning" role="alert">El plazo terminó. Ya no puedes guardar ni enviar respuestas.</p>}
 {editing&&state.phase==="error"&&!state.pending&&state.message&&<p className="notice warning" role="alert">{state.message}</p>}
 {state.pending==="save"&&<section className="notice warning stack attempt-recovery" role="alert"><strong>No pudimos confirmar el guardado</strong><p>Tus selecciones siguen en pantalla, pero no podrás modificarlas ni enviar hasta confirmar el estado. Mantén esta página abierta; si el problema continúa, recárgala para ver las respuestas guardadas.</p><div className="actions"><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Comprobar estado</button></div>{state.message&&<p className="hint" role="status">{state.message}</p>}</section>}
 <AttemptSubmitRecovery ops={ops} state={state}/>
 {!state.receipt&&<AttemptCancelStatus ops={ops} state={state}/>}
 <div ref={receiptRef}><AttemptReceipt state={state} attemptNumber={a.attemptNumber} quizHref={quizHref} gradesHref={cap.student?`/courses/${course.id}/grades`:undefined}/></div>
 {editing&&<>
  <div className="card attempt-progress" role="region" aria-label="Avance del intento">
   <div className="attempt-progress-copy"><p className="tnum"><strong>{progress.answered}</strong> de {progress.total} respondidas{progress.pending.length?<span className="hint"> · {progress.pending.length} sin responder</span>:null}</p>
    {nextPending&&<button type="button" className="btn btn-ghost attempt-next" onClick={()=>focusQuestion(nextPending.id)}><ArrowDown size={15} aria-hidden="true"/>Siguiente sin responder</button>}</div>
   <progress aria-label="Preguntas respondidas" value={progress.answered} max={Math.max(1,progress.total)}/>
   <nav className="attempt-question-nav" aria-label="Ir a una pregunta">{quiz.questions.map((q,i)=>{const selected=state.draft.some(answer=>answer.questionId===q.id);return <button type="button" key={q.id} className={`attempt-question-link tnum${selected?" answered":""}`} aria-label={`Pregunta ${i+1}: ${selected?"respondida":"sin responder"}`} onClick={()=>focusQuestion(q.id)}>{i+1}</button>;})}</nav>
  </div>
  <form id={formId} className="stack attempt-form" aria-label="Respuestas del intento" aria-busy={state.busy} onSubmit={e=>{e.preventDefault();if(dirty)void ops.save(!state.draft.length);}}>
   {quiz.questions.map((q,i)=>{const selected=state.draft.find(answer=>answer.questionId===q.id);return <fieldset className={`card attempt-question${selected?" is-answered":""}`} id={`question-${q.id}`} key={q.id} disabled={locked}>
    <legend><span className="attempt-question-number tnum">Pregunta {i+1} de {quiz.questions.length}</span><span className="attempt-question-prompt">{q.prompt}</span></legend>
    <div className="attempt-options">{q.alternatives.map((o,j)=><label className="option attempt-option" key={o.id}>
     <input type="radio" name={q.id} value={o.id} checked={selected?.alternativeId===o.id} onChange={()=>choose(q.id,o.id)}/>
     <span className="attempt-option-letter" aria-hidden="true">{optionLabel(j)}</span><span className="attempt-option-text">{o.text}</span>
    </label>)}</div>
    {selected&&!locked&&<button type="button" className="text-link attempt-clear" onClick={()=>choose(q.id)}>Quitar respuesta</button>}
   </fieldset>;})}
  </form>
  <div className="card attempt-actions-bar">
   <span className="hint" role="status" aria-live="polite">{saveStatus}</span>
   <div className="actions">
    <button className="btn btn-ghost" type="submit" form={formId} disabled={locked||!dirty}><Save size={16} aria-hidden="true"/>{state.busy&&state.phase==="saving"?"Guardando…":"Guardar"}</button>
    <button className="btn btn-primary" type="button" disabled={locked} onClick={()=>{submitted.current=true;setConfirming(true);}}><Send size={16} aria-hidden="true"/>Enviar intento</button>
   </div>
  </div>
  <AttemptSubmitDialog open={confirming} ops={ops} state={state} progress={progress} onClose={closeConfirm} onReview={review}/>
 </>}
 </div>
 </QuizWorkspace>;
}
