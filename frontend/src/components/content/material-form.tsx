"use client";
import type { FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { title, markdown, type Material } from "../../lib/content/validation.ts";
import { changed } from "../../lib/courses/validation.ts";
import { createMarkdownMaterial, updateMaterial, getMaterial, listModuleMaterials } from "../../lib/api/materials.ts";
import { Field } from "../courses/form-fields.tsx";
import { useMutation } from "../courses/use-mutation.ts";
export function MaterialForm({session, slug, moduleId, item, onSaved, disabled = false}: {
  session: Session; slug: string; moduleId: string; item?: Material; onSaved: () => Promise<boolean | undefined>; disabled?: boolean;
}) {
  const mutation = useMutation(session);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const form = new FormData(event.currentTarget);
    await mutation.run(async current => {
      const values = { title: title(form.get("title")), markdownBody: markdown(form.get("markdownBody")) };
      if (item) await session.request(c => updateMaterial(c, slug, item.id, moduleId, changed(values, item)), current);
      else await session.request(c => createMarkdownMaterial(c, slug, moduleId, values), current);
      if (!current()) return;
      const refreshed = await onSaved();
      return refreshed ? "Cambio confirmado." : "Cambio confirmado. No se pudo actualizar la consulta; reintenta solo la lectura.";
    }, async current => {
      if (item) await session.request(c => getMaterial(c, slug, item.id, moduleId), current);
      else await session.request(c => listModuleMaterials(c, slug, moduleId), current);
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
      <Field name="markdownBody" label="Contenido markdown" multiline value={item?.markdownBody} invalid={mutation.field === "markdownBody"} error={mutation.field === "markdownBody" ? mutation.message : "Texto sin formato enriquecido. JSON completo: hasta 4096 bytes UTF-8."} />
      <button className="btn btn-primary" type="submit">{item ? "Guardar material" : "Crear material"}</button>
    </fieldset>
    {mutation.message && <p role={mutation.message.startsWith("Cambio confirmado.") ? "status" : "alert"}>{mutation.message}</p>}
  </form>;
}
