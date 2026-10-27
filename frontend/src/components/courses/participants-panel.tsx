"use client";
import { useFeedbackState } from "../use-feedback.ts";
import { UserRoundCog } from "lucide-react";
import { roleLabel } from "../../lib/courses/role-label.ts";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import {
  roles,
  type Course,
  type Section,
  type Enrollment,
  type Role,
} from "../../lib/courses/validation.ts";
import { capabilities } from "../../lib/courses/capabilities.ts";
import {
  listSectionEnrollments,
  updateSectionEnrollment,
} from "../../lib/api/enrollments.ts";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
import { EnrollmentForm } from "./enrollment-form.tsx";
import { useMutation } from "./use-mutation.ts";
import { useResource } from "./use-resource.ts";
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
  const [cursor, setCursor] = useState<string>();
  const result = useResource(
    session,
    `${slug}:${section.id}:${cursor ?? ""}`,
    (c) => listSectionEnrollments(c, slug, section.id, cursor),
  );
  const mutation = useMutation(session);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const table = useRef<HTMLDivElement>(null);
  const titleId = useId(),
    descriptionId = useId();
  const [target, setTarget] = useState<Enrollment>();
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [confirming, setConfirming] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string>();
  const [receipt, setReceipt] = useFeedbackState();
  useEffect(() => {
    if (target) {
      if (!dialog.current?.open) dialog.current?.showModal();
      cancel.current?.focus();
    }
  }, [target, confirming]);
  async function saved(enrollment: Enrollment) {
    setReceipt(enrollment.id);
    if (cursor) setCursor(undefined);
    else await result.reload();
    if (enrollment.user.id === user.id) await session.loadContext(slug);
  }
  async function update(
    enrollment: Enrollment,
    body:
      | {
          role: Role;
        }
      | {
          active: false;
        },
  ) {
    setFeedbackTargetId(enrollment.id);
    await mutation.run(
      async (current) => {
        const confirmed = await session.request(
          (c) =>
            updateSectionEnrollment(c, slug, section.id, enrollment.id, body),
          current,
        );
        if (current()) {
          await saved(confirmed);
          if (current()) close();
        }
        return "active" in body ? "Matrícula revocada." : "Rol actualizado.";
      },
      async (current) => {
        await session.request(
          (c) => listSectionEnrollments(c, slug, section.id),
          current,
        );
        return "Se consultó el historial actual; el resultado de la escritura no está confirmado.";
      },
    );
  }
  function manage(enrollment: Enrollment, button: HTMLElement) {
    trigger.current = button;
    if (!mutation.uncertain) {
      setFeedbackTargetId(undefined);
      setSelectedRole(enrollment.role);
      setConfirming(false);
    }
    setTarget(enrollment);
  }
  function restoreFocus() {
    if (trigger.current?.isConnected)
      trigger.current.focus({ preventScroll: true });
    else table.current?.focus({ preventScroll: true });
  }
  function close() {
    dialog.current?.close();
    setTarget(undefined);
    restoreFocus();
  }
  function role(event: FormEvent<HTMLFormElement>, enrollment: Enrollment) {
    event.preventDefault();
    if (mutation.busy || mutation.uncertain) return;
    const next = String(new FormData(event.currentTarget).get("role")) as Role;
    if (next !== enrollment.role) {
      setSelectedRole(next);
      void update(enrollment, { role: next });
    }
  }
  return (
    <section className="stack" aria-label="Participantes">
      <h3 className="serif">
        Participantes e historial · Sección {section.code}
      </h3>
      {result.error ? (
        <ErrorState
          feedback={result.error}
          onRetry={() => void result.reload()}
        />
      ) : !result.data ? (
        <LoadingState />
      ) : !result.data.items.length ? (
        <EmptyState />
      ) : (
        <div
          ref={table}
          className="table-scroll participants-table"
          role="region"
          aria-label={`Participantes de la sección ${section.code}`}
          tabIndex={0}
        >
          <table className="data-table">
            <caption>Matrículas activas e históricas</caption>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {result.data.items.map((e) => (
                <tr key={e.id} data-enrollment-id={e.id}>
                  <td>
                    {e.user.name}
                    <p className="hint">{e.user.email}</p>
                  </td>
                  <td>{roleLabel(e.role)}</td>
                  <td>{e.active ? "Activa" : "Histórica"}</td>
                  <td>
                    {e.active ? (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div
        className="actions participant-pagination"
        aria-label="Páginas de participantes"
      >
        {cursor && (
          <button
            className="btn btn-ghost"
            onClick={() => setCursor(undefined)}
          >
            Primera página
          </button>
        )}
        {result.data?.hasMore && (
          <button
            className="btn btn-ghost"
            onClick={() => setCursor(result.data!.nextCursor!)}
          >
            Más matrículas
          </button>
        )}
      </div>
      {receipt && <p role="status">Matrícula confirmada: {receipt}</p>}
      {!target && mutation.message && (
        <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>
      )}
      <details className="academic-disclosure">
        <summary>Asignar participante</summary>
        <EnrollmentForm
          session={session}
          slug={slug}
          sectionId={section.id}
          search={capabilities(user, course, section).search}
          onSaved={saved}
        />
      </details>
      <dialog
        ref={dialog}
        className="modal native-dialog panel participant-management"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={mutation.busy}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = event.currentTarget.querySelectorAll<HTMLElement>(
            ":is(button, select):not(:disabled)",
          );
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          setTarget(undefined);
          restoreFocus();
        }}
      >
        <div className="stack">
          <div>
            <h2 id={titleId}>
              {confirming ? "Confirmar revocación" : "Gestionar participante"}
            </h2>
            <div id={descriptionId} className="participant-identity">
              <p>
                <strong>{target?.user.name}</strong>
              </p>
              <p className="hint">{target?.user.email}</p>
              <p className="hint">
                Sección {section.code} · {target && roleLabel(target.role)}
              </p>
            </div>
          </div>
          {target &&
            (confirming ? (
              <>
                <p>
                  Se revocará esta matrícula. La persona perderá los permisos de
                  este rol en la sección; se conservarán sus otros roles y el
                  historial académico.
                </p>
                {feedbackTargetId === target.id && mutation.message && (
                  <p role="alert">{mutation.message}</p>
                )}
                <div className="actions dialog-actions">
                  <button
                    ref={cancel}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setConfirming(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={mutation.busy || mutation.uncertain}
                    onClick={() => void update(target, { active: false })}
                  >
                    {mutation.busy ? "Revocando…" : "Confirmar revocación"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <form
                  key={target.id}
                  className="stack"
                  aria-label={`Cambiar rol ${target.id}`}
                  onSubmit={(event) => role(event, target)}
                >
                  <label className="field-label">
                    Rol de {target.user.name}
                    <select
                      className="field"
                      name="role"
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.currentTarget.value as Role)}
                      disabled={mutation.busy || mutation.uncertain}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={mutation.busy || mutation.uncertain}
                  >
                    {mutation.busy ? "Guardando…" : "Cambiar rol"}
                  </button>
                </form>
                {feedbackTargetId === target.id && mutation.message && (
                  <p role="alert">{mutation.message}</p>
                )}
                <div className="actions dialog-actions">
                  <button
                    ref={cancel}
                    type="button"
                    className="btn btn-ghost"
                    onClick={close}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={mutation.busy || mutation.uncertain}
                    onClick={() => setConfirming(true)}
                  >
                    Revocar {roleLabel(target.role)}
                  </button>
                </div>
              </>
            ))}
        </div>
      </dialog>
    </section>
  );
}
