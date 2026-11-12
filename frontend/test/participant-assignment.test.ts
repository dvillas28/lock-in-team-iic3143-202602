import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { SEARCH_DEBOUNCE_MS } from "../src/components/courses/enrollment-form.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, otherSection, enrollment, person, id, page, deferred } from "./fixtures/courses.ts";
import { assign, assignDialog, confirm, escape, fieldErrors, isOpen, modalRuntime, open, pick, results, role, roleSelect, searchInput, submitButton, toast, trigger, type } from "./fixtures/assignment.ts";

const luis = { id: id(5), name: "Luis Soto", email: "luis@example.test", active: true };
type Reply = (r: Request) => Response | Promise<Response> | undefined;
/** Course, sections and roster; `override` answers first (search, writes, failures). */
function server(override: Reply = () => undefined, roster: unknown[] = [], limited: Omit<typeof section, "capacity"> & { capacity: number | null } = section) {
  return async (r: Request) => {
    const own = await override(r);
    if (own) return own;
    if (r.url.endsWith("/sections")) return Response.json({ items: [limited, otherSection] });
    if (r.url.includes("/enrollments")) return Response.json(page(roster));
    if (r.url.includes("/users")) return Response.json(page([person, luis]));
    if (r.url.includes("/sections/")) return Response.json(r.url.endsWith(otherSection.id) ? otherSection : limited);
    return Response.json(course);
  };
}
const posts = (ui: Awaited<ReturnType<typeof mount>>) => ui.requests.filter(r => r.method === "POST" && r.url.includes("/enrollments"));
const rosterReads = (ui: Awaited<ReturnType<typeof mount>>) => ui.requests.filter(r => r.method === "GET" && r.url.includes("/enrollments")).length;

test("«Asignar participante» sits in the roster heading, opens one modal with focus in the search and Estudiante by default", async () => {
  for (const profile of ["owner", "teacher"]) {
    const ui = await mount(h(CourseDetail, { courseId: course.id }), server(), profile);
    try {
      modalRuntime(ui);
      const button = trigger(ui);
      assert.equal(button.textContent, "Asignar participante");
      assert.ok(button.classList.contains("btn-primary") && button.querySelector("svg"), "visible primary action with its icon");
      assert.equal(button.closest(".participants-heading")!.querySelector("h2")!.textContent, "Participantes");
      assert.equal(ui.doc.querySelector("details summary"), null, "the old disclosure is gone");
      await open(ui);
      const dialog = assignDialog(ui);
      assert.ok(isOpen(ui));
      assert.deepEqual([...dialog.querySelectorAll("h2,h3")].map(e => e.textContent), ["Asignar participante"], "one title");
      assert.ok(dialog.querySelector('button[aria-label="Cerrar"]'));
      await ui.settle(() => {});
      assert.equal(ui.doc.activeElement, searchInput(ui), "focus starts in the search");
      assert.equal(roleSelect(ui).value, "student");
      assert.deepEqual([...roleSelect(ui).options].map(o => o.value), profile === "owner" ? ["student", "assistant", "teacher"] : ["student", "assistant"],
        "only the owner can assign teachers");
      assert.deepEqual([...dialog.querySelectorAll(".dialog-actions button")].map(b => b.textContent), ["Cancelar", "Asignar participante"]);
      await ui.settle(() => [...dialog.querySelectorAll("button")].find(b => b.textContent === "Cancelar")!.click());
      assert.equal(isOpen(ui), false, "a clean form closes at once");
      assert.equal(ui.doc.activeElement, button, "focus returns to the trigger");
      assert.equal(posts(ui).length, 0);
    } finally { await ui.close(); }
  }
});

