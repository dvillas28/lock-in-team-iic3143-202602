"use client";
import type {AttemptOperations,OperationState} from "../../lib/attempts/operations.ts";
import {AttemptConfirmation} from "./attempt-confirmation.tsx";
import { quizDate } from "../quizzes/quiz-facts.tsx";
export function AttemptCancel({ops,state,allowed}:{ops:AttemptOperations;state:OperationState;allowed:boolean}){
 if(state.cancelConfirmed||state.attempt?.status==="cancelled")return <section className="card panel stack"><div className="quiz-section-heading"><h2 className="serif">Cancelación confirmada</h2><span className="chip chip-danger">Cancelado</span></div><p className="hint">Este intento está cerrado y no genera una nota.</p><p className="tnum hint">{state.attempt?.cancelledAt?`Fecha: ${quizDate(state.attempt.cancelledAt)}`:"Fecha pendiente de consulta al servidor."}</p>{!state.attempt?.cancelledAt&&<button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar fecha de cancelación</button>}</section>;
 if(!allowed)return null;
 return <section className="card panel stack attempt-cancel"><h2 className="serif">Cancelar intento</h2><p className="hint">Cierra el intento sin enviarlo. La cancelación es definitiva y consume un intento disponible.</p><AttemptConfirmation label="Cancelar intento" title="Confirmar cancelación" disabled={state.busy||!!state.pending} danger onConfirm={()=>void ops.cancel()}>
 <p>La cancelación es definitiva y cuenta entre los intentos del máximo. No genera nota ni sustituye un intento calificado requerido para publicar. Cerrar la ventana no cancela el intento.</p>
 </AttemptConfirmation>{state.pending==="cancel"&&<><p className="notice warning">Cancelación incierta. Consulta o repite la misma cancelación explícita.</p><div className="actions"><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar cancelación</button><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.replay()}>Repetir cancelación</button></div></>}</section>;
}
