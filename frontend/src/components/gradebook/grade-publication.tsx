"use client";
import { useEffect, useRef, useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { Section } from "../../lib/courses/validation.ts";
import {
  rectangle,
  weightsInput,
  type Book,
  type GradeItem,
  type Selection,
} from "../../lib/gradebook/validation.ts";
import { PublicationOperation } from "../../lib/gradebook/publication.ts";
import { publishGrades } from "../../lib/api/gradebook.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import { AcademicDate } from "../academic/feedback.tsx";
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
  onConfirmed: () => void;
  onBusy: (busy: boolean) => void;
}>) {
  const [chosen, setChosen] = useState(emptySelection),
    [reviewing, setReviewing] = useState(false),
    [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<{
    state: PublicationOperation["state"];
    receipt: PublicationOperation["receipt"];
  }>();
  const operation = useRef<PublicationOperation | undefined>(undefined),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    back = useRef<HTMLButtonElement>(null);
  const scope = `${session.getSnapshot().generation}:${slug}:${courseId}:${JSON.stringify(session.getSnapshot().context?.user)}`;
  const locked =
    snapshot?.state === "sending" || snapshot?.state === "uncertain";
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
  try {
    weightsInput(
      items.map((i) => ({
        gradeItemId: i.id,
        weightPercent: String(i.weightPercent),
      })),
      items,
    );
    rectangle(chosen, rows);
  } catch (error) {
    reason = (error as Error).message;
  }
  const eligible = rows.some(
    (r) =>
      sections.some((s) => s.id === r.sectionId) &&
      r.grades.some((g) => !g.publishedAt),
  );
  const students = rows
    .filter((r) => chosen.sectionIds.includes(r.sectionId))
    .filter(
      (r, n, a) => a.findIndex((x) => x.student.id === r.student.id) === n,
    );
  function toggle(k: keyof Selection, id: string) {
    setChosen((v) => ({
      ...v,
      [k]: v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id],
      ...(k === "sectionIds" ? { studentIds: [] } : {}),
    }));
    setMessage("");
  }
  function reset() {
    operation.current?.dispose();
    operation.current = undefined;
    setSnapshot(undefined);
    setChosen(emptySelection());
    setReviewing(false);
    setMessage("");
  }
  async function send() {
    if (
      operation.current?.state === "sending" ||
      session.getSnapshot().contextWarning
    )
      return;
    if (!operation.current) {
      if (disabled || reason) return;
      operation.current = new PublicationOperation(
        scope,
        rectangle(chosen, rows),
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
    setSnapshot({ state: current.state, receipt: current.receipt });
    await promise;
    if (context !== session.getSnapshot().context) return;
    setSnapshot({ state: current.state, receipt: current.receipt });
    onBusy(current.state === "uncertain");
    if (current.state === "confirmed") {
      setMessage("Notas publicadas correctamente.");
      onConfirmed();
    } else
      setMessage(
        current.state === "uncertain"
          ? "Resultado incierto. Conservamos tu selección para consultar o repetir esta misma publicación."
          : getRouteFeedback(current.error).message,
      );
  }
  return (
    <div className="publication-control">
      <button
        ref={trigger}
        className="btn btn-primary"
        type="button"
        disabled={disabled || locked || !eligible}
        onClick={() => {
          if (snapshot) reset();
          dialog.current?.showModal();
        }}
      >
        Publicar notas
      </button>
      {!eligible && (
        <p className="hint">
          No hay notas pendientes de publicación en esta página.
        </p>
      )}
      {snapshot && (
        <div
          className="notice stack publication-status"
          aria-live="polite"
          aria-busy={snapshot.state === "sending"}
        >
          <p>{snapshot.state === "sending" ? "Publicando notas…" : message}</p>
          {snapshot.state === "confirmed" && (
            <output>
              Recibo confirmado: {snapshot.receipt?.publishedCount} notas ·{" "}
              <AcademicDate value={snapshot.receipt!.publishedAt} />
            </output>
          )}
          {snapshot.state === "uncertain" && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => void send()}
            >
              Repetir operación exacta
            </button>
          )}
          {snapshot.state === "rejected" && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                reset();
                dialog.current?.showModal();
              }}
            >
              Corregir selección
            </button>
          )}
        </div>
      )}
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
              {chosen.gradeItemIds.length} evaluaciones ×{" "}
              {chosen.studentIds.length} estudiantes ={" "}
              {chosen.gradeItemIds.length * chosen.studentIds.length} notas;{" "}
              {chosen.sectionIds.length} secciones.
            </p>
            <h3>Evaluaciones</h3>
            <ul>
              {chosen.gradeItemIds.map((id) => (
                <li key={id}>{items.find((i) => i.id === id)?.title}</li>
              ))}
            </ul>
            <h3>Destinatarios</h3>
            <ul>
              {chosen.studentIds.map((id) => (
                <li key={id}>
                  {students.find((r) => r.student.id === id)?.student.name}
                </li>
              ))}
            </ul>
            <p className="hint">
              Las notas publicadas quedan disponibles para los estudiantes y no
              se pueden modificar. Se comprobará que los resultados siguen
              siendo publicables.
            </p>
          </div>
        ) : (
          <div className="stack">
            <p className="hint">
              Selecciona las evaluaciones y los estudiantes de esta página que
              ya revisaste.
            </p>
            <fieldset className="selection-group" disabled={locked || disabled}>
              <legend>Evaluaciones</legend>
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
            </fieldset>
            <fieldset className="selection-group" disabled={locked || disabled}>
              <legend>Estudiantes de esta página</legend>
              {students.length ? (
                students.map((r) => (
                  <label className="option" key={r.student.id}>
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
                <p className="hint">
                  Selecciona una sección para ver sus estudiantes.
                </p>
              )}
            </fieldset>
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
            disabled={disabled || !!reason || locked}
            onClick={() => (reviewing ? void send() : setReviewing(true))}
          >
            {reviewing ? "Confirmar publicación" : "Revisar publicación"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
