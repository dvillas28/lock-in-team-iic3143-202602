"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import type { Authoring } from "../../lib/quizzes/validation.ts";
import type { Session } from "../../lib/auth/session.ts";
import { ApiHttpError, ApiResponseError } from "../../lib/api/errors.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import { getQuizAuthoringView, publishQuiz, listCourseGradeItems } from "../../lib/api/quizzes.ts";
import { availabilityText } from "../../lib/quizzes/publication.ts";
import { useResource } from "../courses/use-resource.ts";
import { quizDate } from "./quiz-facts.tsx";

export type PublishPreview = {
  title: string; destination: string; opensAt: string | null; closesAt: string | null; maxAttempts: number | null;
};

function publishError(error: unknown) {
  if (error instanceof ApiHttpError && error.status === 422) return "El quiz no cumple los requisitos para publicarse. Revisa sus preguntas.";
  if (error instanceof ApiHttpError && error.status === 409) return "El quiz cambió mientras lo publicabas. Recarga la página y revísalo.";
  return getRouteFeedback(error).message;
}

/**
 * Publishes one saved draft. The API treats a repeated publication as a no-op,
 * so retrying after an unconfirmed response never creates a second grade item.
 */
export function usePublication(session: Session, slug: string, courseId: string) {
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });
  const lock = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  async function run(quizId: string, done: (quiz: Authoring) => void) {
    if (lock.current) return;
    lock.current = true;
    const { context, generation } = session.getSnapshot();
    const current = () => alive.current && session.getSnapshot().context === context && session.getSnapshot().generation === generation;
    setState({ busy: true });
    try {
      const quiz = await session.request(c => publishQuiz(c, slug, courseId, quizId), current);
      if (current()) { setState({ busy: false }); done(quiz); }
    } catch (error) {
      if (!current()) return;
      if (error instanceof ApiHttpError && error.status < 500) {
        setState({ busy: false, error: publishError(error) });
        return;
      }
      try {
        const observed = await session.request(c => getQuizAuthoringView(c, slug, courseId, quizId), current);
        if (!current()) return;
        if (observed.status === "published") { setState({ busy: false }); done(observed); return; }
        setState({ busy: false, error: "No se pudo publicar el quiz. Inténtalo de nuevo." });
      } catch {
        if (current()) setState({ busy: false, error: "No se pudo confirmar la publicación. Inténtalo de nuevo; no se publicará dos veces." });
      }
    } finally {
      lock.current = false;
    }
  }

  return { ...state, run, clear: () => setState({ busy: false }) };
}

/** Accessible confirmation; it also explains what is missing when a draft is incomplete. */
export function QuizPublishDialog({ open, preview, issues, completeHref, busy, error, note, fallbackFocus, onConfirm, onClose }: {
  open: boolean;
  preview?: PublishPreview;
  issues?: string[];
  completeHref?: string;
  busy: boolean;
  error?: string;
  note?: ReactNode;
  /** Focus target when the control that opened the dialog no longer exists. */
  fallbackFocus?: () => HTMLElement | null | undefined;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null), fallback = useRef(fallbackFocus);
  useEffect(() => { fallback.current = fallbackFocus; });
  const titleId = useId(), descriptionId = useId();
  const incomplete = !!issues?.length;
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
      const target = opener.current?.isConnected ? opener.current : fallback.current?.();
      target?.focus();
    }
  }, [open]);

  return <dialog ref={dialog} className="native-dialog quiz-publish-dialog" aria-labelledby={titleId}
    aria-describedby={descriptionId} aria-busy={busy}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      // Keep keyboard focus inside the modal instead of escaping to the browser chrome.
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]"));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    {preview && <div className="stack">
      <header className="quiz-publish-heading">
        <h2 id={titleId}>{incomplete ? "Completa el borrador para publicarlo" : "¿Publicar este quiz?"}</h2>
        <p className="quiz-publish-title">{preview.title}</p>
      </header>
      {incomplete ? <div id={descriptionId} className="stack quiz-publish-body">
        <p className="hint">Antes de publicar, revisa lo siguiente:</p>
        <ul className="quiz-publish-issues">{issues!.map(issue => <li key={issue}>{issue}</li>)}</ul>
      </div> : <div id={descriptionId} className="stack quiz-publish-body">
        <dl className="quiz-publish-facts">
          <div><dt>Destinatarios</dt><dd>{preview.destination}</dd></div>
          <div><dt>Disponibilidad</dt><dd className="tnum">{availabilityText(preview.opensAt, preview.closesAt, quizDate)}</dd></div>
          <div><dt>Intentos</dt><dd className="tnum">{preview.maxAttempts ?? "Ilimitados"}</dd></div>
        </dl>
        <p className="hint">Después de publicarlo no podrás editarlo. Se agregará al libro de notas en su grupo de evaluación.</p>
        {note}
      </div>}
      {error && <p className="notice warning" role="alert">{error}</p>}
      <div className="actions quiz-publish-actions">
        <button ref={cancel} type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
          {incomplete ? "Cerrar" : "Cancelar"}
        </button>
        {incomplete
          ? completeHref && <Link className="btn btn-primary" prefetch={false} href={completeHref}>Completar borrador</Link>
          : <button type="button" className="btn btn-primary" disabled={busy} onClick={onConfirm}>
            <Send size={16} aria-hidden="true"/>{busy ? "Publicando…" : error ? "Reintentar" : "Publicar quiz"}
          </button>}
      </div>
    </div>}
  </dialog>;
}

export function PublishedItem({ session, slug, quiz }: { session: Session; slug: string; quiz: Authoring }) {
  const result = useResource(session, `${session.getSnapshot().generation}:${slug}:${quiz.courseId}:${quiz.id}:${quiz.publishedAt}:grade-item`, async c => {
    const items = await listCourseGradeItems(c, slug, quiz.courseId), item = items.find(i => i.quizId === quiz.id);
    if (!item) throw new ApiResponseError();
    return item;
  });
  return <section className="card panel stack"><h2 className="serif">Publicado</h2><p className="tnum">Publicación confirmada: {quizDate(quiz.publishedAt)}</p>
    {result.data ? <><p className="tnum">Ponderación actual en el libro de notas: {result.data.weightPercent} %</p><details className="academic-disclosure"><summary>Detalles del elemento de nota</summary><p>{result.data.title} · {result.data.id}</p></details></> : <p role="status">Publicado. Lectura del elemento de nota pendiente.</p>}
    {result.error && <button type="button" className="btn btn-ghost" onClick={() => void result.reload()}>Reintentar lectura del ítem</button>}
  </section>;
}
