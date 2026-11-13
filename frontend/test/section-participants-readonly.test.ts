import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { capabilities } from "../src/lib/courses/capabilities.ts";
import { createApiClient } from "../src/lib/api/client.ts";
import { listSectionParticipants, participantList } from "../src/lib/api/participants.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, otherCourse, section, otherSection, id, user, deferred } from "./fixtures/courses.ts";

const self = user("student");
const teacher = { userId: id(50), name: "Rosa Docente", roles: ["teacher"] };
const assistant = { userId: id(51), name: "Pablo Ayudante", roles: ["assistant", "student"] };
const peer = { userId: id(52), name: "Lucía Compañera", roles: ["student"] };
const me = { userId: self.id, name: "Ana", roles: ["student"] };
const roster = [teacher, assistant, peer, me];
const otherRoster = [{ userId: id(60), name: "Tomás Sección Dos", roles: ["student"] }];
/** Student in sections 1 and 2 of the course. */
const twoSections = { ...self, sectionMemberships: [...self.sectionMemberships, { courseId: course.id, sectionId: otherSection.id, sectionCode: otherSection.code, role: "student" as const }] };
const participants = (r: Request) => r.url.endsWith("/participants");
function reply(people: Record<string, unknown[]> = { [section.id]: roster, [otherSection.id]: otherRoster }, items = [section]) {
  return (r: Request) => {
    if (participants(r)) {
      const sectionId = Object.keys(people).find(key => r.url.includes(`/sections/${key}/`));
      return sectionId ? Response.json({ items: people[sectionId] }) : Response.json({}, { status: 404 });
    }
    if (r.url.endsWith("/sections")) return Response.json({ items });
    return Response.json(course);
  };
}
const rows = (doc: Document) => [...doc.querySelectorAll(".participants-readonly tbody tr")].map(tr =>
  [tr.querySelector("th")!.textContent, [...tr.querySelectorAll(".participant-roles li")].map(li => li.textContent)]);
const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

test("read capability is separate: enrollment grants viewParticipants without widening administration", () => {
  for (const profile of ["student", "assistant"]) {
    const access = capabilities(user(profile), course);
    assert.equal(access.viewParticipants, true, profile);
    for (const admin of ["sections", "manage", "configure", "teachers", "search"] as const) assert.equal(access[admin], false, `${profile} ${admin}`);
    assert.equal(capabilities(user(profile), course, section).manage, false);
  }
  for (const profile of ["teacher", "owner", "multi"]) assert.equal(capabilities(user(profile), course).viewParticipants, true, profile);
  // No enrollment, another course or an inactive institution never read the roster.
  assert.equal(capabilities(user("super"), course).viewParticipants, false);
  assert.equal(capabilities(user("student"), otherCourse).viewParticipants, false);
  const base = user("student");
  assert.equal(capabilities({ ...base, institutionMembership: { ...base.institutionMembership, active: false } }, course).viewParticipants, false);
  assert.equal(capabilities({ ...base, institutionMembership: { ...base.institutionMembership, institution: { ...base.institutionMembership.institution, active: false } } }, course).viewParticipants, false);
});

test("participant client keeps the minimal projection and rejects malformed rosters", async () => {
  const leaked = participantList({ items: [{ ...peer, email: "lucia@example.test", enrollmentId: id(70), active: false }] });
  assert.deepEqual(leaked, [peer]);
  for (const items of [[{ ...peer, roles: [] }], [{ ...peer, roles: ["admin"] }], [{ ...peer, roles: ["student", "student"] }], [peer, peer], [{ ...peer, userId: "x" }], [{ ...peer, name: " " }]])
    assert.throws(() => participantList({ items }), `${JSON.stringify(items)}`);
  const requests: Request[] = [];
  const client = createApiClient({ baseUrl: "https://api.test", fetch: async input => { requests.push(input as Request); return Response.json({ items: [peer] }); } });
  assert.deepEqual(await listSectionParticipants(client, "utfsm", section.id), [peer]);
  assert.equal(new URL(requests[0].url).pathname, `/api/v1/institution/utfsm/sections/${section.id}/participants`);
  await assert.rejects(listSectionParticipants(client, "uc", "not-a-uuid"));
  await assert.rejects(listSectionParticipants(client, "../uc", section.id));
  assert.equal(requests.length, 1, "invalid tenant or section ids never reach the network");
  for (const status of [403, 404, 503]) {
    const bad = createApiClient({ baseUrl: "https://api.test", fetch: async () => Response.json({}, { status }) });
    await assert.rejects(listSectionParticipants(bad, "uc", section.id));
  }
});

