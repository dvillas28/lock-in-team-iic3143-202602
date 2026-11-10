"use client";
import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { CircleCheck, Send } from "lucide-react";
import type { AttemptOperations, OperationState } from "../../lib/attempts/operations.ts";
import type { attemptProgress } from "../../lib/attempts/progress.ts";
import { quizDate } from "../quizzes/quiz-facts.tsx";

type Progress = ReturnType<typeof attemptProgress>;

/** Final confirmation: counts, pending questions and a single explicit send. */
export function AttemptSubmitDialog({ open, ops, state, progress, onClose, onReview }: {
  open: boolean; ops: AttemptOperations; state: OperationState; progress: Progress;
  onClose: () => void; onReview: (questionId: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null), opener = useRef<HTMLElement | null>(null);
  const titleId = useId(), descriptionId = useId();
  const sending = state.busy;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      cancel.current?.focus();
    }
    if (!open && element.open) {
      element.close();
      // Reviewing a question moves focus there; otherwise return to the control that opened the dialog.
      if (!element.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (opener.current?.isConnected && !(opener.current as HTMLButtonElement).disabled) opener.current.focus();
    }
  }, [open]);
  // Once a send finishes (confirmed, rejected or unconfirmed) the page shows the outcome.
  const wasSending = useRef(false);
  useEffect(() => {
    if (open && wasSending.current && !sending) onClose();
    wasSending.current = sending;
  }, [open, sending, onClose]);

  return <dialog ref={dialog} className="native-dialog attempt-submit-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    aria-busy={sending} onCancel={event => { event.preventDefault(); if (!sending) onClose(); }}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled)"));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <div className="stack">
      <h2 id={titleId}>¿Enviar intento?</h2>
      <div id={descriptionId} className="stack attempt-submit-body">
        <dl className="attempt-submit-counts tnum">
          <div><dt>Respondidas</dt><dd>{progress.answered} de {progress.total}</dd></div>
          <div><dt>Sin responder</dt><dd>{progress.pending.length}</dd></div>
        </dl>
        {progress.pending.length > 0 && <div className="stack attempt-submit-pending">
          <p className="hint">Puedes enviarlo con preguntas sin responder, o revisarlas antes:</p>
          <div className="attempt-pending-links">{progress.pending.map(item =>
            <button key={item.id} type="button" className="btn btn-ghost tnum" disabled={sending}
              onClick={() => onReview(item.id)}>Pregunta {item.number}</button>)}</div>
        </div>}
        <p>Una vez enviado no podrás cambiar tus respuestas.</p>
      </div>
      <div className="actions attempt-submit-actions">
        <button ref={cancel} type="button" className="btn btn-ghost" disabled={sending} onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={sending} onClick={() => void ops.submit(true)}>
          <Send size={16} aria-hidden="true"/>{sending ? "Enviando…" : "Enviar intento"}
        </button>
      </div>
    </div>
  </dialog>;
}

export function AttemptReceipt({ state, attemptNumber, quizHref, gradesHref }: {
  state: OperationState; attemptNumber: number; quizHref: string; gradesHref?: string;
}) {
  if (!state.receipt) return null;
  return <section className="card panel stack attempt-receipt" aria-label="Recibo de envío" tabIndex={-1}>
    <div className="attempt-receipt-heading">
      <CircleCheck size={28} aria-hidden="true"/>
      <div><h2 className="serif">Intento enviado</h2><p className="hint">Tus respuestas quedaron registradas.</p></div>
    </div>
    <dl className="attempt-receipt-facts tnum">
      <div><dt>Intento</dt><dd>{attemptNumber}</dd></div>
      <div><dt>Fecha de envío</dt><dd>{quizDate(state.receipt.submittedAt)}</dd></div>
    </dl>
    <p className="hint">Tu nota aparecerá en «Mis notas» cuando el equipo docente la publique.</p>
    <div className="actions">
      <Link className="btn btn-primary" href={quizHref}>Volver al quiz</Link>
      {gradesHref && <Link className="btn btn-ghost" href={gradesHref}>Ver mis notas</Link>}
    </div>
  </section>;
}

/** Recovery controls for a send whose outcome the server has not confirmed yet. */
export function AttemptSubmitRecovery({ ops, state }: { ops: AttemptOperations; state: OperationState }) {
  if (state.pending !== "submit") return null;
  return <section className="notice warning stack attempt-recovery" role="alert">
    <strong>No pudimos confirmar el envío</strong>
    <p>{state.message || "Comprueba el estado antes de volver a intentarlo. Mantén esta página abierta."}</p>
    <div className="actions">
      <button className="btn btn-ghost" disabled={state.busy} onClick={() => void ops.consult()}>Comprobar estado</button>
      <button className="btn btn-ghost" disabled={state.busy} onClick={() => void ops.replay()}>Reintentar envío</button>
    </div>
  </section>;
}
