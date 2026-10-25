import { publicEntry } from "../../lib/auth/public-entry.ts";
import { portalOrigin } from "../../lib/auth/portal-origin.ts";

/** Recovery is public navigation only; it never selects or authorizes a tenant. */
export function InstitutionAccessNotice({ allowRecovery = true }: Readonly<{ allowRecovery?: boolean }>) {
  const portal = portalOrigin();
  const canChoose = portal && publicEntry(portal).kind === "portal";
  return <section className="card panel stack auth-panel" aria-labelledby="institution-access-title">
    <div className="stack" role="alert">
      <h1 id="institution-access-title" className="serif">Elige tu universidad para continuar</h1>
      <p className="hint">Abre el acceso de tu universidad para iniciar sesión y ver tus cursos.</p>
    </div>
    {allowRecovery && canChoose && <div><a className="btn btn-primary" href={`${portal}/#instituciones`}>Elegir universidad</a></div>}
  </section>;
}
