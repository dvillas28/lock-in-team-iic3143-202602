"use client";
import { roleLabel } from "../../lib/courses/role-label.ts";
import { ParticipantsPanel } from "./participants-panel.tsx";
import { SectionForm } from "./section-form.tsx";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { useId, useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import type { Course, Section } from "../../lib/courses/validation.ts";
import { getSection } from "../../lib/api/sections.ts";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
import { useResource } from "./use-resource.ts";
export function SectionsPanel({ session, slug, user, course, items, management, onSaved }: {
  session: Session;
  slug: string;
  user: CurrentUser;
  course: Course;
  items: Section[];
  management: boolean;
  onSaved: () => Promise<unknown>;
}) {
  const [selected, setSelected] = useState(() => items.find(s => capabilities(user, course, s).manage)?.id ?? "");
  const [query, setQuery] = useState("");
  const filterId = useId(), pickerId = useId();
  const canManage = management && capabilities(user, course).sections;
  const ownItems = items.filter(s => user.sectionMemberships.some(m => m.courseId === course.id && m.sectionId === s.id));
  const manageable = items.filter(s => capabilities(user, course, s).manage);
  const active = manageable.find(s => s.id === selected) ?? manageable[0];
  const matches = manageable.filter(s => s.code.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
  if (!canManage) return <section className="stack section-overview">
    <h2 className="serif">{ownItems.length === 1 ? "Tu sección" : "Tus secciones"}</h2>
    {!ownItems.length ? <EmptyState /> : <ul className="stack section-list card">{ownItems.map(s => <li key={s.id}><div><strong>Sección {s.code}</strong><p className="hint">{user.sectionMemberships.filter(m => m.courseId === course.id && m.sectionId === s.id).map(m => roleLabel(m.role)).join(" · ")}</p></div></li>)}</ul>}
  </section>;
  return <section className="stack section-overview">
    <div className="section-picker card">
      <h2 className="serif">Secciones del curso</h2>
      {!manageable.length ? <EmptyState /> : <>
        <div className="section-picker-fields">
          <label className="field-label" htmlFor={filterId}>Buscar sección<input id={filterId} type="search" className="field" value={query} onInput={event => setQuery(event.currentTarget.value)} placeholder="Código de sección" /></label>
          <label className="field-label" htmlFor={pickerId}>Sección a gestionar<select id={pickerId} name="managedSection" className="field" value={active?.id ?? ""} onChange={event => { setSelected(event.currentTarget.value); setQuery(""); }}>
            {active && !matches.some(s => s.id === active.id) && <optgroup label="Sección actual"><option value={active.id}>Sección {active.code}</option></optgroup>}
            {matches.map(s => <option key={s.id} value={s.id}>Sección {s.code}</option>)}
          </select></label>
        </div>
      </>}
      <div className="section-picker-footer">
        {!!manageable.length && <p className="hint" role="status">{query.trim() ? matches.length ? `${matches.length} ${matches.length === 1 ? "coincidencia" : "coincidencias"}. Selecciona una para cambiar de sección.` : "No hay secciones que coincidan. La sección actual se conserva." : `${manageable.length} ${manageable.length === 1 ? 'sección disponible' : 'secciones disponibles'}.`}</p>}
        {capabilities(user, course).configure && <details className="academic-disclosure"><summary>Crear sección</summary><SectionForm session={session} slug={slug} courseId={course.id} onSaved={onSaved} /></details>}
      </div>
    </div>
    {active && <SelectedSection key={`${active.id}:${active.code}:${active.capacity}`} session={session} slug={slug} courseId={course.id} sectionId={active.id} user={user} course={course} onSaved={onSaved} />}
  </section>;

}
function SelectedSection({ session, slug, courseId, sectionId, user, course, onSaved }: {
  session: Session;
  slug: string;
  courseId: string;
  sectionId: string;
  user: CurrentUser;
  course: Course;
  onSaved: () => Promise<unknown>;
}) {
  const result = useResource(session, `${slug}:${courseId}:${sectionId}`, c => getSection(c, slug, sectionId, courseId));
  if (result.error)
    return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data)
    return <LoadingState />;
  return <section className="stack section-workspace">
    <div className="section-workspace-meta"><p className="hint">Capacidad: {result.data.capacity ?? "Sin límite"}</p>{capabilities(user, course).configure && <details className="academic-disclosure"><summary>Configurar sección</summary><SectionForm key={result.data.code + result.data.capacity} session={session} slug={slug} courseId={courseId} section={result.data} onSaved={onSaved} /></details>}</div><ParticipantsPanel session={session} slug={slug} user={user} course={course} section={result.data} />
  </section>;
}
