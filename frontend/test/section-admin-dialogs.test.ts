import assert from "node:assert/strict";
import { test } from "node:test";
import { SUCCESS_FEEDBACK_MS } from "../src/components/use-feedback.ts";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, otherSection } from "./fixtures/courses.ts";

type Ui = Awaited<ReturnType<typeof mount>>;
/** jsdom has no modal runtime: open/close toggle the attribute and `close` fires the native event. */
function modalRuntime(ui: Ui) {
  const proto = ui.dom.window.HTMLDialogElement.prototype;
  proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  proto.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new ui.dom.window.Event("close")); };
}
const dialogOf = (ui: Ui, form: string) => ui.doc.querySelector(`dialog form[aria-label="${form}"]`)!.closest("dialog")!;
const trigger = (ui: Ui, label: string) => [...ui.doc.querySelectorAll<HTMLButtonElement>(".section-toolbar button")].find(b => b.textContent === label)!;
const type = (ui: Ui, form: string, name: string, value: string) => ui.settle(() => {
  const input = ui.doc.querySelector<HTMLInputElement>(`dialog form[aria-label="${form}"] [name="${name}"]`)!;
  input.value = value; input.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
});

function api(options: { activeEnrollments?: number } = {}) {
  let sections = [section, otherSection];
  const reply = async (r: Request) => {
    if (r.method === "PATCH" && options.activeEnrollments !== undefined) {
      const body = await r.clone().json();
      if (typeof body.capacity === "number" && body.capacity < options.activeEnrollments) return Response.json({ code: "SECTION_CAPACITY_BELOW_ENROLLMENTS" }, { status: 409 });
    }
    if (r.method === "POST" && r.url.endsWith("/sections")) { const created = { ...section, id: section.id.replace(/0$/, "9"), ...await r.clone().json() }; sections = [...sections, created]; return Response.json(created, { status: 201 }); }
    if (r.method === "PATCH") { const body = await r.clone().json(); sections = sections.map(s => r.url.endsWith(s.id) ? { ...s, ...body } : s); return Response.json(sections.find(s => r.url.endsWith(s.id))); }
    if (r.url.endsWith("/sections")) return Response.json({ items: sections });
    if (r.url.includes("/enrollments")) return Response.json({ items: [], hasMore: false, nextCursor: null });
    const detail = sections.find(s => r.url.endsWith(`/sections/${s.id}`));
    return Response.json(detail ?? course);
  };
  return { reply, created: () => sections };
}

test("Crear sección opens a modal, closes after creating, refreshes the picker and keeps the active section", async () => {
  const server = api();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server.reply);
  try {
    modalRuntime(ui);
    const open = trigger(ui, "Crear sección");
    assert.ok(open.classList.contains("btn-primary"), "primary action");
    await ui.settle(() => open.click());
    const dialog = dialogOf(ui, "Crear sección");
    assert.ok(dialog.hasAttribute("open"));
    assert.equal(dialog.querySelector("h2")!.textContent, "Crear sección", "one title, from the dialog");
    await ui.submit('dialog form[aria-label="Crear sección"]', { code: "3", capacity: "15" });
    assert.equal(dialog.hasAttribute("open"), false, "closes on success");
    assert.ok(ui.doc.activeElement === open, "focus returns to the trigger");
    assert.equal(ui.doc.querySelector(".content-notices .content-notice")!.textContent, "Sección creada.", "platform toast");
    assert.equal(ui.doc.querySelector(".section-workspace .notice"), null, "no banner pushes the layout");
    const picker = ui.doc.querySelector<HTMLSelectElement>('select[name="managedSection"]')!;
    assert.equal(picker.options.length, 3, "new section available");
    assert.equal(picker.value, section.id, "active section unchanged");
    await ui.settle(() => open.click());
    assert.equal(ui.doc.querySelector<HTMLInputElement>('dialog form[aria-label="Crear sección"] [name="code"]')!.value, "", "fresh form on reopening");
  } finally { await ui.close(); }
});

