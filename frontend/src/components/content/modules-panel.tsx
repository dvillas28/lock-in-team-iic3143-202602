"use client";
import { useState } from "react";
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
  return <div className="stack">
    {result.error && <><p role="alert">Consulta fallida. Representación anterior, no vigente.</p><ErrorState feedback={result.error} onRetry={() => void result.reload()} /></>}
    {result.refreshing && <p role="status">Actualizando consulta…</p>}
    <button className="btn btn-ghost" onClick={() => void result.reload()} disabled={result.refreshing}>Actualizar materiales</button>
    {author && <MaterialForm session={session} slug={slug} moduleId={parent.id} onSaved={result.reload} disabled={unavailable} />}
    {!result.error && !result.refreshing && !result.data.length && <EmptyState />}
    {result.data.map(item => <div className="card panel stack" key={item.id}>
      <Link href={`/courses/${parent.courseId}/modules/${parent.id}/materials/${item.id}`}>{item.title}</Link>
      <p>{item.publishedAt ? "Publicado" : "Borrador"} · {item.publishedAt && parent.publishedAt ? "Visible para estudiantes" : !parent.publishedAt ? "No visible: módulo sin publicar" : "No visible: material sin publicar"}</p>
      {author && <PublicationToggle session={session} slug={slug} kind="material" id={item.id} parentId={parent.id} title={item.title} published={item.publishedAt !== null} onSaved={result.reload} disabled={unavailable} />}
      {author && <MaterialForm session={session} slug={slug} moduleId={parent.id} item={item} onSaved={result.reload} disabled={unavailable} />}
    </div>)}
  </div>;
}
function ModuleRow({ session, slug, parent, author, items, reload, disabled, move, busy }: {
  session: Session; slug: string; parent: CourseModule; author: boolean; items: CourseModule[];
  reload: () => Promise<boolean | undefined>; disabled: boolean; move: (id: string, direction: number) => void; busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  return <section className="card panel stack" id={`module-${parent.id}`}>
    <h2><button className="btn btn-ghost" aria-expanded={open} aria-controls={`materials-${parent.id}`} onClick={() => { setVisited(true); setOpen(!open); }}>{parent.title}</button></h2>
    <p>{parent.publishedAt ? "Publicado" : "Borrador"}</p>
    {author && <>
      <PublicationToggle session={session} slug={slug} kind="module" id={parent.id} parentId={parent.courseId} title={parent.title} published={parent.publishedAt !== null} onSaved={reload} disabled={disabled} />
      <div className="module-tools">
        <button className="btn btn-ghost" aria-label={`Subir ${parent.title}`} aria-disabled={disabled || busy || items[0].id === parent.id} onClick={() => {if (!disabled && !busy && items[0].id !== parent.id) move(parent.id,-1);}}>Subir</button>
        <button className="btn btn-ghost" aria-label={`Bajar ${parent.title}`} aria-disabled={disabled || busy || items[items.length-1].id === parent.id} onClick={() => {if (!disabled && !busy && items[items.length-1].id !== parent.id) move(parent.id,1);}}>Bajar</button>
      </div>
      <ModuleForm session={session} slug={slug} courseId={parent.courseId} item={parent} items={items} onSaved={reload} disabled={disabled} />
    </>}
    <div id={`materials-${parent.id}`} hidden={!open}>{visited && <ModuleMaterials session={session} slug={slug} parent={parent} author={author} disabled={disabled} />}</div>
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
      return refreshed ? "Cambio confirmado." : "Cambio confirmado. No se pudo actualizar la consulta; reintenta solo la lectura.";
    }, async current => {
      await session.request(c => listCourseModules(c, slug, courseId), current);
      return "Se consultó el orden actual. Revisa antes de repetir.";
    });
  }
  return <div className="stack">
    <Link href={`/courses/${courseId}`}>Volver al curso</Link>
    <h1 className="serif">Módulos · {result.data.course.name}</h1>
    <button className="btn btn-ghost" type="button" onClick={() => void result.reload()} disabled={result.refreshing}>Actualizar módulos</button>
    {result.error && <><p role="alert">Consulta fallida. Representación anterior, no vigente.</p><ErrorState feedback={result.error} onRetry={() => void result.reload()} /></>}
    {result.refreshing && <p role="status">Actualizando consulta…</p>}
    {mutation.message && <p role="status">{mutation.message}</p>}
    {author && <ModuleForm session={session} slug={slug} courseId={courseId} items={result.data.items} onSaved={result.reload} disabled={disabled} />}
    {!result.error && !result.refreshing && !result.data.items.length && <EmptyState />}
    {result.data.items.map(parent => <ModuleRow key={`${state.generation}:${slug}:${parent.id}`} session={session} slug={slug} parent={parent} author={author} items={result.data!.items} reload={result.reload} disabled={disabled} move={move} busy={mutation.busy || !!mutation.uncertain} />)}
  </div>;
}