for (const profile of ["student", "assistant"]) test(`${profile} reads one roster of their section, read-only and minimal`, async () => {
  const actor = profile === "student" ? self : user("assistant");
  const ui = await mount(h(CourseDetail, { courseId: course.id }), reply(), actor);
  try {
    const text = ui.doc.querySelector("main, #root")!.textContent!;
    assert.deepEqual(rows(ui.doc), [
      ["Rosa Docente", ["Docente"]], ["Pablo Ayudante", ["Ayudante", "Estudiante"]], ["Lucía Compañera", ["Estudiante"]],
      ["AnaTú", ["Estudiante"]],
    ], "API order kept; one row per person with every role");
    assert.equal(ui.doc.querySelectorAll(".participant-self").length, 1, "the current user is marked once");
    // Single section: named once, no picker.
    assert.equal(ui.doc.querySelector("select"), null);
    assert.equal(ui.doc.querySelector(".section-current")?.textContent, "Sección 1");
    assert.equal(ui.doc.querySelectorAll("h1").length, 1);
    assert.deepEqual([...ui.doc.querySelectorAll("h2")].map(h => h.textContent), ["Participantes"]);
    assert.deepEqual([...ui.doc.querySelectorAll(".participants-readonly thead th")].map(th => [th.textContent, th.getAttribute("scope")]), [["Persona", "col"], ["Rol", "col"]]);
    assert.equal(ui.doc.querySelector(".participants-readonly caption")?.textContent, "Participantes de la sección 1");
    // Keyboard: the scrollable roster is a focusable, named region.
    const region = ui.doc.querySelector(".participants-readonly [role=region]")!;
    assert.equal(region.getAttribute("tabindex"), "0");
    assert.equal(region.getAttribute("aria-label"), "Participantes de la sección 1");
    // No management, contact data, history or identifiers.
    // The only controls are the four local role toggles; nothing submits, edits or opens a dialog.
    assert.equal(ui.doc.querySelectorAll(".participants-readonly :is(form, dialog, input, details, [role=dialog])").length, 0);
    assert.deepEqual([...ui.doc.querySelectorAll<HTMLButtonElement>(".participants-readonly button")].map(b => [b.textContent, b.type, !!b.closest(".participant-filter")]),
      ["Todos", "Docentes", "Ayudantes", "Estudiantes"].map(label => [label, "button", true]));
    assert.doesNotMatch(text, /@|Histórica|Revocar|Gestionar|Asignar|Configurar|Crear sección|Capacidad|Cupos de estudiantes/);
    assert.doesNotMatch(text, uuid);
    // Only the selected section's roster is read, never the administrative lists.
    assert.deepEqual(ui.requests.filter(participants).map(r => new URL(r.url).pathname), [`/api/v1/institution/uc/sections/${section.id}/participants`]);
    assert.ok(ui.requests.filter(r => !r.url.endsWith("/login")).every(r => r.method === "GET"), "the read-only view never writes");
    assert.ok(ui.requests.every(r => !/\/enrollments|\/users|\/memberships/.test(r.url)));
    // The tab is reachable and marked active like the other course tabs.
    const tab = ui.doc.querySelector<HTMLAnchorElement>(`nav[aria-label="Curso"] a[href="/courses/${course.id}/sections"]`)!;
    assert.equal(tab.getAttribute("aria-current"), "page");
  } finally { await ui.close(); }
});