test("cancel, close and Escape discard nothing silently; a clean form closes at once and writes nothing", async () => {
  const server = api();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server.reply);
  try {
    modalRuntime(ui);
    const open = trigger(ui, "Configurar curso");
    await ui.settle(() => open.click());
    const dialog = dialogOf(ui, "Configurar curso");
    await ui.settle(() => [...dialog.querySelectorAll("button")].find(b => b.textContent === "Cancelar")!.click());
    assert.equal(dialog.hasAttribute("open"), false, "clean form closes");
    await ui.settle(() => open.click());
    await type(ui, "Configurar curso", "name", "Nombre a medias");
    await ui.settle(() => dialog.dispatchEvent(new ui.dom.window.Event("cancel", { cancelable: true })));
    assert.ok(dialog.hasAttribute("open"), "Escape with changes asks first");
    assert.match(dialog.querySelector('.discard-confirm[role="alert"]')!.textContent!, /cambios sin guardar/);
    assert.ok(ui.doc.activeElement?.textContent === "Seguir editando", "focus moves to the safe choice");
    await ui.click("Seguir editando");
    assert.equal(ui.doc.querySelector<HTMLInputElement>('dialog form[aria-label="Configurar curso"] [name="name"]')!.value, "Nombre a medias");
    await ui.settle(() => dialog.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')!.click());
    await ui.click("Descartar cambios");
    assert.equal(dialog.hasAttribute("open"), false);
    assert.equal(ui.requests.some(r => r.method !== "GET" && !r.url.endsWith("/login")), false, "nothing was written");
  } finally { await ui.close(); }
});

test("Configurar sección edits the selected section only and reflects the saved capacity at once", async () => {
  const server = api();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server.reply);
  try {
    modalRuntime(ui);
    await ui.select('select[name="managedSection"]', otherSection.id);
    const open = trigger(ui, "Configurar sección");
    assert.equal(open.disabled, false);
    await ui.settle(() => open.click());
    const dialog = dialogOf(ui, "Configurar sección");
    assert.equal(dialog.querySelector("h2")!.textContent, "Configurar sección 2");
    assert.equal(dialog.querySelector<HTMLInputElement>('[name="code"]')!.value, "2", "preloaded from the selected section");
    await ui.submit('dialog form[aria-label="Configurar sección"]', { capacity: "25" });
    const patch = ui.requests.find(r => r.method === "PATCH")!;
    assert.ok(patch.url.endsWith(otherSection.id), "only the selected section is written");
    assert.equal(dialogOf(ui, "Configurar sección").hasAttribute("open"), false);
    assert.equal(ui.doc.querySelector(".section-toolbar .chip")!.textContent, "Cupos de estudiantes: 25");
    assert.equal(ui.doc.querySelector(".content-notices .content-notice")!.textContent, "Sección actualizada.");
    assert.ok(ui.doc.activeElement === open, "focus returns to Configurar sección after saving");
  } finally { await ui.close(); }
});

test("a teacher who does not own the course gets the section context without administration modals", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), api().reply, "teacher");
  try {
    assert.equal(ui.doc.querySelector(".section-toolbar .section-name")?.textContent, "Sección 1");
    // Course and section administration stay owner-only; the roster's own «Asignar participante» is not one of them.
    assert.equal(ui.doc.querySelector('select[name="managedSection"], .section-toolbar .admin-dialog, .section-actions') === null, true);
  } finally { await ui.close(); }
});

const fieldError = (ui: Ui) => ui.doc.querySelector('dialog form[aria-label="Configurar sección"] .field-error')?.textContent ?? "";

