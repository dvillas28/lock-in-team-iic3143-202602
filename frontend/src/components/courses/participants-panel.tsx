"use client";
import { useRef, useState, type FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import { roles, type Course, type Section, type Enrollment, type Role } from "../../lib/courses/validation.ts";
import { capabilities } from "../../lib/courses/capabilities.ts";
import { listSectionEnrollments, updateSectionEnrollment } from "../../lib/api/enrollments.ts";
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
  return <Participants key={`${props.slug}:${props.course.id}:${props.section.id}`} {...props} />;
}
function Participants({ session, slug, user, course, section }: {
  session: Session;
  slug: string;
  user: CurrentUser;
  course: Course;
  section: Section;
}) {
  const [cursor, setCursor] = useState<string>();
  const [revision, setRevision] = useState(0);
  const result = useResource(session, `${slug}:${section.id}:${cursor ?? ''}:${revision}`, c => listSectionEnrollments(c, slug, section.id, cursor));
  const mutation = useMutation(session);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [target, setTarget] = useState<Enrollment>();
  const [receipt, setReceipt] = useState('');
  async function saved(enrollment: Enrollment) {
    setReceipt(enrollment.id);
    setCursor(undefined);
    setRevision(n => n + 1);
    if (enrollment.user.id === user.id)
      await session.loadContext(slug);
  }
  async function update(enrollment: Enrollment, body: {
    role: Role;
  } | {
    active: false;
  }) {
    await mutation.run(async (current) => {
      const confirmed = await session.request(c => updateSectionEnrollment(c, slug, section.id, enrollment.id, body), current); if (current())
        await saved(confirmed);
    }, async (current) => { await session.request(c => listSectionEnrollments(c, slug, section.id), current); return 'Se consultó el historial actual; el resultado de la escritura no está confirmado.'; });
  }
  function revoke(enrollment: Enrollment, button: HTMLElement) { setTarget(enrollment); trigger.current = button; dialog.current!.showModal(); cancel.current?.focus(); }
  function close() { dialog.current?.close(); trigger.current?.focus(); }
  function role(event: FormEvent<HTMLFormElement>, enrollment: Enrollment) {
    event.preventDefault(); const next = String(new FormData(event.currentTarget).get('role')) as Role; if (next !== enrollment.role)
      void update(enrollment, { role: next });
  }
  return <section className="stack" aria-label="Participantes">
    <h3>Participantes e historial · Sección {section.code}</h3>
    {result.error ? <ErrorState feedback={result.error} onRetry={() => void result.reload()} /> : !result.data ? <LoadingState /> : !result.data.items.length ? <EmptyState /> :
      <div className="table-scroll">
        <table className="data-table">
          <caption>Matrículas activas e históricas</caption>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>{result.data.items.map(e => <tr key={e.id} data-enrollment-id={e.id}>
            <td>{e.user.name}<p className="hint">{e.user.email}</p>
            </td>
            <td>{e.role}</td>
            <td>{e.active ? 'Activa' : 'Histórica'}</td>
            <td>{e.active && <div className="stack">
              <form aria-label={`Cambiar rol ${e.id}`} onSubmit={event => role(event, e)}>
                <label>Rol de {e.user.name}<select className="field" name="role" defaultValue={e.role} disabled={mutation.busy || mutation.uncertain}>{roles.map(r => <option key={r}>{r}</option>)}</select>
                </label>
                <button className="btn btn-ghost" type="submit" disabled={mutation.busy || mutation.uncertain}>Cambiar rol</button>
              </form>
              <button className="btn btn-danger" disabled={mutation.busy || mutation.uncertain} onClick={event => revoke(e, event.currentTarget)}>Revocar {e.role}</button>
            </div>}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    <div className="actions">{cursor && <button className="btn btn-ghost" onClick={() => setCursor(undefined)}>Primera página</button>}{result.data?.hasMore && <button className="btn btn-ghost" onClick={() => setCursor(result.data!.nextCursor!)}>Más matrículas</button>}</div>
    {receipt && <p role="status">Matrícula confirmada: {receipt}</p>}{mutation.message && <p role={mutation.message === 'Cambio confirmado.' ? 'status' : 'alert'}>{mutation.message}</p>}
    <EnrollmentForm session={session} slug={slug} sectionId={section.id} search={capabilities(user, course, section).search} onSaved={saved} />
    <dialog ref={dialog} className="modal native-dialog panel" aria-labelledby="revoke-title" onKeyDown={event => {
      if (event.key !== "Tab")
        return;
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }} onCancel={() => trigger.current?.focus()} onClose={() => trigger.current?.focus()}>
      <h2 id="revoke-title">Confirmar revocación</h2>
      <p>{target?.user.name} · {target?.role} · Sección {section.code}. Se conservará el historial.</p>
      <div className="actions">
        <button ref={cancel} type="button" className="btn btn-ghost" onClick={close}>Cancelar</button>
        <button type="button" className="btn btn-danger" onClick={() => {
          const e = target; close(); if (e)
            void update(e, { active: false });
        }}>Confirmar revocación</button>
      </div>
    </dialog>
  </section>;
}
