import { institutionOrigins } from "./institution-origins.ts";
import { hostInstitution } from "./navigation.ts";
import { portalOrigin } from "./portal-origin.ts";

const institutions = [
  { slug: "uc", name: "Pontificia Universidad Católica de Chile", shortName: "UC" },
  { slug: "utfsm", name: "Universidad Técnica Federico Santa María", shortName: "UTFSM" },
] as const;

export type PublicInstitution = { slug: string; name: string; shortName: string; href: string };
type PublicEntry = { kind: "pending" | "institution" | "blocked" } |
  { kind: "portal"; institutions: PublicInstitution[] };

/** A directory of configured destinations, never the user's memberships or permissions. */
export function publicEntry(origin?: string): PublicEntry {
  if (origin === undefined) return { kind: "pending" };
  if (hostInstitution(origin).valid) return { kind: "institution" };
  if (origin !== portalOrigin()) return { kind: "blocked" };
  const origins = Object.entries(institutionOrigins());
  const directory: PublicInstitution[] = [];
  for (const institution of institutions) {
    const destination = origins.find(([, slug]) => slug === institution.slug)?.[0];
    if (!destination) return { kind: "blocked" };
    directory.push({ ...institution, href: `${destination}/login` });
  }
  return { kind: "portal", institutions: directory };
}