test("several sections: labelled picker lists only own sections and a stale roster never replaces the selection", async () => {
  const first = deferred<Response>();
  const base = reply(undefined, [section, otherSection]);
  let held = false;
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => participants(r) && r.url.includes(section.id) && !held ? (held = true, first.promise) : base(r), twoSections);
  try {
    const picker = ui.doc.querySelector<HTMLSelectElement>('select[name="participantSection"]')!;
    assert.equal(ui.doc.querySelector(`label[for="${picker.id}"]`)?.textContent, "Sección");
    assert.deepEqual([...picker.options].map(o => o.textContent), ["Sección 1", "Sección 2"]);
    assert.ok(ui.doc.querySelector('.participants-readonly [role="status"]')?.textContent?.includes("Cargando participantes"), "contextual skeleton while loading");
    assert.equal(ui.doc.querySelector(".participants-readonly caption")?.textContent, "Participantes de la sección 1");
    await ui.select('select[name="participantSection"]', otherSection.id);
    await ui.settle(() => first.resolve(Response.json({ items: roster })));
    assert.deepEqual(rows(ui.doc), [["Tomás Sección Dos", ["Estudiante"]]]);
    assert.doesNotMatch(ui.doc.body.textContent!, /Rosa Docente/);
    await ui.select('select[name="participantSection"]', section.id);
    assert.equal(rows(ui.doc).length, 4);
    assert.equal(ui.requests.filter(participants).length, 3, "one request per selection, never all sections at once");
  } finally { await ui.close(); }
});

test("loading, empty and recoverable error states stay inside the roster", async () => {
  let fail = true;
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => participants(r) ? fail ? Response.json({}, { status: 503 }) : Response.json({ items: [] }) : reply()(r), self);
  try {
    const alert = ui.doc.querySelector('.participants-readonly [role="alert"]')!;
    assert.ok(alert, "error announced");
    assert.equal(alert.querySelector("h3")?.textContent, "No se pudo completar la solicitud");
    assert.ok(ui.doc.querySelector(".section-current"), "toolbar stays stable");
    fail = false;
    await ui.click("Reintentar");
    assert.equal(ui.doc.querySelector('.participants-readonly [role="alert"]'), null);
    assert.equal(ui.doc.querySelector(".participants-readonly h3")?.textContent, "Sin participantes activos");
  } finally { await ui.close(); }
});

test("revoked access clears protected data and falls back to the sections still held", async () => {
  let revoked = false;
  const base = reply(undefined, [section, otherSection]);
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => revoked && participants(r) && r.url.includes(otherSection.id) ? Response.json({}, { status: 404 }) : base(r), twoSections);
  try {
    await ui.select('select[name="participantSection"]', otherSection.id);
    assert.deepEqual(rows(ui.doc), [["Tomás Sección Dos", ["Estudiante"]]]);
    // The enrollment in section 2 is revoked server-side; the next read fails and the context refreshes.
    revoked = true;
    ui.setActor("student");
    await ui.select('select[name="participantSection"]', section.id);
    await ui.select('select[name="participantSection"]', otherSection.id);
    await ui.settle(() => undefined);
    assert.doesNotMatch(ui.doc.body.textContent!, /Tomás Sección Dos/);
    assert.equal(ui.doc.querySelector("select"), null, "revoked section leaves the picker");
    assert.equal(ui.doc.querySelector(".section-current")?.textContent, "Sección 1");
    assert.equal(rows(ui.doc).length, 4);
  } finally { await ui.close(); }
});

test("access-denied error reveals no roster data and other tenants are never requested", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => participants(r) ? Response.json({}, { status: 403 }) : reply()(r), self);
  try {
    assert.equal(rows(ui.doc).length, 0);
    assert.doesNotMatch(ui.doc.body.textContent!, /Rosa Docente|Pablo Ayudante/);
    assert.doesNotMatch(ui.doc.body.textContent!, uuid);
    assert.equal(ui.doc.querySelector('.participants-readonly [role="alert"] h3')?.textContent, "Permisos insuficientes");
    assert.equal(ui.doc.querySelector(".participants-readonly button"), null, "403 is not retryable");
  } finally { await ui.close(); }
  const utfsm = await mount(h(CourseDetail, { courseId: course.id }), reply(), user("student", "utfsm"), "utfsm");
  try {
    assert.ok(utfsm.requests.filter(participants).length > 0);
    assert.ok(utfsm.requests.filter(r => r.url.includes("/institution/")).every(r => r.url.includes("/institution/utfsm/")));
  } finally { await utfsm.close(); }
});

test("a session switch never keeps the previous user's roster", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), reply(), self);
  try {
    assert.equal(rows(ui.doc).length, 4);
    await ui.actor("super");
    assert.doesNotMatch(ui.doc.body.textContent!, /Rosa Docente|Lucía Compañera/);
    assert.equal(ui.doc.querySelector(`nav[aria-label="Curso"] a[href$="/sections"]`), null);
  } finally { await ui.close(); }
});

