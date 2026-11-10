"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { FieldError, type Section } from "../../lib/courses/validation.ts";
import { checkNativeInputs, focusQuizError, formNumber, formValue } from "../../lib/quizzes/form-values.ts";
import { chileFormWall, chileInstant, localChile, validateDueAt, validateSchedule } from "../../lib/assignments/dates.ts";
import type { Assignment, AssignmentCreate, EvaluationGroup } from "../../lib/api/assignments.ts";
import { Field } from "../courses/form-fields.tsx";
import { AssignmentDateField } from "./assignment-date-field.tsx";
import { EvaluationGroupField } from "../courses/evaluation-group-field.tsx";
import { AssignmentFormatSelector, isAssignmentFormatExtension } from "./assignment-format-selector.tsx";

const schedule = {
  availableFrom:{label:"Apertura",timeLabel:"Hora de apertura"},
  dueAt:{label:"Entrega",timeLabel:"Hora de entrega"},
  availableUntil:{label:"Cierre",timeLabel:"Hora de cierre"},
} as const;
type DateKey = keyof typeof schedule;
type Draft = Omit<AssignmentCreate,"id">;
const attemptsError = "Ingresa al menos 1 intento o deja el campo vacío para permitir intentos ilimitados";

function values(form: HTMLFormElement, original?: Assignment): Draft {
  checkNativeInputs(form);
  const data = new FormData(form);
  const field = (name: string) => formValue(data,name).trim();
  const points = field("maxPoints").replace(",",".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(points) || Number(points)>999999.99) {
    throw new FieldError("maxPoints","Ingresa un puntaje entre 0 y 999999,99, con hasta dos decimales.");
  }
  if (!field("title")) throw new FieldError("title","Ingresa un título.");
  const allowedExtensions = [...new Set(field("allowedExtensions").split(/[\s,]+/).filter(Boolean))];
  if (!original && allowedExtensions.length === 0) {
    throw new FieldError("allowedExtensions","Selecciona al menos un formato de archivo.");
  }
  if (!original && allowedExtensions.some(extension => !isAssignmentFormatExtension(extension))) {
    throw new FieldError("allowedExtensions","Selecciona solo formatos de archivo permitidos.");
  }
  if (allowedExtensions.length>30 || allowedExtensions.some(v=>!/^\.?[a-z0-9]{1,16}$/i.test(v))) {
    throw new FieldError("allowedExtensions","Ingresa hasta 30 extensiones, como pdf, docx o zip.");
  }
  const date = (key: DateKey) => chileInstant(
    chileFormWall(field(`${key}Date`),field(`${key}Time`),key,original?.[key]),key,original?.[key],field(`${key}Offset`),
  );
  const dates = {availableFrom:date("availableFrom"),dueAt:date("dueAt"),availableUntil:date("availableUntil")};
  validateSchedule(dates);
  validateDueAt(dates.dueAt,original?.dueAt,Date.now());
  return {
    title:field("title"), description:field("description") || null, instructions:field("instructions") || null,
    sectionId:field("sectionId") || null, groupId:field("groupId") || null, maxPoints:Number(points),
    allowedExtensions, maxAttempts:field("maxAttempts") ? formNumber(field("maxAttempts"),"maxAttempts",true) : null, ...dates,
  };
}

