"use client";
import { useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Session } from "../../lib/auth/session.ts";
import type { GradeItems } from "../../lib/gradebook/validation.ts";
import { useContentNotice } from "../content/content-notices.tsx";
import { WeightsForm } from "./weights-form.tsx";

export function WeightsDialog({ session, slug, courseId, configuration, busy, onSaved }: Readonly<{
  session: Session; slug: string; courseId: string; configuration: GradeItems; busy: boolean;
  onSaved: () => Promise<void>;
}>) {
  const [draft, setDraft] = useState<GradeItems>(),
    [saving, setSaving] = useState(false);
  const notify = useContentNotice();
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  function close() {
    dialog.current?.close();
  }
  return <>
    <button ref={trigger} type="button" className="btn btn-ghost" disabled={busy} onClick={() => {
      setDraft(configuration);
      dialog.current?.showModal();
    }}>
      <SlidersHorizontal size={16} aria-hidden /><span>Ponderaciones</span>
    </button>
    <dialog ref={dialog} className="modal native-dialog academic-dialog grade-plan"
      aria-labelledby="weights-title"
      onCancel={e => { if (saving) e.preventDefault(); }}
      onClose={() => { setDraft(undefined); trigger.current?.focus(); }}>
      <div className="dialog-heading">
        <div>
          <h2 id="weights-title">Ponderaciones del curso</h2>
          <p className="hint">Organiza las evaluaciones y decide cuánto aporta cada grupo al promedio.</p>
        </div>
        <button type="button" className="btn btn-ghost" aria-label="Cerrar" disabled={saving} onClick={close}>
          <X size={18} aria-hidden />
        </button>
      </div>
      {draft && <WeightsForm session={session} slug={slug} courseId={courseId} initial={draft}
        onBusy={setSaving} onCancel={close}
        onError={message => notify?.(message, "error", dialog.current)}
        onSaved={async () => { close(); notify?.("Ponderaciones guardadas."); await onSaved(); }} />}
    </dialog>
  </>;
}
