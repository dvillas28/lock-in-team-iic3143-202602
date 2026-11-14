import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { InstitutionShell } from "../src/components/institutions/institution-shell.tsx";
import { CalendarFab } from "../src/components/calendar/calendar-fab.tsx";
import { CalendarPage } from "../src/components/calendar/calendar-page.tsx";
import type { CalendarEvent } from "../src/lib/api/calendar.ts";
import { localChile } from "../src/lib/assignments/dates.ts";
import { showsCalendarButton } from "../src/lib/calendar/calendar.ts";
import { course, id, otherCourse, user } from "./fixtures/courses.ts";
import { mount } from "./fixtures/course-ui.ts";

const soon = new Date(Date.now() + 3 * 3600000).toISOString();
const day = localChile(soon).slice(0, 10);
const event = (n: number, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({ id: id(n), kind: "assignment", title: `Tarea ${n}`,
  course: { id: course.id, code: course.code, name: course.name }, sectionId: null, status: "published", viewerRole: "student",
  startsAt: null, dueAt: soon, closesAt: null, ...extra });
const events = [event(70), event(71, { kind: "quiz", title: "Control 1", dueAt: null, closesAt: soon,
  course: { id: otherCourse.id, code: otherCourse.code, name: otherCourse.name } })];
const reply = (r: Request) => new URL(r.url).pathname.endsWith("/calendar") ? Response.json({ from: "", to: "", events })
  : new URL(r.url).pathname.endsWith("/courses") ? Response.json({ items: [{ ...course }, { ...otherCourse }] }) : Response.json({});

async function selectDeadlineDay(ui: Awaited<ReturnType<typeof mount>>, root: ParentNode) {
  const selector = `button[data-day="${day}"]`;
  let target = root.querySelector<HTMLButtonElement>(selector);
  if (!target) {
    const first = root.querySelector<HTMLButtonElement>("button[data-day]")?.dataset.day;
    assert.ok(first);
    const direction = day < first ? "anterior" : "siguiente";
    const navigation = root.querySelector<HTMLButtonElement>(`button[aria-label^="Mes ${direction}"]`);
    assert.ok(navigation);
    await ui.settle(() => navigation.click());
    target = root.querySelector<HTMLButtonElement>(selector);
  }
  assert.ok(target);
  // JSDOM no enfoca automáticamente el botón al hacer click, a diferencia del navegador.
  await ui.settle(() => { target.focus(); target.click(); });
  return target;
}

function withFrames<T>(run: () => Promise<T>) {
  const previous = [globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame] as const;
  globalThis.requestAnimationFrame = callback => { callback(0); return 0; };
  globalThis.cancelAnimationFrame = () => undefined;
  return run().finally(() => { [globalThis.requestAnimationFrame, globalThis.cancelAnimationFrame] = previous; });
}

test("calendar FAB shows upcoming deadlines, opens a keyboard mini calendar and returns focus on Escape", () => withFrames(async () => {
  const ui = await mount(h(CalendarFab, { slug: "uc" }), reply, "student");
  try {
    const fab = ui.doc.querySelector<HTMLButtonElement>(".calendar-fab")!;
    assert.equal(fab.getAttribute("aria-expanded"), "false");
    assert.equal(ui.doc.querySelector(".calendar-fab-badge")?.textContent, "2");
    assert.match(fab.getAttribute("aria-label")!, /Abrir calendario, 2 plazos en los próximos 7 días/);
    await ui.settle(() => fab.click());
    const dialog = ui.doc.querySelector('[role="dialog"]')!;
    assert.equal(fab.getAttribute("aria-expanded"), "true");
    assert.equal(dialog.querySelector(".calendar-grid")?.getAttribute("role"), "grid");
    assert.equal(dialog.querySelector('a[aria-label="Expandir a calendario completo"]')?.getAttribute("href"), "/calendar");
    const target = await selectDeadlineDay(ui, dialog);
    assert.match(target.getAttribute("aria-label")!, /2 plazos/);
    const links = [...dialog.querySelectorAll<HTMLAnchorElement>(".calendar-agenda-link")];
    assert.deepEqual(links.map(a => a.textContent).sort(), ["Control 1", "Tarea 70"]);
    assert.ok(links.some(a => a.getAttribute("href") === `/courses/${course.id}/assignments/${id(70)}`));
    assert.match(dialog.querySelector(".calendar-agenda")!.textContent!, /Entrega.*Tarea · IIC3143|Cierre.*Quiz · MAT/);
    const focused = ui.doc.activeElement as HTMLButtonElement;
    assert.equal(focused.dataset.day, day);
    await ui.settle(() => focused.dispatchEvent(new ui.dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true })));
    assert.equal((ui.doc.activeElement as HTMLButtonElement).tabIndex, 0);
    assert.notEqual((ui.doc.activeElement as HTMLButtonElement).dataset.day, day);
    await ui.settle(() => ui.doc.activeElement!.dispatchEvent(new ui.dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
    assert.equal(ui.doc.querySelector('[role="dialog"]'), null);
    assert.equal(ui.doc.activeElement, fab);
    assert.ok(ui.requests.some(r => /\/calendar\?from=.*&to=/.test(r.url)));
  } finally { await ui.close(); }
}));

test("calendar page filters by type and course and lists the selected day", () => withFrames(async () => {
  const ui = await mount(h(CalendarPage), reply, "multi");
  try {
    assert.equal(ui.doc.querySelector("h1")?.textContent, "Calendario");
    await selectDeadlineDay(ui, ui.doc);
    const titles = () => [...ui.doc.querySelectorAll(".calendar-side .calendar-agenda-link")].map(a => a.textContent).sort();
    assert.deepEqual(titles(), ["Control 1", "Tarea 70"]);
    await ui.click("Quizzes");
    assert.deepEqual(titles(), ["Control 1"]);
    assert.equal(ui.doc.querySelector('.tab-btn[aria-pressed="true"]')?.textContent, "Quizzes");
    await ui.click("Todo");
    await ui.select(".calendar-course-filter select", course.id);
    assert.deepEqual(titles(), ["Tarea 70"]);
    assert.ok([...ui.doc.querySelectorAll(".calendar-course-filter option")].some(o => o.textContent === "IIC3143 · Desarrollo de software"));
  } finally { await ui.close(); }
}));

test("the floating calendar appears only for teachers and students, outside the full view", async () => {
  for (const [profile, visible] of [["student", true], ["teacher", true], ["multi", true], ["assistant", false], ["owner", false]] as const) {
    assert.equal(showsCalendarButton(user(profile), "/courses"), visible, profile);
  }
  assert.equal(showsCalendarButton(user("student"), "/calendar"), false);
  const ui = await mount(h(InstitutionShell, { institutionSlug: "uc", user: user("student"), pathname: "/calendar", floating: h("button", { className: "calendar-fab" }) }, h("p", null, "Contenido")), reply, "student");
  try {
    assert.ok(ui.doc.querySelector(".app.has-floating > .calendar-fab"));
    assert.equal(ui.doc.querySelector(".crumb-active")?.textContent, "Calendario");
    assert.equal(ui.doc.querySelector('.sidebar-nav a[href="/calendar"]')?.getAttribute("aria-current"), "page");
  } finally { await ui.close(); }
  const assistant = await mount(h(InstitutionShell, { institutionSlug: "uc", user: user("assistant"), pathname: "/courses" }), reply, "assistant");
  try { assert.equal(assistant.doc.querySelector('.sidebar-nav a[href="/calendar"]'), null); } finally { await assistant.close(); }
});
