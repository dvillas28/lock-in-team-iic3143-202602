import { institutionHomePath, isInstitutionSlug } from "../institution-routes.ts";

/** Only destinations implemented by this issue; no arbitrary next/redirect URL. */
export function safeReturnPath(value: string | null): string {
  if (value === "/institutions") return value;
  const match = value?.match(/^\/institutions\/([a-z0-9-]+)$/);
  return match && isInstitutionSlug(match[1]) ? institutionHomePath(match[1]) : "/institutions";
}

/** Host is a visual hint. Membership is always checked by /me on the API. */
export function hostInstitution(hostname: string): { slug?: string; valid: boolean } {
  if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return { valid: true };
  const match = hostname.match(/^([a-z0-9-]+)\.academix\.dvillasc\.me$/);
  return match && isInstitutionSlug(match[1]) ? { valid: true, slug: match[1] } : { valid: false };
}

export function loginDestination(hostname: string, next: string | null): string | undefined {
  const context = hostInstitution(hostname);
  if (!context.valid) return undefined;
  // A subdomain cannot silently open another institution through a manipulated path.
  return context.slug ? institutionHomePath(context.slug) : safeReturnPath(next);
}

export function matchesHost(hostname: string, slug: string): boolean {
  const context = hostInstitution(hostname);
  return context.valid && (!context.slug || context.slug === slug);
}

export function institutionHref(hostname: string, slug: string): string {
  const context = hostInstitution(hostname);
  if (!context.valid || !isInstitutionSlug(slug)) throw new TypeError("Invalid institution context");
  return context.slug && context.slug !== slug
    ? `https://${slug}.academix.dvillasc.me${institutionHomePath(slug)}` : institutionHomePath(slug);
}
