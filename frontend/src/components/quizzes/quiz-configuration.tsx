import { useId } from "react";
import type { Authoring, Update } from "../../lib/quizzes/validation.ts";
import type { Section } from "../../lib/courses/validation.ts";
import { FieldError } from "../../lib/courses/validation.ts";
import { Field } from "../courses/form-fields.tsx";
// Keep original timestamps byte-for-byte unless the local input changed.
export function localDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,19);
}
export function configuration(form: FormData, original?: Authoring): Update {
  const date = (key: "opensAt" | "closesAt") => {
    const value = String(form.get(key) ?? "");
    if (original && value === localDate(original[key])) return original[key];
    if (!value) return null;
    if (!Number.isFinite(new Date(value).getTime())) throw new FieldError(key,"Ingresa una fecha válida.");
    return new Date(value).toISOString();
  };
  const attempts = String(form.get("maxAttempts") ?? "");
  return {title:String(form.get("title") ?? ""),sectionId:String(form.get("sectionId") ?? "") || null,instructions:original?.instructions === null && form.get("instructions") === "" ? null : String(form.get("instructions") ?? ""),opensAt:date("opensAt"),closesAt:date("closesAt"),maxAttempts:attempts === "" ? null : Number(attempts)};
}
export function QuizConfiguration({item,sections,wholeCourse,field,message}:{item?: Authoring;sections: Section[];wholeCourse:boolean;field?:string;message?:string}) {
  const destinationId=useId();
  return <div className="stack">
    <Field name="title" label="Título del quiz" value={item?.title} invalid={field === "title"} error={field === "title" ? message : undefined} />
    <div className="stack"><label htmlFor={destinationId}>Destinatarios</label><select id={destinationId} className="field" name="sectionId" defaultValue={item?.sectionId ?? (wholeCourse ? "" : sections[0]?.id)} aria-invalid={field === "sectionId" || undefined}>
      {wholeCourse && <option value="">Todo el curso</option>}{sections.map(s=><option key={s.id} value={s.id}>Sección {s.code}</option>)}
    </select></div>
    <Field name="instructions" label="Instrucciones" multiline required={false} value={item?.instructions ?? ""} invalid={field === "instructions"} error={field === "instructions" ? message : undefined}/>
    <p className="hint">Fechas en zona local ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Vacío: sin límite. Intentos vacíos: ilimitados. JSON completo: hasta 4096 bytes UTF-8.</p>
    <div className="form-grid">
      <Field name="opensAt" label="Apertura" type="datetime-local" required={false} value={localDate(item?.opensAt)} invalid={field === "opensAt"} error={field === "opensAt" ? message : undefined}/>
      <Field name="closesAt" label="Cierre" type="datetime-local" required={false} value={localDate(item?.closesAt)} invalid={field === "closesAt"} error={field === "closesAt" ? message : undefined}/>
      <Field name="maxAttempts" label="Máximo de intentos" type="number" required={false} value={item?.maxAttempts?.toString()} invalid={field === "maxAttempts"} error={field === "maxAttempts" ? message : undefined}/>
    </div>
  </div>;
}
