"use client";
import Link from "next/link";
import {useState} from "react";
import type {Session} from "../../lib/auth/session.ts";
import type {CurrentUser} from "../../lib/auth/validation.ts";
import type {Course,Section} from "../../lib/courses/validation.ts";
import {isId} from "../../lib/courses/validation.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {startSections} from "../../lib/attempts/capabilities.ts";
import {useAttemptOperations} from "./use-attempt-operations.ts";
export function KnownAttemptLink(){
 const [id,setId]=useState("");
 return <section className="panel stack"><h2 className="serif">Reanudar intento conocido</h2><label className="field-label">ID del intento<input className="field" value={id} onChange={e=>setId(e.target.value)} autoComplete="off"/></label>
 {isId(id)&&<Link href={`/attempts/${id}`}>Abrir intento conocido</Link>}<p className="hint">Conserva el enlace del intento. Sin su ID y sin la clave de inicio tras una recarga no podemos descubrirlo automáticamente.</p></section>;
}
export function AttemptStart({session,slug,user,course,quiz,sections}:{session:Session;slug:string;user:CurrentUser;course:Course;quiz:SafeQuiz;sections:Section[]}){
 const destinations=startSections(user,course,quiz,sections),[sectionId,setSectionId]=useState(destinations.length===1?destinations[0].id:"");
 const {ops,state}=useAttemptOperations(session,slug,user,course,quiz);
 if(!destinations.length)return null;
 const locked=state.busy||!!state.pending||!!state.attempt;
 return <section className="panel stack"><h2 className="serif">Rendir quiz</h2>
 <p>El servidor verifica apertura, cierre, máximo y permisos al iniciar. Conserva el enlace recibido; las claves se pierden al abandonar esta página.</p>
 <label className="field-label">Sección para este intento<select className="field" value={sectionId} disabled={locked||state.phase!=="pristine"} onChange={e=>setSectionId(e.target.value)}><option value="">Selecciona una sección</option>{destinations.map(s=><option key={s.id} value={s.id}>{s.code}</option>)}</select></label>
 <button type="button" className="btn btn-primary" disabled={locked||!sectionId} onClick={()=>void ops.start(sectionId)}>Iniciar intento</button>
 <p role="status" aria-live="polite">{state.message}</p>
 {state.pending==="start"&&<button type="button" className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.replay()}>Recuperar inicio con la misma clave</button>}
 {(state.attempt||state.knownId)&&<Link href={`/attempts/${state.attempt?.id??state.knownId}`}>Abrir intento</Link>}
 </section>;
}
