import type { Section } from "../../lib/courses/validation.ts";
import type { Authoring } from "../../lib/quizzes/validation.ts";
import type { EvaluationGroup } from "../../lib/api/assignments.ts";
import { QuestionEditor } from "./question-editor.tsx";
import type { QuestionRow } from "../../lib/quizzes/draft-values.ts";
import { QuizConfiguration } from "./quiz-configuration.tsx";

export function QuizDraftFields({ item, groups, sections, wholeCourse, rows, onRows, error }: {
  item?: Authoring;
  groups?: EvaluationGroup[];
  sections: Section[];
  wholeCourse: boolean;
  rows: QuestionRow[];
  onRows: (rows: QuestionRow[], removedCorrect?: number) => void;
  error: (field: string) => string | undefined;
}) {
  return <>
    <section className="card panel stack quiz-settings">
      <h2 className="serif">Configuración</h2>
      <QuizConfiguration item={item} groups={groups} sections={sections} wholeCourse={wholeCourse} error={error}/>
    </section>
    <QuestionEditor rows={rows} onRows={onRows} error={error}/>
  </>;
}
