import type { ApiClient } from "./client.ts";
import type { components } from "./schema";
import { path, pagination, page, enrollment, person, roles, isId, text } from "../courses/validation.ts";
export type EnrollmentStatus = "active" | "historical";
/** Without `status` the roster mixes active and revoked enrollments; with it, each view paginates on its own. */
export async function listSectionEnrollments(client: ApiClient, slug: string, sectionId: string, cursor?: string, limit = 20, status?: EnrollmentStatus, userId?: string) {
  if (userId !== undefined && !isId(userId)) throw new TypeError("Persona inválida.");
  const result = await client.GET("/api/v1/institution/{institutionSlug}/sections/{sectionId}/enrollments", { params: { path: { ...path(slug, { sectionId }), sectionId }, query: { ...pagination(cursor, limit), ...(status ? { status } : {}), ...(userId ? { userId } : {}) } } });
  return page(result.data, v => enrollment(v, sectionId));
}
export async function createSectionEnrollment(client: ApiClient, slug: string, sectionId: string, body: components["schemas"]["EnrollmentCreate"]) {
  return (await assignSectionEnrollment(client, slug, sectionId, body)).item;
}
/** Like `createSectionEnrollment`, plus whether it was new (201) or the role was already active (200, same ID). */
export async function assignSectionEnrollment(client: ApiClient, slug: string, sectionId: string, body: components["schemas"]["EnrollmentCreate"]) {
  if (!isId(body.userId) || !roles.includes(body.role))
    throw new TypeError("Persona o rol inválido.");
  const result = await client.POST("/api/v1/institution/{institutionSlug}/sections/{sectionId}/enrollments", { params: { path: { ...path(slug, { sectionId }), sectionId } }, body: { userId: body.userId, role: body.role } });
  return { item: enrollment(result.data, sectionId), created: result.response.status === 201 };
}
export async function updateSectionEnrollment(client: ApiClient, slug: string, sectionId: string, enrollmentId: string, body: components["schemas"]["EnrollmentUpdate"]) {
  if (Object.keys(body).length !== 1 || !(body.role !== undefined && roles.includes(body.role) || typeof body.active === 'boolean'))
    throw new TypeError("Envía exactamente rol o estado.");
  const result = await client.PATCH("/api/v1/institution/{institutionSlug}/sections/{sectionId}/enrollments/{enrollmentId}", { params: { path: { ...path(slug, { sectionId, enrollmentId }), sectionId, enrollmentId } }, body });
  return enrollment(result.data, sectionId);
}
export async function searchInstitutionUsers(client: ApiClient, slug: string, search: string, cursor?: string, limit = 20) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/users", { params: { path: path(slug), query: { search: text(search, 2147483647, "search"), ...pagination(cursor, limit) } } });
  return page(result.data, person);
}
