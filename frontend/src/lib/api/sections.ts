import type { ApiClient } from "./client.ts";
import { path, section, list } from "../courses/validation.ts";
export async function listSections(client: ApiClient, slug: string, courseId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/courses/{courseId}/sections", { params: { path: { ...path(slug, { courseId }), courseId } } });
  return list(result.data, v => section(v, courseId));
}
export async function getSection(client: ApiClient, slug: string, sectionId: string, courseId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/sections/{sectionId}", { params: { path: { ...path(slug, { sectionId, courseId }), sectionId } } });
  return section(result.data, courseId, sectionId);
}
import type { components } from "./schema";
export async function createSection(client: ApiClient, slug: string, courseId: string, body: components["schemas"]["SectionCreate"]) {
  const result = await client.POST("/api/v1/institution/{institutionSlug}/courses/{courseId}/sections", { params: { path: { ...path(slug, { courseId }), courseId } }, body });
  return section(result.data, courseId);
}
export async function updateSection(client: ApiClient, slug: string, sectionId: string, courseId: string, body: components["schemas"]["SectionUpdate"]) {
  if (!Object.keys(body).length)
    throw new TypeError("No hay cambios.");
  const result = await client.PATCH("/api/v1/institution/{institutionSlug}/sections/{sectionId}", { params: { path: { ...path(slug, { sectionId }), sectionId } }, body });
  return section(result.data, courseId, sectionId);
}
