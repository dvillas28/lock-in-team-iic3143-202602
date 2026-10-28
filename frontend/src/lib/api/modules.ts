import type { ApiClient } from "./client.ts";
import { path } from "../courses/validation.ts";
import { moduleDto, moduleList } from "../content/validation.ts";
export async function listCourseModules(client: ApiClient, slug: string, courseId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/courses/{courseId}/modules", { params: { path: { ...path(slug, { courseId }), courseId } } });
  return moduleList(result.data, courseId);
}
export async function getCourseModule(client: ApiClient, slug: string, moduleId: string, courseId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/modules/{moduleId}", { params: { path: { ...path(slug, { moduleId, courseId }), moduleId } } });
  return moduleDto(result.data, courseId, moduleId);
}
import type { components } from "./schema";
import { ApiResponseError } from "./errors.ts";
import { FieldError, isId } from "../courses/validation.ts";
import { title, jsonBody, type CourseModule } from "../content/validation.ts";
export async function createCourseModule(client: ApiClient, slug: string, courseId: string, input: components["schemas"]["ModuleCreate"]) {
  if (!Number.isInteger(input.position) || input.position < 1 || input.position > 2147483647) throw new FieldError("form", "Posición fuera de rango.");
  const body = jsonBody({ title: title(input.title), position: input.position });
  const result = await client.POST("/api/v1/institution/{institutionSlug}/courses/{courseId}/modules", { params: { path: { ...path(slug, { courseId }), courseId } }, body });
  const saved = moduleDto(result.data, courseId);
  if (saved.publishedAt !== null) throw new ApiResponseError();
  return saved;
}
export async function updateCourseModule(client: ApiClient, slug: string, moduleId: string, courseId: string, input: components["schemas"]["ModuleUpdate"]) {
  const body = jsonBody({ title: title(input.title) });
  const result = await client.PATCH("/api/v1/institution/{institutionSlug}/modules/{moduleId}", { params: { path: { ...path(slug, { moduleId, courseId }), moduleId } }, body });
  return moduleDto(result.data, courseId, moduleId);
}
export async function reorderCourseModules(client: ApiClient, slug: string, courseId: string, moduleIds: string[], existing: CourseModule[]) {
  if (moduleIds.length !== existing.length || new Set(moduleIds).size !== moduleIds.length || moduleIds.some(id => !isId(id) || !existing.some(m => m.id === id && m.courseId === courseId))) throw new FieldError("form", "Incluye todos los módulos, sin duplicados.");
  const result = await client.PUT("/api/v1/institution/{institutionSlug}/courses/{courseId}/modules/order", { params: { path: { ...path(slug, { courseId }), courseId } }, body: jsonBody({ moduleIds }) });
  const items = moduleList(result.data, courseId);
  if (items.length !== moduleIds.length || items.some((m,i) => m.id !== moduleIds[i] || m.position !== i+1)) throw new ApiResponseError();
  return items;
}

export async function setModulePublication(client: ApiClient, slug: string, moduleId: string, courseId: string, published: boolean) {
  const params = { path: { ...path(slug, { moduleId, courseId }), moduleId } };
  const result = published
    ? await client.POST("/api/v1/institution/{institutionSlug}/modules/{moduleId}/publish", { params })
    : await client.POST("/api/v1/institution/{institutionSlug}/modules/{moduleId}/unpublish", { params });
  const saved = moduleDto(result.data, courseId, moduleId);
  if ((saved.publishedAt !== null) !== published) throw new ApiResponseError();
  return saved;
}
