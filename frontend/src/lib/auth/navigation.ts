import { isId } from "../courses/validation.ts";
import { portalOrigin } from "./portal-origin.ts";
import { institutionOrigins } from "./institution-origins.ts";

/** URLSearchParams already decodes once. Accept only implemented routes. */
export function safeReturnPath(value: string | null): string {
  const match = value && /^\/attempts\/([^/]+)$/.exec(value);
  if (match && isId(match[1])) return value!;
  const course = value && /^\/courses\/([^/]+)\/(grades|gradebook|audit|assignments)$/.exec(value);
  if (course && course[0] === value && isId(course[1])) return value!;
  const assignment = value && /^\/courses\/([^/]+)\/assignments\/([^/]+)$/.exec(value);
  if (assignment && assignment[0] === value && isId(assignment[1]) && isId(assignment[2])) return value!;
  const review = value && /^\/courses\/([^/]+)\/quizzes\/([^/]+)\/attempts(?:\/([^/]+))?$/.exec(value);
  if (review && review[0] === value && isId(review[1]) && isId(review[2]) && (review[3] === undefined || isId(review[3]))) return value!;
  return ["/institutions", "/profile", "/profile/security", "/admin/users"].includes(value ?? "") ? value! : "/courses";
}

/** The origin selects a requested context; only backend /me authorizes it. */
export function hostInstitution(origin: string): { slug?: string; valid: boolean } {
  const origins = institutionOrigins();
  const slug = Object.hasOwn(origins, origin) ? origins[origin] : undefined;
  return slug ? { valid: true, slug } : { valid: false };
}

export function loginDestination(origin: string, next: string | null): string | undefined {
  const destination=safeReturnPath(next);
  return hostInstitution(origin).valid || origin===portalOrigin() && ["/profile","/profile/security"].includes(destination) ? destination : undefined;
}

export function matchesHost(origin: string, slug: string): boolean {
  return hostInstitution(origin).slug === slug;
}

export function institutionHref(origin: string, slug: string): string | undefined {
  if (!hostInstitution(origin).valid) return undefined;
  const destination = Object.entries(institutionOrigins()).find(([, institution]) => institution === slug)?.[0];
  return destination ? destination === origin ? "/courses" : `${destination}/courses` : undefined;
}
