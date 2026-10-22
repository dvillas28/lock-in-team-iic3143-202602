import type { ApiClient } from "./client.ts";
import { path } from "../courses/validation.ts";
import { materialDto, materialList } from "../content/validation.ts";
export async function listModuleMaterials(client: ApiClient, slug: string, moduleId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/modules/{moduleId}/materials", { params: { path: { ...path(slug, { moduleId }), moduleId } } });
  return materialList(result.data, moduleId);
}
export async function getMaterial(client: ApiClient, slug: string, materialId: string, moduleId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/materials/{materialId}", { params: { path: { ...path(slug, { materialId, moduleId }), materialId } } });
  return materialDto(result.data, moduleId, materialId);
}
import type { components } from "./schema";
import { ApiResponseError } from "./errors.ts";
import { FieldError } from "../courses/validation.ts";
import { title, markdown, jsonBody } from "../content/validation.ts";
export async function createMarkdownMaterial(client: ApiClient, slug: string, moduleId: string, input: components["schemas"]["MarkdownMaterialCreate"]) {
  const body = jsonBody({ title: title(input.title), markdownBody: markdown(input.markdownBody) });
  const result = await client.POST("/api/v1/institution/{institutionSlug}/modules/{moduleId}/materials", { params: { path: { ...path(slug, { moduleId }), moduleId } }, body });
  const saved = materialDto(result.data, moduleId);
  if (saved.publishedAt !== null) throw new ApiResponseError();
  return saved;
}
export async function updateMaterial(client: ApiClient, slug: string, materialId: string, moduleId: string, input: components["schemas"]["MarkdownMaterialUpdate"]) {
  const body = jsonBody({ ...(input.title === undefined ? {} : { title: title(input.title) }), ...(input.markdownBody === undefined ? {} : { markdownBody: markdown(input.markdownBody) }) });
  if (!Object.keys(body).length) throw new FieldError("form", "No hay cambios para guardar.");
  const result = await client.PATCH("/api/v1/institution/{institutionSlug}/materials/{materialId}", { params: { path: { ...path(slug, { materialId, moduleId }), materialId } }, body });
  return materialDto(result.data, moduleId, materialId);
}

export async function setMaterialPublication(client: ApiClient, slug: string, materialId: string, moduleId: string, published: boolean) {
  const params = { path: { ...path(slug, { materialId, moduleId }), materialId } };
  const result = published
    ? await client.POST("/api/v1/institution/{institutionSlug}/materials/{materialId}/publish", { params })
    : await client.POST("/api/v1/institution/{institutionSlug}/materials/{materialId}/unpublish", { params });
  const saved = materialDto(result.data, moduleId, materialId);
  if ((saved.publishedAt !== null) !== published) throw new ApiResponseError();
  return saved;
}
