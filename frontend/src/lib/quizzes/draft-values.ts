import { configuration, formNumber, formValue } from "./form-values.ts";
import type { Authoring, Question, Update } from "./validation.ts";

export type QuestionRow = Omit<Question, "alternatives"> & {
  key: number;
  alternatives: (Question["alternatives"][number] & { key: number })[];
};

function readQuestions(form: FormData, rows: QuestionRow[]): Question[] {
  return rows.map((q, i) => {
    const field = `questions.${i}`;
    const correct = formValue(form, `correct-${q.key}`);
    return {
      ...(q.id ? { id: q.id } : {}),
      prompt: formValue(form, `${field}.prompt`),
      position: q.position,
      points: formNumber(formValue(form, `${field}.points`), `${field}.points`),
      alternatives: q.alternatives.map((a, j) => ({
        id: formValue(form, `${field}.alternatives.${j}.id`),
        text: formValue(form, `${field}.alternatives.${j}.text`),
        isCorrect: correct === String(a.key),
      })),
    };
  });
}

export function readQuizDraft(form: FormData, rows: QuestionRow[], original?: Authoring) {
  const questions = readQuestions(form, rows);
  const saved = original?.questions;
  // Restoring the saved order must also preserve any existing gaps in its positions.
  if (saved?.length === questions.length && questions.every((question, i) => question.id === saved[i].id))
    questions.forEach((question, i) => { question.position = saved[i].position; });
  return { ...configuration(form, original), questions };
}

function questionSignature(questions?: Question[]) {
  return questions?.map(({ id, position, prompt, points, alternatives }) => [
    id, position, prompt, points, alternatives.map(option => [option.id, option.text, option.isCorrect]),
  ]);
}

export function quizDraftChanges(values: Update, original: Authoring): Update {
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => {
    const previous = original[key as keyof Authoring];
    if (key === "title") return String(value).trim() !== original.title.trim();
    if (key === "questions") return JSON.stringify(questionSignature(values.questions)) !== JSON.stringify(questionSignature(original.questions));
    if (key === "groupId") return (value ?? null) !== (previous ?? null);
    return JSON.stringify(value) !== JSON.stringify(previous);
  }));
}
