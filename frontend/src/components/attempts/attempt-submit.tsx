"use client";
import type {AttemptOperations,OperationState} from "../../lib/attempts/operations.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import {AttemptConfirmation} from "./attempt-confirmation.tsx";
export function AttemptSubmit({ops,state,quiz,allowed}:{ops:AttemptOperations;state:OperationState;quiz:SafeQuiz;allowed:boolean}){
 if(state.receipt)return <section className="panel stack" aria-label="Recibo de envío"><h2 className="serif">Envío confirmado</h2><p>ID: {state.receipt.id}</p><p>Estado: {state.receipt.status}</p><p className="tnum">Fecha: {state.receipt.submittedAt}</p></section>;
 return <section className="stack">{allowed&&<AttemptConfirmation label="Enviar intento" title="Confirmar envío" disabled={state.busy||!!state.pending||!!state.cancelConfirmed} onConfirm={()=>void ops.submit(true)}>
 <p>Estas son las respuestas actuales. Se guardarán los cambios antes de enviar; el envío es definitivo.</p><ul>{state.draft.map(a=><li key={a.questionId}>{quiz.questions.find(q=>q.id===a.questionId)?.prompt}: {quiz.questions.find(q=>q.id===a.questionId)?.alternatives.find(o=>o.id===a.alternativeId)?.text}</li>)}</ul>
 {!state.draft.length&&<p>Confirmas enviar sin respuestas y borrar todo el conjunto guardado.</p>}
 </AttemptConfirmation>}
 {state.pending==="submit"&&<><p>El envío no está confirmado. Consultar no repite el guardado. Cerrar esta página pierde la clave original; nunca se envía automáticamente.</p><div className="actions"><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar envío</button><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.replay()}>Repetir envío original</button></div></>}
 </section>;
}
