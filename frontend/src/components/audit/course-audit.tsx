"use client";
import { useState } from "react";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useRecordPage } from "../courses/use-record-page.ts";
import { CourseWorkspace } from "../courses/course-workspace.tsx";
import { listSections } from "../../lib/api/sections.ts";
import { listCourseAuditEvents } from "../../lib/api/audit.ts";
import {
  auditFilters,
  snapshot,
  type AuditFilters,
} from "../../lib/audit/validation.ts";
import { gradebookCapabilities } from "../../lib/gradebook/capabilities.ts";
import type { Course } from "../../lib/courses/validation.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { LoadingState } from "../route-states.tsx";
import {
  AcademicDate,
  ResourceFeedback,
  shortId,
} from "../academic/feedback.tsx";
import { auditActions, auditResources } from "../../lib/audit/presentation.ts";
const fields = [
  "sectionId",
  "action",
  "resourceType",
  "resourceId",
  "actorUserId",
  "from",
  "to",
] as const;
type Draft = Partial<Record<(typeof fields)[number], string>>;
export function CourseAudit({ courseId }: Readonly<{ courseId: string }>) {
  return (
    <CourseWorkspace
      courseId={courseId}
      title="Auditoría del curso"
      active="/audit"
    >
      {(course) => <Audit course={course} />}
    </CourseWorkspace>
  );
}
function Audit({ course }: Readonly<{ course: Course }>) {
  const { session, state } = useSession(),
    user = state.context!.user!,
    slug = state.context!.slug;
  const [filters, setFilters] = useState<AuditFilters>({}),
    [draft, setDraft] = useState<Draft>({}),
    [errors, setErrors] = useState<Draft>({});
  const [cursor, setCursor] = useState<string>(),
    [pages, setPages] = useState<(string | undefined)[]>([]);
  const cap = gradebookCapabilities(user, course),
    owner = user.institutionMembership.isAdmin && course.createdBy === user.id;
  const scope = `${state.generation}:${slug}:${JSON.stringify(user)}:${course.id}`;
  const meta = useResource(session, `${scope}:sections`, async (c) => {
    if (!cap.audit) throw new ApiHttpError(403);
    return listSections(c, slug, course.id);
  });
  const page = useRecordPage(
    session,
    `${scope}:${JSON.stringify(filters)}`,
    cursor,
    async (c) => {
      if (!cap.audit) throw new ApiHttpError(403);
      const p = await listCourseAuditEvents(
        c,
        slug,
        course.id,
        user.institutionMembership.institution.id,
        { ...filters, cursor },
      );
      if (
        !owner &&
        p.items.some(
          (e) =>
            e.sectionId === null || !cap.writeSections.includes(e.sectionId),
        )
      )
        throw new ApiHttpError(403);
      return p;
    },
  );
  const shownIndex = page.retained
    ? pages.findIndex((p) => p === page.shownCursor)
    : pages.length;
  const update = (name: keyof Draft, value: string) =>
    setDraft((v) => ({ ...v, [name]: value }));
  function apply(form: HTMLFormElement) {
    const values = Object.fromEntries(
      fields.map((k) => [k, String(new FormData(form).get(k) ?? "").trim()]),
    ) as Draft;
    setDraft(values);
    const invalid: Draft = {};
    for (const k of fields)
      if (values[k])
        try {
          auditFilters({ [k]: values[k] });
        } catch (e) {
          invalid[k] = (e as Error).message;
        }
    if (!Object.keys(invalid).length)
      try {
        const q = auditFilters(
          Object.fromEntries(Object.entries(values).filter(([, v]) => v)),
        );
        setFilters(q);
        setCursor(undefined);
        setPages([]);
        // Reapplying unchanged filters is an explicit retry, not a no-op.
        if (JSON.stringify(q) === JSON.stringify(filters) && !cursor)
          void page.reload();
      } catch (e) {
        invalid.to = (e as Error).message;
      }
    setErrors(invalid);
  }
  const input = (
    name: keyof Draft,
    label: string,
    type = "text",
    maxLength?: number,
  ) => (
    <label className="field-label">
      {label}
      <input
        className="field"
        name={name}
        value={draft[name] ?? ""}
        onChange={(e) => update(name, e.target.value)}
        type={type}
        step={type === "datetime-local" ? 1 : undefined}
        maxLength={maxLength}
        aria-invalid={!!errors[name] || undefined}
        aria-describedby={errors[name] ? `audit-${name}-error` : undefined}
      />
      {errors[name] && (
        <span id={`audit-${name}-error`} className="field-error" role="alert">
          {errors[name]}
        </span>
      )}
    </label>
  );
  const sectionName = (id: string) =>
    meta.data?.find((s) => s.id === id)?.code ?? shortId(id);
  return (
    <div className="stack">
      <form
        className="card panel stack audit-filters"
        aria-label="Filtros de auditoría"
        onSubmit={(e) => {
          e.preventDefault();
          if (!page.refreshing) apply(e.currentTarget);
        }}
      >
        <div>
          <h2>Filtrar actividad</h2>
          <p className="hint">
            Consulta los cambios del curso y de tus secciones autorizadas.
          </p>
        </div>
        <div className="form-grid">
          <label className="field-label">
            Sección histórica
            <select
              className="field"
              name="sectionId"
              value={draft.sectionId ?? ""}
              onChange={(e) => update("sectionId", e.target.value)}
            >
              <option value="">Todas las autorizadas</option>
              {meta.data
                ?.filter((s) => owner || cap.writeSections.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    Sección {s.code}
                  </option>
                ))}
            </select>
          </label>
          <label className="field-label">
            Acción
            <select
              className="field"
              name="action"
              value={draft.action ?? ""}
              onChange={(e) => update("action", e.target.value)}
            >
              <option value="">Todas las acciones</option>
              {Object.entries(auditActions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Tipo de recurso
            <select
              className="field"
              name="resourceType"
              value={draft.resourceType ?? ""}
              onChange={(e) => update("resourceType", e.target.value)}
            >
              <option value="">Todos los recursos</option>
              {Object.entries(auditResources).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {input("from", "Desde (hora local, inclusive)", "datetime-local")}
          {input("to", "Hasta (hora local, inclusive)", "datetime-local")}
        </div>
        <details className="academic-disclosure">
          <summary>Filtros avanzados por identificador</summary>
          <div className="form-grid">
            {input("resourceId", "UUID recurso", "text", 36)}
            {input("actorUserId", "UUID actor", "text", 36)}
          </div>
        </details>
        <div className="actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!!page.refreshing}
          >
            Aplicar filtros
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={!!page.refreshing}
            onClick={() => {
              setDraft({});
              setErrors({});
              setFilters({});
              setCursor(undefined);
              setPages([]);
              if (!Object.keys(filters).length && !cursor) void page.reload();
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </form>
      {meta.error && (
        <ResourceFeedback error={meta.error} retry={() => void meta.reload()} />
      )}
      <div className="actions audit-filter-summary" role="status">
        <span className="hint">Filtros activos:</span>
        {fields.filter((k) => filters[k]).length ? (
          fields
            .filter((k) => filters[k])
            .map((k) => (
              <span className="chip" key={k}>
                {
                  {
                    sectionId: "Sección",
                    action: "Acción",
                    resourceType: "Recurso",
                    resourceId: "ID recurso",
                    actorUserId: "ID actor",
                    from: "Desde",
                    to: "Hasta",
                  }[k]
                }
                :{" "}
                {k === "sectionId" ? (
                  sectionName(filters[k]!)
                ) : k === "from" || k === "to" ? (
                  <AcademicDate value={filters[k]!} />
                ) : k === "action" ? (
                  (auditActions[filters[k]!] ?? filters[k])
                ) : k === "resourceType" ? (
                  (auditResources[filters[k]!] ?? filters[k])
                ) : (
                  filters[k]
                )}
              </span>
            ))
        ) : (
          <span className="hint">Todas las actividades autorizadas</span>
        )}
      </div>
      <p className="hint">
        Fechas en hora local ({Intl.DateTimeFormat().resolvedOptions().timeZone}
        ). El detalle conserva el registro UTC.
      </p>
      {page.error && (
        <ResourceFeedback error={page.error} retry={() => void page.reload()} />
      )}
      {page.retained && (
        <p className="notice" role="status">
          Se conserva la última página consultada. No se pudo cargar la página
          solicitada.
        </p>
      )}
      <section aria-busy={!!page.refreshing}>
        {!page.data ? (
          !page.error && <LoadingState />
        ) : !page.data.items.length ? (
          <div className="empty-zone panel stack">
            <h2>No hay eventos en esta página</h2>
            <p className="hint">
              Prueba con otro período o limpia los filtros para ampliar la
              consulta.
            </p>
          </div>
        ) : (
          <div
            className="table-scroll"
            role="region"
            aria-label="Actividad del curso"
            tabIndex={0}
          >
            <table className="data-table audit-table">
              <caption>Historial de actividad del curso</caption>
              <thead>
                <tr>
                  {[
                    "Fecha",
                    "Actor",
                    "Acción",
                    "Recurso",
                    "Sección histórica",
                    "Cambios",
                  ].map((x) => (
                    <th key={x} scope="col">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.data.items.map((e) => (
                  <tr key={e.id}>
                    <th scope="row" className="tnum">
                      <AcademicDate value={e.occurredAt} />
                    </th>
                    <td>
                      {e.actorUserId
                        ? `Usuario ${shortId(e.actorUserId)}`
                        : "Sin actor"}
                    </td>
                    <td>{auditActions[e.action] ?? e.action}</td>
                    <td>
                      {auditResources[e.resourceType] ?? e.resourceType}{" "}
                      <small className="hint">{shortId(e.resourceId)}</small>
                    </td>
                    <td>
                      {e.sectionId
                        ? sectionName(e.sectionId)
                        : "Global del curso"}
                    </td>
                    <td>
                      <details className="audit-event-detail">
                        <summary>Ver antes y después</summary>
                        <dl>
                          <dt>Fecha UTC</dt>
                          <dd>{e.occurredAt}</dd>
                          <dt>Actor</dt>
                          <dd>{e.actorUserId ?? "Sin actor"}</dd>
                          <dt>Acción</dt>
                          <dd>{e.action}</dd>
                          <dt>Recurso</dt>
                          <dd>{e.resourceId}</dd>
                          <dt>Sección histórica</dt>
                          <dd>{e.sectionId ?? "Global del curso"}</dd>
                        </dl>
                        <p>Antes</p>
                        <pre className="markdown-source">
                          {e.changes.before === undefined
                            ? "No disponible"
                            : snapshot(e.changes.before)}
                        </pre>
                        <p>Después</p>
                        <pre className="markdown-source">
                          {e.changes.after === undefined
                            ? "No disponible"
                            : snapshot(e.changes.after)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <nav className="actions" aria-label="Páginas de auditoría">
        <button
          className="btn btn-ghost"
          type="button"
          disabled={!!page.refreshing || shownIndex <= 0}
          onClick={() => {
            setCursor(pages[shownIndex - 1]);
            setPages((p) => p.slice(0, shownIndex - 1));
          }}
        >
          Anterior
        </button>
        <span className="hint tnum">Página {shownIndex + 1}</span>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={!!page.refreshing || !!page.error || !page.data?.hasMore}
          onClick={() => {
            setPages((p) => [...p, cursor]);
            setCursor(page.data!.nextCursor!);
          }}
        >
          Siguiente
        </button>
      </nav>
    </div>
  );
}
