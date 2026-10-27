"use client";
import { roleLabel } from "../../lib/courses/role-label.ts";
import { useId, useRef, useState, type FormEvent } from "react";
import type { Session } from "../../lib/auth/session.ts";
import { FieldError, isId, roles, type Role, type Enrollment, type UserSummary } from "../../lib/courses/validation.ts";
import { searchInstitutionUsers, createSectionEnrollment, listSectionEnrollments } from "../../lib/api/enrollments.ts";
import { useMutation } from "./use-mutation.ts";
import { useResource } from "./use-resource.ts";
import { Field } from "./form-fields.tsx";

export function EnrollmentForm({ session, slug, sectionId, search, onSaved }: {
  session: Session;
  slug: string;
  sectionId: string;
  search: boolean;
  onSaved: (saved: Enrollment) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [searchRevision, setSearchRevision] = useState(0);
  const [selected, setSelected] = useState<UserSummary>();
  const searchForm = useRef<HTMLFormElement>(null);
  const mutation = useMutation(session);
  const messageId = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    await mutation.run(async (current) => {
      const userId = search ? selected?.id : String(form.get('userId') ?? '').trim();
      if (!isId(userId) || selected?.active === false)
        throw new FieldError('userId', 'Selecciona una persona activa o ingresa un UUID válido.');
      const role = String(form.get('role')) as Role;
      const saved = await session.request(c => createSectionEnrollment(c, slug, sectionId, { userId, role }), current);
      if (!current()) return;
      element.reset();
      searchForm.current?.reset();
      setQuery("");
      setSelected(undefined);
      await onSaved(saved);
      return "Participante asignado.";
    }, async (current) => { await session.request(c => listSectionEnrollments(c, slug, sectionId), current); return 'Se consultó el historial actual; no se confirmó este envío.'; });
  }
  return <section className="stack participant-assignment">
    <h3>Asignar un rol</h3>
    {search && <>
      <form ref={searchForm} aria-label="Buscar participantes" className="participant-search" onSubmit={e => { e.preventDefault(); setSelected(undefined); setSearchRevision(v => v + 1); setQuery(String(new FormData(e.currentTarget).get('search') ?? '').trim()); }}>
        <Field name="search" label="Nombre o correo de participante" />
        <button className="btn btn-ghost" type="submit" disabled={mutation.busy || mutation.uncertain}>Buscar</button>
      </form>
      {!query && <p className="hint" role="status">Escribe un nombre o correo y pulsa Buscar.</p>}
      {query && <SearchResults key={`${query}:${searchRevision}`} session={session} slug={slug} query={query} onSelect={setSelected} disabled={mutation.busy || !!mutation.uncertain} />}</>}
    <form aria-label="Asignar rol" className="stack" noValidate onSubmit={submit}>
      <fieldset className="stack" disabled={mutation.busy || mutation.uncertain}>
        {search ? <p role="status">{selected ? `Persona seleccionada: ${selected.name} · ${selected.email}` : 'Selecciona una persona de los resultados.'}</p> : <Field name="userId" label="UUID de persona existente" invalid={mutation.field === 'userId'} error={mutation.field === 'userId' ? mutation.message : undefined} />}
        <label className="field-label">Rol<select className="field" name="role" aria-invalid={mutation.field === 'role' || undefined} aria-describedby={mutation.field === 'role' ? messageId : undefined}>{roles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}</select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={search && !selected}>Asignar rol</button>
      </fieldset>{mutation.message && <p id={messageId} role={mutation.confirmed ? 'status' : 'alert'}>{mutation.message}</p>}</form>
  </section>;
}
function SearchResults({ session, slug, query, onSelect, disabled }: {
  disabled: boolean;
  session: Session;
  slug: string;
  query: string;
  onSelect: (u: UserSummary) => void;
}) {
  const [cursor, setCursor] = useState<string>();
  const result = useResource(session, `${session.getSnapshot().generation}:${slug}:${session.getSnapshot().context?.user?.id}:${query}:${cursor ?? ''}`, c => searchInstitutionUsers(c, slug, query, cursor));
  return <div className="stack search-results" aria-busy={!!result.refreshing}>
    {result.error ? <div className="notice" role="alert"><p>{result.error.message}</p><button className="btn btn-ghost" type="button" onClick={() => void result.reload()}>Reintentar búsqueda</button></div>
      : !result.data ? <p role="status">Buscando participantes…</p>
      : !result.data.items.length ? <p role="status">Sin coincidencias. Prueba con otro nombre o correo.</p>
      : <ul className="search-result-list">{result.data.items.map(u => <li key={u.id}>
        <button className="btn btn-ghost" type="button" disabled={disabled || !!result.refreshing || !u.active} onClick={() => onSelect(u)}>{u.name} · {u.email}{!u.active ? ' (inactiva)' : ''}</button>
      </li>)}</ul>}
    {result.data?.hasMore && <button className="btn btn-ghost" type="button" disabled={disabled || !!result.refreshing} onClick={() => setCursor(result.data!.nextCursor!)}>Más personas</button>}
  </div>;
}
