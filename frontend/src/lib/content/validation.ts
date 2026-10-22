import type { components } from "../api/schema";
import { ApiResponseError } from "../api/errors.ts";
import { isRecord } from "../auth/validation.ts";
import { FieldError, isId, text, list } from "../courses/validation.ts";
export type CourseModule = components["schemas"]["CourseModule"];
export type Material = components["schemas"]["MarkdownMaterial"];
export const title = (value: unknown) => text(value, 200, "title");
export function markdown(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.includes("\0") || [...value].length > 10000)
    throw new FieldError("markdownBody", "Ingresa contenido no blanco, sin NUL, hasta 10000 caracteres.");
  return value;
}
export function jsonBody<T extends object>(body: T): T {
  if (new TextEncoder().encode(JSON.stringify(body)).length > 4096)
    throw new FieldError("form", "El JSON completo supera 4096 bytes UTF-8; reduce el contenido.");
  return body;
}
const date = (v: unknown) => v === null || (typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v)));
const validTitle = (v: unknown) => typeof v === "string" && !!v && v === v.trim() && [...v].length <= 200 && !v.includes("\0");
export function moduleDto(v: unknown, courseId: string, expected?: string): CourseModule {
  if (!isRecord(v) || !isId(v.id) || !isId(v.courseId) || v.courseId !== courseId || (expected !== undefined && v.id !== expected) ||
      !validTitle(v.title) || !Number.isInteger(v.position) || (v.position as number) < 1 || (v.position as number) > 2147483647 || !date(v.publishedAt)) throw new ApiResponseError();
  return v as CourseModule;
}
export function materialDto(v: unknown, moduleId: string, expected?: string): Material {
  if (!isRecord(v) || !isId(v.id) || !isId(v.moduleId) || v.moduleId !== moduleId || (expected !== undefined && v.id !== expected) ||
      !validTitle(v.title) || v.kind !== "markdown" || !isId(v.createdBy) || !date(v.publishedAt)) throw new ApiResponseError();
  try { markdown(v.markdownBody); } catch { throw new ApiResponseError(); }
  return v as Material;
}
export function moduleList(v: unknown, courseId: string) {
  const items = list(v, item => moduleDto(item, courseId));
  if (new Set(items.map(m => m.position)).size !== items.length) throw new ApiResponseError();
  return items.sort((a,b) => a.position-b.position);
}
export const materialList = (v: unknown, moduleId: string) => list(v, item => materialDto(item, moduleId));
export function nextPosition(items: CourseModule[]) {
  const n = items.reduce((max, m) => Math.max(max, m.position), 0) + 1;
  if (n > 2147483647) throw new FieldError("form", "No hay posición disponible. Reordena y consulta antes de crear.");
  return n;
}
