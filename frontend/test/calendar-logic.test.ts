import assert from "node:assert/strict";
import { test } from "node:test";
import { listCalendar, type CalendarEvent } from "../src/lib/api/calendar.ts";
import { createApiClient } from "../src/lib/api/client.ts";
import { ApiResponseError } from "../src/lib/api/errors.ts";
import { addDays, byDay, eventHref, gridRange, markLabel, marks, monthGrid, monthTitle, shiftMonth, todayChile, tone, upcomingDeadlines } from "../src/lib/calendar/calendar.ts";
import { course, id } from "./fixtures/courses.ts";

const base: CalendarEvent = { id: id(70), kind: "assignment", title: "Informe final", course: { id: course.id, code: course.code, name: course.name },
  sectionId: null, status: "published", viewerRole: "student", startsAt: "2026-11-10T12:00:00.000000Z", dueAt: "2026-11-14T02:30:00.000000Z", closesAt: "2026-11-16T15:00:00.000000Z" };

test("month grid starts on Monday, pads neighbour days and covers Chile offsets", () => {
  const weeks = monthGrid("2026-11");
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0][0], "2026-10-26");
  assert.equal(weeks.at(-1)![6], "2026-12-06");
  assert.ok(weeks.every(w => w.length === 7));
  assert.equal(monthGrid("2027-02").length, 4);
  assert.deepEqual(gridRange("2026-11"), { from: "2026-10-25T00:00:00.000Z", to: "2026-12-08T00:00:00.000Z" });
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(monthTitle("2026-11"), "Noviembre 2026");
  assert.equal(todayChile(new Date("2026-11-14T02:30:00Z")), "2026-11-13");
});

test("marks use America/Santiago days, label by kind and skip a close equal to the due date", () => {
  const items = marks([base, { ...base, id: id(71), kind: "quiz", title: "Control 1", startsAt: null, dueAt: null, closesAt: "2026-11-14T02:30:00.000000Z" }]);
  assert.deepEqual(items.map(m => [m.event.title, m.kind, m.day, m.time]), [
    ["Informe final", "start", "2026-11-10", "09:00"],
    ["Control 1", "close", "2026-11-13", "23:30"],
    ["Informe final", "due", "2026-11-13", "23:30"],
    ["Informe final", "close", "2026-11-16", "12:00"],
  ]);
  assert.deepEqual(items.map(markLabel), ["Inicio", "Cierre", "Entrega", "Cierre"]);
  assert.equal(markLabel({ kind: "start", event: { ...base, kind: "quiz" } }), "Apertura");
  assert.equal(byDay(items).get("2026-11-13")?.length, 2);
  assert.equal(marks([{ ...base, closesAt: base.dueAt }]).length, 2);
  assert.equal(eventHref(base), `/courses/${course.id}/assignments/${base.id}`);
  assert.equal(eventHref({ ...base, kind: "quiz" }), `/courses/${course.id}/quizzes/${base.id}`);
  const now = Date.parse("2026-11-12T00:00:00Z");
  assert.deepEqual(items.map(m => tone(m, now)), ["past", "close", "due", "close"]);
  assert.deepEqual(upcomingDeadlines(items, now, 3).map(m => m.key), [`${id(71)}:close`, `${base.id}:due`]);
});

test("calendar client sends the range and rejects responses that break the visibility contract", async () => {
  let body: unknown = { from: "x", to: "y", events: [base] };
  const seen: string[] = [];
  const client = createApiClient({ baseUrl: "https://api.test", getToken: () => "token",
    fetch: async (input: Request) => { seen.push(input.url); return Response.json(body); } } as never);
  assert.deepEqual(await listCalendar(client, "uc", "2026-11-01T00:00:00.000Z", "2026-12-01T00:00:00.000Z"), [base]);
  assert.match(seen[0], /\/institution\/uc\/calendar\?from=2026-11-01T00%3A00%3A00\.000Z&to=2026-12-01T00%3A00%3A00\.000Z$/);
  for (const broken of [{ ...base, status: "draft" }, { ...base, kind: "quiz" }, { ...base, dueAt: "mañana" }, { ...base, course: null }]) {
    body = { events: [broken] };
    await assert.rejects(listCalendar(client, "uc", "a", "b"), ApiResponseError);
  }
  body = { events: [{ ...base, status: "draft", viewerRole: "teacher" }] };
  assert.equal((await listCalendar(client, "uc", "a", "b"))[0].status, "draft");
});
