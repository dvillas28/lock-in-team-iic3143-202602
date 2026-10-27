"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hostInstitution, safeReturnPath } from "../../lib/auth/navigation.ts";
import { InstitutionShell } from "../institutions/institution-shell.tsx";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { useSession } from "./session-provider.tsx";
import { SessionActions } from "./session-actions.tsx";
import { watchContextAccess } from "../../lib/auth/context-events.ts";
import { InstitutionAccessNotice } from "./institution-access-notice.tsx";

export function ProtectedInstitution({ slug: legacySlug, children }: Readonly<{ slug?: string; children?: ReactNode }>) {
  const { session, state, origin } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/courses";
  const returnPath = useRef(pathname);
  useEffect(() => { returnPath.current = pathname; }, [pathname]);
  const slug = origin ? hostInstitution(origin).slug : undefined;
  const validHost = !!slug && (!legacySlug || legacySlug === slug);
  useEffect(() => {
    if (!origin || !validHost || !slug) return;
    if (legacySlug) { router.replace("/courses"); return; }
    if (state.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(safeReturnPath(returnPath.current))}`); return;
    }
    if (state.status !== "authenticated" || !validHost) return;
    void session.loadContext(slug);
    const stop = watchContextAccess(session, slug, window, document);
    return () => { stop(); session.clearContext(); };
  }, [origin, validHost, state.status, state.generation, slug, legacySlug, session, router]);
  if (origin && !validHost) return <main className="content auth-content">{state.status === "authenticated" && <SessionActions />}<InstitutionAccessNotice allowRecovery={state.status !== "authenticated"} /></main>;
  if (legacySlug || state.status !== "authenticated") return <main className="content"><LoadingState /></main>;
  const context = state.context?.slug === slug ? state.context : undefined;
  if (context?.error) return <main className="content"><SessionActions /><ErrorState feedback={context.error} onRetry={() => void session.loadContext(slug!)} /></main>;
  if (!validHost || !slug || !context?.user) return <main className="content"><LoadingState /></main>;
  return <InstitutionShell key={`${state.generation}:${slug}`} pathname={pathname} institutionSlug={slug} institutionName={context.user.institutionMembership.institution.name} user={context.user} actions={<SessionActions />}>
    {state.contextWarning && <div className="notice" role="alert">
      <p>No se pudo verificar tu acceso. Puedes consultar el contenido; confirma la conexión antes de guardar cambios.</p>
      <button type="button" className="btn btn-ghost" onClick={() => void session.loadContext(slug)}>Verificar acceso</button>
    </div>}
    <fieldset className="access-boundary" disabled={!!state.contextWarning}>{children}</fieldset>
  </InstitutionShell>;
}
