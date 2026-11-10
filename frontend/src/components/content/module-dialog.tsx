"use client";
import { useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import type { Session } from "../../lib/auth/session.ts";
import type { CourseModule } from "../../lib/content/validation.ts";
import { ModuleForm } from "./module-form.tsx";

/** Native modal shared by "Nuevo módulo" (no item) and "Renombrar" (item preloaded). */
export function ModuleDialog({ session, slug, courseId, item, items, onSaved, disabled }: Readonly<{
  session: Session; slug: string; courseId: string; item?: CourseModule; items: CourseModule[];
  onSaved: () => Promise<boolean | undefined>; disabled: boolean;
}>) {
  const dialog = useRef<HTMLDialogElement>(null), button = useRef<HTMLButtonElement>(null);
  const [openCount, setOpenCount] = useState(0); // remount form on open: fresh/preloaded field, no stale errors
  const titleId = `module-dialog-${item?.id ?? "new"}`;
  const close = () => dialog.current?.close();
  return <>
    <button ref={button} type="button" className={item ? "btn btn-ghost" : "btn btn-primary"} aria-label={item ? `Renombrar ${item.title}` : undefined}
      onClick={() => { setOpenCount(n => n + 1); dialog.current?.showModal(); }}>
      {item ? <Pencil size={14} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{item ? "Renombrar" : "Nuevo módulo"}
    </button>
    <dialog ref={dialog} className="modal native-dialog academic-dialog" aria-labelledby={titleId} onClose={() => button.current?.focus()}>
      <div className="dialog-heading">
        <h2 id={titleId}>{item ? "Renombrar módulo" : "Nuevo módulo"}</h2>
        <button type="button" className="btn btn-ghost" aria-label="Cerrar" onClick={close}><X size={18} aria-hidden="true" /></button>
      </div>
      <ModuleForm key={openCount} session={session} slug={slug} courseId={courseId} item={item} items={items} onSaved={onSaved} onDone={close} onCancel={close} disabled={disabled} />
    </dialog>
  </>;
}
