import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { CourseRouteLoading } from "../src/components/courses/course-route-loading.tsx";
import { CourseGradebook } from "../src/components/gradebook/course-gradebook.tsx";
import { StudentGrades } from "../src/components/gradebook/student-grades.tsx";
import { CourseAudit } from "../src/components/audit/course-audit.tsx";
import { InstitutionUsers } from "../src/components/accounts/institution-users.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { mountAccount } from "./fixtures/account-ui.ts";
import { course, deferred, enrollment, page, section } from "./fixtures/courses.ts";
import { item, mine, reply as records } from "./fixtures/gradebook.ts";
import { auditPage } from "./fixtures/audit.ts";

const never = () => new Promise<Response>(() => {});
const path = (r: Request) => new URL(r.url).pathname;
const statuses = (doc: Document) => [...doc.querySelectorAll('[role="status"]')].map(e => e.textContent);
const shape = (doc: Document) => doc.querySelector(".academic-workspace")!.innerHTML.replace(/ style="[^"]*"/g, "");
const route = (pathname: string) => new JSDOM(renderToStaticMarkup(h(PathnameContext.Provider, { value: pathname }, h(CourseRouteLoading)))).window.document;
/** Holds the requests that `match` selects until `release`; everything else answers at once. */
function gate(match: (r: Request) => boolean, answer: (r: Request) => Response) {
  let open = deferred<void>();
  return {
    reply: async (r: Request) => { if (match(r)) await open.promise; return answer(r); },
    release() { open.resolve(); },
    hold() { open = deferred<void>(); },
  };
}
/** A rows skeleton keeps the real caption and header announced and hides only its placeholder body. */
function assertRows(scope: ParentNode, label: string, caption: string, headers: string[]) {
  const rows = scope.querySelector(".skeleton-rows")!;
  assert.ok(rows, label);
  assert.deepEqual([...rows.querySelectorAll('[role="status"]')].map(e => e.textContent), [label]);
  assert.equal(rows.querySelector("caption")?.textContent, caption);
  assert.equal(rows.querySelector("caption")!.closest('[aria-hidden="true"]'), null, "caption stays announced");
  for (const text of headers) assert.ok([...rows.querySelectorAll("thead th")].some(th => th.textContent!.startsWith(text)), text);
  const body = rows.querySelector("tbody")!;
  assert.equal(body.getAttribute("aria-hidden"), "true");
  assert.ok(body.querySelector(".skeleton"));
  for (const tr of body.querySelectorAll("tr")) assert.equal(tr.children.length, rows.querySelectorAll("thead th").length, `${label}: cells follow the header`);
  assert.equal(body.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(rows.querySelector("[tabindex]"), null, "no focusable placeholder scroller");
}
const generic = /Cargando contenido|Espera un momento/;

test("Secciones renders one neutral skeleton in the route and the page, the same for every role and tenant", async () => {
  const fallback = route(`/courses/${course.id}/sections`);
  assert.deepEqual([...fallback.querySelectorAll("h1")].map(e => e.textContent), ["Secciones y participantes"]);
  assert.deepEqual(statuses(fallback), ["Cargando secciones…"]);
  const shapes = new Set<string>();
  for (const [profile, slug] of [["student", "uc"], ["assistant", "uc"], ["teacher", "uc"], ["owner", "uc"], ["teacher", "utfsm"]]) {
    const ui = await mount(h(CourseDetail, { courseId: course.id }), never, profile, slug);
    try {
      // Static title for every role, as in Módulos, Quizzes and Tareas; only course data are shapes.
      assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), ["Secciones y participantes"]);
      assert.ok(ui.doc.querySelector("h1")!.closest('[aria-hidden="true"]') === null, "the title is announced");
      assert.deepEqual(statuses(ui.doc), ["Cargando secciones…"]);
      assert.equal(ui.doc.querySelector(".academic-workspace")!.querySelector("a, button, input, select, textarea, label, [tabindex], nav, details"), null);
      assert.doesNotMatch(ui.doc.body.textContent!, generic);
      shapes.add(shape(ui.doc));
    } finally { await ui.close(); }
  }
  assert.equal(shapes.size, 1);
  assert.equal([...shapes][0], shape(fallback), "route and page draw the same composition");
});

