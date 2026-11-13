"use client";
import { Plus, Settings2, SlidersHorizontal } from "lucide-react";
import { ParticipantsPanel } from "./participants-panel.tsx";
import { SectionParticipantsReadonly } from "./section-participants-readonly.tsx";
import { SectionForm } from "./section-form.tsx";
import { CourseForm } from "./course-form.tsx";
import { AdminDialog } from "./admin-dialog.tsx";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { useId, useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import type { Course, Section } from "../../lib/courses/validation.ts";
import { getSection } from "../../lib/api/sections.ts";
import { EmptyState, ErrorState } from "../route-states.tsx";
import { Skeleton } from "../skeletons.tsx";
import { useContentNotice } from "../content/content-notices.tsx";
import { SectionPending } from "./sections-skeleton.tsx";
import { useResource } from "./use-resource.ts";

/** Below this many sections the native picker already scans well; the code filter only adds noise. */
export const sectionSearchThreshold = 8;

/**
 * One toolbar, as in Tareas: the active section (named once, with its capacity and its own
 * configuration) on the left, course actions on the right. Forms open as modals, so nothing moves.
 */
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
  const notify = useContentNotice();
  const showNotice = (message: string) => notify?.(message);
  const ids = useId();
  const access = capabilities(user, course);
  const canManage = management && access.sections;
  const ownItems = items.filter(s => user.sectionMemberships.some(m => m.courseId === course.id && m.sectionId === s.id));
  const manageable = canManage ? items.filter(s => capabilities(user, course, s).manage) : [];
  const active = manageable.find(s => s.id === selected) ?? manageable[0];
  // Keyed by the section; a configuration save re-reads it in place (previous data stays meanwhile),
  // so the trigger stays enabled and takes the focus back when the modal closes.
  const result = useResource(session, `${slug}:${course.id}:${active?.id ?? ""}`,
    c => active ? getSection(c, slug, active.id, course.id) : Promise.resolve(null));
  const detail = result.data ?? undefined;
  const searchable = manageable.length > sectionSearchThreshold;
  const term = searchable ? query.trim().toLocaleLowerCase('es') : "";
  const matches = manageable.filter(s => s.code.toLocaleLowerCase('es').includes(term));
  if (!canManage)
    return <SectionParticipantsReadonly key={`${slug}:${course.id}`} session={session} slug={slug} user={user} course={course} sections={ownItems} />;

  const capacity = detail ? <span className="chip tnum">Capacidad: {detail.capacity ?? "Sin límite"}</span>
    : !result.error ? <Skeleton shape="pill" width="7.5rem" /> : null;
  return <section className="stack section-workspace">
    <div className="section-toolbar">
      {active && searchable && <label className="field-label section-search" htmlFor={`${ids}-search`}>Buscar sección
        <input id={`${ids}-search`} type="search" className="field" value={query} onInput={event => setQuery(event.currentTarget.value)}
          placeholder="Código de sección…" autoComplete="off" spellCheck={false} /></label>}
      {active && <div className="section-field">
        {manageable.length > 1 && <label className="field-label" htmlFor={`${ids}-section`}>Sección</label>}
        <div className="section-field-row">
          {manageable.length > 1
            ? <select id={`${ids}-section`} name="managedSection" className="field" value={active.id}
              onChange={event => { setSelected(event.currentTarget.value); setQuery(""); }}>
              {!matches.some(s => s.id === active.id) && <optgroup label="Sección actual"><option value={active.id}>Sección {active.code}</option></optgroup>}
              {matches.map(s => <option key={s.id} value={s.id}>Sección {s.code}</option>)}
            </select>
            : <p className="section-name">Sección {active.code}</p>}
          {capacity}
          {access.configure && <AdminDialog key={active.id} label="Configurar sección" title={`Configurar sección ${active.code}`}
            icon={<SlidersHorizontal size={16} aria-hidden="true" />} disabled={!detail} onDone={showNotice}>
            {dialog => detail && <SectionForm key={detail.id + detail.code + detail.capacity} session={session} slug={slug} courseId={course.id} section={detail} onSaved={async () => { await onSaved(); await result.reload(); }} dialog={dialog} />}
          </AdminDialog>}
        </div>
      </div>}
      {access.configure && <div className="section-actions">
        <AdminDialog label="Configurar curso" title="Configurar curso" icon={<Settings2 size={16} aria-hidden="true" />} onDone={showNotice}>
          {dialog => <CourseForm key={course.id + course.code + course.name + course.term} session={session} slug={slug} course={course} onSaved={onSaved} dialog={dialog} />}
        </AdminDialog>
        <AdminDialog label="Crear sección" title="Crear sección" icon={<Plus size={16} aria-hidden="true" />} primary onDone={showNotice}>
          {dialog => <SectionForm session={session} slug={slug} courseId={course.id} onSaved={onSaved} dialog={dialog} />}
        </AdminDialog>
      </div>}
    </div>
    {active && searchable && <p className="hint section-toolbar-status" role="status">{term ? matches.length ? `${matches.length} ${matches.length === 1 ? "coincidencia" : "coincidencias"}. Selecciona una para cambiar de sección.` : "No hay secciones que coincidan. La sección actual se conserva." : `${manageable.length} secciones disponibles.`}</p>}
    {!active ? <EmptyState headingLevel={2} title="No hay secciones para gestionar"
      message={access.configure ? "Crea la primera sección desde «Crear sección»." : "Este curso aún no tiene secciones dentro de tu alcance."} />
      : result.error ? <ErrorState headingLevel={2} feedback={result.error} onRetry={() => void result.reload()} />
        : !detail ? <SectionPending />
          : <ParticipantsPanel session={session} slug={slug} user={user} course={course} section={detail} />}
  </section>;
}
