import { FieldError } from "../courses/validation.ts";

export const chileZone = "America/Santiago";
const wallClock = new Intl.DateTimeFormat("sv-SE", {
  timeZone: chileZone, year:"numeric", month:"2-digit", day:"2-digit",
  hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23",
});
export const localChile = (value?: string | null) =>
  value ? wallClock.format(new Date(value)).replace(" ","T") : "";

const offsetDisplay = new Intl.DateTimeFormat("en", {timeZone:chileZone, timeZoneName:"shortOffset"});

export function chileOffset(value: string) {
  const offset = offsetDisplay.formatToParts(new Date(value)).find(part=>part.type==="timeZoneName")?.value;
  return offset?.replace("GMT","UTC").replace("-","−") ?? "";
}

export const chileDateInput = (isoDate: string) => isoDate.split("-").reverse().join("-");

export function displayChile(value: string, showOffset = false) {
  const wall = localChile(value);
  const text = `${chileDateInput(wall.slice(0,10))}, ${wall.slice(11,16)}`;
  return showOffset ? `${text} (${chileOffset(value)})` : text;
}

// Only the form representation changes. Keep all existing precision when the
// teacher leaves the displayed minute unchanged.
export function chileFormWall(date: string, time: string, field: string, original?: string | null) {
  if (!date && !time) return "";
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) throw new FieldError(field,"Ingresa la fecha en formato dd-MM-aaaa.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new FieldError(`${field}Time`,"Ingresa la hora en formato de 24 horas, por ejemplo 14:30.");
  const wall = `${date.split("-").reverse().join("-")}T${time}`;
  const previous = localChile(original);
  return wall === previous.slice(0,16) ? previous : wall;
}

function seconds(value: string) {
  return value.length === 16 ? value + ":00" : value;
}

// Sample offsets on either side of the date and verify each candidate against
// the wall clock. A DST gap has no candidate and a repeated hour has two.
export function chileCandidates(value: string) {
  const local = seconds(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(local)) return [];
  const wall = Date.parse(local + "Z");
  if (!Number.isFinite(wall) || local.startsWith("0000")) return [];
  const day = 86400000;
  const offsets = new Set([wall-day, wall, wall+day].map(instant =>
    Date.parse(localChile(new Date(instant).toISOString()) + "Z") - instant));
  return Array.from(offsets, offset => new Date(wall - offset).toISOString())
    .filter(instant => localChile(instant) === local).sort((a, b) => a.localeCompare(b, "en"));
}

export function chileInstant(value: string, field: string, original?: string | null, choice?: string) {
  if (!value) return null;
  const candidates = chileCandidates(value);
  if (choice && candidates.includes(choice)) {
    return original && choice.slice(0,19) === original.slice(0,19) ? original : choice;
  }
  if (original && localChile(original) === seconds(value)) return original;
  if (candidates.length === 1) return candidates[0];
  throw new FieldError(field,candidates.length ? "Elige cuál de las dos horas corresponde." :
    "Esta fecha u hora no existe en Santiago. Elige otra hora.");
}

const instant = (value: string) => Date.parse(value)*1000 + Number(value.slice(20,-1).padEnd(6,"0").slice(3) || 0);
export function validateDueAt(dueAt: string | null, previous: string | null | undefined, now: number) {
  if (dueAt && (!previous || instant(dueAt) !== instant(previous)) && instant(dueAt) < now*1000)
    throw new FieldError("dueAt","La fecha de entrega no puede ser anterior a la fecha y hora actual.");
}

type Schedule = {availableFrom: string | null; dueAt: string | null; availableUntil: string | null};

export function assignmentState(value: Schedule, now: number) {
  const clock = now*1000;
  if (value.availableFrom && clock < instant(value.availableFrom)) return "upcoming";
  const close = value.availableUntil ?? value.dueAt;
  if (close && clock > instant(close)) return "closed";
  if (value.dueAt && clock > instant(value.dueAt)) return "late";
  return "open";
}
export function dateBucket(value: Schedule, now: number) {
  const state = assignmentState(value,now);
  if (state === "closed") return "past";
  if (state === "late") return "late";
  return value.dueAt || state === "upcoming" || value.availableUntil ? "upcoming" : "undated";
}
export function validateSchedule(value: Schedule) {
  const opening = value.availableFrom ? instant(value.availableFrom) : null;
  const due = value.dueAt ? instant(value.dueAt) : null;
  const closing = value.availableUntil ? instant(value.availableUntil) : null;
  if (opening !== null && due !== null && opening > due)
    throw new FieldError("availableFrom","La apertura no puede ser posterior a la fecha de entrega.");
  if (due !== null && closing !== null && closing < due)
    throw new FieldError("availableUntil","El cierre no puede ser anterior a la fecha de entrega.");
  if (opening !== null && closing !== null && closing < opening)
    throw new FieldError("availableUntil","El cierre no puede ser anterior a la fecha de apertura.");
}
