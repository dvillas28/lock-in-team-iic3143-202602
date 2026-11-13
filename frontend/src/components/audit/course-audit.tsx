"use client";
import { useRef, useState, type ReactNode } from "react";
import {
  Award, BookOpen, ChartColumn, ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList, FileText,
  History, Layers, ListChecks, SlidersHorizontal, Target, UserCheck, Users, X, type LucideIcon,
} from "lucide-react";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useRecordPage } from "../courses/use-record-page.ts";
import { CourseWorkspace } from "../courses/course-workspace.tsx";
import { AdminDialogFrame } from "../courses/admin-dialog.tsx";
import { listSections } from "../../lib/api/sections.ts";
import { listCourseAuditEvents } from "../../lib/api/audit.ts";
import { auditFilters, snapshot, type AuditEvent, type AuditFilters } from "../../lib/audit/validation.ts";
import { gradebookCapabilities } from "../../lib/gradebook/capabilities.ts";
import type { Course } from "../../lib/courses/validation.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import { AcademicDate, ResourceFeedback, shortId } from "../academic/feedback.tsx";
import { auditActions, auditFamily, auditResources } from "../../lib/audit/presentation.ts";

const fields = ["sectionId", "action", "resourceType", "resourceId", "actorUserId", "from", "to"] as const;
type Field = (typeof fields)[number];
type Draft = Partial<Record<Field, string>>;
const filterNames: Record<Field, string> = {
  sectionId: "Sección", action: "Acción", resourceType: "Recurso", resourceId: "ID recurso",
  actorUserId: "ID actor", from: "Desde", to: "Hasta",
};
const resourceIcons: Record<string, LucideIcon> = {
  course: BookOpen, section: Users, enrollment: UserCheck, courseModule: Layers, material: FileText,
  academicFile: FileText, quiz: ListChecks, assignmentAttempt: ClipboardCheck, quizAttempt: ClipboardList,
  grade: Award, gradebook: ChartColumn, gradeItem: Target,
};
const fieldNames: Record<string, string> = {
  title: "Título", name: "Nombre", code: "Código", description: "Descripción", position: "Posición",
  published: "Publicado", isPublished: "Publicado", active: "Activa", role: "Rol", status: "Estado",
  markdownBody: "Contenido", weightPercent: "Ponderación (%)", capacity: "Cupo", score: "Puntaje",
  maxPoints: "Puntaje máximo", grade: "Nota", value: "Valor", opensAt: "Apertura", closesAt: "Cierre",
  dueAt: "Entrega", availableFrom: "Disponible desde", availableUntil: "Disponible hasta",
};
const pad = (n: number) => String(n).padStart(2, "0");
const localInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`;
const periods = [
  { id: "all", label: "Todo", days: undefined },
  { id: "today", label: "Hoy", days: 0 },
  { id: "7d", label: "7 días", days: 6 },
  { id: "30d", label: "30 días", days: 29 },
] as const;
function periodStart(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localInput(d);
}
const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function dayLabel(key: string) {
  const today = new Date(), yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (key === dayKey(today.toISOString())) return "Hoy";
  if (key === dayKey(yesterday.toISOString())) return "Ayer";
  const [y, m, d] = key.split("-").map(Number), date = new Date(y, m - 1, d);
  const text = date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: y === today.getFullYear() ? undefined : "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

export function CourseAudit({ courseId }: Readonly<{ courseId: string }>) {
  return (
    <CourseWorkspace courseId={courseId} title="Auditoría del curso" active="/audit">
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
  const [selected, setSelected] = useState<AuditEvent>(), [opening, setOpening] = useState(0);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const cap = gradebookCapabilities(user, course),
    owner = user.institutionMembership.isAdmin && course.createdBy === user.id;
  const scope = `${state.generation}:${slug}:${JSON.stringify(user)}:${course.id}`;
  const meta = useResource(session, `${scope}:sections`, async (c) => {
    if (!cap.audit) throw new ApiHttpError(403);
    return listSections(c, slug, course.id);
  });
  const page = useRecordPage(session, `${scope}:${JSON.stringify(filters)}`, cursor, async (c) => {
    if (!cap.audit) throw new ApiHttpError(403);
    const p = await listCourseAuditEvents(c, slug, course.id, user.institutionMembership.institution.id, { ...filters, cursor });
    if (!owner && p.items.some((e) => e.sectionId === null || !cap.writeSections.includes(e.sectionId)))
      throw new ApiHttpError(403);
    return p;
  });
  const shownIndex = page.retained ? pages.findIndex((p) => p === page.shownCursor) : pages.length;
  const active = fields.filter((k) => filters[k]);
  const busy = !!page.refreshing;

  function apply(values: Draft) {
    const clean = Object.fromEntries(fields.map((k) => [k, (values[k] ?? "").trim()])) as Draft;
    setDraft(clean);
    const invalid: Draft = {};
    for (const k of fields)
      if (clean[k])
        try { auditFilters({ [k]: clean[k] }); } catch (e) { invalid[k] = (e as Error).message; }
    if (!Object.keys(invalid).length)
      try {
        const q = auditFilters(Object.fromEntries(Object.entries(clean).filter(([, v]) => v)));
        setFilters(q);
        setCursor(undefined);
        setPages([]);
        // Reapplying unchanged filters is an explicit retry, not a no-op.
        if (JSON.stringify(q) === JSON.stringify(filters) && !cursor) void page.reload();
      } catch (e) {
        invalid.to = (e as Error).message;
      }
    setErrors(invalid);
  }
  function clear() {
    setDraft({});
    setErrors({});
    setFilters({});
    setCursor(undefined);
    setPages([]);
    if (!active.length && !cursor) void page.reload();
  }
  const currentPeriod = !filters.from && !filters.to ? "all"
    : periods.find((p) => p.days !== undefined && !filters.to && filters.from === new Date(periodStart(p.days)).toISOString())?.id;
  const sectionName = (id: string) => meta.data?.find((s) => s.id === id)?.code ?? shortId(id);
  const actorName = (id: string | null) => !id ? "Sistema" : id === user.id ? "Tú" : `Usuario ${shortId(id)}`;
  const input = (name: Field, label: string, type = "text", maxLength?: number) => (
    <label className="field-label">
      {label}
      <input className="field" name={name} value={draft[name] ?? ""} type={type} maxLength={maxLength}
        onChange={(e) => setDraft((v) => ({ ...v, [name]: e.target.value }))}
        step={type === "datetime-local" ? 1 : undefined}
        aria-invalid={!!errors[name] || undefined}
        aria-describedby={errors[name] ? `audit-${name}-error` : undefined} />
      {errors[name] && <span id={`audit-${name}-error`} className="field-error" role="alert">{errors[name]}</span>}
    </label>
  );
  const select = (name: Field, label: string, all: string, options: [string, string][]) => (
    <label className="field-label">
      {label}
      <select className="field" name={name} value={draft[name] ?? ""} disabled={busy}
        onChange={(e) => apply({ ...draft, [name]: e.target.value })}>
        <option value="">{all}</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  );
  const groups = new Map<string, AuditEvent[]>();
  for (const e of page.data?.items ?? []) {
    const key = dayKey(e.occurredAt);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <div className="stack audit-view">
      <form className="card audit-toolbar" aria-label="Filtros de auditoría"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          const data = new FormData(e.currentTarget);
          apply(Object.fromEntries(fields.map((k) => [k, String(data.get(k) ?? "")])) as Draft);
        }}>
        <div className="audit-filter-row">
          {select("action", "Acción", "Todas las acciones", Object.entries(auditActions))}
          {select("resourceType", "Recurso", "Todos los recursos", Object.entries(auditResources))}
          {select("sectionId", "Sección", "Todas las autorizadas",
            (meta.data ?? []).filter((s) => owner || cap.writeSections.includes(s.id)).map((s) => [s.id, `Sección ${s.code}`]))}
          <div className="audit-period">
            <span className="field-label" id="audit-period-label">Período</span>
            <div className="tab-group" role="group" aria-labelledby="audit-period-label">
              {periods.map((p) => (
                <button key={p.id} type="button" disabled={busy}
                  className={`tab-btn${currentPeriod === p.id ? " active" : ""}`} aria-pressed={currentPeriod === p.id}
                  onClick={() => apply({ ...draft, from: p.days === undefined ? "" : periodStart(p.days), to: "" })}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <details className="audit-more" open={Object.keys(errors).length > 0 || undefined}>
          <summary><SlidersHorizontal size={16} aria-hidden="true" />Más filtros</summary>
          <div className="audit-more-body">
            <div className="form-grid">
              {input("from", "Desde (hora local)", "datetime-local")}
              {input("to", "Hasta (hora local)", "datetime-local")}
              {input("resourceId", "UUID recurso", "text", 36)}
              {input("actorUserId", "UUID actor", "text", 36)}
            </div>
            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>Aplicar filtros</button>
            </div>
          </div>
        </details>
      </form>

      {active.length > 0 && (
        <div className="audit-active" role="status">
          <span className="hint">Filtros activos</span>
          {active.map((k) => (
            <span className="chip chip-primary audit-chip" key={k}>
              {filterNames[k]}:{" "}
              {k === "sectionId" ? sectionName(filters[k]!)
                : k === "from" || k === "to" ? <AcademicDate value={filters[k]!} />
                : k === "action" ? auditActions[filters[k]!] ?? filters[k]
                : k === "resourceType" ? auditResources[filters[k]!] ?? filters[k]
                : shortId(filters[k]!)}
              <button type="button" aria-label={`Quitar filtro ${filterNames[k]}`} disabled={busy}
                onClick={() => apply({ ...draft, [k]: "" })}>
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          <button type="button" className="btn btn-ghost audit-clear" disabled={busy} onClick={clear}>Limpiar filtros</button>
        </div>
      )}

      {meta.error && <ResourceFeedback error={meta.error} retry={() => void meta.reload()} />}
      {page.error && <ResourceFeedback error={page.error} retry={() => void page.reload()} />}
      {page.retained && (
        <p className="notice" role="status">
          Se conserva la última página consultada. No se pudo cargar la página solicitada.
        </p>
      )}

      <section aria-busy={busy} aria-label="Actividad del curso" className="stack">
        {!page.data ? (
          !page.error && <TimelineSkeleton />
        ) : !page.data.items.length ? (
          <div className="empty-zone panel stack audit-empty">
            <History size={24} aria-hidden="true" />
            <h2 className="serif">Sin actividad registrada</h2>
            <p className="hint">
              {active.length ? "No hay eventos con estos filtros. Prueba con otro período o limpia los filtros." : "Aún no hay cambios auditados en este curso."}
            </p>
            {active.length > 0 && <button type="button" className="btn btn-ghost" onClick={clear}>Limpiar filtros</button>}
          </div>
        ) : (
          Array.from(groups).map(([key, events]) => (
            <section key={key} className="card audit-day" aria-labelledby={`audit-day-${key}`}>
              <header>
                <h2 id={`audit-day-${key}`} className="serif">{dayLabel(key)}</h2>
                <span className="hint tnum">
                  {events.length}<span className="sr-only"> {events.length === 1 ? "evento" : "eventos"}</span>
                </span>
              </header>
              <ol className="audit-list">
                {events.map((e) => {
                  const Icon = resourceIcons[e.resourceType] ?? History, family = auditFamily(e.action);
                  return (
                    <li key={e.id}>
                      <button type="button" className="audit-row" aria-haspopup="dialog"
                        onClick={(ev) => { trigger.current = ev.currentTarget; setSelected(e); setOpening((n) => n + 1); }}>
                        <span className={`audit-icon audit-tone-${family.tone}`}><Icon size={18} aria-hidden="true" /></span>
                        <span className="audit-row-copy">
                          <span className="audit-row-title">{auditActions[e.action] ?? e.action}</span>
                          <span className="hint">
                            <strong className="audit-actor">{actorName(e.actorUserId)}</strong>
                            {" · "}{auditResources[e.resourceType] ?? e.resourceType}
                            {" · "}{e.sectionId ? `Sección ${sectionName(e.sectionId)}` : "Todo el curso"}
                          </span>
                        </span>
                        <span className="audit-row-meta">
                          <span className={`chip${family.tone === "neutral" ? "" : ` chip-${family.tone}`}`}>{family.label}</span>
                          <time className="tnum" dateTime={e.occurredAt} title={e.occurredAt}>{time(e.occurredAt)}</time>
                        </span>
                        <ChevronRight className="audit-chevron" size={16} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        )}
      </section>

      <footer className="audit-footer">
        <p className="hint">
          Solo lectura · horas en {Intl.DateTimeFormat().resolvedOptions().timeZone}; el detalle conserva el registro UTC.
        </p>
        <nav className="audit-pager" aria-label="Páginas de auditoría">
          <button className="btn btn-ghost" type="button" disabled={busy || shownIndex <= 0}
            onClick={() => { setCursor(pages[shownIndex - 1]); setPages((p) => p.slice(0, shownIndex - 1)); }}>
            <ChevronLeft size={16} aria-hidden="true" />Anterior
          </button>
          <span className="hint tnum">Página {shownIndex + 1}</span>
          <button className="btn btn-ghost" type="button" disabled={busy || !!page.error || !page.data?.hasMore}
            onClick={() => { setPages((p) => [...p, cursor]); setCursor(page.data!.nextCursor!); }}>
            Siguiente<ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      </footer>

      <AdminDialogFrame open={!!selected} opening={opening} title={selected ? auditActions[selected.action] ?? selected.action : ""}
        className="audit-dialog" onClose={() => setSelected(undefined)} onClosed={() => trigger.current?.focus()}>
        {() => selected && <EventDetail event={selected} actor={actorName(selected.actorUserId)}
          section={selected.sectionId ? `Sección ${sectionName(selected.sectionId)}` : "Todo el curso"} />}
      </AdminDialogFrame>
    </div>
  );
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
function show(value: unknown): ReactNode {
  if (value === undefined) return <span className="hint">—</span>;
  if (value === null || value === "") return <span className="hint">Vacío</span>;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

function EventDetail({ event: e, actor, section }: Readonly<{ event: AuditEvent; actor: string; section: string }>) {
  const [all, setAll] = useState(false);
  const before = e.changes.before, after = e.changes.after;
  const b = isObject(before) ? before : {}, a = isObject(after) ? after : {};
  const rows = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).map((key) => ({
    key, before: key in b ? b[key] : undefined, after: key in a ? a[key] : undefined,
    changed: JSON.stringify(b[key]) !== JSON.stringify(a[key]),
  }));
  const changed = rows.filter((r) => r.changed), visible = all ? rows : changed;
  const family = auditFamily(e.action);
  return (
    <>
      <div className="audit-detail-head">
        <span className={`chip${family.tone === "neutral" ? "" : ` chip-${family.tone}`}`}>{family.label}</span>
        <span className="hint"><AcademicDate value={e.occurredAt} /></span>
      </div>
      <dl className="audit-facts">
        <div><dt>Actor</dt><dd>{actor}</dd></div>
        <div><dt>Recurso</dt><dd>{auditResources[e.resourceType] ?? e.resourceType} <code>{shortId(e.resourceId)}</code></dd></div>
        <div><dt>Alcance</dt><dd>{section}</dd></div>
        <div><dt>Acción</dt><dd><code>{e.action}</code></dd></div>
      </dl>
      <div className="audit-diff-heading">
        <h3>Cambios</h3>
        {rows.length > changed.length && (
          <label className="audit-toggle">
            <input type="checkbox" checked={all} onChange={(ev) => setAll(ev.target.checked)} />
            Mostrar campos sin cambios
          </label>
        )}
      </div>
      {!visible.length ? (
        <p className="hint">No hay campos modificados en este registro.</p>
      ) : (
        <div className="table-scroll audit-diff">
          <table className="data-table">
            <caption className="sr-only">Comparación antes y después</caption>
            <thead><tr><th scope="col">Campo</th><th scope="col">Antes</th><th scope="col">Después</th></tr></thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.key} className={r.changed ? "audit-changed" : undefined}>
                  <th scope="row">{fieldNames[r.key] ?? r.key}</th>
                  <td className="audit-before">{show(r.before)}</td>
                  <td className="audit-after">{show(r.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className="audit-raw">
        <summary>Ver registro completo</summary>
        <dl className="audit-facts">
          <div><dt>Fecha UTC</dt><dd>{e.occurredAt}</dd></div>
          <div><dt>Actor</dt><dd>{e.actorUserId ?? "Sin actor"}</dd></div>
          <div><dt>Recurso</dt><dd>{e.resourceId}</dd></div>
          <div><dt>Sección</dt><dd>{e.sectionId ?? "Global del curso"}</dd></div>
        </dl>
        <p className="field-label">Antes</p>
        <pre className="markdown-source">{before === undefined ? "No disponible" : snapshot(before)}</pre>
        <p className="field-label">Después</p>
        <pre className="markdown-source">{after === undefined ? "No disponible" : snapshot(after)}</pre>
      </details>
    </>
  );
}

function TimelineSkeleton() {
  return (
    <SkeletonRegion label="Cargando actividad…">
      {[4, 3].map((rows, g) => (
        <section key={g} className="card audit-day">
          <header><h2 className="serif"><Skeleton width="7rem" /></h2></header>
          <ol className="audit-list">
            {Array.from({ length: rows }, (_, i) => (
              <li key={i}>
                <div className="audit-row">
                  <span className="audit-icon"><Skeleton shape="block" width="18px" height="18px" /></span>
                  <span className="audit-row-copy">
                    <span className="audit-row-title"><Skeleton width={i % 2 ? "11rem" : "15rem"} /></span>
                    <span className="hint"><Skeleton width="13rem" /></span>
                  </span>
                  <span className="audit-row-meta"><Skeleton shape="pill" width="5rem" /><Skeleton width="2.5rem" /></span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </SkeletonRegion>
  );
}
