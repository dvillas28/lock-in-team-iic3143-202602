"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hostInstitution, institutionHref } from "../../lib/auth/navigation.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { useSession } from "./session-provider.tsx";
import { SessionActions } from "./session-actions.tsx";

export function InstitutionPicker() {
  const { session, state, hostname } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!hostname) return;
    if (state.status === "anonymous") router.replace("/login");
    if (state.status !== "authenticated") return;
    const refresh = () => { void session.loadInstitutions(); };
    refresh(); window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [hostname, state.status, state.generation, session, router]);
  if (hostname && !hostInstitution(hostname).valid) return <main className="content"><p role="alert">Este dominio no está habilitado para AcademiX.</p></main>;
  if (!hostname || state.status !== "authenticated") return <main className="content"><LoadingState /></main>;
  return <main className="content auth-content stack">
    <div className="page-heading"><h1>Tus instituciones</h1><SessionActions /></div>
    {state.directoryError ? <ErrorState feedback={state.directoryError} onRetry={() => void session.loadInstitutions()} /> : !state.institutions ? <LoadingState /> : (
      <section className="card panel stack" aria-label="Instituciones accesibles">
        {state.institutions.length === 0 && <p role="status">Tu cuenta no tiene membresías institucionales activas.</p>}
        {state.institutions.map(institution => <a className="nav-item" key={institution.id} href={institutionHref(hostname, institution.slug)} onClick={event => {
          const href = institutionHref(hostname, institution.slug);
          if (href.startsWith("/")) { event.preventDefault(); session.clearContext(); router.push(href); }
        }}>{institution.name}</a>)}
        <p className="hint">El acceso se verifica al abrir cada institución. Cambiar de subdominio requiere iniciar sesión nuevamente.</p>
      </section>
    )}
  </main>;
}
