"use client";
import { useEffect, type FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { title, markdown, type Material } from "../../lib/content/validation.ts";
import { changed } from "../../lib/courses/validation.ts";
import { createMarkdownMaterial, updateMaterial } from "../../lib/api/materials.ts";
import { Field } from "../courses/form-fields.tsx";
import { useContentMutation } from "./content-notices.tsx";
export function MaterialForm({session, slug, moduleId, item, onSaved, disabled = false, onBlockedChange}: {
  session: Session; slug: string; moduleId: string; item?: Material; onSaved: () => Promise<boolean | undefined>; disabled?: boolean; onBlockedChange?: (blocked: boolean) => void;
}) {
  const mutation = useContentMutation(session);
  useEffect(() => { onBlockedChange?.(mutation.busy || !!mutation.uncertain); }, [mutation.busy, mutation.uncertain, onBlockedChange]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    await mutation.run(async current => {
      const values = { title: title(form.get("title")), markdownBody: markdown(form.get("markdownBody")) };
      if (item) await session.request(c => updateMaterial(c, slug, item.id, moduleId, changed(values, item)), current);
      else await session.request(c => createMarkdownMaterial(c, slug, moduleId, values), current);
      if (!current()) return;
      if (!item) element.reset();
      const refreshed = await onSaved();
      const message = item ? "Material actualizado." : "Material creado.";
      return refreshed ? message : { message: `${message} No se pudo actualizar la consulta; reintenta solo la lectura.`, persistent: true };
    }, async current => {
      if (!current()) return "Contexto cambiado.";
      const refreshed = await onSaved();
      if (!refreshed) return "No se pudo actualizar la consulta. Revisión manual pendiente.";
      return "Se consultó el estado. Las coincidencias no prueban el origen de este envío ni su ausencia.";
    });
  }
  return <form className="stack" aria-label={item ? `Editar material ${item.title}` : "Crear material"} onSubmit={submit} noValidate>
    <h3>{item ? "Editar material" : "Crear material"}</h3>
    <p className="hint">Guardado explícito. Editar reemplaza el contenido, incluso publicado. Sin fusión de ediciones concurrentes.</p>
    <fieldset disabled={disabled || mutation.busy || mutation.uncertain} className="stack">
      <Field name="title" label="Título del material" value={item?.title} invalid={mutation.field === "title"} error={mutation.field === "title" ? mutation.message : undefined} />
      <Field name="markdownBody" label="Contenido markdown" multiline value={item?.markdownBody} invalid={mutation.field === "markdownBody"} error={mutation.field === "markdownBody" ? mutation.message : "Markdown: encabezados, listas, tablas y código. JSON completo: hasta 4096 bytes UTF-8. Imágenes externas deshabilitadas."} />
      <button className="btn btn-primary" type="submit">{item ? "Guardar material" : "Crear material"}</button>
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
  </form>;
}
