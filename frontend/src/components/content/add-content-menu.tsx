"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { ChevronDown, ClipboardList, FileText, Plus, Upload } from "lucide-react";

export type ContentAction = "file" | "page" | "quiz";
const actions = [
  { id: "file", label: "Subir archivo", hint: "Agrega un PDF, documento u otro archivo", Icon: Upload },
  { id: "page", label: "Crear página", hint: "Escribe contenido directamente en AcademiX", Icon: FileText },
  { id: "quiz", label: "Enlazar cuestionario", hint: "Agrega un cuestionario existente del curso", Icon: ClipboardList },
] as const;

/** One primary action that opens a small menu (keyboard: arrows, Home/End, Escape; closes on outside click). */
export function AddContentMenu({ onSelect, triggerRef, disabled }: Readonly<{
  onSelect: (action: ContentAction) => void; triggerRef: RefObject<HTMLButtonElement | null>; disabled: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const items = () => Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const away = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  function keys(event: KeyboardEvent) {
    const list = items(), at = list.indexOf(document.activeElement as HTMLElement);
    const go = (index: number) => { event.preventDefault(); list[(index + list.length) % list.length]?.focus(); };
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    else if (event.key === "ArrowDown") go(at + 1);
    else if (event.key === "ArrowUp") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(list.length - 1);
    else if (event.key === "Tab") setOpen(false);
  }
  return <div className="add-content" ref={root} onKeyDown={keys}>
    <button ref={triggerRef} type="button" className="btn btn-primary" aria-haspopup="menu" aria-expanded={open} disabled={disabled}
      onClick={() => setOpen(value => !value)}>
      <Plus size={16} aria-hidden="true" />Añadir contenido<ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div className="add-content-menu card" role="menu" aria-label="Añadir contenido">
      {actions.map(({ id, label, hint, Icon }) => <button key={id} type="button" role="menuitem" className="add-content-item"
        onClick={() => { setOpen(false); onSelect(id); }}>
        <Icon size={18} aria-hidden="true" /><span><strong>{label}</strong><small>{hint}</small></span>
      </button>)}
    </div>}
  </div>;
}