test("capacity rejects zero, negatives, decimals, text and decreases next to the field without writing or closing", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), api().reply);
  try {
    modalRuntime(ui);
    const open = trigger(ui, "Configurar sección");
    await ui.settle(() => open.click());
    const dialog = dialogOf(ui, "Configurar sección");
    for (const value of ["0", "-3", "2.5"]) {
      await ui.submit('dialog form[aria-label="Configurar sección"]', { capacity: value });
      assert.match(fieldError(ui), /mayor o igual a 1/, value);
      assert.ok(dialog.hasAttribute("open"), `${value}: stays open`);
    }
    const input = dialog.querySelector<HTMLInputElement>('[name="capacity"]')!;
    Object.defineProperty(input, "validity", { configurable: true, get: () => ({ badInput: true }) });
    await ui.submit('dialog form[aria-label="Configurar sección"]');
    assert.match(fieldError(ui), /mayor o igual a 1/, "text in a number field is not «sin límite»");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.equal(ui.requests.some(r => r.method === "PATCH"), false);
  } finally { await ui.close(); }

  const limited = { ...section, capacity: 30 };
  const second = await mount(h(CourseDetail, { courseId: course.id }), r => r.method === "GET" && /\/sections(\/[^/]+)?$/.test(new URL(r.url).pathname)
    ? Response.json(r.url.endsWith("/sections") ? { items: [limited, otherSection] } : r.url.endsWith(limited.id) ? limited : otherSection)
    : api().reply(r));
  try {
    modalRuntime(second);
    await second.settle(() => trigger(second, "Configurar sección").click());
    const form = second.doc.querySelector('dialog form[aria-label="Configurar sección"]')!;
    const cups = form.querySelector('input[name="capacity"]')!;
    const hint = second.doc.getElementById(cups.getAttribute("aria-describedby")!)!;
    assert.equal(form.querySelector(`label[for="${cups.id}"]`)?.textContent, "Cupos de estudiantes");
    assert.match(hint.textContent!, /Solo cuentan las matrículas activas como Estudiante/);
    assert.match(hint.textContent!, /Si mantienes un límite, el mínimo es 30/);
    await second.submit('dialog form[aria-label="Configurar sección"]', { capacity: "20" });
    assert.match(fieldError(second), /No puedes reducir la capacidad. Ingresa 30 o más/);
    assert.equal(second.requests.some(r => r.method === "PATCH"), false);
  } finally { await second.close(); }
});

test("the server keeps capacity above active enrollments; unlimited stays allowed", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), api({ activeEnrollments: 3 }).reply);
  try {
    modalRuntime(ui);
    await ui.settle(() => trigger(ui, "Configurar sección").click());
    const dialog = dialogOf(ui, "Configurar sección");
    await ui.submit('dialog form[aria-label="Configurar sección"]', { capacity: "2" });
    assert.match(fieldError(ui), /debe cubrir a todos los estudiantes con matrícula activa/);
    assert.ok(dialog.hasAttribute("open"), "a rejected write keeps the modal open");
    assert.equal(ui.doc.querySelector(".content-notice"), null, "errors stay in the form, not in a toast");
    await ui.submit('dialog form[aria-label="Configurar sección"]', { capacity: "" , code: "1B" });
    assert.deepEqual(await ui.requests.filter(r => r.method === "PATCH").at(-1)!.json(), { code: "1B" }, "empty keeps it unlimited");
    assert.equal(dialog.hasAttribute("open"), false);
    assert.equal(ui.doc.querySelector(".section-toolbar .chip")!.textContent, "Cupos de estudiantes: Sin límite");
  } finally { await ui.close(); }
});

test("consecutive confirmations replace one toast and expire after five seconds", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ui = await mount(h(CourseDetail, { courseId: course.id }), api().reply);
  try {
    modalRuntime(ui);
    await ui.settle(() => trigger(ui, "Configurar curso").click());
    await ui.submit('dialog form[aria-label="Configurar curso"]', { name: "Curso renombrado" });
    await ui.settle(() => trigger(ui, "Crear sección").click());
    await ui.submit('dialog form[aria-label="Crear sección"]', { code: "5", capacity: "10" });
    const notices = ui.doc.querySelectorAll(".content-notices .content-notice");
    assert.equal(notices.length, 1);
    assert.equal(notices[0].textContent, "Sección creada.");
    assert.equal(ui.doc.querySelector(".content-notices")!.getAttribute("role"), "status");
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS));
    assert.equal(ui.doc.querySelector(".content-notice"), null);
  } finally { await ui.close(); }
});
