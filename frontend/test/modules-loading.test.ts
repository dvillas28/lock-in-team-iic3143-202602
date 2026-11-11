import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { ModulesPanel } from "../src/components/content/modules-panel.tsx";
import { QuizLinkDialog } from "../src/components/content/quiz-link-dialog.tsx";
import { useSession } from "../src/components/auth/session-provider.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, resources, unit } from "./fixtures/content.ts";
import { deferred } from "./fixtures/courses.ts";

const view = () => h(ModulesPanel, { courseId: course.id });
const published = { ...unit, publishedAt: "2026-10-22T12:00:00Z" };
const wait = (ms: number) => new Promise(done => setTimeout(done, ms));
const fake = "a, button, input, select, textarea, [tabindex], nav";

function assertModulesSkeleton(root: Element) {
  const content = root.querySelector(".skeleton-content")!;
  assert.ok(content.querySelector(".module-workspace > .module-index.card"), "side index");
  assert.equal(content.querySelectorAll(".academic-module > .module-header").length, 3);
  assert.equal(content.querySelector(fake), null, "no links, buttons or landmarks in placeholders");
  assert.equal(content.textContent, "");
}

test("an unknown course shows the shared course skeleton with the modules layout", async () => {
  const ui = await mount(view(), () => new Promise<Response>(() => {}), "teacher");
  try {
    const page = ui.doc.querySelector(".academic-workspace")!;
    assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), ["Módulos y material"]);
    assert.deepEqual([...page.querySelectorAll('[role="status"]')].map(e => e.textContent), ["Cargando módulos y material…"]);
    assertModulesSkeleton(page);
  } finally { await ui.close(); }
});

test("a known course keeps its real header and tabs while only the modules are placeholders", async () => {
  for (const profile of ["teacher", "assistant", "student", "owner"]) {
    const modules = deferred<Response>();
    const ui = await mount(view(), r => r.url.endsWith("/modules") ? modules.promise : Response.json(course), profile);
    try {
      assert.equal(ui.doc.querySelector(".page-heading .skeleton"), null, profile);
      assert.match(ui.doc.querySelector(".page-heading")!.textContent!, /IIC3143 · 2026-2.*Desarrollo de software/);
      assert.ok(ui.doc.querySelector('nav[aria-label="Curso"] a[aria-current="page"]'), `${profile}: real tabs`);
      assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), ["Módulos y material"]);
      const statuses = [...ui.doc.querySelectorAll('[role="status"]')].map(e => e.textContent).filter(Boolean);
      assert.deepEqual(statuses, ["Cargando módulos…"], profile);
      assertModulesSkeleton(ui.doc.querySelector(".skeleton-region")!);
      const heading = ui.doc.querySelector("h1");
      await ui.settle(() => modules.resolve(Response.json({ items: [published] })));
      assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
      assert.equal(ui.doc.querySelector("h1"), heading, "the real header is kept, not remounted");
      assert.ok(ui.doc.querySelector('nav[aria-label="Índice de módulos"] a[href$="#module-' + unit.id + '"]'));
    } finally { await ui.close(); }
  }
});

test("resources keep the 350 ms delay, then show compact rows without a second delay", async () => {
  const pending = deferred<Response>();
  const ui = await mount(view(), r => r.url.endsWith("/resources") ? pending.promise : Response.json(r.url.endsWith("/modules") ? { items: [published] } : course), "teacher");
  try {
    await ui.click("Unidad 1");
    const panel = () => ui.doc.querySelector<HTMLElement>(`#materials-${unit.id}`)!;
    await wait(200); await ui.settle(() => {});
    assert.ok(panel().querySelector(".resource-pending"), "reserved space before the delay");
    assert.equal(panel().querySelector(".skeleton"), null);
    await wait(250); await ui.settle(() => {});
    assert.ok(panel().querySelector(".resource-skeleton .skeleton-region"), "compact rows after 350 ms");
    assert.equal(panel().hidden, false, "the accordion stays expanded");
    assert.equal(ui.doc.querySelector(".module-collapse")?.getAttribute("aria-expanded"), "true");
    await ui.settle(() => pending.resolve(Response.json(resources())));
    assert.equal(panel().querySelector(".skeleton"), null);
    assert.match(panel().textContent!, /Este módulo no tiene materiales/);
    assert.equal(panel().querySelector(".empty-zone h3")?.textContent, "Este módulo no tiene materiales", "nested under the module h2");
  } finally { await ui.close(); }
});

test("«Enlazar cuestionario» shows compact choices only for slow loads and keeps its empty state", async () => {
  function Dialog() {
    const { session } = useSession();
    return h(QuizLinkDialog, { open: true, session, slug: "uc", parent: published, course, items: [], disabled: false, reload: async () => true, onClose() {} });
  }
  for (const slow of [false, true]) {
    const quizzes = deferred<Response>();
    const ui = await mount(h(Dialog), r => r.url.endsWith("/quizzes") ? quizzes.promise : Response.json(course), "teacher");
    try {
      const dialog = ui.doc.querySelector("dialog")!;
      if (slow) { await wait(450); await ui.settle(() => {}); }
      if (!slow) assert.equal(dialog.querySelector(".skeleton"), null, "fast loads never flash");
      else {
        assert.equal(dialog.querySelector('[role="status"]')?.textContent, "Cargando cuestionarios…");
        assert.equal(dialog.querySelectorAll(".skeleton-content .option").length, 3);
        assert.equal(dialog.querySelector(".skeleton-content :is(input, label, button)"), null);
      }
      await ui.settle(() => quizzes.resolve(Response.json({ items: [] })));
      assert.equal(dialog.querySelector(".skeleton"), null);
      assert.match(dialog.textContent!, /No hay cuestionarios para enlazar/);
    } finally { await ui.close(); }
  }
});

test("403, 404 and 500 on the course or the modules keep their states without placeholders", async () => {
  for (const target of ["course", "modules"] as const) {
    for (const [status, text] of [[403, /Permisos insuficientes/], [404, /no disponible/], [500, /No se pudo completar/]] as const) {
      const ui = await mount(view(), r => {
        const failing = target === "modules" ? r.url.endsWith("/modules") : r.url.endsWith(course.id);
        return failing ? Response.json({ status }, { status }) : r.url.endsWith("/modules") ? Response.json({ items: [] }) : Response.json(course);
      }, "teacher");
      try {
        assert.match(ui.doc.body.textContent!, text, `${target} ${status}`);
        assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, `${target} ${status}`);
      } finally { await ui.close(); }
    }
  }
});

test("an empty course shows its empty state, and placeholders are the same for every role", async () => {
  const ui = await mount(view(), r => r.url.endsWith("/modules") ? Response.json({ items: [] }) : Response.json(course), "student");
  try {
    assert.equal(ui.doc.querySelector(".skeleton"), null);
    assert.match(ui.doc.body.textContent!, /Aún no hay módulos disponibles/);
  } finally { await ui.close(); }
  const shapes = new Set<string>();
  for (const profile of ["teacher", "assistant", "student", "owner"]) {
    const pending = await mount(view(), r => r.url.endsWith("/modules") ? new Promise<Response>(() => {}) : Response.json(course), profile);
    try { shapes.add(pending.doc.querySelector(".skeleton-content")!.innerHTML); } finally { await pending.close(); }
  }
  assert.equal(shapes.size, 1);
});