test("a managed section and its participants load under the real section bar and keep the roster header while paging", async () => {
  const detail = (r: Request) => /\/sections\/[^/]+$/.test(path(r));
  const roster = (r: Request) => r.url.includes("/enrollments");
  const sectionGate = gate(detail, () => Response.json(section));
  let cursor: string | null = "next";
  const rosterGate = gate(roster, r => Response.json(new URL(r.url).searchParams.has("cursor") ? page([{ ...enrollment, id: enrollment.id.replace(/0$/, "9") }]) : page([enrollment], cursor)));
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => detail(r) ? sectionGate.reply(r) : roster(r) ? rosterGate.reply(r) : r.url.endsWith("/sections") ? Response.json({ items: [section] }) : Response.json(course));
  try {
    assert.equal(ui.doc.querySelector("h1")?.textContent, "Secciones y participantes");
    assert.equal(ui.doc.querySelector(".section-toolbar .section-name")?.textContent, "Sección 1", "the section context is real");
    assert.equal(ui.doc.querySelector(".section-toolbar .skeleton-pill")?.getAttribute("aria-hidden"), "true", "only capacity waits");
    assert.deepEqual(statuses(ui.doc).filter(s => s!.startsWith("Cargando")), ["Cargando sección…"]);
    assert.equal(ui.doc.querySelector(".skeleton-region")!.querySelector("button, input, select, details, a"), null);
    await ui.settle(() => sectionGate.release());
    const panel = ui.doc.querySelector('section[aria-label="Participantes"]')!;
    assert.equal(panel.querySelector("h2")!.textContent, "Participantes");
    assertRows(panel, "Cargando participantes…", "Matrículas activas", ["Persona", "Rol", "Estado", "Acciones"]);
    assert.doesNotMatch(ui.doc.body.textContent!, generic);
    await ui.settle(() => rosterGate.release());
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region, .skeleton-rows"), null);
    rosterGate.hold(); cursor = null;
    await ui.click("Siguiente");
    assertRows(ui.doc.querySelector('section[aria-label="Participantes"]')!, "Cargando participantes…", "Matrículas activas", ["Persona", "Rol", "Estado", "Acciones"]);
    assert.ok([...ui.doc.querySelectorAll("button")].some(b => b.textContent === "Anterior"), "pagination stays");
    await ui.settle(() => rosterGate.release());
    assert.equal(ui.doc.querySelector(".skeleton-rows"), null);
  } finally { await ui.close(); }
});

test("the gradebook keeps known columns while rows load and on section changes; nothing role-specific is drawn early", async () => {
  const meta = (r: Request) => path(r).endsWith("/grade-items") || path(r).endsWith("/sections");
  const metaGate = gate(meta, records), rows = gate(r => path(r).endsWith("/gradebook"), records);
  const ui = await mount(h(CourseGradebook, { courseId: course.id }), r => meta(r) ? metaGate.reply(r) : rows.reply(r), "ownerTeacher");
  try {
    assert.equal(ui.doc.querySelector("h1")?.textContent, "Libro de notas");
    assert.ok(ui.doc.querySelector('nav[aria-label="Curso"]'), "real course tabs");
    assert.deepEqual(statuses(ui.doc), ["Cargando libro de notas…"]);
    const region = ui.doc.querySelector(".skeleton-region")!;
    assert.equal(region.querySelector("a, button, select, input, label, [tabindex]"), null);
    assert.doesNotMatch(ui.doc.body.textContent!, /Ponderaciones|Publicar|Corregir/);
    await ui.settle(() => metaGate.release());
    assert.ok(ui.doc.querySelector(".gradebook-toolbar select"), "the real section filter");
    assertRows(ui.doc, "Cargando resultados…", "Resultados por estudiante y sección histórica", ["Estudiante", "Sección histórica", item.title, "Promedio parcial", "Ponderación publicada"]);
    assert.ok(ui.doc.querySelector(".skeleton-rows .gradebook-table"), "real scroll geometry");
    assert.equal(ui.doc.querySelectorAll(".skeleton-rows tbody .skeleton-grade").length, 5 * 2, "one grade and the average per row");
    assert.equal(ui.doc.querySelector(".skeleton-rows")!.querySelector("button"), null, "no correction action");
    await ui.settle(() => rows.release());
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region, .skeleton-rows"), null);
    const header = ui.doc.querySelector(".gradebook-table thead")!.innerHTML;
    rows.hold();
    await ui.select(".gradebook-toolbar select", section.id);
    assert.equal(ui.doc.querySelector(".skeleton-rows thead")!.innerHTML, header, "same header while the section changes");
    assert.ok(ui.doc.querySelector('nav[aria-label="Páginas del libro"]'), "pagination stays");
    await ui.settle(() => rows.release());
    assert.equal(ui.doc.querySelector(".skeleton-rows"), null);
    assert.match(ui.doc.body.textContent!, /5.5/);
  } finally { await ui.close(); }
});

test("Mis notas draws the summary and table shapes without anticipating any result", async () => {
  const grades = gate(r => path(r).endsWith("/my-grades"), records);
  const ui = await mount(h(StudentGrades, { courseId: course.id }), grades.reply, "student");
  try {
    assert.equal(ui.doc.querySelector("h1")?.textContent, "Mis notas");
    assert.deepEqual(statuses(ui.doc), ["Cargando tus notas…"]);
    const region = ui.doc.querySelector(".skeleton-region")!;
    assert.ok(region.querySelector(".grade-summary .metric .skeleton"));
    assert.equal(region.querySelector("h2, th[scope], a, button, [tabindex]"), null);
    assert.equal(region.querySelector("caption")!.textContent, "", "the caption is a placeholder");
    assert.doesNotMatch(region.textContent!, /\d|Promedio|Pendiente/);
    await ui.settle(() => grades.release());
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
    assert.match(ui.doc.body.textContent!, new RegExp(String(mine.partialAverage)));
  } finally { await ui.close(); }
});

