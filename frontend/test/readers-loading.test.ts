import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { MaterialReader } from "../src/components/content/material-reader.tsx";
import { AcademicFileReader } from "../src/components/content/academic-file-reader.tsx";
import { PdfPreview } from "../src/components/content/pdf-preview.tsx";
import { ReaderRouteLoading } from "../src/components/content/document-skeleton.tsx";
import type { AcademicFile } from "../src/lib/content/academic-files.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, id, material, timestamp, unit } from "./fixtures/content.ts";
import { deferred } from "./fixtures/courses.ts";

const fake = "a, button, input, select, textarea, [tabindex], nav, h1, h2, h3";
const file: AcademicFile = {
  id: id(52), moduleId: unit.id, kind: "file", title: "Apuntes", fileName: "Apuntes.txt", mediaType: "text/plain",
  preview: "text", byteSize: 4, position: 2, createdBy: id(1), publishedAt: timestamp,
};
const back = `a.reader-return[href="/courses/${course.id}/modules#module-${unit.id}"]`;
const never = () => new Promise<Response>(() => {});
const statuses = (doc: Document) => [...doc.querySelectorAll('[role="status"]')].map(e => e.textContent).filter(Boolean);

function assertPlaceholders(root: Element) {
  const content = root.querySelector(".skeleton-content")!;
  assert.ok(content.querySelector(".skeleton"));
  assert.equal(content.querySelector(fake), null, "no links, buttons, landmarks or headings in placeholders");
  assert.equal(content.textContent, "");
}

test("material reader keeps its real return link and article while the document is a skeleton", async () => {
  for (const slug of ["uc", "utfsm"]) {
    const pending = deferred<Response>();
    const ui = await mount(h(MaterialReader, { courseId: course.id, moduleId: unit.id, materialId: material.id }),
      r => r.url.includes("/materials/") ? pending.promise : Response.json(unit), "student", slug);
    try {
      const link = ui.doc.querySelector(back)!;
      assert.equal(link.textContent, "Volver a módulos", slug);
      assert.equal(ui.doc.querySelector("h1"), null, "the unknown title is not an empty heading");
      assert.deepEqual(statuses(ui.doc), ["Cargando material…"]);
      const article = ui.doc.querySelector("article.material-reader")!;
      assertPlaceholders(article.querySelector(".reader-skeleton")!);
      assert.ok(article.querySelector(".reader-heading .skeleton-pill"), "status chip");
      assert.ok(article.querySelector(".card.reader-paper .reader-skeleton-text"));
      await ui.settle(() => pending.resolve(Response.json({ ...material, markdownBody: "Texto", publishedAt: timestamp })));
      assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
      assert.equal(ui.doc.querySelector(back), link, "the return link is kept, not remounted");
      assert.equal(link.textContent, `Volver a módulos · ${unit.title}`);
      assert.equal(ui.doc.querySelector("article.material-reader"), article);
      assert.equal(ui.doc.querySelector("h1")?.textContent, material.title);
    } finally { await ui.close(); }
  }
});

test("failed reads replace the skeleton; none lingers after 401/403/404/500", async () => {
  for (const status of [401, 403, 404, 500]) {
    for (const view of [
      h(MaterialReader, { courseId: course.id, moduleId: unit.id, materialId: material.id }),
      h(AcademicFileReader, { courseId: course.id, moduleId: unit.id, fileId: file.id }),
    ]) {
      const ui = await mount(view, r => /\/(?:materials\/|files\/)/.test(r.url) || r.url.endsWith("/file")
        ? Response.json({}, { status }) : Response.json(unit), "teacher");
      try {
        assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, String(status));
        // 401 ends the session (empty view); the others explain the failure.
        if (status !== 401) assert.ok(ui.doc.querySelector('[role="alert"]'), String(status));
      } finally { await ui.close(); }
    }
  }
});

test("file reader shows the document skeleton, then a preview skeleton shaped like its format", async () => {
  for (const preview of ["pdf", "image", "text"] as const) {
    const metadata = deferred<Response>();
    const ui = await mount(h(AcademicFileReader, { courseId: course.id, moduleId: unit.id, fileId: file.id }),
      r => r.url.endsWith("/preview") ? never() : r.url.endsWith("/file") ? metadata.promise : Response.json(unit), "assistant");
    try {
      const link = ui.doc.querySelector(back)!;
      assert.deepEqual(statuses(ui.doc), ["Cargando archivo…"], preview);
      assert.ok(ui.doc.querySelector(".reader-skeleton .file-reader-heading .file-reader-meta .skeleton"));
      assert.equal(ui.doc.querySelector("button"), null, "download arrives with the data");
      await ui.settle(() => metadata.resolve(Response.json({ ...file, preview })));
      assert.equal(ui.doc.querySelector(back), link, "the return link is kept, not remounted");
      assert.equal(ui.doc.querySelector("h1")?.textContent, file.title);
      assert.ok(ui.doc.querySelector("button.btn-primary"), "real download action");
      assert.deepEqual(statuses(ui.doc), ["Cargando vista previa…"], preview);
      const region = ui.doc.querySelector(".skeleton-region")!;
      assertPlaceholders(region);
      const shape = { pdf: ".card.pdf-preview .pdf-viewport .pdf-sheet.pdf-sheet-lines", image: ".card.image-preview .image-preview-skeleton", text: ".card.reader-paper .reader-skeleton-text" }[preview];
      assert.ok(region.querySelector(shape), preview);
      assert.equal(region.querySelector('[aria-label="Visor de PDF"]'), null, "no second viewer landmark");
    } finally { await ui.close(); }
  }
});

