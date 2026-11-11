"use client";
import { useRef, useState } from "react";
import { PencilLine } from "lucide-react";
import Link from "next/link";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { CourseWorkspace } from "../courses/course-workspace.tsx";
import { listSections } from "../../lib/api/sections.ts";
import {
  listCourseGradeItems,
  getCourseGradebook,
} from "../../lib/api/gradebook.ts";
import { gradebookCapabilities } from "../../lib/gradebook/capabilities.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import type { Course } from "../../lib/courses/validation.ts";
import { LoadingState } from "../route-states.tsx";
import { ResourceFeedback, shortId } from "../academic/feedback.tsx";
import { WeightsDialog } from "./weights-dialog.tsx";
import { GradeCorrection } from "./grade-correction.tsx";
import type { GradeItem, GradeResult } from "../../lib/gradebook/validation.ts";
import { ContentNotices } from "../content/content-notices.tsx";
import { GradePublication } from "./grade-publication.tsx";
export function CourseGradebook({ courseId }: Readonly<{ courseId: string }>) {
  return (
    <CourseWorkspace
      courseId={courseId}
      title="Libro de notas"
      active="/gradebook"
    >
      {(course) => <BookView course={course} />}
    </CourseWorkspace>
  );
}
function BookView({ course }: Readonly<{ course: Course }>) {
  const { session, state } = useSession(),
    user = state.context!.user!,
    slug = state.context!.slug,
    courseId = course.id;
  const [sectionId, setSectionId] = useState(""),
    [cursor, setCursor] = useState<string>(),
    [pages, setPages] = useState<(string | undefined)[]>([]);
  const [busy, setBusy] = useState(false);
  const cap = gradebookCapabilities(user, course, sectionId || undefined);
  const scope = `${state.generation}:${slug}:${JSON.stringify(user)}:${courseId}`;
  const meta = useResource(session, `${scope}:meta`, async (c) => {
    if (!cap.book) throw new ApiHttpError(403);
    const sections = await listSections(c, slug, courseId),
      items = await listCourseGradeItems(c, slug, courseId);
    return { sections, items };
  });
  if (!meta.data)
    return meta.error ? (
      <ResourceFeedback error={meta.error} retry={() => void meta.reload()} />
    ) : (
      <LoadingState />
    );
  if (!cap.book)
    return (
      <ResourceFeedback
        error={getRouteFeedback(new ApiHttpError(403))}
        retry={() => void meta.reload()}
      />
    );
  return (
    <ContentNotices key={scope}>
      <BookResults
        course={course}
        meta={meta.data}
        sectionId={sectionId}
        cursor={cursor}
        pages={pages}
        busy={busy}
        onSection={(v) => {
          setSectionId(v);
          setCursor(undefined);
          setPages([]);
        }}
        previous={() => {
          setCursor(pages.at(-1));
          setPages((p) => p.slice(0, -1));
        }}
        next={(v) => {
          setPages((p) => [...p, cursor]);
          setCursor(v);
        }}
        onBusy={setBusy}
        onMetaReload={meta.reload}
      />
    </ContentNotices>
  );
}
function BookResults({
  course,
  meta,
  sectionId,
  cursor,
  pages,
  busy,
  onSection,
  previous,
  next,
  onBusy,
  onMetaReload,
}: Readonly<{
  course: Course;
  meta: {
    sections: Awaited<ReturnType<typeof listSections>>;
    items: Awaited<ReturnType<typeof listCourseGradeItems>>;
  };
  sectionId: string;
  cursor?: string;
  pages: (string | undefined)[];
  busy: boolean;
  onSection: (v: string) => void;
  previous: () => void;
  next: (v: string) => void;
  onBusy: (v: boolean) => void;
  onMetaReload: () => Promise<unknown>;
}>) {
  const { session, state } = useSession(),
    user = state.context!.user!,
    slug = state.context!.slug;
  const [correction, setCorrection] = useState<{ grade: GradeResult; item: GradeItem; student: string }>();
  const correctionTrigger = useRef<HTMLButtonElement>(null);
  const { sections, items } = meta,
    cap = gradebookCapabilities(user, course, sectionId || undefined);
  const r = useResource(
    session,
    `${state.generation}:${slug}:${JSON.stringify(user)}:${course.id}:${sectionId}:${cursor}`,
    async (c) => {
      const book = await getCourseGradebook(c, slug, course.id, items.items, {
        sectionId: sectionId || undefined,
        cursor,
      });
      if (
        !cap.global &&
        book.items.some((x) => !cap.readSections.includes(x.sectionId))
      )
        throw new ApiHttpError(403);
      return book;
    },
  );
  const book = r.data,
    groups = items.groups ?? [],
    grouped = items.calculation === "points",
    groupOrder = new Map(groups.map(g => [g.id, g.position])),
    columns = [...items.items].sort((a,b) => (groupOrder.get(a.groupId ?? "") ?? 0) - (groupOrder.get(b.groupId ?? "") ?? 0) ||
      a.title.localeCompare(b.title, "es")),
    blocked = !!r.refreshing || !!r.error || !book;
  return (
    <div className="stack">
      <div className="gradebook-toolbar card panel">
        <label className="field-label">
          Sección histórica
          <select
            className="field"
            disabled={busy || !!r.refreshing}
            value={sectionId}
            onChange={(e) => onSection(e.target.value)}
          >
            <option value="">Todas las autorizadas</option>
            {sections
              .filter((s) => cap.global || cap.readSections.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  Sección {s.code}
                </option>
              ))}
          </select>
        </label>
        {(cap.weights || cap.publish) && <div className="gradebook-actions">
          {cap.weights && (
            <WeightsDialog
              session={session}
              slug={slug}
              courseId={course.id}
              configuration={items}
              busy={busy}
              onSaved={async () => {
                await onMetaReload();
                await r.reload();
              }}
            />
          )}
          {cap.publish && (
            <GradePublication
              key={`${sectionId}:${cursor}`}
              session={session} slug={slug} courseId={course.id} disabled={blocked}
              totalWeightPercent={items.totalWeightPercent} moreRows={book?.hasMore || pages.length > 0}
              items={columns.filter(i=>i.quizId!==null)} rows={book?.items ?? []}
              sections={sections.filter(s => (cap.global || cap.writeSections.includes(s.id)) && (!sectionId || s.id === sectionId))}
              onBusy={onBusy}
              onConfirmed={() => { void onMetaReload(); void r.reload(); }}
            />
          )}
        </div>}
      </div>
      {groups.length > 0 && <section className="grade-group-strip" aria-label="Ponderaciones por grupo">
        <h2>Grupos de evaluación</h2>
        <ul>{groups.map(g => <li key={g.id}>
          <span>{g.title}</span><strong className="tnum">{g.weightPercent} %</strong>
        </li>)}</ul>
      </section>}
      {r.error && (
        <ResourceFeedback error={r.error} retry={() => void r.reload()} />
      )}
      <section aria-busy={!!r.refreshing} className="stack">
        {!book ? (
          !r.error && <LoadingState />
        ) : !book.items.length ? (
          <div className="empty-zone panel stack">
            <h2>No hay resultados en esta página</h2>
            <p className="hint">
              Los resultados aparecerán cuando existan intentos calificados en
              las secciones seleccionadas.
            </p>
            {columns.some(i=>i.assignmentId) && <ul aria-label="Tareas sin calificar">
              {columns.filter(i=>i.assignmentId).map(i=><li key={i.id}>
                <Link className="text-link" href={`/courses/${course.id}/assignments/${i.assignmentId}`}>{i.title}</Link>
                <span className="hint"> · {groups.find(g=>g.id===i.groupId)?.title}</span>
              </li>)}
            </ul>}
          </div>
        ) : (
          <>
            <p className="hint tnum">
              {book.items.length}{" "}
              {book.items.length === 1 ? "registro" : "registros"} en esta
              página · El promedio considera solo notas publicadas.
            </p>
            <div
              className="table-scroll gradebook-table"
              role="region"
              aria-label="Libro de notas con desplazamiento"
              tabIndex={0}
            >
              <table className="data-table">
                <caption>Resultados por estudiante y sección histórica</caption>
                <thead>
                  <tr>
                    <th scope="col">Estudiante</th>
                    <th scope="col">Sección histórica</th>
                    {columns.map((i) => (
                      <th scope="col" key={i.id}>
                        {i.assignmentId ? <Link className="text-link" href={`/courses/${course.id}/assignments/${i.assignmentId}`}>{i.title}</Link> : i.title}
                        <small className="hint">{(grouped || i.assignmentId) ? groups.find(g => g.id === i.groupId)?.title : `${i.weightPercent} %`}</small>
                        {i.maxPoints !== undefined && <small className="hint tnum">{i.maxPoints} pts</small>}
                      </th>
                    ))}
                    {grouped && groups.map(g => <th scope="col" key={g.id} className="group-total-cell">
                      {g.title}<small className="hint tnum">Subtotal · {g.weightPercent} %</small>
                    </th>)}
                    <th scope="col">Promedio parcial</th>
                    <th scope="col">Ponderación publicada</th>
                  </tr>
                </thead>
                <tbody>
                  {book.items.map((row) => (
                    <tr key={row.student.id + "/" + row.sectionId}>
                      <th scope="row">
                        {row.student.name}
                        <small className="hint">{row.student.email}</small>
                        {!row.student.active && (
                          <span className="chip">Usuario inactivo</span>
                        )}
                      </th>
                      <td>
                        {sections.find((s) => s.id === row.sectionId)?.code ??
                          shortId(row.sectionId)}
                      </td>
                      {columns.map((i) => {
                        const g = row.grades.find(
                          (g) => g.gradeItemId === i.id,
                        );
                        return (
                          <td key={i.id}>
                            {g ? (
                              <>
                                <Link
                                  className="grade-value tnum"
                                  href={i.assignmentId ? `/courses/${course.id}/assignments/${i.assignmentId}` :
                                    `/courses/${course.id}/quizzes/${i.quizId}/attempts/${g.attemptId}`}
                                >
                                  {g.grade ?? "Sin nota numérica"}
                                </Link>
                                <small
                                  className={`grade-state ${g.publishedAt ? "published" : "unpublished"}`}
                                >
                                  {g.publishedAt ? (g.revisedAt ? "Corregida" : "Publicada") : "Sin publicar"}
                                </small>
                                {g.publishedAt && !i.assignmentId && i.maxPoints !== undefined && (cap.global || cap.writeSections.includes(row.sectionId)) &&
                                  <button className="btn btn-ghost grade-edit" type="button" disabled={busy || blocked}
                                    aria-label={`Corregir nota de ${row.student.name} en ${i.title}`}
                                    onClick={e => { correctionTrigger.current = e.currentTarget; setCorrection({ grade: g, item: i, student: row.student.name }); }}>
                                    <PencilLine size={14} aria-hidden /> Corregir
                                  </button>}
                              </>
                            ) : (
                              <span className="hint">Pendiente</span>
                            )}
                          </td>
                        );
                      })}
                      {grouped && groups.map(group => {
                        const total = row.groupResults?.find(g => g.groupId === group.id);
                        return <td key={group.id} className="group-total-cell tnum">{total
                          ? <>{total.scorePercent} %<small className="hint">{total.pointsEarned} / {total.pointsPossible} pts</small></>
                          : <span className="hint">Sin notas publicadas</span>}</td>;
                      })}
                      <td className="grade-value tnum">
                        {row.partialAverage ?? "Pendiente"}
                      </td>
                      <td className="tnum">{row.publishedWeightPercent} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <div className="academic-footer">
        <nav className="actions" aria-label="Páginas del libro">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy || !!r.refreshing || !pages.length}
            onClick={previous}
          >
            Anterior
          </button>
          <span className="hint tnum">Página {pages.length + 1}</span>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy || blocked || !book?.hasMore}
            onClick={() => next(book!.nextCursor!)}
          >
            Siguiente
          </button>
        </nav>

      </div>
      {correction && <GradeCorrection session={session} slug={slug} courseId={course.id} target={correction}
        onSaved={r.reload} onClose={() => { setCorrection(undefined); requestAnimationFrame(() => correctionTrigger.current?.focus()); }} />}
    </div>
  );
}
