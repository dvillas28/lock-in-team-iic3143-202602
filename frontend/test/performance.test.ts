import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error -- plain ESM script without type declarations
import { buildReport, failedReport, median, MARKER, rate, verdict } from "../scripts/performance-report.mjs";

test("report statistics use medians, Google thresholds and a noise tolerance", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([Number.NaN]), undefined);
  assert.equal(rate(2500, [2500, 4000]), "bueno");
  assert.equal(rate(2501, [2500, 4000]), "mejorable");
  assert.equal(rate(4001, [2500, 4000]), "deficiente");
  assert.equal(verdict(40, 50), "⚪ se mantiene");
  assert.equal(verdict(-60, 50), "🟢 mejora");
  assert.equal(verdict(60, 50), "🔴 empeora");
  assert.equal(verdict(3, 2, true), "🟢 mejora");
});

const routes = [{ id: "login", label: "Login UC", url: "http://uc.localhost:3000/login" }];
const run = (lcp: number) => ({
  audits: { "largest-contentful-paint": lcp, "cumulative-layout-shift": 0, "total-blocking-time": 60, "first-contentful-paint": 1000,
    "speed-index": 1000, "server-response-time": 5 },
  scores: { performance: 98, accessibility: 100, "best-practices": 96, seo: 100 },
});
const measurement = (lcp: number, extra: object = {}) => ({ routes, runs: 3, lighthouseVersion: "13.6.0", chrome: "Chrome/158",
  javascript: { gzipBytes: 754000, files: 88 }, lighthouse: { login: [run(lcp), run(lcp + 10), run(lcp - 10)] },
  interaction: [{ inp: 32 }, { inp: 30 }, { inp: 40 }],
  webVitals: [24, 32, 40].map(inp => ({ LCP: { value: 60, rating: "good", element: "main>section.auth-panel>p.hint" },
    INP: { value: inp, rating: "good", element: "#email" }, CLS: { value: 0.002, rating: "good", element: null } })), axe: { login: { passes: 30, violations: [] } }, ...extra });

test("the PR comment compares dev and the PR and labels regressions beyond noise", () => {
  const report = buildReport(measurement(1000), measurement(1500, {
    javascript: { gzipBytes: 761500, files: 89 },
    axe: { login: { passes: 29, violations: [{ rule: "label", impact: "critical", help: "Los campos necesitan etiqueta", url: "https://dequeuniversity.com/rules/axe/4.14/label", elements: 1, targets: ["#email"] }] } },
  }));
  assert.ok(report.startsWith(MARKER));
  assert.match(report, /frente a `dev`/);
  assert.match(report, /\| LCP \| 1\.000 ms \| 1\.500 ms \(bueno\) \| \+500 ms \| 🔴 empeora \|/);
  assert.match(report, /JS del cliente \(gzip\) \| 754,0 kB \| 761,5 kB \| \+7,5 kB \(\+1,0 %\) \| ⚪ se mantiene/);
  assert.match(report, /INP \(laboratorio\) \| 32 ms \| 32 ms \(bueno\)/);
  assert.match(report, /TBT es solo una métrica de laboratorio/);
  assert.match(report, /\| INP \| 32 ms \| 32 ms \(bueno\) \| ±0 ms \| ⚪ se mantiene \| `#email` \|/);
  assert.match(report, /\| LCP \| 60 ms \| 60 ms \(bueno\) \| ±0 ms \| ⚪ se mantiene \| `section.auth-panel > p.hint` \|/);
  assert.match(report, /\[`label`\]\(https:\/\/dequeuniversity\.com\/rules\/axe\/4\.14\/label\) \| crítico \| 1 \| `#email`/);
  assert.match(report, /🔴 \*\*2 métricas empeoran\*\*/);
});

test("missing measurements are reported as limitations, never as values", () => {
  const broken = measurement(1000, { javascript: { error: "no chunks" }, interaction: [{ error: "Lighthouse did not report INP" }],
    webVitals: [{ error: "web-vitals did not report INP" }],
    lighthouse: { login: [{ error: "timeout" }] } });
  const report = buildReport(measurement(1000), broken);
  assert.match(report, /> \[!WARNING\]/);
  assert.match(report, /Este PR, INP: 1 de 1 flujos fallaron \(Lighthouse did not report INP\)/);
  assert.match(report, /INP \(laboratorio\) \| 32 ms \| no disponible \| — \| ⚠️ sin comparación/);
  assert.match(report, /Lighthouse \| medido \| no disponible/);
  assert.match(report, /\| INP \| 32 ms \| no disponible \| — \| ⚠️ sin comparación/);
  assert.match(report, /Este PR, web-vitals: 1 de 1 cargas fallaron/);
  assert.match(failedReport("falta la medición de dev"), /No se pudo medir: falta la medición de dev/);
});