test("text previews resolve into the page and preview errors leave no skeleton behind", async () => {
  let previews = 0;
  const ui = await mount(h(AcademicFileReader, { courseId: course.id, moduleId: unit.id, fileId: file.id }), r => {
    if (r.url.endsWith("/preview")) return ++previews === 1 ? Response.json({}, { status: 500 }) : new Response("hola");
    return Response.json(r.url.endsWith("/file") ? file : unit);
  }, "student");
  try {
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
    assert.ok(ui.doc.querySelector('[role="alert"]'));
    await ui.click("Reintentar");
    assert.equal(ui.doc.querySelector("pre")?.textContent, "hola");
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
  } finally { await ui.close(); }
});

test("a decoding image keeps its reserved frame and names the new phase", async (t) => {
  const decode = deferred<void>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "Image");
  const revoke = t.mock.method(URL, "revokeObjectURL", () => {});
  t.mock.method(URL, "createObjectURL", () => "blob:reader-test");
  Object.defineProperty(globalThis, "Image", { configurable: true, value: class { naturalWidth = 80; naturalHeight = 60; decode() { return decode.promise; } } });
  const image = { ...file, fileName: "Diagrama.png", mediaType: "image/png", preview: "image" as const, byteSize: 3 };
  const ui = await mount(h(AcademicFileReader, { courseId: course.id, moduleId: unit.id, fileId: file.id }),
    r => r.url.endsWith("/preview") ? new Response("png", { headers: { "Content-Type": image.mediaType } }) : Response.json(r.url.endsWith("/file") ? image : unit), "student");
  try {
    assert.deepEqual(statuses(ui.doc), ["Preparando la imagen…"]);
    assert.ok(ui.doc.querySelector(".card.image-preview .image-preview-skeleton"));
    await ui.settle(() => decode.resolve());
    assert.equal(ui.doc.querySelector("img")?.getAttribute("width"), "80");
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
  } finally {
    await ui.close();
    if (previous) Object.defineProperty(globalThis, "Image", previous);
    else Reflect.deleteProperty(globalThis, "Image");
  }
  assert.equal(revoke.mock.callCount(), 1, "the object URL is still released on unmount");
});

test("the PDF sheet stays visible with placeholder lines while the viewer keeps its statuses", async (t) => {
  const old = Object.getOwnPropertyDescriptor(globalThis, "ResizeObserver");
  Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: class { observe() {} disconnect() {} } });
  try {
    const blob = new Blob();
    t.mock.method(blob, "arrayBuffer", () => new Promise<ArrayBuffer>(() => {}));
    const ui = await mount(h(PdfPreview, { file: blob }), never, "student");
    try {
      const viewer = ui.doc.querySelector('section[aria-label="Visor de PDF"]')!;
      assert.deepEqual(statuses(ui.doc), ["Abriendo PDF…", "Cargando página…"]);
      assert.equal(viewer.querySelector(".pdf-viewport")?.getAttribute("aria-busy"), "true");
      const sheet = viewer.querySelector<HTMLElement>(".pdf-sheet")!;
      assert.equal(sheet.style.visibility, "", "the paper is no longer hidden while pending");
      assert.ok(sheet.classList.contains("is-pending"));
      const lines = sheet.querySelector(".pdf-sheet-skeleton")!;
      assert.equal(lines.getAttribute("aria-hidden"), "true");
      assert.ok(lines.querySelector(".pdf-sheet-code .skeleton"));
      assert.ok(sheet.querySelector("canvas") && sheet.querySelector(".pdf-text-layer"), "pdf.js targets stay mounted");
      assert.equal(viewer.querySelectorAll("button:disabled").length, 5, "controls wait for the document");
    } finally { await ui.close(); }
  } finally {
    if (old) Object.defineProperty(globalThis, "ResizeObserver", old);
    else Reflect.deleteProperty(globalThis, "ResizeObserver");
  }
});

test("reader route fallbacks render the article, return link and skeleton the readers show", () => {
  for (const reader of ["material", "file"] as const) {
    const markup = renderToStaticMarkup(h(PathParamsContext.Provider, { value: { courseId: course.id, moduleId: unit.id } },
      h(ReaderRouteLoading, { reader })));
    const doc = new JSDOM(markup).window.document;
    assert.ok(doc.querySelector(`article.material-reader > ${back}`), reader);
    assert.equal(doc.querySelector("article")!.classList.contains("academic-file-reader"), reader === "file");
    assert.deepEqual(statuses(doc), [reader === "file" ? "Cargando archivo…" : "Cargando material…"]);
    assertPlaceholders(doc.querySelector(".reader-skeleton")!);
  }
});

test("reader skeleton styles use paper tokens on the sheet and stay still under reduced motion", () => {
  const css = readFileSync(new URL("../src/styles/content.css", import.meta.url), "utf8");
  const block = css.slice(css.indexOf("/* Skeleton UI de lectores"), css.indexOf(".content-sr-only"));
  assert.match(block, /\.pdf-sheet \.skeleton \{ background-color: var\(--paper-skeleton\);/);
  assert.match(block, /\.pdf-sheet-code \.skeleton \{ background-color: var\(--paper-skeleton-strong\); \}/);
  assert.match(block, /\.pdf-sheet\.is-pending > :is\(canvas, \.pdf-text-layer\) \{ visibility: hidden; \}/);
  assert.match(block, /@media \(prefers-reduced-motion: reduce\) \{ \.pdf-sheet-skeleton, \.pdf-sheet-skeleton \.skeleton \{ animation: none; \} \}/);
  assert.doesNotMatch(block, /#[0-9a-f]{3,8}\b|rgba?\(|shimmer|translate/i, "colors from tokens, pulse only");
  assert.match(css, /\.pdf-loading \{[^}]*background: var\(--surface\)/, "the page status stays legible over the paper");
});