export function AssignmentForm({assignment,groups,sections,wholeCourse,busy,uncertain,blocked,now,onSave,onCancel}:{
  assignment?: Assignment; groups: EvaluationGroup[]; sections: Section[]; wholeCourse: boolean;
  busy: boolean; uncertain: boolean; blocked: boolean; now: number;
  onSave: (draft?: Draft, publish?: boolean) => void; onCancel: () => void;
}) {
  const [error,setError] = useState<FieldError>();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(()=>heading.current?.focus(),[]);
  const form = useRef<HTMLFormElement>(null);
  const sectionId = useId();
  const [scheduleDraft,setScheduleDraft] = useState<Partial<Record<DateKey,{wall:string;choice:string}>>>({});
  function validateLive(next: Partial<Record<DateKey,{wall:string;choice:string}>>) {
    try {
      const dates = Object.fromEntries((Object.keys(schedule) as DateKey[]).map(key => {
        const draft = next[key];
        const previous = assignment?.[key];
        const wall = draft?.wall ?? (previous ? localChile(previous) : "");
        const choice = draft?.choice ?? "";
        return [key, wall ? chileInstant(wall,key,previous,choice) : null];
      })) as Record<DateKey,string|null>;
      validateSchedule(dates);
      validateDueAt(dates.dueAt,assignment?.dueAt,now);
      setError(current => current?.field === "availableFrom" || current?.field === "dueAt" || current?.field === "availableUntil" ? undefined : current);
    } catch (err) {
      if (err instanceof FieldError) setError(err);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const draft = values(event.currentTarget,assignment);
      setError(undefined);
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      onSave(draft,submitter?.getAttribute("value")==="publish");
    } catch (err) {
      if (!(err instanceof FieldError)) throw err;
      setError(err);
      focusQuizError(form.current,err.field);
    }
  }
  const issue = (field: string) => error?.field === field ? {error:error.message,invalid:true} : {};
  return <section className="card panel stack assignment-editor" aria-labelledby={titleId}>
    <div><h2 id={titleId} ref={heading} tabIndex={-1}>{assignment ? "Editar tarea" : "Nueva tarea"}</h2>
      <p className="hint">{assignment ? "Actualiza el contenido y las condiciones de esta tarea." : "Guarda un borrador para continuar después o publica la tarea para tus estudiantes."}</p></div>
    <form className="stack" ref={form} onSubmit={submit} onInput={event=>{
      const target = event.target;
      const name = target instanceof HTMLElement ? target.getAttribute("name") : null;
      if (name === "maxAttempts" && target instanceof HTMLInputElement) {
        try {
          if (target.validity.badInput || target.value !== "") {
            if (target.validity.badInput) throw new FieldError("maxAttempts", attemptsError);
            const attempts = formNumber(target.value, "maxAttempts", true);
            if (attempts < 1) throw new FieldError("maxAttempts", attemptsError);
          }
          setError(current => current?.field === "maxAttempts" ? undefined : current);
        } catch {
          setError(new FieldError("maxAttempts", attemptsError));
        }
        return;
      }
      if (error && name && !["availableFrom","dueAt","availableUntil"].some(key=>name.startsWith(key)) &&
          name.startsWith(error.field)) setError(undefined);
    }} aria-labelledby={titleId} aria-busy={busy}>
      <fieldset className="stack" disabled={busy || uncertain || blocked}>
        <section className="stack assignment-form-section">
          <h3>Información general</h3>
          <div className="form-grid">
            <Field name="title" label="Título" value={assignment?.title} maxLength={200} {...issue("title")}/>
            <div className="stack"><label className="field-label" htmlFor={sectionId}>Destinatarios</label>
              <select id={sectionId} name="sectionId" className="field" defaultValue={assignment ? assignment.sectionId ?? "" : wholeCourse ? "" : sections[0]?.id}>
                {wholeCourse && <option value="">Todo el curso</option>}
                {sections.map(s=><option key={s.id} value={s.id}>Sección {s.code}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid assignment-form-copy">
            <Field name="description" label="Descripción breve" value={assignment?.description ?? ""} multiline required={false} maxLength={2000}/>
            <Field name="instructions" label="Instrucciones" value={assignment?.instructions ?? ""} multiline required={false} maxLength={10000}/>
          </div>
        </section>
        <section className="stack assignment-form-section">
          <h3>Evaluación</h3>
          <div className="form-grid">
            <EvaluationGroupField groups={groups} value={assignment?.groupId} kind="Tareas"/>
            <Field name="maxPoints" label="Puntaje máximo" type="number" min={0} max={999999.99} step={0.01}
              value={String(assignment?.maxPoints ?? 0)} {...issue("maxPoints")}/>
          </div>
        </section>
        <section className="stack assignment-form-section assignment-schedule">
          <div><h3>Disponibilidad</h3>
            <p className="hint">Fechas opcionales · Hora de Santiago de Chile</p></div>
          <div className="form-grid">{Object.keys(schedule).map(name=>{
            const key = name as DateKey;
            return <AssignmentDateField key={key} name={key} {...schedule[key]} original={assignment?.[key]}
              dateError={issue(key).error} timeError={issue(`${key}Time`).error}
              onScheduleChange={(wall,choice)=>{
                const next={...scheduleDraft,[key]:{wall,choice}};
                setScheduleDraft(next);
                validateLive(next);
              }}/>;
          })}</div>
        </section>
        <section className="stack assignment-form-section">
          <h3>Condiciones de entrega</h3>
          <div className="form-grid assignment-delivery-grid">
            <AssignmentFormatSelector value={assignment?.allowedExtensions ?? []} required={!assignment} {...issue("allowedExtensions")}
              onChange={()=>{ if (error?.field === "allowedExtensions") setError(undefined); }}/>
            <Field name="maxAttempts" label="Máximo de intentos" type="number" min={1} required={false}
              value={assignment?.maxAttempts?.toString()} hint="En blanco permite intentos ilimitados." {...issue("maxAttempts")}/>
          </div>
        </section>
      </fieldset>
      {blocked && <p role="alert" className="notice">La tarea cambió. Cierra el formulario y vuelve a abrirlo para editar la versión actual.</p>}
      {uncertain && <p role="status" className="notice">El guardado quedó sin confirmar. Puedes repetir la misma operación de forma segura.</p>}
      <div className="actions">
        {uncertain ? <button type="button" className="btn btn-primary" disabled={busy} onClick={()=>onSave()}>Reintentar guardado</button> :
          <>
            <button type="submit" className={assignment?.status==="published" ? "btn btn-primary" : "btn btn-ghost"}
              disabled={busy || blocked}>{busy ? "Guardando…" : assignment ? "Guardar cambios" : "Guardar borrador"}</button>
            {assignment?.status!=="published" && <button type="submit" value="publish" className="btn btn-primary"
              disabled={busy || blocked}>{assignment?.status==="hidden" ? "Volver a publicar" : "Publicar tarea"}</button>}
          </>}
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancelar</button>
      </div>
    </form>
  </section>;
}
