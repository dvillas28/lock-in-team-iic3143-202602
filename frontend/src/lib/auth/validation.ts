import { ApiResponseError } from "../api/errors.ts";
import type { components } from "../api/schema";
import { isInstitutionSlug } from "../institution-routes.ts";

type Institution = components["schemas"]["InstitutionSummary"];
export type CurrentUser = components["schemas"]["CurrentUser"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);

export function credentials(email: string, password: string) {
  const normalized = email.trim();
  if (normalized.length < 3 || normalized.length > 254 || !/^[\x21-\x7e]+$/.test(normalized) ||
      !/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(normalized)) {
    throw new Error("Ingresa un correo válido, sin espacios interiores.");
  }
  if (!password.length) throw new Error("Ingresa tu contraseña.");
  if (new TextEncoder().encode(password).length > 128) throw new Error("La contraseña es demasiado larga.");
  return { email: normalized.toLowerCase(), password };
}

export function loginToken(value: unknown, now: number) {
  try {
    if (!isRecord(value) || value.tokenType !== "Bearer" || value.expiresIn !== 900 ||
        typeof value.accessToken !== "string" || value.accessToken.length > 4096 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.accessToken)) throw new ApiResponseError();
    const payload: unknown = JSON.parse(atob(value.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!isRecord(payload) || !isId(payload.sub) || payload.iss !== "academix-api" || payload.aud !== "academix-clients" ||
        !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp) ||
        (payload.iat as number) > Math.floor(now / 1000) || (payload.exp as number) * 1000 <= now ||
        (payload.exp as number) - (payload.iat as number) !== 900) throw new ApiResponseError();
    // Decoding sets a conservative client deadline only; the backend verifies the signature.
    return { token: value.accessToken, subject: payload.sub, expiresAt: Math.min(now + 900_000, (payload.exp as number) * 1000) };
  } catch { throw new ApiResponseError(); }
}

function isInstitution(value: unknown): value is Institution {
  return isRecord(value) && isId(value.id) && typeof value.slug === "string" && isInstitutionSlug(value.slug) &&
    typeof value.name === "string" && value.name.trim().length > 0 && value.active === true;
}

export function institutionList(value: unknown): Institution[] {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every(isInstitution) ||
      new Set(value.items.map(i => i.slug)).size !== value.items.length) throw new ApiResponseError();
  return value.items;
}

export function currentUser(value: unknown, slug: string, subject: string): CurrentUser {
  if (!isRecord(value) || value.id !== subject || typeof value.email !== "string" || typeof value.name !== "string" ||
      !isRecord(value.institutionMembership) || !Array.isArray(value.sectionMemberships)) throw new ApiResponseError();
  const membership = value.institutionMembership;
  if (!isId(membership.id) || !isInstitution(membership.institution) || membership.institution.slug !== slug ||
      membership.active !== true || typeof membership.isAdmin !== "boolean" || typeof membership.isSuperAdmin !== "boolean" ||
      !value.sectionMemberships.every(m => isRecord(m) && isId(m.courseId) && isId(m.sectionId) &&
        typeof m.role === "string" && ["teacher", "assistant", "student"].includes(m.role))) throw new ApiResponseError();
  return value as CurrentUser;
}