/** The audit timeline skeleton announces one status and hides day cards with no actionable rows. */
function assertTimeline(doc: Document) {
  const region = doc.querySelector('section[aria-label="Actividad del curso"] .skeleton-region')!;
  assert.ok(region, "timeline skeleton");
  assert.deepEqual([...region.querySelectorAll('[role="status"]')].map(e => e.textContent), ["Cargando actividad…"]);
  const content = region.querySelector(".skeleton-content")!;
  assert.equal(content.getAttribute("aria-hidden"), "true");
  assert.ok(content.querySelector(".audit-day .audit-row .skeleton"));
  assert.equal(content.querySelector("a, button, input, select, textarea, [tabindex]"), null);
}

test("audit keeps its filters and pager while a page loads", async () => {
  let next = true;
  const events = gate(r => path(r).endsWith("/audit-events"), () => Response.json({ ...auditPage, hasMore: next, nextCursor: next ? "next" : null }));
  const ui = await mount(h(CourseAudit, { courseId: course.id }), r => path(r).endsWith("/audit-events") ? events.reply(r) : records(r), "owner");
  try {
    assert.ok(ui.doc.querySelector('form[aria-label="Filtros de auditoría"]'));
    assertTimeline(ui.doc);
    await ui.settle(() => events.release());
    assert.equal(ui.doc.querySelector(".skeleton-region"), null);
    assert.ok(ui.doc.querySelector("button.audit-row"));
    events.hold(); next = false;
    await ui.click("Siguiente");
    assertTimeline(ui.doc);
    assert.ok(ui.doc.querySelector('nav[aria-label="Páginas de auditoría"]'));
    await ui.settle(() => events.release());
    assert.equal(ui.doc.querySelector(".skeleton-region"), null);
  } finally { await ui.close(); }
});

test("institution users keep their panels and announce invitations and members once each", async () => {
  const lists = gate(() => true, r => Response.json(path(r).endsWith("/memberships") ? { items: [], nextCursor: null } : { items: [] }));
  const ui = await mountAccount(h(InstitutionUsers), lists.reply);
  try {
    assert.equal(ui.doc.querySelector("h1")?.textContent, "Usuarios institucionales");
    assert.ok(ui.doc.querySelector('form[aria-label="Buscar miembros activos"]'));
    assert.deepEqual(statuses(ui.doc).filter(s => s!.startsWith("Cargando")), ["Cargando invitaciones…", "Cargando miembros…"]);
    const [invites, members] = [...ui.doc.querySelectorAll(".skeleton-rows")];
    assertRows(invites.parentElement!, "Cargando invitaciones…", "Invitaciones de esta institución", ["Persona", "Activación", "Correo", "Acciones"]);
    assertRows(members.parentElement!, "Cargando miembros…", "Miembros activos de esta institución", ["Nombre", "Correo", "Permisos institucionales"]);
    assert.doesNotMatch(ui.doc.body.textContent!, generic);
    await ui.settle(() => lists.release());
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-rows"), null);
  } finally { await ui.close(); }
  const member = await mountAccount(h(InstitutionUsers), never, { role: "student" });
  try { assert.equal(member.doc.querySelector(".skeleton, .skeleton-rows, .skeleton-region"), null, "no admin surface before authorization"); }
  finally { await member.close(); }
});

test("401, 403, 404 and 500 leave no placeholders behind", async () => {
  const views: [string, ReactElement, (r: Request) => boolean, string][] = [
    ["sections", h(CourseDetail, { courseId: course.id }), () => true, "teacher"],
    ["section", h(CourseDetail, { courseId: course.id }), r => /\/sections\/[^/]+$/.test(path(r)) || r.url.includes("/enrollments"), "teacher"],
    ["gradebook", h(CourseGradebook, { courseId: course.id }), r => path(r).endsWith("/gradebook"), "ownerTeacher"],
    ["grades", h(StudentGrades, { courseId: course.id }), r => path(r).endsWith("/my-grades"), "student"],
    ["audit", h(CourseAudit, { courseId: course.id }), r => path(r).endsWith("/audit-events"), "owner"],
  ];
  for (const [kind, view, failing, profile] of views) for (const status of [401, 403, 404, 500]) {
    const ui = await mount(view, r => failing(r) ? Response.json({ status }, { status }) : r.url.endsWith("/sections") ? Response.json({ items: [section] }) : records(r), profile);
    try {
      assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region, .skeleton-rows"), null, `${kind} ${status}`);
      assert.doesNotMatch(ui.doc.body.textContent!, /Cargando/, `${kind} ${status}`);
    } finally { await ui.close(); }
  }
  for (const status of [403, 500]) {
    const ui = await mountAccount(h(InstitutionUsers), () => Response.json({ status }, { status }));
    try { assert.equal(ui.doc.querySelector(".skeleton, .skeleton-rows"), null, `users ${status}`); } finally { await ui.close(); }
  }
});
