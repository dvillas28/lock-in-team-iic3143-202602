"use client";
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
  return <section className="panel stack"><h1 className="serif">Intento conocido</h1><p>ID: {a.id}</p><p>Estado: {a.status}</p><p className="tnum">{receipt?.submittedAt??a.cancelledAt??"Sin fecha terminal"}</p><p>Resumen autorizado. No se pudo cargar el contexto del quiz.</p></section>;
 }
 return <AttemptWork key={scope} session={session} slug={slug} user={context.user} {...result.data}/>;
}
function AttemptWork({session,slug,user,course,quiz,attempt}:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;attempt:Attempt}){
 const {ops,state}=useAttemptOperations(session,slug,user,course,quiz,attempt),a=state.attempt??attempt,cap=attemptCapabilities(user,course,quiz,a);
 const locked=state.busy||!!state.pending||!!state.cancelConfirmed||!cap.edit;
 return <div className="stack quiz-authoring"><Link href={`/courses/${course.id}/quizzes`}>Volver a quizzes</Link><h1 className="serif">{quiz.title}</h1>
 <p className="tnum">Intento {a.attemptNumber} · ID: {a.id}</p><p>Sección histórica: {a.sectionId}</p><p>Estado: {state.cancelConfirmed?"cancelled":a.status}</p>
 <p className="hint">Conserva este enlace para reanudar. Recargar pierde cambios locales y claves pendientes. El cierre no envía ni cancela automáticamente. No hay coordinación de cambios entre pestañas.</p>
 {cap.edit&&!state.cancelConfirmed&&<><p className="markdown-source">{quiz.instructions}</p><p>Apertura: {quiz.opensAt??"Sin límite"} · Cierre: {quiz.closesAt??"Sin límite"} · Máximo: {quiz.maxAttempts??"Ilimitado"}. El servidor revalida cada operación.</p>
 <form className="stack" aria-busy={state.busy} onSubmit={e=>{e.preventDefault();void ops.save();}}>
 {quiz.questions.map(q=><fieldset className="panel stack" key={q.id} disabled={locked}><legend>{q.prompt}</legend>{q.alternatives.map(o=><label className="option" key={o.id}><input type="radio" name={q.id} value={o.id} checked={state.draft.some(a=>a.questionId===q.id&&a.alternativeId===o.id)} onChange={()=>ops.setDraft([...state.draft.filter(a=>a.questionId!==q.id),{questionId:q.id,alternativeId:o.id}])}/> {o.text}</label>)}</fieldset>)}
 <div className="actions"><button className="btn btn-primary" type="submit" disabled={locked||!state.draft.length}>Guardar respuestas</button><button className="btn btn-ghost" type="button" disabled={locked||!state.draft.length} onClick={()=>ops.setDraft([])}>Quitar todas las selecciones</button>
 {!state.draft.length&&<AttemptConfirmation label="Guardar sin respuestas" title="Confirmar borrado de respuestas" disabled={locked} onConfirm={()=>void ops.save(true)}><p>Guardar sin respuestas borra el conjunto completo en el servidor.</p></AttemptConfirmation>}</div>
 </form></>}
 <p role="status" aria-live="polite">{state.phase==="dirty"?"Borrador con cambios sin guardar.":state.phase==="pristine"&&cap.edit?"Respuestas cargadas desde el servidor.":state.message}</p>
 {state.pending==="save"&&<><p>Guardado incierto: nuevas escrituras, envío y cancelación permanecen bloqueados. Un GET aislado no prueba que el PUT tardío terminó. No recargues para intentar desbloquearlo: perder el estado local no demuestra su finalización.</p><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar estado sin desbloquear</button></>}
 <AttemptSubmit ops={ops} state={state} quiz={quiz} allowed={cap.edit&&!state.cancelConfirmed}/><AttemptCancel ops={ops} state={state} allowed={cap.cancel}/>
 </div>;
}
