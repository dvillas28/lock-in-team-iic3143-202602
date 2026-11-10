"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MoreHorizontal, XCircle } from "lucide-react";
import type { AttemptOperations, OperationState } from "../../lib/attempts/operations.ts";
import { quizDate } from "../quizzes/quiz-facts.tsx";

const confirmedMessage = "Cancelación confirmada. Fecha pendiente de consulta al servidor.";

/** Terminal cancellation summary and recovery for an unconfirmed cancellation. */
export function AttemptCancelStatus({ ops, state }: { ops: AttemptOperations; state: OperationState }) {
  if (state.cancelConfirmed || state.attempt?.status === "cancelled") return <section className="card panel stack">
    <div className="quiz-section-heading"><h2 className="serif">Cancelación confirmada</h2><span className="chip chip-danger">Cancelado</span></div>
    <p className="hint">Este intento se cerró sin enviarse y no genera nota.</p>
    <p className="tnum hint">{state.attempt?.cancelledAt ? `Fecha: ${quizDate(state.attempt.cancelledAt)}` : "Fecha pendiente de consulta al servidor."}</p>
    {state.message && state.message !== confirmedMessage && <p className="hint" role="status">{state.message}</p>}
    {!state.attempt?.cancelledAt && <button className="btn btn-ghost" disabled={state.busy} onClick={() => void ops.consult()}>Consultar fecha de cancelación</button>}
  </section>;
  if (state.pending !== "cancel") return null;
  return <section className="notice warning stack attempt-recovery" role="alert">
    <strong>No pudimos confirmar la cancelación</strong>
    <p>Comprueba el estado o reinténtala. Mantén esta página abierta.</p>
    <div className="actions">
      <button className="btn btn-ghost" disabled={state.busy} onClick={() => void ops.consult()}>Comprobar estado</button>
      <button className="btn btn-ghost" disabled={state.busy} onClick={() => void ops.replay()}>Reintentar cancelación</button>
    </div>
  </section>;
}

/** Secondary “⋯” menu in the attempt header; cancelling always goes through a confirmation. */
export function AttemptCancelMenu({ ops, state, allowed }: { ops: AttemptOperations; state: OperationState; allowed: boolean }) {
  const [open, setOpen] = useState(false), [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null), item = useRef<HTMLButtonElement>(null), root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), back = useRef<HTMLButtonElement>(null);
  const menuId = useId(), titleId = useId(), descriptionId = useId();
  const disabled = state.busy || !!state.pending || !!state.cancelConfirmed;

  useEffect(() => {
    if (!open) return;
    item.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (confirming && !element.open) { element.showModal(); back.current?.focus(); }
    if (!confirming && element.open) { element.close(); if (trigger.current && !trigger.current.disabled) trigger.current.focus(); }
  }, [confirming]);

  if (!allowed || state.cancelConfirmed || state.attempt?.status === "cancelled") return null;

  function onMenuKey(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    if (event.key === "Tab") setOpen(false);
  }

  return <div className="attempt-menu" ref={root}>
    <button ref={trigger} type="button" className="icon-btn attempt-menu-trigger" aria-label="Más acciones del intento"
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} disabled={disabled}
      onClick={() => setOpen(previous => !previous)}
      onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}>
      <MoreHorizontal size={18} aria-hidden="true"/>
    </button>
    {open && <div className="card attempt-menu-list" role="menu" id={menuId} aria-label="Acciones del intento" onKeyDown={onMenuKey}>
      <button ref={item} type="button" role="menuitem" className="attempt-menu-item attempt-menu-danger"
        onClick={() => { setOpen(false); setConfirming(true); }}>
        <XCircle size={16} aria-hidden="true"/>Cancelar intento
      </button>
    </div>}
    <dialog ref={dialog} className="native-dialog attempt-submit-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); if (!state.busy) setConfirming(false); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled)"));
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="stack">
        <h2 id={titleId}>¿Cancelar intento?</h2>
        <p id={descriptionId}>El intento se cerrará sin enviarse y contará entre los intentos permitidos. No genera nota y no se puede deshacer.</p>
        <div className="actions attempt-submit-actions">
          <button ref={back} type="button" className="btn btn-ghost" disabled={state.busy} onClick={() => setConfirming(false)}>Volver</button>
          <button type="button" className="btn btn-danger" disabled={disabled}
            onClick={() => { setConfirming(false); void ops.cancel(); }}>Confirmar cancelación</button>
        </div>
      </div>
    </dialog>
  </div>;
}
