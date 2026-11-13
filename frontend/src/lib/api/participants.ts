import type { ApiClient } from "./client.ts";
import { ApiResponseError } from "./errors.ts";
import { isRecord } from "../auth/validation.ts";
import { isId, path, roles, type Role } from "../courses/validation.ts";

/** Minimal roster projection: no e-mail, enrollment ids, history or dates ever reach the UI. */
export type SectionParticipant = Readonly<{ userId: string; name: string; roles: readonly Role[] }>;

function participant(v: unknown): SectionParticipant {
  if (!isRecord(v) || !isId(v.userId) || typeof v.name !== "string" || !v.name.trim() || [...v.name].length > 200 || v.name.includes("\0") ||
      !Array.isArray(v.roles) || !v.roles.length || !v.roles.every(r => roles.includes(r as Role)) || new Set(v.roles).size !== v.roles.length)
    throw new ApiResponseError();
  // Copy only the documented fields so an over-sharing response cannot leak extra attributes.
  return { userId: v.userId, name: v.name, roles: [...v.roles] as Role[] };
}

export function participantList(v: unknown): SectionParticipant[] {
  if (!isRecord(v) || !Array.isArray(v.items))
    throw new ApiResponseError();
  const items = v.items.map(participant);
  if (new Set(items.map(p => p.userId)).size !== items.length)
    throw new ApiResponseError();
  return items;
}

/** Read-only roster of one section; the backend authorizes it against active enrollments in the tenant. */
export async function listSectionParticipants(client: ApiClient, slug: string, sectionId: string) {
  const result = await client.GET("/api/v1/institution/{institutionSlug}/sections/{sectionId}/participants", { params: { path: { ...path(slug, { sectionId }), sectionId } } });
  return participantList(result.data);
}
