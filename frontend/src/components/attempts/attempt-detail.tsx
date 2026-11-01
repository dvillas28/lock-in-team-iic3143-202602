"use client";
import { useTransientFeedback } from "../use-feedback.ts";
import { ArrowLeft, Circle, CircleCheck, Save, RotateCcw } from "lucide-react";
import { QuizWorkspace } from "../quizzes/quiz-workspace.tsx";
import { QuizFacts, quizDate } from "../quizzes/quiz-facts.tsx";
import { AttemptReference, AttemptStatus } from "./attempt-facts.tsx";
import Link from "next/link";
import type {Session} from "../../lib/auth/session.ts";
import type {CurrentUser} from "../../lib/auth/validation.ts";
import type {Course} from "../../lib/courses/validation.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {receiptFromAttempt,type Attempt} from "../../lib/attempts/validation.ts";
import {attemptCapabilities} from "../../lib/attempts/capabilities.ts";
import {getAttempt} from "../../lib/api/attempts.ts";
import {getQuiz} from "../../lib/api/quizzes.ts";
import {getCourse} from "../../lib/api/courses.ts";
import {ApiHttpError} from "../../lib/api/errors.ts";
import {useSession} from "../auth/session-provider.tsx";
import {useResource} from "../courses/use-resource.ts";
import {ErrorState,LoadingState} from "../route-states.tsx";
import {useAttemptOperations} from "./use-attempt-operations.ts";
import {AttemptSubmit} from "./attempt-submit.tsx";
import {AttemptCancel} from "./attempt-cancel.tsx";
import {AttemptConfirmation} from "./attempt-confirmation.tsx";
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
  const detail=attemptCapabilities(context.user,course,quiz,current).edit?await getQuiz(c,slug,course.id,a.quizId):quiz;
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
function AttemptWork({session,slug,user,course,quiz,attempt}:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;attempt:Attempt}){
 const {ops,state}=useAttemptOperations(session,slug,user,course,quiz,attempt),a=state.attempt??attempt,cap=attemptCapabilities(user,course,quiz,a);
 const message=useTransientFeedback(state.phase==="dirty"?"Borrador con cambios sin guardar.":state.phase==="pristine"&&cap.edit?"Respuestas cargadas desde el servidor.":state.message,state.phase==="saved"&&!state.pending&&!state.cancelConfirmed,state);
 const locked=state.busy||!!state.pending||!!state.cancelConfirmed||!cap.edit;
 const editing=cap.edit&&!state.cancelConfirmed;
 const answered=quiz.questions.filter(q=>state.draft.some(answer=>answer.questionId===q.id)).length;
 return <QuizWorkspace course={course} user={user} title={quiz.title}>
 <div className="stack attempt-workspace">
 <Link className="text-link attempt-back" href={`/courses/${course.id}/quizzes/${quiz.id}`}><ArrowLeft size={16} aria-hidden="true"/>Volver al quiz</Link>
 <section className="card panel stack attempt-summary" aria-label="Resumen del intento">
   <div className="quiz-section-heading"><div><p className="section-label">{cap.student?"Tu intento":"Resumen del intento"}</p><h2 className="serif">Intento {a.attemptNumber}</h2></div><AttemptStatus status={state.cancelConfirmed?"cancelled":a.status}/></div>
   {editing&&<><p className="quiz-instructions">{quiz.instructions?.trim()||"Selecciona una alternativa por pregunta. Guarda tus respuestas antes de salir."}</p><QuizFacts quiz={quiz}/></>}
   <AttemptReference attempt={a}/>
 </section>
 {message && <p className={`notice${state.phase==="error"||state.pending?" warning":state.phase==="saved"?" success":""}`} role="status" aria-live="polite">{message}</p>}
 <div className={editing?"attempt-layout":"stack"}>
 {editing&&<form className="stack attempt-form" aria-label="Respuestas del intento" aria-busy={state.busy} onSubmit={e=>{e.preventDefault();void ops.save();}}>
   <div className="quiz-section-heading"><h2 className="serif">Preguntas</h2><span className="hint tnum">{answered} de {quiz.questions.length} respondidas</span></div>
   {quiz.questions.map((q,i)=><fieldset className="card attempt-question" id={`question-${q.id}`} key={q.id} disabled={locked}>
     <legend><span className="attempt-question-number tnum">{i+1}</span><span>{q.prompt}</span></legend>
     <div className="attempt-options">{q.alternatives.map((o,j)=><label className="option attempt-option" key={o.id}>
       <input type="radio" name={q.id} value={o.id} checked={state.draft.some(answer=>answer.questionId===q.id&&answer.alternativeId===o.id)} onChange={()=>ops.setDraft([...state.draft.filter(answer=>answer.questionId!==q.id),{questionId:q.id,alternativeId:o.id}])}/>
       <span className="attempt-option-letter" aria-hidden="true">{String.fromCharCode(65+j)}</span><span>{o.text}</span>
     </label>)}</div>
   </fieldset>)}
   <div className="card attempt-save-bar"><div className="actions"><button className="btn btn-primary" type="submit" disabled={locked||!state.draft.length}><Save size={16} aria-hidden="true"/>Guardar respuestas</button><button className="btn btn-ghost" type="button" disabled={locked||!state.draft.length} onClick={()=>ops.setDraft([])}><RotateCcw size={16} aria-hidden="true"/>Quitar todas las selecciones</button>
     {!state.draft.length&&<AttemptConfirmation label="Guardar sin respuestas" title="Confirmar borrado de respuestas" disabled={locked} onConfirm={()=>void ops.save(true)}><p>Guardar sin respuestas borra el conjunto completo en el servidor.</p></AttemptConfirmation>}</div>
     <p className="hint">{state.phase==="dirty"?"Tienes cambios sin guardar.":state.busy?"Guardando o comprobando el intento…":"El guardado es manual. Enviar finaliza tu intento."}</p>
   </div>
 </form>}
 <aside className="stack attempt-sidebar" aria-label={editing?"Avance y envío":"Estado del intento"}>
   {editing&&<section className="card panel stack attempt-progress"><h2 className="serif">Tu avance</h2><p className="tnum"><strong>{answered}</strong> de {quiz.questions.length} respondidas</p><progress aria-label="Preguntas respondidas" value={answered} max={Math.max(1,quiz.questions.length)}/>
     <nav className="attempt-question-nav" aria-label="Ir a una pregunta">{quiz.questions.map((q,i)=>{const selected=state.draft.some(answer=>answer.questionId===q.id);return <a key={q.id} className={`attempt-question-link${selected?" answered":""}`} href={`#question-${q.id}`} aria-label={`Pregunta ${i+1}: ${selected?"respondida":"sin responder"}`}>{selected?<CircleCheck size={16} aria-hidden="true"/>:<Circle size={16} aria-hidden="true"/>}<span className="tnum">{i+1}</span></a>;})}</nav>
     <p className="hint">Puedes enviar aunque queden preguntas sin responder.</p>
   </section>}
   {state.pending==="save"&&<section className="notice warning stack"><h2 className="serif">Guardado incierto</h2><p>No se pudo confirmar el guardado. La edición, el envío y la cancelación siguen bloqueados. Consultar el estado no confirma que el guardado haya terminado. Mantén esta página abierta para conservar la recuperación.</p><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar estado sin desbloquear</button></section>}
   <AttemptSubmit ops={ops} state={state} quiz={quiz} allowed={editing}/>
   <AttemptCancel ops={ops} state={state} allowed={cap.cancel}/>
   {editing&&<details className="academic-disclosure card"><summary>Guardar y retomar después</summary><div className="stack"><p className="hint">Conserva este enlace para reanudar el intento. Guarda antes de salir: recargar descarta los cambios sin guardar y la recuperación pendiente.</p><p className="hint">Cerrar la página no envía ni cancela el intento. Trabaja en una sola pestaña para evitar cambios en paralelo.</p></div></details>}
 </aside>
 </div></div>
 </QuizWorkspace>;
}
