import { FieldError } from "../courses/validation.ts";
import { questionsInput, type Authoring, type Summary } from "./validation.ts";

/** Lifecycle shown to people; derived from the API status and the quiz window. */
export type QuizPhase = "draft" | "scheduled" | "open" | "closed";
export const phaseOrder: QuizPhase[] = ["draft", "open", "scheduled", "closed"];
export const phaseLabels: Record<QuizPhase, string> = {
  draft: "Borrador", scheduled: "Programado", open: "Disponible", closed: "Cerrado",
};
export const phaseGroups: Record<QuizPhase, string> = {
  draft: "Borradores", scheduled: "Programados", open: "Disponibles", closed: "Cerrados",
};

const time = (value: string | null) => value ? Date.parse(value) : NaN;

export function quizPhase(quiz: Pick<Summary, "status" | "opensAt" | "closesAt">, now: number): QuizPhase {
  if (quiz.status === "draft") return "draft";
  if (time(quiz.closesAt) <= now) return "closed";
  if (time(quiz.opensAt) > now) return "scheduled";
  return "open";
}

/** Predictable order: the next relevant date first, then title. */
export function sortQuizzes<T extends Summary>(items: T[], now: number) {
  const key = (quiz: T) => {
    const phase = quizPhase(quiz, now);
    if (phase === "scheduled") return time(quiz.opensAt);
    if (phase === "closed") return -time(quiz.closesAt);
    return Number.isNaN(time(quiz.closesAt)) ? Infinity : time(quiz.closesAt);
  };
  return [...items].sort((a, b) => key(a) - key(b) || a.title.localeCompare(b.title, "es"));
}

/** Same checks the API applies before publishing; never adds academic rules. */
export function publicationIssues(quiz: Authoring): string[] {
  if (!quiz.questions.length) return ["Agrega al menos una pregunta."];
  try {
    questionsInput(quiz.questions, quiz);
    return [];
  } catch (error) {
    if (error instanceof FieldError) {
      const question = /^questions\.(\d+)/.exec(error.field);
      return [question ? `Pregunta ${Number(question[1]) + 1}: ${error.message}` : error.message];
    }
    throw error;
  }
}

export function availabilityText(opensAt: string | null, closesAt: string | null, format: (value: string) => string) {
  if (opensAt && closesAt) return `Del ${format(opensAt)} al ${format(closesAt)}`;
  if (opensAt) return `Desde el ${format(opensAt)}, sin fecha de cierre`;
  if (closesAt) return `Desde que se publique hasta el ${format(closesAt)}`;
  return "Desde que se publique, sin fecha de cierre";
}
