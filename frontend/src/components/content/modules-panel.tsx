"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
import { CourseNavigation } from "../courses/course-navigation.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { getCourse } from "../../lib/api/courses.ts";
import { listCourseModules } from "../../lib/api/modules.ts";
import type { CourseModule } from "../../lib/content/validation.ts";
import { canAuthorContent } from "../../lib/content/capabilities.ts";
import { PublicationToggle } from "./publication-toggle.tsx";
import { ModuleForm } from "./module-form.tsx";
import { ModuleResources } from "./module-resources.tsx";
import type { Course } from "../../lib/courses/validation.ts";
import { useRefreshOnReturn } from "./use-refresh-on-return.ts";
import { ContentNotices, useContentMutation } from "./content-notices.tsx";
import { reorderCourseModules } from "../../lib/api/modules.ts";
import type { Session } from "../../lib/auth/session.ts";
function ModuleRow({ session, slug, parent, author, items, reload, disabled, move, busy, requested, course }: {
  session: Session; slug: string; parent: CourseModule; author: boolean; items: CourseModule[]; course: Course;
  reload: () => Promise<boolean | undefined>; disabled: boolean; move: (id: string, direction: number) => void; busy: boolean; requested: { id: string; revision: number };
}) {
  const initiallyOpen = () => typeof window !== 'undefined' && window.location.hash === `#module-${parent.id}`;
  const [open, setOpen] = useState(initiallyOpen);
  const [visited, setVisited] = useState(initiallyOpen);
  const [collapsedRevision, setCollapsedRevision] = useState(-1);
  const requestedOpen = requested.id === parent.id && requested.revision !== collapsedRevision;
  const expanded = open || requestedOpen;
  const heading = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function reveal() {
      if (window.location.hash === `#module-${parent.id}`) {
        setOpen(true); setVisited(true); heading.current?.focus();
      }
    }
    if (window.location.hash === `#module-${parent.id}`) heading.current?.focus();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [parent.id]);
  useEffect(() => {
    if (requested.id === parent.id) heading.current?.focus();
  }, [requested, parent.id]);
  return <section className="card academic-module" id={`module-${parent.id}`}><div className="module-header">
    <h2><button ref={heading} className="module-collapse" aria-expanded={expanded} aria-controls={`materials-${parent.id}`} onClick={() => { setVisited(true); setOpen(!expanded); setCollapsedRevision(requested.revision); }}>{expanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}<span className="serif">{parent.title}</span></button></h2>
    {!author && <span className="chip">{parent.publishedAt ? "Publicado" : "Borrador"}</span>}
    {author && <>
      <div className="module-tools"><PublicationToggle session={session} slug={slug} kind="module" id={parent.id} parentId={parent.courseId} title={parent.title} published={parent.publishedAt !== null} onSaved={reload} disabled={disabled} />
        <button className="btn btn-ghost" aria-label={`Subir ${parent.title}`} aria-disabled={disabled || busy || items[0].id === parent.id} onClick={() => {if (!disabled && !busy && items[0].id !== parent.id) move(parent.id,-1);}}><ArrowUp size={14} aria-hidden="true" />Subir</button>
        <button className="btn btn-ghost" aria-label={`Bajar ${parent.title}`} aria-disabled={disabled || busy || items[items.length-1].id === parent.id} onClick={() => {if (!disabled && !busy && items[items.length-1].id !== parent.id) move(parent.id,1);}}><ArrowDown size={14} aria-hidden="true" />Bajar</button>
      </div>
    </>}
    </div>
    {author && <details className="academic-disclosure module-editor"><summary>Editar módulo {parent.title}</summary><ModuleForm session={session} slug={slug} courseId={parent.courseId} item={parent} items={items} onSaved={reload} disabled={disabled} /></details>}
    <div id={`materials-${parent.id}`} hidden={!expanded}>{(visited || requestedOpen) && <ModuleResources session={session} slug={slug} parent={parent} author={author} disabled={disabled} course={course} expanded={expanded} />}</div>
  </section>;
}
export function ModulesPanel({ courseId }: { courseId: string }) {
  const {state} = useSession();
  if (!state.context?.user) return <LoadingState />;
  return <ContentNotices key={`${state.generation}:${state.context.slug}:${courseId}`}>
    <CourseContent courseId={courseId} />
  </ContentNotices>;
}
function CourseContent({ courseId }: { courseId: string }) {
  const { session, state } = useSession();
  const slug = state.context?.slug ?? "";
  const key = `${state.generation}:${slug}:${courseId}`;
  const {data:course,error:courseError,reload:reloadCourse} = useResource(session, `course:${key}`, client => getCourse(client, slug, courseId));
  const result = useResource(session, `modules:${key}`, client => listCourseModules(client, slug, courseId));
  useRefreshOnReturn(result.reload, !!result.data && !result.refreshing);
  const mutation = useContentMutation(session);
  const [requested, setRequested] = useState({ id: "", revision: 0 });
  if (!state.context?.user) return <LoadingState />;
  if (courseError) return <ErrorState feedback={courseError} onRetry={() => void reloadCourse()} />;
  if (!course) return <LoadingState />;
  if (result.error && !result.data) return <div className="stack">
    <CourseNavigation course={course} user={state.context.user} active="/modules" />
    <ErrorState feedback={result.error} onRetry={() => void result.reload()} />
  </div>;
  if (!result.data) return <LoadingState />;
  const items = result.data;
  const author = canAuthorContent(state.context.user, courseId);
  const disabled = !!result.error || !!result.refreshing;
  function move(id: string, direction: number) {
    const ids = items.map(m => m.id), i = ids.indexOf(id);
    [ids[i], ids[i+direction]] = [ids[i+direction], ids[i]];
    void mutation.run(async current => {
      await session.request(c => reorderCourseModules(c, slug, courseId, ids, items), current);
      if (!current()) return;
      const refreshed = await result.reload();
      return refreshed ? "Orden de módulos actualizado." : { message: "Orden de módulos actualizado. No se pudo actualizar la consulta; reintenta solo la lectura.", persistent: true };
    }, async current => {
      return current() && await result.reload() ? "Se consultó el orden actual." : "No se pudo consultar el orden actual.";
    });
  }
  return <div className="stack">
    <div className="page-heading"><div><p className="section-label">{course.code} · {course.term}</p><h1>Módulos y material</h1><p>{course.name}</p></div></div>
    <CourseNavigation course={course} user={state.context.user} active="/modules" />
    {author && <p className="notice">Contenido compartido por todas las secciones del curso. La publicación de cada módulo y material es independiente.</p>}
    {result.error && <><p role="alert">Consulta fallida. Representación anterior, no vigente.</p><ErrorState feedback={result.error} onRetry={() => void result.reload()} /></>}
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
    {author && <details className="academic-disclosure card"><summary>Crear módulo</summary><ModuleForm session={session} slug={slug} courseId={courseId} items={items} onSaved={result.reload} disabled={disabled} /></details>}
    {!result.error && !result.refreshing && !items.length && <div className="empty-zone panel"><h2>Aún no hay módulos disponibles</h2><p className="hint">{author ? "Crea un módulo para organizar el material del curso." : "Los módulos y materiales publicados del curso aparecerán aquí"}</p></div>}
    {items.length > 0 && <div className="module-workspace" aria-busy={result.refreshing}><nav className="module-index card" aria-label="Índice de módulos"><p className="section-label">Módulos del curso</p>{items.map(parent => <a key={parent.id} className="nav-item" href={`#module-${parent.id}`} onClick={() => setRequested(previous => ({ id: parent.id, revision: previous.revision + 1 }))}><span className="tnum">{parent.position}.</span><span>{parent.title}</span></a>)}</nav><div className="stack">
    {items.map(parent => <ModuleRow key={`${state.generation}:${slug}:${parent.id}`} session={session} slug={slug} parent={parent} author={author} items={items} course={course} reload={result.reload} disabled={disabled} move={move} busy={mutation.busy || !!mutation.uncertain} requested={requested} />)}
    </div></div>}
  </div>;
}
