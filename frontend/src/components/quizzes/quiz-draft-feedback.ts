import type { QuestionRow } from "../../lib/quizzes/draft-values.ts";
import { quizControlField } from "./use-quiz-form.tsx";

type MutationFeedback = { message?: string; field?: string; confirmed?: boolean };

export function draftFieldIdentity(field: string, rows: QuestionRow[]) {
  if (/^(title|instructions|sectionId|opensAt|closesAt|maxAttempts)$/.test(field)) return field;
  const match = /^questions\.(\d+)(?:\.(prompt|points|correct|alternatives)(?:\.(\d+)\.text)?)?$/.exec(field);
  if (!match) return undefined;
  const row = rows[Number(match[1])];
  if (!row) return undefined;
  const alternative = match[3] === undefined ? undefined : row.alternatives[Number(match[3])];
  if (match[3] !== undefined && !alternative) return undefined;
  return `question-${row.key}-${match[2] ?? "question"}${alternative ? `-${alternative.key}` : ""}`;
}

export function quizDraftFeedback(mutation: MutationFeedback, sentRows: QuestionRow[], rows: QuestionRow[]) {
  const { field } = mutation;
  const message = mutation.message?.includes("JSON máximo 4096 bytes")
    ? "El quiz supera el tamaño permitido. Acorta las instrucciones, los enunciados o las alternativas e inténtalo de nuevo."
    : mutation.message;
  const identity = field && draftFieldIdentity(field, sentRows);
  return {
    general: !identity ? message : undefined,
    field: identity ? field : undefined,
    error: (name: string) => identity && draftFieldIdentity(name, rows) === identity ? message : undefined,
    changed: (target: EventTarget) => !!identity && draftFieldIdentity(quizControlField(target), rows) === identity,
  };
}