test("search, select, assign: one POST, modal closes, roster reloads in place, toast and focus back on the trigger", async () => {
  let rows: unknown[] = [];
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
    if (r.method === "POST") { rows = [{ ...enrollment, user: luis, role: "assistant" }]; return Response.json(rows[0], { status: 201 }); }
    if (r.url.includes("/enrollments")) return Response.json(page(rows));
  }), "teacher");
  try {
    modalRuntime(ui);
    const reads = rosterReads(ui);
    await open(ui); await type(ui, "soto");
    assert.equal(new URL(ui.requests.findLast(r => r.url.includes("/users"))!.url).searchParams.get("search"), "soto");
    await pick(ui, "Luis Soto");
    const chosen = ui.doc.querySelector(".assignment-selected")!;
    assert.match(chosen.textContent!, /Luis Soto.*luis@example\.test/, "the chosen person is identified");
    assert.equal(ui.doc.activeElement, roleSelect(ui), "next step takes the focus");
    await role(ui, "assistant"); await confirm(ui);
    assert.deepEqual(await posts(ui)[0].json(), { userId: luis.id, role: "assistant" });
    assert.equal(isOpen(ui), false);
    assert.equal(toast(ui), "Luis Soto se asignó como Ayudante.");
    assert.equal(rosterReads(ui), reads + 1, "roster refreshed without reloading the page");
    assert.ok(ui.doc.querySelector(`[data-enrollment-id="${enrollment.id}"]`));
    assert.equal(ui.doc.activeElement, trigger(ui));
    assert.doesNotMatch(ui.doc.querySelector('section[aria-label="Participantes"]')!.textContent!, /Matrícula confirmada/, "no banner pushes the table");
    await open(ui);
    assert.equal(searchInput(ui).value, "", "a fresh form on reopening");
  } finally { await ui.close(); }
});

test("no results and failed searches explain themselves; a failure keeps the form usable and retries in place", async () => {
  let fail: number = 503;
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
    if (!r.url.includes("/users")) return;
    if (new URL(r.url).searchParams.get("search") === "nadie") return Response.json(page([]));
    if (fail) return Response.json({}, { status: fail });
  }), "teacher");
  try {
    modalRuntime(ui); await open(ui);
    await type(ui, "nadie");
    assert.match(assignDialog(ui).textContent!, /No hay personas activas que coincidan con «nadie»/);
    await type(ui, "maría");
    const alert = assignDialog(ui).querySelector('.assignment-results [role="alert"]')!;
    assert.ok(alert, "search error is announced next to the results");
    assert.doesNotMatch(alert.textContent!, /Sin coincidencias|No hay personas/, "an error is not an empty result");
    assert.equal(searchInput(ui).disabled, false); assert.equal(roleSelect(ui).disabled, false);
    fail = 0;
    await ui.click("Reintentar búsqueda");
    assert.equal(results(ui).length, 2);
    fail = 404; await type(ui, "otra");
    assert.match(assignDialog(ui).textContent!, /no está disponible/, "404 is unavailable, not empty");
  } finally { await ui.close(); }
});

test("typing searches after a pause, short or blank input stays local and older responses never win", async () => {
  const slow = deferred<Response>();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
    if (r.url.includes("/users") && new URL(r.url).searchParams.get("search") === "vieja") return slow.promise;
  }), "teacher");
  const searches = () => ui.requests.filter(r => r.url.includes("/users")).length;
  try {
    modalRuntime(ui); await open(ui);
    await type(ui, "m", false); await sleep(SEARCH_DEBOUNCE_MS + 50); await ui.settle(() => {});
    assert.equal(searches(), 0, "one character waits for more");
    await type(ui, "   ");
    assert.equal(searches(), 0, "blank never reaches the server");
    await type(ui, "mar", false);
    assert.equal(searches(), 0, "debounced");
    await sleep(SEARCH_DEBOUNCE_MS + 50); await ui.settle(() => {});
    assert.equal(searches(), 1);
    await type(ui, "vieja"); await type(ui, "nueva");
    await ui.settle(() => slow.resolve(Response.json(page([{ ...person, name: "Respuesta vieja" }]))));
    assert.equal(results(ui).some(b => b.textContent!.includes("Respuesta vieja")), false);
    assert.equal(results(ui).length, 2);
  } finally { await ui.close(); }
});

