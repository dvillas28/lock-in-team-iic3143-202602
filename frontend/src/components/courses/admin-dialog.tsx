"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { DialogFormControls } from "./course-form.tsx";

const FOCUSABLE = "button:not(:disabled), a[href], input:not(:disabled):not([type=hidden]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";

/**
 * Course administration in a native modal: the `ModuleDialog` shell (trigger, `.dialog-heading`,
 * focus back to the trigger, fresh form per opening) plus the page editor's discard confirmation,
 * so Cancelar, the close button and Escape never drop typed changes silently or interrupt a write.
 */
export function AdminDialog({ label, title, icon, primary = false, disabled = false, onDone, onClosed, children }: Readonly<{
  label: string;
  title: string;
  icon: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onDone: (message: string) => void;
  onClosed?: () => void;
  children: (controls: DialogFormControls) => ReactNode;
}>) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [opening, setOpening] = useState(0), [open, setOpen] = useState(false);
  return <>
    <button ref={trigger} type="button" className={primary ? "btn btn-primary" : "btn btn-ghost"} aria-haspopup="dialog" disabled={disabled}
      onClick={() => { setOpening(n => n + 1); setOpen(true); }}>
      {icon}{label}
    </button>
    <AdminDialogFrame open={open} opening={opening} title={title} onDone={onDone} onClose={() => setOpen(false)}
      onClosed={() => { trigger.current?.focus(); onClosed?.(); }}>
      {children}
    </AdminDialogFrame>
  </>;
}

/**
 * The `AdminDialog` modal without its trigger, for dialogs opened from elsewhere (a table row).
 * The owner keeps `open`; the frame asks to close through `onClose` and reports the native close
 * through `onClosed`, where focus can return. Busy forms cannot be closed; dirty ones ask first.
 */
export function AdminDialogFrame({ open, opening, title, className, onDone, onClose, onClosed, children }: Readonly<{
  open: boolean;
  /** Changes on every opening, so each one starts with a fresh form. */
  opening: number | string;
  title: string;
  className?: string;
  onDone?: (message: string) => void;
  onClose: () => void;
  onClosed?: () => void;
  children: (controls: DialogFormControls) => ReactNode;
}>) {
  const dialog = useRef<HTMLDialogElement>(null), keep = useRef<HTMLButtonElement>(null), lastField = useRef<HTMLElement | null>(null);
  const [dirty, setDirty] = useState(false), [confirming, setConfirming] = useState(false), [busy, setBusy] = useState(false);
  const titleId = useId();
  useEffect(() => { if (confirming) keep.current?.focus(); }, [confirming]);
  // The native dialog follows `open`; its own close (forced Escape included) reports back in `onClose`.
  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal?.();
    if (!open && element?.open) element.close?.();
  }, [open]);
  function close() { setConfirming(false); setDirty(false); onClose(); }
  function request() {
    if (busy) return;
    if (dirty && !confirming) { setConfirming(true); return; }
    close();
  }
  // `setBusy` and `setDirty` are stable, so forms can report them from an effect.
  const form: DialogFormControls = { onDone: message => { close(); onDone?.(message); }, onCancel: request, onBusy: setBusy, onDirty: setDirty };
  return <dialog ref={dialog} className={`modal native-dialog academic-dialog admin-dialog${className ? ` ${className}` : ""}`} aria-labelledby={titleId}
    aria-busy={busy || undefined}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      // Keep keyboard focus inside the modal instead of escaping to the browser chrome.
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(control => control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onCancel={event => { event.preventDefault(); request(); }}
    onClose={() => { setConfirming(false); setDirty(false); onClose(); onClosed?.(); }}>
    <div className="dialog-heading">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="btn btn-ghost" aria-label="Cerrar" aria-disabled={busy || undefined} onClick={request}><X size={18} aria-hidden="true" /></button>
    </div>
    {/* Browsers fire a select's `input` before its `change`: re-rendering in between restores the controlled value
        and undoes the first pick, so selects mark the form dirty on `change` only. */}
    <div key={opening} className="stack" onInput={event => { if ((event.target as Element).tagName !== "SELECT") setDirty(true); }}
      onChange={() => setDirty(true)}
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
  </dialog>;
}
