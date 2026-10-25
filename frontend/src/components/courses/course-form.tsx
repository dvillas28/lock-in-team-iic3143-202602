"use client";
import type { FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { text, capacity, changed, type Course } from "../../lib/courses/validation.ts";
import { createCourse, updateCourse, listCourses, getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { useMutation } from "./use-mutation.ts";
import { Field } from "./form-fields.tsx";
export function CourseForm({ session, slug, course, onSaved }: {
  session: Session;
  slug: string;
  course?: Course;
  onSaved: () => Promise<unknown>;
}) {
  const mutation = useMutation(session);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    await mutation.run(async (current) => {
      const values = { code: text(form.get("code"), 32, "code"), name: text(form.get("name"), 200, "name"), term: text(form.get("term"), 16, "term") };
      const saved = course ? await session.request(c => updateCourse(c, slug, course.id, changed(values, course)), current) : await session.request(c => createCourse(c, slug, { ...values, initialSection: { code: text(form.get("sectionCode"), 32, "sectionCode"), capacity: capacity(String(form.get("capacity") ?? "")) } }), current);
      if (!current())
        return;
      if (!course) element.reset();
      if (!course)
        await session.request(c => listSections(c, slug, saved.id), current);
      if (!current())
        return;
      await onSaved();
      if (!course)
        await session.loadContext(slug);
      return course ? "Curso actualizado." : "Curso creado.";
    }, async (current) => {
      if (course) {
        await session.request(c => getCourse(c, slug, course.id), current);
        return "Se consultó la configuración actual.";
      }
      const items = await session.request(c => listCourses(c, slug), current);
      const matches = items.filter(c => c.code === String(form.get("code")).trim() && c.term === String(form.get("term")).trim());
      return matches.length ? "Existe una coincidencia de código y período; no demuestra que provenga de este envío." : "No se observó una coincidencia; no confirma que el envío no se haya procesado.";
    });
  }
  return <form aria-label={course ? "Configurar curso" : "Crear curso"} className="card panel stack" onSubmit={submit} noValidate>
    <h2>{course ? "Configurar curso propio" : "Crear curso"}</h2>
    <fieldset disabled={mutation.busy || mutation.uncertain} className="stack">
      <div className="form-grid">{([['code', 'Código', 32], ['name', 'Nombre', 200], ['term', 'Período', 16]] as const).map(([name, label, max]) => <Field key={name} name={name} label={label} value={course?.[name]} maxLength={max * 2} invalid={mutation.field === name} error={mutation.field === name ? mutation.message : undefined} />)}</div>
      {!course && <div className="form-grid">
        <Field name="sectionCode" label="Código de sección inicial" invalid={mutation.field === 'sectionCode'} error={mutation.field === 'sectionCode' ? mutation.message : undefined} />
        <Field name="capacity" label="Capacidad inicial (vacío: sin límite)" required={false} type="number" invalid={mutation.field === 'capacity'} error={mutation.field === 'capacity' ? mutation.message : undefined} />
      </div>}
      <button className="btn btn-primary" type="submit">{mutation.busy ? "Guardando…" : course ? "Guardar curso" : "Crear curso"}</button>
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? 'status' : 'alert'}>{mutation.message}</p>}
  </form>;
}
