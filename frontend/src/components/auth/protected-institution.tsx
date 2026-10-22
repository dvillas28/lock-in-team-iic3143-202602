"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hostInstitution } from "../../lib/auth/navigation.ts";
import { InstitutionShell } from "../institutions/institution-shell.tsx";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { useSession } from "./session-provider.tsx";
import { SessionActions } from "./session-actions.tsx";

export function ProtectedInstitution({ slug: legacySlug, children }: Readonly<{ slug?: string; children?: ReactNode }>) {
  const { session, state, origin } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/courses";
  const slug = origin ? hostInstitution(origin).slug : undefined;
  const validHost = !!slug && (!legacySlug || legacySlug === slug);
  useEffect(() => {
    if (!origin || !validHost || !slug) return;
    if (legacySlug) { router.replace("/courses"); return; }
    if (state.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent("/courses")}`); return;
    }
    if (state.status !== "authenticated" || !validHost) return;
    const refresh = () => { void session.loadContext(slug); };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("focus", refresh); window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", visible); session.clearContext();
    };
  }, [origin, validHost, state.status, state.generation, slug, legacySlug, session, router]);
  if (origin && !validHost) return <main className="content">{state.status === "authenticated" && <SessionActions />}<ErrorState feedback={{ title: "Contexto institucional inválido", message: "Abre el dominio configurado de tu institución. En desarrollo, usa uc.localhost:3000 o utfsm.localhost:3000 según la configuración.", retryable: false }} /></main>;
  if (legacySlug || state.status !== "authenticated") return <main className="content"><LoadingState /></main>;
  const context = state.context?.slug === slug ? state.context : undefined;
  if (context?.error) return <main className="content"><SessionActions /><ErrorState feedback={context.error} onRetry={() => void session.loadContext(slug!)} /></main>;
  if (!validHost || !slug || !context?.user) return <main className="content"><LoadingState /></main>;
  return <InstitutionShell key={`${state.generation}:${slug}`} pathname={pathname} institutionSlug={slug} institutionName={context.user.institutionMembership.institution.name} actions={<SessionActions />}>
    <p className="hint">{context.user.name} · {context.user.email}</p>{children}
  </InstitutionShell>;
}
