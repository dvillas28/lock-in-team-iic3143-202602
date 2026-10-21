"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { matchesHost } from "../../lib/auth/navigation.ts";
import { institutionHomePath } from "../../lib/institution-routes.ts";
import { InstitutionShell } from "../institutions/institution-shell.tsx";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { useSession } from "./session-provider.tsx";
import { SessionActions } from "./session-actions.tsx";

export function ProtectedInstitution({ slug, children }: Readonly<{ slug: string; children?: ReactNode }>) {
  const { session, state, hostname } = useSession();
  const router = useRouter();
  const validHost = !!hostname && matchesHost(hostname, slug);
  useEffect(() => {
    if (!hostname) return;
    if (state.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(institutionHomePath(slug))}`); return;
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
  }, [hostname, validHost, state.status, state.generation, slug, session, router]);
  if (hostname && !validHost) return <main className="content">{state.status === "authenticated" && <SessionActions />}<ErrorState feedback={{ title: "Contexto institucional inválido", message: "Abre la institución desde el selector de instituciones.", retryable: false }} /></main>;
  if (state.status !== "authenticated") return <main className="content"><LoadingState /></main>;
  const context = state.context?.slug === slug ? state.context : undefined;
  if (context?.error) return <main className="content"><SessionActions /><ErrorState feedback={context.error} onRetry={() => void session.loadContext(slug)} /></main>;
  if (!validHost || !context?.user) return <main className="content"><LoadingState /></main>;
  return <InstitutionShell key={`${state.generation}:${slug}`} institutionSlug={slug} institutionName={context.user.institutionMembership.institution.name} actions={<SessionActions />}>
    <p className="hint">{context.user.name} · {context.user.email}</p>{children}
  </InstitutionShell>;
}
