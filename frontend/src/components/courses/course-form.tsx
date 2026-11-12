"use client";
import {useEffect, useRef, useState, type FormEvent, type FocusEvent} from "react";
import type { Session } from "../../lib/auth/session.ts";
import { text, changed, FieldError, type Course } from "../../lib/courses/validation.ts";
import {academicTerm, courseErrors, courseField, normalizedCode, initialCapacity, INITIAL_CAPACITY_MAX, type CourseField, type CourseErrors} from '../../lib/courses/creation.ts';
import { createCourse, updateCourse, listCourses, getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { useMutation } from "./use-mutation.ts";
import { Field } from "./form-fields.tsx";
import {CoursePeriod} from './course-period.tsx';
/** Inside an `AdminDialog` the dialog owns the title; the form adds Cancelar and reports completion. */
export type DialogFormControls = { onDone: (message: string) => void; onCancel: () => void; onBusy: (busy: boolean) => void };
export function CourseForm({ session, slug, course, onSaved, dialog }: {
  session: Session;
  slug: string;
  course?: Course;
  onSaved: () => Promise<unknown>;
  dialog?: DialogFormControls;
}) {
  const mutation = useMutation(session, {
    conflict: {message:'Ya existe un curso con ese código y período en esta institución. Cambia el código o el período.',errors:{code:'Este código ya está registrado para el período seleccionado.',term:'Selecciona otro período o cambia el código del curso.'}},
    fields: {code:'Revisa el código: máximo 32 caracteres, solo letras, números y guiones.',name:'Ingresa un nombre entre 1 y 200 caracteres.',term:'Selecciona un año de la lista y el semestre 1 o 2.',sectionCode:'Revisa el código de sección: máximo 32 caracteres, solo letras, números y guiones.',capacity:'Ingresa una capacidad de 1 a 1.000, o deja vacío.'},
  });
  const formRef=useRef<HTMLFormElement>(null);
  const [errors,setErrors] = useState<CourseErrors>({}), [revision,setRevision] = useState(0);
  const error = (field: CourseField) => errors[field] ?? mutation.errors?.[field] ?? (mutation.field === field ? mutation.message : undefined);
  function focusField(form: HTMLFormElement, field: string) {
    (form.elements.namedItem(field === 'term' ? 'termYear' : field) as HTMLElement | null)?.focus();
  }
  useEffect(()=>{
    if(mutation.field && formRef.current) focusField(formRef.current,mutation.field);
  },[mutation.field,mutation.message]);
  const onBusy = dialog?.onBusy;
  useEffect(()=>{ onBusy?.(mutation.busy); },[onBusy,mutation.busy]);
  function blur(event: FocusEvent<HTMLFormElement>) {
    const control: EventTarget = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
    const field = control.name.startsWith('term') ? 'term' : control.name;
    if (!['code','name','term','sectionCode','capacity'].includes(field)) return;
    if (field === 'code' || field === 'sectionCode') {
      try { if (control.value !== course?.code || field !== 'code') control.value = normalizedCode(control.value,field); }
      catch { /* Keep invalid input visible for correction. */ }
    }
    let message: string | undefined;
    try {
      if(field==='capacity' && control.validity.badInput) throw new FieldError('capacity','Ingresa un número entero entre 1 y 1.000, o deja vacío.');
      courseField(field as CourseField,new FormData(event.currentTarget),course);
    }
    catch (e) { if (e instanceof FieldError) message=e.message; else throw e; }
    setErrors(previous=>({...previous,[field]:message}));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.busy || mutation.uncertain) return;
    const element = event.currentTarget, form = new FormData(element);
    const invalid = courseErrors(form,course);
    const capacityControl=element.elements.namedItem('capacity') as HTMLInputElement | null;
    if(capacityControl?.validity.badInput) invalid.capacity='Ingresa un número entero entre 1 y 1.000, o deja vacío.';
    setErrors(invalid);
    if (Object.keys(invalid).length) { focusField(element,Object.keys(invalid)[0]); return; }
    await mutation.run(async (current) => {
      const values = {code:course && form.get('code') === course.code ? course.code : normalizedCode(form.get('code')),name:text(form.get('name'),200,'name'),term:academicTerm(form.get('term'),course?.term)};
      const saved = course ? await session.request(c => updateCourse(c,slug,course.id,changed(values,course)),current) : await session.request(c => createCourse(c,slug,{...values,initialSection:{code:normalizedCode(form.get('sectionCode'),'sectionCode'),capacity:initialCapacity(String(form.get('capacity') ?? ''))}}),current);
      if (!current()) return;
      if (!course) { element.reset(); setRevision(n=>n+1); setErrors({}); }
      if (!course) await session.request(c => listSections(c,slug,saved.id),current);
      if (!current()) return;
      await onSaved();
      if (!course) await session.loadContext(slug);
      const done = course ? "Curso actualizado." : "Curso creado.";
      dialog?.onDone(done);
      return done;
    }, async (current) => {
      if (course) { await session.request(c=>getCourse(c,slug,course.id),current); return "Se consultó la configuración actual."; }
      const items = await session.request(c=>listCourses(c,slug),current);
      const matches = items.filter(c=>c.code.toUpperCase() === String(form.get('code')).trim().toUpperCase() && c.term === form.get('term'));
      return matches.length ? "Existe un curso con ese código y período. Revisa el listado antes de repetir." : "No se pudo confirmar la creación. Revisa el listado antes de repetir.";
    });
  }
  const errorCount = (['code','name','term','sectionCode','capacity'] as const).filter(field=>error(field)).length;
  return <form ref={formRef} key={revision} aria-label={course ? "Configurar curso" : "Crear curso"} className={dialog ? "stack" : "card panel stack"} onSubmit={submit} onBlur={blur} onChange={event=>{
    mutation.clearErrors();
    const control: EventTarget=event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
    const field=control.name.startsWith('term')?'term':control.name;
    setErrors(previous=>({...previous,[field]:undefined}));
  }} noValidate>
    {!dialog && <h2>{course ? "Configurar curso propio" : "Crear curso"}</h2>}
    {errorCount>0 && <p className="notice" role="alert">Revisa {errorCount === 1 ? 'el campo marcado' : `los ${errorCount} campos marcados`}. Los datos que ingresaste se conservan.</p>}
    <fieldset disabled={mutation.busy || mutation.uncertain} className="stack">
      <div className="form-grid">
        <Field name="code" label="Código" value={course?.code} maxLength={32} invalid={!!error('code')} error={error('code')} hint="Ej.: IIC3143."/>
        <Field name="name" label="Nombre" value={course?.name} maxLength={200} invalid={!!error('name')} error={error('name')} hint="Máximo 200 caracteres."/>
      </div>
      <CoursePeriod value={course?.term} error={error('term')}/>
      {!course && <div className="form-grid">
        <Field name="sectionCode" label="Código de sección inicial" maxLength={32} invalid={!!error('sectionCode')} error={error('sectionCode')} hint="Máximo 32 caracteres. Ej.: 1 o A-1. Letras, números y guiones."/>
        <Field name="capacity" label="Capacidad inicial" required={false} type="number" min={1} max={INITIAL_CAPACITY_MAX} invalid={!!error('capacity')} error={error('capacity')} hint="Deja vacío para no limitar la capacidad."/>
      </div>}
      {dialog ? <div className="actions dialog-actions">
        <button className="btn btn-ghost" type="button" onClick={dialog.onCancel}>Cancelar</button>
        <button className="btn btn-primary" type="submit">{mutation.busy ? "Guardando…" : course ? "Guardar curso" : "Crear curso"}</button>
      </div> : <button className="btn btn-primary" type="submit">{mutation.busy ? "Guardando…" : course ? "Guardar curso" : "Crear curso"}</button>}
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? 'status' : 'alert'}>{mutation.message}</p>}
  </form>;
}
