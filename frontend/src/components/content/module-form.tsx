"use client";
import type { FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { title, nextPosition, type CourseModule } from "../../lib/content/validation.ts";
import { changed } from "../../lib/courses/validation.ts";
import { createCourseModule, updateCourseModule, listCourseModules, getCourseModule } from "../../lib/api/modules.ts";
import { Field } from "../courses/form-fields.tsx";
import { useMutation } from "../courses/use-mutation.ts";
export function ModuleForm({session, slug, courseId, item, items, onSaved, disabled = false}: {
  session: Session; slug: string; courseId: string; item?: CourseModule; items: CourseModule[]; onSaved: () => Promise<boolean | undefined>; disabled?: boolean;
}) {
  const mutation = useMutation(session);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    await mutation.run(async current => {
      const values = {title: title(form.get("title"))};
      if (item) await session.request(c => updateCourseModule(c, slug, item.id, courseId, changed(values, item) as {title: string}), current);
      else await session.request(c => createCourseModule(c, slug, courseId, {...values, position: nextPosition(items)}), current);
      if (!current()) return;
      if (!item) element.reset();
      const refreshed = await onSaved();
      const message = item ? "Módulo actualizado." : "Módulo creado.";
      return refreshed ? message : `${message} No se pudo actualizar la consulta; reintenta solo la lectura.`;
    }, async current => {
      if (item) await session.request(c => getCourseModule(c, slug, item.id, courseId), current);
      else await session.request(c => listCourseModules(c, slug, courseId), current);
      if (!current()) return "Contexto cambiado.";
      const refreshed = await onSaved();
      if (!refreshed) return "No se pudo actualizar la consulta. Revisión manual pendiente.";
      return "Se consultó el estado. Las coincidencias no prueban el origen de este envío ni su ausencia.";
    });
  }
  return <form className="stack" aria-label={item ? `Editar módulo ${item.title}` : "Crear módulo"} onSubmit={submit} noValidate>
    <h3>{item ? "Editar módulo" : "Crear módulo"}</h3>
    <fieldset disabled={disabled || mutation.busy || mutation.uncertain} className="stack">
      <Field name="title" label="Título del módulo" value={item?.title} invalid={mutation.field === "title"} error={mutation.field === "title" ? mutation.message : undefined} />
      <button className="btn btn-primary" type="submit">{item ? "Guardar módulo" : "Crear módulo"}</button>
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
  </form>;
}
