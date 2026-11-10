import type { SafeQuiz } from "../quizzes/validation.ts";
import type { Answer } from "./validation.ts";

/** Spreadsheet-style labels: A…Z, AA, AB… so long option lists never repeat a letter. */
export function optionLabel(index: number) {
  let label = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) label = String.fromCharCode(65 + (n - 1) % 26) + label;
  return label;
}

export function attemptProgress(quiz: SafeQuiz, answers: Answer[]) {
  const pending = quiz.questions.flatMap((question, index) =>
    answers.some(answer => answer.questionId === question.id) ? [] : [{ id: question.id, number: index + 1 }]);
  return { total: quiz.questions.length, answered: quiz.questions.length - pending.length, pending };
}

/** True once the quiz window has ended; the server stays the authority. */
export const quizClosed = (closesAt: string | null, now: number) => !!closesAt && Date.parse(closesAt) <= now;
