#!/usr/bin/env node
// Computes board metrics from the snapshots written by .github/scripts/board-snapshot.sh.
// Usage: node scripts/board-metrics.mjs <snapshots-dir> [--csv <out-dir>]
// Prints a Markdown report; --csv also writes burnup.csv and cfd.csv for charts.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;

// Cards moved to Done on 2026-10-30 because their work was already merged
// (docs/deliveries/3/conciliacion-tablero-e3.md). Their Done date is the
// reconciliation, not the end of the work, so they count toward progress but
// not toward lead or cycle time.
const RECONCILED = new Set([
  'PVTI_lAHOB6xfyc4Bhx6Vzg-Xg3k', // #23 Bot PR reviewer: proveedor, token y criterios
  'PVTI_lAHOB6xfyc4Bhx6Vzg-XkHs', // #56 PostgreSQL en CI y migraciones antes de los tests
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X0JM', // #78 Bot PR reviewer: workflow base
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X0Gk', // #84 Integración y aislamiento como check obligatorio
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X5Rs', // Bot PR reviewer: criterios de lms-reviewer
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X5O4', // Migraciones previas al deploy en Render
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X6K4', // Organizador de módulos
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X6M0', // Editor de material markdown
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X6Pc', // Vista estudiantil de módulos y material
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X6R0', // Editor de quiz
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X6VA', // Rendir quiz sin exponer la pauta
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X6WQ', // Cancelar intento
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7DE', // Libro de notas docente (BE)
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7EY', // Consulta de auditoría con filtros
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7J8', // Envío del intento
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7Ng', // Configuración de ponderaciones
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7Q8', // Publicación de notas
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7VY', // Vista de notas del estudiante
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7ZM', // Vista del libro de notas docente
  'PVTI_lAHOB6xfyc4Bhx6Vzg-X7aw', // Vista de auditoría del curso
  // Unplanned Railway → Render work, logged after the fact.
  'PVTI_lAHOB6xfyc4Bhx6VzhE6AWs', // #175 Migrar el deploy de Railway a Render
  'PVTI_lAHOB6xfyc4Bhx6VzhE6Ahk', // #176 Corregir el primer deploy en Render
  'PVTI_lAHOB6xfyc4Bhx6VzhE6Amg', // #177 Migraciones de operador con owner no superusuario
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') field += text[++i];
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') row.push(field), (field = '');
    else if (c === '\n') row.push(field), rows.push(row), (row = []), (field = '');
    else if (c !== '\r') field += c;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function loadSnapshots(dir) {
  return readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.csv$/.test(f))
    .sort()
    .map((f) => ({ date: f.slice(0, 10), cards: parseCsv(readFileSync(join(dir, f), 'utf8')) }));
}

const num = (v) => (v === '' ? null : Number(v));
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const days = (from, to) => (new Date(to) - new Date(from)) / DAY_MS;
const fmt = (x, d = 1) => (x == null || !Number.isFinite(x) ? '—' : x.toFixed(d));

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function table(header, rows) {
  return [header, header.map(() => '---'), ...rows].map((r) => `| ${r.join(' | ')} |`).join('\n');
}

// When each card was first seen in each status, plus its latest row.
function cardHistory(snapshots) {
  const cards = new Map();
  for (const { date, cards: rows } of snapshots) {
    for (const row of rows) {
      const card = cards.get(row.item_id) ?? { firstSeen: {} };
      card.firstSeen[row.status] ??= date;
      card.latest = row;
      cards.set(row.item_id, card);
    }
  }
  return [...cards.values()];
}

const isDone = (card) => card.latest.status === 'Done';

// Done date: the issue's closedAt, or for drafts the first snapshot showing Done.
// A draft that was already Done in its first snapshot has no known date.
function doneAt(card) {
  if (!isDone(card)) return null;
  if (card.latest.closed_at) return card.latest.closed_at;
  const seenBefore = Object.entries(card.firstSeen).some(([s, d]) => s !== 'Done' && d < card.firstSeen.Done);
  return seenBefore ? card.firstSeen.Done : null;
}

function burnup(snapshots) {
  return snapshots.map(({ date, cards }) => {
    const done = cards.filter((c) => c.status === 'Done');
    return {
      date,
      scope: cards.length,
      done: done.length,
      scope_h: sum(cards.map((c) => num(c.estimate_h) ?? 0)),
      done_h: sum(done.map((c) => num(c.estimate_h) ?? 0)),
    };
  });
}

function cfd(snapshots) {
  return snapshots.map(({ date, cards }) => {
    const by = (s) => cards.filter((c) => c.status === s).length;
    return { date, todo: by('Todo'), in_progress: by('In progress'), done: by('Done') };
  });
}

function byWeek(cards) {
  const weeks = new Map();
  for (const card of cards) {
    const week = card.latest.semana || '(sin semana)';
    weeks.set(week, [...(weeks.get(week) ?? []), card]);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }));
}

