// Compares two performance-measure.mjs results (base `dev` and the PR) and prints the PR comment in Markdown.
// Usage: node scripts/performance-report.mjs <base.json> <pr.json>
// Informative only: it never fails because a metric got worse.
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const MARKER = "<!-- reporte-rendimiento -->";
// tol: change treated as measurement noise. limits: [good up to, poor above] (Google / Lighthouse thresholds).
export const METRICS = [
  { id: "largest-contentful-paint", name: "LCP", main: true, tol: b => Math.max(50, b * 0.05), limits: [2500, 4000] },
  { id: "cumulative-layout-shift", name: "CLS", main: true, cls: true, tol: () => 0.01, limits: [0.1, 0.25] },
  { id: "total-blocking-time", name: "TBT", main: true, tol: b => Math.max(30, b * 0.1), limits: [200, 600] },
  { id: "first-contentful-paint", name: "FCP", tol: b => Math.max(50, b * 0.05), limits: [1800, 3000] },
  { id: "speed-index", name: "Speed Index", tol: b => Math.max(50, b * 0.05), limits: [3400, 5800] },
  { id: "server-response-time", name: "TTFB", tol: b => Math.max(30, b * 0.1), limits: [800, 1800] },
];
// Field metrics measured in the page with web-vitals; thresholds as in web-vitals itself.
export const WEB_VITALS = [
  { name: "LCP", tol: b => Math.max(50, b * 0.1), limits: [2500, 4000] },
  { name: "INP", tol: b => Math.max(24, b * 0.1), limits: [200, 500] },
  { name: "CLS", cls: true, tol: () => 0.01, limits: [0.1, 0.25] },
];
export const INP = { name: "INP (laboratorio)", tol: b => Math.max(24, b * 0.1), limits: [200, 500] };
const CATEGORIES = [["performance", "Puntaje de performance", 2], ["best-practices", "Buenas prácticas", 0], ["seo", "SEO", 0]];
const IMPACT = { critical: "crítico", serious: "serio", moderate: "moderado", minor: "menor" };
const NA = "no disponible";

export function median(values) {
  const list = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!list.length) return undefined;
  const middle = Math.floor(list.length / 2);
  return list.length % 2 ? list[middle] : (list[middle - 1] + list[middle]) / 2;
}

export function rate(value, [good, poor]) {
  if (value <= good) return "bueno";
  return value <= poor ? "mejorable" : "deficiente";
}

/** Inside the tolerance it is noise, not an improvement or a regression. */
export function verdict(delta, tolerance, higherIsBetter = false) {
  if (Math.abs(delta) <= tolerance) return "⚪ se mantiene";
  return (higherIsBetter ? delta > 0 : delta < 0) ? "🟢 mejora" : "🔴 empeora";
}

