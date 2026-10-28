"use client";
import type { FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { text, capacity, changed, type Section } from "../../lib/courses/validation.ts";
import { createSection, updateSection, listSections } from "../../lib/api/sections.ts";
import { useMutation } from "./use-mutation.ts";
import { Field } from "./form-fields.tsx";
export function SectionForm({ session, slug, courseId, section, onSaved }: {
  session: Session;
  slug: string;
  courseId: string;
  section?: Section;
  onSaved: () => Promise<unknown>;
}) {
  const mutation = useMutation(session);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    await mutation.run(async (current) => {
      const body = { code: text(form.get("code"), 32, "code"), capacity: capacity(String(form.get("capacity") ?? "")) };
      if (section)
        await session.request(c => updateSection(c, slug, section.id, courseId, changed(body, section)), current);
      else
        await session.request(c => createSection(c, slug, courseId, body), current);
      if (!current())
        return;
      if (!section) element.reset();
      await onSaved();
      return section ? "Sección actualizada." : "Sección creada.";
    }, async (current) => {
      const items = await session.request(c => listSections(c, slug, courseId), current);
      const match = items.some(s => s.code === String(form.get("code")).trim() && s.capacity === capacity(String(form.get("capacity") ?? "")));
      return match ? "Se observó una sección con el mismo código y capacidad; no demuestra autoría del envío." : "Se consultaron las secciones sin resolver el resultado del envío.";
    });
  }
  return <form className="card panel stack" aria-label={section ? "Configurar sección" : "Crear sección"} onSubmit={submit} noValidate>
    <h3>{section ? "Configurar sección propia" : "Crear sección"}</h3>
    <fieldset className="stack" disabled={mutation.busy || mutation.uncertain}>
      <div className="form-grid">
        <Field name="code" label="Código de sección" value={section?.code} invalid={mutation.field === 'code'} error={mutation.field === 'code' ? mutation.message : undefined} />
        <Field name="capacity" label="Capacidad (vacío: sin límite)" value={section?.capacity?.toString()} required={false} type="number" invalid={mutation.field === 'capacity'} error={mutation.field === 'capacity' ? mutation.message : undefined} />
      </div>
      <button className="btn btn-primary" type="submit">{mutation.busy ? "Guardando…" : section ? "Guardar sección" : "Crear sección"}</button>
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? 'status' : 'alert'}>{mutation.message}</p>}</form>;
}