function report(snapshots) {
  const cards = cardHistory(snapshots);
  const done = cards.filter(isDone);
  const reconciled = done.filter((c) => RECONCILED.has(c.latest.item_id));
  const dated = done.filter((c) => doneAt(c) && !RECONCILED.has(c.latest.item_id));
  const lead = dated.map((c) => days(c.latest.created_at, doneAt(c)));
  const cycle = dated.filter((c) => c.firstSeen['In progress']).map((c) => days(c.firstSeen['In progress'], doneAt(c)));
  const last = burnup(snapshots).at(-1);
  const out = [];

  out.push(`# Métricas del tablero`, ``);
  out.push(`Snapshots: ${snapshots.length} (${snapshots[0].date} a ${snapshots.at(-1).date}).`, ``);
  out.push(`## Avance`, ``);
  out.push(table(['', 'Alcance', 'Terminado', '%'], [
    ['Tarjetas', last.scope, last.done, fmt((100 * last.done) / last.scope, 0)],
    ['Horas estimadas', fmt(last.scope_h), fmt(last.done_h), fmt((100 * last.done_h) / last.scope_h, 0)],
  ]), ``);

  out.push(`## Tiempos (días)`, ``);
  out.push(table(['Métrica', 'n', 'Mediana', 'Promedio', 'Máximo'], [
    ['Lead time (creada → Done)', lead.length, fmt(median(lead)), fmt(sum(lead) / lead.length), fmt(Math.max(...lead))],
    ['Cycle time (In progress → Done)', cycle.length, fmt(median(cycle)), fmt(sum(cycle) / cycle.length), fmt(Math.max(...cycle))],
  ]), ``);
  out.push(`El cycle time solo cuenta tarjetas que algún snapshot vio en In progress. Los drafts que ya estaban en Done en su primer snapshot no tienen fecha de término y quedan fuera.`, ``);
  if (reconciled.length) {
    out.push(`Tarjetas conciliadas o registradas después de hechas el 2026-10-30 (${reconciled.length}): cuentan en el avance, pero no en lead ni cycle time.`, ``);
  }

  out.push(`## Por semana`, ``);
  out.push(table(['Semana', 'Tarjetas', 'Terminadas', 'Estimado (h)', 'Real (h)', 'Real / estimado'], byWeek(cards).map(([week, cs]) => {
    const fin = cs.filter(isDone);
    const paired = fin.filter((c) => num(c.latest.estimate_h) != null && num(c.latest.real_h) != null);
    const est = sum(paired.map((c) => num(c.latest.estimate_h)));
    const real = sum(paired.map((c) => num(c.latest.real_h)));
    return [week, cs.length, fin.length, fmt(sum(cs.map((c) => num(c.latest.estimate_h) ?? 0))), paired.length ? fmt(real) : '—', paired.length ? fmt(real / est, 2) : '—'];
  })), ``);
  out.push(`Real / estimado usa solo tarjetas terminadas con ambos campos; sobre 1 significa que se subestimó.`, ``);

  const missingReal = done.filter((c) => num(c.latest.real_h) == null);
  if (missingReal.length) {
    out.push(`Tarjetas en Done sin Real (h): ${missingReal.length}.`, ``);
  }

  for (const [label, key] of [['Tipo', 'tipo'], ['Área', 'area']]) {
    const groups = new Map();
    for (const c of cards) {
      const k = c.latest[key] || '(vacío)';
      const g = groups.get(k) ?? { total: 0, done: 0, hours: 0 };
      g.total++;
      if (isDone(c)) g.done++;
      g.hours += num(c.latest.estimate_h) ?? 0;
      groups.set(k, g);
    }
    out.push(`## Por ${label.toLowerCase()}`, ``);
    out.push(table([label, 'Tarjetas', 'Terminadas', 'Estimado (h)'], [...groups.entries()]
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([k, g]) => [k, g.total, g.done, fmt(g.hours)])), ``);
  }
  return out.join('\n');
}

function writeCsv(path, rows) {
  const header = Object.keys(rows[0]);
  writeFileSync(path, [header, ...rows.map((r) => header.map((h) => r[h]))].map((r) => r.join(',')).join('\n') + '\n');
}

const [dir, flag, outDir] = process.argv.slice(2);
if (!dir) {
  console.error('usage: board-metrics.mjs <snapshots-dir> [--csv <out-dir>]');
  process.exit(2);
}
const snapshots = loadSnapshots(dir);
if (!snapshots.length) {
  console.error(`no snapshots (YYYY-MM-DD.csv) in ${dir}`);
  process.exit(1);
}
console.log(report(snapshots));
if (flag === '--csv' && outDir) {
  mkdirSync(outDir, { recursive: true });
  writeCsv(join(outDir, 'burnup.csv'), burnup(snapshots));
  writeCsv(join(outDir, 'cfd.csv'), cfd(snapshots));
}
