"use client";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { Search } from "lucide-react";
import { roleLabel } from "../../lib/courses/role-label.ts";
import type { Session } from "../../lib/auth/session.ts";
import { type Enrollment, type Role, type Section, type UserSummary } from "../../lib/courses/validation.ts";
import { assignSectionEnrollment, listSectionEnrollments, searchInstitutionUsers } from "../../lib/api/enrollments.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import type { DialogFormControls } from "./course-form.tsx";
import { useResource } from "./use-resource.ts";
import { useMutation } from "./use-mutation.ts";

/** Typing waits this long before searching; Enter searches at once. */
export const SEARCH_DEBOUNCE_MS = 300;
const minimumQuery = 2;
const alreadyEnrolled = "Esta persona ya tiene una matrícula activa en la sección. Para cambiar su rol, usa «Gestionar matrícula actual».";
/** Without permission over that enrollment there is no button to point to. */
const alreadyEnrolledReadonly = "Esta persona ya tiene una matrícula activa en la sección y no puedes cambiar su rol.";
/** Students first: it is the default and the most frequent assignment. */
export const roleOrder: Role[] = ["student", "assistant", "teacher"];
/** Long addresses wrap after the «@» first, never mid-word when it can be avoided. */
export const Email = ({ value }: { value: string }) => { const at = value.lastIndexOf("@"); return at < 0 ? <>{value}</> : <>{value.slice(0, at + 1)}<wbr />{value.slice(at + 1)}</>; };
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("es");
export const fullMessage = (owner: boolean) => owner
  ? "La sección no tiene cupos de estudiantes disponibles. Asigna otro rol o aumenta la capacidad en «Configurar sección»."
  : "La sección no tiene cupos de estudiantes disponibles. Asigna otro rol o pide al propietario del curso que aumente la capacidad.";

/**
 * «Asignar participante» inside `AdminDialog`: find a person, pick a role, confirm. The backend decides
 * permissions, seats and duplicates; this form keeps the person and role when the server rejects them.
 */
