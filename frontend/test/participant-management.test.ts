import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import type { Enrollment } from "../src/lib/courses/validation.ts";
import { mount } from "./fixtures/course-ui.ts";
import { modalRuntime, toast } from "./fixtures/assignment.ts";
import { course, section, otherSection, enrollment, person, id, page, deferred } from "./fixtures/courses.ts";
import { manageDialog, manageForm, manageSelect, manageTitle, manageButton, rowTrigger, openManage, chooseRole, save, press, escapeManage, patches, isManaging } from "./fixtures/management.ts";

const sibling: Enrollment = { ...enrollment, id: id(32), role: "assistant" };
const teacher: Enrollment = { ...enrollment, id: id(33), user: { ...person, id: id(7), name: "Pedro Soto", email: "pedro.soto.con.un.correo.institucional.muy.largo@universidad.example.test" }, role: "teacher" };
/** A small stateful backend: PATCH deactivates the row and, for a role change, adds or reuses the successor. */
function server(initial: Enrollment[], patch?: (r: Request) => Response | undefined | Promise<Response | undefined>) {
  let rows = [...initial];
  const reply = async (r: Request) => {
    if (r.url.endsWith("/sections")) return Response.json({ items: [section, otherSection] });
    if (r.url.includes("/enrollments")) {
      if (r.method === "PATCH") {
        const custom = await patch?.(r.clone());
        if (custom) return custom;
        const target = rows.find(e => r.url.endsWith(`/enrollments/${e.id}`))!, body = await r.clone().json() as { role?: Enrollment["role"]; active?: boolean };
        rows = rows.map(e => e.id === target.id ? { ...e, active: false } : e);
        if (body.role === undefined) return Response.json({ ...target, active: false });
        const existing = rows.find(e => e.active && e.user.id === target.user.id && e.role === body.role);
        const next = existing ?? { ...target, id: id(90 + rows.length), role: body.role, active: true };
        if (!existing) rows = [...rows, next];
        return Response.json(next);
      }
      const status = new URL(r.url).searchParams.get("status");
      return Response.json(page(rows.filter(e => status === null || e.active === (status === "active"))));
    }
    if (r.url.includes("/sections/")) return Response.json(section);
    return Response.json(course);
  };
  return { reply, rows: () => rows };
}
async function owner(rows: Enrollment[], patch?: Parameters<typeof server>[1], profile = "owner", slug = "uc") {
  const backend = server(rows, patch);
  const ui = await mount(h(CourseDetail, { courseId: course.id }), backend.reply, profile, slug);
  modalRuntime(ui);
  if (ui.doc.querySelector('select[name="managedSection"]')) await ui.select('select[name="managedSection"]', section.id);
  return { ui, backend };
}

test("the dialog shows identity, section, current role and status, with labelled controls", async () => {
  const { ui } = await owner([teacher, { ...teacher, id: id(34), user: { ...person, id: id(8) } }]);
  try {
    await openManage(ui, teacher.id);
    const dialog = manageDialog(ui);
    assert.equal(manageTitle(ui), "Gestionar participante");
    assert.equal(dialog.getAttribute("aria-labelledby"), dialog.querySelector("h2")!.id);
    assert.ok(manageButton(ui, "Cerrar"), "icon close button has an accessible name");
    assert.equal(dialog.querySelector(".avatar")!.textContent, "PS");
    assert.match(dialog.textContent!, /Pedro Soto/);
    assert.ok(dialog.querySelector(".assignment-person wbr"), "long addresses get a break opportunity after «@»");
    const facts = Object.fromEntries([...dialog.querySelectorAll(".management-facts > div")].map(d => [d.querySelector("dt")!.textContent, d.querySelector("dd")!.textContent]));
    assert.deepEqual(facts, { "Sección": "1", "Rol actual": "Docente", "Matrícula": "Activa" });
    const select = manageSelect(ui), label = dialog.querySelector(`label[for="${select.id}"]`)!;
    assert.equal(label.textContent, "Rol académico");
    assert.equal(select.selectedOptions[0].textContent, "Docente (actual)");
    assert.match(ui.doc.getElementById(select.getAttribute("aria-describedby")!)!.textContent!, /un rol activo por sección.*pasa al Historial/);
    assert.doesNotMatch(dialog.textContent!, new RegExp(teacher.id), "no internal IDs in the dialog");
    assert.equal(dialog.querySelector("form")!.getAttribute("aria-label"), "Gestionar participante");
  } finally { await ui.close(); }
});

