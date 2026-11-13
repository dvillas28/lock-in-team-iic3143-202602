"use client";
import { useEffect, useId, useRef, useState } from "react";
import { UserMinus } from "lucide-react";
import { roleLabel } from "../../lib/courses/role-label.ts";
import type { Enrollment, Role, Section } from "../../lib/courses/validation.ts";
import type { DialogFormControls } from "./course-form.tsx";
import type { useMutation } from "./use-mutation.ts";
import { Email, initials, roleOrder } from "./enrollment-form.tsx";

type Mutation = ReturnType<typeof useMutation>;
export type ManagementChange = { role: Role } | { active: false };

/** The consequence of the selected role, in one sentence; the backend still decides. */
function consequence(enrollment: Enrollment, role: Role, others: readonly Role[], section: Section) {
  if (role === enrollment.role) return "Cada persona tiene un rol activo por sección. Al cambiarlo, la matrícula anterior pasa al Historial.";
  if (others.includes(role))
    return `Ya es ${roleLabel(role)} en esta sección: esta matrícula pasará al Historial y se mantendrá la existente.`;
  if (others.length) return "La persona ya tiene otros roles activos en esta sección. Revísalos antes de asignar un rol distinto.";
  const seat = role === "student"
    ? section.capacity === null ? " Ocupará un cupo de estudiante; la sección no tiene límite."
      : section.capacity === 1 ? " Ocupará el único cupo de estudiante de la sección." : ` Ocupará uno de los ${section.capacity} cupos de estudiantes.`
    : enrollment.role === "student" ? " Liberará su cupo de estudiante." : "";
  return `La matrícula como ${roleLabel(enrollment.role)} pasará al Historial y se creará una nueva como ${roleLabel(role)}.${seat}`;
}

/**
 * «Gestionar participante» inside `AdminDialogFrame`: the person, a role change and, as a separate
 * step of the same dialog, the revocation. The roster owns the mutation, so an uncertain write
 * stays locked across openings; this form only edits the draft and asks for the change.
 */
