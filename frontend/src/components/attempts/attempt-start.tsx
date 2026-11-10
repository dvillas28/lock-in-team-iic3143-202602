"use client";
import { useTransientFeedback } from "../use-feedback.ts";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useId,useState} from "react";
import {LockKeyhole,Play} from "lucide-react";
import type {Session} from "../../lib/auth/session.ts";
import type {CurrentUser} from "../../lib/auth/validation.ts";
import type {Course,Section} from "../../lib/courses/validation.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {listMyQuizAttempts, type MyAttemptPage} from "../../lib/api/attempts.ts";
import {startSections} from "../../lib/attempts/capabilities.ts";
import {useAttemptOperations} from "./use-attempt-operations.ts";
import {useResource} from "../courses/use-resource.ts";
import {ErrorState} from "../route-states.tsx";
import {AttemptStatus} from "./attempt-facts.tsx";
import {quizDate} from "../quizzes/quiz-facts.tsx";
const reasons: Record<NonNullable<MyAttemptPage['availability']['reason']>, string> = {
 unpublished: "El quiz todavía no está publicado.",
 gradesPublished: "La nota de este quiz ya fue publicada; no se admiten nuevos intentos.",
 activeAttempt: "Tienes un intento en progreso. Continúalo antes de iniciar otro.",
 notOpen: "El quiz todavía no abre. Revisa la fecha de apertura.",
 closed: "El plazo para rendir este quiz terminó.",
 limitReached: "Ya utilizaste todos los intentos permitidos.",
};
export function AttemptStart(props:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;sections:Section[]}) {
 const destinations=startSections(props.user,props.course,props.quiz,props.sections);
 return destinations.length ? <StudentAttempts {...props} destinations={destinations}/> : null;
}
function StudentAttempts({session,slug,user,course,quiz,sections,destinations}:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;sections:Section[];destinations:Section[]}) {
 const router=useRouter();
 const titleId=useId(), [sectionId,setSectionId]=useState(destinations.length===1?destinations[0].id:"");
 const [cursor,setCursor]=useState<string>(), [pages,setPages]=useState<(string|undefined)[]>([]);
 const {ops,state}=useAttemptOperations(session,slug,user,course,quiz);
 const history=useResource(session,`${session.getSnapshot().generation}:${slug}:${user.id}:${course.id}:${quiz.id}:mine:${cursor??""}`,
  c=>listMyQuizAttempts(c,slug,quiz.id,user.id,{cursor}),false);
 const message=useTransientFeedback(state.message,state.phase==="saved"&&!state.pending,state);
 const availability=history.data?.availability;
 const locked=state.busy||!!state.pending||!!state.attempt;
 const activeId=state.attempt?.status==="inProgress"?state.attempt.id:availability?.activeAttemptId;
 async function start(recover=false){
  if(recover) await ops.replay(); else await ops.start(sectionId);
  const {attempt,phase,busy}=ops.getSnapshot();
  if(!busy && phase==="saved" && attempt) router.push(`/attempts/${attempt.id}`);
  else if(!recover) await history.reload();
 }
 return <section className="card panel stack quiz-attempt-start" aria-labelledby={titleId}>
  <div className="quiz-section-heading"><h2 className="serif" id={titleId}>Mis intentos</h2>
   {availability && <span className="hint tnum">{availability.remainingAttempts===null?"Intentos ilimitados":`${availability.remainingAttempts} ${availability.remainingAttempts===1?"intento disponible":"intentos disponibles"}`}</span>}
  </div>
  {history.error && <ErrorState feedback={history.error} onRetry={()=>void history.reload()}/>}
  {history.refreshing && !history.data && <p role="status">Cargando tus intentos…</p>}
  {message && <p role="status" aria-live="polite">{message}</p>}
  {state.pending==="start" && <div className="notice warning stack" role="alert"><p>No pudimos confirmar el inicio del intento. Recupéralo antes de iniciar otro.</p><div className="actions"><button type="button" className="btn btn-ghost" disabled={state.busy} onClick={()=>void start(true)}>Recuperar intento</button></div></div>}
  {(activeId||state.knownId) && <Link className="btn btn-primary" href={`/attempts/${activeId??state.knownId}`}><Play size={16} aria-hidden="true"/>{activeId?"Continuar intento":"Ver intento"}</Link>}
  {availability && <>
   {availability.reason && availability.reason!=="activeAttempt" && <p className="notice" role="status">{reasons[availability.reason]}{availability.reason==="gradesPublished" && <> <Link className="text-link" href={`/courses/${course.id}/grades`}>Ver mis notas</Link></>}</p>}
   {availability.canStart && !state.attempt && <div className="stack">
    {destinations.length>1 && <label className="field-label">Sección para este intento<select className="field" value={sectionId} disabled={locked||state.phase!=="pristine"} onChange={e=>setSectionId(e.target.value)}><option value="">Selecciona una sección</option>{destinations.map(s=><option key={s.id} value={s.id}>{s.code}</option>)}</select></label>}
    <div className="attempt-start-action"><button type="button" className="btn btn-primary" disabled={locked||!sectionId} onClick={()=>void start()}>Iniciar nuevo intento</button><p className="hint attempt-start-hint"><LockKeyhole size={14} aria-hidden="true"/>Las preguntas se muestran al iniciar el intento.</p></div>
   </div>}
  </>}
  {history.data && <>
   {!history.data.items.length ? <p className="hint">Aún no has rendido este quiz.</p> : <ul className="stack student-attempt-list" aria-label="Historial de mis intentos">{history.data.items.map(a=><li className="student-attempt-row" key={a.id}>
    <div className="stack"><div className="quiz-chips"><h3 className="serif tnum">Intento {a.attemptNumber}</h3><AttemptStatus status={a.status} student published={availability?.reason==="gradesPublished"}/></div>
     <p className="hint tnum">{a.submittedAt?`Enviado el ${quizDate(a.submittedAt)}`:a.cancelledAt?`Cancelado el ${quizDate(a.cancelledAt)}`:`Iniciado el ${quizDate(a.startedAt)}`}{destinations.length>1?` · Sección ${sections.find(s=>s.id===a.sectionId)?.code??"anterior"}`:""}</p>
    </div>
    <Link className="btn btn-ghost" href={`/attempts/${a.id}`} aria-label={`${a.status==="inProgress"?"Continuar":"Ver"} intento ${a.attemptNumber}`}>{a.status==="inProgress"?"Continuar":"Ver"}</Link>
   </li>)}</ul>}
   {(pages.length>0||history.data.hasMore) && <nav className="academic-footer" aria-label="Páginas de mis intentos"><span className="hint tnum" role="status">Página {pages.length+1}</span><div className="actions">
    <button type="button" className="btn btn-ghost" disabled={!pages.length} onClick={()=>{setCursor(pages.at(-1));setPages(p=>p.slice(0,-1));}}>Anterior</button>
    <button type="button" className="btn btn-ghost" disabled={!history.data.hasMore} onClick={()=>{setPages(p=>[...p,cursor]);setCursor(history.data!.nextCursor!);}}>Siguiente</button>
   </div></nav>}
  </>}
 </section>;
}
