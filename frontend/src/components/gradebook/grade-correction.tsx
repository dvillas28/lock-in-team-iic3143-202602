"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { correctPublishedGrade } from "../../lib/api/gradebook.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { correctionPreview, type Correction, type GradeItem, type GradeResult } from "../../lib/gradebook/validation.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import { useContentNotice } from "../content/content-notices.tsx";

const formatPoints = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });
const formatGrade = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function GradeCorrection({ session, slug, courseId, target, onClose, onSaved }: Readonly<{
  session: Session; slug: string; courseId: string;
  target: { grade: GradeResult; item: GradeItem; student: string };
  onClose: () => void; onSaved: () => Promise<unknown>;
}>) {
  const [points, setPoints] = useState(String(target.grade.pointsEarned ?? "").replace(".", ",")),
    [reason, setReason] = useState(""),
    [saving, setSaving] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [stale, setStale] = useState(false);
  const request = useRef<Correction>(undefined);
  const dialog = useRef<HTMLDialogElement>(null);
  const notify = useContentNotice();
  const maxPoints = target.item.maxPoints;
  const preview = correctionPreview(points, maxPoints);
  const valid = preview !== null && reason.trim().length > 0;
  const bindDialog = useCallback((element: HTMLDialogElement | null) => {
    dialog.current = element;
    if (element && !element.open) element.showModal();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || !valid || saving || stale || session.getSnapshot().contextWarning) return;
    const body = request.current ?? {
      revisionId: crypto.randomUUID(), expectedRevisionId: target.grade.revisionId ?? null, points: preview.points, reason: reason.trim(),
    };
    request.current = body;
    setSaving(true);
    try {
      await session.request(c => correctPublishedGrade(c, slug, courseId, target.grade.id, body));
      await onSaved();
      dialog.current?.close();
      notify?.("Nota corregida correctamente.");
      onClose();
    } catch (error) {
      if (error instanceof ApiHttpError && error.status >= 400 && error.status < 500) {
        request.current = undefined;
        setUncertain(false);
        setStale(error.status === 409);
        notify?.(error.status === 409 ? "Esta nota cambió. Vuelve al libro para revisar la versión vigente." : getRouteFeedback(error).message, "error", dialog.current);
      } else {
        setUncertain(true);
        notify?.("No pudimos confirmar la corrección. Reintenta la misma revisión para comprobar el resultado.", "error", dialog.current);
      }
    } finally { setSaving(false); }
  }
  function close() {
    if (uncertain || stale) void onSaved();
    onClose();
  }

  return <dialog ref={bindDialog} className="modal native-dialog academic-dialog grade-correction-dialog" aria-labelledby="correction-title"
    onCancel={e => { e.preventDefault(); if (!saving) close(); }}>
    <div className="dialog-heading">
      <div><h2 id="correction-title">Corregir nota publicada</h2><p>{target.student} · {target.item.title}</p></div>
      <div className="grade-correction-current"><span className="hint">Nota actual</span>
        <strong className="grade-value tnum">{formatGrade.format(target.grade.grade)}</strong>
      </div>
    </div>
    <form onSubmit={e => void save(e)} className="stack">
      <p className="hint">El nuevo puntaje actualizará la nota visible y el promedio. La corrección quedará en el historial.</p>
      <fieldset className="selection-group" disabled={saving || stale || uncertain}>
        <legend className="gradebook-sr-only">Datos de la corrección</legend>
        {maxPoints !== undefined && <p>Puntaje máximo <strong className="tnum">{formatPoints.format(maxPoints)} {maxPoints === 1 ? "punto" : "puntos"}</strong></p>}
        <label className="field-label">Puntaje corregido
          <input className="field tnum" inputMode="decimal" required aria-describedby="correction-points-help"
            aria-invalid={points.trim().length > 0 && !preview} value={points} onChange={e => setPoints(e.target.value)} />
        </label>
        <p className="hint" id="correction-points-help">Ingresa puntos con hasta dos decimales. La vista previa calcula el porcentaje y la nota.</p>
        <output className="grade-correction-preview tnum" aria-live="polite">
          {preview && maxPoints !== undefined ? <>
            <span>{formatPoints.format(preview.points)} de {formatPoints.format(maxPoints)} {maxPoints === 1 ? "punto" : "puntos"} ({formatPoints.format(preview.percent)} %)</span>
            <strong className="grade-value">Nota {formatGrade.format(preview.grade)}</strong>
          </> : <span className="hint">{points.trim() ? "Ingresa un puntaje válido entre 0 y el máximo." : "La nota resultante aparecerá aquí."}</span>}
        </output>
        <label className="field-label">Motivo de la corrección
          <textarea className="field" rows={3} required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} />
        </label>
      </fieldset>
      <div className="actions dialog-actions">
        <button className="btn btn-ghost" type="button" disabled={saving} onClick={close}>{stale ? "Volver al libro" : "Cerrar"}</button>
        <button className="btn btn-primary" type="submit" disabled={!valid || saving || stale}>
          {saving ? "Guardando…" : uncertain ? "Reintentar corrección" : "Guardar corrección"}
        </button>
      </div>
    </form>
  </dialog>;
}
