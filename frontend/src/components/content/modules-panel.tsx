"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FileText, RefreshCw } from "lucide-react";
import { CourseNavigation } from "../courses/course-navigation.tsx";
import Link from "next/link";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { ErrorState, EmptyState, LoadingState } from "../route-states.tsx";
import { getCourse } from "../../lib/api/courses.ts";
import { listCourseModules } from "../../lib/api/modules.ts";
import { listModuleMaterials } from "../../lib/api/materials.ts";
import type { CourseModule } from "../../lib/content/validation.ts";
import { canAuthorContent } from "../../lib/content/capabilities.ts";
import { PublicationToggle } from "./publication-toggle.tsx";
import { ModuleForm } from "./module-form.tsx";
import { MaterialForm } from "./material-form.tsx";
import { useMutation } from "../courses/use-mutation.ts";
import { reorderCourseModules } from "../../lib/api/modules.ts";
import type { Session } from "../../lib/auth/session.ts";
function ModuleMaterials({ session, slug, parent, author, disabled }: { session: Session; slug: string; parent: CourseModule; author: boolean; disabled: boolean }) {
  const result = useResource(session, `${session.getSnapshot().generation}:${slug}:${parent.courseId}:${parent.id}`, c => listModuleMaterials(c, slug, parent.id), true);
  if (result.error && !result.data) return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data) return <LoadingState />;
  const unavailable = disabled || !!result.error || !!result.refreshing;
  return <div className="module-materials">
    {result.error && <><p role="alert">Consulta fallida. Representación anterior, no vigente.</p><ErrorState feedback={result.error} onRetry={() => void result.reload()} /></>}
    {result.refreshing && <p role="status">Actualizando consulta…</p>}
    <div className="resource-toolbar"><span className="section-label">Materiales del módulo</span><button className="btn btn-ghost" onClick={() => void result.reload()} disabled={result.refreshing}><RefreshCw size={14} aria-hidden="true" />Actualizar materiales</button></div>
    {author && <details className="academic-disclosure"><summary>Crear material</summary><MaterialForm session={session} slug={slug} moduleId={parent.id} onSaved={result.reload} disabled={unavailable} /></details>}
    {!result.error && !result.refreshing && !result.data.length && <EmptyState />}
    {result.data.map(item => <div className="material-item" key={item.id}><div className="module-resource"><FileText aria-hidden="true" /><div className="module-resource-info">
      <Link href={`/courses/${parent.courseId}/modules/${parent.id}/materials/${item.id}`}>{item.title}</Link>
      <p className="hint">{item.publishedAt ? "Publicado" : "Borrador"} · {item.publishedAt && parent.publishedAt ? "Visible para estudiantes" : !parent.publishedAt ? "No visible: módulo sin publicar" : "No visible: material sin publicar"}</p>
      </div>{author && <PublicationToggle session={session} slug={slug} kind="material" id={item.id} parentId={parent.id} title={item.title} published={item.publishedAt !== null} onSaved={result.reload} disabled={unavailable} />}</div>
      {author && <details className="academic-disclosure resource-editor"><summary>Editar material {item.title}</summary><MaterialForm session={session} slug={slug} moduleId={parent.id} item={item} onSaved={result.reload} disabled={unavailable} /></details>}
    </div>)}
  </div>;
}
function ModuleRow({ session, slug, parent, author, items, reload, disabled, move, busy, requested }: {
  session: Session; slug: string; parent: CourseModule; author: boolean; items: CourseModule[];
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
    <div id={`materials-${parent.id}`} hidden={!expanded}>{(visited || requestedOpen) && <ModuleMaterials session={session} slug={slug} parent={parent} author={author} disabled={disabled} />}</div>
  </section>;
}
export function ModulesPanel({ courseId }: { courseId: string }) {
  const {state} = useSession();
  if (!state.context?.user) return <LoadingState />;
  return <CourseContent key={`${state.generation}:${state.context.slug}:${courseId}`} courseId={courseId} />;
}
function CourseContent({ courseId }: { courseId: string }) {
  const { session, state } = useSession();
  const slug = state.context?.slug ?? "";
  const result = useResource(session, `${state.generation}:${slug}:${courseId}`, async client => ({
    course: await getCourse(client, slug, courseId), items: await listCourseModules(client, slug, courseId)
  }), true);
  const mutation = useMutation(session);
  const [requested, setRequested] = useState({ id: "", revision: 0 });
  if (!state.context?.user) return <LoadingState />;
  if (result.error && !result.data) return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data) return <LoadingState />;
  const author = canAuthorContent(state.context.user, courseId);
  const disabled = !!result.error || !!result.refreshing;
  function move(id: string, direction: number) {
    const items = result.data!.items;
    const ids = items.map(m => m.id), i = ids.indexOf(id);
    [ids[i], ids[i+direction]] = [ids[i+direction], ids[i]];
    void mutation.run(async current => {
      await session.request(c => reorderCourseModules(c, slug, courseId, ids, items), current);
      if (!current()) return;
      const refreshed = await result.reload();
      return refreshed ? "Orden de módulos actualizado." : "Orden de módulos actualizado. No se pudo actualizar la consulta; reintenta solo la lectura.";
    }, async current => {
      await session.request(c => listCourseModules(c, slug, courseId), current);
      return "Se consultó el orden actual. Revisa antes de repetir.";
    });
  }
  return <div className="stack">
    <div className="page-heading"><div><p className="section-label">{result.data.course.code} · {result.data.course.term}</p><h1>Módulos y material</h1><p>{result.data.course.name}</p></div><button className="btn btn-ghost" type="button" onClick={() => void result.reload()} disabled={result.refreshing}><RefreshCw size={14} aria-hidden="true" />Actualizar módulos</button></div>
    <CourseNavigation course={result.data.course} user={state.context.user} active="/modules" />
    {author && <p className="notice">Contenido compartido por todas las secciones del curso. La publicación de cada módulo y material es independiente.</p>}
    {result.error && <><p role="alert">Consulta fallida. Representación anterior, no vigente.</p><ErrorState feedback={result.error} onRetry={() => void result.reload()} /></>}
    {result.refreshing && <p role="status">Actualizando consulta…</p>}
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
    {author && <details className="academic-disclosure card"><summary>Crear módulo</summary><ModuleForm session={session} slug={slug} courseId={courseId} items={result.data.items} onSaved={result.reload} disabled={disabled} /></details>}
    {!result.error && !result.refreshing && !result.data.items.length && <EmptyState />}
    <div className="module-workspace"><nav className="module-index card" aria-label="Índice de módulos"><p className="section-label">Módulos del curso</p>{result.data.items.map(parent => <a key={parent.id} className="nav-item" href={`#module-${parent.id}`} onClick={() => setRequested(previous => ({ id: parent.id, revision: previous.revision + 1 }))}><span className="tnum">{parent.position}.</span><span>{parent.title}</span></a>)}</nav><div className="stack">
    {result.data.items.map(parent => <ModuleRow key={`${state.generation}:${slug}:${parent.id}`} session={session} slug={slug} parent={parent} author={author} items={result.data!.items} reload={result.reload} disabled={disabled} move={move} busy={mutation.busy || !!mutation.uncertain} requested={requested} />)}
    </div></div>
  </div>;
}
