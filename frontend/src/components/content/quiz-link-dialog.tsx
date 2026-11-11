"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useResource } from "../courses/use-resource.ts";
import { useContentMutation } from "./content-notices.tsx";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { useDelayedFlag } from "./use-delayed-flag.ts";
import { linkModuleQuiz } from "../../lib/api/academic-files.ts";
import { listCourseQuizzes } from "../../lib/api/quizzes.ts";
import type { Session } from "../../lib/auth/session.ts";
import type { ModuleResource } from "../../lib/content/academic-files.ts";
import type { CourseModule } from "../../lib/content/validation.ts";
import type { Course } from "../../lib/courses/validation.ts";

const SEARCH_FROM = 8;
type Props = {
  session: Session; slug: string; parent: CourseModule; course: Course; items: ModuleResource[];
  disabled: boolean; reload: () => Promise<boolean | undefined>; onClose: () => void;
};

function Choices({ session, slug, parent, course, items, disabled, reload, onClose }: Props) {
  const result = useResource(session, `link-quiz:${slug}:${parent.id}`, c => listCourseQuizzes(c, slug, course.id), false);
  const mutation = useContentMutation(session);
  const [selected, setSelected] = useState(""), [query, setQuery] = useState("");
  const user = session.getSnapshot().context?.user;
  const owner = user?.institutionMembership.isAdmin && user.id === course.createdBy;
  const ownSections = user?.sectionMemberships.filter(m => m.courseId === course.id && m.role === "teacher").map(m => m.sectionId);
  const choices = result.data?.filter(q => (owner || ownSections?.includes(q.sectionId ?? "")) &&
    !items.some(item => item.kind === "quiz" && item.quizId === q.id));
  const locked = disabled || mutation.busy || !!mutation.uncertain;
  const slow = useDelayedFlag(!choices && !result.error);
  // Close only after the confirmed notice was emitted; a stale-list warning keeps the dialog open to stay readable.
  useEffect(() => { if (mutation.confirmed && !mutation.persistent) onClose(); }, [mutation.confirmed, mutation.persistent, onClose]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!choices?.some(q => q.id === selected) || locked) return;
    void mutation.run(async current => {
      await session.request(c => linkModuleQuiz(c, slug, parent.id, selected), current);
      if (!current()) return;
      return await reload() ? "Cuestionario enlazado." : { message: "Enlace guardado. Usa Reintentar para consultar los recursos.", persistent: true };
    }, async () => { await reload(); return "Revisa los recursos actuales."; });
  }
  if (result.error) return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!choices) return slow ? <LoadingState /> : <div className="resource-pending" aria-busy="true" />;
  if (!choices.length) return <div className="stack">
    <p><strong>No hay cuestionarios para enlazar.</strong></p>
    <p className="hint">Los cuestionarios de tus secciones ya están en este módulo, o aún no has creado ninguno.</p>
    <div className="actions"><Link className="btn btn-primary" href={`/courses/${course.id}/quizzes`}>Ir a Quizzes</Link>
      <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button></div>
  </div>;
  const shown = choices.filter(q => q.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <form className="stack" onSubmit={submit}>
    {choices.length >= SEARCH_FROM && <input className="field" type="search" aria-label="Buscar cuestionario" placeholder="Buscar cuestionario"
      value={query} onChange={event => setQuery(event.target.value)} />}
    <fieldset className="stack quiz-choices" disabled={locked}>
      <legend className="field-label">Cuestionarios disponibles</legend>
      {shown.map(q => <label key={q.id} className="option"><input type="radio" name="quiz" value={q.id} checked={selected === q.id}
        onChange={() => setSelected(q.id)} /><span>{q.title}</span></label>)}
      {!shown.length && <p className="hint">Ningún cuestionario coincide con la búsqueda.</p>}
    </fieldset>
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
    <div className="actions">
      <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button type="submit" className="btn btn-primary" disabled={locked || !selected}>Enlazar cuestionario</button>
    </div>
  </form>;
}

export function QuizLinkDialog({ open, ...props }: Props & { open: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  const titleId = `quiz-link-${props.parent.id}`;
  return <dialog ref={dialog} className="modal native-dialog academic-dialog" aria-labelledby={titleId} onClose={props.onClose}>
    <div className="dialog-heading">
      <div><h2 id={titleId}>Enlazar cuestionario</h2>
        <p className="hint">Elige un cuestionario del curso para mostrarlo en este módulo. Su publicación no cambia.</p></div>
      <button type="button" className="btn btn-ghost" aria-label="Cerrar" onClick={props.onClose}><X size={18} aria-hidden="true" /></button>
    </div>
    {open && <Choices {...props} />}
  </dialog>;
}