const number = (v, digits = 0) => v.toLocaleString("es-CL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const sign = (v, digits = 0) => Number(Math.abs(v).toFixed(digits)) === 0 ? "±" : v > 0 ? "+" : "−";
const signed = (v, digits = 0) => `${sign(v, digits)}${number(Math.abs(v), digits)}`;
export const format = (v, metric) => metric?.cls ? number(v, 3) : `${number(v)} ms`;
const runs = list => (list ?? []).filter(run => !run.error);

/** Median of each audit and category score per route; undefined when every run failed. */
export function summarize(result) {
  const routes = {};
  for (const route of result.routes ?? []) {
    const ok = runs(result.lighthouse?.[route.id]);
    if (!ok.length) continue;
    routes[route.id] = { samples: ok.length };
    for (const m of METRICS) routes[route.id][m.id] = median(ok.map(run => run.audits[m.id]));
    for (const [id] of [...CATEGORIES, ["accessibility"]]) routes[route.id][id] = median(ok.map(run => run.scores[id]));
  }
  const interactions = runs(result.interaction);
  const vitals = runs(result.webVitals);
  const webVitals = Object.fromEntries(WEB_VITALS.map(m => [m.name, median(vitals.map(run => run[m.name]?.value))]));
  const elements = Object.fromEntries(WEB_VITALS.map(m => [m.name, vitals.map(run => run[m.name]?.element).find(Boolean)]));
  return { routes, inp: median(interactions.map(run => run.inp)), inpSamples: interactions.length, webVitals, elements, webVitalsSamples: vitals.length };
}

function errors(result, side) {
  const found = [];
  if (result.error) found.push(`${side}: ${result.error}`);
  if (result.javascript?.error) found.push(`${side}, peso del JS: ${result.javascript.error}`);
  for (const [route, list] of Object.entries(result.lighthouse ?? {})) {
    const failed = (list ?? []).filter(run => run.error);
    if (failed.length) found.push(`${side}, Lighthouse en ${route}: ${failed.length} de ${list.length} corridas fallaron (${failed[0].error})`);
  }
  const failedInp = (result.interaction ?? []).filter(run => run.error);
  if (failedInp.length) found.push(`${side}, INP: ${failedInp.length} de ${result.interaction.length} flujos fallaron (${failedInp[0].error})`);
  const failedVitals = (result.webVitals ?? []).filter(run => run.error);
  if (failedVitals.length) found.push(`${side}, web-vitals: ${failedVitals.length} de ${result.webVitals.length} cargas fallaron (${failedVitals[0].error})`);
  for (const [route, axe] of Object.entries(result.axe ?? {})) if (axe?.error) found.push(`${side}, axe-core en ${route}: ${axe.error}`);
  return found;
}

export function buildReport(base, pr) {
  const b = summarize(base);
  const p = summarize(pr);
  const routes = pr.routes ?? base.routes ?? [];
  const main = [];
  const detail = [];
  const a11y = [];
  const violations = [];
  const worse = [];
  let better = 0;
  const note = (result, text) => {
    if (result.includes("empeora")) worse.push(text);
    if (result.includes("mejora")) better += 1;
  };
  const row = (route, name, baseText, prText, change, result) => `| ${route} | ${name} | ${baseText} | ${prText} | ${change} | ${result} |`;

  const jsBase = base.javascript?.gzipBytes;
  const jsPr = pr.javascript?.gzipBytes;
  if (Number.isFinite(jsBase) && Number.isFinite(jsPr)) {
    const delta = (jsPr - jsBase) / 1000;
    const result = verdict(delta, Math.max(1, (jsBase / 1000) * 0.01));
    const pct = (delta / (jsBase / 1000)) * 100;
    main.push(row("todas", "JS del cliente (gzip)", `${number(jsBase / 1000, 1)} kB`, `${number(jsPr / 1000, 1)} kB`, `${signed(delta, 1)} kB (${signed(pct, 1)} %)`, result));
    note(result, `JS del cliente (${signed(delta, 1)} kB)`);
  } else main.push(row("todas", "JS del cliente (gzip)", Number.isFinite(jsBase) ? `${number(jsBase / 1000, 1)} kB` : NA, Number.isFinite(jsPr) ? `${number(jsPr / 1000, 1)} kB` : NA, "—", "⚠️ sin comparación"));

  for (const route of routes) {
    const label = `${route.label} (\`${new URL(route.url).host}${new URL(route.url).pathname}\`)`;
    const rb = b.routes[route.id];
    const rp = p.routes[route.id];
    if (!rb || !rp) {
      main.push(row(label, "Lighthouse", rb ? "medido" : NA, rp ? "medido" : NA, "—", "⚠️ sin comparación"));
      continue;
    }
    for (const m of METRICS) {
      const delta = rp[m.id] - rb[m.id];
      const result = verdict(delta, m.tol(rb[m.id]));
      const text = row(label, m.name, format(rb[m.id], m), `${format(rp[m.id], m)} (${rate(rp[m.id], m.limits)})`, m.cls ? signed(delta, 3) : `${signed(delta)} ms`, result);
      (m.main ? main : detail).push(text);
      note(result, `${m.name} en ${route.label}`);
    }
    for (const [id, name, tol] of CATEGORIES) {
      const result = verdict(rp[id] - rb[id], tol, true);
      detail.push(row(label, name, number(rb[id]), number(rp[id]), signed(rp[id] - rb[id]), result));
      note(result, `${name.toLowerCase()} en ${route.label}`);
    }
    const resultA11y = verdict(rp.accessibility - rb.accessibility, 0, true);
    a11y.push(row(label, "Accesibilidad (Lighthouse)", number(rb.accessibility), number(rp.accessibility), signed(rp.accessibility - rb.accessibility), resultA11y));
    note(resultA11y, `accesibilidad en ${route.label}`);
    const vb = base.axe?.[route.id]?.violations;
    const vp = pr.axe?.[route.id]?.violations;
    const count = list => list.reduce((total, v) => total + v.elements, 0);
    const text = list => list ? `${list.length} ${list.length === 1 ? "regla" : "reglas"}, ${count(list)} elem.` : NA;
    if (vb && vp) {
      const result = verdict(vp.length - vb.length || count(vp) - count(vb), 0);
      a11y.push(row(label, "Violaciones de axe-core", text(vb), text(vp), `${signed(vp.length - vb.length)} reglas`, result));
      note(result, `axe-core en ${route.label}`);
    } else a11y.push(row(label, "Violaciones de axe-core", text(vb), text(vp), "—", "⚠️ sin comparación"));
    for (const v of vp ?? []) {
      violations.push(`| ${route.label} | [\`${v.rule}\`](${v.url}) | ${IMPACT[v.impact] ?? v.impact} | ${v.elements} | ${v.targets.map(t => `\`${t.replaceAll("|", "\\|")}\``).join("<br>")} | ${v.help} |`);
    }
  }

  if (b.inp !== undefined && p.inp !== undefined) {
    const result = verdict(p.inp - b.inp, INP.tol(b.inp));
    main.push(row("Login UC: escribir y mostrar contraseña", INP.name, format(b.inp), `${format(p.inp)} (${rate(p.inp, INP.limits)})`, `${signed(p.inp - b.inp)} ms`, result));
    note(result, "INP de laboratorio en el login");
  } else main.push(row("Login UC: escribir y mostrar contraseña", INP.name, b.inp === undefined ? NA : format(b.inp), p.inp === undefined ? NA : format(p.inp), "—", "⚠️ sin comparación"));

  const vitalsRows = WEB_VITALS.map(m => {
    const vb = b.webVitals[m.name];
    const vp = p.webVitals[m.name];
    const element = p.elements[m.name] ? `\`${p.elements[m.name].split(">").slice(-2).join(" > ").replaceAll("|", "\\|")}\`` : "—";
    if (vb === undefined || vp === undefined) {
      return `| ${m.name} | ${vb === undefined ? NA : format(vb, m)} | ${vp === undefined ? NA : format(vp, m)} | — | ⚠️ sin comparación | ${element} |`;
    }
    const result = verdict(vp - vb, m.tol(vb));
    note(result, `${m.name} (web-vitals)`);
    return `| ${m.name} | ${format(vb, m)} | ${format(vp, m)} (${rate(vp, m.limits)}) | ${m.cls ? signed(vp - vb, 3) : `${signed(vp - vb)} ms`} | ${result} | ${element} |`;
  });
  const problems = [...errors(base, "dev"), ...errors(pr, "Este PR")];
  const summary = worse.length
    ? `🔴 **${worse.length} ${worse.length === 1 ? "métrica empeora" : "métricas empeoran"}** más allá del ruido: ${worse.join(", ")}.`
    : "✅ **Ninguna métrica empeora** más allá del ruido de medición.";
  const improvements = better ? ` 🟢 ${better} ${better === 1 ? "mejora" : "mejoran"}.` : "";
  const header = "| Escenario | Métrica | dev | Este PR | Cambio | Resultado |\n|---|---|---:|---:|---:|---|";
  const samples = Math.min(...Object.values(p.routes).map(r => r.samples), base.runs ?? 5);
  return [
    MARKER,
    "## Rendimiento de este PR frente a `dev`",
    "",
    `${summary}${improvements}`,
    ...(problems.length ? ["", "> [!WARNING]", "> Algunas mediciones no se completaron y no se inventan valores:", ...problems.map(text => `> - ${text}`)] : []),
    "",
    "### Core Web Vitals de laboratorio y peso del JavaScript",
    "",
    header,
    ...main,
    "",
    "### LCP, INP y CLS con web-vitals en el navegador",
    "",
    `Login UC en Chrome sin emulación ni throttling, caché vacía. La librería \`web-vitals\` se inyecta desde el script de medición (la app no la incluye) y registra interacciones reales: escribir el correo y mostrar y ocultar la contraseña. Mediana de ${p.webVitalsSamples} cargas.`,
    "",
    "| Métrica | dev | Este PR | Cambio | Resultado | Elemento responsable (PR) |",
    "|---|---:|---:|---:|---|---|",
    ...vitalsRows,
    "",
    "**Sobre INP.** En una carga de Lighthouse nadie hace clic, así que TBT es solo una métrica de laboratorio *relacionada* con la capacidad de respuesta, no un INP. Las filas INP sí miden interacciones: Lighthouse (modo timespan, perfil móvil) y web-vitals registran eventos reales de teclado y clic que Chrome despacha en el login. Sigue siendo laboratorio: un guion, no usuarios reales; AcademiX no recolecta métricas de campo (RUM). Si no hubo interacción medible, se informa como no disponible.",
    "",
    "<details><summary>Más métricas de Lighthouse: FCP, Speed Index, TTFB, puntaje, buenas prácticas y SEO</summary>",
    "",
    header,
    ...detail,
    "",
    "</details>",
    "",
    "### Accesibilidad",
    "",
    header,
    ...a11y,
    "",
    ...(violations.length
      ? ["<details open><summary>Reglas de axe-core que fallan en este PR</summary>", "", "| Escenario | Regla | Impacto | Elementos | Ejemplos | Qué falla |", "|---|---|---|---:|---|---|", ...violations, "", "</details>"]
      : ["axe-core no encontró violaciones en este PR."]),
    "",
    "> axe-core es el motor open source que también usa Lighthouse. Revisa reglas WCAG 2 y buenas prácticas; no reemplaza la revisión con teclado y lector de pantalla.",
    "",
    `<sub>Cómo se midió: Lighthouse ${pr.lighthouseVersion ?? "?"} en ${pr.chrome ?? "Chrome"}, perfil móvil por defecto (CPU 4x, red lenta simulada), mediana de ${samples} corridas por escenario; INP: mediana de ${p.inpSamples} flujos. \`dev\` y el PR se construyen con la misma configuración y se miden en el mismo runner, uno después del otro, con las mismas herramientas (las del PR). Rutas públicas sin backend: el contenido académico autenticado no se mide aquí. Se considera ruido un cambio de hasta 5 % o 50 ms en LCP, FCP y Speed Index; 10 % o 30 ms en TBT y TTFB; 10 % o 24 ms en INP; 0,01 en CLS; 2 puntos en el puntaje de performance y 1 % en el JS. En accesibilidad, buenas prácticas, SEO y axe-core cualquier cambio cuenta.</sub>`,
  ].join("\n");
}

/** Comment shown when the measurement job produced nothing to compare. */
export function failedReport(reason) {
  return `${MARKER}\n## Rendimiento de este PR frente a \`dev\`\n\n⚠️ No se pudo medir: ${reason}. Revisen el log del workflow **Reporte de rendimiento**; no se publican valores sin medición.`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [basePath, prPath] = process.argv.slice(2);
  const read = path => existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
  const base = read(basePath);
  const pr = read(prPath);
  console.log(base && pr ? buildReport(base, pr) : failedReport(`falta la medición de ${base ? "este PR" : "dev"}`));
}
