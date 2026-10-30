"use client";
import type {AttemptOperations,OperationState} from "../../lib/attempts/operations.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {AttemptConfirmation} from "./attempt-confirmation.tsx";
import { CircleCheck, Send } from "lucide-react";
import { quizDate } from "../quizzes/quiz-facts.tsx";
export function AttemptSubmit({ops,state,quiz,allowed}:{ops:AttemptOperations;state:OperationState;quiz:SafeQuiz;allowed:boolean}){
 if(state.receipt)return <section className="card panel stack attempt-receipt" aria-label="Recibo de envío"><div className="quiz-section-heading"><h2 className="serif">Envío confirmado</h2><CircleCheck size={24} aria-hidden="true"/></div><p>Tu intento quedó registrado. La nota estará disponible cuando se publique.</p><dl className="quiz-facts"><div><dt>Fecha de envío</dt><dd className="tnum">{quizDate(state.receipt.submittedAt)}</dd></div><div><dt>Estado</dt><dd>Calificado</dd></div></dl><details className="academic-disclosure"><summary>Comprobante del envío</summary><p className="hint">Identificador: {state.receipt.id}</p></details></section>;
 if(!allowed&&state.pending!=="submit")return null;
 return <section className="card panel stack attempt-submit"><div className="quiz-section-heading"><h2 className="serif">Finalizar intento</h2><Send size={20} aria-hidden="true"/></div><p className="hint">Al enviar se guardan tus respuestas actuales y el intento queda cerrado.</p>{allowed&&<AttemptConfirmation label="Enviar intento" title="Confirmar envío" primary disabled={state.busy||!!state.pending||!!state.cancelConfirmed} onConfirm={()=>void ops.submit(true)}>
 <p>Estas son las respuestas actuales. Se guardarán los cambios antes de enviar; el envío es definitivo.</p><ol className="attempt-confirmation-answers">{state.draft.map(a=><li key={a.questionId}><strong>{quiz.questions.find(q=>q.id===a.questionId)?.prompt}</strong><p>{quiz.questions.find(q=>q.id===a.questionId)?.alternatives.find(o=>o.id===a.alternativeId)?.text}</p></li>)}</ol>
 {!state.draft.length&&<p>Confirmas enviar sin respuestas y borrar todo el conjunto guardado.</p>}
 </AttemptConfirmation>}
 {state.pending==="submit"&&<><p className="notice warning">El envío no está confirmado. Consultar no repite el guardado. Mantén esta página abierta para conservar la recuperación del envío original.</p><div className="actions"><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar envío</button><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.replay()}>Repetir envío original</button></div></>}
 </section>;
}