test("pagination appends without duplicates, keeps the opaque cursor and the arrow key reaches the results", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
    if (!r.url.includes("/users")) return;
    return Response.json(new URL(r.url).searchParams.has("cursor") ? page([luis, { ...person, id: id(6), name: "Inés Rojas", email: "ines@example.test", active: false }]) : page([person, luis], "opaque+/="));
  }), "teacher");
  try {
    modalRuntime(ui); await open(ui); await type(ui, "a");
    await ui.click("Mostrar más personas");
    assert.equal(new URL(ui.requests.findLast(r => r.url.includes("cursor="))!.url).searchParams.get("cursor"), "opaque+/=");
    assert.deepEqual(results(ui).map(b => b.querySelector("strong")!.textContent), ["María Pérez", "Luis Soto", "Inés Rojas"], "each person once");
    const inactive = results(ui)[2];
    assert.equal(inactive.disabled, true, "inactive accounts cannot be chosen");
    assert.match(inactive.getAttribute("aria-label")!, /cuenta inactiva/);
    await ui.settle(() => searchInput(ui).dispatchEvent(new ui.dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })));
    assert.equal(ui.doc.activeElement, results(ui)[0]);
  } finally { await ui.close(); }
});

test("confirming without a person, or with a role the person already holds, explains it next to the field and writes nothing", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(undefined, [enrollment]), "teacher");
  try {
    modalRuntime(ui); await open(ui);
    await confirm(ui);
    assert.deepEqual(fieldErrors(ui), ["Busca y selecciona a la persona que quieres asignar."]);
    assert.equal(searchInput(ui).getAttribute("aria-invalid"), "true");
    await type(ui, "pérez");
    assert.match(results(ui)[0].textContent!, /Estudiante/, "known roles are flagged in the results");
    await pick(ui, "María Pérez"); await confirm(ui);
    assert.deepEqual(fieldErrors(ui), ["María Pérez ya tiene una matrícula activa como Estudiante. Elige otro rol."]);
    assert.equal(roleSelect(ui).getAttribute("aria-invalid"), "true");
    assert.equal(posts(ui).length, 0);
    await role(ui, "assistant");
    assert.deepEqual(fieldErrors(ui), [], "changing the role clears the error");
  } finally { await ui.close(); }
});

test("a full section keeps the modal, the person and the role; the capacity error sits by the role, once, without a toast", async () => {
  for (const profile of ["owner", "teacher"]) {
    const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
      if (r.method === "POST") return Response.json({ code: "SECTION_FULL", detail: "PRIVATE" }, { status: 409 });
    }, [], { ...section, capacity: 2 }), profile);
    try {
      modalRuntime(ui); await open(ui);
      assert.match(assignDialog(ui).textContent!, /admite hasta 2 estudiantes/);
      await role(ui, "assistant");
      assert.match(assignDialog(ui).textContent!, /no ocupan cupos/, "staff never consume seats");
      await role(ui, "student");
      await type(ui, "soto"); await pick(ui, "Luis Soto"); await confirm(ui);
      assert.ok(isOpen(ui));
      const errors = fieldErrors(ui);
      assert.equal(errors.length, 1);
      assert.match(errors[0]!, /no tiene cupos de estudiantes disponibles/);
      assert.match(errors[0]!, profile === "owner" ? /Configurar sección/ : /propietario del curso/);
      assert.equal(ui.doc.querySelectorAll(`dialog [role="alert"]`).length, 1, "announced once");
      assert.doesNotMatch(ui.doc.body.textContent!, /PRIVATE/);
      assert.match(ui.doc.querySelector(".assignment-selected")!.textContent!, /Luis Soto/);
      assert.equal(roleSelect(ui).value, "student");
      assert.equal(ui.doc.activeElement, roleSelect(ui));
      assert.equal(toast(ui), null);
      await role(ui, "assistant");
      assert.deepEqual(fieldErrors(ui), []);
    } finally { await ui.close(); }
  }
});

test("an assignment that was already active is reported as such, without a second enrollment", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
    if (r.method === "POST") return Response.json({ ...enrollment, user: luis }, { status: 200 });
  }), "teacher");
  try {
    modalRuntime(ui); await assign(ui, "soto", "Luis Soto");
    assert.equal(isOpen(ui), false);
    assert.equal(toast(ui), "La matrícula de Luis Soto como Estudiante ya estaba activa.");
  } finally { await ui.close(); }
});