test("only the roles the actor may grant are offered; non-owner teachers never see Docente", async () => {
  for (const [profile, expected] of [["owner", ["student", "assistant", "teacher"]], ["teacher", ["student", "assistant"]]] as const) {
    const { ui } = await owner([enrollment], undefined, profile);
    try {
      await openManage(ui, enrollment.id);
      assert.deepEqual([...manageSelect(ui).options].map(o => o.value), expected);
    } finally { await ui.close(); }
  }
});

test("one native pick (input, then change) selects the role at the first attempt", async () => {
  const { ui } = await owner([{ ...enrollment, role: "assistant" }]);
  try {
    await openManage(ui, enrollment.id);
    const select = manageSelect(ui);
    // Browsers fire `input` before `change`; a re-render in between must not restore the previous value.
    await ui.settle(() => { select.value = "student"; select.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true })); });
    await ui.settle(() => { select.dispatchEvent(new ui.dom.window.Event("change", { bubbles: true })); });
    assert.equal(manageSelect(ui).value, "student");
    assert.equal(manageButton(ui, "Guardar cambios")!.disabled, false);
    assert.match(manageDialog(ui).textContent!, /se creará una nueva como Estudiante/);
  } finally { await ui.close(); }
});

test("saving a role change patches only that enrollment, updates both views and toasts without IDs", async () => {
  const { ui, backend } = await owner([enrollment]);
  try {
    await openManage(ui, enrollment.id);
    const submit = manageButton(ui, "Guardar cambios")!;
    assert.equal(submit.disabled, true, "nothing to save before a change");
    await save(ui);
    assert.equal(patches(ui).length, 0, "an unchanged form never writes");
    await chooseRole(ui, "teacher");
    assert.equal(submit.disabled, false);
    assert.match(manageDialog(ui).textContent!, /pasará al Historial y se creará una nueva como Docente/);
    await save(ui);
    assert.equal(patches(ui).length, 1);
    assert.ok(patches(ui)[0].url.endsWith(`/enrollments/${enrollment.id}`));
    assert.deepEqual(await patches(ui)[0].json(), { role: "teacher" });
    assert.equal(isManaging(ui), false);
    assert.equal(toast(ui), "María Pérez ahora es Docente. La matrícula anterior pasó al Historial.");
    const successor = backend.rows().find(e => e.active && e.role === "teacher")!;
    assert.ok(ui.doc.activeElement === rowTrigger(ui, successor.id), "focus moves to the successor row");
    assert.equal(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`), null, "the old row leaves Activas");
    await ui.click("Historial");
    assert.match(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`)!.textContent!, /Histórica/);
    assert.equal(ui.requests.filter(r => r.method === "GET" && r.url.includes("/me")).length > 0, true);
  } finally { await ui.close(); }
});