export function EnrollmentForm({ session, slug, section, allowedRoles, active, owner, onSaved, canManage, onManage, dialog }: {
  session: Session;
  slug: string;
  section: Section;
  allowedRoles: readonly Role[];
  /** Active enrollments already loaded in the roster: they flag known duplicates before writing. */
  active: readonly Enrollment[];
  owner: boolean;
  onSaved: (saved: Enrollment) => Promise<void>;
  canManage: (enrollment: Enrollment) => boolean;
  onManage: (enrollment: Enrollment) => void;
  dialog: DialogFormControls;
}) {
  const [selected, setSelected] = useState<UserSummary>();
  const [role, setRole] = useState<Role>("student");
  const [localError, setLocalError] = useState<{ field: "search" | "role"; message: string }>();
  const mutation = useMutation(session, { codes: { SECTION_FULL: fullMessage(owner), SECTION_ROLE_ALREADY_ACTIVE: alreadyEnrolled }, codeFields: { SECTION_FULL: "role", SECTION_ROLE_ALREADY_ACTIVE: "role" } });
  const ids = useId(), searchInput = useRef<HTMLInputElement>(null), roleSelect = useRef<HTMLSelectElement>(null);
  const manageButton = useRef<HTMLButtonElement>(null), changeButton = useRef<HTMLButtonElement>(null);
  const { onBusy, onDirty } = dialog;
  useEffect(() => { onBusy(mutation.busy); }, [onBusy, mutation.busy]);
  useEffect(() => { onDirty?.(!!selected); }, [onDirty, selected]);
  // The dialog opens after this form mounts: focus the search once the native dialog has its own focus.
  useEffect(() => { queueMicrotask(() => { if (searchInput.current?.closest("dialog")?.open) searchInput.current.focus(); }); }, []);
  const roles = roleOrder.filter(r => allowedRoles.includes(r));
  const rolesOf = (user: UserSummary) => active.filter(e => e.user.id === user.id).map(e => e.role);
  const known = selected ? active.filter(e => e.active && e.user.id === selected.id) : [];
  const lookupId = selected && !known.length ? selected.id : undefined;
  const lookup = useResource(session, lookupId ?? "", async client => lookupId
    ? listSectionEnrollments(client, slug, section.id, undefined, undefined, "active", lookupId)
    : undefined, false);
  const existing = lookup.data?.items.filter(e => e.active && e.user.id === selected?.id) ?? known;
  const enrolled = existing.length > 0;
  const enrolledMessage = existing.some(canManage) ? alreadyEnrolled : alreadyEnrolledReadonly;
  const checking = !!selected && !enrolled && !lookup.data && !lookup.error;
  useEffect(() => {
    if (enrolled && roleSelect.current?.closest("dialog")?.open && document.activeElement === roleSelect.current)
      (manageButton.current ?? changeButton.current)?.focus();
  }, [enrolled]);
  const blocked = mutation.busy || !!mutation.uncertain;
  const error = (field: "search" | "role") => localError?.field === field ? localError.message
    : mutation.field === field && !mutation.confirmed ? mutation.message : undefined;
  const searchError = error("search"), roleError = error("role");
  const formMessage = !localError && mutation.message && !mutation.field && !mutation.confirmed ? mutation.message : undefined;

  function choose(user: UserSummary) {
    setLocalError(undefined); mutation.clearErrors(); setSelected(user);
    queueMicrotask(() => {
      const next = rolesOf(user).length ? manageButton.current ?? changeButton.current : roleSelect.current;
      next?.focus();
    });
  }
  function change() {
    setLocalError(undefined); mutation.clearErrors(); setSelected(undefined);
    queueMicrotask(() => searchInput.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;
    setLocalError(undefined);
    if (!selected) { setLocalError({ field: "search", message: "Busca y selecciona a la persona que quieres asignar." }); searchInput.current?.focus(); return; }
    if (!selected.active) { setLocalError({ field: "search", message: "Esta cuenta está inactiva. Selecciona otra persona." }); return; }
    if (enrolled) {
      setLocalError({ field: "role", message: enrolledMessage });
      roleSelect.current?.focus(); return;
    }
    if (checking || lookup.error) return;
    const person = selected, chosen = role;
    await mutation.run(async current => {
      const result = await session.request(c => assignSectionEnrollment(c, slug, section.id, { userId: person.id, role: chosen }), current)
        .catch(async error => {
          if (error instanceof ApiHttpError && error.problem.code === "SECTION_ROLE_ALREADY_ACTIVE" && current())
            await lookup.reload();
          throw error;
        });
      if (!current()) return;
      await onSaved(result.item);
      const done = result.created ? `${person.name} se asignó como ${roleLabel(chosen)}.`
        : `La matrícula de ${person.name} como ${roleLabel(chosen)} ya estaba activa.`;
      dialog.onDone(done);
      return done;
    }, async current => {
      await session.request(c => listSectionEnrollments(c, slug, section.id), current);
      return "Se consultó el historial actual; no se confirmó esta asignación.";
    });
  }
  // A capacity or role rejection keeps the selection and puts the focus where it can be fixed.
  useEffect(() => { if (mutation.field === "role" && mutation.message) roleSelect.current?.focus(); }, [mutation.field, mutation.message]);

  return <form className="stack assignment-form" aria-label="Asignar participante" noValidate onSubmit={submit}>
    {/* The search stays mounted while a person is chosen, so «Cambiar» returns to the same results. */}
    <PersonSearch session={session} slug={slug} input={searchInput} error={selected ? undefined : searchError} disabled={blocked} rolesOf={rolesOf}
      hidden={!!selected} onSelect={choose} onType={() => { if (localError?.field === "search") setLocalError(undefined); }} />
    {selected && <div className="stack assignment-field">
        <span className="field-label" id={`${ids}-person`}>Persona</span>
        <div className="assignment-selected" role="group" aria-labelledby={`${ids}-person`}>
          <span className="avatar" aria-hidden="true">{initials(selected.name)}</span>
          <div className="assignment-person">
            <strong>{selected.name}</strong>
            <span><Email value={selected.email} /></span>
            {!!rolesOf(selected).length && <span className="hint">En esta sección: {rolesOf(selected).map(roleLabel).join(", ")}</span>}
          </div>
          <button type="button" className="btn btn-ghost" ref={changeButton} disabled={blocked} onClick={change} aria-label={`Cambiar persona, ${selected.name} seleccionada`}>Cambiar</button>
        </div>
        {searchError && <p className="field-error" role="alert">{searchError}</p>}
      </div>}
    {checking && <p className="hint" role="status">Consultando matrículas activas…</p>}
    {selected && !enrolled && lookup.error && <div className="notice assignment-notice">
      <p role="alert">No se pudo comprobar si esta persona ya está matriculada.</p>
      <button type="button" className="btn btn-ghost" onClick={() => void lookup.reload()}>Reintentar consulta</button>
    </div>}
    <div className="stack assignment-field" hidden={enrolled}>
      <label className="field-label" htmlFor={`${ids}-role`}>Rol académico</label>
      <select ref={roleSelect} id={`${ids}-role`} className="field" name="role" value={role} disabled={blocked}
        aria-invalid={!!roleError || undefined} aria-describedby={[`${ids}-role-hint`, roleError ? `${ids}-role-error` : ""].join(" ").trim()}
        onChange={event => { setRole(event.currentTarget.value as Role); setLocalError(undefined); mutation.clearErrors(); }}>
        {roles.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
      </select>
      <p id={`${ids}-role-hint`} className="hint">{role !== "student" ? "Docentes y ayudantes no ocupan cupos de estudiantes."
        : section.capacity === null ? "Esta sección no tiene límite de cupos." : `Esta sección admite hasta ${section.capacity} ${section.capacity === 1 ? "estudiante" : "estudiantes"}.`}</p>
      {roleError && <p id={`${ids}-role-error`} className="field-error" role="alert">{roleError}</p>}
    </div>
    {enrolled && <p className="hint" role={roleError ? "alert" : "status"}>{enrolledMessage}</p>}
    {existing.filter(canManage).map((e, index) => <button key={e.id} ref={index === 0 ? manageButton : undefined} type="button" className="btn btn-ghost" disabled={blocked}
      onClick={() => onManage(e)}>{existing.length === 1 ? "Gestionar matrícula actual" : `Gestionar matrícula como ${roleLabel(e.role)}`}</button>)}
    {formMessage && <p className="notice assignment-notice" role="alert">{formMessage}</p>}
    <div className="actions dialog-actions">
      <button type="button" className="btn btn-ghost" onClick={dialog.onCancel} disabled={mutation.busy}>Cancelar</button>
      {!enrolled && <button type="submit" className="btn btn-primary" disabled={blocked || checking || !!lookup.error}>
        {mutation.busy ? "Asignando…" : "Asignar participante"}
      </button>}
    </div>
  </form>;
}

type SearchState = { query: string; items: UserSummary[]; cursor: string | null; hasMore: boolean; loading: boolean; error?: string };

/** Search as you type (debounced) with appended, de-duplicated pages; older responses never win. */
function PersonSearch({ session, slug, input, hidden, error, disabled, rolesOf, onSelect, onType }: {
  session: Session;
  slug: string;
  input: RefObject<HTMLInputElement | null>;
  hidden: boolean;
  error?: string;
  disabled: boolean;
  rolesOf: (user: UserSummary) => Role[];
  onSelect: (user: UserSummary) => void;
  onType: () => void;
}) {
  const ids = useId();
  const [text, setText] = useState("");
  const [state, setState] = useState<SearchState>();
  const sequence = useRef(0), timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => { sequence.current++; clearTimeout(timer.current); }, []);
  async function load(query: string, cursor?: string) {
    const request = ++sequence.current, context = session.getSnapshot().context;
    const current = () => request === sequence.current && context === session.getSnapshot().context;
    setState(previous => cursor && previous ? { ...previous, loading: true, error: undefined }
      : { query, items: [], cursor: null, hasMore: false, loading: true });
    try {
      const page = await session.request(c => searchInstitutionUsers(c, slug, query, cursor), current);
      if (!current()) return;
      setState(previous => {
        const kept = cursor && previous ? previous.items : [];
        const seen = new Set(kept.map(u => u.id));
        return { query, items: [...kept, ...page.items.filter(u => !seen.has(u.id) && seen.add(u.id))], cursor: page.nextCursor, hasMore: page.hasMore, loading: false };
      });
    } catch (failure) {
      if (current()) setState(previous => ({ ...(previous ?? { query, items: [], cursor: null, hasMore: false }), loading: false, error: getRouteFeedback(failure).message }));
    }
  }
  function schedule(value: string, now = false) {
    clearTimeout(timer.current);
    const query = value.trim();
    if (!query) { sequence.current++; setState(undefined); return; }
    if (now) { void load(query); return; }
    if (query.length < minimumQuery) return;
    timer.current = setTimeout(() => void load(query), SEARCH_DEBOUNCE_MS);
  }
  function keydown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter searches; it never submits the assignment with nobody chosen.
    if (event.key === "Enter") { event.preventDefault(); schedule(event.currentTarget.value, true); }
    if (event.key === "ArrowDown" && state?.items.length) { event.preventDefault(); document.getElementById(`${ids}-results`)?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus(); }
  }
  const count = state?.items.length ?? 0;
  const status = !state ? "" : state.loading && !count ? "Buscando personas…" : state.error ? "" : !count ? ""
    : `${count} ${count === 1 ? "persona encontrada" : "personas encontradas"}${state.hasMore ? "; hay más resultados" : ""}.`;
  return <div className="stack assignment-field" hidden={hidden}>
    <label className="field-label" htmlFor={`${ids}-search`}>Buscar persona</label>
    <div className="assignment-search">
      <Search size={16} aria-hidden="true" />
      {/* Typing a search is not a change to protect: only a chosen person or role marks the dialog dirty. */}
      <input ref={input} id={`${ids}-search`} name="search" type="search" className="field" value={text} autoComplete="off" spellCheck={false}
        placeholder="Nombre o correo…" aria-invalid={!!error || undefined} aria-controls={`${ids}-results`}
        aria-describedby={[`${ids}-hint`, error ? `${ids}-error` : ""].join(" ").trim()}
        onInput={event => { event.stopPropagation(); setText(event.currentTarget.value); onType(); schedule(event.currentTarget.value); }}
        onChange={event => event.stopPropagation()}
        onKeyDown={keydown} />
    </div>
    <p id={`${ids}-hint`} className="hint">Personas activas de tu institución. Escribe al menos {minimumQuery} caracteres.</p>
    {error && <p id={`${ids}-error`} className="field-error" role="alert">{error}</p>}
    <p className="sr-only" role="status" aria-live="polite">{hidden ? "" : status}</p>
    <div id={`${ids}-results`} className="assignment-results" aria-busy={!!state?.loading}>
      {state?.loading && !count && <p className="hint assignment-empty" aria-hidden="true">Buscando personas…</p>}
      {state?.error && <div className="notice assignment-notice" role="alert">
        <p>{state.error}</p>
        <button type="button" className="btn btn-ghost" onClick={() => void load(state.query, count ? state.cursor ?? undefined : undefined)}>Reintentar búsqueda</button>
      </div>}
      {state && !state.loading && !state.error && !count && <p className="hint assignment-empty" role="status">
        No hay personas activas que coincidan con «{state.query}». Revisa la ortografía o busca por correo institucional.</p>}
      {!!count && <ul className="assignment-result-list" aria-label="Resultados de búsqueda">
        {state!.items.map(user => {
          const current = rolesOf(user);
          return <li key={user.id}>
            <button type="button" className="assignment-result" disabled={disabled || !user.active} onClick={() => onSelect(user)}
              aria-label={`Seleccionar a ${user.name}, ${user.email}${!user.active ? ", cuenta inactiva" : current.length ? `, ya es ${current.map(roleLabel).join(" y ")} en esta sección` : ""}`}>
              <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
              <span className="assignment-person"><strong>{user.name}</strong><span><Email value={user.email} /></span></span>
              {!user.active ? <span className="chip" aria-hidden="true">Inactiva</span>
                : !!current.length && <span className="chip chip-primary" aria-hidden="true">{current.map(roleLabel).join(", ")}</span>}
            </button>
          </li>;
        })}
      </ul>}
      {state?.hasMore && !state.error && <button type="button" className="btn btn-ghost assignment-more" disabled={disabled || state.loading}
        onClick={() => void load(state.query, state.cursor ?? undefined)}>{state.loading ? "Cargando…" : "Mostrar más personas"}</button>}
    </div>
  </div>;
}
