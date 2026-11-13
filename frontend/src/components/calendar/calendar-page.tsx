"use client";
import { useMemo, useState } from "react";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import type { Session } from "../../lib/auth/session.ts";
import { listCourses } from "../../lib/api/courses.ts";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { EmptyState, ErrorState } from "../route-states.tsx";
import { Skeleton, SkeletonRegion } from "../skeletons.tsx";
import { DayAgenda } from "./day-agenda.tsx";
import { MonthGrid } from "./month-grid.tsx";
import { MonthNav } from "./month-nav.tsx";
import { useCalendar, type CalendarFilter } from "./use-calendar.ts";

const heading = <div className="page-heading">
  <div><p className="section-label">Espacio académico</p><h1>Calendario</h1>
    <p>Fechas de inicio, entrega y cierre de las tareas y quizzes de todos tus cursos.</p></div>
</div>;

const kinds = [["all", "Todo"], ["assignment", "Tareas"], ["quiz", "Quizzes"]] as const;
const legend = [["start", "Inicio o apertura"], ["due", "Entrega"], ["close", "Cierre"], ["past", "Ya ocurrió"]] as const;

export function CalendarPage() {
  const { session, state } = useSession();
  const context = state.context;
  if (!context?.user) return <div className="stack">{heading}</div>;
  return <Calendar key={`${state.generation}:${context.slug}`} session={session} slug={context.slug} user={context.user} />;
}

function Calendar({ session, slug, user }: Readonly<{ session: Session; slug: string; user: CurrentUser }>) {
  const [filter, setFilter] = useState<CalendarFilter>({ kind: "all", course: "" });
  const calendar = useCalendar(session, slug, filter);
  const { result } = calendar;
  const catalog = useResource(session, `${slug}:calendar:courses`, client => listCourses(client, slug));
  const readable = useMemo(() => new Set(user.sectionMemberships.filter(m => m.role !== "assistant").map(m => m.courseId)), [user.sectionMemberships]);
  const courses = (catalog.data ?? []).filter(c => readable.has(c.id));
  if (readable.size === 0) return <div className="stack">{heading}
    <EmptyState title="Sin cursos con plazos" message="El calendario muestra tareas y quizzes de los cursos donde eres docente o estudiante." /></div>;
  return <div className="stack">
    {heading}
    <div className="card calendar-toolbar">
      <div className="tab-group" role="group" aria-label="Tipo de actividad">
        {kinds.map(([kind, label]) => <button key={kind} type="button" className={`tab-btn${filter.kind === kind ? " active" : ""}`}
          aria-pressed={filter.kind === kind} onClick={() => setFilter(f => ({ ...f, kind }))}>{label}</button>)}
      </div>
      <label className="calendar-course-filter"><span className="field-label">Curso</span>
        <select className="field" value={filter.course} onChange={event => setFilter(f => ({ ...f, course: event.target.value }))}>
          <option value="">Todos los cursos</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
        </select>
      </label>
    </div>
    {result.error ? <ErrorState headingLevel={2} feedback={result.error} onRetry={() => void result.reload()} /> :
    <div className="calendar-layout">
      <section className="card calendar-main" aria-label="Mes">
        <MonthNav id="calendar-page-month" month={calendar.month} today={calendar.today} onMonth={calendar.showMonth} onToday={calendar.goToday} />
        <div className={result.refreshing ? "calendar-refreshing" : undefined} aria-busy={!!result.refreshing}>
          <MonthGrid variant="full" labelledBy="calendar-page-month" month={calendar.month} selected={calendar.selected} today={calendar.today} days={calendar.days} onSelect={calendar.select} now={calendar.now} />
        </div>
        <ul className="calendar-legend" aria-label="Leyenda">
          {legend.map(([tone, label]) => <li key={tone} className={`calendar-mark tone-${tone}`}><span className="calendar-dot" aria-hidden="true" />{label}</li>)}
        </ul>
      </section>
      <aside className="card calendar-side">
        {!result.data ? <SkeletonRegion label="Cargando plazos…"><Skeleton width="60%" /><Skeleton /><Skeleton width="80%" /></SkeletonRegion>
          : <DayAgenda day={calendar.selected} today={calendar.today} items={calendar.days.get(calendar.selected) ?? []} headingLevel={2} now={calendar.now} />}
      </aside>
    </div>}
  </div>;
}