test("Activas reflects a confirmed role change while the roster refresh is pending", async () => {
  const next: Enrollment = { ...enrollment, id: id(94), role: "assistant" };
  const refresh = deferred<Response>();
  let changed = false;
  const backend = server([enrollment]);
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => {
    if (r.url.includes("/enrollments") && r.method === "PATCH") {
      changed = true;
      return Response.json(next);
    }
    if (r.url.includes("/enrollments") && changed) return refresh.promise;
    return backend.reply(r);
  }, "teacher");
  try {
    modalRuntime(ui);
    await openManage(ui, enrollment.id);
    await chooseRole(ui, "assistant");
    await save(ui);
    assert.equal(ui.doc.querySelector('.participants-views [aria-pressed="true"]')?.textContent, "Activas");
    assert.equal(rowTrigger(ui, enrollment.id), null);
    assert.match(rowTrigger(ui, next.id).getAttribute("aria-label")!, /Ayudante/);
    await ui.settle(() => refresh.resolve(Response.json(page([next]))));
    assert.equal(isManaging(ui), false);
    assert.equal(ui.doc.querySelectorAll(`[data-enrollment-id="${next.id}"]`).length, 1);
  } finally {
    refresh.resolve(Response.json(page([next])));
    await ui.close();
  }
});

test("permission, capacity, gone and conflict errors are specific and stay next to their cause", async () => {
  const cases: [number, string | undefined, RegExp, boolean][] = [
    [403, undefined, /Solo el propietario del curso administra matrículas docentes/, false],
    [409, "SECTION_ROLE_ALREADY_ACTIVE", /ya tiene otra matrícula activa/, true],
    [409, "SECTION_FULL", /no tiene cupos de estudiantes disponibles/, true],
    [404, undefined, /ya no existe en la sección/, false],
    [409, undefined, /cambió mientras la editabas/, false],
  ];
  for (const [status, code, message, onField] of cases) {
    const { ui } = await owner([{ ...enrollment, role: "assistant" }], () => Response.json({ code, detail: "PRIVATE" }, { status }));
    try {
      await openManage(ui, enrollment.id);
      await chooseRole(ui, "student");
      await save(ui);
      const dialog = manageDialog(ui), alert = dialog.querySelector('[role="alert"]')!;
      assert.match(alert.textContent!, message);
      assert.doesNotMatch(dialog.textContent!, /PRIVATE/);
      assert.equal(alert.classList.contains("field-error"), onField);
      assert.equal(manageSelect(ui).getAttribute("aria-invalid"), onField ? "true" : null);
      assert.ok(isManaging(ui), "a rejected change keeps the dialog and the chosen role");
      assert.equal(manageSelect(ui).value, "student");
    } finally { await ui.close(); }
  }
});

test("pending changes are protected from the close button, Cancelar and Escape alike", async () => {
  const { ui } = await owner([enrollment]);
  try {
    for (const close of [() => press(ui, "Cerrar"), () => press(ui, "Cancelar"), () => escapeManage(ui)]) {
      await openManage(ui, enrollment.id);
      await close();
      assert.equal(isManaging(ui), false, "an untouched dialog closes at once");
      await openManage(ui, enrollment.id);
      await chooseRole(ui, "assistant");
      await close();
      assert.ok(isManaging(ui));
      assert.match(manageDialog(ui).querySelector(".discard-confirm")!.textContent!, /cambios sin guardar/);
      await press(ui, "Seguir editando");
      assert.equal(manageSelect(ui).value, "assistant");
      await close(); await press(ui, "Descartar cambios");
      assert.equal(isManaging(ui), false);
      assert.ok(ui.doc.activeElement === rowTrigger(ui, enrollment.id));
      await openManage(ui, enrollment.id);
      assert.equal(manageSelect(ui).value, "student", "a new opening starts from the saved role");
      await press(ui, "Cancelar");
    }
    assert.equal(patches(ui).length, 0);
  } finally { await ui.close(); }
});

