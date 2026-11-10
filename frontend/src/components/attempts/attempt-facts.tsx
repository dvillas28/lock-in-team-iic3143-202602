import type { Attempt } from "../../lib/attempts/validation.ts";
import { quizDate } from "../quizzes/quiz-facts.tsx";

export const attemptStatuses: Record<Attempt["status"], { label: string; tone: string }> = {
  inProgress: { label: "En progreso", tone: "chip-primary" },
  submitted: { label: "Enviado", tone: "chip-primary" },
  graded: { label: "Calificado", tone: "chip-success" },
  cancelled: { label: "Cancelado", tone: "chip-danger" },
};

/** Students see “Enviado”: automatic grading is internal until the grade is published. */
export function AttemptStatus({ status, student = false, published = false }: { status: Attempt["status"]; student?: boolean; published?: boolean }) {
  const { label, tone } = student && status === "graded"
    ? published ? { label: "Nota publicada", tone: "chip-success" } : { label: "Enviado", tone: "chip-primary" }
    : attemptStatuses[status];
  return <span className={`chip ${tone}`}>{label}</span>;
}

export function AttemptReference({ attempt }: { attempt: Attempt }) {
  return <details className="academic-disclosure attempt-reference">
    <summary>Detalles del intento</summary>
    <dl className="attempt-reference-fields">
      <div><dt>Identificador del intento</dt><dd>{attempt.id}</dd></div>
      <div><dt>Sección histórica</dt><dd>{attempt.sectionId}</dd></div>
      <div><dt>Inicio</dt><dd className="tnum">{quizDate(attempt.startedAt)}</dd></div>
    </dl>
  </details>;
}
