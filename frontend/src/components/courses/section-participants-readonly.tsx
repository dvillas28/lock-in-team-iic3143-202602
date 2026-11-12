"use client";
import { useId, useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import type { Course, Role, Section } from "../../lib/courses/validation.ts";
import { roleLabel } from "../../lib/courses/role-label.ts";
import { listSectionParticipants } from "../../lib/api/participants.ts";
import { EmptyState, ErrorState } from "../route-states.tsx";
import { RecordRowsSkeleton, type RecordCell } from "../academic/record-skeleton.tsx";
import { Skeleton } from "../skeletons.tsx";
import { useResource } from "./use-resource.ts";

export const readonlyColumns = ["Persona", "Rol"] as const;
type RoleFilter = Role | "all";
/** Local filter over the full, unpaginated roster; API order is kept and each person appears once. */
export const roleFilters: readonly (readonly [RoleFilter, string, string])[] = [
  ["all", "Todos", "Sin participantes activos"],
  ["teacher", "Docentes", "Sin docentes en esta sección"],
  ["assistant", "Ayudantes", "Sin ayudantes en esta sección"],
  ["student", "Estudiantes", "Sin estudiantes en esta sección"],
];
const cell: RecordCell = (column, row) => column === 0
  ? <Skeleton width={row % 2 ? "7rem" : "9rem"} />
  : <Skeleton shape="pill" width="5rem" />;

/**
 * Students and assistants read who shares their section: one row per person with every active role.
 * Only the sections the user belongs to are offered, and only the selected one is requested.
 */
export function SectionParticipantsReadonly({ session, slug, user, course, sections }: {
  session: Session;
  slug: string;
  user: CurrentUser;
  course: Course;
  /** Sections where the user holds an active enrollment, already scoped by the backend. */
  sections: Section[];
}) {
  const [selected, setSelected] = useState(() => sections[0]?.id ?? "");
  // The filter belongs to one section: any other section (picked or fallen back to) starts at «Todos».
  const [filterState, setFilter] = useState<{ section: string; role: RoleFilter }>({ section: "", role: "all" });
  const ids = useId();
  // A revoked section disappears from the refreshed context; fall back instead of keeping it.
  const active = sections.find(s => s.id === selected) ?? sections[0];
  // Keyed by tenant, course and section and never preserved: a change shows no previous roster.
  const result = useResource(session, `${slug}:${course.id}:${active?.id ?? ""}`,
    c => active ? listSectionParticipants(c, slug, active.id) : Promise.resolve(null), false);
  if (!active)
    return <EmptyState headingLevel={2} title="No tienes secciones asignadas" message="Cuando te inscriban en una sección de este curso, aparecerá aquí." />;
  const filter = filterState.section === active.id ? filterState.role : "all";
  const [, filterLabel, filterEmpty] = roleFilters.find(([value]) => value === filter)!;
  const caption = `Participantes de la sección ${active.code}${filter === "all" ? "" : ` · ${filterLabel}`}`;
  const items = result.data;
  const shown = items?.filter(p => filter === "all" || p.roles.includes(filter));
  return <section className="stack section-workspace participants-readonly">
    <div className="section-toolbar">
      <div className="section-field">
        {sections.length > 1 && <label className="field-label" htmlFor={`${ids}-section`}>Sección</label>}
        <div className="section-field-row">
          {sections.length > 1
            ? <select id={`${ids}-section`} name="participantSection" className="field" value={active.id}
              onChange={event => { setSelected(event.currentTarget.value); setFilter({ section: "", role: "all" }); }}>
              {sections.map(s => <option key={s.id} value={s.id}>Sección {s.code}</option>)}
            </select>
            : <p className="section-current">Sección {active.code}</p>}
        </div>
      </div>
    </div>
    <section className="stack" aria-labelledby={`${ids}-title`}>
      <h2 id={`${ids}-title`} className="serif">Participantes</h2>
      {result.error ? <ErrorState headingLevel={3} feedback={result.error} onRetry={() => void result.reload()} />
        : !items ? <RecordRowsSkeleton label="Cargando participantes…" caption={caption} headers={readonlyColumns} rows={4}
          scroll="table-scroll participants-table" cell={cell} />
          : !items.length ? <EmptyState headingLevel={3} title="Sin participantes activos" />
            : <>
              <div className="participant-filter-bar">
                <div className="tab-group participant-filter" role="group" aria-label="Filtrar por rol">
                  {roleFilters.map(([value, label]) => <button key={value} type="button" className={`tab-btn${filter === value ? " active" : ""}`}
                    aria-pressed={filter === value} aria-controls={`${ids}-roster`} onClick={() => setFilter({ section: active.id, role: value })}>{label}</button>)}
                </div>
                <p className="hint tnum" role="status">{shown!.length} {shown!.length === 1 ? "participante" : "participantes"}</p>
              </div>
              {!shown!.length ? <div id={`${ids}-roster`}><EmptyState headingLevel={3} title={filterEmpty} /></div>
              : <div id={`${ids}-roster`} className="table-scroll participants-table" role="region" aria-label={caption} tabIndex={0}>
              <table className="data-table">
                <caption>{caption}</caption>
                <thead><tr>{readonlyColumns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                <tbody>{shown!.map(p => <tr key={p.userId}>
                  <th scope="row"><span className="participant-name">{p.name}{p.userId === user.id && <span className="chip chip-primary participant-self">Tú</span>}</span></th>
                  <td><ul className="participant-roles" aria-label={`Roles de ${p.name}`}>{p.roles.map(role => <li key={role} className="chip">{roleLabel(role)}</li>)}</ul></td>
                </tr>)}</tbody>
              </table>
            </div>}
            </>}
    </section>
  </section>;
}
