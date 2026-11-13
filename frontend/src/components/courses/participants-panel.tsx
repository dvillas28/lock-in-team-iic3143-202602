"use client";
import { ChevronLeft, ChevronRight, UserPlus, UserRoundCog } from "lucide-react";
import { roleLabel } from "../../lib/courses/role-label.ts";
import { useId, useRef, useState } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import {
  FieldError,
  roles,
  type Course,
  type Section,
  type Enrollment,
  type Role,
} from "../../lib/courses/validation.ts";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import {
  listSectionEnrollments,
  updateSectionEnrollment,
  type EnrollmentStatus,
} from "../../lib/api/enrollments.ts";
import { EmptyState, ErrorState } from "../route-states.tsx";
import { RecordRowsSkeleton } from "../academic/record-skeleton.tsx";
import { participantCell, participantColumns } from "./sections-skeleton.tsx";
import { EnrollmentForm, fullMessage } from "./enrollment-form.tsx";
import { EnrollmentManagement, type ManagementChange } from "./enrollment-management.tsx";
import { AdminDialog, AdminDialogFrame } from "./admin-dialog.tsx";
import { useContentNotice } from "../content/content-notices.tsx";
import { useMutation } from "./use-mutation.ts";
import { useResource } from "./use-resource.ts";
const views: { status: EnrollmentStatus; label: string; caption: string }[] = [
  { status: "active", label: "Activas", caption: "Matrículas activas" },
  { status: "historical", label: "Historial", caption: "Matrículas históricas" },
];
const lastTeacher = "La sección debe conservar al menos un docente activo. Asigna primero a otro docente.";
const forbidden = "Tu cuenta no puede gestionar esta matrícula. Solo el propietario del curso administra matrículas docentes.";
const gone = "Esta matrícula ya no existe en la sección. El listado se actualizó.";
const changedMeanwhile = "La matrícula cambió mientras la editabas. El listado se actualizó; revisa su estado actual.";
export function ParticipantsPanel(props: {
  session: Session;
  slug: string;
  user: CurrentUser;
  course: Course;
  section: Section;
}) {
  if (!capabilities(props.user, props.course, props.section).manage)
    return null;
  return (
    <Participants
      key={`${props.slug}:${props.course.id}:${props.section.id}`}
      {...props}
    />
  );
}
function Participants({
  session,
  slug,
  user,
  course,
  section,
}: {
  session: Session;
  slug: string;
  user: CurrentUser;
  course: Course;
  section: Section;
}) {
  // Only the API supplies forward cursors. Keep the path from page one for this view.
  const [trail, setTrail] = useState<(string | undefined)[]>([undefined]);
  const cursor = trail.at(-1);
  const [paged, setPaged] = useState(false);
  const rosterId = useId();
  // The roster opens on active enrollments; revoked or replaced ones live in their own view.
  const [view, setView] = useState<EnrollmentStatus>("active");
  const historical = view === "historical";
  const caption = views.find((v) => v.status === view)!.caption;
  const columns = historical ? participantColumns.slice(0, 3) : participantColumns;
  const result = useResource(
    session,
    `${slug}:${section.id}:${view}:${cursor ?? ""}`,
    (c) => listSectionEnrollments(c, slug, section.id, cursor, undefined, view),
  );
  function show(next: EnrollmentStatus) {
    if (next === view) return;
    setView(next);
    setTrail([undefined]);
    setPaged(false);
  }
  const nextCursor = !result.error && !result.refreshing ? result.data?.nextCursor : undefined;
  const canAdvance = !!nextCursor && !!result.data?.hasMore && !trail.includes(nextCursor);
  const canGoBack = trail.length > 1;
  function nextPage() {
    if (!nextCursor || !canAdvance) return;
    setPaged(true);
    setTrail(previous => previous.includes(nextCursor) ? previous : [...previous, nextCursor]);
  }
  function previousPage() {
    if (canGoBack)
      setTrail(previous => previous.length > 1 ? previous.slice(0, -1) : previous);
  }
  const can = capabilities(user, course, section);
  // One mutation for the roster: an uncertain write keeps every other row locked until it is reviewed.
  const mutation = useMutation(session, {
    codes: { LAST_SECTION_TEACHER: lastTeacher, SECTION_FULL: fullMessage(can.teachers),
      SECTION_ROLE_ALREADY_ACTIVE: "Esta persona ya tiene otra matrícula activa en la sección. Revisa sus roles en el listado antes de cambiar esta matrícula." },
    codeFields: { LAST_SECTION_TEACHER: "role", SECTION_FULL: "role", SECTION_ROLE_ALREADY_ACTIVE: "role" },
    conflict: { message: changedMeanwhile, errors: {} },
  });
  // Mirrors the backend: teacher rows are owner-only and nobody revokes their own teacher enrollment.
  const manageable = (e: Enrollment) =>
    e.active && (e.role !== "teacher" || (can.teachers && e.user.id !== user.id));
  const allowedRoles = can.teachers ? roles : roles.filter((r) => r !== "teacher");
  const trigger = useRef<HTMLElement | null>(null);
  const pendingManagement = useRef<Enrollment>(undefined);
  const table = useRef<HTMLDivElement>(null), tabs = useRef<HTMLDivElement>(null);
  /** After a role change, focus returns to the successor row's «Gestionar». */
  const successor = useRef<string>(undefined);
  const [target, setTarget] = useState<Enrollment>();
  const [open, setOpen] = useState(false), [opening, setOpening] = useState(0);
  const [revoking, setRevoking] = useState(false);
  const [draft, setDraft] = useState<Role>("student");
  const [feedbackTargetId, setFeedbackTargetId] = useState<string>();
  const notify = useContentNotice();
  const others = (e: Enrollment) => (result.data?.items ?? [])
    .filter((o) => o.active && o.id !== e.id && o.user.id === e.user.id).map((o) => o.role);
  async function refresh(enrollment: Enrollment) {
    // A new assignment is active: show it there, wherever the roster was.
    if (view !== "active") show("active");
    else {
      setPaged(false);
      if (canGoBack) setTrail([undefined]);
      else await result.reload();
    }
    if (enrollment.user.id === user.id) await session.loadContext(slug);
  }
  async function change(enrollment: Enrollment, body: ManagementChange, chosen: Role, siblings: readonly Role[]) {
    setFeedbackTargetId(enrollment.id);
    setDraft(chosen);
    let done: string | undefined;
    await mutation.run(
      async (current) => {
        let confirmed: Enrollment;
        try {
          confirmed = await session.request(
            (c) => updateSectionEnrollment(c, slug, section.id, enrollment.id, body),
            current,
          );
        } catch (error) {
          if (error instanceof ApiHttpError && error.status === 403) throw new FieldError("form", forbidden);
          if (error instanceof ApiHttpError && error.status === 404) {
            await result.reload();
            throw new FieldError("form", gone);
          }
          throw error;
        }
        if (!current()) return;
        successor.current = confirmed.active ? confirmed.id : undefined;
        if (view === "active" && !canGoBack) {
          // Reflect the confirmed write while the server refreshes the page order and cursor.
          result.updateData(page => {
            const successorOnPage = page.items.some(item => item.id === confirmed.id && item.id !== enrollment.id);
            return {
              ...page,
              items: page.items.flatMap(item => item.id === enrollment.id
                ? confirmed.active && !successorOnPage ? [confirmed] : []
                : [item]),
            };
          });
        }
        await refresh(confirmed);
        const name = enrollment.user.name;
        done = "active" in body
          ? `Se revocó la matrícula de ${name} como ${roleLabel(enrollment.role)}. Quedó en el Historial.`
          : siblings.includes(body.role)
            ? `${name} ya era ${roleLabel(body.role)}: la matrícula como ${roleLabel(enrollment.role)} pasó al Historial.`
            : `${name} ahora es ${roleLabel(body.role)}. La matrícula anterior pasó al Historial.`;
        return done;
      },
      async () => {
        await result.reload();
        return "Se consultó el listado actual; el resultado de la escritura no está confirmado.";
      },
    );
    return done;
  }
  function manage(enrollment: Enrollment, button: HTMLElement | null) {
    trigger.current = button;
    successor.current = undefined;
    // An uncertain write reopens exactly as it was left; anything else starts from the saved role.
    if (!mutation.uncertain) {
      mutation.clearErrors();
      setFeedbackTargetId(undefined);
      setDraft(enrollment.role);
      setRevoking(false);
    }
    setTarget(enrollment);
    setOpening((n) => n + 1);
    setOpen(true);
  }
  function restoreFocus() {
    const replacement = successor.current
      ? table.current?.querySelector<HTMLElement>(`[data-enrollment-id="${successor.current}"] button`)
      : undefined;
    const destination = replacement
      ?? (trigger.current?.isConnected ? trigger.current : undefined)
      ?? table.current
      ?? tabs.current?.querySelector<HTMLElement>("button[aria-pressed=\"true\"]");
    destination?.focus({ preventScroll: true });
  }
  return (
    <section className="stack participants-admin" aria-label="Participantes">
      {/* The assignment action lives in the heading, so the table never moves it. */}
      <div className="participants-heading">
        <h2 className="serif">Participantes</h2>
        <AdminDialog label="Asignar participante" title="Asignar participante" primary
          icon={<UserPlus size={16} aria-hidden="true" />} onDone={message => { if (message) notify?.(message); }}
          onClosed={() => {
            const enrollment = pendingManagement.current;
            pendingManagement.current = undefined;
            if (!enrollment) return;
            const button = table.current?.querySelector<HTMLButtonElement>(`[data-enrollment-id="${enrollment.id}"] button`);
            if (!button?.disabled) manage(enrollment, button ?? null);
          }}>
          {controls => <EnrollmentForm session={session} slug={slug} section={section} allowedRoles={allowedRoles}
            active={view === "active" ? result.data?.items.filter(e => e.active) ?? [] : []} owner={can.teachers} onSaved={refresh}
            canManage={e => manageable(e) && !mutation.busy && (!mutation.uncertain || feedbackTargetId === e.id)}
            onManage={e => { pendingManagement.current = e; controls.onDone(""); }} dialog={controls} />}
        </AdminDialog>
      </div>
      <div ref={tabs} className="tab-group participants-views" role="group" aria-label="Matrículas">
        {views.map((v) => (
          <button key={v.status} type="button" className={`tab-btn${view === v.status ? " active" : ""}`}
            aria-pressed={view === v.status} aria-controls={rosterId} onClick={() => show(v.status)}>
            {v.label}
          </button>
        ))}
      </div>
      <div id={rosterId} className="stack">
        {historical && (
          <p className="hint participant-history-note">Registro de solo lectura de matrículas revocadas o reemplazadas por un cambio de rol.</p>
        )}
        {result.error ? (
          <ErrorState headingLevel={3}
            feedback={result.error}
            onRetry={() => void result.reload()}
          />
        ) : !result.data ? (
          <RecordRowsSkeleton label="Cargando participantes…" caption={caption} headers={columns} rows={3}
            scroll="table-scroll participants-table participants-admin-table" cell={participantCell} />
        ) : !result.data.items.length ? (
          canGoBack ? (
            <EmptyState headingLevel={3} title="No hay matrículas en esta página"
              message="Vuelve a la página anterior para consultar el listado actualizado." />
          ) : historical ? (
            <EmptyState headingLevel={3} title="Sin historial"
              message="Esta sección no tiene matrículas revocadas ni cambios de rol." />
          ) : (
            <EmptyState headingLevel={3} title="No hay participantes"
              message="Esta sección no tiene matrículas activas. Usa «Asignar participante» para agregar una matrícula." />
          )
        ) : (
          <div
            ref={table}
            className="table-scroll participants-table participants-admin-table"
            role="region"
            aria-label={`Participantes de la sección ${section.code}`}
            tabIndex={0}
          >
            <table className="data-table" role="table">
              <caption>{caption}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  {columns.map((column) => (
                    <th scope="col" role="columnheader" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup">
                {result.data.items.map((e) => (
                  <tr role="row" key={e.id} data-enrollment-id={e.id}>
                    <th scope="row" role="rowheader">
                      <span className="participant-identity">{e.user.name}</span>
                      <span className="hint participant-email">{e.user.email}</span>
                    </th>
                    <td role="cell"><span className="chip chip-primary">{roleLabel(e.role)}</span></td>
                    <td role="cell"><span className={e.active ? "chip chip-success" : "chip"}>{e.active ? "Activa" : "Histórica"}</span></td>
                    {!historical && <td role="cell">
                      {manageable(e) ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          aria-label={`Gestionar ${e.user.name}, ${roleLabel(e.role)}`}
                          aria-haspopup="dialog"
                          disabled={
                            mutation.busy ||
                            (!!mutation.uncertain && feedbackTargetId !== e.id)
                          }
                          onClick={(event) => manage(e, event.currentTarget)}
                        >
                          <UserRoundCog size={16} aria-hidden="true" />
                          Gestionar
                        </button>
                      ) : (
                        <span className="hint">Sin acciones</span>
                      )}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(paged || canAdvance) && (
          <nav className="participant-pagination" aria-label={`Páginas de ${caption.toLowerCase()}`}>
            <button type="button" className="btn btn-ghost" aria-disabled={!canGoBack} onClick={previousPage}>
              <ChevronLeft size={16} aria-hidden="true" />
              Anterior
            </button>
            <p className="hint tnum" role="status">Página {trail.length}</p>
            <button type="button" className="btn btn-ghost" aria-disabled={!canAdvance} onClick={nextPage}>
              Siguiente
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
      {!open && mutation.uncertain && mutation.message && <p role="alert">{mutation.message}</p>}
      <AdminDialogFrame open={open} opening={opening} className="participant-management"
        title={revoking ? "Revocar matrícula" : "Gestionar participante"}
        onDone={(message) => notify?.(message)} onClose={() => setOpen(false)} onClosed={restoreFocus}>
        {(controls) => target && (
          <EnrollmentManagement enrollment={target} section={section} others={others(target)} allowedRoles={allowedRoles}
            initialRole={draft} revoking={revoking} mutation={mutation} feedback={feedbackTargetId === target.id}
            onRevoking={setRevoking} onChange={(body, chosen) => change(target, body, chosen, others(target))} dialog={controls} />
        )}
      </AdminDialogFrame>
    </section>
  );
}
