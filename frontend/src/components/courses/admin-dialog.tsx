"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { DialogFormControls } from "./course-form.tsx";

/**
 * Course administration in a native modal: the `ModuleDialog` shell (trigger, `.dialog-heading`,
 * focus back to the trigger, fresh form per opening) plus the page editor's discard confirmation,
 * so Cancelar, the close button and Escape never drop typed changes silently or interrupt a write.
 */
export function AdminDialog({ label, title, icon, primary = false, disabled = false, onDone, children }: Readonly<{
  label: string;
  title: string;
  icon: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onDone: (message: string) => void;
  children: (controls: DialogFormControls) => ReactNode;
}>) {
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), keep = useRef<HTMLButtonElement>(null),
    lastField = useRef<HTMLElement | null>(null);
  const [opening, setOpening] = useState(0), [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false), [confirming, setConfirming] = useState(false), [busy, setBusy] = useState(false);
  const titleId = useId();
  useEffect(() => { if (confirming) keep.current?.focus(); }, [confirming]);
  // The native dialog follows `open`; its own close (forced Escape included) reports back in `onClose`.
  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal?.();
    if (!open && element?.open) element.close?.();
  }, [open]);
  function close() { setConfirming(false); setDirty(false); setOpen(false); }
  function request() {
    if (busy) return;
    if (dirty && !confirming) { setConfirming(true); return; }
    close();
  }
  // `setBusy` is stable, so forms can report it from an effect.
  const form: DialogFormControls = { onDone: message => { close(); onDone(message); }, onCancel: request, onBusy: setBusy };
  return <>
    <button ref={trigger} type="button" className={primary ? "btn btn-primary" : "btn btn-ghost"} aria-haspopup="dialog" disabled={disabled}
      onClick={() => { setOpening(n => n + 1); setDirty(false); setConfirming(false); setOpen(true); }}>
      {icon}{label}
    </button>
    <dialog ref={dialog} className="modal native-dialog academic-dialog admin-dialog" aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); request(); }}
      onClose={() => { setConfirming(false); setDirty(false); setOpen(false); trigger.current?.focus(); }}>
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="btn btn-ghost" aria-label="Cerrar" onClick={request}><X size={18} aria-hidden="true" /></button>
      </div>
      <div key={opening} className="stack" onInput={() => setDirty(true)} onChange={() => setDirty(true)}
        onFocus={event => { lastField.current = event.target; }}>
        {children(form)}
      </div>
      {confirming && <div className="discard-confirm" role="alert">
        <p>Tienes cambios sin guardar. ¿Quieres descartarlos?</p>
        <div className="actions">
          <button ref={keep} type="button" className="btn btn-ghost" onClick={() => { setConfirming(false); lastField.current?.focus(); }}>Seguir editando</button>
          <button type="button" className="btn btn-danger" onClick={close}>Descartar cambios</button>
        </div>
      </div>}
    </dialog>
  </>;
}
