import { isInstitutionSlug } from "../institution-routes.ts";
import { DEFAULT_PORTAL_ORIGIN, isFrontendOrigin, portalOrigin } from "./portal-origin.ts";

const defaults = {
  "https://uc.academix.dvillasc.me": "uc",
  "https://utfsm.academix.dvillasc.me": "utfsm",
};

/** Public build configuration only. Invalid configuration must never select a default. */
export function institutionOrigins(): Readonly<Record<string, string>> {
  const configured = process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;
  try {
    const value: unknown = configured === undefined ? defaults : JSON.parse(configured);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const entries = Object.entries(value);
    if (!entries.length || new Set(entries.map(([, slug]) => slug)).size !== entries.length) return {};
    for (const [origin, slug] of entries) {
      const url = new URL(origin);
      if (!isFrontendOrigin(origin) || origin === portalOrigin() || origin === DEFAULT_PORTAL_ORIGIN ||
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
          typeof slug !== "string" || !isInstitutionSlug(slug)) return {};
    }
    return value as Record<string, string>;
  } catch { return {}; }
}
