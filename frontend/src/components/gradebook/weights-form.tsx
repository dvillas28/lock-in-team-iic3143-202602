"use client";
import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Info, Plus, Trash2 } from "lucide-react";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { listCourseGradeItems, matchesGroupPlan, updateGradeGroups } from "../../lib/api/gradebook.ts";
import type { Session } from "../../lib/auth/session.ts";
import { cents, type GradeItems, type GroupPlan } from "../../lib/gradebook/validation.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";

type GroupDraft = { key: string; id: string | null; title: string; weight: string };
function initialGroups(data: GradeItems): GroupDraft[] {
  const groups = data.groups ?? data.items.map(item => ({
    id: item.id, title: item.title, weightPercent: item.weightPercent,
  }));
  return groups.length
    ? groups.map(g => ({ key: g.id, id: g.id, title: g.title, weight: String(g.weightPercent) }))
    : [{ key: "first", id: null, title: "Quizzes", weight: "100" }];
}
function initialAssignments(data: GradeItems) {
  return Object.fromEntries(data.items.map(i => [i.id, i.groupId ?? i.id]));
}
const weightCents = (value: string) => {
  try { return cents(value.trim().replace(",", ".")); } catch { return Number.NaN; }
};

export function WeightsForm({ session, slug, courseId, initial, onSaved, onCancel, onBusy, onError }: Readonly<{
  session: Session; slug: string; courseId: string; initial: GradeItems;
  onSaved: () => Promise<void>; onCancel: () => void; onBusy: (busy: boolean) => void; onError: (message: string) => void;
}>) {
  const [source, setSource] = useState(initial),
    [groups, setGroups] = useState(() => initialGroups(initial)),
    [assignments, setAssignments] = useState(() => initialAssignments(initial)),
    [confirmed, setConfirmed] = useState(false),
    [saving, setSaving] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [conflict, setConflict] = useState(false);
  const total = groups.reduce((sum, g) => sum + weightCents(g.weight), 0);
  const warning = source.hasPublishedGrades || (source.calculation === "legacy" && source.items.length > 0);
  const unassigned = source.items.filter(i => !groups.some(g => g.key === assignments[i.id])).length;
  const valid = total === 10000 && !unassigned && groups.every(g => g.title.trim()) && (!warning || confirmed);

  function move(index: number, step: number) {
    const order = [...groups], target = index + step;
    [order[index], order[target]] = [order[target], order[index]];
    setGroups(order);
  }
  function edit(key: string, change: Partial<GroupDraft>) {
    setGroups(values => values.map(g => g.key === key ? { ...g, ...change } : g));
  }
  async function reload() {
    setSaving(true);
    onBusy(true);
    try {
      const current = await session.request(c => listCourseGradeItems(c, slug, courseId));
      setSource(current);
      setGroups(initialGroups(current));
      setAssignments(initialAssignments(current));
      setConfirmed(false);
      setConflict(false);
    } catch (error) { onError(getRouteFeedback(error).message); }
    finally { setSaving(false); onBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving || conflict || session.getSnapshot().contextWarning) return;
    const body: GroupPlan = {
      expectedVersion: source.version ?? 0,
      confirmRecalculation: confirmed,
      groups: groups.map(g => ({
        id: g.id, title: g.title.trim(), weightPercent: weightCents(g.weight) / 100,
        gradeItemIds: source.items.filter(i => assignments[i.id] === g.key).map(i => i.id),
      })),
    };
    setSaving(true);
    onBusy(true);
    try {
      await session.request(c => updateGradeGroups(c, slug, courseId, body));
      await onSaved();
    } catch (error) {
      const rejected = error instanceof ApiHttpError && error.status >= 400 && error.status < 500;
      if (!rejected) {
        try {
          const current = await session.request(c => listCourseGradeItems(c, slug, courseId));
          if (matchesGroupPlan(current, body)) { await onSaved(); return; }
        } catch { /* A replay with the same version can still confirm the write. */ }
        setUncertain(true);
        onError("No pudimos confirmar el guardado. Puedes reintentar el mismo cambio.");
      } else {
        const changed = [409, 422].includes(error.status);
        setUncertain(false);
        setConflict(changed);
        onError(changed ? "La configuración del curso cambió. Carga la versión vigente para volver a editar." : getRouteFeedback(error).message);
      }
    } finally { setSaving(false); onBusy(false); }
  }

  return <form onSubmit={e => void save(e)} className="grade-plan-form">
    <div className="grade-plan-total">
      <div><strong>Total de ponderación</strong>
        <p className="hint">{total === 10000 ? "La suma coincide con el 100 %." : "Distribuye el 100 % entre los grupos."}</p>
      </div>
      <output aria-live="polite" className="tnum">{Number.isNaN(total) ? "—" : total / 100} <small>/ 100 %</small></output>
      <progress aria-label="Ponderación asignada" max={10000} value={Number.isFinite(total) ? Math.min(total, 10000) : 0} />
    </div>
    {warning && <div className="grade-plan-warning notice">
      <Info size={17} aria-hidden />
      <div>
        <strong>Este cambio puede modificar los promedios</strong>
        <p className="hint">{source.calculation === "legacy"
          ? "Al guardar, el curso pasará a calcular por puntos de grupo. Las notas individuales se conservan."
          : "Los nuevos pesos y grupos recalcularán los promedios de todas las secciones."}</p>
      </div>
    </div>}
    <fieldset className="grade-plan-body" disabled={saving || conflict || uncertain}>
      <legend className="gradebook-sr-only">Grupos y evaluaciones</legend>
      <section className="stack" aria-label="Grupos de evaluación">
        <div className="grade-plan-heading"><h3>Grupos de evaluación</h3><span className="hint tnum">{groups.length}</span></div>
        <ol className="grade-plan-groups">
          {groups.map((g, index) => {
            const name = g.title.trim() || `Grupo ${index + 1}`;
            return <li key={g.key} className="grade-plan-group">
              <label className="field-label">
                <span>Nombre del grupo</span>
                <input className="field" value={g.title} onChange={e => edit(g.key, { title: e.target.value })} required maxLength={200} />
              </label>
              <label className="field-label">
                <span>Peso (%)</span>
                <input className="field tnum" value={g.weight} onChange={e => edit(g.key, { weight: e.target.value })} inputMode="decimal" required />
              </label>
              <div className="grade-plan-group-actions">
                <span className="hint">{source.items.filter(i => assignments[i.id] === g.key).length} eval.</span>
                <div className="actions">
                  <button className="btn btn-ghost" type="button" aria-label={`Subir ${name}`} disabled={!index}
                    onClick={() => move(index, -1)}><ArrowUp size={15} aria-hidden /></button>
                  <button className="btn btn-ghost" type="button" aria-label={`Bajar ${name}`} disabled={index === groups.length - 1}
                    onClick={() => move(index, 1)}><ArrowDown size={15} aria-hidden /></button>
                  <button className="btn btn-ghost" type="button" aria-label={`Quitar ${name}`} disabled={groups.length === 1}
                    onClick={() => setGroups(values => values.filter(value => value.key !== g.key))}><Trash2 size={15} aria-hidden /></button>
                </div>
              </div>
            </li>;
          })}
        </ol>
        <button className="btn btn-ghost grade-plan-add" type="button" disabled={groups.length >= 100}
          onClick={() => setGroups(values => [...values, { key: crypto.randomUUID(), id: null, title: "", weight: "0" }])}>
          <Plus size={16} aria-hidden /><span>Añadir grupo</span>
        </button>
      </section>
      <section className="stack" aria-label="Asignación de evaluaciones">
        <div className="grade-plan-heading"><h3>Evaluaciones</h3><span className="hint tnum">{source.items.length}</span></div>
        {!source.items.length && <p className="hint">Las evaluaciones aparecerán aquí cuando se publiquen.</p>}
        {unassigned > 0 && <p role="status" className="field-error">Quedan {unassigned} evaluaciones por asignar.</p>}
        <ul className="grade-plan-items">
          {source.items.map(item => <li key={item.id}>
            <label className="field-label">
              <span>{item.title} <small className="hint tnum">{item.maxPoints === undefined ? "" : `${item.maxPoints} pts`}</small></span>
              <select className="field" value={groups.some(g => g.key === assignments[item.id]) ? assignments[item.id] : ""}
                onChange={e => setAssignments(values => ({ ...values, [item.id]: e.target.value }))} required>
                <option value="" disabled>Elige un grupo</option>
                {groups.map((g, index) => <option key={g.key} value={g.key}>{g.title.trim() || `Grupo ${index + 1}`}</option>)}
              </select>
            </label>
          </li>)}
        </ul>
      </section>
    </fieldset>
    <div className="grade-plan-footer">
      {warning && !conflict && <label className="grade-plan-confirm">
        <input type="checkbox" checked={confirmed} disabled={saving || uncertain}
          onChange={e => setConfirmed(e.target.checked)} /> Confirmo el recálculo
      </label>}
      <div className="actions">
        <button className="btn btn-ghost" type="button" disabled={saving} onClick={onCancel}>Cancelar</button>
        {conflict
          ? <button className="btn btn-ghost" type="button" disabled={saving} onClick={() => void reload()}>Cargar versión vigente</button>
          : <button className="btn btn-primary" type="submit" disabled={saving || !valid}>
            {saving ? "Guardando…" : uncertain ? "Reintentar guardado" : "Guardar grupos"}
          </button>}
      </div>
    </div>
  </form>;
}
