import { isInstitutionSlug } from "../institution-routes.ts";

const defaults = {
  "https://uc.academix.dvillasc.me": "uc",
  "https://utfsm.academix.dvillasc.me": "utfsm",
};

/** Public build configuration only. Invalid configuration must never select a default. */
export function institutionOrigins(): Readonly<Record<string, string>> {
  const configured = process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;
  if (configured === undefined) return defaults;
  try {
    const value: unknown = JSON.parse(configured);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const entries = Object.entries(value);
    if (!entries.length || new Set(entries.map(([, slug]) => slug)).size !== entries.length) return {};
    for (const [origin, slug] of entries) {
      const url = new URL(origin);
      const local = url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
        url.hostname === "127.0.0.1" || url.hostname === "[::1]";
      if (url.origin !== origin || url.username || url.password ||
          !(url.protocol === "https:" || (url.protocol === "http:" && local)) ||
          typeof slug !== "string" || !isInstitutionSlug(slug)) return {};
    }
    return value as Record<string, string>;
  } catch { return {}; }
}