test("a pending assignment blocks a second submit, Escape and Cancelar; the button reports progress", async () => {
  const pending = deferred<Response>();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => r.method === "POST" ? pending.promise : undefined), "teacher");
  try {
    modalRuntime(ui); await assign(ui, "soto", "Luis Soto");
    assert.equal(submitButton(ui).textContent, "Asignando…");
    assert.equal(submitButton(ui).disabled, true);
    await confirm(ui); await escape(ui);
    assert.ok(isOpen(ui), "Escape waits for the write");
    assert.equal([...assignDialog(ui).querySelectorAll("button")].find(b => b.textContent === "Cancelar")!.disabled, true);
    assert.equal(posts(ui).length, 1, "no repeated submit");
    await ui.settle(() => pending.resolve(Response.json({ ...enrollment, user: luis }, { status: 201 })));
    assert.equal(isOpen(ui), false);
  } finally { await ui.close(); }
});

test("Escape and the close button protect a chosen person; a typed search alone closes at once", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(), "teacher");
  try {
    modalRuntime(ui); await open(ui); await type(ui, "soto");
    await escape(ui);
    assert.equal(isOpen(ui), false, "a search is not a change worth confirming");
    await open(ui); await type(ui, "soto"); await pick(ui, "Luis Soto");
    await escape(ui);
    assert.ok(isOpen(ui));
    assert.match(assignDialog(ui).querySelector('.discard-confirm[role="alert"]')!.textContent!, /cambios sin guardar/);
    assert.equal(ui.doc.activeElement?.textContent, "Seguir editando");
    await ui.click("Seguir editando");
    assert.match(ui.doc.querySelector(".assignment-selected")!.textContent!, /Luis Soto/, "keeps the person");
    await ui.settle(() => assignDialog(ui).querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')!.click());
    await ui.click("Descartar cambios");
    assert.equal(isOpen(ui), false);
    assert.equal(ui.doc.activeElement, trigger(ui));
    assert.equal(posts(ui).length, 0);
  } finally { await ui.close(); }
});

test("«Cambiar» returns to the same results with focus in the search", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(), "teacher");
  try {
    modalRuntime(ui); await open(ui); await type(ui, "a"); await pick(ui, "Luis Soto");
    assert.equal(searchInput(ui).closest("[hidden]") !== null, true, "results give way to the chosen person");
    await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>(".assignment-selected button")!.click());
    assert.equal(ui.doc.querySelector(".assignment-selected"), null);
    assert.equal(searchInput(ui).value, "a");
    assert.equal(results(ui).length, 2);
    await ui.settle(() => {});
    assert.equal(ui.doc.activeElement, searchInput(ui));
  } finally { await ui.close(); }
});

test("the owner without a teacher enrollment searches people instead of typing a UUID", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => r.method === "POST" ? Response.json({ ...enrollment, user: luis, role: "teacher" }, { status: 201 }) : undefined), "owner");
  try {
    modalRuntime(ui);
    assert.equal(ui.doc.querySelector('input[name="userId"]'), null);
    await assign(ui, "soto", "Luis Soto", "teacher");
    assert.deepEqual(await posts(ui)[0].json(), { userId: luis.id, role: "teacher" });
    assert.ok(posts(ui)[0].url.includes(`/institution/uc/sections/${section.id}/enrollments`));
    assert.equal(toast(ui), "Luis Soto se asignó como Docente.");
  } finally { await ui.close(); }
});

test("students, assistants and other tenants never get the assignment action", async () => {
  for (const profile of ["student", "assistant", "super"]) {
    const ui = await mount(h(CourseDetail, { courseId: course.id }), server(), profile);
    try {
      assert.equal(ui.doc.querySelector(".participants-heading"), null, profile);
      assert.equal(ui.requests.some(r => r.url.includes("/users")), false);
    } finally { await ui.close(); }
  }
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(), "teacher", "utfsm");
  try {
    modalRuntime(ui); await open(ui); await type(ui, "soto");
    assert.ok(ui.requests.filter(r => r.url.includes("/users")).every(r => r.url.includes("/institution/utfsm/")), "searches stay in the active tenant");
  } finally { await ui.close(); }
});

