"use client";
import type { FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { title, nextPosition, type CourseModule } from "../../lib/content/validation.ts";
import { changed } from "../../lib/courses/validation.ts";
import { createCourseModule, updateCourseModule } from "../../lib/api/modules.ts";
import { Field } from "../courses/form-fields.tsx";
import { useContentMutation } from "./content-notices.tsx";
export function ModuleForm({session, slug, courseId, item, items, onSaved, onDone, onCancel, disabled = false}: {
  session: Session; slug: string; courseId: string; item?: CourseModule; items: CourseModule[]; onSaved: () => Promise<boolean | undefined>; onDone?: () => void; onCancel?: () => void; disabled?: boolean;
}) {
  const mutation = useContentMutation(session);
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
      onDone?.();
      const refreshed = await onSaved();
      const message = item ? "Módulo actualizado." : "Módulo creado.";
      return refreshed ? message : { message: `${message} No se pudo actualizar la consulta; reintenta solo la lectura.`, persistent: true };
    }, async current => {
      if (!current()) return "Contexto cambiado.";
      const refreshed = await onSaved();
      if (!refreshed) return "No se pudo actualizar la consulta. Revisión manual pendiente.";
      return "Se consultó el estado. Las coincidencias no prueban el origen de este envío ni su ausencia.";
    });
  }
  return <form className="stack" aria-label={item ? `Editar módulo ${item.title}` : "Crear módulo"} onSubmit={submit} noValidate>
    <fieldset disabled={disabled || mutation.busy || mutation.uncertain} className="stack">
      <Field name="title" label="Título del módulo" hint="Por ejemplo: Semana 1 · Introducción." value={item?.title} invalid={mutation.field === "title"} error={mutation.field === "title" ? mutation.message : undefined} />
      <div className="actions">
        {onCancel && <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancelar</button>}
        <button className="btn btn-primary" type="submit">{item ? "Guardar cambios" : "Crear módulo"}</button>
      </div>
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
  </form>;
}
