import type { components } from "../api/schema";
import { ApiResponseError } from "../api/errors.ts";
import { isRecord } from "../auth/validation.ts";
import { isInstitutionSlug } from "../institution-routes.ts";
export type Course = components["schemas"]["Course"];
export type CourseSummary = components["schemas"]["CourseSummary"];
export type Section = components["schemas"]["Section"];
export type Enrollment = components["schemas"]["Enrollment"];
export type UserSummary = components["schemas"]["UserSummary"];
export type Role = components["schemas"]["EnrollmentRole"];
export const roles: Role[] = ["teacher", "assistant", "student"];
export const isId = (v: unknown): v is string => typeof v === "string" && v.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function path(slug: string, ids: Record<string, string> = {}) {
  if (!isInstitutionSlug(slug) || !Object.values(ids).every(isId))
    throw new TypeError("Recurso inválido.");
  return { institutionSlug: slug, ...ids };
}
export class FieldError extends Error {
  constructor(public field: string, message: string) { super(message); }
}
export function text(value: unknown, max: number, field: string): string {
  if (typeof value !== "string" || !value.trim() || [...value.trim()].length > max || value.includes("\0"))
    throw new FieldError(field, `Ingresa entre 1 y ${max} caracteres.`);
  return value.trim();
}
export function capacity(value: string): number | null {
  if (!value.trim())
    return null;
  const n = Number(value);
  if (!/^\d+$/.test(value.trim()) || !Number.isInteger(n) || n < 0 || n > 2147483647)
    throw new FieldError("capacity", "Ingresa un entero entre 0 y 2147483647, o deja vacío.");
  return n;
}
export function changed<T extends object>(next: T, previous: Partial<T>): Partial<T> {
  const result = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== previous[key as keyof T])) as Partial<T>;
  if (!Object.keys(result).length)
    throw new FieldError("form", "No hay cambios para guardar.");
  return result;
}
const date = (v: unknown) => typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));
function validText(v: unknown, max: number) { return typeof v === "string" && !!v.trim() && [...v].length <= max && !v.includes("\0"); }
export function summary(v: unknown): CourseSummary {
  if (!isRecord(v) || !isId(v.id) || !validText(v.code, 32) || !validText(v.name, 200) || !validText(v.term, 16))
    throw new ApiResponseError();
  return v as CourseSummary;
}
export function course(v: unknown, expected?: string): Course {
  summary(v);
  if (!isRecord(v) || !isId(v.createdBy) || !date(v.createdAt) || (expected && v.id !== expected))
    throw new ApiResponseError();
  return v as Course;
}
export function section(v: unknown, courseId: string, expected?: string): Section {
  if (!isRecord(v) || !isId(v.id) || v.courseId !== courseId || !isId(v.courseId) || !validText(v.code, 32) || !date(v.createdAt) ||
    (v.capacity !== null && (typeof v.capacity !== "number" || !Number.isInteger(v.capacity) || v.capacity < 0 || v.capacity > 2147483647)) || (expected && v.id !== expected))
    throw new ApiResponseError();
  return v as Section;
}
export function person(v: unknown): UserSummary {
  if (!isRecord(v) || !isId(v.id) || !validText(v.name, 200) || typeof v.email !== "string" || !v.email.includes("@") || typeof v.active !== "boolean")
    throw new ApiResponseError();
  return v as UserSummary;
}
export function enrollment(v: unknown, sectionId: string): Enrollment {
  if (!isRecord(v) || !isId(v.id) || v.sectionId !== sectionId || !isId(v.sectionId) || !roles.includes(v.role as Role) || typeof v.active !== "boolean" || !date(v.createdAt))
    throw new ApiResponseError();
  person(v.user);
  return v as Enrollment;
}
export function list<T>(v: unknown, parse: (item: unknown) => T): T[] {
  if (!isRecord(v) || !Array.isArray(v.items))
    throw new ApiResponseError();
  const items = v.items.map(parse);
  if (new Set(items.map(item => (item as {
    id: string;
  }).id)).size !== items.length)
    throw new ApiResponseError();
  return items;
}
export const courseList = (v: unknown) => list(v, summary);
export function page<T>(v: unknown, parse: (item: unknown) => T) {
  const items = list(v, parse);
  if (!isRecord(v) || typeof v.hasMore !== "boolean" || (v.nextCursor !== null && (typeof v.nextCursor !== "string" || !v.nextCursor)) || v.hasMore !== (v.nextCursor !== null))
    throw new ApiResponseError();
  return { items, hasMore: v.hasMore, nextCursor: v.nextCursor as string | null };
}
export function pagination(cursor?: string, limit = 20) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor !== undefined && !cursor))
    throw new TypeError("Paginación inválida.");
  return { cursor, limit };
}
