"use client";
import type {AttemptOperations,OperationState} from "../../lib/attempts/operations.ts";
import {AttemptConfirmation} from "./attempt-confirmation.tsx";
export function AttemptCancel({ops,state,allowed}:{ops:AttemptOperations;state:OperationState;allowed:boolean}){
 if(state.cancelConfirmed||state.attempt?.status==="cancelled")return <section className="panel stack"><h2 className="serif">Cancelación confirmada</h2><p>Estado: cancelled</p><p className="tnum">{state.attempt?.cancelledAt?`Fecha: ${state.attempt.cancelledAt}`:"Fecha pendiente de consulta al servidor."}</p>{!state.attempt?.cancelledAt&&<button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar fecha de cancelación</button>}</section>;
 if(!allowed)return null;
 return <section className="stack"><AttemptConfirmation label="Cancelar intento" title="Confirmar cancelación" disabled={state.busy||!!state.pending} danger onConfirm={()=>void ops.cancel()}>
 <p>La cancelación es definitiva y cuenta entre los intentos del máximo. No genera nota ni sustituye un intento calificado requerido para publicar. Cerrar la ventana no cancela el intento.</p>
 </AttemptConfirmation>{state.pending==="cancel"&&<><p>Cancelación incierta. Consulta o repite la misma cancelación explícita.</p><div className="actions"><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.consult()}>Consultar cancelación</button><button className="btn btn-ghost" disabled={state.busy} onClick={()=>void ops.replay()}>Repetir cancelación</button></div></>}</section>;
}
