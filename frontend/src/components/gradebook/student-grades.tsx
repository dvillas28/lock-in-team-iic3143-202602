"use client";
import Link from "next/link";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { CourseWorkspace } from "../courses/course-workspace.tsx";
import { getStudentGrades } from "../../lib/api/gradebook.ts";
import { LoadingState } from "../route-states.tsx";
import { AcademicDate, ResourceFeedback } from "../academic/feedback.tsx";
export function StudentGrades({ courseId }: Readonly<{ courseId: string }>) {
  return (
    <CourseWorkspace courseId={courseId} title="Mis notas" active="/grades">
      {() => <Grades courseId={courseId} />}
    </CourseWorkspace>
  );
}
function Grades({ courseId }: Readonly<{ courseId: string }>) {
  const { session, state } = useSession(),
    context = state.context!,
    slug = context.slug;
  const r = useResource(
    session,
    `${state.generation}:${slug}:${JSON.stringify(context.user)}:${courseId}:grades`,
    (c) => getStudentGrades(c, slug, courseId),
  );
  if (!r.data)
    return r.error ? (
      <ResourceFeedback error={r.error} retry={() => void r.reload()} />
    ) : (
      <LoadingState />
    );
  const d = r.data;
  return (
    <div className="stack" aria-busy={!!r.refreshing}>
      {r.error && (
        <ResourceFeedback error={r.error} retry={() => void r.reload()} />
      )}
      <section
        className="card panel grade-summary"
        aria-label="Resumen de notas publicadas"
      >
        <div>
          <h2>{d.isPartial ? "Promedio parcial" : "Promedio publicado"}</h2>
          <p className="metric tnum">{d.partialAverage ?? "Pendiente"}</p>
        </div>
        <div>
          <p className="section-label">Peso de grupos con notas</p>
          <p className="grade-weight tnum">{d.publishedWeightPercent} %</p>
          <p className="hint">
            {d.isPartial
              ? "El promedio se calcula con los resultados publicados hasta ahora."
              : "Todas las ponderaciones están publicadas."}
          </p>
        </div>
      </section>
      {d.calculation === "points" && !!d.groupResults?.length && <section className="grade-group-strip" aria-label="Subtotales por grupo">
        <h2>Resultados por grupo</h2>
        <ul>{d.groupResults.map(group => <li key={group.groupId}>
          <div><strong>{group.title}</strong><p className="hint tnum">{group.pointsEarned} / {group.pointsPossible} pts · {group.weightPercent} % del curso</p></div>
          <strong className="grade-value tnum">{group.scorePercent} %</strong>
        </li>)}</ul>
      </section>}
      {!d.items.length ? (
        <section className="empty-zone panel stack">
          <h2>Aún no hay notas publicadas</h2>
          <p className="hint">
            Tus resultados aparecerán aquí cuando el equipo docente los
            publique.
          </p>
        </section>
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-label="Notas publicadas"
          tabIndex={0}
        >
          <table className="data-table">
            <caption>Resultados propios publicados</caption>
            <thead>
              <tr>
                {[
                  "Evaluación",
                  d.calculation === "points" ? "Grupo" : "Ponderación",
                  "Resultado",
                  "Nota",
                  "Publicación",
                ].map((x) => (
                  <th scope="col" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.items.map((i) => (
                <tr key={i.gradeItemId}>
                  <th scope="row">{i.assignmentId
                    ? <Link className="text-link" href={`/courses/${courseId}/assignments/${i.assignmentId}`}>{i.title}</Link>
                    : i.title}</th>
                  <td className="tnum">{d.calculation === "points" ? i.groupTitle : `${i.weightPercent} %`}</td>
                  <td className="tnum">{i.scorePercent===null ? "—" : `${i.scorePercent} %`}
                    {i.maxPoints !== undefined && <small className="grade-state hint">{i.pointsEarned} / {i.maxPoints} pts</small>}
                  </td>
                  <td className="grade-value tnum">{i.grade ?? "Sin nota numérica"}</td>
                  <td>
                    <AcademicDate value={i.publishedAt} />
                    {i.revisedAt && <small className="grade-state">Corregida <AcademicDate value={i.revisedAt} /></small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