test("rejected or uncertain writes keep the modal, the person and the role; an uncertain one is never retried", async () => {
  for (const status of [422, 503]) {
    const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => r.method === "POST" ? Response.json({}, { status }) : undefined), "teacher");
    try {
      modalRuntime(ui); await assign(ui, "soto", "Luis Soto", "assistant");
      assert.ok(isOpen(ui), String(status));
      assert.match(ui.doc.querySelector(".assignment-selected")!.textContent!, /Luis Soto/);
      assert.equal(roleSelect(ui).value, "assistant");
      assert.equal(ui.doc.querySelectorAll('dialog [role="alert"]').length, 1, "one message");
      if (status === 503) {
        assert.match(assignDialog(ui).textContent!, /incierto/i);
        assert.equal(submitButton(ui).disabled, true);
        await confirm(ui);
        assert.equal(posts(ui).length, 1);
      }
      assert.equal(toast(ui), null);
    } finally { await ui.close(); }
  }
});

test("pressing Enter on the same text searches again from the first page", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => r.url.includes("/users") ? Response.json(page([person], "next")) : undefined), "teacher");
  try {
    modalRuntime(ui); await open(ui); await type(ui, "maría");
    await ui.click("Mostrar más personas"); await type(ui, "maría");
    const searches = ui.requests.filter(r => r.url.includes("/users"));
    assert.equal(searches.length, 3);
    assert.equal(new URL(searches.at(-1)!.url).searchParams.has("cursor"), false);
  } finally { await ui.close(); }
});

test("the roster opens on active enrollments; Historial lists revoked ones read-only and an assignment returns to Activas", async () => {
  const revoked = { ...enrollment, id: id(31), role: "assistant" as const, active: false };
  let historical: unknown[] = [];
  let active: unknown[] = [enrollment];
  const ui = await mount(h(CourseDetail, { courseId: course.id }), server(r => {
    if (r.method === "POST") { active = [enrollment, { ...enrollment, id: id(32), user: luis }]; return Response.json(active[1], { status: 201 }); }
    if (!r.url.includes("/enrollments")) return undefined;
    const status = new URL(r.url).searchParams.get("status");
    return Response.json(status === "historical" ? page(historical) : page(active));
  }), "owner");
  try {
    modalRuntime(ui);
    const panel = () => ui.doc.querySelector('section[aria-label="Participantes"]')!;
    const views = () => [...panel().querySelectorAll<HTMLButtonElement>(".participants-views button")];
    const pressed = () => views().filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.textContent);
    const lastRoster = () => new URL(ui.requests.findLast(r => r.method === "GET" && r.url.includes("/enrollments"))!.url).searchParams;
    assert.deepEqual(views().map(b => b.textContent), ["Activas", "Historial"]);
    assert.deepEqual(pressed(), ["Activas"]);
    assert.equal(lastRoster().get("status"), "active", "the roster asks the backend for active enrollments only");
    assert.equal(panel().querySelector("caption")!.textContent, "Matrículas activas");
    // An empty history explains itself instead of showing an empty table.
    await ui.settle(() => views()[1].click());
    assert.deepEqual(pressed(), ["Historial"]);
    assert.equal(lastRoster().get("status"), "historical");
    assert.equal(lastRoster().get("cursor"), null, "a view switch starts from the first page");
    assert.match(panel().textContent!, /Sin historial/);
    // With history: read-only rows, explained once, never managed.
    historical = [revoked];
    await ui.settle(() => views()[0].click());
    await ui.settle(() => views()[1].click());
    const row = panel().querySelector(`[data-enrollment-id="${revoked.id}"]`)!;
    assert.match(row.textContent!, /Histórica/);
    assert.equal(row.querySelector("button"), null, "history is never managed");
    assert.equal(panel().querySelector(`[data-enrollment-id="${enrollment.id}"]`), null, "active rows stay in Activas");
    assert.equal(panel().querySelector("caption")!.textContent, "Matrículas históricas");
    assert.match(panel().textContent!, /se conservan como registro/i);
    // A new assignment is active, so the roster returns to Activas to show it.
    await assign(ui, "soto", "Luis Soto");
    assert.equal(posts(ui).length, 1);
    assert.deepEqual(pressed(), ["Activas"]);
    assert.equal(lastRoster().get("status"), "active");
    assert.ok(panel().querySelector(`[data-enrollment-id="${id(32)}"]`));
    assert.equal(ui.doc.activeElement, trigger(ui));
  } finally { await ui.close(); }
});
