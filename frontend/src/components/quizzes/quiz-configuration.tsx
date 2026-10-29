import { useId } from "react";
import type { Authoring } from "../../lib/quizzes/validation.ts";
import type { Section } from "../../lib/courses/validation.ts";
import { localDate } from "../../lib/quizzes/form-values.ts";
import { Field } from "../courses/form-fields.tsx";
export { configuration, localDate } from "../../lib/quizzes/form-values.ts";
export function QuizConfiguration({item,sections,wholeCourse,field,message}:{item?: Authoring;sections: Section[];wholeCourse:boolean;field?:string;message?:string}) {
  const destinationId=useId(), attemptsId=useId();
  return <div className="stack quiz-configuration">
    <div className="form-grid">
    <Field name="title" label="Título del quiz" value={item?.title} invalid={field === "title"} error={field === "title" ? message : undefined} />
    <div className="stack"><label className="field-label" htmlFor={destinationId}>Destinatarios</label><select id={destinationId} className="field" name="sectionId" defaultValue={item?.sectionId ?? (wholeCourse ? "" : sections[0]?.id)} aria-invalid={field === "sectionId" || undefined} aria-describedby={field === "sectionId" ? `${destinationId}-error` : undefined}>
      {wholeCourse && <option value="">Todo el curso</option>}{sections.map(s=><option key={s.id} value={s.id}>Sección {s.code}</option>)}
    </select>{field === "sectionId" && <p className="hint" id={`${destinationId}-error`}>{message}</p>}</div></div>
    <Field name="instructions" label="Instrucciones (opcional)" multiline required={false} value={item?.instructions ?? ""} invalid={field === "instructions"} error={field === "instructions" ? message : undefined}/>
    <div className="form-grid quiz-date-fields">
      <Field name="opensAt" label="Apertura" type="datetime-local" required={false} value={localDate(item?.opensAt)} invalid={field === "opensAt"} error={field === "opensAt" ? message : undefined}/>
      <Field name="closesAt" label="Cierre" type="datetime-local" required={false} value={localDate(item?.closesAt)} invalid={field === "closesAt"} error={field === "closesAt" ? message : undefined}/>
      <div className="stack"><label className="field-label" htmlFor={attemptsId}>Máximo de intentos (opcional)</label><input id={attemptsId} className="field tnum" name="maxAttempts" type="number" min="1" max="2147483647" step="1" defaultValue={item?.maxAttempts ?? ""} aria-invalid={field === "maxAttempts" || undefined} aria-describedby={field === "maxAttempts" ? `${attemptsId}-error` : undefined} />{field === "maxAttempts" && <p className="hint" id={`${attemptsId}-error`}>{message}</p>}</div>
    </div>
    <p className="hint">Horarios en {Intl.DateTimeFormat().resolvedOptions().timeZone}. Deja las fechas vacías para no limitar el horario y los intentos vacíos para permitir intentos ilimitados. El cierre debe ser posterior a la apertura.</p>
  </div>;
}
