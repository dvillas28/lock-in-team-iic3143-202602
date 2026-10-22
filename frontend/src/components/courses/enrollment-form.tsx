"use client";
import { useId, useState, type FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { FieldError, isId, roles, type Role, type Enrollment, type UserSummary } from "../../lib/courses/validation.ts";
import { searchInstitutionUsers, createSectionEnrollment, listSectionEnrollments } from "../../lib/api/enrollments.ts";
import { useMutation } from "./use-mutation.ts";
import { useResource } from "./use-resource.ts";
import { Field } from "./form-fields.tsx";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
export function EnrollmentForm({ session, slug, sectionId, search, onSaved }: {
  session: Session;
  slug: string;
  sectionId: string;
  search: boolean;
  onSaved: (saved: Enrollment) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserSummary>();
  const mutation = useMutation(session);
  const messageId = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutation.run(async (current) => {
      const userId = search ? selected?.id : String(form.get('userId') ?? '').trim();
      if (!isId(userId) || selected?.active === false)
        throw new FieldError('userId', 'Selecciona una persona activa o ingresa un UUID válido.');
      const role = String(form.get('role')) as Role;
      const saved = await session.request(c => createSectionEnrollment(c, slug, sectionId, { userId, role }), current);
      if (current())
        await onSaved(saved);
    }, async (current) => { await session.request(c => listSectionEnrollments(c, slug, sectionId), current); return 'Se consultó el historial actual; no se confirmó este envío.'; });
  }
  return <section className="stack">
    <h3>Asignar un rol</h3>
    {search && <>
      <form aria-label="Buscar participantes" className="stack" onSubmit={e => { e.preventDefault(); setSelected(undefined); setQuery(String(new FormData(e.currentTarget).get('search') ?? '').trim()); }}>
        <Field name="search" label="Nombre o correo de participante" />
        <button className="btn btn-ghost" type="submit">Buscar</button>
      </form>
      {query && <SearchResults key={query} session={session} slug={slug} query={query} onSelect={setSelected} />}</>}
    <form aria-label="Asignar rol" className="stack" noValidate onSubmit={submit}>
      <fieldset className="stack" disabled={mutation.busy || mutation.uncertain}>
        {search ? <p role="status">{selected ? `Persona seleccionada: ${selected.name} · ${selected.email}` : 'Selecciona una persona de los resultados.'}</p> : <Field name="userId" label="UUID de persona existente" invalid={mutation.field === 'userId'} error={mutation.field === 'userId' ? mutation.message : undefined} />}
        <label className="field-label">Rol<select className="field" name="role" aria-invalid={mutation.field === 'role' || undefined} aria-describedby={mutation.field === 'role' ? messageId : undefined}>{roles.map(role => <option key={role}>{role}</option>)}</select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={search && !selected}>Asignar rol</button>
      </fieldset>{mutation.message && <p id={messageId} role={mutation.message === 'Cambio confirmado.' ? 'status' : 'alert'}>{mutation.message}</p>}</form>
  </section>;
}
function SearchResults({ session, slug, query, onSelect }: {
  session: Session;
  slug: string;
  query: string;
  onSelect: (u: UserSummary) => void;
}) {
  const [cursor, setCursor] = useState<string>();
  const result = useResource(session, `${slug}:${query}:${cursor ?? ''}`, c => searchInstitutionUsers(c, slug, query, cursor));
  return <div className="stack">{result.error ? <ErrorState feedback={result.error} onRetry={() => void result.reload()} /> : !result.data ? <LoadingState /> : !result.data.items.length ? <EmptyState /> : <ul>{result.data.items.map(u => <li key={u.id}>
    <button className="btn btn-ghost" type="button" disabled={!u.active} onClick={() => onSelect(u)}>{u.name} · {u.email}{!u.active ? ' (inactiva)' : ''}</button>
  </li>)}</ul>}
    {result.data?.hasMore && <button className="btn btn-ghost" type="button" onClick={() => { setCursor(result.data!.nextCursor!); }}>Más personas</button>}
  </div>;
}
