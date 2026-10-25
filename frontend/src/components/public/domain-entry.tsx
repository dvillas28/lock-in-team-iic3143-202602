"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../auth/session-provider.tsx";
import { publicEntry } from "../../lib/auth/public-entry.ts";
import { PublicLanding } from "./public-landing.tsx";
import { InstitutionAccessNotice } from "../auth/institution-access-notice.tsx";

export function DomainEntry() {
  const { origin } = useSession();
  const entry = publicEntry(origin);
  const router = useRouter();
  useEffect(() => {
    if (entry.kind === "institution") router.replace("/login");
  }, [entry.kind, router]);
  if (entry.kind === "portal") return <PublicLanding institutions={entry.institutions} />;
  if (entry.kind === "blocked") return <main className="content auth-content"><InstitutionAccessNotice /></main>;
  return <main className="content auth-content"><p role="status">Preparando acceso…</p></main>;
}