const pressed = (doc: Document) => [...doc.querySelectorAll('.participant-filter button[aria-pressed="true"]')].map(b => b.textContent);
const names = (doc: Document) => rows(doc).map(([name]) => name);

test("role filter: four local filters keep API order, list multi-role people once and never refetch", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), reply(), self);
  try {
    const group = ui.doc.querySelector('.participant-filter[role="group"]')!;
    assert.equal(group.getAttribute("aria-label"), "Filtrar por rol");
    assert.deepEqual([...group.querySelectorAll<HTMLButtonElement>("button")].map(b => [b.textContent, b.type]), [["Todos", "button"], ["Docentes", "button"], ["Ayudantes", "button"], ["Estudiantes", "button"]]);
    assert.deepEqual(pressed(ui.doc), ["Todos"], "«Todos» by default");
    const requests = ui.requests.length;
    for (const [label, expected] of [
      ["Docentes", ["Rosa Docente"]],
      ["Ayudantes", ["Pablo Ayudante"]],
      ["Estudiantes", ["Pablo Ayudante", "Lucía Compañera", "AnaTú"]],
      ["Todos", ["Rosa Docente", "Pablo Ayudante", "Lucía Compañera", "AnaTú"]],
    ] as const) {
      await ui.click(label);
      assert.deepEqual(pressed(ui.doc), [label]);
      assert.deepEqual(names(ui.doc), expected, label);
      assert.equal(new Set(names(ui.doc)).size, expected.length, "nobody is duplicated");
      assert.equal(ui.doc.querySelector('.participant-filter-bar [role="status"]')?.textContent, `${expected.length} ${expected.length === 1 ? "participante" : "participantes"}`);
      assert.equal(ui.doc.querySelector(".participants-readonly caption")?.textContent, `Participantes de la sección 1${label === "Todos" ? "" : ` · ${label}`}`);
    }
    // The multi-role person keeps every role chip under any filter.
    await ui.click("Ayudantes");
    assert.deepEqual(rows(ui.doc), [["Pablo Ayudante", ["Ayudante", "Estudiante"]]]);
    assert.equal(ui.requests.length, requests, "filtering is local: no request, no backend parameter");
    assert.doesNotMatch(ui.doc.body.textContent!, /@/);
  } finally { await ui.close(); }
});

test("role filter: a role with nobody shows a discreet empty state instead of the table", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), reply({ [section.id]: [teacher, peer] }), self);
  try {
    await ui.click("Ayudantes");
    assert.equal(ui.doc.querySelector(".participants-readonly table"), null);
    assert.equal(ui.doc.querySelector(".participants-readonly h3")?.textContent, "Sin ayudantes en esta sección");
    assert.equal(ui.doc.querySelector('.participant-filter-bar [role="status"]')?.textContent, "0 participantes");
    assert.ok(ui.doc.querySelector(".participant-filter"), "the filter stays so the user can go back");
    await ui.click("Todos");
    assert.deepEqual(names(ui.doc), ["Rosa Docente", "Lucía Compañera"]);
  } finally { await ui.close(); }
  // A section without anyone shows the existing empty state and no filter at all.
  const empty = await mount(h(CourseDetail, { courseId: course.id }), reply({ [section.id]: [] }), self);
  try {
    assert.equal(empty.doc.querySelector(".participant-filter"), null);
    assert.equal(empty.doc.querySelector(".participants-readonly h3")?.textContent, "Sin participantes activos");
  } finally { await empty.close(); }
});

test("role filter: changing section returns to «Todos»", async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), reply(undefined, [section, otherSection]), twoSections);
  try {
    await ui.click("Docentes");
    assert.deepEqual(names(ui.doc), ["Rosa Docente"]);
    await ui.select('select[name="participantSection"]', otherSection.id);
    assert.deepEqual(pressed(ui.doc), ["Todos"]);
    assert.deepEqual(names(ui.doc), ["Tomás Sección Dos"]);
    await ui.select('select[name="participantSection"]', section.id);
    assert.deepEqual(pressed(ui.doc), ["Todos"], "returning does not restore the old filter");
    assert.equal(names(ui.doc).length, 4);
  } finally { await ui.close(); }
});
