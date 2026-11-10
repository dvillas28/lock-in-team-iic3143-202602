"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useSession } from "../auth/session-provider.tsx";
import type { Session } from "../../lib/auth/session.ts";
import { markdown, title as checkTitle, type Material } from "../../lib/content/validation.ts";
import { pageChanged, pageErrors, pageRoom, type PageValues } from "../../lib/content/page-validation.ts";
import { createMarkdownMaterial, deleteMaterial, updateMaterial } from "../../lib/api/materials.ts";
import { useContentMutation } from "./content-notices.tsx";
import { canEditVisually } from "../../lib/content/markdown-html.ts";
import { MarkdownEditor } from "./markdown-editor.tsx";
import { VisualMarkdownEditor } from "./visual-markdown-editor.tsx";

type Props = {
  session: Session; slug: string; moduleId: string; item?: Material; visibleToStudents?: boolean; disabled: boolean;
  onSaved: () => Promise<boolean | undefined>; onClose: () => void; onBlockedChange?: (blocked: boolean) => void; onDeleted?: () => void;
};
const LOW_ROOM = 500;

function Editor({ session, slug, moduleId, item, visibleToStudents, disabled, onSaved, onClose, onBlockedChange, onDeleted }: Props) {
  const mutation = useContentMutation(session);
  const accessWarning = !!useSession().state.contextWarning;
  const dialog = useRef<HTMLDialogElement>(null), confirmation = useRef<HTMLDialogElement>(null), modal = useRef(true), name = useRef<HTMLInputElement>(null);
  const ids = { heading: useId(), title: useId(), body: useId(), bodyLabel: useId() };
  const original: PageValues | undefined = item && { title: item.title, markdownBody: item.markdownBody };
  const [values, setValues] = useState<PageValues>(original ?? { title: "", markdownBody: "" });
  // Pages with tables, code or other advanced Markdown can't be shown visually without risking loss: they keep the text editor.
  const [visual] = useState(() => canEditVisually(original?.markdownBody ?? ""));
  // A field is validated once it was edited and left (or on a save attempt): focusing it and moving on is not interaction.
  const [edited, setEdited] = useState({ title: false, markdownBody: false });
  const [touched, setTouched] = useState({ title: false, markdownBody: false });
  const edit = (field: keyof PageValues) => setEdited(current => ({ ...current, [field]: true }));
  const leave = (field: keyof PageValues) => { if (edited[field]) setTouched(current => ({ ...current, [field]: true })); };
  const [confirming, setConfirming] = useState(false);
  const errors = pageErrors(values, original), room = pageRoom(values, original);
  const dirty = original ? pageChanged(values, original) : !!(values.title.trim() || values.markdownBody.trim());
  const locked = disabled || accessWarning || mutation.busy || !!mutation.uncertain;
  const shown = (field: keyof PageValues) => (touched[field] || (field === "markdownBody" && room < 0)) ? errors[field] : undefined;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    name.current?.focus();
    return () => element?.close();
  }, []);
  // An unconfirmed write keeps publishing blocked for this page until the list is read again (also after closing the editor).
  useEffect(() => { onBlockedChange?.(mutation.busy || !!mutation.uncertain); }, [mutation.busy, mutation.uncertain, onBlockedChange]);
  // While access is unverified the page shows its own recovery notice, unreachable behind a modal: keep the editor visible but non-modal, then restore it.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (accessWarning && element.open && modal.current) { element.close(); element.show?.(); modal.current = false; }
    else if (!accessWarning && !modal.current) { element.close(); element.showModal(); modal.current = true; }
  }, [accessWarning]);
  // Close only once the confirmation notice was emitted; a stale-list warning keeps the editor open to stay readable.
  useEffect(() => { if (mutation.confirmed && !mutation.persistent) onClose(); }, [mutation.confirmed, mutation.persistent, onClose]);

  function requestClose() {
    if (mutation.busy) return;
    if (dirty && !confirming) { setConfirming(true); return; }
    onClose();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const data = new FormData(event.currentTarget);
    const next = { title: String(data.get("title") ?? ""), markdownBody: String(data.get("markdownBody") ?? "") };
    setValues(next);
    setTouched({ title: true, markdownBody: true });
    const problems = pageErrors(next, original);
    if (problems.title || problems.markdownBody) { (problems.title ? name : dialog).current?.focus(); return; }
    if (!pageChanged(next, original)) return;
    await mutation.run(async current => {
      const fields = { title: checkTitle(next.title), markdownBody: markdown(next.markdownBody) };
      if (item) await session.request(c => updateMaterial(c, slug, item.id, moduleId, {
        ...(fields.title !== item.title ? { title: fields.title } : {}), ...(fields.markdownBody !== item.markdownBody ? { markdownBody: fields.markdownBody } : {}) }), current);
      else await session.request(c => createMarkdownMaterial(c, slug, moduleId, fields), current);
      if (!current()) return;
      const refreshed = await onSaved();
      const message = item ? "Página actualizada." : "Página creada.";
      return refreshed ? message : { message: `${message} No se pudo actualizar la consulta; reintenta solo la lectura.`, persistent: true };
    }, async current => {
      if (!current()) return "Contexto cambiado.";
      const refreshed = await onSaved();
      if (!refreshed) return "No se pudo actualizar la consulta. Revisión manual pendiente.";
      return "Se consultó el estado. Las coincidencias no prueban el origen de este envío ni su ausencia.";
    });
  }
  async function remove() {
    confirmation.current?.close();
    if (!item || locked) return;
    await mutation.run(async current => {
      await session.request(c => deleteMaterial(c, slug, item.id, moduleId), current);
      if (!current()) return;
      const refreshed = await onSaved();
      if (refreshed) onDeleted?.();
      return refreshed ? "Página eliminada." : { message: "Página eliminada. No se pudo actualizar la consulta; reintenta solo la lectura.", persistent: true };
    }, async current => {
      if (!current()) return "Contexto cambiado.";
      const refreshed = await onSaved();
      if (!refreshed) return "No se pudo actualizar la consulta. Revisión manual pendiente.";
      return "Se consultó el estado. Revisa si la página sigue en el módulo antes de repetir la operación.";
    });
  }
  const roomHint = room >= 0 && room <= LOW_ROOM ? `Quedan unos ${room} caracteres disponibles.` : undefined;
  return <dialog ref={dialog} className="modal native-dialog academic-dialog page-editor-dialog" aria-labelledby={ids.heading}
    onCancel={event => { event.preventDefault(); requestClose(); }}>
    <form className="stack" aria-label={item ? `Editar página ${item.title}` : "Crear página"} noValidate onSubmit={submit}>
      <div className="dialog-heading">
        <div><h2 id={ids.heading}>{item ? "Editar página" : "Crear página"}</h2>
          {item && visibleToStudents && <p className="hint">Esta página está publicada: al guardar, los estudiantes verán los cambios.</p>}
          {!item && <p className="hint">La página se guarda como borrador hasta que la publiques.</p>}</div>
        <button type="button" className="btn btn-ghost" aria-label="Cerrar" disabled={mutation.busy} onClick={requestClose}><X size={18} aria-hidden="true" /></button>
      </div>
      <fieldset className="stack" disabled={locked}>
        <div className="stack">
          <label className="field-label" htmlFor={ids.title}>Título de la página</label>
          <input ref={name} id={ids.title} name="title" className="field" defaultValue={values.title} required autoComplete="off"
            aria-invalid={shown("title") ? true : undefined} aria-describedby={shown("title") ? `${ids.title}-error` : undefined}
            onInput={event => { const value = event.currentTarget.value; edit("title"); setValues(current => ({ ...current, title: value })); }} onBlur={() => leave("title")} />
          {shown("title") && <p id={`${ids.title}-error`} className="field-error">{shown("title")}</p>}
        </div>
        <div className="stack">
          <span className="field-label" id={ids.bodyLabel}>Contenido</span>
          {visual
            ? <VisualMarkdownEditor name="markdownBody" initial={values.markdownBody} labelId={ids.bodyLabel} describedBy={shown("markdownBody") || roomHint ? `${ids.body}-note` : undefined}
              invalid={!!shown("markdownBody")} onInput={body => { edit("markdownBody"); setValues(current => ({ ...current, markdownBody: body })); }} onBlur={() => leave("markdownBody")} />
            : <>
              <p className="hint">Esta página usa tablas, código u otro formato avanzado, así que se edita como texto.</p>
              <MarkdownEditor name="markdownBody" defaultValue={values.markdownBody} value={values.markdownBody} labelId={ids.bodyLabel}
                describedBy={shown("markdownBody") || roomHint ? `${ids.body}-note` : undefined} invalid={!!shown("markdownBody")}
                onInput={body => { edit("markdownBody"); setValues(current => ({ ...current, markdownBody: body })); }} onBlur={() => leave("markdownBody")} />
            </>}
          {shown("markdownBody") ? <p id={`${ids.body}-note`} className="field-error">{shown("markdownBody")}</p>
            : roomHint && <p id={`${ids.body}-note`} className="hint">{roomHint}</p>}
        </div>
      </fieldset>
      {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
      {confirming && <div className="discard-confirm" role="alert"><p>Tienes cambios sin guardar. ¿Quieres descartarlos?</p>
        <div className="actions"><button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Seguir editando</button>
          <button type="button" className="btn btn-danger" onClick={onClose}>Descartar cambios</button></div></div>}
      <div className="actions dialog-actions">
        {item && <button type="button" className="btn btn-danger page-delete" disabled={locked} onClick={() => confirmation.current?.showModal()}>Eliminar página</button>}
        <button type="button" className="btn btn-ghost" disabled={mutation.busy} onClick={requestClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={locked || !dirty || !!errors.title || !!errors.markdownBody}>{item ? "Guardar cambios" : "Crear página"}</button>
      </div>
    </form>
    {item && <dialog className="modal native-dialog file-delete-dialog" ref={confirmation} aria-labelledby={`${ids.heading}-delete`}>
      <div className="stack">
        <h2 className="serif" id={`${ids.heading}-delete`}>Eliminar página</h2>
        <p>Se eliminará «{item.title}» del módulo. Esta acción no se puede deshacer.</p>
        {visibleToStudents && <p className="hint">Los estudiantes dejarán de verla.</p>}
        <form method="dialog" className="actions">
          <button type="submit" className="btn btn-ghost">Volver</button>
          <button type="button" className="btn btn-danger" onClick={() => void remove()}>Eliminar página</button>
        </form>
      </div>
    </dialog>}
  </dialog>;
}

/** Create (no `item`) and edit (with `item`) share this single modal; it mounts only while open so every opening starts fresh. */
export function PageEditorDialog({ open, ...props }: Props & { open: boolean }) {
  return open ? <Editor {...props} /> : null;
}