test("revocation is an explicit step that names the person, role and section; cancelling sends nothing", async () => {
  const { ui } = await owner([enrollment, sibling]);
  try {
    await openManage(ui, enrollment.id);
    await press(ui, "Revocar matrícula");
    assert.equal(manageTitle(ui), "Revocar matrícula");
    assert.equal(ui.doc.querySelector(manageForm), null, "the role form gives way to the confirmation");
    assert.equal(ui.doc.querySelectorAll("dialog[open]").length, 1, "no stacked dialogs");
    const warning = manageDialog(ui).querySelector(".management-warning")!;
    assert.match(warning.textContent!, /María Pérez como Estudiante en la sección 1/);
    assert.match(warning.textContent!, /pasará al Historial/);
    assert.match(warning.textContent!, /Sus otros roles activos en esta sección \(Ayudante\) no se revocan/);
    assert.equal(ui.doc.activeElement?.getAttribute("aria-describedby"), warning.id);
    await press(ui, "Cancelar");
    assert.equal(patches(ui).length, 0);
    assert.ok(ui.doc.querySelector(manageForm));
  } finally { await ui.close(); }
});

test("a confirmed revocation leaves Activas, appears in Historial and toasts without reloading", async () => {
  const pending = deferred<Response>();
  let held = true;
  const { ui } = await owner([enrollment, sibling], async () => { if (held) { held = false; await pending.promise; } return undefined; });
  try {
    const before = ui.requests.filter(r => r.url.endsWith("/courses/" + course.id)).length;
    await openManage(ui, enrollment.id);
    await press(ui, "Revocar matrícula");
    await press(ui, "Confirmar revocación");
    const busy = manageButton(ui, "Revocando…")!;
    assert.equal(busy.disabled, true);
    await ui.settle(() => busy.click());
    await escapeManage(ui);
    assert.ok(isManaging(ui), "a running revocation cannot be dismissed");
    assert.equal(manageDialog(ui).getAttribute("aria-busy"), "true");
    await ui.settle(() => pending.resolve(new Response()));
    assert.equal(patches(ui).length, 1, "duplicate clicks never send a second write");
    assert.ok(patches(ui)[0].url.endsWith(`/enrollments/${enrollment.id}`));
    assert.equal(isManaging(ui), false);
    assert.equal(toast(ui), "Se revocó la matrícula de María Pérez como Estudiante. Quedó en el Historial.");
    assert.equal(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`), null);
    assert.ok(ui.doc.querySelector(`[data-enrollment-id="${sibling.id}"]`), "the assistant enrollment stays active");
    assert.ok(ui.doc.activeElement === ui.doc.querySelector(".participants-table"), "focus falls back to the roster");
    await ui.click("Historial");
    assert.match(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`)!.textContent!, /Histórica/);
    assert.equal(ui.requests.filter(r => r.url.endsWith("/courses/" + course.id)).length, before, "the page is not reloaded");
  } finally { await ui.close(); }
});

test("the last active teacher cannot lose the role, from the field or the revocation step", async () => {
  const { ui } = await owner([teacher], () => Response.json({ code: "LAST_SECTION_TEACHER" }, { status: 409 }));
  try {
    await openManage(ui, teacher.id);
    await chooseRole(ui, "assistant");
    await save(ui);
    assert.match(manageDialog(ui).querySelector(".field-error")!.textContent!, /al menos un docente activo/);
    await press(ui, "Revocar matrícula");
    assert.equal(manageDialog(ui).querySelector('[role="alert"]'), null, "the confirmation starts without the previous error");
    assert.match(manageDialog(ui).querySelector(".management-warning")!.textContent!, /incluida su administración/);
    await press(ui, "Confirmar revocación");
    assert.match(manageDialog(ui).querySelector('[role="alert"]')!.textContent!, /al menos un docente activo/);
    assert.ok(rowTrigger(ui, teacher.id), "the teacher row stays active");
  } finally { await ui.close(); }
});

test("management stays inside the actor's institution", async () => {
  const { ui } = await owner([enrollment], undefined, "owner", "utfsm");
  try {
    await openManage(ui, enrollment.id);
    await chooseRole(ui, "assistant");
    await save(ui);
    assert.ok(ui.requests.length > 0);
    assert.ok(ui.requests.filter(r => r.url.includes("/institution/")).every(r => r.url.includes("/institution/utfsm/")));
    assert.equal(ui.requests.some(r => r.url.includes("/institution/uc/")), false);
  } finally { await ui.close(); }
});
