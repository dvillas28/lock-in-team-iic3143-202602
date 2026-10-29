"use client";
import { useTransientFeedback } from "../use-feedback.ts";
import Link from "next/link";
import {useId,useState} from "react";
import type {Session} from "../../lib/auth/session.ts";
import type {CurrentUser} from "../../lib/auth/validation.ts";
import type {Course,Section} from "../../lib/courses/validation.ts";
import {isId} from "../../lib/courses/validation.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {startSections} from "../../lib/attempts/capabilities.ts";
import {useAttemptOperations} from "./use-attempt-operations.ts";
export function KnownAttemptLink(){
 const [id,setId]=useState(""),errorId=useId(),normalized=id.trim(),invalid=!!normalized&&!isId(normalized);
 return <details className="academic-disclosure card"><summary>Reanudar intento conocido</summary><section className="panel stack"><p className="hint">Si conservas el identificador de tu intento, puedes volver a abrirlo aquí.</p><label className="field-label">ID del intento<input className="field" value={id} onChange={e=>setId(e.target.value)} autoComplete="off" aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined}/></label>
 {invalid && <p id={errorId} className="hint">Ingresa el identificador completo del intento, con sus guiones.</p>}
 {isId(normalized)&&<Link className="btn btn-ghost" href={`/attempts/${normalized}`}>Abrir intento conocido</Link>}</section></details>;
}
export function AttemptStart({session,slug,user,course,quiz,sections}:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;sections:Section[]}){
 const destinations=startSections(user,course,quiz,sections),[sectionId,setSectionId]=useState(destinations.length===1?destinations[0].id:"");
 const {ops,state}=useAttemptOperations(session,slug,user,course,quiz);
 const message=useTransientFeedback(state.message,state.phase==="saved"&&!state.pending,state);
 if(!destinations.length)return null;
 const locked=state.busy||!!state.pending||!!state.attempt;
 return <section className="card panel stack quiz-attempt-start"><h2 className="serif">Rendir quiz</h2>
 <p className="hint">Selecciona tu sección para comenzar. Al iniciar se comprobarán el horario y tus intentos disponibles. Conserva el enlace del intento para poder retomarlo.</p>
 <label className="field-label">Sección para este intento<select className="field" value={sectionId} disabled={locked||state.phase!=="pristine"} onChange={e=>setSectionId(e.target.value)}><option value="">Selecciona una sección</option>{destinations.map(s=><option key={s.id} value={s.id}>{s.code}</option>)}</select></label>
 <button type="button" className="btn btn-primary" disabled={locked||!sectionId} onClick={()=>void ops.start(sectionId)}>Iniciar intento</button>
 {message && <p role="status" aria-live="polite">{message}</p>}
 {state.pending==="start"&&<button type="button" className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.replay()}>Recuperar inicio con la misma clave</button>}
 {(state.attempt||state.knownId)&&<Link href={`/attempts/${state.attempt?.id??state.knownId}`}>Abrir intento</Link>}
 </section>;
}
