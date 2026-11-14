import type { ApiClient } from "./client.ts";
import type { components } from "./schema";
import { ApiResponseError } from "./errors.ts";
import { isId, path } from "../courses/validation.ts";
import { isRecord } from "../auth/validation.ts";

export type CalendarEvent = components["schemas"]["CalendarEvent"];

const instant = (v: unknown) => v === null || (typeof v === "string" && v.endsWith("Z") && Number.isFinite(Date.parse(v)));

function event(value: unknown): CalendarEvent {
  if (!isRecord(value) || !isId(value.id) || !["quiz","assignment"].includes(String(value.kind)) ||
      typeof value.title !== "string" || !isRecord(value.course) || !isId(value.course.id) ||
      typeof value.course.code !== "string" || typeof value.course.name !== "string" ||
      (value.sectionId !== null && !isId(value.sectionId)) ||
      !["draft","published","hidden"].includes(String(value.status)) ||
      !["teacher","student"].includes(String(value.viewerRole)) ||
      // Students only ever receive published work; anything else is a contract violation.
      (value.viewerRole === "student" && value.status !== "published") ||
      ![value.startsAt,value.dueAt,value.closesAt].every(instant) ||
      (value.kind === "quiz" && value.dueAt !== null)) {
    throw new ApiResponseError();
  }
  return value as CalendarEvent;
}

export async function listCalendar(client: ApiClient, slug: string, from: string, to: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/calendar", {
    params: { path: path(slug), query: { from, to } },
  });
  const data: unknown = result.data;
  if (!isRecord(data) || !Array.isArray(data.events)) throw new ApiResponseError();
  return data.events.map(event);
}
