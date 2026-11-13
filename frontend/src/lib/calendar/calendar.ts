import type { CalendarEvent } from "../api/calendar.ts";
import type { CurrentUser } from "../auth/validation.ts";
import { localChile } from "../assignments/dates.ts";

export type MarkKind = "start" | "due" | "close";
export type Mark = Readonly<{ key: string; event: CalendarEvent; kind: MarkKind; at: string; day: string; time: string }>;
export type Tone = "start" | "due" | "close" | "past";

const dayMs = 86400000;
const utcDay = (day: string) => new Date(`${day}T00:00:00Z`);
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (day: string, days: number) => isoDay(new Date(utcDay(day).getTime() + days * dayMs));
export const todayChile = (now = new Date()) => localChile(now.toISOString()).slice(0, 10);
export const monthOf = (day: string) => day.slice(0, 7);

export function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split("-").map(Number);
  return isoDay(new Date(Date.UTC(year, index - 1 + delta, 1))).slice(0, 7);
}

/** Weeks of the month view, Monday first, padded with neighbouring days. */
export function monthGrid(month: string) {
  const first = utcDay(`${month}-01`);
  const start = addDays(`${month}-01`, -((first.getUTCDay() + 6) % 7));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const count = Math.ceil(((last.getTime() - utcDay(start).getTime()) / dayMs + 1) / 7);
  return Array.from({ length: count }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}

/** UTC bounds that cover every visible day of the grid in America/Santiago (UTC−3/−4). */
export function gridRange(month: string) {
  const weeks = monthGrid(month);
  return { from: `${addDays(weeks[0][0], -1)}T00:00:00.000Z`, to: `${addDays(weeks.at(-1)![6], 2)}T00:00:00.000Z` };
}

export function marks(events: readonly CalendarEvent[]): Mark[] {
  return events.flatMap(event => {
    const items: [MarkKind, string | null][] = [["start", event.startsAt], ["due", event.dueAt],
      ["close", event.closesAt !== null && event.closesAt === event.dueAt ? null : event.closesAt]];
    return items.filter((item): item is [MarkKind, string] => item[1] !== null).map(([kind, at]) => {
      const wall = localChile(at);
      return { key: `${event.id}:${kind}`, event, kind, at, day: wall.slice(0, 10), time: wall.slice(11, 16) };
    });
  }).sort((a, b) => a.at.localeCompare(b.at) || a.event.title.localeCompare(b.event.title, "es"));
}

export function byDay(items: readonly Mark[]) {
  const days = new Map<string, Mark[]>();
  for (const item of items) days.set(item.day, [...(days.get(item.day) ?? []), item]);
  return days;
}

export function markLabel(mark: Pick<Mark, "kind" | "event">) {
  if (mark.kind === "due") return "Entrega";
  if (mark.kind === "close") return "Cierre";
  return mark.event.kind === "quiz" ? "Apertura" : "Inicio";
}

export const kindLabel = (event: CalendarEvent) => event.kind === "quiz" ? "Quiz" : "Tarea";

export function tone(mark: Mark, now = Date.now()): Tone {
  return Date.parse(mark.at) < now ? "past" : mark.kind;
}

export function eventHref(event: CalendarEvent) {
  return `/courses/${event.course.id}/${event.kind === "quiz" ? "quizzes" : "assignments"}/${event.id}`;
}

/** Deadlines (delivery or closing) still ahead within the next `days`. */
export function upcomingDeadlines(items: readonly Mark[], now = Date.now(), days = 7) {
  return items.filter(m => m.kind !== "start" && Date.parse(m.at) >= now && Date.parse(m.at) < now + days * dayMs);
}

const monthName = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" });
const dayName = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const monthTitle = (month: string) => capital(monthName.format(utcDay(`${month}-01`)).replace(" de ", " "));
export const dayTitle = (day: string) => capital(dayName.format(utcDay(day)));
export const weekdays = [["L", "lunes"], ["M", "martes"], ["M", "miércoles"], ["J", "jueves"], ["V", "viernes"], ["S", "sábado"], ["D", "domingo"]] as const;

/** Deadlines exist only where the user teaches or studies; the full view replaces the floating button. */
export const showsCalendarButton = (user: CurrentUser, pathname: string) =>
  pathname !== "/calendar" && user.sectionMemberships.some(m => m.role === "teacher" || m.role === "student");
