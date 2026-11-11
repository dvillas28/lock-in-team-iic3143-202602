import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { CardGridSkeleton, ListSkeleton, PageHeaderSkeleton, Skeleton, SkeletonRegion, TableSkeleton } from "../src/components/skeletons.tsx";

const parse = (node: ReturnType<typeof h>) => new JSDOM(renderToStaticMarkup(node)).window.document;
const css = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

test("a skeleton region announces one specific status and hides only its placeholders", () => {
  const doc = parse(h(SkeletonRegion, { label: "Cargando cursos…", children: h(CardGridSkeleton) }));
  const status = doc.querySelectorAll('[role="status"]');
  assert.equal(status.length, 1);
  assert.equal(status[0].textContent, "Cargando cursos…");
  assert.ok(status[0].classList.contains("sr-only"));
  assert.equal(status[0].closest('[aria-hidden="true"]'), null);
  assert.equal(doc.querySelector(".skeleton-content")?.getAttribute("aria-hidden"), "true");
  assert.equal(doc.querySelector('[aria-busy="true"]'), null, "aria-busy would silence the status");
});

test("placeholders are never interactive, never headings and never carry text", () => {
  for (const node of [h(CardGridSkeleton), h(ListSkeleton), h(TableSkeleton, { columns: 4 }), h(PageHeaderSkeleton)]) {
    const doc = parse(node);
    assert.equal(doc.querySelector("a, button, input, select, textarea, [tabindex]"), null);
    assert.equal(doc.querySelector("h1, h2, h3, h4, h5, h6"), null);
    assert.equal(doc.body.textContent, "");
    for (const bar of doc.querySelectorAll(".skeleton")) assert.equal(bar.getAttribute("aria-hidden"), "true");
  }
});

test("compositions reuse the real layout classes and honor their counts", () => {
  const grid = parse(h(CardGridSkeleton, { count: 2 }));
  assert.equal(grid.querySelectorAll(".course-grid > .card.course-card").length, 2);
  assert.equal(grid.querySelectorAll(".course-card-meta, .course-card-footer").length, 4);
  assert.equal(parse(h(CardGridSkeleton)).querySelectorAll(".course-card").length, 6);
  assert.equal(parse(h(ListSkeleton, { rows: 4 })).querySelectorAll(".skeleton-list > li").length, 4);
  const table = parse(h(TableSkeleton, { columns: 3, rows: 2 }));
  assert.ok(table.querySelector("table.data-table"));
  assert.equal(table.querySelectorAll("thead th").length, 3);
  assert.equal(table.querySelectorAll("tbody td").length, 6);
});

test("a known page title stays a real heading next to its placeholders", () => {
  const doc = parse(h(PageHeaderSkeleton, { title: "Mis cursos" }));
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.equal(doc.querySelector("h1")?.textContent, "Mis cursos");
  assert.equal(doc.querySelector("h1")?.closest('[aria-hidden="true"]'), null);
  assert.equal(doc.querySelectorAll(".page-heading .skeleton").length, 2);
});

test("explicit sizes are logical dimensions and default shapes stay unstyled inline", () => {
  const sized = parse(h(Skeleton, { shape: "block", width: "40px", height: "40px" })).querySelector("span")!;
  assert.equal(sized.className, "skeleton skeleton-block");
  assert.match(sized.getAttribute("style") ?? "", /inline-size:40px;block-size:40px/);
  assert.equal(parse(h(Skeleton)).querySelector("span")!.getAttribute("style"), null);
});

test("styles keep skeletons visible and still under reduced motion, using theme tokens", () => {
  const app = css("../src/styles/app.css"), tokens = css("../src/styles/tokens.css");
  const rules = app.slice(app.indexOf("/* ── Skeleton UI ──"), app.indexOf("@keyframes skeleton-reveal"));
  // Opacity 0 may exist only inside the reveal keyframes, never as a resting state.
  assert.doesNotMatch(rules, /opacity\s*:\s*0\b/);
  assert.match(app, /@keyframes skeleton-reveal \{ from \{ opacity: 0; \} to \{ opacity: 1; \} \}/);
  assert.match(app, /animation: skeleton-reveal [^;]* both;/);
  // The delay is inherited (a replacing skeleton continues it) and bars outside a region (headers, table rows) follow it.
  assert.match(app, /\.skeleton-region \{ animation: skeleton-reveal 1ms linear var\(--skeleton-delay, 200ms\) both; \}/);
  assert.match(app, /:is\(\.page-heading, \.skeleton-heading, \.skeleton-rows\) \.skeleton \{\s*animation: skeleton-reveal [^;]*both, skeleton-pulse [^;]*infinite;/);
  const reduced = app.slice(app.indexOf("@keyframes skeleton-pulse"));
  assert.match(reduced, /@media \(prefers-reduced-motion: reduce\) \{\s*\.skeleton-region, \.skeleton-content \.skeleton, :is\(\.page-heading, \.skeleton-heading, \.skeleton-rows\) \.skeleton \{ animation: none; \}/);
  assert.doesNotMatch(rules, /#[0-9a-f]{3,8}\b|rgba?\(/i, "colors come from tokens.css");
  const dark = tokens.slice(tokens.indexOf('[data-theme="dark"]'));
  assert.match(tokens.slice(0, tokens.indexOf('[data-theme="dark"]')), /--skeleton: var\(--border\);/);
  assert.match(dark, /--skeleton:\s+var\(--muted\);/);
});
