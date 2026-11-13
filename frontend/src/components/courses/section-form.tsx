"use client";
import { useEffect, useRef, type FormEvent } from "react";
import type { DialogFormControls } from "./course-form.tsx";
import type { Session } from "../../lib/auth/session.ts";
import { text, capacity, changed, FieldError, type Section } from "../../lib/courses/validation.ts";
import { createSection, updateSection, listSections } from "../../lib/api/sections.ts";
import { useMutation } from "./use-mutation.ts";
import { Field } from "./form-fields.tsx";
const belowEnrollments = "El límite de cupos debe cubrir a todos los estudiantes con matrícula activa en la sección.";
const decreaseMessage = (section?: Section) => section?.capacity != null
  ? `No puedes reducir la capacidad. Ingresa ${section.capacity} o más, o deja el campo vacío para que no haya límite.`
  : "No puedes reducir la capacidad configurada.";
export function SectionForm({ session, slug, courseId, section, onSaved, dialog }: {
  session: Session;
  slug: string;
  courseId: string;
  section?: Section;
  onSaved: () => Promise<unknown>;
  dialog?: DialogFormControls;
}) {
  const mutation = useMutation(session, {
    codes: { SECTION_CAPACITY_DECREASE: decreaseMessage(section), SECTION_CAPACITY_BELOW_ENROLLMENTS: belowEnrollments },
    codeFields: { SECTION_CAPACITY_DECREASE: "capacity", SECTION_CAPACITY_BELOW_ENROLLMENTS: "capacity" },
  });
  const limitHint = section?.capacity
    ? `Si mantienes un límite, el mínimo es ${section.capacity}.`
    : "Para fijar un límite, ingresa un entero desde 1.";
  const onBusy = dialog?.onBusy;
  useEffect(() => { onBusy?.(mutation.busy); }, [onBusy, mutation.busy]);
  const formRef = useRef<HTMLFormElement>(null);
  // Like CourseForm: a rejected field takes the focus, so its message is read and fixed in place.
  useEffect(() => {
    if (mutation.field) (formRef.current?.elements.namedItem(mutation.field) as HTMLElement | null)?.focus();
  }, [mutation.field, mutation.message]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    // A number input reports letters or "e" as an empty value: never read that as «sin límite».
    const capacityInput = element.elements.namedItem("capacity") as HTMLInputElement | null;
    await mutation.run(async (current) => {
      if (capacityInput?.validity.badInput) throw new FieldError("capacity", "Ingresa un número entero mayor o igual a 1, o deja el campo vacío para que no haya límite.");
      const body = { code: text(form.get("code"), 32, "code"), capacity: capacity(String(form.get("capacity") ?? "")) };
      if (section && section.capacity !== null && body.capacity !== null && body.capacity < section.capacity)
        throw new FieldError("capacity", decreaseMessage(section));
      if (section)
        await session.request(c => updateSection(c, slug, section.id, courseId, changed(body, section)), current);
      else
        await session.request(c => createSection(c, slug, courseId, body), current);
      if (!current())
        return;
      if (!section) element.reset();
      await onSaved();
      const done = section ? "Sección actualizada." : "Sección creada.";
      dialog?.onDone(done);
      return done;
    }, async (current) => {
      const items = await session.request(c => listSections(c, slug, courseId), current);
      const match = items.some(s => s.code === String(form.get("code")).trim() && s.capacity === capacity(String(form.get("capacity") ?? "")));
      return match ? "Se observó una sección con el mismo código y capacidad; no demuestra autoría del envío." : "Se consultaron las secciones sin resolver el resultado del envío.";
    });
  }
  return <form ref={formRef} className={dialog ? "stack" : "card panel stack"} aria-label={section ? "Configurar sección" : "Crear sección"} onSubmit={submit} noValidate>
    {!dialog && <h3>{section ? "Configurar sección propia" : "Crear sección"}</h3>}
    <fieldset className="stack" disabled={mutation.busy || mutation.uncertain}>
      <div className="form-grid">
        <Field name="code" label="Código de sección" value={section?.code} invalid={mutation.field === 'code'} error={mutation.field === 'code' ? mutation.message : undefined} />
        <Field name="capacity" label="Cupos de estudiantes" value={section?.capacity?.toString()} required={false} type="number" min={Math.max(1, section?.capacity ?? 1)}
          hint={`Solo cuentan las matrículas activas como Estudiante. Deja el campo vacío para permitir cupos ilimitados. ${limitHint}`}
          invalid={mutation.field === 'capacity'} error={mutation.field === 'capacity' ? mutation.message : undefined} />
      </div>
      {dialog ? <div className="actions dialog-actions">
        <button className="btn btn-ghost" type="button" onClick={dialog.onCancel}>Cancelar</button>
        <button className="btn btn-primary" type="submit">{mutation.busy ? "Guardando…" : section ? "Guardar sección" : "Crear sección"}</button>
      </div> : <button className="btn btn-primary" type="submit">{mutation.busy ? "Guardando…" : section ? "Guardar sección" : "Crear sección"}</button>}
    </fieldset>
    {/* A field error is already shown next to its field; only form-level outcomes are repeated here. */}
    {mutation.message && !mutation.field && <p role={mutation.confirmed ? 'status' : 'alert'}>{mutation.message}</p>}</form>;
}