export function EnrollmentManagement({ enrollment, section, others, allowedRoles, initialRole, revoking, mutation, feedback, onRevoking, onChange, dialog }: {
  enrollment: Enrollment;
  section: Section;
  /** The person's other active roles in this section, as the loaded roster shows them. */
  others: readonly Role[];
  allowedRoles: readonly Role[];
  initialRole: Role;
  revoking: boolean;
  mutation: Mutation;
  /** Whether the mutation state belongs to this enrollment. */
  feedback: boolean;
  onRevoking: (revoking: boolean) => void;
  onChange: (change: ManagementChange, role: Role) => Promise<string | undefined>;
  dialog: DialogFormControls;
}) {
  const ids = useId();
  const [role, setRole] = useState<Role>(initialRole);
  const select = useRef<HTMLSelectElement>(null), revoke = useRef<HTMLButtonElement>(null), keep = useRef<HTMLButtonElement>(null);
  const { onBusy, onDirty } = dialog;
  useEffect(() => { onBusy(mutation.busy); }, [onBusy, mutation.busy]);
  useEffect(() => { onDirty?.(role !== enrollment.role); }, [onDirty, role, enrollment.role]);
  // The native dialog focuses its first control; move to the field this dialog is about.
  useEffect(() => { queueMicrotask(() => { if (select.current?.closest("dialog")?.open) select.current.focus(); }); }, []);
  const entered = useRef(false);
  useEffect(() => {
    if (revoking) keep.current?.focus();
    else if (entered.current) revoke.current?.focus();
    entered.current = true;
  }, [revoking]);
  const blocked = mutation.busy || !!mutation.uncertain;
  const error = feedback && !mutation.confirmed ? mutation.message : undefined;
  const roleError = error && mutation.field === "role" && !revoking ? error : undefined;
  const formError = error && !roleError ? error : undefined;
  useEffect(() => { if (roleError) select.current?.focus(); }, [roleError]);
  const options = roleOrder.filter(r => allowedRoles.includes(r) || r === enrollment.role);
  const changed = role !== enrollment.role;
  async function run(change: ManagementChange) {
    if (blocked) return;
    const done = await onChange(change, role);
    if (done) dialog.onDone(done);
  }

  const person = <div className="management-person">
    <span className="avatar" aria-hidden="true">{initials(enrollment.user.name)}</span>
    <div className="assignment-person">
      <strong>{enrollment.user.name}</strong>
      <span><Email value={enrollment.user.email} /></span>
    </div>
  </div>;

  if (revoking) return <div className="stack management-revoke">
    {person}
    <div className="management-warning" id={`${ids}-revoke`}>
      <p>Se revocará la matrícula de <strong>{enrollment.user.name}</strong> como <strong>{roleLabel(enrollment.role)}</strong> en la sección <strong>{section.code}</strong>.</p>
      <ul>
        <li>Perderá los permisos de ese rol en la sección{enrollment.role === "teacher" ? ", incluida su administración" : ""}.</li>
        <li>La matrícula pasará al Historial: su registro académico se conserva.</li>
        <li>{others.length
          ? `Sus otros roles activos en esta sección (${others.map(roleLabel).join(", ")}) no se revocan.`
          : "Si tiene otros roles activos en el curso, no se revocan automáticamente."}</li>
      </ul>
    </div>
    {formError && <p className="notice assignment-notice" role="alert">{formError}</p>}
    <div className="actions dialog-actions">
      <button ref={keep} type="button" className="btn btn-ghost" disabled={mutation.busy} aria-describedby={`${ids}-revoke`}
        onClick={() => { mutation.clearErrors(); onRevoking(false); }}>Cancelar</button>
      <button type="button" className="btn btn-danger" disabled={blocked} aria-disabled={blocked || undefined}
        onClick={() => void run({ active: false })}>
        {mutation.busy ? "Revocando…" : "Confirmar revocación"}
      </button>
    </div>
  </div>;

  return <form className="stack management-form" aria-label="Gestionar participante" noValidate
    onSubmit={event => { event.preventDefault(); if (changed) void run({ role }); }}>
    {person}
    <dl className="management-facts">
      <div><dt>Sección</dt><dd>{section.code}</dd></div>
      <div><dt>Rol actual</dt><dd>{roleLabel(enrollment.role)}</dd></div>
      <div><dt>Matrícula</dt><dd><span className="chip chip-success">Activa</span></dd></div>
    </dl>
    {!!others.length && <p className="hint management-others">También es {others.map(roleLabel).join(" y ")} en esta sección; {others.length === 1 ? "esa matrícula no cambia" : "esas matrículas no cambian"}.</p>}
    <div className="stack assignment-field">
      <label className="field-label" htmlFor={`${ids}-role`}>Rol académico</label>
      <select ref={select} id={`${ids}-role`} className="field" name="role" value={role} disabled={blocked}
        aria-invalid={!!roleError || undefined} aria-describedby={[`${ids}-hint`, roleError ? `${ids}-error` : ""].join(" ").trim()}
        onChange={event => { setRole(event.currentTarget.value as Role); mutation.clearErrors(); }}>
        {options.map(r => <option key={r} value={r}>{roleLabel(r)}{r === enrollment.role ? " (actual)" : ""}</option>)}
      </select>
      <p id={`${ids}-hint`} className="hint">{consequence(enrollment, role, others, section)}</p>
      {roleError && <p id={`${ids}-error`} className="field-error" role="alert">{roleError}</p>}
    </div>
    {formError && <p className="notice assignment-notice" role="alert">{formError}</p>}
    <div className="actions dialog-actions management-actions">
      <button ref={revoke} type="button" className="btn btn-danger management-revoke-action" disabled={blocked}
        onClick={() => { mutation.clearErrors(); onRevoking(true); }}>
        <UserMinus size={16} aria-hidden="true" />Revocar matrícula
      </button>
      <button type="button" className="btn btn-ghost" onClick={dialog.onCancel} disabled={mutation.busy}>Cancelar</button>
      <button type="submit" className="btn btn-primary" disabled={blocked || !changed} aria-disabled={blocked || !changed || undefined}>
        {mutation.busy ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  </form>;
}
