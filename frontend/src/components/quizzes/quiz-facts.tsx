import type { Summary } from "../../lib/quizzes/validation.ts";

export function quizDate(value: string | null): string {
  if (!value) return "Sin límite";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function QuizStatus({ status }: { status: Summary["status"] }) {
  return <span className={`chip ${status === "draft" ? "chip-warning" : "chip-success"}`}>{status === "draft" ? "Borrador" : "Publicado"}</span>;
}

export function QuizFacts({ quiz }: { quiz: Summary }) {
  return <div className="stack quiz-schedule">
    <dl className="quiz-facts">
      <div><dt>Apertura</dt><dd className="tnum">{quizDate(quiz.opensAt)}</dd></div>
      <div><dt>Cierre</dt><dd className="tnum">{quizDate(quiz.closesAt)}</dd></div>
      <div><dt>Intentos permitidos</dt><dd className="tnum">{quiz.maxAttempts ?? "Ilimitados"}</dd></div>
    </dl>
    {(quiz.opensAt || quiz.closesAt) && <p className="hint">Horarios en {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>}
  </div>;
}
