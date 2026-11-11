import { useId, useState } from "react";
import type { Authoring } from "../../lib/quizzes/validation.ts";
import type { Section } from "../../lib/courses/validation.ts";
import { chileCandidates, chileOffset, chileZone, localChile } from "../../lib/assignments/dates.ts";
import { quizWallTime } from "../../lib/quizzes/form-values.ts";
import type { EvaluationGroup } from "../../lib/api/assignments.ts";
import { EvaluationGroupField } from "../courses/evaluation-group-field.tsx";
import { Field } from "../courses/form-fields.tsx";
export { configuration, localDate } from "../../lib/quizzes/form-values.ts";

export function QuizConfiguration({ item, sections, wholeCourse, groups, error }: {
  item?: Authoring;
  sections: Section[];
  wholeCourse: boolean;
  groups?: EvaluationGroup[];
  error: (field: string) => string | undefined;
}) {
  const destinationId = useId();
  const destinationError = error("sectionId");
  const fields = (name: string) => ({ name, error: error(name), invalid: !!error(name) });
  return <div className="stack quiz-configuration">
    <Field {...fields("title")} label="Título del quiz" value={item?.title}/>
    <div className="form-grid">
      <div className="stack">
        <label className="field-label" htmlFor={destinationId}>Destinatarios</label>
        <select id={destinationId} className="field" name="sectionId"
          defaultValue={item?.sectionId ?? (wholeCourse ? "" : sections[0]?.id)}
          aria-invalid={!!destinationError || undefined} aria-describedby={destinationError ? `${destinationId}-error` : undefined}>
          {wholeCourse && <option value="">Todo el curso</option>}
          {sections.map(s => <option key={s.id} value={s.id}>Sección {s.code}</option>)}
        </select>
        {destinationError && <p className="field-error" id={`${destinationId}-error`}>{destinationError}</p>}
      </div>
      {groups && <EvaluationGroupField key={item?.groupId} groups={groups} value={item?.groupId} kind="Quizzes"/>}
    </div>
    <Field {...fields("instructions")} label="Instrucciones (opcional)" multiline required={false} value={item?.instructions ?? ""}/>
    <div className="form-grid quiz-date-fields">
      <QuizDateField name="opensAt" label="Apertura" original={item?.opensAt} error={error("opensAt")}/>
      <QuizDateField name="closesAt" label="Cierre" original={item?.closesAt} error={error("closesAt")}/>
      <Field {...fields("maxAttempts")} label="Máximo de intentos" type="number" min={1}
        required={false} value={item?.maxAttempts?.toString()} hint="En blanco permite intentos ilimitados."/>
    </div>
    <p className="hint">Fechas opcionales. Zona horaria: {chileZone}.</p>
  </div>;
}

function QuizDateField({ name, label, original, error }: {
  name: "opensAt" | "closesAt";
  label: string;
  original?: string | null;
  error?: string;
}) {
  const [wall, setWall] = useState(() => localChile(original));
  const [choice, setChoice] = useState("");
  const offsetId = useId();
  const candidates = chileCandidates(wall);
  const originalSecond = original ? new Date(original).toISOString().slice(0, 19) : undefined;
  const previousChoice = candidates.find(candidate => candidate.slice(0, 19) === originalSecond);
  return <div className="stack" onInput={event => {
    if (event.target instanceof HTMLInputElement && event.target.name === name) {
      setWall(quizWallTime(event.target.value));
      setChoice("");
    }
  }}>
    <Field name={name} label={label} type="datetime-local" step={1} required={false}
      value={localChile(original)} invalid={!!error} error={error}/>
    {candidates.length > 1 && <div className="stack">
      <label className="field-label" htmlFor={offsetId}>Huso horario de {label.toLowerCase()}</label>
      <select id={offsetId} className="field" name={`${name}Offset`} data-error-field={name}
        value={choice || previousChoice || ""} onChange={event => setChoice(event.target.value)}>
        <option value="" disabled>Selecciona cuál de las dos horas corresponde</option>
        {candidates.map(candidate => <option key={candidate} value={candidate}>{chileOffset(candidate)}</option>)}
      </select>
    </div>}
  </div>;
}
