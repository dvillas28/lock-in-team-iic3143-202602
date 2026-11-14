"use client";
import { useMemo, useState } from "react";
import { listCalendar, type CalendarEvent } from "../../lib/api/calendar.ts";
import type { Session } from "../../lib/auth/session.ts";
import { byDay, gridRange, marks, monthOf, todayChile } from "../../lib/calendar/calendar.ts";
import { useResource } from "../courses/use-resource.ts";

export type CalendarFilter = Readonly<{ kind: "all" | CalendarEvent["kind"]; course: string }>;

/** Month navigation, selection and data for one institution's calendar. */
export function useCalendar(session: Session, slug: string, filter: CalendarFilter = { kind: "all", course: "" }) {
  const [now] = useState(() => Date.now());
  const [today] = useState(() => todayChile(new Date(now)));
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => monthOf(today));
  const range = gridRange(month);
  const result = useResource(session, `${slug}:calendar:${month}`, client => listCalendar(client, slug, range.from, range.to));
  const events = result.data;
  const visible = useMemo(() => (events ?? []).filter(e =>
    (filter.kind === "all" || e.kind === filter.kind) && (!filter.course || e.course.id === filter.course)), [events, filter.kind, filter.course]);
  const days = useMemo(() => byDay(marks(visible)), [visible]);
  function select(day: string) {
    setSelected(day);
    if (monthOf(day) !== month) setMonth(monthOf(day));
  }
  function showMonth(next: string) {
    setMonth(next);
    setSelected(next === monthOf(today) ? today : `${next}-01`);
  }
  return { now, today, month, selected, select, showMonth, goToday: () => showMonth(monthOf(today)), result, events, days };
}
