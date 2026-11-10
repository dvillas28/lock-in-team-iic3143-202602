"use client";
import { useEffect, useRef, useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { Section } from "../../lib/courses/validation.ts";
import {
  rectangle,
  publicationSelection,
  type Book,
  type GradeItem,
  type Selection,
  type PublicationSelection,
} from "../../lib/gradebook/validation.ts";
import { PublicationOperation } from "../../lib/gradebook/publication.ts";
import { publishGrades } from "../../lib/api/gradebook.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import { useContentNotice } from "../content/content-notices.tsx";
const emptySelection = (): Selection => ({
  gradeItemIds: [],
  sectionIds: [],
  studentIds: [],
});
export function GradePublication({
  session,
  slug,
  courseId,
  items,
  rows,
  sections,
  disabled = false,
  totalWeightPercent,
  moreRows = false,
  onConfirmed,
  onBusy,
}: Readonly<{
  session: Session;
  slug: string;
  courseId: string;
  items: GradeItem[];
  rows: Book["items"];
  sections: Section[];
  disabled?: boolean;
  totalWeightPercent?: number;
  moreRows?: boolean;
  onConfirmed: () => void;
  onBusy: (busy: boolean) => void;
}>) {
  const [chosen, setChosen] = useState(emptySelection),
    [wholeSections, setWholeSections] = useState(false),
    [reviewing, setReviewing] = useState(false);
  const [status, setStatus] = useState<PublicationOperation["state"]>();
  const notify = useContentNotice();
  const operation = useRef<PublicationOperation | undefined>(undefined),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    back = useRef<HTMLButtonElement>(null);
  const scope = `${session.getSnapshot().generation}:${slug}:${courseId}:${JSON.stringify(session.getSnapshot().context?.user)}`;
  const locked =
    status === "sending" || status === "uncertain";
  useEffect(
    () => () => {
      operation.current?.dispose();
    },
    [],
  );
  useEffect(() => {
    if (reviewing && dialog.current?.open) back.current?.focus();
  }, [reviewing]);
  useEffect(() => {
    if (!locked) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const navigate = (e: MouseEvent) => {
      if (
        (e.target as Element).closest?.("a[href]") &&
        !window.confirm(
          "La publicación sigue pendiente. Salir pierde su recuperación. ¿Deseas salir?",
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [locked]);
  let reason = "";
  let request: PublicationSelection | undefined;
  try {
    if ((totalWeightPercent ?? items.reduce((n, i) => n + Math.round(i.weightPercent * 100), 0) / 100) !== 100)
      throw new Error("Guarda ponderaciones que sumen 100 % para publicar notas.");
    if (wholeSections ? chosen.sectionIds.length : chosen.gradeItemIds.length && chosen.sectionIds.length && chosen.studentIds.length) {
      request = wholeSections
        ? publicationSelection({scope:"pending",sectionIds:chosen.sectionIds,
          ...(chosen.gradeItemIds.length ? {gradeItemIds:chosen.gradeItemIds} : {})})
        : rectangle(chosen, rows);
    }
  } catch (error) {
    reason = (error as Error).message;
  }
  const eligible = moreRows || rows.some(row => sections.some(s => s.id === row.sectionId) && row.grades.some(g => !g.publishedAt));
  const students = rows
    .filter((r) => chosen.sectionIds.includes(r.sectionId))
    .filter(
      (r, n, a) => a.findIndex((x) => x.student.id === r.student.id) === n,
    );
  const evaluationHint = !wholeSections && !chosen.gradeItemIds.length
    ? "Selecciona al menos una evaluación."
    : "";
  const sectionHint = !chosen.sectionIds.length ? "Selecciona una sección." : "";
  const studentHint = !wholeSections && chosen.gradeItemIds.length && chosen.sectionIds.length
    ? (!students.length ? "No hay estudiantes disponibles en la sección seleccionada."
      : !chosen.studentIds.length ? "Selecciona al menos un estudiante." : "")
    : "";
  function toggle(k: keyof Selection, id: string) {
    setChosen((v) => ({
      ...v,
      [k]: v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id],
      ...(k === "sectionIds" ? { studentIds: [] } : {}),
    }));
  }
  function reset() {
    operation.current?.dispose();
    operation.current = undefined;
    setStatus(undefined);
    setChosen(emptySelection());
    setWholeSections(false);
    setReviewing(false);
  }
  async function send() {
    if (
      operation.current?.state === "sending" ||
      session.getSnapshot().contextWarning
    )
      return;
    if (!operation.current) {
      if (disabled || !request) return;
      operation.current = new PublicationOperation(
        scope,
        request,
        crypto.randomUUID(),
      );
    }
    const current = operation.current,
      context = session.getSnapshot().context;
    dialog.current?.close();
    onBusy(true);
    const promise = current.send(scope, (body, key) =>
      session.request((c) => publishGrades(c, slug, courseId, body, key)),
    );
    setStatus(current.state);
    await promise;
    if (context !== session.getSnapshot().context) return;
    setStatus(current.state);
    onBusy(current.state === "uncertain");
    if (current.state === "confirmed") {
      notify?.("Notas publicadas correctamente.");
      onConfirmed();
    } else
      notify?.(
        current.state === "uncertain"
          ? "Resultado incierto. Conservamos tu selección para consultar o repetir esta misma publicación."
          : getRouteFeedback(current.error).message,
        "error",
      );
  }
  return (
    <>
      <button
        ref={trigger}
        className="btn btn-primary"
        type="button"
        disabled={status === "sending" || (status !== "uncertain" && (disabled || !items.length || !sections.length || !eligible))}
        onClick={() => {
          if (status === "uncertain") { void send(); return; }
          if (status) reset();
          dialog.current?.showModal();
        }}
      >
        {status === "sending" ? "Publicando…" : status === "uncertain" ? "Repetir operación exacta" : "Publicar notas"}
      </button>
      <dialog
        className="modal native-dialog academic-dialog"
        ref={dialog}
        aria-labelledby="publication-title"
        onClose={() => trigger.current?.focus()}
      >
        <div className="dialog-heading">
          <div>
            <p className="section-label">
              {reviewing ? "Paso 2 de 2 · Revisión" : "Paso 1 de 2 · Selección"}
            </p>
            <h2 id="publication-title">
              {reviewing
                ? "Confirmar selección de publicación"
                : "Publicar notas"}
            </h2>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => dialog.current?.close()}
          >
            Cerrar
          </button>
        </div>
        {reviewing ? (
          <div className="stack">
            <p className="notice tnum">
              {wholeSections ? "Se publicarán las notas registradas pendientes en las secciones elegidas, incluidas otras páginas del libro."
                : `Se publicarán ${chosen.gradeItemIds.length * chosen.studentIds.length} notas de ${chosen.studentIds.length} estudiantes.`}
            </p>
            <h3>Evaluaciones</h3>
            <ul>{chosen.gradeItemIds.length ? chosen.gradeItemIds.map(id => (
              <li key={id}>{items.find(i => i.id === id)?.title}</li>
            )) : <li>Todas las evaluaciones</li>}</ul>
            <h3>{wholeSections ? "Secciones" : "Destinatarios"}</h3>
            <ul>{wholeSections
              ? chosen.sectionIds.map(id => <li key={id}>Sección {sections.find(s => s.id === id)?.code}</li>)
              : chosen.studentIds.map(id => <li key={id}>{students.find(r => r.student.id === id)?.student.name}</li>)}</ul>
            <p className="hint">Los estudiantes verán las notas al confirmar. Una corrección posterior queda registrada en el historial.</p>
          </div>
        ) : (
          <div className="stack">
            <fieldset className="selection-group" disabled={locked || disabled}>
              <legend>¿A quién quieres publicar?</legend>
              <div className="publication-modes">
                <label className="option"><input type="radio" name="publish-scope" checked={!wholeSections}
                  onChange={() => setWholeSections(false)} /> Estudiantes seleccionados</label>
                <label className="option"><input type="radio" name="publish-scope" checked={wholeSections}
                  onChange={() => setWholeSections(true)} /> Secciones completas</label>
              </div>
            </fieldset>
            <fieldset className="selection-group" disabled={locked || disabled}>
              <legend>{wholeSections ? "Evaluaciones (opcional)" : "Evaluaciones"}</legend>
              {items.map((i) => (
                <label className="option" key={i.id}>
                  <input
                    type="checkbox"
                    value={i.id}
                    checked={chosen.gradeItemIds.includes(i.id)}
                    onChange={() => toggle("gradeItemIds", i.id)}
                  />
                  {i.title}
                </label>
              ))}
              {evaluationHint && (
                <p className="hint publication-selection-hint" role="status">
                  {evaluationHint}
                </p>
              )}
            </fieldset>
            <fieldset className="selection-group" disabled={locked || disabled}>
              <legend>Secciones</legend>
              {sections.map((s) => (
                <label className="option" key={s.id}>
                  <input
                    type="checkbox"
                    value={s.id}
                    checked={chosen.sectionIds.includes(s.id)}
                    onChange={() => toggle("sectionIds", s.id)}
                  />
                  Sección {s.code}
                </label>
              ))}
              {sectionHint && (
                <p className="hint publication-selection-hint" role="status">
                  {sectionHint}
                </p>
              )}
            </fieldset>
            {!wholeSections && chosen.sectionIds.length > 0 && <fieldset className="selection-group publication-students" disabled={locked || disabled}>
              <legend>Estudiantes de esta página</legend>
              {students.length ? (
                students.map((r) => (
                  <label className="option publication-student-option" key={r.student.id}>
                    <input
                      type="checkbox"
                      value={r.student.id}
                      checked={chosen.studentIds.includes(r.student.id)}
                      onChange={() => toggle("studentIds", r.student.id)}
                    />
                    <span>
                      {r.student.name}
                      <small className="hint">{r.student.email}</small>
                    </span>
                  </label>
                ))
              ) : (
                null
              )}
              {studentHint && (
                <p className="hint publication-selection-hint" role="status">
                  {studentHint}
                </p>
              )}
            </fieldset>}
            {reason && (
              <p className="hint" role="status">
                {reason}
              </p>
            )}
          </div>
        )}
        <div className="actions dialog-actions">
          <button
            ref={back}
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              reviewing ? setReviewing(false) : dialog.current?.close()
            }
          >
            {reviewing ? "Volver" : "Cancelar"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={disabled || !!reason || !request || locked}
            onClick={() => (reviewing ? void send() : setReviewing(true))}
          >
            {reviewing ? "Confirmar publicación" : "Revisar publicación"}
          </button>
        </div>
      </dialog>
    </>
  );
}
